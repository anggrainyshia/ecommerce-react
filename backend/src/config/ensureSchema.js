const sequelize = require('./database');

async function ensureSchema() {
  const queries = [
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
    `
      CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        value VARCHAR(100) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    `
      CREATE TABLE IF NOT EXISTS order_tracking (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        note TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "customerEmail" VARCHAR(150);',
    'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS "variantId" UUID;',
    'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS "variantLabel" VARCHAR(100);',
    'ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;',
    `
      ALTER TABLE orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending', 'paid', 'packed', 'shipped', 'delivered', 'failed'));
    `,
    `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'order_items_variantId_fkey'
        ) THEN
          ALTER TABLE order_items
          ADD CONSTRAINT "order_items_variantId_fkey"
          FOREIGN KEY ("variantId") REFERENCES product_variants(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `,
    'CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants("productId");',
    'CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking("orderId");',
  ];

  for (const query of queries) {
    await sequelize.query(query);
  }
}

module.exports = ensureSchema;
