# ─────────────────────────────────────────────────────────────
# EveryBit
# ─────────────────────────────────────────────────────────────
# Usage: make <target>
# Run   `make help`  to see all available commands.

COMPOSE       = docker compose
BACKEND_DIR   = backend
FRONTEND_DIR  = frontend

# Detect if .env exists, otherwise use the example
ifneq (,$(wildcard ./.env))
  ENV_FILE = .env
else
  ENV_FILE = .env.example
endif

.DEFAULT_GOAL := help

# ─── Help ─────────────────────────────────────────────────────
.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  EveryBit — Makefile Commands"
	@echo "  ─────────────────────────────────────────────────"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { \
	  printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# ─── Docker Lifecycle ─────────────────────────────────────────
.PHONY: up
up: check-env ## Build images and start all services (detached)
	$(COMPOSE) --env-file $(ENV_FILE) up --build -d
	@echo ""
	@echo "  Services started:"
	@echo "  Frontend  →  http://localhost:3000"
	@echo "  Backend   →  http://localhost:5000/api"
	@echo "  Health    →  http://localhost:5000/health"
	@echo ""
	@echo "  Admin login: admin@everybit.dev / Admin@123"
	@echo ""

.PHONY: up-logs
up-logs: check-env ## Build and start all services, follow logs
	$(COMPOSE) --env-file $(ENV_FILE) up --build

.PHONY: down
down: ## Stop and remove containers (data volumes preserved)
	$(COMPOSE) down

.PHONY: restart
restart: ## Restart all running containers
	$(COMPOSE) restart

.PHONY: stop
stop: ## Stop containers without removing them
	$(COMPOSE) stop

.PHONY: start
start: ## Start already-built containers
	$(COMPOSE) start

# ─── Logs ─────────────────────────────────────────────────────
.PHONY: logs
logs: ## Follow logs from all services
	$(COMPOSE) logs -f

.PHONY: logs-backend
logs-backend: ## Follow backend logs only
	$(COMPOSE) logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Follow frontend logs only
	$(COMPOSE) logs -f frontend

.PHONY: logs-db
logs-db: ## Follow PostgreSQL logs only
	$(COMPOSE) logs -f postgres

.PHONY: logs-redis
logs-redis: ## Follow Redis logs only
	$(COMPOSE) logs -f redis

# ─── Status ───────────────────────────────────────────────────
.PHONY: ps
ps: ## Show status of all containers
	$(COMPOSE) ps

# ─── Local Development (without full Docker) ──────────────────
.PHONY: dev-infra
dev-infra: check-env ## Start only PostgreSQL + Redis (for local dev)
	$(COMPOSE) --env-file $(ENV_FILE) up -d postgres redis
	@echo ""
	@echo "  Infrastructure ready:"
	@echo "  PostgreSQL  →  localhost:5432"
	@echo "  Redis       →  localhost:6379"
	@echo ""

.PHONY: dev-backend
dev-backend: ## Run backend in development mode (nodemon)
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
	  echo "  Copying backend/.env.example → backend/.env"; \
	  cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
	fi
	cd $(BACKEND_DIR) && npm run dev

.PHONY: dev-frontend
dev-frontend: ## Run frontend Vite dev server
	@if [ ! -f $(FRONTEND_DIR)/.env ]; then \
	  echo "  Copying frontend/.env.example → frontend/.env"; \
	  cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env; \
	fi
	cd $(FRONTEND_DIR) && npm run dev

# ─── Dependencies ─────────────────────────────────────────────
.PHONY: install
install: ## Install npm dependencies for both backend and frontend
	@echo "  Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install
	@echo "  Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "  Done."

.PHONY: install-backend
install-backend: ## Install backend npm dependencies only
	cd $(BACKEND_DIR) && npm install

.PHONY: install-frontend
install-frontend: ## Install frontend npm dependencies only
	cd $(FRONTEND_DIR) && npm install

# ─── Build ────────────────────────────────────────────────────
.PHONY: build
build: ## Build frontend production bundle
	cd $(FRONTEND_DIR) && npm run build

.PHONY: build-images
build-images: ## Build Docker images without starting containers
	$(COMPOSE) --env-file $(ENV_FILE) build

# ─── Database ─────────────────────────────────────────────────
.PHONY: db-shell
db-shell: ## Open PostgreSQL interactive shell (psql)
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-ecommerce}

