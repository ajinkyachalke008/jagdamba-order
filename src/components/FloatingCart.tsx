import { useCart } from '@/contexts/CartContext';
import { ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const FloatingCart = () => {
  const { cart, language, updateQuantity, removeFromCart, getTotal } = useCart();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (itemCount === 0) return null;

  const getName = (item: typeof cart[0]) => {
    if (language === 'mr') return item.nameMr;
    if (language === 'hi') return item.nameHi || item.nameEn;
    return item.nameEn;
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {expanded && (
        <div className="bg-card border border-border rounded-xl shadow-2xl w-72 max-h-80 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="p-3 border-b border-border flex items-center justify-between bg-primary/5">
            <span className="font-semibold text-sm text-foreground">
              {language === 'mr' ? 'तुमची निवड' : language === 'hi' ? 'आपका चयन' : 'Your Selection'}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-48 p-2 space-y-1.5">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-muted/50 text-xs">
                <span className="font-medium text-foreground truncate flex-1">{getName(item)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => item.quantity <= 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.quantity - 1)}
                    className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="font-semibold text-primary w-12 text-right">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border space-y-2">
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>{language === 'mr' ? 'एकूण' : language === 'hi' ? 'कुल' : 'Total'}</span>
              <span className="text-primary">₹{getTotal()}</span>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground text-xs h-8"
              onClick={() => navigate('/checkout')}
            >
              {language === 'mr' ? 'ऑर्डर करा' : language === 'hi' ? 'ऑर्डर करें' : 'Proceed to Order'}
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform relative"
      >
        <ShoppingBag className="h-6 w-6" />
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
          {itemCount}
        </Badge>
      </button>
    </div>
  );
};
