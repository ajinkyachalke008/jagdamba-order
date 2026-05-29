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
import { ArrowLeft, Loader2, MapPin, CheckCircle2, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateOrderNumber } from '@/lib/orderUtils';
import { toast } from 'sonner';
import { t, getName } from '@/lib/translations';
import gPayQR from '@/assets/gpay-qr.jpg';
import phonePeQR from '@/assets/phonepe-qr.jpg';

export default function Checkout() {
  const { cart, getTotal, clearCart, language, loyaltyPoints, addLoyaltyPoints } = useCart();
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
      toast.error(t('geoNotSupported', language));
      return;
    }

    setIsCapturingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationLink(mapsLink);
        setIsCapturingLocation(false);
        toast.success(t('locationSuccess', language));
      },
      () => {
        setIsCapturingLocation(false);
        toast.error(t('locationFailed', language));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim() || formData.customerName.length < 2) {
      newErrors.customerName = t('nameError', language);
    }

    if (!/^\d{10}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = t('phoneError', language);
    }

    if (formData.deliveryMethod === 'home_delivery' && !formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = t('addressError', language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t('fixErrors', language));
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      const total = getTotal();
      const customerName = formData.customerName.trim();
      const deliveryAddress = formData.deliveryMethod === 'home_delivery'
        ? (locationLink ? `${formData.deliveryAddress.trim()} | Location: ${locationLink}` : formData.deliveryAddress.trim())
        : null;

      const { data: order, error: orderError } = await (supabase as any)
        .from('orders' as any)
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: formData.customerPhone,
          delivery_method: formData.deliveryMethod,
          delivery_address: deliveryAddress,
          payment_method: formData.paymentMethod,
          subtotal: total,
          gst: 0,
          total,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!order?.id) throw new Error('Failed to create order');

      const orderItems = cart.map(item => ({
        order_id: order.id,
        item_name_en: item.nameEn,
        item_name_mr: item.nameMr,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await (supabase as any)
        .from('order_items' as any)
        .insert(orderItems as any);

      if (itemsError) throw itemsError;

      try {
        const { error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
          body: {
            orderNumber,
            customerName,
            customerPhone: formData.customerPhone,
            deliveryMethod: formData.deliveryMethod,
            deliveryAddress: deliveryAddress || undefined,
            paymentMethod: formData.paymentMethod,
            items: cart.map(item => ({
              nameEn: item.nameEn,
              nameMr: item.nameMr,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: total,
            gst: 0,
            total,
          },
        });

        if (notificationError) {
          console.error('Telegram notification returned an error:', notificationError);
        }
      } catch (notifError) {
        console.error('Failed to send Telegram notification:', notifError);
      }

      addLoyaltyPoints(total);
      clearCart();
      toast.success(t('orderPlaced', language));
      try {
        sessionStorage.setItem(`order_phone_${order.id}`, formData.customerPhone);
      } catch {}
      navigate(`/order-success/${order.id}`, {
        state: { phone: formData.customerPhone },
      });
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(t('orderFailed', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = getTotal();
  const pointsToEarn = Math.floor(total / 10);

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
          {t('backToMenu', language)}
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-primary">
          {t('checkout', language)}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-card border-border p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">
                    {t('customerInfo', language)}
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">
                        {t('fullName', language)} *
                      </Label>
                      <Input
                        id="name"
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        placeholder={t('enterName', language)}
                        className={errors.customerName ? 'border-destructive' : ''}
                      />
                      {errors.customerName && (
                        <p className="text-sm text-destructive mt-1">{errors.customerName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">
                        {t('mobileNumber', language)} *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                        placeholder={t('mobilePlaceholder', language)}
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
                    {t('deliveryMethod', language)}
                  </h2>
                  
                  <RadioGroup
                    value={formData.deliveryMethod}
                    onValueChange={(value) => setFormData({...formData, deliveryMethod: value})}
                  >
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                        {t('pickup', language)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="home_delivery" id="home_delivery" />
                      <Label htmlFor="home_delivery" className="flex-1 cursor-pointer">
                        {t('homeDelivery', language)}
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.deliveryMethod === 'home_delivery' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="address">
                          {t('deliveryAddress', language)} *
                        </Label>
                        <Input
                          id="address"
                          value={formData.deliveryAddress}
                          onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                          placeholder={t('enterAddress', language)}
                          className={errors.deliveryAddress ? 'border-destructive' : ''}
                        />
                        {errors.deliveryAddress && (
                          <p className="text-sm text-destructive mt-1">{errors.deliveryAddress}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live location — available for both pickup and delivery */}
                  <div className="mt-4">
                    <Label className="mb-2 block">
                      {t('shareLocation', language)}
                    </Label>
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
                          {t('capturingLocation', language)}
                        </>
                      ) : locationLink ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                          {t('locationCaptured', language)}
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          {t('shareLocation', language)}
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
                          {t('viewOnMaps', language)}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocationLink('')}
                          className="ml-2 h-6 text-xs"
                        >
                          {t('clear', language)}
                        </Button>
                      </div>
                    )}
                  </div>

                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('locationOptional', language)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment Options */}
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">
                    {t('paymentMethod', language)}
                  </h2>
                  
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                  >
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        {t('cashOnDelivery', language)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary cursor-pointer">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex-1 cursor-pointer">
                        {t('onlinePayment', language)}
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.paymentMethod === 'online' && (
                    <Card className="mt-4 p-6 border-primary shadow-[0_0_25px_hsl(var(--primary)/0.2)]">
                      <h3 className="text-xl font-bold text-primary mb-4 text-center">
                        💳 {t('completePayment', language)}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <Card className="p-4 bg-card border-border hover:border-primary transition-all hover:scale-105">
                          <div className="text-center">
                            <p className="font-bold text-lg mb-2 text-primary">PhonePe</p>
                            <img 
                              src={phonePeQR} 
                              alt="PhonePe QR Code" 
                              className="w-full max-w-[250px] mx-auto rounded-lg" 
                            />
                            <p className="text-xs text-muted-foreground mt-2">Mr. SOMNATH RAJENDRA CHIKANE</p>
                          </div>
                        </Card>
                        
                        <Card className="p-4 bg-card border-border hover:border-primary transition-all hover:scale-105">
                          <div className="text-center">
                            <p className="font-bold text-lg mb-2 text-primary">Google Pay</p>
                            <img 
                              src={gPayQR} 
                              alt="Google Pay QR Code" 
                              className="w-full max-w-[250px] mx-auto rounded-lg" 
                            />
                            <p className="text-xs text-muted-foreground mt-2">chikanesomnath956@okaxis</p>
                          </div>
                        </Card>
                      </div>
                      
                      <div className="text-center space-y-2">
                        <p className="text-lg font-bold text-primary">
                          Scan & Pay: ₹{total}
                        </p>
                      </div>
                    </Card>
                  )}
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
                      {t('placingOrder', language)}
                    </>
                  ) : (
                    t('placeOrder', language)
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-card border-primary shadow-[0_0_30px_hsl(var(--primary)/0.2)] p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4 text-primary">
                {t('orderSummary', language)}
              </h2>

              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {getName(item, language)} x {item.quantity}
                    </span>
                    <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Delivery Time Estimation */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('estimatedTime', language)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.deliveryMethod === 'pickup' 
                      ? t('prepTime', language)
                      : t('deliveryTime', language)}
                  </p>
                </div>
              </div>

              {/* Loyalty Points */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/10">
                <Star className="h-5 w-5 text-primary fill-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('loyaltyPoints', language)}: {loyaltyPoints}</p>
                  <p className="text-xs text-muted-foreground">
                    +{pointsToEarn} {t('pointsEarned', language)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>{t('total', language)}</span>
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
