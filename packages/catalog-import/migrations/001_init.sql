-- Catalog import schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('male', 'female', 'unisex', 'unknown');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY,
  parent_id BIGINT REFERENCES categories (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories (parent_id);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  group_key TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  category_id BIGINT REFERENCES categories (id) ON DELETE SET NULL,
  gender gender NOT NULL DEFAULT 'unknown',
  brand TEXT,
  fabric TEXT,
  country TEXT,
  product_kind TEXT,
  feed_shop_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products (gender);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);

CREATE TABLE IF NOT EXISTS product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (product_id, color_name)
);

CREATE INDEX IF NOT EXISTS idx_product_colors_product ON product_colors (product_id);

CREATE TABLE IF NOT EXISTS skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  barcode TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  product_color_id UUID NOT NULL REFERENCES product_colors (id) ON DELETE CASCADE,
  external_offer_id TEXT,
  size_label TEXT,
  price NUMERIC(12, 2) NOT NULL,
  old_price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UAH',
  stock_quantity INT,
  available BOOLEAN NOT NULL DEFAULT true,
  chest_cm INT,
  waist_cm INT,
  hips_cm INT,
  CONSTRAINT skus_price_lte_old CHECK (price <= old_price)
);

CREATE INDEX IF NOT EXISTS idx_skus_product ON skus (product_id);
CREATE INDEX IF NOT EXISTS idx_skus_color ON skus (product_color_id);
CREATE INDEX IF NOT EXISTS idx_skus_available ON skus (available);
