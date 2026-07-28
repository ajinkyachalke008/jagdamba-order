import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import { t, getName } from '@/lib/translations';

interface MobileCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileCartModal = ({ isOpen, onClose }: MobileCartModalProps) => {
  const { cart, updateQuantity, removeFromCart, getTotal, language } = useCart();
  const navigate = useNavigate();

  const total = getTotal();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-primary overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            {t('yourOrder', language)}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col mt-6">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {cart.map(item => (
              <div key={item.id} className="bg-secondary rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {getName(item, language)}
                    </p>
                    <p className="text-sm text-muted-foreground">₹{item.price}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-9 w-9 border-primary"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-semibold text-lg">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-9 w-9 border-primary"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="font-bold text-primary text-lg">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 pb-2">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>{t('total', language)}</span>
                <span>₹{total}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleCheckout}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.6)]"
                size="lg"
              >
                {t('proceedToCheckout', language)}
              </Button>
              <Button 
                onClick={onClose}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {t('continueShopping', language)}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
