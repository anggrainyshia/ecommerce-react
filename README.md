# Totall — e-totall

A full-stack e-commerce web application built to demonstrate modern web development skills. Features a complete shopping experience for customers and a management dashboard for admins.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, TanStack Query, Tailwind CSS |
| Backend | Node.js, Express, Sequelize ORM |
| SQL Database | PostgreSQL 15 |
| NoSQL / Cache | Redis 7 (cart, session TTL) |
| Authentication | JWT (access + refresh tokens), bcrypt |
| Payment | Midtrans Sandbox + Mock fallback |
| Container | Docker + Docker Compose |

---

## Project Structure

```
e-totall/
├── docker-compose.yml          # Orchestrates all 4 services
├── .env.example                # Root environment template
│
├── backend/                    # Node.js REST API
│   ├── src/
│   │   ├── app.js              # Express app setup (middleware, routes)
│   │   ├── server.js           # Entry point (DB connect + listen)
│   │   ├── config/
│   │   │   ├── database.js     # Sequelize / PostgreSQL connection
│   │   │   └── redis.js        # ioredis connection
│   │   ├── models/             # Sequelize models
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── Payment.js
│   │   │   └── index.js        # Associations
│   │   ├── controllers/        # Business logic
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── categoryController.js
│   │   │   ├── cartController.js
│   │   │   ├── orderController.js
│   │   │   └── paymentController.js
│   │   ├── routes/             # Express routers
│   │   │   ├── index.js
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── categories.js
│   │   │   ├── cart.js
│   │   │   ├── orders.js
│   │   │   ├── payments.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   ├── admin.js        # Role guard
│   │   │   ├── validation.js   # express-validator rules
│   │   │   └── upload.js       # Multer image upload
│   │   └── utils/
│   │       └── helpers.js      # Slug, order number, token signing
│   ├── migrations/
│   │   └── 001_init.sql        # Schema + seed data (auto-runs on first boot)
│   ├── uploads/                # Uploaded product images (Docker volume)
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
└── frontend/                   # React SPA
    ├── src/
    │   ├── App.jsx             # Routes definition
    │   ├── main.jsx            # React root
    │   ├── index.css           # Tailwind + global styles
    │   ├── context/
    │   │   ├── AuthContext.jsx # User auth state
    │   │   └── CartContext.jsx # Cart state (fetched from Redis via API)
    │   ├── services/
    │   │   └── api.js          # Axios instance + auto token refresh
    │   ├── components/
    │   │   ├── layout/         # Navbar, Footer, Layout wrapper
    │   │   ├── common/         # ProtectedRoute, AdminRoute, Loading
    │   │   └── product/        # ProductCard
    │   └── pages/
    │       ├── Home.jsx        # Product listing with search & filters
    │       ├── ProductDetail.jsx
    │       ├── Cart.jsx
    │       ├── Checkout.jsx    # Shipping + payment selection
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Profile.jsx     # User profile + order history
    │       ├── OrderSuccess.jsx
    │       └── admin/
    │           ├── Dashboard.jsx
    │           ├── Products.jsx
    │           ├── Categories.jsx
    │           └── Orders.jsx
    ├── Dockerfile
    ├── nginx.conf              # SPA routing + static caching
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Database Design

### Why PostgreSQL + Redis?

**PostgreSQL** handles all relational data that requires integrity constraints, foreign keys, and ACID transactions — users, products, orders, payments.

**Redis** is used for the cart because it is a perfect NoSQL use case: the cart is ephemeral, user-scoped, requires no joins, benefits from sub-millisecond reads/writes, and naturally expires (7-day TTL). No SQL table needed.

### Schema

```
users
  id (UUID PK) | name | email | password | role | phone | address | isActive

categories
  id (UUID PK) | name | description | slug

products
  id (UUID PK) | name | description | price | stock | image | categoryId (FK) | isActive | slug

orders
  id (UUID PK) | userId (FK) | orderNumber | status | totalAmount
               | shippingName | shippingAddress | shippingPhone | notes

order_items
  id (UUID PK) | orderId (FK) | productId (FK) | quantity | price | productName

payments
  id (UUID PK) | orderId (FK) | transactionId | snapToken | paymentMethod
               | status | amount | paidAt | rawResponse

Redis key: cart:{userId}  →  JSON array of cart items (TTL: 7 days)
```

### Order Status Flow

```
pending  →  paid  →  shipped
   └──────→  failed
```

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, get tokens |
| POST | `/api/auth/refresh` | — | Refresh access token |
| GET | `/api/auth/me` | User | Get current user |
| PUT | `/api/auth/profile` | User | Update profile |
| PUT | `/api/auth/change-password` | User | Change password |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | — | List products (search, filter, paginate) |
| GET | `/api/products/:id` | — | Get product detail |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | — | List all categories |
| GET | `/api/categories/:id` | — | Get category + products |

### Cart (Redis-backed)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | User | Get cart |
| POST | `/api/cart/items` | User | Add item |
| PUT | `/api/cart/items/:productId` | User | Update quantity |
| DELETE | `/api/cart/items/:productId` | User | Remove item |
| DELETE | `/api/cart` | User | Clear cart |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | User | Create order (validates stock, clears cart) |
| GET | `/api/orders` | User | My order history |
| GET | `/api/orders/:id` | User | Order detail |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/:orderId/snap-token` | User | Get Midtrans Snap token |
| POST | `/api/payments/:orderId/mock` | User | Mock payment (demo) |
| POST | `/api/payments/webhook` | — | Midtrans webhook handler |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/products` | Admin | All products (incl. inactive) |
| POST | `/api/admin/products` | Admin | Create product + upload image |
| PUT | `/api/admin/products/:id` | Admin | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Soft-delete product |
| POST | `/api/admin/categories` | Admin | Create category |
| PUT | `/api/admin/categories/:id` | Admin | Update category |
| DELETE | `/api/admin/categories/:id` | Admin | Delete category |
| GET | `/api/admin/orders` | Admin | All orders (filter by status) |
| PUT | `/api/admin/orders/:id/status` | Admin | Update order status |

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Make](https://www.gnu.org/software/make/) (optional, but recommended)
- [Node.js 20+](https://nodejs.org/) (for local development only)

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd e-totall

cp .env.example .env
```

