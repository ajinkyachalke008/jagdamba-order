import { useEffect, useState } from 'react';

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderReceipt {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  orderType: string;
  items: ReceiptItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  orderTimestamp: string;
  status: string;
}

const Divider = () => (
  <p
    style={{
      fontFamily: "monospace, 'Courier New', Courier",
      fontSize: '13px',
      textAlign: 'center',
      color: '#1a1a1a',
      margin: '10px 0',
    }}
  >
    - - - - - - - - - - - - - - - - - -
  </p>
);

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${mon} ${year}  ${hours}:${mins} ${ampm}`;
}

export default function Receipt({ order }: { order: OrderReceipt }) {
  const [mounted, setMounted] = useState(false);
  const [totalFlash, setTotalFlash] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTotalFlash(true);
    const timer = setTimeout(() => setTotalFlash(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="receipt-card"
      style={{
        background: '#f8f8f4',
        maxWidth: '420px',
        width: '100%',
        borderRadius: '4px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        fontFamily: "monospace, 'Courier New', Courier",
        overflowY: 'auto',
        animation: mounted ? 'receiptSlideUp 0.5s ease-out' : undefined,
      }}
    >
      {/* 1. Header Band */}
      <div
        style={{
          height: '120px',
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            fontFamily: "monospace, 'Courier New', Courier",
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          JAGDAMBA PARCEL
        </span>
      </div>

      {/* 2. Sub Header */}
      <div style={{ padding: '14px 20px 0' }}>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#1a1a1a', margin: '0 0 4px' }}>
          Masur–Shamgaon Road, Masur
        </p>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#1a1a1a', margin: '0' }}>
          Tel: 8380809079 / 9860403842
        </p>
        <Divider />
      </div>

      {/* 3. Order Meta */}
      <div style={{ padding: '10px 20px' }}>
        {[
          { label: 'Date:', value: formatDate(order.orderTimestamp) },
          { label: 'Order:', value: order.orderId },
          { label: 'Name:', value: order.customerName },
          { label: 'Type:', value: order.orderType },
        ].map((row, i) => (
          <p key={i} style={{ fontSize: '14px', lineHeight: '28px', margin: 0, color: '#1a1a1a' }}>
            <strong>{row.label}</strong> {row.value}
          </p>
        ))}
        <Divider />
      </div>

      {/* 4. Line Items */}
      <div style={{ padding: '8px 20px' }}>
        {order.items.map((item, i) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              lineHeight: '36px',
              color: '#1a1a1a',
              animation: mounted ? `receiptItemFade 0.3s ease-out ${i * 50}ms both` : undefined,
            }}
          >
            <span>{item.name} × {item.quantity}</span>
            <span>₹{item.totalPrice.toFixed(2)}</span>
          </div>
        ))}
        <Divider />
      </div>

      {/* 5. Totals */}
      <div style={{ padding: '8px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', lineHeight: '32px', color: '#1a1a1a' }}>
          <span>Subtotal</span>
          <span>₹{order.subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', lineHeight: '32px', color: '#1a1a1a' }}>
          <span>Tax (5%)</span>
          <span>₹{order.taxAmount.toFixed(2)}</span>
        </div>
        <div style={{ height: '3px', background: '#1a1a1a', margin: '10px 0' }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '18px',
            fontWeight: 'bold',
            lineHeight: '40px',
            color: '#1a1a1a',
            background: totalFlash ? '#fffacd' : 'transparent',
            transition: 'background 0.4s ease',
            padding: '0 4px',
            borderRadius: '2px',
          }}
        >
          <span>TOTAL</span>
          <span>₹{order.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* 6. Footer */}
      <div style={{ padding: '14px 20px 24px' }}>
        <Divider />
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#1a1a1a', margin: '0 0 4px' }}>
          Thank you! Visit again. 🙏
        </p>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', margin: 0 }}>
          Masur–Shamgaon Road, Masur
        </p>
      </div>
    </div>
  );
}
