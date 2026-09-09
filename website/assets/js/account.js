/* =========================================================
   Customer account: signup/login, dashboard, saved vehicles,
   enquiry tracking, and test-mode deposit payments.
   ========================================================= */

const $ = (sel) => document.querySelector(sel);
let supabase = null;
let mode = "signin"; // or "signup"

async function boot() {
  if (!window.SourcedLondon.isBackendConfigured()) {
    $("#backend-warning").hidden = false;
    return;
  }
  supabase = window.SourcedLondon.getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data?.session) {
    showDashboard();
  } else {
    $("#view-auth").hidden = false;
  }
}

$("#auth-toggle-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  mode = mode === "signin" ? "signup" : "signin";
  $("#auth-mode-label").textContent = mode === "signin" ? "Sign In" : "Create Account";
  $("#auth-submit").textContent = mode === "signin" ? "Sign In" : "Create Account";
  $("#field-fullname").hidden = mode !== "signup";
  $("#auth-toggle-text").textContent = mode === "signin" ? "Don't have an account?" : "Already have an account?";
  $("#auth-toggle-link").textContent = mode === "signin" ? "Create one" : "Sign in";
});

$("#auth-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  const status = $("#auth-status");
  status.className = "form-status";

  if (mode === "signup") {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: $("#auth-name").value.trim() } },
    });
    if (error) {
      status.textContent = error.message;
      status.classList.add("visible", "err");
      return;
    }
    status.textContent = "Account created — check your email to confirm, then sign in.";
    status.classList.add("visible", "ok");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    status.textContent = error.message;
    status.classList.add("visible", "err");
    return;
  }
  window.location.reload();
});

async function showDashboard() {
  $("#view-dashboard").hidden = false;
  $("#view-dashboard-body").hidden = false;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  $("#dash-name").textContent = profile?.full_name ? `Hi, ${profile.full_name}` : `Hi, ${user.email}`;

  loadMyEnquiries(user.id, user.email);
  loadMySaved(user.id);
  loadMyReservations(user.id);
  loadMyLinks(user.id);
  loadMyMessages(user.id);
}

$("#dash-logout")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

async function loadMyEnquiries(userId, email) {
  const { data } = await supabase
    .from("enquiries")
    .select("*")
    .or(`user_id.eq.${userId},email.eq.${email}`)
    .order("created_at", { ascending: false });
  $("#my-enquiries").innerHTML = (data || [])
    .map(
      (e) => `<tr><td>${[e.make, e.model].filter(Boolean).join(" ") || "General enquiry"}</td><td><span class="badge badge-${e.status}">${e.status}</span></td><td>${new Date(e.created_at).toLocaleDateString()}</td></tr>`
    )
    .join("") || `<tr><td colspan="3" style="color:var(--muted);">No enquiries yet — visit the <a href="vehicles.html" class="text-link">Vehicles page</a> to start one.</td></tr>`;
}

