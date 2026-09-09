// UK number-plate lookup — free government APIs, no per-lookup cost.
// Used by: the admin "look up a reg" button when adding a vehicle, and the
// "Sell / Part-Exchange Your Car" form (pre-fills make/colour/fuel + MOT/tax status).
//
// Two independent, optional data sources — set either or both:
//
// Source 1 - DVLA Vehicle Enquiry Service (tax status, basic vehicle data):
//    Register free at https://register-for-vehicle-enquiry-service.dvla.gov.uk
//      supabase secrets set DVLA_API_KEY=...
//
// Source 2 - DVSA MOT History API (full test history, advisories, mileage):
//    Register free at https://documentation.history.mot.api.gov.uk
//    (Azure AD app + API key — DVSA's signup walks you through it.)
//      supabase secrets set DVSA_MOT_CLIENT_ID=...
//      supabase secrets set DVSA_MOT_CLIENT_SECRET=...
//      supabase secrets set DVSA_MOT_API_KEY=...
//    The token URL/scope below are DVSA's published values at the time this was
//    written — if auth starts failing, check https://documentation.history.mot.api.gov.uk
//    for updates and override via the two secrets below if DVSA has changed them:
//      supabase secrets set DVSA_MOT_TOKEN_URL=...
//      supabase secrets set DVSA_MOT_SCOPE=...
//
// Deploy with:
//   supabase functions deploy vehicle-lookup

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MOT_TOKEN_URL =
  "https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token";
const DEFAULT_MOT_SCOPE = "https://tapi.dvsa.gov.uk/.default";

async function lookupDvla(reg: string, apiKey: string) {
  const res = await fetch("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ registrationNumber: reg }),
  });
  if (!res.ok) throw new Error(`DVLA ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return {
    make: d.make,
    colour: d.colour,
    fuelType: d.fuelType,
    engineCapacity: d.engineCapacity,
    co2Emissions: d.co2Emissions,
    yearOfManufacture: d.yearOfManufacture,
    taxStatus: d.taxStatus,
    taxDueDate: d.taxDueDate,
    motStatus: d.motStatus,
    motExpiryDate: d.motExpiryDate,
  };
}

async function getMotToken(clientId: string, clientSecret: string, apiKey: string) {
  const tokenUrl = Deno.env.get("DVSA_MOT_TOKEN_URL") || DEFAULT_MOT_TOKEN_URL;
  const scope = Deno.env.get("DVSA_MOT_SCOPE") || DEFAULT_MOT_SCOPE;
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`DVSA token ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

async function lookupMotHistory(reg: string, clientId: string, clientSecret: string, apiKey: string) {
  const token = await getMotToken(clientId, clientSecret, apiKey);
  const res = await fetch(
    `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(reg)}`,
    { headers: { Authorization: `Bearer ${token}`, "x-api-key": apiKey } }
  );
  if (!res.ok) throw new Error(`DVSA MOT history ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return {
    motTests: (d.motTests || []).slice(0, 10).map((t: Record<string, unknown>) => ({
      completedDate: t.completedDate,
      testResult: t.testResult,
      odometerValue: t.odometerValue,
      odometerUnit: t.odometerUnit,
      defects: (t.defects as Array<{ text: string }> | undefined)?.map((x) => x.text) || [],
    })),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    // Checked first, before request-body validation, so a bare health-check ping
    // (used by the admin Services tab) gets an accurate "not configured" response
    // rather than a generic "invalid registration" one.
    const dvlaKey = Deno.env.get("DVLA_API_KEY");
    const motClientId = Deno.env.get("DVSA_MOT_CLIENT_ID");
    const motClientSecret = Deno.env.get("DVSA_MOT_CLIENT_SECRET");
    const motApiKey = Deno.env.get("DVSA_MOT_API_KEY");

    if (!dvlaKey && !(motClientId && motClientSecret && motApiKey)) {
      return new Response(
        JSON.stringify({
          error: "Vehicle lookup not configured yet — set DVLA_API_KEY and/or the DVSA_MOT_* secrets.",
        }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { registration } = await req.json();
    const reg = (registration || "").toString().replace(/\s+/g, "").toUpperCase();
    // UK plates are at most 7 characters; reject anything else outright rather than
    // forwarding junk to DVLA/DVSA (this endpoint is reachable with just the anon key).
    if (!reg || !/^[A-Z0-9]{2,7}$/.test(reg)) {
      return new Response(JSON.stringify({ error: "Enter a valid UK registration." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const result: Record<string, unknown> = { registration: reg };
    const errors: string[] = [];

    if (dvlaKey) {
      try {
        Object.assign(result, await lookupDvla(reg, dvlaKey));
      } catch (err) {
        errors.push(String(err));
      }
    }
    if (motClientId && motClientSecret && motApiKey) {
      try {
        Object.assign(result, await lookupMotHistory(reg, motClientId, motClientSecret, motApiKey));
      } catch (err) {
        errors.push(String(err));
      }
    }

    if (Object.keys(result).length <= 1) {
      return new Response(JSON.stringify({ error: "Lookup failed for that registration.", detail: errors }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
