import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Search, Package, Clock, CheckCircle2, Loader2, MapPin, Phone, User } from 'lucide-react';

interface OrderWithItems {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_method: string;
  delivery_address: string | null;
  payment_method: string;
  payment_status: string | null;
  order_status: string | null;
  subtotal: number;
  gst: number;
  total: number;
  created_at: string | null;
  items: Array<{
    id: string;
    item_name_en: string;
    item_name_mr: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package, color: 'text-primary' },
  { key: 'preparing', label: 'Preparing', icon: Clock, color: 'text-yellow-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
];

export default function TrackOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (searchParams.get('order')) {
      handleSearch(searchParams.get('order')!);
    }
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!order) return;
    const channel = supabase
      .channel(`track-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`,
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.id]);

  const handleSearch = async (num?: string) => {
    const searchNum = (num || orderNumber).trim().toUpperCase();
    if (!searchNum) return;

    setLoading(true);
    setSearched(true);

    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', searchNum)
      .maybeSingle();

    if (error || !orderData) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderData.id);

    setOrder({ ...orderData, items: items || [] });
    setLoading(false);
  };

  const getStatusIndex = (status: string | null) => {
    if (status === 'completed') return 2;
    if (status === 'preparing') return 1;
    return 0;
  };

  const currentStep = order ? getStatusIndex(order.order_status) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Track Your Order</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-lg space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Order Number (e.g. JGD-XXXX)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="font-mono"
              />
              <Button onClick={() => handleSearch()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {searched && !loading && !order && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-foreground">Order Not Found</p>
              <p className="text-sm text-muted-foreground mt-1">Please check your order number and try again</p>
            </CardContent>
          </Card>
        )}

        {order && !loading && (
          <>
            {/* Status Progress */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                  <Badge
                    className={order.order_status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}
                  >
                    {order.order_status === 'completed' ? '✅ Completed' : '⏳ In Progress'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentStep;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                        {i > 0 && (
                          <div className={`absolute top-5 right-1/2 w-full h-0.5 -z-10 ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                        )}
                        <div className={`rounded-full p-2 ${isActive ? 'bg-primary/20' : 'bg-muted'} transition-colors`}>
                          <StepIcon className={`h-5 w-5 ${isActive ? step.color : 'text-muted-foreground'}`} />
                        </div>
                        <span className={`text-xs mt-1 text-center ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{order.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {order.delivery_method === 'home_delivery' ? `Delivery: ${order.delivery_address || 'N/A'}` : 'Pickup from restaurant'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.item_name_en}</p>
                      <p className="text-xs text-muted-foreground">{item.item_name_mr}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">x{item.quantity}</p>
                      <p className="text-sm font-bold text-primary">₹{Number(item.subtotal).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-lg text-primary">₹{Number(order.total).toFixed(0)}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
