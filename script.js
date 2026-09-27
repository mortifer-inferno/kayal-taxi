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
const WHATSAPP_BUSINESS_NUMBER = "918129763926"; // <-- your number, country code first, digits only (no + or spaces)

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
var prefersReducedMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var revealTargets = document.querySelectorAll(
  "#packages .pkg, .story-grid, .quote blockquote, .fleet-item, .head, .booker, .stats > div, .foot-grid > div"
);
revealTargets.forEach(function (el, i) {
  el.classList.add("reveal");
  // Small stagger so cards in the same row rise one after another
  // instead of all at once — skipped entirely for reduced-motion users.
  if (!prefersReducedMotion) {
    var delay = (i % 6) * 70;
    el.style.transitionDelay = delay + "ms";
  }
});

if ("IntersectionObserver" in window) {
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add("in");
          io.unobserve(el);
          // Once the entrance animation finishes, drop the reveal class
          // entirely so its slow transition stops overriding each card's
          // own fast hover-tilt transition (they'd otherwise fight forever).
          var settle = function (evt) {
            if (evt.target === el && evt.propertyName === "opacity") {
              el.classList.remove("reveal", "in");
              el.style.transitionDelay = "";
              el.removeEventListener("transitionend", settle);
            }
          };
          if (prefersReducedMotion) {
            el.classList.remove("reveal", "in");
          } else {
            el.addEventListener("transitionend", settle);
          }
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

// --- 3D cursor-tilt on cards (packages, fleet, story art) ---
// Skipped for touch devices (no real hover) and reduced-motion users.
var supportsHover =
  window.matchMedia && window.matchMedia("(hover: hover)").matches;

if (supportsHover && !prefersReducedMotion) {
  var tiltElements = document.querySelectorAll(".fleet-item");

  tiltElements.forEach(function (el) {
    var maxTilt = 8; // degrees
    var raf = null;
    var rect = null;

    el.addEventListener("mouseenter", function () {
      // Measure once, before any tilt transform is applied — measuring a
      // self-transformed element mid-hover distorts the rect and causes
      // jittery, feedback-loop tilt calculations.
      rect = el.getBoundingClientRect();
    });

    el.addEventListener("mousemove", function (e) {
      if (!rect || raf) return; // throttle to one update per animation frame
      raf = requestAnimationFrame(function () {
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var rotateY = ((x - cx) / cx) * maxTilt;
        var rotateX = -((y - cy) / cy) * maxTilt;
        el.style.transform =
          "perspective(1000px) rotateX(" +
          rotateX.toFixed(2) +
          "deg) rotateY(" +
          rotateY.toFixed(2) +
          "deg) translateY(-4px) scale3d(1.02,1.02,1.02)";
        raf = null;
      });
    });

    el.addEventListener("mouseleave", function () {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      rect = null;
      el.style.transform = "";
    });
  });
}

// --- Hero entrance on load ---
(function () {
  var heroCopy = document.querySelector(".hero-copy");
  if (!heroCopy) return;
  // Small delay so the page has rendered before the fade-up starts —
  // feels intentional rather than instant.
  window.setTimeout(function () {
    heroCopy.classList.add("loaded");
  }, 120);
})();

// --- Subtle hero parallax on scroll (multi-layer depth) ---
(function () {
  if (prefersReducedMotion) return;
  var scene = document.querySelector(".hero-scene");
  var copy = document.querySelector(".hero-copy");
  var hint = document.querySelector(".scroll-hint");
  var hero = document.querySelector(".hero");
  var sun = document.getElementById("layer-sun");
  var water = document.getElementById("layer-water");
  var palms = document.getElementById("layer-palms");
  var boat = document.getElementById("layer-boat");
  if (!scene || !hero) return;

  var ticking = false;

  function updateParallax() {
    var rect = hero.getBoundingClientRect();
    // Only animate while the hero is at least partly on screen.
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      var progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
      var scale = 1 + progress * 0.06;
      scene.style.transform = "scale(" + scale.toFixed(3) + ")";

      // Each layer drifts at its own speed — background elements move
      // least, foreground elements move most — so the scene reads as
      // having real depth rather than sliding as one flat image.
      if (sun) sun.style.transform = "translateY(" + progress * 16 + "px)";
      if (water) water.style.transform = "translateY(" + progress * 34 + "px)";
      if (palms) palms.style.transform = "translateY(" + progress * 60 + "px)";
      if (boat)
        boat.style.transform =
          "translate(430px, " + (388 + progress * 82) + "px)";

      if (copy) {
        copy.style.transform = "translateY(" + progress * 30 + "px)";
        copy.style.opacity = String(1 - progress * 0.6);
      }
      if (hint) {
        hint.style.opacity = String(Math.max(0, 0.75 - progress * 3));
      }
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateParallax();
})();

// --- Header compacts and firms up once you've scrolled past the hero ---
(function () {
  var header = document.getElementById("site-header");
  if (!header) return;
  var ticking = false;

  function updateHeader() {
    header.classList.toggle("scrolled", window.scrollY > 40);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateHeader();
})();
