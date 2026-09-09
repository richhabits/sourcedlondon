/* =========================================================
   Progressive data loading for the public pages.
   Before setup: pages show their built-in placeholder HTML
   (so the template still looks finished, out of the box).
   After setup: this replaces that HTML with live data from
   the buyer's own Supabase project. No setup = no change.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.Cleardrive || !window.Cleardrive.isBackendConfigured()) return;
  const supabase = window.Cleardrive.getSupabase();
  if (!supabase) return;

  await Promise.all([applySiteSettings(supabase), applyVehicles(supabase), applyTestimonials(supabase)]);
});

async function applySiteSettings(supabase) {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error || !data) return;
  const map = Object.fromEntries(data.map((r) => [r.key, r.value]));

  const cfg = window.CLEARDRIVE_CONFIG || {};
  if (map.email) cfg.email = map.email;
  if (map.phone_display) cfg.phoneDisplay = map.phone_display;
  if (map.phone_intl) cfg.phoneIntl = map.phone_intl;
  if (map.whatsapp_intl) cfg.whatsappIntl = map.whatsapp_intl;
  if (map.address) cfg.address = map.address;
  if (map.owner_names) cfg.ownerNames = map.owner_names;
  if (map.brand_name) cfg.brandName = map.brand_name;
  window.CLEARDRIVE_CONFIG = cfg;

  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const key = el.getAttribute("data-cfg");
    if (cfg[key] !== undefined && cfg[key] !== "") el.textContent = cfg[key];
  });
  document.querySelectorAll("[data-cfg-href]").forEach((el) => {
    const key = el.getAttribute("data-cfg-href");
    if (key === "tel" && cfg.phoneIntl) el.href = `tel:+${cfg.phoneIntl}`;
    if (key === "mailto" && cfg.email) el.href = `mailto:${cfg.email}`;
    if (key === "whatsapp" && cfg.whatsappIntl) el.href = `https://wa.me/${cfg.whatsappIntl}`;
  });

  // Trust & Compliance — each element only appears once an admin has actually filled it in.
  const showIf = (elId, value, apply) => {
    const el = document.getElementById(elId);
    if (el && value) {
      apply(el, value);
      el.style.display = "";
    }
  };
  showIf("compliance-trustpilot", map.trustpilot_url, (el, v) => (el.href = v));
  showIf("compliance-google", map.google_reviews_url, (el, v) => (el.href = v));
  showIf("compliance-fca", map.fca_number, (el) => {});
  showIf("compliance-fca-num", map.fca_number, (el, v) => (el.textContent = v));
  showIf("compliance-bvrla", map.bvrla_number, (el) => {});
  showIf("compliance-bvrla-num", map.bvrla_number, (el, v) => (el.textContent = v));
}

function vehicleCardHTML(v) {
  const price = v.price_poa || !v.price_gbp ? "£ POA" : `£${Number(v.price_gbp).toLocaleString()}`;
  const photo = v.photos && v.photos[0];
  const media = photo
    ? `<img src="${photo}" alt="${v.make} ${v.model}" style="width:100%;height:100%;object-fit:cover;">`
    : `Vehicle photo<br>to be added`;
  return `
    <div class="vehicle-card reveal in" data-make="${v.make}" data-vehicle-id="${v.id}">
      <div class="vehicle-media">${media}</div>
      <div class="vehicle-body">
        <span class="make">${v.make}</span>
        <h3>${v.model}</h3>
        <div class="vehicle-meta"><span>${v.year || ""}</span><span>${v.mileage ? v.mileage.toLocaleString() + " mi" : ""}</span><span>${v.spec || ""}</span></div>
        <div class="vehicle-price">${price}</div>
        <div class="vehicle-actions">
          <a class="btn btn-ghost" href="contact.html?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}">Enquire</a>
          <a class="btn btn-whatsapp" data-cfg-href="whatsapp" href="#" target="_blank">WhatsApp</a>
        </div>
      </div>
    </div>`;
}

async function applyVehicles(supabase) {
  const grid = document.getElementById("vehicle-grid") || document.querySelector(".vehicle-card")?.closest(".grid");
  if (!grid) return;
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .neq("status", "sold")
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return;
  grid.innerHTML = data.map(vehicleCardHTML).join("");
  document.querySelectorAll("[data-cfg-href='whatsapp']").forEach((el) => {
    const cfg = window.CLEARDRIVE_CONFIG || {};
    if (cfg.whatsappIntl) el.href = `https://wa.me/${cfg.whatsappIntl}`;
  });
  document.dispatchEvent(new CustomEvent("cleardrive:vehicles-rendered"));
}

function testimonialCardHTML(t) {
  const shot = t.photo_url
    ? `<img src="${t.photo_url}" alt="${t.client_name}'s vehicle" style="width:100%;height:100%;object-fit:cover;border-radius:4px;">`
    : `Client's vehicle photo<br>to be added`;
  return `
    <div class="testimonial-card reveal in">
      <div class="testimonial-vehicle-shot">${shot}</div>
      <div class="testimonial-quote">"${t.quote}"</div>
      <div class="testimonial-person">
        <div class="avatar">${(t.client_name || "?").charAt(0)}</div>
        <div><strong>${t.client_name}</strong><div style="color:var(--muted); font-size:0.8rem;">Purchased: ${t.vehicle_purchased || ""}</div></div>
      </div>
    </div>`;
}

async function applyTestimonials(supabase) {
  const grids = document.querySelectorAll(".testimonial-card");
  if (!grids.length) return;
  const grid = grids[0].closest(".grid");
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return;
  grid.innerHTML = data.map(testimonialCardHTML).join("");
}
