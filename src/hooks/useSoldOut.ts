import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Live set of menu item IDs that are currently marked "sold out" by the admin.
 * Updates instantly (realtime) when the owner toggles availability.
 */
export function useSoldOut() {
  const [soldOut, setSoldOut] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await (supabase as any)
        .from('menu_availability')
        .select('item_id, sold_out');
      if (!active) return;
      const next = new Set<string>(
        ((data as { item_id: string; sold_out: boolean }[] | null) || [])
          .filter(r => r.sold_out)
          .map(r => r.item_id)
      );
      setSoldOut(next);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel('menu-availability')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_availability' },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { soldOut, loading, isSoldOut: (id: string) => soldOut.has(id) };
}
