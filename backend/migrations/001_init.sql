-- E-Commerce Database Schema
-- Runs automatically on first postgres container startup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    phone       VARCHAR(20),
    address     TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image        VARCHAR(500),
    "categoryId" UUID REFERENCES categories(id) ON DELETE SET NULL,
    "isActive"   BOOLEAN NOT NULL DEFAULT TRUE,
    slug         VARCHAR(220) NOT NULL UNIQUE,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_active   ON products("isActive");

-- ─── Product Variants ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    value       VARCHAR(100) NOT NULL,
    stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants("productId");

-- ─── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId"         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "orderNumber"    VARCHAR(30) NOT NULL UNIQUE,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'paid', 'packed', 'shipped', 'delivered', 'failed')),
    "totalAmount"    NUMERIC(14, 2) NOT NULL,
    "shippingName"   VARCHAR(100) NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "shippingPhone"  VARCHAR(20) NOT NULL,
    "customerEmail"  VARCHAR(150),
    notes            TEXT,
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ─── Order Items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId"     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "productId"   UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    "variantId"   UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    price         NUMERIC(12, 2) NOT NULL,
    "productName" VARCHAR(200) NOT NULL,
    "variantLabel" VARCHAR(100),
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items("productId");

-- ─── Order Tracking ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_tracking (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId"   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL,
    note        TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking("orderId");

-- ─── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId"       UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    "transactionId" VARCHAR(255),
    "snapToken"     TEXT,
    "paymentMethod" VARCHAR(50),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'success', 'failed', 'expired')),
    amount          NUMERIC(14, 2) NOT NULL,
    "paidAt"        TIMESTAMPTZ,
    "rawResponse"   JSONB,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed: Admin User (password: Admin@123) ───────────────────
-- bcrypt hash of "Admin@123" with cost 12
INSERT INTO users (name, email, password, role)
VALUES (
    'Admin',
    'admin@etotall.dev',
    '$2a$12$QRcP7wji04mjltW6hZQK5unvfrPcnX7yEKhl5VDPP4wOl1uVamvFS',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- ─── Seed: Sample Categories ──────────────────────────────────
INSERT INTO categories (name, slug, description) VALUES
    ('Electronics', 'electronics', 'Gadgets, devices, and electronic accessories'),
    ('Clothing', 'clothing', 'Fashion for men, women, and kids'),
    ('Books', 'books', 'Fiction, non-fiction, and educational books'),
    ('Home & Kitchen', 'home-kitchen', 'Furniture, appliances, and kitchen tools'),
    ('Sports', 'sports', 'Sporting goods and outdoor equipment')
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed: Sample Products ────────────────────────────────────
INSERT INTO products (name, description, price, stock, slug, "categoryId")
SELECT
    'Wireless Headphones Pro',
    'Premium noise-cancelling wireless headphones with 30-hour battery life.',
    1299000,
    50,
    'wireless-headphones-pro',
    id
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, stock, slug, "categoryId")
SELECT
    'Smart Watch X1',
    'Fitness tracker with heart rate monitor and sleep tracking.',
    899000,
    30,
    'smart-watch-x1',
    id
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, stock, slug, "categoryId")
SELECT
    'Classic White T-Shirt',
    '100% cotton premium quality t-shirt, available in all sizes.',
    149000,
    100,
    'classic-white-t-shirt',
    id
FROM categories WHERE slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, stock, slug, "categoryId")
SELECT
    'Running Shoes Pro',
    'Lightweight and breathable running shoes for all terrains.',
    699000,
    45,
    'running-shoes-pro',
    id
FROM categories WHERE slug = 'sports'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, stock, slug, "categoryId")
SELECT
    'Clean Code Book',
    'A handbook of agile software craftsmanship by Robert C. Martin.',
    250000,
    25,
    'clean-code-book',
    id
FROM categories WHERE slug = 'books'
ON CONFLICT (slug) DO NOTHING;
