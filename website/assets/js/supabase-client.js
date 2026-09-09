/* =========================================================
   Connection layer — reads the buyer's own Supabase project
   details (saved from the admin Setup tab) and exposes one
   shared client. Nothing here is one shared, central infrastructure —
   every deployed copy of this site points at its OWN backend.
   ========================================================= */

const CFG_KEY = "sourcedlondon_backend_config";

function getBackendConfig() {
  try {
    return JSON.parse(localStorage.getItem(CFG_KEY) || "null");
  } catch {
    return null;
  }
}

function setBackendConfig(cfg) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}

function clearBackendConfig() {
  localStorage.removeItem(CFG_KEY);
}

function isBackendConfigured() {
  const cfg = getBackendConfig();
  return !!(cfg && cfg.url && cfg.anonKey);
}

let _client = null;
function getSupabase() {
  const cfg = getBackendConfig();
  if (!cfg || !cfg.url || !cfg.anonKey) return null;
  if (_client && _client.__url === cfg.url) return _client;
  if (!window.supabase) return null; // CDN script not loaded on this page
  _client = window.supabase.createClient(cfg.url, cfg.anonKey);
  _client.__url = cfg.url;
  return _client;
}

function functionUrl(name) {
  const cfg = getBackendConfig();
  if (!cfg || !cfg.url) return null;
  // Supabase project URL is https://<ref>.supabase.co -> functions live at
  // https://<ref>.supabase.co/functions/v1/<name>
  return `${cfg.url.replace(/\/$/, "")}/functions/v1/${name}`;
}

async function callEdgeFunction(name, body) {
  const cfg = getBackendConfig();
  const url = functionUrl(name);
  if (!url) throw new Error("Backend not connected yet.");
  const supabase = getSupabase();
  let authToken = cfg.anonKey;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) authToken = data.session.access_token;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      apikey: cfg.anonKey,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

window.SourcedLondon = window.SourcedLondon || {};
Object.assign(window.SourcedLondon, {
  getBackendConfig,
  setBackendConfig,
  clearBackendConfig,
  isBackendConfigured,
  getSupabase,
  functionUrl,
  callEdgeFunction,
});
