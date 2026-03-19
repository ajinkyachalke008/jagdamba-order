
-- Allow anyone to update orders (for marking as completed)
CREATE POLICY "Anyone can update orders" ON public.orders
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
