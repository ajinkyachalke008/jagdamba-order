import { useState, useEffect } from 'react';
import { menuItems, comboItems } from '@/data/menuData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, PackageX, PackageCheck, Search, Utensils } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  call: (body: Record<string, unknown>) => Promise<any>;
}

const ALL = [
  ...menuItems.map(m => ({ id: m.id, name: m.nameEn, price: m.price, category: m.category })),
  ...comboItems.map(c => ({ id: c.id, name: c.nameEn, price: c.comboPrice, category: 'Combo' })),
];

export const SoldOutManager = ({ call }: Props) => {
  const [soldOut, setSoldOut] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const data = await call({ action: 'availability_list' });
      const rows: { item_id: string; sold_out: boolean }[] = data.availability || [];
      setSoldOut(new Set(rows.filter(r => r.sold_out).map(r => r.item_id)));
    } catch (e) {
      toast.error('Failed to load menu availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (id: string, name: string) => {
    const next = !soldOut.has(id);
    setSavingId(id);
    try {
      await call({ action: 'set_availability', item_id: id, sold_out: next });
      setSoldOut(prev => {
        const s = new Set(prev);
        next ? s.add(id) : s.delete(id);
        return s;
      });
      toast.success(next ? `${name} marked SOLD OUT` : `${name} is available again`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingId(null);
    }
  };

  const list = ALL.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Card className="border-primary/20">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between space-y-0 py-4"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="text-base flex items-center gap-2">
          <Utensils className="h-4 w-4 text-primary" />
          Menu availability
          {soldOut.size > 0 && (
            <Badge variant="destructive" className="ml-1">{soldOut.size} sold out</Badge>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {list.map(item => {
                const isOut = soldOut.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border p-3 ${
                      isOut ? 'border-destructive/40 bg-destructive/5' : 'border-border'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isOut ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.category} · ₹{item.price}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isOut ? 'outline' : 'destructive'}
                      disabled={savingId === item.id}
                      onClick={() => toggle(item.id, item.name)}
                      className="shrink-0 text-xs"
                    >
                      {savingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isOut ? (
                        <><PackageCheck className="h-3.5 w-3.5 mr-1" />Restore</>
                      ) : (
                        <><PackageX className="h-3.5 w-3.5 mr-1" />Sold out</>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Sold-out dishes disappear from the customer menu instantly — no refresh needed.
          </p>
        </CardContent>
      )}
    </Card>
  );
};
