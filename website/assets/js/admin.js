/* =========================================================
   Sourced London admin panel logic.
   Views: #view-setup -> #view-login -> #view-app
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (v) => window.SourcedLondon.escapeHtml(v);

let supabase = null;

async function boot() {
  if (!window.SourcedLondon.isBackendConfigured()) {
    showView("setup");
    return;
  }
  supabase = window.SourcedLondon.getSupabase();
  if (!supabase) {
    showView("setup");
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (!data?.session) {
    showView("login");
    return;
  }
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    showView("login");
    $("#login-status").textContent = "Signed in, but this account isn't an admin yet (see Setup step 4).";
    $("#login-status").classList.add("visible", "err");
    return;
  }
  showView("app");
  loadDashboard();
  loadVehicles();
  loadTestimonials();
  loadEnquiries();
  loadCustomerLinks();
  loadMessageThreads();
  loadReservations();
  loadSettings();
  checkServices();
}

function showView(name) {
  ["setup", "login", "app"].forEach((v) => {
    const el = $(`#view-${v}`);
    if (el) el.hidden = v !== name;
  });
}

async function checkIsAdmin() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;
  const { data, error } = await supabase.from("admin_users").select("id").eq("id", userData.user.id).maybeSingle();
  return !error && !!data;
}

/* ---------- Setup ---------- */
$("#setup-save")?.addEventListener("click", async () => {
  const url = $("#setup-url").value.trim().replace(/\/+$/, "");
  const anonKey = $("#setup-key").value.trim();
  const status = $("#setup-status");
  const btn = $("#setup-save");
  status.classList.remove("ok", "err");

  if (!url || !anonKey) {
    status.textContent = "Both fields are required.";
    status.classList.add("visible", "err");
    return;
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    status.textContent = "That doesn't look like a Supabase project URL — it should look like https://xxxxx.supabase.co with nothing after it.";
    status.classList.add("visible", "err");
    return;
  }

  btn.disabled = true;
  status.textContent = "Testing connection…";
  status.classList.add("visible");

  try {
    const res = await fetch(`${url}/rest/v1/site_settings?select=key&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error("That key was rejected — make sure you copied the anon public key, not the service role key.");
    }
    if (res.status === 404) {
      throw new Error("Connected to the project, but the database tables don't exist yet — run supabase/schema.sql in your project's SQL Editor first, then try again.");
    }
    if (!res.ok) {
      throw new Error(`Unexpected response (HTTP ${res.status}) — double check the URL and key.`);
    }
    window.SourcedLondon.setBackendConfig({ url, anonKey });
    status.textContent = "Connected! Loading…";
    status.classList.add("ok");
    setTimeout(() => window.location.reload(), 500);
  } catch (err) {
    status.textContent = err instanceof Error ? err.message : "Couldn't reach that Supabase project — check the URL and key.";
    status.classList.add("err");
    btn.disabled = false;
  }
});

$("#reset-backend")?.addEventListener("click", () => {
  window.SourcedLondon.clearBackendConfig();
  window.location.reload();
});

/* ---------- Login ---------- */
$("#login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  const status = $("#login-status");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    status.textContent = error.message;
    status.classList.add("visible", "err");
    return;
  }
  window.location.reload();
});

$("#logout-btn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

/* ---------- Tabs ---------- */
$$(".admin-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".admin-tab").forEach((b) => b.classList.remove("active"));
    $$(".admin-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $(`#panel-${btn.dataset.tab}`).classList.add("active");
  });
});

/* ---------- Modals ---------- */
$$("[data-open-modal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.openModal;
    $(`#${name}-form`)?.reset();
    $(`#${name}-form input[name=id]`)?.setAttribute("value", "");
    $(`#modal-${name}`).hidden = false;
  });
});
$$("[data-close-modal]").forEach((btn) => btn.addEventListener("click", () => (btn.closest(".modal-overlay").hidden = true)));

/* ---------- Dashboard ---------- */
async function loadDashboard() {
  const [v, e, r, t] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);
  $("#stat-vehicles").textContent = v.count ?? "0";
  $("#stat-enquiries").textContent = e.count ?? "0";
  $("#stat-reservations").textContent = r.count ?? "0";
  $("#stat-testimonials").textContent = t.count ?? "0";
}

