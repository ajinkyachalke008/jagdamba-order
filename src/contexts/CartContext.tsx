import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MenuItem {
  id: string;
  nameEn: string;
  nameMr: string;
  nameHi?: string;
  descriptionEn?: string;
  descriptionMr?: string;
  descriptionHi?: string;
  price: number;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type Language = 'en' | 'mr' | 'hi';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  loyaltyPoints: number;
  addLoyaltyPoints: (amount: number) => void;
  redeemPoints: (points: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    const stored = localStorage.getItem('jagdamba_loyalty_points');
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('jagdamba_loyalty_points', loyaltyPoints.toString());
  }, [loyaltyPoints]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => 
      i.id === itemId ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => setCart([]);

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => {
      if (prev === 'en') return 'mr';
      if (prev === 'mr') return 'hi';
      return 'en';
    });
  };

  const addLoyaltyPoints = (amount: number) => {
    // 1 point per ₹10 spent
    const points = Math.floor(amount / 10);
    setLoyaltyPoints(prev => prev + points);
  };

  const redeemPoints = (points: number): boolean => {
    if (points > loyaltyPoints) return false;
    setLoyaltyPoints(prev => prev - points);
    return true;
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      language,
      setLanguage,
      toggleLanguage,
      loyaltyPoints,
      addLoyaltyPoints,
      redeemPoints
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
