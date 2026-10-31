import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Pencil, Trash2, UtensilsCrossed, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { categories } from '@/data/menuData';

interface Props {
  call: (body: Record<string, unknown>) => Promise<any>;
}

interface CustomRow {
  id: string;
  name_en: string;
  name_mr: string;
  name_hi: string | null;
  description_en: string | null;
  description_mr: string | null;
  description_hi: string | null;
  price: number;
  category: string;
  active: boolean;
}

const emptyForm = {
  name_en: '',
  name_mr: '',
  name_hi: '',
  description_en: '',
  description_mr: '',
  description_hi: '',
  price: '',
  category: 'Special',
};

export const MenuManager = ({ call }: Props) => {
  const [items, setItems] = useState<CustomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from('custom_menu_items')
        .select('*')
        .order('created_at', { ascending: false });
      setItems(((data as CustomRow[] | null) || []));
    } catch {
      toast.error('Failed to load added dishes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (row: CustomRow) => {
    setEditingId(row.id);
    setShowForm(true);
    setForm({
      name_en: row.name_en,
      name_mr: row.name_mr,
      name_hi: row.name_hi || '',
      description_en: row.description_en || '',
      description_mr: row.description_mr || '',
      description_hi: row.description_hi || '',
      price: String(row.price),
      category: row.category,
    });
  };

  const submit = async () => {
    const price = Number(form.price);
    if (!form.name_en.trim() || !form.name_mr.trim() || form.price === '' || !isFinite(price) || price < 0) {
      toast.error('English name, Marathi name and a valid price are required');
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await call({ action: 'menu_update', id: editingId, ...form, price });
        toast.success(`${form.name_en.trim()} updated — live on the menu`);
      } else {
        await call({ action: 'menu_add', ...form, price });
        toast.success(`${form.name_en.trim()} added — live on the menu now`);
      }
      resetForm();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save dish');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: CustomRow) => {
    if (!confirm(`Remove "${row.name_en}" from the menu?`)) return;
    setBusy(true);
    try {
      await call({ action: 'menu_delete', id: row.id });
      if (editingId === row.id) resetForm();
      toast.success(`${row.name_en} removed from the menu`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove dish');
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (row: CustomRow, active: boolean) => {
    setBusy(true);
    try {
      await call({ action: 'menu_update', id: row.id, active });
      toast.success(active ? `${row.name_en} is back on the menu` : `${row.name_en} hidden from the menu`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update dish');
    } finally {
      setBusy(false);
    }
  };

  const field = (
    key: keyof typeof emptyForm,
    label: string,
    placeholder: string,
    required = false,
    type = 'text'
  ) => (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Input
        value={form[key]}
        onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        type={type}
        className="h-9 text-sm"
      />
    </div>
  );

  return (
    <Card className="border-primary/20">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between space-y-0 py-4"
        onClick={() => setOpen(o => !o)}
      >
        <CardTitle className="text-base flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-primary" />
          Add / edit dishes
          {items.length > 0 && (
            <Badge className="bg-primary/15 text-primary ml-1">{items.length} added</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm">{open ? 'Hide' : 'Manage'}</Button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {!showForm && (
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
              className="w-full h-11"
            >
              <Plus className="h-4 w-4 mr-2" /> Add new dish
            </Button>
          )}

          {showForm && (
            <div className="rounded-lg border border-primary/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {editingId ? 'Edit dish' : 'New dish'}
                </p>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('name_en', 'Name (English)', 'e.g. Veg Rassa', true)}
                {field('name_mr', 'Name (Marathi)', 'उदा. व्हेज रस्सा', true)}
                {field('name_hi', 'Name (Hindi)', 'उदा. वेज रस्सा', false)}
                {field('price', 'Price (₹)', 'e.g. 130', true, 'number')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('description_en', 'Description (English)', 'Short description')}
                {field('description_mr', 'Description (Marathi)', 'छोटे वर्णन')}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c !== 'All').map(c => (
                    <Button
                      key={c}
                      type="button"
                      variant={form.category === c ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setForm(prev => ({ ...prev, category: c }))}
                      className="text-xs h-8"
                    >
                      {c}
                    </Button>
                  ))}
                  {form.category && !categories.includes(form.category) && (
                    <Badge className="bg-primary/15 text-primary h-8">{form.category}</Badge>
                  )}
                </div>
              </div>
              <Button onClick={submit} disabled={busy} className="w-full h-11">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />{editingId ? 'Save changes' : 'Add to menu'}</>}
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No dishes added yet. Tap "Add new dish" to create one.
            </p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {items.map(row => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between gap-2 rounded-lg border p-3 ${row.active ? 'border-border' : 'border-destructive/40 bg-destructive/5'}`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${row.active ? 'text-foreground' : 'line-through text-muted-foreground'}`}>
                      {row.name_en} · ₹{row.price}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.name_mr} · {row.category}{!row.active && ' · hidden'}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => startEdit(row)} className="h-8 px-2">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setActive(row, !row.active)}
                      className="h-8 px-2 text-xs"
                    >
                      {row.active ? 'Hide' : 'Show'}
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(row)} className="h-8 px-2">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            New dishes appear on the customer menu instantly — with trilingual names if you add Marathi/Hindi.
          </p>
        </CardContent>
      )}
    </Card>
  );
};
