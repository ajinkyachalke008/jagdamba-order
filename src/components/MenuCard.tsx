import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useCart, MenuItem } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard = ({ item }: MenuCardProps) => {
  const { addToCart, language } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(item);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

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
              {language === 'en' ? item.nameEn : item.nameMr}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {language === 'en' ? item.nameMr : item.nameEn}
            </p>
            {item.descriptionEn && item.descriptionMr && (
              <p className="text-sm text-muted-foreground/80 mb-3">
                {language === 'en' ? item.descriptionEn : item.descriptionMr}
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
          className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.9)] transition-all animate-glow-pulse hover:scale-[1.02] duration-300 font-semibold"
        >
          {isAdding ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              {language === 'en' ? 'Added!' : 'जोडले!'}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-5 w-5" />
              {language === 'en' ? 'Order Now' : 'ऑर्डर करा'}
            </>
          )}
        </Button>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      </div>
    </Card>
  );
};
