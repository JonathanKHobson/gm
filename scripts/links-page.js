(function () {
  "use strict";

  var EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
  var CONTACT_PUBLIC_KEY = "DpN9hLocoU__4dYVX";
  var CONTACT_SERVICE_ID = "service_9wx16fe";
  var CONTACT_TEMPLATE_ID = "template_hjbmxbn";
  var SHARE_URL = "https://jonathankhobson.github.io/g/";

  function byStart(a, b) {
    return Date.parse(a.start) - Date.parse(b.start);
  }

  function getUpcomingVerifiedEvents(now) {
    var site = window.GameMasterKyle || {};
    var events = Array.isArray(site.publicEvents) ? site.publicEvents : [];

    return events
      .filter(function (event) {
        var start = Date.parse(event.start);
        return Number.isFinite(start) && start > now;
      })
      .sort(byStart);
  }

  function formatEventDate(event) {
    var start = new Date(event.start);
    if (!Number.isFinite(start.getTime())) return event.time || "";

    var date = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Phoenix"
    }).format(start);

    return event.time ? date + " · " + event.time : date;
  }

  function setText(root, selector, value) {
    var element = root.querySelector(selector);
    if (element) element.textContent = value;
  }

  function renderFeaturedEvent(events) {
    var card = document.querySelector("[data-featured-event]");
    if (!card) return;

    var event = events[0];
    var primary = card.querySelector("[data-event-primary]");
    var details = card.querySelector("[data-event-details]");
    var note = card.querySelector("[data-event-note]");

    card.classList.remove("is-sold-out", "is-empty");

    if (!event) {
      card.classList.add("is-empty");
      setText(card, "[data-event-status]", "No verified listing yet");
      setText(card, "[data-event-system]", "Public games");
      setText(card, "[data-event-name]", "The next table is being arranged.");
      setText(card, "[data-event-date]", "Leave your email for the next booking link.");
      setText(card, "[data-event-venue]", "Phoenix East Valley");
      if (note) note.hidden = true;
      if (primary) primary.hidden = true;
      if (details) details.hidden = true;
      return;
    }

    var soldOut = event.status === "sold_out";
    if (soldOut) card.classList.add("is-sold-out");

    setText(card, "[data-event-status]", soldOut ? "Fully booked" : "Booking now");
    setText(card, "[data-event-system]", [event.system, event.tier].filter(Boolean).join(" · ") || event.game);
    setText(card, "[data-event-name]", event.name || event.game || event.title);
    setText(card, "[data-event-date]", formatEventDate(event));
    setText(card, "[data-event-venue]", event.venue);

    if (note) {
      note.textContent = soldOut
        ? "This table is full. Mox may still accept last-minute waitlist requests before the game begins."
        : "Beginner-friendly. Rules guidance and ready-to-play characters are provided.";
      note.hidden = false;
    }

    if (primary) {
      primary.href = event.url;
      primary.target = "_blank";
      primary.rel = "noopener noreferrer";
      primary.setAttribute("aria-describedby", "new-tab-note");
      primary.hidden = false;
      setText(primary, "[data-event-primary-label]", soldOut ? "Join the Mox waitlist" : "Book at Mox");
    }

    if (details) {
      details.href = event.detailsUrl;
      details.textContent = "Learn more about this game";
      details.hidden = false;
    }
  }

  function renderAlsoBooking(events) {
    var band = document.querySelector("[data-also-booking]");
    if (!band) return;

    var event = events[1];
    if (!event) {
      band.hidden = true;
      return;
    }

    var game = event.game || event.system || "";
    var name = event.name || event.title || game;
    var title = name.toLowerCase().indexOf(game.toLowerCase()) === 0
      ? name
      : game + ": " + name;

    setText(band, "[data-also-title]", title);
    setText(band, "[data-also-facts]", formatEventDate(event) + " · " + event.venue);
    setText(band, "[data-also-label]", event.status === "sold_out" ? "Join the Mox waitlist" : "Book at Mox");

    var link = band.querySelector("[data-also-link]");
    if (link) link.href = event.url;
    band.hidden = false;
  }

  function renderTentativeEvents() {
    var site = window.GameMasterKyle || {};
    var events = Array.isArray(site.tentativeEvents) ? site.tentativeEvents : [];
    var strip = document.querySelector("[data-tentative-strip]");
    var list = document.querySelector("[data-tentative-events]");
    if (!strip || !list || !events.length) return;

    events.forEach(function (event) {
      var item = document.createElement("li");
      var date = document.createElement("strong");
      var detail = document.createElement("span");
      date.textContent = event.dateLabel;
      detail.textContent = event.tier || event.system || "Details coming soon";
      item.appendChild(date);
      item.appendChild(detail);
      list.appendChild(item);
    });

    strip.hidden = false;
  }

  function setFormStatus(message, state) {
    var status = document.getElementById("lead-status");
    if (!status) return;
    status.classList.remove("is-error", "is-success");
    if (state) status.classList.add("is-" + state);
    status.textContent = message;
  }

  function appendEmailFallback() {
    var status = document.getElementById("lead-status");
    if (!status) return;
    var link = document.createElement("a");
    link.href = "mailto:jonathankylehobson@gmail.com?subject=Next%20public%20game";
    link.textContent = "Email Kyle instead.";
    status.appendChild(document.createTextNode(" "));
    status.appendChild(link);
  }

  function initLeadForm() {
    var form = document.getElementById("eventReminderForm");
    if (!form) return;

    var emailInput = document.getElementById("reminder-email");
    var submitButton = form.querySelector("button[type='submit']");
    var submitLabel = form.querySelector("[data-submit-label]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var email = String(data.get("email") || "").trim();
      var company = String(data.get("company") || "").trim();

      if (company) {
        form.reset();
        setFormStatus("Kyle has your email. He will send the next public booking link.", "success");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFormStatus("Enter a valid email so Kyle knows where to send the booking link.", "error");
        if (emailInput) emailInput.focus();
        return;
      }

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Sending";
      setFormStatus("Sending...");

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
        setFormStatus("Kyle has your email. He will send the next public booking link.", "success");
      }).catch(function () {
        setFormStatus("That did not send.", "error");
        appendEmailFallback();
      }).finally(function () {
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "Tell me";
      });
    });
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value);
    }

    var input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    return Promise.resolve();
  }

  function initShareTools() {
    var shareButton = document.getElementById("sharePageButton");
    var copyButton = document.getElementById("copyLinkButton");
    var status = document.getElementById("shareStatus");

    function showStatus(message) {
      if (status) status.textContent = message;
    }

    function copyLink() {
      copyText(SHARE_URL).then(function () {
        showStatus("Link copied.");
      }).catch(function () {
        showStatus("Copy failed. Use jonathankhobson.github.io/g/");
      });
    }

    if (shareButton) {
      shareButton.addEventListener("click", function () {
        if (!navigator.share) {
          copyLink();
          return;
        }

        navigator.share({
          title: "GameMasterKyle",
          text: "Public games and contact links for GameMasterKyle",
          url: SHARE_URL
        }).then(function () {
          showStatus("Share sheet opened.");
        }).catch(function () {
          showStatus("Share cancelled.");
        });
      });
    }

    if (copyButton) copyButton.addEventListener("click", copyLink);
  }

  var upcoming = getUpcomingVerifiedEvents(Date.now());
  renderFeaturedEvent(upcoming);
  renderAlsoBooking(upcoming);
  renderTentativeEvents();
  initLeadForm();
  initShareTools();

  window.GameMasterKyleLinks = {
    getUpcomingVerifiedEvents: getUpcomingVerifiedEvents,
    renderFeaturedEvent: renderFeaturedEvent
  };
}());
