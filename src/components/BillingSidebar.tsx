import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingCart, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { t, getName } from '@/lib/translations';

export const BillingSidebar = () => {
  const { cart, updateQuantity, removeFromCart, getTotal, language } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="fixed right-4 top-24 w-80 max-w-[calc(100vw-2rem)] hidden lg:block">
        <Card className="bg-card border-border p-6 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {t('cartEmpty', language)}
          </p>
        </Card>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="fixed right-4 top-24 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-7rem)] overflow-y-auto hidden lg:block animate-slide-up">
      <Card className="bg-card border-primary shadow-[0_0_30px_hsl(var(--primary)/0.2)] p-6">
        <h3 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          {t('yourOrder', language)}
        </h3>

        {/* Delivery Time Estimate */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-primary/10 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            {t('estimatedTime', language)}: <span className="text-primary font-semibold">20-30 min</span>
          </span>
        </div>

        <div className="space-y-4 mb-6">
          {cart.map(item => (
            <div key={item.id} className="bg-secondary rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
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
                    className="h-8 w-8 border-primary"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 border-primary"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-bold text-primary">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Separator className="mb-4" />

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xl font-bold text-primary">
            <span>{t('total', language)}</span>
            <span className="animate-pulse">₹{total}</span>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/checkout')}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.8)] transition-all"
          size="lg"
        >
          {t('proceedToCheckout', language)}
        </Button>
      </Card>
    </div>
  );
};
