-- Aromas By Pikin: ejecutar completo en el SQL Editor de Supabase.
-- Reejecutable: respeta las migraciones ya aplicadas y sus checksums.
BEGIN;
SELECT pg_advisory_xact_lock(41872001);
CREATE SCHEMA IF NOT EXISTS aromas;
REVOKE ALL ON SCHEMA aromas FROM PUBLIC;
CREATE TABLE IF NOT EXISTS aromas.schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());

DO $install$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM aromas.schema_migrations WHERE name='001_initial.sql') THEN
 EXECUTE '-- Estructura inicial. No incluye clientes, productos ni pedidos ficticios.
CREATE TABLE aromas.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
  brand text NOT NULL DEFAULT '''',
  description text NOT NULL DEFAULT '''',
  family text NOT NULL DEFAULT '''',
  volume_ml integer CHECK (volume_ml > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE aromas.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
  phone text NOT NULL CHECK (phone ~ ''^\+[1-9][0-9]{7,14}$''),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- El teléfono es un contacto, no una prueba de identidad ni una clave de acceso.
CREATE INDEX customers_phone_idx ON aromas.customers (phone);
CREATE TABLE aromas.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  customer_id uuid REFERENCES aromas.customers(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  fulfillment text NOT NULL CHECK (fulfillment IN (''pickup'', ''delivery'')),
  delivery_address text,
  notes text NOT NULL DEFAULT '''',
  currency text NOT NULL DEFAULT ''DOP'' CHECK (currency = ''DOP''),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents integer NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents = subtotal_cents + delivery_fee_cents),
  status text NOT NULL DEFAULT ''pending_confirmation''
    CHECK (status IN (''pending_confirmation'', ''confirmed'', ''preparing'', ''ready'', ''delivered'', ''cancelled'')),
  idempotency_key uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fulfillment <> ''delivery'' OR nullif(trim(delivery_address), '''') IS NOT NULL)
);
CREATE INDEX orders_customer_idx ON aromas.orders(customer_id);
CREATE INDEX orders_status_created_idx ON aromas.orders(status, created_at DESC);
CREATE TABLE aromas.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES aromas.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES aromas.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  line_total_cents bigint GENERATED ALWAYS AS (unit_price_cents::bigint * quantity) STORED
);
CREATE INDEX order_items_order_idx ON aromas.order_items(order_id);
CREATE INDEX order_items_product_idx ON aromas.order_items(product_id);
REVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA aromas FROM PUBLIC;
';
 INSERT INTO aromas.schema_migrations(name,checksum) VALUES('001_initial.sql','3bea0df3a183f74da2bf427b615ca91bd2d53d52880b34065ffedc75aaa8b3dc');
 ELSIF NOT EXISTS(SELECT 1 FROM aromas.schema_migrations WHERE name='001_initial.sql' AND checksum='3bea0df3a183f74da2bf427b615ca91bd2d53d52880b34065ffedc75aaa8b3dc') THEN
 RAISE EXCEPTION 'La migración 001_initial.sql cambió. No continúes hasta revisar la versión instalada.';
 END IF;
END $install$;

DO $install$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM aromas.schema_migrations WHERE name='20261003183312_catalog_admin.sql') THEN
 EXECUTE 'CREATE TABLE aromas.categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
 slug text NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0
);
INSERT INTO aromas.categories(name,slug,sort_order) VALUES
 (''Mujer'',''mujer'',10),(''Hombre'',''hombre'',20),(''Unisex'',''unisex'',30),(''Sets y regalos'',''sets'',40),(''Decants'',''decants'',50);
ALTER TABLE aromas.products ADD COLUMN category_id uuid REFERENCES aromas.categories(id) ON DELETE RESTRICT,
 ADD COLUMN concentration text NOT NULL DEFAULT '''', ADD COLUMN notes text NOT NULL DEFAULT '''',
 ADD COLUMN featured boolean NOT NULL DEFAULT false, ADD COLUMN images jsonb NOT NULL DEFAULT ''[]''::jsonb,
 ADD COLUMN version integer NOT NULL DEFAULT 1;
CREATE INDEX products_category_idx ON aromas.products(category_id);
CREATE INDEX products_published_idx ON aromas.products(created_at DESC) WHERE active;
CREATE TABLE aromas.product_variants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES aromas.products(id) ON DELETE RESTRICT,
 label text NOT NULL CHECK(length(label) BETWEEN 1 AND 80),
 volume_ml integer CHECK(volume_ml > 0), price_cents integer NOT NULL CHECK(price_cents >= 0),
 stock integer NOT NULL DEFAULT 0 CHECK(stock >= 0), active boolean NOT NULL DEFAULT true,
 UNIQUE(product_id,label)
);
CREATE INDEX variants_product_idx ON aromas.product_variants(product_id);
INSERT INTO aromas.product_variants(product_id,label,volume_ml,price_cents,stock)
 SELECT id, CASE WHEN volume_ml IS NULL THEN ''Presentación original'' ELSE volume_ml || '' ml'' END, volume_ml,price_cents,stock FROM aromas.products;
UPDATE aromas.products SET category_id=(SELECT id FROM aromas.categories WHERE slug=''unisex''),
 images=CASE WHEN image_url IS NULL THEN ''[]''::jsonb ELSE jsonb_build_array(image_url) END;
CREATE TABLE aromas.admin_users (
 user_id uuid PRIMARY KEY, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
-- Identificadores de usuarios de Supabase Auth. Solo el propietario de la base puede otorgar acceso.
ALTER TABLE aromas.order_items ADD COLUMN variant_id uuid REFERENCES aromas.product_variants(id) ON DELETE RESTRICT;
CREATE INDEX order_items_variant_idx ON aromas.order_items(variant_id);
-- Defensa adicional: el esquema no se expone al Data API de Supabase.
ALTER TABLE aromas.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE aromas.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE aromas.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE aromas.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE aromas.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE aromas.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE aromas.order_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA aromas FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA aromas FROM PUBLIC;
-- El backend consulta con su conexión privada; anon/authenticated no acceden a estas tablas.
';
 INSERT INTO aromas.schema_migrations(name,checksum) VALUES('20261003183312_catalog_admin.sql','8b6aa2970a909ae93b133809397b4f8c6104b46c651b7616557a3a3fbb06297c');
 ELSIF NOT EXISTS(SELECT 1 FROM aromas.schema_migrations WHERE name='20261003183312_catalog_admin.sql' AND checksum='8b6aa2970a909ae93b133809397b4f8c6104b46c651b7616557a3a3fbb06297c') THEN
 RAISE EXCEPTION 'La migración 20261003183312_catalog_admin.sql cambió. No continúes hasta revisar la versión instalada.';
 END IF;
END $install$;

ALTER TABLE aromas.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM PUBLIC;
DO $secure$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
 REVOKE ALL ON SCHEMA aromas FROM anon; REVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM anon;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
 REVOKE ALL ON SCHEMA aromas FROM authenticated; REVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM authenticated;
 END IF;
END $secure$;
COMMIT;
