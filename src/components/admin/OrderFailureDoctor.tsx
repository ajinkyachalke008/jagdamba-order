import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Stethoscope, Loader2, AlertTriangle, ListChecks, MessageSquare,
  ShieldCheck, Copy, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  pin: string;
}

interface Diagnosis {
  likely_cause: string;
  category: string;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
  recovery_steps: { step: string; why: string }[];
  customer_message: string;
  prevention_tip: string;
  order_recoverable: boolean;
}

const STAGES = [
  'Adding to cart',
  'Checkout form',
  'Placing order',
  'Payment (UPI / QR)',
  'Order confirmation screen',
  'Receipt / tracking',
  'Kitchen / preparation',
  'Delivery',
];

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-green-600/20 text-green-400 border-green-600/40',
  medium: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
  low: 'bg-red-600/20 text-red-400 border-red-600/40',
};

export const OrderFailureDoctor = ({ pin }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);

  const [orderNumber, setOrderNumber] = useState('');
  const [stage, setStage] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');

  const reset = () => {
    setResult(null);
    setOrderNumber('');
    setStage('');
    setDescription('');
    setErrorMessage('');
    setPaymentMethod('');
    setDeliveryMethod('');
    setDeviceInfo('');
  };

  const diagnose = async () => {
    if (description.trim().length < 5) {
      toast.error('Please describe what went wrong');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnose-order-failure`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          order_number: orderNumber,
          stage,
          description,
          error_message: errorMessage,
          payment_method: paymentMethod,
          delivery_method: deliveryMethod,
          device_info: deviceInfo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data.diagnosis as Diagnosis);
      toast.success('Diagnosis ready');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.customer_message);
      toast.success('Message copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <Card className="mb-6 border-primary/30 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Order Problem Doctor
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setOpen(o => !o)}>
            {open ? 'Hide' : 'Open'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Describe a failed order — AI finds the likely cause and gives you recovery steps.
        </p>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Order number (optional)"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
            />
            <Input
              placeholder="Error message shown (optional)"
              value={errorMessage}
              onChange={e => setErrorMessage(e.target.value)}
            />
            <Input
              placeholder="Payment: UPI / Cash / Card"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
            />
            <Input
              placeholder="Pickup or Home delivery"
              value={deliveryMethod}
              onChange={e => setDeliveryMethod(e.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Customer device / browser (optional)"
              value={deviceInfo}
              onChange={e => setDeviceInfo(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">Where did it fail?</p>
            <div className="flex flex-wrap gap-2">
              {STAGES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(stage === s ? '' : s)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    stage === s
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            rows={4}
            placeholder="What happened? e.g. Customer paid on PhonePe but the order never appeared in the dashboard."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="flex gap-2">
            <Button onClick={diagnose} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Diagnosing…
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Diagnose problem
                </>
              )}
            </Button>
            <Button variant="outline" onClick={reset} disabled={loading}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {result && (
            <div className="space-y-4 rounded-lg border border-primary/30 bg-background/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={CONFIDENCE_STYLE[result.confidence] || ''}>
                  {result.confidence} confidence
                </Badge>
                <Badge variant="outline">{result.category.replace(/_/g, ' ')}</Badge>
                <Badge
                  variant="outline"
                  className={
                    result.order_recoverable
                      ? 'border-green-600/40 bg-green-600/20 text-green-400'
                      : 'border-red-600/40 bg-red-600/20 text-red-400'
                  }
                >
                  {result.order_recoverable ? 'Order can be saved' : 'Order likely lost'}
                </Badge>
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  Likely cause
                </p>
                <p className="mt-1 text-sm">{result.likely_cause}</p>
                <p className="mt-1 text-xs text-muted-foreground">{result.explanation}</p>
              </div>

              <Separator />

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Recovery steps
                </p>
                <ol className="mt-2 space-y-2">
                  {result.recovery_steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                        {i + 1}
                      </span>
                      <span>
                        {s.step}
                        <span className="block text-xs text-muted-foreground">{s.why}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <Separator />

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Message for the customer
                </p>
                <p className="mt-1 rounded-md bg-muted/40 p-3 text-sm">{result.customer_message}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={copyMessage}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy message
                </Button>
              </div>

              <div className="flex gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>{result.prevention_tip}</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
