import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ReceiptComponent, { type OrderReceipt } from '@/components/Receipt';

export default function ReceiptPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as OrderReceipt | undefined;

  useEffect(() => {
    if (order) {
      localStorage.setItem('jagdamba_last_order', order.orderId);
    }
  }, [order]);

  if (!order) {
    return (
      <div
        style={{
          background: '#e5e5e5',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: "monospace, 'Courier New', Courier",
        }}
      >
        <p style={{ fontSize: '16px', color: '#1a1a1a', marginBottom: '16px' }}>
          No order found. Please place an order first.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          🏠 Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#e5e5e5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <ReceiptComponent order={order} />

      {/* Action Buttons */}
      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          gap: '16px',
          width: '100%',
          maxWidth: '420px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => window.print()}
          style={{
            flex: '1 1 180px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          🖨️ Print / Save Receipt
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            flex: '1 1 180px',
            background: 'transparent',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          🏠 Back to Menu
        </button>
      </div>
    </div>
  );
}
