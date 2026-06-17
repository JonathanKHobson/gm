(function () {
  var registrationConfig = {
    registration_state: "pending",
    pending_label: "Registration coming soon",
    live_label: "Claim a Seat",
    pending_url: "coming-soon/",
    live_url: "",
    pending_aria_label: "Registration coming soon. Open event listing status.",
    live_aria_label: "Claim a Seat. Open event registration."
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

  document.documentElement.setAttribute("data-registration-state", state);

  Array.prototype.forEach.call(document.querySelectorAll("[data-event-cta]"), function (link) {
    link.href = resolveUrl(url);
    link.textContent = label;
    link.setAttribute("aria-label", ariaLabel);
    link.setAttribute("data-registration-state", state);
  });
}());
