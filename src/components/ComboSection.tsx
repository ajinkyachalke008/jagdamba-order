import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { comboItems, menuItems } from '@/data/menuData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Sparkles } from 'lucide-react';
import { t, getName } from '@/lib/translations';
import { useSoldOut } from '@/hooks/useSoldOut';

export const ComboSection = () => {
  const { addToCart, language } = useCart();
  const { isSoldOut } = useSoldOut();
  const [addingCombo, setAddingCombo] = useState<string | null>(null);

  // Hide a combo when it is marked sold out, or when any dish inside it is sold out.
  const availableCombos = comboItems.filter(
    combo => !isSoldOut(combo.id) && !combo.items.some(id => isSoldOut(id))
  );


  const handleAddCombo = (comboId: string) => {
    const combo = comboItems.find(c => c.id === comboId);
    if (!combo) return;

    setAddingCombo(comboId);

    // Add combo as a single cart item
    addToCart({
      id: comboId,
      nameEn: combo.nameEn,
      nameMr: combo.nameMr,
      nameHi: combo.nameHi,
      price: combo.comboPrice,
      category: 'Combo'
    });

    setTimeout(() => setAddingCombo(null), 600);
  };

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              {t('mealCombos', language)}
            </h2>
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">
            {t('comboSubtitle', language)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {availableCombos.map(combo => (
            <Card
              key={combo.id}
              className="relative overflow-hidden bg-card border-border hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300 group"
            >
              <div className="absolute top-3 right-3">
                <Badge className="bg-accent text-accent-foreground font-bold animate-pulse">
                  {language === 'hi' ? combo.badgeHi : language === 'mr' ? combo.badgeMr : combo.badgeEn}
                </Badge>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-1 pr-20">
                  {getName(combo, language)}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'hi' ? combo.descriptionHi : language === 'mr' ? combo.descriptionMr : combo.descriptionEn}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-primary">₹{combo.comboPrice}</span>
                  <span className="text-lg text-muted-foreground line-through">₹{combo.originalPrice}</span>
                </div>

                <Button
                  onClick={() => handleAddCombo(combo.id)}
                  disabled={addingCombo === combo.id}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-all"
                >
                  {addingCombo === combo.id ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      {t('added', language)}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      {t('addCombo', language)}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
