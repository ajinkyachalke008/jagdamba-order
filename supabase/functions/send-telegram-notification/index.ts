import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderNotification {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  paymentMethod: string;
  items: Array<{
    nameEn: string;
    nameMr: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  gst: number;
  total: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderNotification = await req.json();
    console.log('Sending Telegram notification for order:', orderData.orderNumber);

    // Format the order items
    const itemsList = orderData.items.map(item => 
      `• ${item.nameEn} x ${item.quantity} - ₹${item.price * item.quantity}`
    ).join('\n');

    // Create the notification message
    const message = `
🔔 *New Order Received!*

📋 *Order Number:* ${orderData.orderNumber}

👤 *Customer Details:*
• Name: ${orderData.customerName}
• Phone: ${orderData.customerPhone}

🛵 *Delivery:* ${orderData.deliveryMethod === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
${orderData.deliveryAddress ? `📍 Address: ${orderData.deliveryAddress}` : ''}

💰 *Payment:* ${orderData.paymentMethod === 'cash' ? 'Cash on Delivery/Pickup' : 'Online Payment'}

🍽️ *Order Items:*
${itemsList}

💵 *Order Summary:*
• Subtotal: ₹${orderData.subtotal}
• GST (5%): ₹${orderData.gst}
• *Total: ₹${orderData.total}*

⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
`;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      throw new Error(result.description || 'Failed to send Telegram notification');
    }

    console.log('Telegram notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-telegram-notification function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
