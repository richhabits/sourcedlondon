/* =========================================================
   SOURCED LONDON — site config + behaviour
   Edit CONFIG below once you have real contact details.
   Everything on the site reads from this single object.
   ========================================================= */
window.SOURCEDLONDON_CONFIG = {
  brandName: "Sourced London",
  email: "enquiries@sourcedlondon.example", // TBC — replace with real inbox
  phoneDisplay: "+44 00 0000 0000", // TBC — replace with the number you'll use for the business
  phoneIntl: "440000000000", // digits only, no + or spaces, for tel: / wa.me links
  whatsappIntl: "440000000000", // joint business WhatsApp number, digits only
  address: "Address to be confirmed", // TBC
  ownerNames: "Dre & Ferrell",
};

document.addEventListener("DOMContentLoaded", () => {
  const cfg = window.SOURCEDLONDON_CONFIG;

  // ---- Inject contact placeholders wherever data-cfg is used ----
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const key = el.getAttribute("data-cfg");
    if (cfg[key] !== undefined) el.textContent = cfg[key];
  });
  document.querySelectorAll("[data-cfg-href]").forEach((el) => {
    const key = el.getAttribute("data-cfg-href");
    if (key === "tel") el.href = `tel:+${cfg.phoneIntl}`;
    if (key === "mailto") el.href = `mailto:${cfg.email}`;
    if (key === "whatsapp") el.href = `https://wa.me/${cfg.whatsappIntl}`;
  });

  // ---- Footer year ----
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // ---- Mobile nav toggle ----
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.textContent = open ? "✕" : "☰";
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.textContent = "☰";
      })
    );
  }

  // ---- Scroll reveal (no library, IntersectionObserver only) ----
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  // ---- Vehicle filter (Vehicles page) ----
  const makeFilter = document.getElementById("filter-make");
  const searchFilter = document.getElementById("filter-search");
  const vehicleCards = document.querySelectorAll("[data-make]");
  function applyVehicleFilter() {
    const makeVal = makeFilter ? makeFilter.value.toLowerCase() : "";
    const searchVal = searchFilter ? searchFilter.value.toLowerCase() : "";
    vehicleCards.forEach((card) => {
      const make = card.getAttribute("data-make").toLowerCase();
      const text = card.textContent.toLowerCase();
      const matchesMake = !makeVal || make === makeVal;
      const matchesSearch = !searchVal || text.includes(searchVal);
      card.style.display = matchesMake && matchesSearch ? "" : "none";
    });
  }
  if (makeFilter) makeFilter.addEventListener("change", applyVehicleFilter);
  if (searchFilter) searchFilter.addEventListener("input", applyVehicleFilter);

  // ---- Pre-fill enquiry form from "Enquire" links (?make=&model=) ----
  const params = new URLSearchParams(window.location.search);
  const makeField = document.getElementById("field-make");
  const modelField = document.getElementById("field-model");
  if (makeField && params.get("make")) makeField.value = params.get("make");
  if (modelField && params.get("model")) modelField.value = params.get("model");

  // ---- Enquiry form -> WhatsApp + mailto (no backend, no cost) ----
  const enquiryForm = document.getElementById("enquiry-form");
  if (enquiryForm) {
    enquiryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(enquiryForm).entries());
      const lines = [
        `New Sourced London enquiry`,
        `Name: ${data.name || "-"}`,
        `Phone: ${data.phone || "-"}`,
        `Email: ${data.email || "-"}`,
        `Make: ${data.make || "-"}`,
        `Model: ${data.model || "-"}`,
        `Budget: ${data.budget || "-"}`,
        `Message: ${data.message || "-"}`,
      ];
      const text = encodeURIComponent(lines.join("\n"));
      const status = document.getElementById("form-status");
      const sendVia = e.submitter ? e.submitter.dataset.send : "whatsapp";

      if (sendVia === "email") {
        window.location.href = `mailto:${cfg.email}?subject=${encodeURIComponent(
          "Sourced London vehicle enquiry"
        )}&body=${text}`;
      } else {
        window.open(`https://wa.me/${cfg.whatsappIntl}?text=${text}`, "_blank");
      }

      if (status) {
        status.textContent =
          sendVia === "email"
            ? "Opening your email app with the enquiry pre-filled…"
            : "Opening WhatsApp with your enquiry pre-filled…";
        status.classList.add("visible", "ok");
      }
    });
  }
});
