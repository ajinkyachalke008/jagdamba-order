import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    if (!TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID is not configured');

    const orderData: OrderNotification = await req.json();
    console.log('Sending Telegram notification for order:', orderData.orderNumber);

    // Format the order items
    const itemsList = orderData.items.map(item => 
      `• ${item.nameEn} x ${item.quantity} - ₹${item.price * item.quantity}`
    ).join('\n');

    // Extract location link if present
    let addressText = orderData.deliveryAddress || '';
    let locationLink = '';
    
    if (orderData.deliveryAddress && orderData.deliveryAddress.includes('Location: ')) {
      const parts = orderData.deliveryAddress.split(' | Location: ');
      addressText = parts[0];
      locationLink = parts[1] || '';
    }

    // Create the notification message
    const message = `
🔔 *New Order Received!*

📋 *Order Number:* ${orderData.orderNumber}

👤 *Customer Details:*
• Name: ${orderData.customerName}
• Phone: ${orderData.customerPhone}

🛵 *Delivery:* ${orderData.deliveryMethod === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
${addressText ? `📍 Address: ${addressText}` : ''}
${locationLink ? `🗺️ [View Location on Maps](${locationLink})` : ''}

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
