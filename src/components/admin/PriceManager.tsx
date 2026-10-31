import { useState, useEffect, useMemo } from 'react';
import { menuItems, comboItems } from '@/data/menuData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Tags, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  call: (body: Record<string, unknown>) => Promise<any>;
}

interface DishRow {
  id: string;
  name: string;
  basePrice: number;
  category: string;
}

interface Override {
  price: number;
  original_price: number | null;
}

export const PriceManager = ({ call }: Props) => {
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [customItems, setCustomItems] = useState<DishRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const data = await call({ action: 'prices_list' });
      const rows: any[] = data.prices || [];
      const map: Record<string, Override> = {};
      rows.forEach(r => {
        map[r.item_id] = { price: Number(r.price), original_price: r.original_price === null ? null : Number(r.original_price) };
      });
      setOverrides(map);
      const { data: custom } = await (supabase as any)
        .from('custom_menu_items')
        .select('id, name_en, price, category')
        .eq('active', true);
      setCustomItems(
        ((custom as any[] | null) || []).map(r => ({
          id: r.id,
          name: r.name_en,
          basePrice: Number(r.price),
          category: r.category,
        }))
      );
    } catch (e) {
      toast.error('Failed to load menu prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const ALL: DishRow[] = useMemo(() => [
    ...menuItems.map(m => ({ id: m.id, name: m.nameEn, basePrice: m.price, category: m.category })),
    ...comboItems.map(c => ({ id: c.id, name: c.nameEn, basePrice: c.comboPrice, category: 'Combo' })),
    ...customItems,
  ], [customItems]);

  const effectivePrice = (d: DishRow) => (overrides[d.id]?.price ?? d.basePrice);

  const save = async (d: DishRow) => {
    const raw = (drafts[d.id] ?? '').trim();
    const price = Number(raw);
    if (raw === '' || !isFinite(price) || price < 0) {
      toast.error('Enter a valid price');
      return;
    }
    setSavingId(d.id);
    try {
      // Keep the recorded "original" for strike-through; fall back to the base price.
      const existingOriginal = overrides[d.id]?.original_price ?? d.basePrice;
      await call({ action: 'set_price', item_id: d.id, price, original_price: existingOriginal });
      setOverrides(prev => ({ ...prev, [d.id]: { price, original_price: existingOriginal } }));
      setDrafts(prev => ({ ...prev, [d.id]: '' }));
      toast.success(`${d.name} price updated to ₹${price} — live for all customers`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update price');
    } finally {
      setSavingId(null);
    }
  };

  const reset = async (d: DishRow) => {
    setSavingId(d.id);
    try {
      await call({ action: 'reset_price', item_id: d.id });
      setOverrides(prev => {
        const next = { ...prev };
        delete next[d.id];
        return next;
      });
      toast.success(`${d.name} price reset to ₹${d.basePrice}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reset price');
    } finally {
      setSavingId(null);
    }
  };

  const list = ALL.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
  const changedCount = ALL.filter(d => overrides[d.id]).length;

  return (
    <Card className="border-primary/20">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between space-y-0 py-4"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="text-base flex items-center gap-2">
          <Tags className="h-4 w-4 text-primary" />
          Menu prices
          {changedCount > 0 && (
            <Badge className="bg-primary/15 text-primary ml-1">{changedCount} custom</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm">{open ? 'Hide' : 'Manage'}</Button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dish..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
              {list.map(d => {
                const hasOverride = !!overrides[d.id];
                const current = effectivePrice(d);
                return (
                  <div
                    key={d.id}
                    className={`rounded-lg border p-3 ${hasOverride ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.category}
                          {hasOverride && (
                            <span className="ml-1">
                              · <span className="line-through">₹{d.basePrice}</span> → ₹{current}
                            </span>
                          )}
                          {!hasOverride && <> · ₹{current}</>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        inputMode="decimal"
                        placeholder="New ₹"
                        value={drafts[d.id] ?? ''}
                        onChange={(e) => setDrafts(prev => ({ ...prev, [d.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && save(d)}
                        className="h-9 text-sm"
                      />
                      <Button
                        size="sm"
                        disabled={savingId === d.id}
                        onClick={() => save(d)}
                        className="shrink-0 text-xs h-9 px-3"
                      >
                        {savingId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
                      </Button>
                      {hasOverride && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === d.id}
                          onClick={() => reset(d)}
                          className="shrink-0 text-xs h-9 px-3"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Saved prices show instantly on the customer menu with the old price struck through — no refresh needed.
          </p>
        </CardContent>
      )}
    </Card>
  );
};
