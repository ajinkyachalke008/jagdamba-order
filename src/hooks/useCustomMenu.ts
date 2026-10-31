import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/contexts/CartContext';

/**
 * Live list of dishes added by the admin from the dashboard.
 * Updates instantly (realtime) when dishes are added, edited or removed.
 */
export function useCustomMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const mapRow = (r: any): MenuItem => ({
      id: r.id,
      nameEn: r.name_en,
      nameMr: r.name_mr,
      nameHi: r.name_hi || r.name_mr,
      descriptionEn: r.description_en || '',
      descriptionMr: r.description_mr || r.description_en || '',
      descriptionHi: r.description_hi || r.description_en || '',
      price: Number(r.price),
      category: r.category,
    });

    const load = async () => {
      const { data } = await (supabase as any)
        .from('custom_menu_items')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (!active) return;
      setItems(((data as any[] | null) || []).map(mapRow));
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel('custom-menu-items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_menu_items' },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { items, loading };
}
