(function () {
  "use strict";

  var site = window.GameMasterKyle || {};
  var script = document.currentScript;
  var eventBase = script ? script.getAttribute("data-event-base") || "" : "";
  var now = Date.now();
  var upcoming = typeof site.getUpcomingPublicEvents === "function"
    ? site.getUpcomingPublicEvents(now).filter(function (event) {
      return event.sourceId === "goldspire-mox" || event.sourceId === "goldspire-tier-two-mox";
    }) : [];

  function updateLinks(selector, sourceId, fallbackLabel) {
    var event = upcoming.filter(function (candidate) {
      return !sourceId || candidate.sourceId === sourceId;
    })[0];
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (link) {
      var label = event
        ? (event.status === "sold_out" ? "Check availability at Mox" : "Check " + event.tier + " seats at Mox")
        : fallbackLabel;
      link.href = event ? event.url : eventBase + "index.html#contact";
      link.textContent = label;
      link.setAttribute("aria-label", event ? label + " for " + event.name + ". Opens the official Mox listing." : label + ". Contact Kyle.");
      link.setAttribute("data-registration-state", event ? event.status : "ended");
      link.classList.toggle("external-link", Boolean(event));
      if (event) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        if (document.getElementById("new-tab-note")) link.setAttribute("aria-describedby", "new-tab-note");
      } else {
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.removeAttribute("aria-describedby");
      }
    });
  }

  document.documentElement.setAttribute("data-registration-state", upcoming.length ? "live" : "ended");
  document.documentElement.setAttribute("data-booking-mode", "multi");
  updateLinks("[data-event-cta]", "", "Ask about a game");
  updateLinks("[data-tier-one-cta]", "goldspire-mox", "Ask about Tier 1");
  updateLinks("[data-tier-two-cta]", "goldspire-tier-two-mox", "Ask about Tier 2");

  var stickyCta = document.querySelector(".goldspire-sticky-cta");
  var hero = document.querySelector(".goldspire-hero");

  if (stickyCta && hero && "IntersectionObserver" in window) {
    stickyCta.classList.remove("is-visible");

    var stickyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        stickyCta.classList.toggle("is-visible", !entry.isIntersecting);
      });
    }, { threshold: 0.02 });

    stickyObserver.observe(hero);
  }
}());
