import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { MobileCartModal } from './MobileCartModal';

export const MobileCartButton = () => {
  const { cart, language } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-20 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-[0_0_40px_hsl(var(--primary)/0.8)] hover:shadow-[0_0_55px_hsl(var(--primary)/1)] transition-all animate-glow-pulse hover:scale-105 duration-300 font-semibold text-base"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="h-8 w-8 text-primary-foreground" />
              <Badge 
                className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-accent text-accent-foreground font-bold animate-bounce"
              >
                {itemCount}
              </Badge>
            </div>
            <span className="text-primary-foreground whitespace-nowrap">
              {language === 'en' ? 'View Cart' : 'कार्ट पहा'}
            </span>
          </div>
        </Button>
      </div>
      
      <MobileCartModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};