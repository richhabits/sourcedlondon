// Stripe Checkout session creator — TEST MODE by default.
// Keeps your Stripe secret key server-side; the browser only ever sees a checkout URL.
//
// Set the secret once after creating a free Stripe account (test keys need no business verification):
//   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
// Get test keys at https://dashboard.stripe.com/test/apikeys
//
// Deploy with:
//   supabase functions deploy stripe-checkout
//
// This creates a holding-deposit Checkout Session for a vehicle. It does NOT verify payment on
// return (no webhook) — the admin panel's Reservations tab is where you confirm a deposit landed
// in Stripe before marking a vehicle as reserved. Wiring a webhook is a natural phase-2 upgrade.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    // Checked first, before request-body validation, so a bare health-check ping
    // (used by the admin Services tab) gets an accurate "not configured" response
    // rather than a generic "missing fields" one.
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Payments not configured yet — set STRIPE_SECRET_KEY as a Supabase secret." }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { vehicle_id, amount_gbp, success_url, cancel_url } = await req.json();
    if (!vehicle_id || !amount_gbp || !success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: "Missing vehicle_id, amount_gbp, success_url or cancel_url." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    // This endpoint is reachable with just the public anon key, so bound the amount
    // and reject anything that isn't a real http(s) URL before it ever reaches Stripe
    // (a crafted success/cancel URL would otherwise be an open-redirect vector).
    if (typeof amount_gbp !== "number" || !Number.isFinite(amount_gbp) || amount_gbp < 1 || amount_gbp > 50000) {
      return new Response(JSON.stringify({ error: "amount_gbp must be a number between 1 and 50000." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    for (const url of [success_url, cancel_url]) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
      } catch {
        return new Response(JSON.stringify({ error: "success_url and cancel_url must be valid http(s) URLs." }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(jwt);
    const user = userData?.user;

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model")
      .eq("id", vehicle_id)
      .single();

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", success_url);
    params.set("cancel_url", cancel_url);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "gbp");
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(amount_gbp * 100)));
    params.set(
      "line_items[0][price_data][product_data][name]",
      `Holding deposit — ${vehicle?.make || "Vehicle"} ${vehicle?.model || ""}`.trim()
    );
    if (user?.email) params.set("customer_email", user.email);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      return new Response(JSON.stringify({ error: "Stripe error", detail: errBody }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const session = await stripeRes.json();

    await supabase.from("reservations").insert({
      vehicle_id,
      user_id: user?.id || null,
      stripe_session_id: session.id,
      amount_gbp,
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
