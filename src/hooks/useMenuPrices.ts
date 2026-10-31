import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceOverride {
  item_id: string;
  price: number;
  original_price: number | null;
}

/**
 * Live price overrides set by the admin ("Menu Prices").
 * Keyed by item id; updates instantly over realtime when the owner edits a price.
 */
export function useMenuPrices() {
  const [overrides, setOverrides] = useState<Record<string, PriceOverride>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await (supabase as any)
        .from('menu_prices')
        .select('item_id, price, original_price');
      if (!active) return;
      const next: Record<string, PriceOverride> = {};
      ((data as PriceOverride[] | null) || []).forEach(r => {
        next[r.item_id] = { item_id: r.item_id, price: Number(r.price), original_price: r.original_price === null ? null : Number(r.original_price) };
      });
      setOverrides(next);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel('menu-prices')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_prices' },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { overrides, loading };
}

/**
 * Applies a live price override to any priced entity.
 * The old price is preserved as `originalPrice` for strike-through display.
 */
export function applyPriceOverride<T extends { id: string; price: number }>(
  item: T,
  overrides: Record<string, PriceOverride>
): T & { originalPrice?: number } {
  const o = overrides[item.id];
  if (!o) return item;
  const newPrice = Number(o.price);
  if (newPrice === item.price) return item;
  // Strike-through shows the admin-recorded original, falling back to the base price.
  const original = o.original_price !== null ? o.original_price : item.price;
  return { ...item, price: newPrice, originalPrice: original === newPrice ? undefined : original };
}
