/* =========================================================
   "Save vehicle" button — adds a heart/save action to every
   vehicle card wherever this script is loaded. Requires the
   visitor to be signed in via account.html; otherwise it
   sends them there.
   ========================================================= */

async function saveVehicleToggle(vehicleId, btn) {
  const supabase = window.Cleardrive.getSupabase();
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    window.location.href = `account.html?save=${vehicleId}`;
    return;
  }
  const userId = userData.user.id;
  const { data: existing } = await supabase
    .from("saved_vehicles")
    .select("vehicle_id")
    .eq("user_id", userId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_vehicles").delete().eq("user_id", userId).eq("vehicle_id", vehicleId);
    btn.textContent = "☆ Save";
  } else {
    await supabase.from("saved_vehicles").insert({ user_id: userId, vehicle_id: vehicleId });
    btn.textContent = "★ Saved";
  }
}

function attachSaveButtons() {
  if (!window.Cleardrive || !window.Cleardrive.isBackendConfigured()) return;
  document.querySelectorAll(".vehicle-card[data-vehicle-id]").forEach((card) => {
    if (card.querySelector("[data-save-btn]")) return;
    const actions = card.querySelector(".vehicle-actions");
    if (!actions) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost";
    btn.dataset.saveBtn = "1";
    btn.textContent = "☆ Save";
    btn.addEventListener("click", () => saveVehicleToggle(card.dataset.vehicleId, btn));
    actions.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", attachSaveButtons);
document.addEventListener("cleardrive:vehicles-rendered", attachSaveButtons);
