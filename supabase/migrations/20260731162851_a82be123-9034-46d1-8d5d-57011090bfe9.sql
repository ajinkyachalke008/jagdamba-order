CREATE TABLE public.menu_availability (
  item_id TEXT PRIMARY KEY,
  sold_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menu_availability TO anon;
GRANT SELECT ON public.menu_availability TO authenticated;
GRANT ALL ON public.menu_availability TO service_role;

ALTER TABLE public.menu_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu availability"
ON public.menu_availability FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_menu_availability_updated_at
BEFORE UPDATE ON public.menu_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.menu_availability REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_availability;