import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PIN = Deno.env.get("ADMIN_PIN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ADMIN_PIN) return json({ error: "ADMIN_PIN not configured" }, 500);

    const pin = req.headers.get("x-admin-pin") || "";
    if (pin !== ADMIN_PIN) {
      return json({ error: "Unauthorized" }, 401);
    }

    let body: {
      action?: string;
      order_id?: string;
      status?: string;
      item_id?: string;
      sold_out?: boolean;
      price?: number;
      original_price?: number | null;
      id?: string;
      name_en?: string;
      name_mr?: string;
      name_hi?: string | null;
      description_en?: string | null;
      description_mr?: string | null;
      description_hi?: string | null;
      category?: string;
      active?: boolean;
    } = {};
    try {
      body = await req.json();
    } catch {
      // GET-style call with no body
    }

    const action = body.action || "list";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (action === "list") {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ orders: data ?? [] });
    }

    if (action === "items") {
      if (!body.order_id) return json({ error: "order_id required" }, 400);
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", body.order_id);
      if (error) return json({ error: error.message }, 500);
      return json({ items: data ?? [] });
    }

    if (action === "all_items") {
      const { data, error } = await supabase
        .from("order_items")
        .select("*");
      if (error) return json({ error: error.message }, 500);
      return json({ items: data ?? [] });
    }

    if (action === "update_status") {
      if (!body.order_id || !body.status) {
        return json({ error: "order_id and status required" }, 400);
      }
      const allowed = ["pending", "preparing", "completed"];
      if (!allowed.includes(body.status)) {
        return json({ error: "invalid status" }, 400);
      }
      const { error } = await supabase
        .from("orders")
        .update({ order_status: body.status })
        .eq("id", body.order_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "availability_list") {
      const { data, error } = await supabase
        .from("menu_availability")
        .select("item_id, sold_out");
      if (error) return json({ error: error.message }, 500);
      return json({ availability: data ?? [] });
    }

    if (action === "set_availability") {
      if (!body.item_id || typeof body.sold_out !== "boolean") {
        return json({ error: "item_id and sold_out required" }, 400);
      }
      const { error } = await supabase
        .from("menu_availability")
        .upsert(
          { item_id: body.item_id, sold_out: body.sold_out, updated_at: new Date().toISOString() },
          { onConflict: "item_id" },
        );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "prices_list") {
      const { data, error } = await supabase.from("menu_prices").select("*");
      if (error) return json({ error: error.message }, 500);
      return json({ prices: data ?? [] });
    }

    if (action === "set_price") {
      if (!body.item_id || typeof body.price !== "number" || !isFinite(body.price) || body.price < 0) {
        return json({ error: "item_id and a valid price required" }, 400);
      }
      const { error } = await supabase
        .from("menu_prices")
        .upsert(
          {
            item_id: body.item_id,
            price: body.price,
            original_price: body.original_price ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "item_id" }
        );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "reset_price") {
      if (!body.item_id) return json({ error: "item_id required" }, 400);
      const { error } = await supabase
        .from("menu_prices")
        .delete()
        .eq("item_id", body.item_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "menu_add") {
      if (!body.name_en || !body.name_mr || typeof body.price !== "number" || !isFinite(body.price) || body.price < 0) {
        return json({ error: "English name, Marathi name and a valid price required" }, 400);
      }
      const row = {
        name_en: body.name_en.trim(),
        name_mr: body.name_mr.trim(),
        name_hi: body.name_hi?.trim() || null,
        description_en: body.description_en?.trim() || null,
        description_mr: body.description_mr?.trim() || null,
        description_hi: body.description_hi?.trim() || null,
        price: body.price,
        category: (body.category || "Special").trim() || "Special",
        active: body.active !== false,
      };
      const { data, error } = await supabase
        .from("custom_menu_items")
        .insert(row)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ item: data });
    }

    if (action === "menu_update") {
      if (!body.id) return json({ error: "id required" }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name_en?.trim()) patch.name_en = body.name_en.trim();
      if (body.name_mr?.trim()) patch.name_mr = body.name_mr.trim();
      if (body.name_hi !== undefined) patch.name_hi = body.name_hi?.trim() || null;
      if (body.description_en !== undefined) patch.description_en = body.description_en?.trim() || null;
      if (body.description_mr !== undefined) patch.description_mr = body.description_mr?.trim() || null;
      if (body.description_hi !== undefined) patch.description_hi = body.description_hi?.trim() || null;
      if (typeof body.price === "number" && isFinite(body.price) && body.price >= 0) patch.price = body.price;
      if (body.category?.trim()) patch.category = body.category.trim();
      if (typeof body.active === "boolean") patch.active = body.active;
      const { data, error } = await supabase
        .from("custom_menu_items")
        .update(patch)
        .eq("id", body.id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ item: data });
    }

    if (action === "menu_delete") {
      if (!body.id) return json({ error: "id required" }, 400);
      const { error } = await supabase
        .from("custom_menu_items")
        .delete()
        .eq("id", body.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "verify_pin") {
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("admin-orders error:", e);
    const msg = e instanceof Error ? e.message : "unknown error";
    return json({ error: msg }, 500);
  }
});
