import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useCart, MenuItem } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { t, getName, getSecondaryName, getDescription } from '@/lib/translations';

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard = ({ item }: MenuCardProps) => {
  const { addToCart, language } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(item);
    setTimeout(() => setIsAdding(false), 600);
  };

  const description = getDescription(item, language);

  return (
    <Card className={`
      relative overflow-hidden bg-card border-border
      hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]
      transition-all duration-300 group
      ${isAdding ? 'animate-scale-in' : ''}
    `}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">
              {getName(item, language)}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {getSecondaryName(item, language)}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground/80 mb-3">
                {description}
              </p>
            )}
          </div>
          <div className="text-right ml-4">
            <span className="text-2xl font-bold text-primary">₹{item.price}</span>
          </div>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.7),0_0_60px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_45px_hsl(var(--primary)/1),0_0_80px_hsl(var(--primary)/0.6)] transition-all animate-glow-pulse hover:scale-[1.02] duration-300 font-semibold"
        >
          {isAdding ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              {t('added', language)}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-5 w-5" />
              {t('orderNow', language)}
            </>
          )}
        </Button>
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      </div>
    </Card>
  );
};
