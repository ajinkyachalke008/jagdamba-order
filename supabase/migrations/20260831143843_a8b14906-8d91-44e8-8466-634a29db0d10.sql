CREATE TABLE public.menu_prices (
  item_id text PRIMARY KEY,
  price numeric NOT NULL CHECK (price >= 0),
  original_price numeric CHECK (original_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menu_prices TO anon, authenticated;
GRANT ALL ON public.menu_prices TO service_role;

ALTER TABLE public.menu_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu prices"
ON public.menu_prices FOR SELECT
TO anon, authenticated
USING (true);

CREATE TRIGGER update_menu_prices_updated_at
BEFORE UPDATE ON public.menu_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','flat')),
  value numeric NOT NULL CHECK (value >= 0),
  min_order numeric NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_discount numeric CHECK (max_discount >= 0),
  code text,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.discounts TO anon, authenticated;
GRANT ALL ON public.discounts TO service_role;

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read discounts"
ON public.discounts FOR SELECT
TO anon, authenticated
USING (true);

CREATE TRIGGER update_discounts_updated_at
BEFORE UPDATE ON public.discounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discounts;