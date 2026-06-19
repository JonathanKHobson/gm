(function () {
  var registrationConfig = {
    registration_state: "live",
    booking_mode: "single",
    pending_label: "Registration coming soon",
    single_label: "Book now at Mox",
    multi_label: "View Times",
    live_label: "Book now at Mox",
    pending_url: "coming-soon/",
    single_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5",
    multi_url: "dates/",
    live_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5",
    checkout_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5/checkout",
    pending_aria_label: "Registration coming soon. Open event listing status.",
    single_aria_label: "Book now at Mox. Open the official event listing.",
    multi_aria_label: "View Goldspire event times and booking links.",
    live_aria_label: "Book now at Mox. Open the official event listing."
  };

  var script = document.currentScript;
  var eventBase = script ? script.getAttribute("data-event-base") || "" : "";
  var bookingMode = registrationConfig.booking_mode === "multi" ? "multi" : "single";
  var hasLiveTarget = bookingMode === "multi"
    ? Boolean(registrationConfig.multi_url)
    : Boolean(registrationConfig.single_url || registrationConfig.live_url);
  var state = registrationConfig.registration_state === "live" && hasLiveTarget ? "live" : "pending";
  var label = registrationConfig.pending_label;
  var url = registrationConfig.pending_url;
  var ariaLabel = registrationConfig.pending_aria_label;

  if (state === "live" && bookingMode === "multi") {
    label = registrationConfig.multi_label;
    url = registrationConfig.multi_url;
    ariaLabel = registrationConfig.multi_aria_label;
  } else if (state === "live") {
    label = registrationConfig.single_label || registrationConfig.live_label;
    url = registrationConfig.single_url || registrationConfig.live_url;
    ariaLabel = registrationConfig.single_aria_label || registrationConfig.live_aria_label;
  }

  function resolveUrl(value) {
    if (/^(https?:|mailto:|\/|#)/.test(value)) return value;
    return eventBase + value;
  }

  function isExternalUrl(value) {
    return /^https?:/.test(value);
  }

  document.documentElement.setAttribute("data-registration-state", state);
  document.documentElement.setAttribute("data-booking-mode", bookingMode);

  Array.prototype.forEach.call(document.querySelectorAll("[data-event-cta]"), function (link) {
    var resolvedUrl = resolveUrl(url);
    link.href = resolvedUrl;
    link.textContent = label;
    link.setAttribute("aria-label", ariaLabel);
    link.setAttribute("data-registration-state", state);
    if (isExternalUrl(resolvedUrl)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.classList.add("external-link");
      if (document.getElementById("new-tab-note")) {
        link.setAttribute("aria-describedby", "new-tab-note");
      }
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.removeAttribute("aria-describedby");
      link.classList.remove("external-link");
    }
  });

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
