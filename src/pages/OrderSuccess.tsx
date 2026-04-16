import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle, Download, Home, Phone, Loader2, Clock, Star, Search } from 'lucide-react';
import { generateReceiptPDF } from '@/lib/orderUtils';
import confetti from 'canvas-confetti';
import { useCart } from '@/contexts/CartContext';
import { t } from '@/lib/translations';
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

  if (!orderData) return null;

  const pointsEarned = Math.floor(parseFloat(orderData.total) / 10);
  const isDelivery = orderData.delivery_method !== 'pickup';

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
              {t('orderSuccess', language)}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('thankYou', language)}
            </p>
          </div>

          {/* Delivery Time & Loyalty Points Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-card border-border p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="font-bold text-foreground">{t('estimatedTime', language)}</p>
                <p className="text-sm text-primary font-semibold">
                  {isDelivery ? t('deliveryTime', language) : t('prepTime', language)}
                </p>
              </div>
            </Card>
            <Card className="bg-card border-border p-4 flex items-center gap-3">
              <Star className="h-8 w-8 text-primary fill-primary" />
              <div>
                <p className="font-bold text-foreground">{t('pointsEarned', language)}</p>
                <p className="text-sm text-primary font-semibold">+{pointsEarned} {t('loyaltyPoints', language)}</p>
              </div>
            </Card>
          </div>

          {/* Old-Style Thermal Receipt */}
          <div className="flex justify-center mb-6 animate-slide-up">
            <div
              style={{
                background: '#f5f0e8',
                maxWidth: '380px',
                width: '100%',
                fontFamily: "'Courier New', Courier, monospace",
                color: '#1a1a1a',
                padding: '24px 20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 0 60px rgba(0,0,0,0.03)',
                borderTop: '3px dashed #ccc',
                borderBottom: '3px dashed #ccc',
                position: 'relative',
              }}
            >
              {/* Torn edge top */}
              <div style={{
                position: 'absolute', top: '-6px', left: 0, right: 0, height: '6px',
                background: 'linear-gradient(135deg, #f5f0e8 33.33%, transparent 33.33%, transparent 66.67%, #f5f0e8 66.67%)',
                backgroundSize: '12px 6px',
              }} />

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '3px', margin: '0 0 2px' }}>
                  JAGDAMBA PARCEL
                </p>
                <p style={{ fontSize: '11px', margin: '0', opacity: 0.7 }}>Pure Vegetarian Parcel Service</p>
                <p style={{ fontSize: '11px', margin: '2px 0 0', opacity: 0.7 }}>Masur-Shamgaon Road, Masur</p>
                <p style={{ fontSize: '11px', margin: '2px 0 0', opacity: 0.7 }}>Tel: 8380809079 / 9860403842</p>
              </div>

              <p style={{ textAlign: 'center', fontSize: '12px', margin: '8px 0', letterSpacing: '2px' }}>
                ================================
              </p>

              {/* Order Info */}
              <div style={{ fontSize: '12px', lineHeight: '22px' }}>
                <p style={{ margin: 0 }}>Order #: {orderData.order_number}</p>
                <p style={{ margin: 0 }}>Date   : {new Date(orderData.created_at).toLocaleString()}</p>
                <p style={{ margin: 0 }}>Name   : {orderData.customer_name}</p>
                <p style={{ margin: 0 }}>Phone  : {orderData.customer_phone}</p>
                <p style={{ margin: 0 }}>Type   : {orderData.delivery_method === 'pickup' ? 'PICKUP' : 'DELIVERY'}</p>
                <p style={{ margin: 0 }}>Pay    : {orderData.payment_method === 'cash' ? 'CASH' : 'ONLINE'}</p>
              </div>

              <p style={{ textAlign: 'center', fontSize: '12px', margin: '8px 0', letterSpacing: '2px' }}>
                --------------------------------
              </p>

              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                <span>ITEM</span>
                <span>QTY</span>
                <span>AMT</span>
              </div>
              <p style={{ fontSize: '12px', margin: '0 0 4px', letterSpacing: '2px' }}>--------------------------------</p>

              {/* Items */}
              {orderData.items.map((item: any, index: number) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', lineHeight: '24px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                    {language === 'en' ? item.item_name_en : item.item_name_mr}
                  </span>
                  <span style={{ width: '40px', textAlign: 'center' }}>{item.quantity}</span>
                  <span style={{ width: '70px', textAlign: 'right' }}>₹{parseFloat(item.subtotal).toFixed(2)}</span>
                </div>
              ))}

              <p style={{ fontSize: '12px', margin: '8px 0', letterSpacing: '2px' }}>
                ================================
              </p>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', padding: '4px 0' }}>
                <span>TOTAL</span>
                <span>₹{parseFloat(orderData.total).toFixed(2)}</span>
              </div>

              <p style={{ fontSize: '12px', margin: '8px 0', letterSpacing: '2px' }}>
                ================================
              </p>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '8px', lineHeight: '20px' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>*** THANK YOU! ***</p>
                <p style={{ margin: '4px 0 0', opacity: 0.6 }}>Visit Again 🙏</p>
                <p style={{ margin: '2px 0 0', opacity: 0.5, fontSize: '10px' }}>Hotel Jagdamba - Since Day One</p>
              </div>

              {/* Torn edge bottom */}
              <div style={{
                position: 'absolute', bottom: '-6px', left: 0, right: 0, height: '6px',
                background: 'linear-gradient(45deg, #f5f0e8 33.33%, transparent 33.33%, transparent 66.67%, #f5f0e8 66.67%)',
                backgroundSize: '12px 6px',
              }} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="lg"
              className="w-full border-primary hover:bg-primary/10"
            >
              <Download className="mr-2 h-5 w-5" />
              {t('downloadReceipt', language)}
            </Button>
            
            <Button
              onClick={() => navigate(`/track-order?order=${orderData.order_number}`)}
              variant="outline"
              size="lg"
              className="w-full border-primary hover:bg-primary/10"
            >
              <Search className="mr-2 h-5 w-5" />
              Track Order
            </Button>

            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Home className="mr-2 h-5 w-5" />
              {t('placeAnotherOrder', language)}
            </Button>

            <Button
              onClick={() => window.location.href = 'tel:+918380809079'}
              variant="outline"
              size="lg"
              className="w-full border-primary hover:bg-primary/10"
            >
              <Phone className="mr-2 h-5 w-5" />
              {t('callHotel', language)}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
