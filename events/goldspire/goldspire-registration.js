(function () {
  var registrationConfig = {
    registration_state: "live",
    pending_label: "Registration coming soon",
    live_label: "Book now at Mox",
    pending_url: "coming-soon/",
    live_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5",
    checkout_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5/checkout",
    pending_aria_label: "Registration coming soon. Open event listing status.",
    live_aria_label: "Book now at Mox. Open the official event listing."
  };

  var script = document.currentScript;
  var eventBase = script ? script.getAttribute("data-event-base") || "" : "";
  var state = registrationConfig.registration_state === "live" && registrationConfig.live_url ? "live" : "pending";
  var label = state === "live" ? registrationConfig.live_label : registrationConfig.pending_label;
  var url = state === "live" ? registrationConfig.live_url : registrationConfig.pending_url;
  var ariaLabel = state === "live" ? registrationConfig.live_aria_label : registrationConfig.pending_aria_label;

  function resolveUrl(value) {
    if (/^(https?:|mailto:|\/|#)/.test(value)) return value;
    return eventBase + value;
  }

  function isExternalUrl(value) {
    return /^https?:/.test(value);
  }

  document.documentElement.setAttribute("data-registration-state", state);

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
}());
