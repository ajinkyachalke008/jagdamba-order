-- 1. Drop overly-permissive public policies
DROP POLICY IF EXISTS "Anyone can view their own orders by order_number" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

-- Revoke broad table-level grants for SELECT/UPDATE on orders and SELECT on order_items.
-- INSERT remains allowed (checkout still needs it via the existing INSERT policies).
REVOKE SELECT, UPDATE ON public.orders FROM anon, authenticated;
REVOKE SELECT ON public.order_items FROM anon, authenticated;

-- Keep service_role full access for edge functions / admin
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- 2. Secure lookup: by order number + phone (Track Order page)
CREATE OR REPLACE FUNCTION public.get_order_by_tracking(
  _order_number text,
  _phone text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order public.orders%ROWTYPE;
  _items jsonb;
BEGIN
  IF _order_number IS NULL OR _phone IS NULL
     OR length(trim(_order_number)) = 0 OR length(trim(_phone)) < 4 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO _order
  FROM public.orders
  WHERE upper(order_number) = upper(trim(_order_number))
    AND regexp_replace(customer_phone, '\D', '', 'g') =
        regexp_replace(trim(_phone), '\D', '', 'g')
  ORDER BY created_at DESC
  LIMIT 1;

  IF _order.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi.*)), '[]'::jsonb)
  INTO _items
  FROM public.order_items oi
  WHERE oi.order_id = _order.id;

  RETURN jsonb_build_object('order', to_jsonb(_order), 'items', _items);
END;
$$;

-- 3. Secure lookup: by order id + phone (Order Success page right after checkout)
CREATE OR REPLACE FUNCTION public.get_order_for_success(
  _order_id uuid,
  _phone text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order public.orders%ROWTYPE;
  _items jsonb;
BEGIN
  IF _order_id IS NULL OR _phone IS NULL OR length(trim(_phone)) < 4 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO _order
  FROM public.orders
  WHERE id = _order_id
    AND regexp_replace(customer_phone, '\D', '', 'g') =
        regexp_replace(trim(_phone), '\D', '', 'g')
  LIMIT 1;

  IF _order.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi.*)), '[]'::jsonb)
  INTO _items
  FROM public.order_items oi
  WHERE oi.order_id = _order.id;

  RETURN jsonb_build_object('order', to_jsonb(_order), 'items', _items);
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_by_tracking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_tracking(text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_order_for_success(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_for_success(uuid, text) TO anon, authenticated;