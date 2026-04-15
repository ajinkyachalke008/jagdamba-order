import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Package, Clock, CheckCircle2, Loader2,
  RefreshCw, Lock, Search, ChevronDown, ChevronUp, Phone, MapPin,
  User, CreditCard, ShoppingBag, CalendarDays, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  item_name_en: string;
  item_name_mr: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
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
}

const ADMIN_PIN = 'ajinkya008';

const STATUS_FLOW = ['pending', 'preparing', 'completed'] as const;
type OrderStatus = typeof STATUS_FLOW[number];

const STATUS_CONFIG: Record<OrderStatus, { label: string; emoji: string; color: string; bg: string }> = {
  pending: { label: 'Pending', emoji: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-600 hover:bg-yellow-700' },
  preparing: { label: 'Preparing', emoji: '🍳', color: 'text-orange-400', bg: 'bg-orange-600 hover:bg-orange-700' },
  completed: { label: 'Completed', emoji: '✅', color: 'text-green-400', bg: 'bg-green-600 hover:bg-green-700' },
};

function getNextStatus(current: string | null): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf((current || 'pending') as OrderStatus);
  if (idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
  return null;
}

function getStatusConfig(status: string | null) {
  return STATUS_CONFIG[(status || 'pending') as OrderStatus] || STATUS_CONFIG.pending;
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'completed' | 'today'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    fetchOrders();

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    setLoadingItems(orderId);
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (!error && data) {
      setOrderItems(prev => ({ ...prev, [orderId]: data as unknown as OrderItem[] }));
    }
    setLoadingItems(null);
  };

  const toggleExpand = (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
    } else {
      setExpandedId(orderId);
      fetchOrderItems(orderId);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update order');
    } else {
      toast.success(`Order marked as ${status}`);
    }
    setUpdatingId(null);
  };

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
    } else {
      toast.error('Invalid PIN');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground">Enter PIN to access dashboard</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center text-xl tracking-widest h-14"
            />
            <Button onClick={handleLogin} className="w-full h-12 text-base">
              <Lock className="h-4 w-4 mr-2" /> Unlock Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compute stats
  const todayOrders = orders.filter(o => isToday(o.created_at));
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter(o => o.order_status !== 'completed' && o.order_status !== 'preparing').length;
  const preparingCount = orders.filter(o => o.order_status === 'preparing').length;
  const completedCount = orders.filter(o => o.order_status === 'completed').length;

  // Filter & search
  const filteredOrders = orders.filter(o => {
    if (filter === 'pending') return !o.order_status || o.order_status === 'pending';
    if (filter === 'preparing') return o.order_status === 'preparing';
    if (filter === 'completed') return o.order_status === 'completed';
    if (filter === 'today') return isToday(o.created_at);
    return true;
  }).filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q)
    );
  });

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Jagdamba Parcel • Real-time Orders</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-5 max-w-4xl">
        {/* Today's Highlight */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">Today's Summary</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-primary">{todayOrders.length}</p>
                <p className="text-xs text-muted-foreground">Orders Today</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">₹{todayRevenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Revenue Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All-time Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter('all')}>
            <CardContent className="p-3 flex items-center gap-3">
              <Package className="h-7 w-7 text-primary shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setFilter('pending')}>
            <CardContent className="p-3 flex items-center gap-3">
              <Clock className="h-7 w-7 text-yellow-500 shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-orange-500/50 transition-colors" onClick={() => setFilter('preparing')}>
            <CardContent className="p-3 flex items-center gap-3">
              <ShoppingBag className="h-7 w-7 text-orange-500 shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{preparingCount}</p>
                <p className="text-xs text-muted-foreground">Preparing</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setFilter('completed')}>
            <CardContent className="p-3 flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-green-500 shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Revenue */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">All-time Revenue</p>
                <p className="text-2xl font-bold text-primary">₹{totalRevenue.toFixed(0)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Avg per order</p>
              <p className="text-lg font-bold text-foreground">
                ₹{orders.length > 0 ? (totalRevenue / orders.length).toFixed(0) : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'today', 'pending', 'preparing', 'completed'] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize text-xs"
              >
                {f === 'today' ? '📅 Today' : f}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'Orders will appear here in real-time'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </p>
            {filteredOrders.map(order => {
              const statusConf = getStatusConfig(order.order_status);
              const nextStatus = getNextStatus(order.order_status);
              const isExpanded = expandedId === order.id;
              const items = orderItems[order.id];

              return (
                <Card key={order.id} className="overflow-hidden border-border hover:border-primary/30 transition-colors">
                  {/* Order Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono font-bold text-primary text-lg">{order.order_number}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{order.customer_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConf.bg}>
                          {statusConf.emoji} {statusConf.label}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(order.created_at)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {order.delivery_method === 'home_delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                        </Badge>
                      </div>
                      <p className="font-bold text-lg text-primary">₹{Number(order.total).toFixed(0)}</p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/30">
                      <div className="p-4 space-y-4">
                        {/* Customer Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                              {order.customer_phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {order.payment_method === 'cash' ? '💵 Cash on Delivery/Pickup' : '📱 Online Payment'}
                            </span>
                          </div>
                          {order.delivery_address && (
                            <div className="flex items-start gap-2 text-sm sm:col-span-2">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-foreground break-all">{order.delivery_address}</span>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" /> Order Items
                          </h4>
                          {loadingItems === order.id ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          ) : items && items.length > 0 ? (
                            <div className="space-y-2">
                              {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-background rounded-lg px-3 py-2">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{item.item_name_en}</p>
                                    <p className="text-xs text-muted-foreground">{item.item_name_mr}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">x{item.quantity} × ₹{Number(item.price).toFixed(0)}</p>
                                    <p className="text-sm font-bold text-primary">₹{Number(item.subtotal).toFixed(0)}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between items-center pt-2 px-3">
                                <span className="font-bold text-foreground">Total</span>
                                <span className="font-bold text-lg text-primary">₹{Number(order.total).toFixed(0)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No items found</p>
                          )}
                        </div>

                        <Separator />

                        {/* Status Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Status stepper */}
                          <div className="flex items-center gap-1 flex-1">
                            {STATUS_FLOW.map((s, i) => {
                              const conf = STATUS_CONFIG[s];
                              const currentIdx = STATUS_FLOW.indexOf((order.order_status || 'pending') as OrderStatus);
                              const isActive = i <= currentIdx;
                              return (
                                <div key={s} className="flex items-center gap-1">
                                  {i > 0 && <div className={`h-0.5 w-4 ${isActive ? 'bg-primary' : 'bg-muted'}`} />}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, s); }}
                                    disabled={updatingId === order.id}
                                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                      isActive
                                        ? 'bg-primary/20 text-primary font-medium'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    {conf.emoji} {conf.label}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick action */}
                          {nextStatus && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, nextStatus); }}
                              disabled={updatingId === order.id}
                              className="shrink-0"
                            >
                              {updatingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                              )}
                              Mark {STATUS_CONFIG[nextStatus].label}
                            </Button>
                          )}
                          {order.order_status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'pending'); }}
                              disabled={updatingId === order.id}
                            >
                              Reopen
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
