// AI proxy — rotates across whichever FREE-TIER providers you've configured, so no
// single provider's free quota is a single point of failure. Configure one, two, or
// all three secrets below; the function spreads requests across whatever's set and
// automatically falls back to the next provider if one errors or hits its rate limit.
// Your key(s) never touch the browser — only this server-side function sees them.
//
//   supabase secrets set GEMINI_API_KEY=...      # https://aistudio.google.com/app/apikey      (free, no card)
//   supabase secrets set GROQ_API_KEY=...        # https://console.groq.com/keys               (free, no card)
//   supabase secrets set OPENROUTER_API_KEY=...  # https://openrouter.ai/keys — use their ":free" models (free, no card)
//
// Deploy with:
//   supabase functions deploy ai-proxy --no-verify-jwt

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are the Sourced London concierge assistant on a luxury vehicle sales & sourcing website.
Be concise, warm, and low-pressure. Help visitors find a make/model, explain the enquiry process
(enquire -> we source -> we verify -> we deliver), and encourage them to leave their details on the
Contact page or via WhatsApp for anything specific. Never invent stock, prices, or availability you
were not given — if you don't know, say a team member will confirm by WhatsApp or email.`,
  admin_listing: `You write short, factual, tastefully understated luxury car listing copy (60-90 words)
from raw specs. No exclamation marks, no "amazing deal" language. Confident and precise.`,
  admin_reply: `You draft a short, polite, low-pressure reply to a customer vehicle enquiry on behalf
of Sourced London's owners, Dre and Ferrell. Confirm receipt, ask one clarifying question if useful, and
say a team member will follow up shortly by WhatsApp or email.`,
};

type ChatMsg = { role: string; text: string };

function toOpenAIMessages(system: string, history: ChatMsg[], prompt: string) {
  return [
    { role: "system", content: system },
    ...history.slice(-8).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
    { role: "user", content: prompt },
  ];
}

async function callGemini(system: string, history: ChatMsg[], prompt: string, apiKey: string) {
  const contents = [
    ...history.slice(-8).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
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
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("");
  if (!text) throw new Error("gemini: empty response");
  return text;
}

async function callGroq(system: string, history: ChatMsg[], prompt: string, apiKey: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: toOpenAIMessages(system, history, prompt),
      temperature: 0.6,
      max_tokens: 400,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("groq: empty response");
  return text;
}

async function callOpenRouter(system: string, history: ChatMsg[], prompt: string, apiKey: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: toOpenAIMessages(system, history, prompt),
      temperature: 0.6,
      max_tokens: 400,
    }),
  });
  if (!res.ok) throw new Error(`openrouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("openrouter: empty response");
  return text;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
    const system = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;

    const providers: Array<() => Promise<string>> = [];
    const gemini = Deno.env.get("GEMINI_API_KEY");
    const groq = Deno.env.get("GROQ_API_KEY");
    const openrouter = Deno.env.get("OPENROUTER_API_KEY");
    if (gemini) providers.push(() => callGemini(system, history, prompt, gemini));
    if (groq) providers.push(() => callGroq(system, history, prompt, groq));
    if (openrouter) providers.push(() => callOpenRouter(system, history, prompt, openrouter));

    if (providers.length === 0) {
      return new Response(
        JSON.stringify({
          error: "AI assistant not configured yet — set one of GEMINI_API_KEY, GROQ_API_KEY or OPENROUTER_API_KEY as a Supabase secret.",
        }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const order = shuffle(providers); // spreads load across whichever free tiers are configured
    const errors: string[] = [];
    for (const call of order) {
      try {
        const text = await call();
        return new Response(JSON.stringify({ text }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } catch (err) {
        errors.push(String(err));
      }
    }

    return new Response(JSON.stringify({ error: "All configured AI providers failed.", detail: errors }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
