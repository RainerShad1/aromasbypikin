CREATE TABLE aromas.categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
 slug text NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0
);
INSERT INTO aromas.categories(name,slug,sort_order) VALUES
 ('Mujer','mujer',10),('Hombre','hombre',20),('Unisex','unisex',30),('Sets y regalos','sets',40),('Decants','decants',50);
ALTER TABLE aromas.products ADD COLUMN category_id uuid REFERENCES aromas.categories(id) ON DELETE RESTRICT,
 ADD COLUMN concentration text NOT NULL DEFAULT '', ADD COLUMN notes text NOT NULL DEFAULT '',
 ADD COLUMN featured boolean NOT NULL DEFAULT false, ADD COLUMN images jsonb NOT NULL DEFAULT '[]'::jsonb,
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
 SELECT id, CASE WHEN volume_ml IS NULL THEN 'Presentación original' ELSE volume_ml || ' ml' END, volume_ml,price_cents,stock FROM aromas.products;
UPDATE aromas.products SET category_id=(SELECT id FROM aromas.categories WHERE slug='unisex'),
 images=CASE WHEN image_url IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(image_url) END;
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
