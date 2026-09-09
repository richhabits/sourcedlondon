/* =========================================================
   App waitlist form -> saved to the database (if connected)
   + WhatsApp fallback, same pattern as the other forms.
   ========================================================= */

document.getElementById("waitlist-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("waitlist-name").value.trim();
  const email = document.getElementById("waitlist-email").value.trim();
  const status = document.getElementById("waitlist-status");

  const supabase = window.SourcedLondon?.getSupabase();
  if (supabase) {
    await supabase.from("enquiries").insert({
      lead_type: "app_waitlist",
      name,
      email,
      message: "Joined the app waitlist",
    });
  }

  const cfg = window.SOURCEDLONDON_CONFIG || {};
  if (cfg.whatsappIntl) {
    const text = encodeURIComponent(`App waitlist signup\nName: ${name}\nEmail: ${email}`);
    window.open(`https://wa.me/${cfg.whatsappIntl}?text=${text}`, "_blank");
  }

  if (status) {
    status.textContent = "You're on the list — we'll be in touch when it's ready.";
    status.classList.add("visible", "ok");
  }
  document.getElementById("waitlist-form").reset();
});
