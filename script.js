// Theme toggle (persisted locally per browser)
(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = null;
  try {
    stored = localStorage.getItem("kayal-theme");
  } catch (e) {}
  var prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  var initial = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);
  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      initial === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      toggle.setAttribute(
        "aria-label",
        next === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
      try {
        localStorage.setItem("kayal-theme", next);
      } catch (e) {}
    });
  }
})();

// Tabs: City & Airport <-> Tour Package
document.querySelectorAll(".tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".panel").forEach(function (p) {
      p.classList.remove("active");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

// --- WhatsApp booking alerts via WhatsApp's own click-to-chat link ---
// No bot, no API key, no backend — just fill in your business WhatsApp number below.
const WHATSAPP_BUSINESS_NUMBER = "916282146726"; // <-- your number, country code first, digits only (no + or spaces)

function sendBookingToWhatsApp(payload) {
  var text =
    payload.kind === "transfer"
      ? "New transfer booking request:\nPickup: " +
        payload.pickup +
        "\nDrop: " +
        payload.drop +
        "\nDate: " +
        (payload.date || "not specified") +
        "\nCar: " +
        payload.car
      : "New package request:\nPackage: " +
        payload.package +
        "\nStart date: " +
        (payload.date || "not specified") +
        "\nTravellers: " +
        payload.pax +
        "\nCar: " +
        payload.car;

  var url =
    "https://wa.me/" +
    WHATSAPP_BUSINESS_NUMBER +
    "?text=" +
    encodeURIComponent(text);
  window.open(url, "_blank");
}

// Booking form submission
document.querySelectorAll(".submit").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var kind = btn.dataset.form;
    var box = document.getElementById("confirm-" + kind);
    var payload = { kind: kind };

    if (kind === "transfer") {
      payload.pickup =
        document.getElementById("t-pickup").value || "your pickup point";
      payload.drop =
        document.getElementById("t-drop").value || "your destination";
      payload.date = document.getElementById("t-date").value;
      payload.car = document.getElementById("t-car").value;
    } else {
      payload.package = document.getElementById("p-pkg").value;
      payload.date = document.getElementById("p-date").value;
      payload.pax = document.getElementById("p-pax").value || "2";
      payload.car = document.getElementById("p-car").value;
    }

    var successText =
      kind === "transfer"
        ? "Opening WhatsApp to confirm your transfer from " +
          payload.pickup +
          " to " +
          payload.drop +
          " — just hit send."
        : "Opening WhatsApp to confirm your " +
          payload.package +
          " request (" +
          payload.pax +
          " travellers) — just hit send.";

    box.textContent = successText;
    box.classList.add("show");

    sendBookingToWhatsApp(payload);
  });
});

// One quiet reveal pass for sections as they enter view
var revealTargets = document.querySelectorAll(
  "#packages .pkg, .story-grid, .quote blockquote, .fleet-item"
);
revealTargets.forEach(function (el) {
  el.classList.add("reveal");
});

if ("IntersectionObserver" in window) {
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach(function (el) {
    io.observe(el);
  });
} else {
  revealTargets.forEach(function (el) {
    el.classList.add("in");
  });
}
