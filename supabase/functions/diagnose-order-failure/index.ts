import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PIN = Deno.env.get("ADMIN_PIN");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const diagnosisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    likely_cause: { type: "string" },
    category: {
      type: "string",
      enum: [
        "payment",
        "network",
        "backend",
        "menu_availability",
        "customer_input",
        "delivery",
        "device_or_app",
        "unknown",
      ],
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    explanation: { type: "string" },
    recovery_steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          step: { type: "string" },
          why: { type: "string" },
        },
        required: ["step", "why"],
      },
    },
    customer_message: { type: "string" },
    prevention_tip: { type: "string" },
    order_recoverable: { type: "boolean" },
  },
  required: [
    "likely_cause",
    "category",
    "confidence",
    "explanation",
    "recovery_steps",
    "customer_message",
    "prevention_tip",
    "order_recoverable",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ADMIN_PIN) return json({ error: "ADMIN_PIN not configured" }, 500);
    if (!LOVABLE_API_KEY) return json({ error: "AI is not configured yet." }, 500);

    const pin = req.headers.get("x-admin-pin") || "";
    if (pin !== ADMIN_PIN) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({})) as {
      order_number?: string;
      stage?: string;
      description?: string;
      error_message?: string;
      payment_method?: string;
      delivery_method?: string;
      device_info?: string;
    };

    if (!body.description || body.description.trim().length < 5) {
      return json({ error: "Please describe what went wrong." }, 400);
    }

    // Optional: pull the real order record for extra context.
    let orderContext = "No matching order record found in the system.";
    if (body.order_number?.trim()) {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { data } = await supabase
        .from("orders")
        .select(
          "order_number, customer_name, customer_phone, delivery_method, delivery_address, payment_method, payment_status, order_status, subtotal, total, created_at",
        )
        .eq("order_number", body.order_number.trim())
        .maybeSingle();
      if (data) {
        const { data: items } = await supabase
          .from("order_items")
          .select("item_name_en, quantity, price, subtotal")
          .eq("order_id", (data as Record<string, unknown>).id as string ?? "");
        orderContext = JSON.stringify({ order: data, items: items ?? [] });
      }
    }

    const prompt = [
      "You are the operations assistant for Hotel Jagdamba, a pure-vegetarian parcel/takeaway service in India.",
      "An order failed or went wrong. Diagnose the most likely cause and give the staff clear recovery steps.",
      "Be practical and specific to a small restaurant: staff use a phone/tablet admin dashboard, customers order online, payment is UPI (GPay/PhonePe) or cash, and orders are pickup or home delivery.",
      "Keep the customer_message polite, short, in simple English, ready to send on WhatsApp.",
      "Give between 2 and 5 recovery steps, ordered by what to do first. No markdown, plain sentences.",
      "",
      "Reported details:",
      `Stage where it failed: ${body.stage || "not specified"}`,
      `Order number: ${body.order_number || "not provided"}`,
      `Payment method: ${body.payment_method || "not specified"}`,
      `Delivery method: ${body.delivery_method || "not specified"}`,
      `Device / app info: ${body.device_info || "not specified"}`,
      `Error message shown: ${body.error_message || "none"}`,
      `Staff description: ${body.description}`,
      "",
      "Order record from the database:",
      orderContext,
    ].join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        store: false,
        text: {
          format: {
            type: "json_schema",
            name: "order_failure_diagnosis",
            strict: true,
            schema: diagnosisSchema,
          },
        },
      }),
    });

    if (!aiRes.ok || !aiRes.body) {
      const detail = await aiRes.text().catch(() => "");
      console.error("AI gateway error", aiRes.status, detail);
      if (aiRes.status === 429) {
        return json({ error: "AI is busy right now. Please try again in a moment." }, 429);
      }
      if (aiRes.status === 402) {
        return json({ error: "AI credits are exhausted. Please top up to keep using diagnosis." }, 402);
      }
      return json({ error: "Could not reach the AI service." }, aiRes.status || 500);
    }

    // Read the SSE stream and accumulate the output text.
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && !text) {
            text = evt.response?.output_text ?? "";
          }
        } catch {
          // ignore keepalive / partial frames
        }
      }
    }

    if (!text.trim()) {
      return json({ error: "The AI could not produce a diagnosis. Please add more detail and retry." }, 502);
    }

    let diagnosis: unknown;
    try {
      diagnosis = JSON.parse(text);
    } catch {
      return json({ error: "The AI reply could not be read. Please retry." }, 502);
    }

    return json({ diagnosis });
  } catch (e) {
    console.error("diagnose-order-failure error:", e);
    const msg = e instanceof Error ? e.message : "unknown error";
    return json({ error: msg }, 500);
  }
});
