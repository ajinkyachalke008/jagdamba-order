import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateOrderNumber } from '@/lib/orderUtils';
import { toast } from 'sonner';

export default function Checkout() {
  const { cart, getTotal, clearCart, language } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationLink, setLocationLink] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    paymentMethod: 'cash'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/');
    }
  }, [cart, navigate]);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error(language === 'en' ? 'Geolocation is not supported by your browser' : 'तुमचा ब्राउझर स्थान शेअरिंग सपोर्ट करत नाही');
      return;
    }

    setIsCapturingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationLink(mapsLink);
        setIsCapturingLocation(false);
        toast.success(language === 'en' ? 'Location captured successfully!' : 'स्थान यशस्वीरित्या कॅप्चर केले!');
      },
      (error) => {
        setIsCapturingLocation(false);
        toast.error(language === 'en' ? 'Failed to capture location. Please enable location permissions.' : 'स्थान कॅप्चर करता आले नाही. कृपया स्थान परवानगी सक्षम करा.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim() || formData.customerName.length < 2) {
      newErrors.customerName = language === 'en' 
        ? 'Name must be at least 2 characters' 
        : 'नाव किमान २ अक्षरांचे असावे';
    }

    if (!/^\d{10}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = language === 'en'
        ? 'Please enter a valid 10-digit phone number'
        : 'कृपया वैध १० अंकी फोन नंबर टाका';
    }

    if (formData.deliveryMethod === 'home_delivery' && !formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = language === 'en'
        ? 'Address is required for home delivery'
        : 'होम डिलिव्हरीसाठी पत्ता आवश्यक आहे';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(language === 'en' ? 'Please fix the errors' : 'कृपया त्रुटी दुरुस्त करा');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      const total = getTotal();

      // Insert order
      const { data: order, error: orderError } = await (supabase as any)
        .from('orders' as any)
        .insert({
          order_number: orderNumber,
          customer_name: formData.customerName.trim(),
          customer_phone: formData.customerPhone,
          delivery_method: formData.deliveryMethod,
          delivery_address: formData.deliveryMethod === 'home_delivery' 
            ? (locationLink ? `${formData.deliveryAddress.trim()} | Location: ${locationLink}` : formData.deliveryAddress.trim())
            : null,
          payment_method: formData.paymentMethod,
          subtotal: total,
          gst: 0,
          total: total
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Failed to create order');

      // Insert order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        item_name_en: item.nameEn,
        item_name_mr: item.nameMr,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await (supabase as any)
        .from('order_items' as any)
        .insert(orderItems as any);

      if (itemsError) throw itemsError;

      // Send Telegram notification
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            orderNumber: orderNumber,
            customerName: formData.customerName.trim(),
            customerPhone: formData.customerPhone,
            deliveryMethod: formData.deliveryMethod,
            deliveryAddress: formData.deliveryMethod === 'home_delivery' 
              ? (locationLink ? `${formData.deliveryAddress.trim()} | Location: ${locationLink}` : formData.deliveryAddress.trim())
              : undefined,
            paymentMethod: formData.paymentMethod,
            items: cart.map(item => ({
              nameEn: item.nameEn,
              nameMr: item.nameMr,
              quantity: item.quantity,
              price: item.price
            })),
            subtotal: total,
            gst: 0,
            total: total
          }
        });
        console.log('Telegram notification sent');
      } catch (notifError) {
        // Don't fail the order if notification fails
        console.error('Failed to send Telegram notification:', notifError);
      }

      // Clear cart and navigate to success
      clearCart();
      toast.success(language === 'en' ? 'Order placed successfully!' : 'ऑर्डर यशस्वीरित्या दिली!');
      navigate(`/order-success/${order!.id}`);
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(language === 'en' 
        ? 'Failed to place order. Please try again.' 
        : 'ऑर्डर देता आली नाही. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = getTotal();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === 'en' ? 'Back to Menu' : 'मेनूवर परत जा'}
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-primary">
          {language === 'en' ? 'Checkout' : 'चेकआउट'}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">
                    {language === 'en' ? 'Customer Information' : 'ग्राहक माहिती'}
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">
                        {language === 'en' ? 'Full Name' : 'पूर्ण नाव'} *
                      </Label>
                      <Input
                        id="name"
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        placeholder={language === 'en' ? 'Enter your full name' : 'तुमचे पूर्ण नाव टाका'}
                        className={errors.customerName ? 'border-destructive' : ''}
                      />
                      {errors.customerName && (
                        <p className="text-sm text-destructive mt-1">{errors.customerName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">
                        {language === 'en' ? 'Mobile Number' : 'मोबाईल नंबर'} *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                        placeholder={language === 'en' ? '10-digit mobile number' : '१० अंकी मोबाईल नंबर'}
                        className={errors.customerPhone ? 'border-destructive' : ''}
                      />
                      {errors.customerPhone && (
                        <p className="text-sm text-destructive mt-1">{errors.customerPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Delivery Options */}
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">
                    {language === 'en' ? 'Delivery Method' : 'डिलिव्हरी पद्धत'}
                  </h2>
                  
                  <RadioGroup
                    value={formData.deliveryMethod}
                    onValueChange={(value) => setFormData({...formData, deliveryMethod: value})}
                  >
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                        {language === 'en' ? 'Pickup' : 'पिकअप'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="home_delivery" id="home_delivery" />
                      <Label htmlFor="home_delivery" className="flex-1 cursor-pointer">
                        {language === 'en' ? 'Home Delivery' : 'होम डिलिव्हरी'}
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.deliveryMethod === 'home_delivery' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="address">
                          {language === 'en' ? 'Delivery Address' : 'डिलिव्हरी पत्ता'} *
                        </Label>
                        <Input
                          id="address"
                          value={formData.deliveryAddress}
                          onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                          placeholder={language === 'en' ? 'Enter your complete address' : 'तुमचा संपूर्ण पत्ता टाका'}
                          className={errors.deliveryAddress ? 'border-destructive' : ''}
                        />
                        {errors.deliveryAddress && (
                          <p className="text-sm text-destructive mt-1">{errors.deliveryAddress}</p>
                        )}
                      </div>
                      
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleShareLocation}
                          disabled={isCapturingLocation}
                          className="w-full border-primary hover:bg-primary/10"
                        >
                          {isCapturingLocation ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {language === 'en' ? 'Capturing Location...' : 'स्थान कॅप्चर करत आहे...'}
                            </>
                          ) : locationLink ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                              {language === 'en' ? 'Location Captured' : 'स्थान कॅप्चर केले'}
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              {language === 'en' ? 'Share Your Location' : 'तुमचे स्थान शेअर करा'}
                            </>
                          )}
                        </Button>
                        
                        {locationLink && (
                          <div className="mt-2 flex items-center justify-between bg-secondary p-2 rounded-lg">
                            <a 
                              href={locationLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline truncate flex-1"
                            >
                              {language === 'en' ? 'View on Maps' : 'मॅपवर पहा'}
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocationLink('')}
                              className="ml-2 h-6 text-xs"
                            >
                              {language === 'en' ? 'Clear' : 'साफ करा'}
                            </Button>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'en' ? 'Optional: Share your precise location for faster delivery' : 'पर्यायी: जलद डिलिव्हरीसाठी तुमचे अचूक स्थान शेअर करा'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment Options */}
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">
                    {language === 'en' ? 'Payment Method' : 'पेमेंट पद्धत'}
                  </h2>
                  
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                  >
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        {language === 'en' ? 'Cash on Delivery/Pickup' : 'रोख पेमेंट'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex-1 cursor-pointer">
                        {language === 'en' ? 'Online Payment (UPI/Card/Wallet)' : 'ऑनलाईन पेमेंट (UPI/Card/Wallet)'}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.6)]"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === 'en' ? 'Placing Order...' : 'ऑर्डर देत आहे...'}
                    </>
                  ) : (
                    language === 'en' ? 'Confirm Order' : 'ऑर्डर कन्फर्म करा'
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-card border-primary shadow-[0_0_30px_hsl(var(--primary)/0.2)] p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4 text-primary">
                {language === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
              </h2>

              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {language === 'en' ? item.nameEn : item.nameMr} x {item.quantity}
                    </span>
                    <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>{language === 'en' ? 'Total' : 'एकूण'}</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}