.PHONY: db-dump
db-dump: ## Dump the database to ./backup.sql
	$(COMPOSE) exec postgres pg_dump -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-ecommerce} > backup.sql
	@echo "  Database dumped to backup.sql"

.PHONY: db-restore
db-restore: ## Restore database from ./backup.sql
	@if [ ! -f backup.sql ]; then echo "  Error: backup.sql not found"; exit 1; fi
	$(COMPOSE) exec -T postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-ecommerce} < backup.sql
	@echo "  Database restored from backup.sql"

.PHONY: seed
seed: ## Re-run the seed SQL against the running database
	$(COMPOSE) exec -T postgres psql \
	  -U $${POSTGRES_USER:-postgres} \
	  -d $${POSTGRES_DB:-ecommerce} \
	  < $(BACKEND_DIR)/migrations/001_init.sql
	@echo "  Seed complete."

# ─── Redis ────────────────────────────────────────────────────
.PHONY: redis-shell
redis-shell: ## Open Redis CLI inside the container
	$(COMPOSE) exec redis redis-cli -a $${REDIS_PASSWORD:-redis123}

.PHONY: redis-flush
redis-flush: ## Flush ALL Redis data (clears all carts!)
	@echo "  WARNING: This will delete all cart data."
	@read -p "  Are you sure? [y/N] " ans && [ "$$ans" = "y" ]
	$(COMPOSE) exec redis redis-cli -a $${REDIS_PASSWORD:-redis123} FLUSHALL
	@echo "  Redis flushed."

# ─── Shells ───────────────────────────────────────────────────
.PHONY: backend-shell
backend-shell: ## Open a shell inside the running backend container
	$(COMPOSE) exec backend sh

.PHONY: frontend-shell
frontend-shell: ## Open a shell inside the running frontend container
	$(COMPOSE) exec frontend sh

# ─── Cleanup ──────────────────────────────────────────────────
.PHONY: clean
clean: ## Stop containers and DELETE all volumes (data loss!)
	@echo "  WARNING: This will permanently delete all database and Redis data."
	@read -p "  Are you sure? [y/N] " ans && [ "$$ans" = "y" ]
	$(COMPOSE) down -v
	@echo "  All containers and volumes removed."

.PHONY: prune
prune: ## Remove stopped containers and dangling images
	docker container prune -f
	docker image prune -f
	@echo "  Pruned stopped containers and dangling images."

.PHONY: prune-all
prune-all: ## Full Docker system prune (aggressive cleanup)
	@echo "  WARNING: This removes ALL unused Docker resources system-wide."
	@read -p "  Are you sure? [y/N] " ans && [ "$$ans" = "y" ]
	docker system prune -af
	@echo "  System pruned."

# ─── Environment Setup ────────────────────────────────────────
.PHONY: env-setup
env-setup: ## Copy all .env.example files to .env (won't overwrite existing)
	@if [ ! -f .env ]; then \
	  cp .env.example .env; \
	  echo "  Created .env from .env.example"; \
	else \
	  echo "  .env already exists, skipping root"; \
	fi
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
	  cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
	  echo "  Created backend/.env from backend/.env.example"; \
	else \
	  echo "  backend/.env already exists, skipping"; \
	fi
	@if [ ! -f $(FRONTEND_DIR)/.env ]; then \
	  cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env; \
	  echo "  Created frontend/.env from frontend/.env.example"; \
	else \
	  echo "  frontend/.env already exists, skipping"; \
	fi
	@echo ""
	@echo "  Edit .env and fill in your JWT secrets and Midtrans keys."

# ─── Guards ───────────────────────────────────────────────────
.PHONY: check-env
check-env:
	@if [ ! -f .env ]; then \
	  echo ""; \
	  echo "  .env file not found. Run:"; \
	  echo "    make env-setup"; \
	  echo "  then fill in your secrets before running again."; \
	  echo ""; \
	  exit 1; \
	fi