/* ---------- Vehicles ---------- */
async function loadVehicles() {
  const { data } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
  const body = $("#vehicles-body");
  body.innerHTML = (data || [])
    .map(
      (v) => `
    <tr data-id="${v.id}">
      <td><strong>${esc(v.make)}</strong> ${esc(v.model)}</td>
      <td>${esc(v.year || "–")}</td>
      <td>${v.price_poa || !v.price_gbp ? "POA" : "£" + Number(v.price_gbp).toLocaleString()}</td>
      <td><span class="badge badge-${v.status}">${v.status}</span></td>
      <td class="row-actions"><button data-edit>Edit</button><button data-delete>Delete</button></td>
    </tr>`
    )
    .join("");
  body.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    const vehicle = data.find((v) => v.id === id);
    row.querySelector("[data-edit]").addEventListener("click", () => openVehicleForm(vehicle));
    row.querySelector("[data-delete]").addEventListener("click", async () => {
      if (!confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return;
      await supabase.from("vehicles").delete().eq("id", id);
      loadVehicles();
      loadDashboard();
    });
  });
}

function openVehicleForm(v) {
  const form = $("#vehicle-form");
  form.reset();
  form.id.value = v.id;
  form.make.value = v.make;
  form.model.value = v.model;
  form.year.value = v.year || "";
  form.mileage.value = v.mileage || "";
  form.spec.value = v.spec || "";
  form.price_gbp.value = v.price_gbp || "";
  form.status.value = v.status;
  form.photo_url.value = (v.photos && v.photos[0]) || "";
  form.description.value = v.description || "";
  $("#modal-vehicle").hidden = false;
}

$("#vehicle-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const payload = {
    make: f.make.value.trim(),
    model: f.model.value.trim(),
    year: f.year.value ? Number(f.year.value) : null,
    mileage: f.mileage.value ? Number(f.mileage.value) : null,
    spec: f.spec.value.trim(),
    price_gbp: f.price_gbp.value ? Number(f.price_gbp.value) : null,
    price_poa: !f.price_gbp.value,
    status: f.status.value,
    photos: f.photo_url.value.trim() ? [f.photo_url.value.trim()] : [],
    description: f.description.value.trim(),
  };
  if (f.id.value) {
    await supabase.from("vehicles").update(payload).eq("id", f.id.value);
  } else {
    await supabase.from("vehicles").insert(payload);
  }
  $("#modal-vehicle").hidden = true;
  loadVehicles();
  loadDashboard();
});

$("#vehicle-ai-draft")?.addEventListener("click", async () => {
  const f = $("#vehicle-form");
  const specs = `${f.make.value} ${f.model.value}, ${f.year.value || ""}, ${f.mileage.value || ""} miles, spec: ${f.spec.value || "standard"}.`;
  const btn = $("#vehicle-ai-draft");
  btn.textContent = "Drafting…";
  try {
    const res = await window.SourcedLondon.callEdgeFunction("ai-proxy", { prompt: specs, mode: "admin_listing" });
    f.description.value = res.text;
  } catch (err) {
    alert("AI assistant isn't connected yet — see the Services tab.");
  }
  btn.textContent = "✦ Draft description with AI";
});

/* ---------- Testimonials ---------- */
async function loadTestimonials() {
  const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
  const body = $("#testimonials-body");
  body.innerHTML = (data || [])
    .map(
      (t) => `
    <tr data-id="${t.id}">
      <td>${esc(t.client_name)}</td>
      <td>${esc(t.vehicle_purchased || "–")}</td>
      <td><span class="badge ${t.is_published ? "badge-won" : "badge-lost"}">${t.is_published ? "Yes" : "No"}</span></td>
      <td class="row-actions"><button data-edit>Edit</button><button data-delete>Delete</button></td>
    </tr>`
    )
    .join("");
  body.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    const item = data.find((t) => t.id === id);
    row.querySelector("[data-edit]").addEventListener("click", () => openTestimonialForm(item));
    row.querySelector("[data-delete]").addEventListener("click", async () => {
      if (!confirm(`Delete testimonial from ${item.client_name}?`)) return;
      await supabase.from("testimonials").delete().eq("id", id);
      loadTestimonials();
      loadDashboard();
    });
  });
}

function openTestimonialForm(t) {
  const form = $("#testimonial-form");
  form.reset();
  form.id.value = t.id;
  form.client_name.value = t.client_name;
  form.vehicle_purchased.value = t.vehicle_purchased || "";
  form.photo_url.value = t.photo_url || "";
  form.quote.value = t.quote;
  form.is_published.checked = t.is_published;
  $("#modal-testimonial").hidden = false;
}

$("#testimonial-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const payload = {
    client_name: f.client_name.value.trim(),
    vehicle_purchased: f.vehicle_purchased.value.trim(),
    photo_url: f.photo_url.value.trim(),
    quote: f.quote.value.trim(),
    is_published: f.is_published.checked,
  };
  if (f.id.value) {
    await supabase.from("testimonials").update(payload).eq("id", f.id.value);
  } else {
    await supabase.from("testimonials").insert(payload);
  }
  $("#modal-testimonial").hidden = true;
  loadTestimonials();
  loadDashboard();
});

