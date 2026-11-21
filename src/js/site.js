(function () {
  "use strict";
  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });
  }

  // Header border once scrolled
  var header = document.querySelector(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 4); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Email links are assembled here so the address is not sitting in the HTML
  document.querySelectorAll("[data-mu]").forEach(function (a) {
    var addr = a.getAttribute("data-mu") + "@" + a.getAttribute("data-md");
    var subj = a.getAttribute("data-ms") || "Hello Diego";
    a.setAttribute("href", "mailto:" + addr + "?subject=" + encodeURIComponent(subj));
  });

  // Privacy-first analytics wrapper: anonymous event names only, never values.
  window.dgTrack = function (name) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "event/" + String(name).slice(0, 60), title: String(name).slice(0, 60), event: true });
      }
    } catch (e) {}
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-track]");
    if (el) window.dgTrack(el.getAttribute("data-track"));
  });
})();
