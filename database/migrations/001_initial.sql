-- Estructura inicial. No incluye clientes, productos ni pedidos ficticios.
CREATE TABLE aromas.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
  brand text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  family text NOT NULL DEFAULT '',
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
  phone text NOT NULL CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
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
  fulfillment text NOT NULL CHECK (fulfillment IN ('pickup', 'delivery')),
  delivery_address text,
  notes text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'DOP' CHECK (currency = 'DOP'),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents integer NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents = subtotal_cents + delivery_fee_cents),
  status text NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN ('pending_confirmation', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  idempotency_key uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fulfillment <> 'delivery' OR nullif(trim(delivery_address), '') IS NOT NULL)
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
