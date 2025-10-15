import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle, Download, Home, Phone, Loader2 } from 'lucide-react';
import { generateReceiptPDF } from '@/lib/orderUtils';
import confetti from 'canvas-confetti';
import { useCart } from '@/contexts/CartContext';
import logoImage from '@/assets/jagdamba-logo.jpg';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { language } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    fetchOrderDetails();
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, [orderId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const { data: order, error: orderError } = await (supabase as any)
        .from('orders' as any)
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      const { data: items, error: itemsError } = await (supabase as any)
        .from('order_items' as any)
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrderData({ ...(order as any), items });
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!orderData) return;

    const pdf = generateReceiptPDF({
      orderNumber: orderData.order_number,
      customerName: orderData.customer_name,
      customerPhone: orderData.customer_phone,
      deliveryMethod: orderData.delivery_method,
      paymentMethod: orderData.payment_method,
      items: orderData.items.map((item: any) => ({
        nameEn: item.item_name_en,
        nameMr: item.item_name_mr,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal)
      })),
      total: parseFloat(orderData.total),
      createdAt: orderData.created_at
    });

    pdf.save(`receipt-${orderData.order_number}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8 animate-scale-in">
            <div className="mb-4 flex justify-center">
              <img 
                src={logoImage} 
                alt="Hotel Jagdamba" 
                className="h-24 w-24 rounded-full shadow-[0_0_40px_hsl(var(--primary)/0.5)] animate-glow-pulse"
              />
            </div>
            <CheckCircle className="h-20 w-20 text-primary mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl font-bold mb-2 text-primary">
              {language === 'en' ? 'Order Placed Successfully!' : 'ऑर्डर यशस्वीरित्या दिली!'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === 'en' 
                ? 'Thank you for your order. Your food will be ready soon!' 
                : 'तुमच्या ऑर्डरसाठी धन्यवाद. तुमचे जेवण लवकरच तयार होईल!'}
            </p>
          </div>

          {/* Order Receipt */}
          <Card className="bg-card border-primary shadow-[0_0_30px_hsl(var(--primary)/0.2)] p-8 mb-6 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {language === 'en' ? 'Order Receipt' : 'ऑर्डर पावती'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'en' ? 'Order Number' : 'ऑर्डर नंबर'}: <span className="font-mono text-primary font-bold">{orderData.order_number}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(orderData.created_at).toLocaleString()}
              </p>
            </div>

            <Separator className="my-6" />

            {/* Customer Details */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Customer Name' : 'ग्राहकाचे नाव'}</p>
                <p className="font-semibold">{orderData.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Phone Number' : 'फोन नंबर'}</p>
                <p className="font-semibold">{orderData.customer_phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Delivery Method' : 'डिलिव्हरी पद्धत'}</p>
                <p className="font-semibold">
                  {orderData.delivery_method === 'pickup' 
                    ? (language === 'en' ? 'Pickup' : 'पिकअप')
                    : (language === 'en' ? 'Home Delivery' : 'होम डिलिव्हरी')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Payment Method' : 'पेमेंट पद्धत'}</p>
                <p className="font-semibold">
                  {orderData.payment_method === 'cash'
                    ? (language === 'en' ? 'Cash' : 'रोख')
                    : (language === 'en' ? 'Online' : 'ऑनलाईन')}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 text-foreground">
                {language === 'en' ? 'Order Items' : 'ऑर्डर आयटम'}
              </h3>
              <div className="space-y-3">
                {orderData.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {language === 'en' ? item.item_name_en : item.item_name_mr}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Qty' : 'प्रमाण'}: {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-primary">₹{parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-2xl font-bold text-primary">
                <span>{language === 'en' ? 'Total' : 'एकूण'}</span>
                <span>₹{parseFloat(orderData.total).toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="lg"
              className="w-full border-primary hover:bg-primary/10"
            >
              <Download className="mr-2 h-5 w-5" />
              {language === 'en' ? 'Download Receipt' : 'पावती डाउनलोड करा'}
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Home className="mr-2 h-5 w-5" />
              {language === 'en' ? 'Place Another Order' : 'आणखी ऑर्डर द्या'}
            </Button>

            <Button
              onClick={() => window.location.href = 'tel:+919876543210'}
              variant="outline"
              size="lg"
              className="w-full border-primary hover:bg-primary/10"
            >
              <Phone className="mr-2 h-5 w-5" />
              {language === 'en' ? 'Call Hotel' : 'हॉटेलला कॉल करा'}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}