Edit `.env` with your values. At minimum you need to set the JWT secrets. For Midtrans, see the [Payment Setup](#payment-setup) section.

### 2. Run with Docker (recommended)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
make up

# Or without Make:
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/health |

The database schema and seed data are applied automatically on first boot.

### 3. Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@etotall.dev` | `Admin@123` |
| User | Register at `/register` | your choice |

> Note: The seed SQL creates the admin with a pre-hashed password. If it does not work, register normally and then manually set `role = 'admin'` in the database.

---

## Local Development (without Docker)

You still need PostgreSQL and Redis running. The easiest way is to start only the infrastructure services:

```bash
make dev-infra          # starts postgres + redis only
make dev-backend        # starts backend with nodemon
make dev-frontend       # starts frontend Vite dev server
```

Or manually:

```bash
# Terminal 1 — infrastructure
docker compose up postgres redis

# Terminal 2 — backend
cd backend
cp .env.example .env    # fill in local values
npm install
npm run dev

# Terminal 3 — frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at http://localhost:3000, backend at http://localhost:5000.

---

## Payment Setup

### Option A: Mock Payment (no setup needed)

On the checkout page, select **Mock Payment**. The order is instantly marked as paid. Perfect for demos.

### Option B: Midtrans Sandbox (free)

1. Sign up at [dashboard.midtrans.com](https://dashboard.midtrans.com) — completely free
2. Go to **Settings → Access Keys**
3. Copy your **Sandbox** Server Key and Client Key
4. Add them to your `.env`:

```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
```

5. For the webhook (payment status callbacks), expose your local backend using [ngrok](https://ngrok.com):

```bash
ngrok http 5000
```

Then in Midtrans dashboard: **Settings → Configuration → Payment Notification URL**:
```
https://<your-ngrok-url>/api/payments/webhook
```

**Sandbox test cards:**

| Card | Number | CVV | Expiry |
|------|--------|-----|--------|
| Visa (success) | `4811 1111 1111 1114` | `123` | Any future date |
| Visa (failure) | `4911 1111 1111 1113` | `123` | Any future date |

---

## Security Features

- **Password hashing** — bcrypt with cost factor 12
- **JWT authentication** — short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **Protected routes** — middleware guards on all user and admin endpoints
- **Admin role guard** — separate middleware, role checked on every admin request
- **Rate limiting** — 200 req/15min globally, 20 req/15min on auth endpoints
- **HTTP security headers** — Helmet.js
- **Input validation** — express-validator on all write endpoints
- **SQL injection prevention** — Sequelize parameterized queries
- **File upload validation** — MIME type whitelist (images only), 5MB size limit
- **CORS** — restricted to configured frontend URL

---

## Environment Variables

### Root `.env` (used by Docker Compose)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `ecommerce` | Database name |
| `POSTGRES_USER` | `postgres` | DB user |
| `POSTGRES_PASSWORD` | `postgres123` | DB password — change in production |
| `REDIS_PASSWORD` | `redis123` | Redis password — change in production |
| `JWT_SECRET` | — | **Required.** Long random string |
| `JWT_REFRESH_SECRET` | — | **Required.** Different long random string |
| `MIDTRANS_SERVER_KEY` | — | Midtrans sandbox server key |
| `MIDTRANS_CLIENT_KEY` | — | Midtrans sandbox client key |
| `VITE_API_URL` | `http://localhost:5000/api` | Frontend API base URL |
| `FRONTEND_URL` | `http://localhost:3000` | Backend CORS + Midtrans callback |

---

## Makefile Commands

```
make help           Show all available commands
make up             Build and start all services
make down           Stop all services
make restart        Restart all services
make logs           Follow logs from all services
make ps             Show running containers

make dev-infra      Start only PostgreSQL + Redis
make dev-backend    Run backend in dev mode (nodemon)
make dev-frontend   Run frontend Vite dev server

make install        Install all npm dependencies
make build          Build frontend for production

make db-shell       Open PostgreSQL interactive shell
make redis-shell    Open Redis CLI
make backend-shell  Open shell inside backend container

make seed           Re-run seed SQL against running database
make clean          Stop containers and remove volumes (DELETES DATA)
make prune          Remove stopped containers and dangling images
```

---

## Features Checklist

### Customer
- [x] Register / Login / Logout
- [x] Browse products with search and category filter
- [x] Sort by newest / price / name
- [x] Product detail page with image and quantity selector
- [x] Add to cart / update quantity / remove item
- [x] Cart persisted in Redis (survives page refresh)
- [x] Checkout with shipping details
- [x] Mock payment (instant)
- [x] Midtrans Sandbox payment (Credit Card, Bank Transfer, e-Wallet)
- [x] Order history with status
- [x] Edit profile

### Admin
- [x] Product CRUD with image upload
- [x] Category CRUD
- [x] View all orders with status filter
- [x] Update order status (pending → paid → shipped)
- [x] Dashboard with stats and recent orders

---

## Contributing

This is a portfolio project. Feel free to fork it and adapt it for your own use.

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make your changes, then commit
git add .
git commit -m "feat: add my feature"
```

---

## License

MIT — free to use for personal or commercial projects.
