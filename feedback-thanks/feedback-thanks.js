(function () {
  "use strict";

  var EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
  var CONTACT_PUBLIC_KEY = "DpN9hLocoU__4dYVX";
  var CONTACT_SERVICE_ID = "service_9wx16fe";
  var CONTACT_TEMPLATE_ID = "template_hjbmxbn";
  var shareLink = document.getElementById("bringFriend");
  var shareStatus = document.getElementById("shareStatus");
  var eventsUrl = "https://jonathankhobson.github.io/gm/events/";

  function setReminderStatus(message, state) {
    var status = document.getElementById("reminder-status");
    if (!status) return;
    status.classList.remove("is-error", "is-success");
    if (state) status.classList.add("is-" + state);
    status.textContent = message;
  }

  function appendEmailFallback() {
    var status = document.getElementById("reminder-status");
    if (!status) return;
    var link = document.createElement("a");
    link.href = "mailto:jonathankylehobson@gmail.com?subject=Next%20public%20game";
    link.textContent = "Email Kyle instead.";
    status.appendChild(document.createTextNode(" "));
    status.appendChild(link);
  }

  function initReminderForm() {
    var form = document.getElementById("feedbackReminderForm");
    if (!form) return;

    var emailInput = document.getElementById("feedback-reminder-email");
    var submitButton = form.querySelector("button[type='submit']");
    var submitLabel = form.querySelector("[data-submit-label]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var email = String(data.get("email") || "").trim();
      var company = String(data.get("company") || "").trim();

      if (company) {
        form.reset();
        setReminderStatus("Kyle has your email. He will send the next public booking link.", "success");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setReminderStatus("Enter a valid email so Kyle knows where to send the booking link.", "error");
        if (emailInput) emailInput.focus();
        return;
      }

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Sending";
      setReminderStatus("Sending...");

      fetch(EMAILJS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: CONTACT_SERVICE_ID,
          template_id: CONTACT_TEMPLATE_ID,
          user_id: CONTACT_PUBLIC_KEY,
          template_params: {
            title: "Public game opening request",
            name: "Future player",
            email: email,
            topic: "Next public game",
            consent: "yes",
            message: "Please email this person when a new public GameMasterKyle table opens for booking.",
            page: window.location.href
          }
        })
      }).then(function (response) {
        if (!response.ok) throw new Error("Email service returned " + response.status);
        form.reset();
        setReminderStatus("Kyle has your email. He will send the next public booking link.", "success");
      }).catch(function () {
        setReminderStatus("That did not send.", "error");
        appendEmailFallback();
      }).finally(function () {
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "Tell me";
      });
    });
  }

  function initShareLink() {
    if (!shareLink || !navigator.share) return;

    shareLink.addEventListener("click", function (event) {
      event.preventDefault();
      navigator.share({
        title: "Upcoming GameMasterKyle events",
        text: "Come play at a GameMasterKyle table with me.",
        url: eventsUrl
      }).then(function () {
        if (shareStatus) shareStatus.textContent = "Event link shared.";
      }).catch(function (error) {
        if (error && error.name === "AbortError") return;
        window.location.href = shareLink.href;
      });
    });
  }

  initReminderForm();
  initShareLink();
})();
