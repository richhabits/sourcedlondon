/* =========================================================
   Sell / Part-Exchange form: optional reg lookup (tax/MOT/basic
   vehicle data via the vehicle-lookup Edge Function), then submits
   as an enquiry with lead_type='sell' if a backend is connected —
   otherwise falls back to the same WhatsApp/email flow as Contact.
   ========================================================= */

let lastLookup = null;

document.getElementById("sell-lookup")?.addEventListener("click", async () => {
  const reg = document.getElementById("sell-reg").value.trim();
  const status = document.getElementById("sell-lookup-status");
  const resultBox = document.getElementById("sell-lookup-result");
  if (!reg) {
    status.textContent = "Enter a registration first.";
    return;
  }
  if (!window.Cleardrive || !window.Cleardrive.isBackendConfigured()) {
    status.textContent = "Reg checking isn't set up yet — you can still fill in the form manually.";
    return;
  }
  status.textContent = "Checking…";
  try {
    const data = await window.Cleardrive.callEdgeFunction("vehicle-lookup", { registration: reg });
    lastLookup = data;
    if (data.make) document.getElementById("sell-make").value = data.make;
    const lines = [
      data.make ? `Make: ${data.make}` : null,
      data.colour ? `Colour: ${data.colour}` : null,
      data.fuelType ? `Fuel: ${data.fuelType}` : null,
      data.yearOfManufacture ? `Year: ${data.yearOfManufacture}` : null,
      data.taxStatus ? `Tax: ${data.taxStatus}` : null,
      data.motStatus ? `MOT: ${data.motStatus}${data.motExpiryDate ? " (expires " + data.motExpiryDate + ")" : ""}` : null,
      data.motTests?.length ? `${data.motTests.length} MOT test(s) on record` : null,
    ].filter(Boolean);
    resultBox.style.display = "block";
    resultBox.textContent = lines.length ? lines.join(" · ") : "No details found for that reg.";
    status.textContent = "";
  } catch (err) {
    status.textContent = "Reg checking isn't set up yet — you can still fill in the form manually.";
  }
});

document.getElementById("sell-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const get = (id) => document.getElementById(id)?.value.trim() || "";
  const payload = {
    lead_type: "sell",
    name: get("sell-name"),
    email: get("sell-email"),
    phone: get("sell-phone"),
    make: get("sell-make"),
    model: get("sell-model"),
    budget: get("sell-budget"),
    message: get("sell-message"),
    vehicle_reg: get("sell-reg").toUpperCase(),
  };
  const sendVia = e.submitter ? e.submitter.dataset.send : "whatsapp";
  const status = document.getElementById("sell-form-status");

  const supabase = window.Cleardrive?.getSupabase();
  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("enquiries").insert({
      ...payload,
      user_id: userData?.user?.id || null,
      lookup_data: lastLookup || null,
    });
  }

  const lines = [
    `New Cleardrive SELL enquiry`,
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email}`,
    `Reg: ${payload.vehicle_reg || "-"}`,
    `Make/Model: ${[payload.make, payload.model].filter(Boolean).join(" ") || "-"}`,
    `Expected value: ${payload.budget || "-"}`,
    `Message: ${payload.message || "-"}`,
  ];
  const text = encodeURIComponent(lines.join("\n"));
  const cfg = window.CLEARDRIVE_CONFIG || {};

  if (sendVia === "email" && cfg.email) {
    window.location.href = `mailto:${cfg.email}?subject=${encodeURIComponent("Sell my car — Cleardrive")}&body=${text}`;
  } else if (cfg.whatsappIntl) {
    window.open(`https://wa.me/${cfg.whatsappIntl}?text=${text}`, "_blank");
  }

  if (status) {
    status.textContent = "Thanks — your details are on their way to Dre and Ferrell.";
    status.classList.add("visible", "ok");
  }
});
