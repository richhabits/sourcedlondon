// AI proxy — keeps your free AI API key secret on the server.
// Used by: the customer chat widget, and the admin "AI draft" buttons.
//
// Set the secret once after creating your Supabase project:
//   supabase secrets set GEMINI_API_KEY=your-free-key-here
// Get a free key at https://aistudio.google.com/app/apikey (no card required).
//
// Deploy with:
//   supabase functions deploy ai-proxy --no-verify-jwt

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are the Cleardrive concierge assistant on a luxury vehicle sales & sourcing website.
Be concise, warm, and low-pressure. Help visitors find a make/model, explain the enquiry process
(enquire -> we source -> we verify -> we deliver), and encourage them to leave their details on the
Contact page or via WhatsApp for anything specific. Never invent stock, prices, or availability you
were not given — if you don't know, say a team member will confirm by WhatsApp or email.`,
  admin_listing: `You write short, factual, tastefully understated luxury car listing copy (60-90 words)
from raw specs. No exclamation marks, no "amazing deal" language. Confident and precise.`,
  admin_reply: `You draft a short, polite, low-pressure reply to a customer vehicle enquiry on behalf
of Cleardrive's owners, Romeo and Dre. Confirm receipt, ask one clarifying question if useful, and
say a team member will follow up shortly by WhatsApp or email.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { prompt, mode = "chat", history = [] } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'prompt' string." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI assistant not configured yet — set GEMINI_API_KEY as a Supabase secret." }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const system = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
    const contents = [
      ...history.slice(-8).map((m: { role: string; text: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: prompt }] },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: "AI provider error", detail: errText }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ||
      "Sorry, I couldn't generate a response just then.";

    return new Response(JSON.stringify({ text }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
