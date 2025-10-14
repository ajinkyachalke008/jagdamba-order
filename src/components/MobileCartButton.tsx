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
          className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.9)] transition-all animate-glow-pulse"
        >
          <div className="relative">
            <ShoppingCart className="h-7 w-7 text-primary-foreground" />
            <Badge 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-accent text-accent-foreground font-bold animate-bounce"
            >
              {itemCount}
            </Badge>
          </div>
        </Button>
      </div>
      
      <MobileCartModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};