/* ---------- Enquiries ---------- */
async function loadEnquiries() {
  const { data } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
  const body = $("#enquiries-body");
  body.innerHTML = (data || [])
    .map(
      (e) => `
    <tr data-id="${e.id}">
      <td><span class="badge ${e.lead_type === "sell" ? "badge-pending" : "badge-won"}">${e.lead_type === "sell" ? "Selling" : "Buying"}</span></td>
      <td>${esc(e.name)}</td>
      <td>${esc([e.make, e.model].filter(Boolean).join(" ") || "–")}${e.vehicle_reg ? `<br><span style="color:var(--muted); font-size:0.75rem;">Reg: ${esc(e.vehicle_reg)}</span>` : ""}</td>
      <td>${esc(e.email)}<br><span style="color:var(--muted);">${esc(e.phone || "")}</span></td>
      <td>
        <select data-status style="background:var(--bg-alt); color:var(--ivory); border:1px solid var(--border-strong); border-radius:4px; padding:4px 8px;">
          ${["new", "contacted", "won", "lost"].map((s) => `<option value="${s}" ${s === e.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td class="row-actions"><button data-draft>✦ Draft Reply</button></td>
    </tr>`
    )
    .join("");
  body.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    const item = data.find((e) => e.id === id);
    row.querySelector("[data-status]").addEventListener("change", async (ev) => {
      await supabase.from("enquiries").update({ status: ev.target.value }).eq("id", id);
      loadDashboard();
    });
    row.querySelector("[data-draft]").addEventListener("click", async (ev) => {
      ev.target.textContent = "Drafting…";
      try {
        const prompt = `Enquiry from ${item.name} about ${item.make || ""} ${item.model || ""}. Budget: ${item.budget || "not given"}. Message: ${item.message || "none"}.`;
        const res = await window.SourcedLondon.callEdgeFunction("ai-proxy", { prompt, mode: "admin_reply" });
        $("#reply-text").value = res.text;
        $("#modal-reply").hidden = false;
      } catch (err) {
        alert("AI assistant isn't connected yet — see the Services tab.");
      }
      ev.target.textContent = "✦ Draft Reply";
    });
  });
}

/* ---------- Customer-saved links ("watching elsewhere") ---------- */
async function loadCustomerLinks() {
  const body = $("#customer-links-body");
  if (!body) return;
  const { data, error } = await supabase
    .from("customer_links")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });
  if (error) {
    body.innerHTML = `<tr><td colspan="4" style="color:var(--muted);">Nothing yet.</td></tr>`;
    return;
  }
  body.innerHTML = (data || [])
    .map(
      (l) => `
    <tr>
      <td>${esc(l.profiles?.full_name || "Customer")}</td>
      <td><a href="${esc(l.url)}" target="_blank" class="text-link">${esc(l.url)}</a></td>
      <td>${esc(l.note || "")}</td>
      <td>${new Date(l.created_at).toLocaleDateString()}</td>
    </tr>`
    )
    .join("") || `<tr><td colspan="4" style="color:var(--muted);">Nothing yet.</td></tr>`;
}

/* ---------- Messages (in-house chat with customers) ---------- */
let activeThreadUserId = null;

async function loadMessageThreads() {
  const container = $("#message-threads");
  if (!container) return;
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
  const byUser = new Map();
  (data || []).forEach((m) => {
    if (!byUser.has(m.user_id)) byUser.set(m.user_id, []);
    byUser.get(m.user_id).push(m);
  });

  const { data: profiles } = await supabase.from("profiles").select("id, full_name");
  const nameFor = (id) => profiles?.find((p) => p.id === id)?.full_name || id.slice(0, 8);

  container.innerHTML = Array.from(byUser.entries())
    .map(([userId, msgs]) => {
      const last = msgs[0];
      const unread = msgs.some((m) => m.sender_role === "customer" && !m.read_by_admin);
      return `
      <button class="admin-tab${userId === activeThreadUserId ? " active" : ""}" data-thread="${userId}" style="width:100%; text-align:left; border-left:2px solid ${unread ? "var(--gold)" : "transparent"};">
        <strong>${esc(nameFor(userId))}</strong>${unread ? " •" : ""}<br>
        <span style="font-size:0.75rem; color:var(--muted);">${esc(last.body.slice(0, 40))}</span>
      </button>`;
    })
    .join("") || `<p style="padding:16px; color:var(--muted);">No conversations yet.</p>`;

  container.querySelectorAll("[data-thread]").forEach((btn) => {
    btn.addEventListener("click", () => openMessageThread(btn.dataset.thread));
  });
}

async function openMessageThread(userId) {
  activeThreadUserId = userId;
  $("#message-thread-empty").hidden = true;
  $("#message-thread-view").hidden = false;
  await supabase.from("messages").update({ read_by_admin: true }).eq("user_id", userId).eq("sender_role", "customer");
  const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  const log = $("#message-log");
  log.innerHTML = (data || [])
    .map(
      (m) => `<div style="align-self:${m.sender_role === "admin" ? "flex-end" : "flex-start"}; max-width:80%; padding:8px 12px; border-radius:8px; background:${m.sender_role === "admin" ? "var(--gold-dim)" : "var(--surface-2)"}; color:var(--ivory);">${esc(m.body)}</div>`
    )
    .join("");
  log.scrollTop = log.scrollHeight;
  loadMessageThreads();
}

$("#message-reply-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#message-reply-input");
  const body = input.value.trim();
  if (!body || !activeThreadUserId) return;
  await supabase.from("messages").insert({ user_id: activeThreadUserId, sender_role: "admin", body });
  input.value = "";
  openMessageThread(activeThreadUserId);
});

/* ---------- Reservations ---------- */
async function loadReservations() {
  const { data } = await supabase
    .from("reservations")
    .select("*, vehicles(make, model)")
    .order("created_at", { ascending: false });
  const body = $("#reservations-body");
  body.innerHTML = (data || [])
    .map(
      (r) => `
    <tr data-id="${r.id}">
      <td>${r.vehicles ? esc(r.vehicles.make + " " + r.vehicles.model) : "–"}</td>
      <td>£${r.amount_gbp}</td>
      <td><span class="badge badge-${r.status}">${r.status}</span></td>
      <td class="row-actions">${r.status === "pending" ? '<button data-mark-paid>Mark Paid</button>' : ""}</td>
    </tr>`
    )
    .join("");
  body.querySelectorAll("[data-mark-paid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest("tr").dataset.id;
      await supabase.from("reservations").update({ status: "paid" }).eq("id", id);
      loadReservations();
      loadDashboard();
    });
  });
}

/* ---------- Settings ---------- */
async function loadSettings() {
  const { data } = await supabase.from("site_settings").select("key, value");
  const form = $("#settings-form");
  (data || []).forEach((row) => {
    if (form[row.key]) form[row.key].value = row.value || "";
  });
}

$("#settings-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const keys = [
    "brand_name", "owner_names", "email", "phone_display", "phone_intl", "whatsapp_intl", "address",
    "trustpilot_url", "google_reviews_url", "fca_number", "bvrla_number",
  ];
  const rows = keys.map((k) => ({ key: k, value: f[k].value.trim() }));
  await supabase.from("site_settings").upsert(rows);
  const status = $("#settings-status");
  status.textContent = "Saved.";
  status.classList.add("visible", "ok");
});

/* ---------- Vehicle reg lookup (used from the Vehicle modal) ---------- */
$("#vehicle-lookup-btn")?.addEventListener("click", async () => {
  const reg = $("#vehicle-reg-input").value.trim();
  const status = $("#vehicle-lookup-status");
  if (!reg) {
    status.textContent = "Enter a registration first.";
    return;
  }
  status.textContent = "Checking…";
  try {
    const data = await window.SourcedLondon.callEdgeFunction("vehicle-lookup", { registration: reg });
    const f = $("#vehicle-form");
    if (data.make) f.make.value = data.make;
    if (data.yearOfManufacture) f.year.value = data.yearOfManufacture;
    const bits = [data.colour, data.fuelType, data.motStatus ? `MOT: ${data.motStatus}` : null, data.taxStatus ? `Tax: ${data.taxStatus}` : null].filter(Boolean);
    status.textContent = bits.length ? bits.join(" · ") : "No details found.";
  } catch (err) {
    status.textContent = "Reg lookup isn't connected yet — see the Services tab.";
  }
});

/* ---------- Services status ---------- */
async function checkServices() {
  const cfg = window.SourcedLondon.getBackendConfig();
  for (const [fn, elId] of [["ai-proxy", "service-ai"], ["stripe-checkout", "service-stripe"], ["vehicle-lookup", "service-lookup"]]) {
    const el = $(`#${elId}`);
    try {
      const res = await fetch(window.SourcedLondon.functionUrl(fn), {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503 || (json.error || "").includes("not configured")) {
        el.textContent = "Not configured yet";
        el.classList.add("off");
      } else {
        el.textContent = "Reachable";
        el.classList.remove("off");
        el.classList.add("ok");
      }
    } catch {
      el.textContent = "Function not deployed yet";
      el.classList.add("off");
    }
  }
}

document.addEventListener("DOMContentLoaded", boot);