async function loadMySaved(userId) {
  const { data } = await supabase.from("saved_vehicles").select("vehicle_id, vehicles(*)").eq("user_id", userId);
  const grid = $("#my-saved");
  if (!data || data.length === 0) {
    grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1;">Nothing saved yet.</p>`;
    return;
  }
  grid.innerHTML = data
    .map(({ vehicles: v }) => {
      if (!v) return "";
      const price = v.price_poa || !v.price_gbp ? "£ POA" : `£${Number(v.price_gbp).toLocaleString()}`;
      return `
      <div class="vehicle-card">
        <div class="vehicle-media">${v.photos?.[0] ? `<img src="${v.photos[0]}" style="width:100%;height:100%;object-fit:cover;">` : "Photo to be added"}</div>
        <div class="vehicle-body">
          <span class="make">${v.make}</span><h3>${v.model}</h3>
          <div class="vehicle-price">${price}</div>
          <div class="vehicle-actions">
            <button class="btn btn-primary" data-reserve="${v.id}" data-amount="${v.price_gbp ? Math.round(v.price_gbp * 0.05) : 500}">Reserve (test deposit)</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
  grid.querySelectorAll("[data-reserve]").forEach((btn) => {
    btn.addEventListener("click", () => startReservation(btn.dataset.reserve, Number(btn.dataset.amount)));
  });
}

async function startReservation(vehicleId, amount) {
  try {
    const res = await window.SourcedLondon.callEdgeFunction("stripe-checkout", {
      vehicle_id: vehicleId,
      amount_gbp: amount,
      success_url: window.location.origin + window.location.pathname + "?reserved=1",
      cancel_url: window.location.href,
    });
    window.location.href = res.url;
  } catch (err) {
    alert("Payments aren't connected yet — an admin needs to finish Stripe setup (see admin.html Services tab).");
  }
}

async function loadMyReservations(userId) {
  const { data } = await supabase.from("reservations").select("*, vehicles(make, model)").eq("user_id", userId).order("created_at", { ascending: false });
  $("#my-reservations").innerHTML = (data || [])
    .map(
      (r) => `<tr><td>${r.vehicles ? r.vehicles.make + " " + r.vehicles.model : "–"}</td><td>£${r.amount_gbp}</td><td><span class="badge badge-${r.status}">${r.status}</span></td></tr>`
    )
    .join("") || `<tr><td colspan="3" style="color:var(--muted);">No reservations yet.</td></tr>`;
}

/* ---------- Saved links ("seen elsewhere") ---------- */
async function loadMyLinks(userId) {
  const { data } = await supabase.from("customer_links").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  const body = $("#my-links");
  if (!body) return;
  body.innerHTML = (data || [])
    .map(
      (l) => `<tr data-id="${l.id}"><td><a href="${l.url}" target="_blank" class="text-link">${l.url.slice(0, 50)}</a></td><td>${l.note || ""}</td><td class="row-actions"><button data-remove-link>Remove</button></td></tr>`
    )
    .join("") || `<tr><td colspan="3" style="color:var(--muted);">Nothing saved yet.</td></tr>`;
  body.querySelectorAll("[data-remove-link]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await supabase.from("customer_links").delete().eq("id", btn.closest("tr").dataset.id);
      loadMyLinks(userId);
    });
  });
}

document.getElementById("link-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { data: userData } = await supabase.auth.getUser();
  const url = document.getElementById("link-url").value.trim();
  const note = document.getElementById("link-note").value.trim();
  if (!url) return;
  await supabase.from("customer_links").insert({ user_id: userData.user.id, url, note });
  document.getElementById("link-form").reset();
  loadMyLinks(userData.user.id);
});

/* ---------- Messages (in-house chat with the brand) ---------- */
async function loadMyMessages(userId) {
  await supabase.from("messages").update({ read_by_customer: true }).eq("user_id", userId).eq("sender_role", "admin");
  const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  const log = $("#my-message-log");
  if (!log) return;
  log.innerHTML = (data || [])
    .map(
      (m) => `<div style="align-self:${m.sender_role === "customer" ? "flex-end" : "flex-start"}; max-width:80%; padding:8px 12px; border-radius:8px; background:${m.sender_role === "customer" ? "var(--gold-dim)" : "var(--surface-2)"}; color:var(--ivory);">${m.body}</div>`
    )
    .join("") || `<p style="color:var(--muted);">No messages yet — say hello.</p>`;
  log.scrollTop = log.scrollHeight;
}

document.getElementById("my-message-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { data: userData } = await supabase.auth.getUser();
  const input = document.getElementById("my-message-input");
  const body = input.value.trim();
  if (!body) return;
  await supabase.from("messages").insert({ user_id: userData.user.id, sender_role: "customer", body });
  input.value = "";
  loadMyMessages(userData.user.id);
});

document.addEventListener("DOMContentLoaded", boot);
