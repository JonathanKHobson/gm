(function () {
  "use strict";

  var config = {
    title: "Stargate PHX",
    state: "pending",
    price: "$25 per player",
    seats: "7 seats maximum",
    duration: "Roughly 3–4 hours",
    venue: "Mox Boarding House Chandler",
    address: "1371 N Alma School Rd, Chandler, AZ 85224",
    directionsUrl: "https://www.google.com/maps/place/Mox%2BBoarding%2BHouse/%4033.3269143%2C-111.8608469%2C17z/data%3D%213m1%214b1%214m6%213m5%211s0x872b07b636f01fef%3A0x5b0edca367684e13%218m2%213d33.3269098%214d-111.858272%2116s%2Fg%2F11y7hf8780",
    defaultRegistrationUrl: null,
    registrationFlow: "per_session",
    registrationFlowNote: "Each session has its own Mox registration link.",
    sessionCtaLabel: "Continue to Mox",
    sessions: [],
    states: {
      pending: {
        label: "Dates and registration coming soon",
        title: "Dates and registration are coming soon.",
        copy: "Official session dates and Mox registration links are not confirmed yet.",
        ctaLabel: "Dates coming soon",
        ctaAriaLabel: "Dates and registration coming soon. Jump to the current event status.",
        url: "coming-soon/",
        sessionHeading: "No mission windows are posted yet.",
        sessionCopy: "Dates and official Mox registration are still being arranged."
      },
      scheduled: {
        label: "Sessions announced · Registration opens soon",
        title: "Choose the mission window that works for you.",
        copy: "Session dates are posted. Official Mox registration is not open yet.",
        ctaLabel: "See session dates",
        ctaAriaLabel: "See the announced Stargate PHX session dates.",
        url: "dates/",
        sessionHeading: "Announced mission windows",
        sessionCopy: "Review the dates below. Booking links will appear when Mox registration opens."
      },
      live: {
        label: "Registration open",
        title: "Choose a session and join the team.",
        copy: "Select an available Stargate PHX session, then complete registration through Mox.",
        ctaLabel: "Choose a session",
        ctaAriaLabel: "Choose a Stargate PHX session and continue to official Mox registration.",
        url: "dates/",
        sessionHeading: "Available mission windows",
        sessionCopy: "Choose a session below, then complete registration through Mox."
      },
      sold_out: {
        label: "Current sessions sold out",
        title: "This dial-out is full.",
        copy: "All currently listed seats are claimed. Check the session page for another date or a future rerun.",
        ctaLabel: "View session status",
        ctaAriaLabel: "View the current Stargate PHX session status.",
        url: "dates/",
        sessionHeading: "Current mission windows",
        sessionCopy: "The sessions below are currently full. Check back for another date or ask about a future rerun."
      }
    }
  };

  var allowedStates = ["pending", "scheduled", "live", "sold_out"];
  var script = document.currentScript;
  var eventBase = script ? script.getAttribute("data-event-base") || "" : "";

  function resolveUrl(value) {
    if (!value) return "#status";
    if (/^(https?:|mailto:|\/|#)/.test(value)) return value;
    return eventBase + value;
  }

  function isExternal(value) {
    return /^https?:/.test(value || "");
  }

  function effectiveState(requestedState) {
    var requested = allowedStates.indexOf(requestedState) >= 0 ? requestedState : "pending";
    if (requested !== "live") return requested;
    var hasLiveUrl = Boolean(config.defaultRegistrationUrl) || config.sessions.some(function (session) {
      return Boolean(session.registrationUrl);
    });
    return hasLiveUrl ? requested : "pending";
  }

  function setLink(link, stateCopy) {
    var target = stateCopy.url;
    if (stateCopy === config.states.live && config.defaultRegistrationUrl) {
      target = config.defaultRegistrationUrl;
    }
    var resolved = resolveUrl(target);
    link.href = resolved;
    link.textContent = stateCopy.ctaLabel;
    link.setAttribute("aria-label", stateCopy.ctaAriaLabel);
    link.setAttribute("data-registration-state", config.state);
    if (isExternal(resolved)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
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
  }

  function setText(selector, value) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (node) {
      node.textContent = value;
    });
  }

  function createTextElement(tagName, className, textValue) {
    var node = document.createElement(tagName);
    if (className) node.className = className;
    node.textContent = textValue;
    return node;
  }

  function appendFact(list, label, value) {
    var wrapper = document.createElement("div");
    wrapper.appendChild(createTextElement("dt", "", label));
    wrapper.appendChild(createTextElement("dd", "", value));
    list.appendChild(wrapper);
  }

  function createSessionOption(session, state) {
    var option = document.createElement("article");
    option.className = "sg-session-option";
    option.setAttribute("data-session-id", session.id || "session");

    var heading = createTextElement("h3", "", session.title || session.episode || "Stargate PHX session");
    option.appendChild(heading);
    if (session.episode && session.episode !== session.title) {
      option.appendChild(createTextElement("p", "sg-session-episode", session.episode));
    }

    var facts = document.createElement("dl");
    facts.className = "sg-session-facts";
    appendFact(facts, "Day", session.day || "To be confirmed");
    appendFact(facts, "Date", session.date || "To be confirmed");
    appendFact(facts, "Time", session.time || "To be confirmed");
    appendFact(facts, "Availability", session.availability || config.states[state].label);
    option.appendChild(facts);

    if (session.contentNote) {
      option.appendChild(createTextElement("p", "sg-session-note", session.contentNote));
    }

    var sessionUrl = session.registrationUrl || config.defaultRegistrationUrl;
    if (state === "live" && sessionUrl) {
      var link = createTextElement("a", "btn btn-primary", session.ctaLabel || config.sessionCtaLabel);
      link.href = sessionUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.classList.add("external-link");
      if (document.getElementById("new-tab-note")) link.setAttribute("aria-describedby", "new-tab-note");
      option.appendChild(link);
    } else {
      option.appendChild(createTextElement("p", "sg-session-unavailable", state === "sold_out" ? "Sold out" : "Registration opens soon"));
    }
    return option;
  }

  function renderSessions(state) {
    var stateCopy = config.states[state];
    setText("[data-session-heading]", stateCopy.sessionHeading);
    setText("[data-session-copy]", stateCopy.sessionCopy);

    Array.prototype.forEach.call(document.querySelectorAll("[data-session-list]"), function (list) {
      while (list.firstChild) list.removeChild(list.firstChild);
      config.sessions.forEach(function (session) {
        list.appendChild(createSessionOption(session, state));
      });
      list.hidden = config.sessions.length === 0;
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-no-sessions]"), function (node) {
      node.hidden = config.sessions.length > 0;
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-shared-listing-note]"), function (node) {
      var isSharedListing = state === "live" && config.registrationFlow === "shared_listing" && Boolean(config.defaultRegistrationUrl) && config.sessions.length > 1;
      node.hidden = !isSharedListing;
      node.textContent = isSharedListing ? config.registrationFlowNote : "";
    });
  }

  function render(requestedState) {
    var state = effectiveState(requestedState || config.state);
    var stateCopy = config.states[state];
    config.state = state;
    document.documentElement.setAttribute("data-registration-state", state);

    setText("[data-event-status-label]", stateCopy.label);
    setText("[data-event-status-title]", stateCopy.title);
    setText("[data-event-status-copy]", stateCopy.copy);
    setText("[data-event-value='title']", config.title);
    setText("[data-event-value='price']", config.price);
    setText("[data-event-value='seats']", config.seats);
    setText("[data-event-value='duration']", config.duration);
    setText("[data-event-value='venue']", config.venue);
    setText("[data-event-value='address']", config.address);

    Array.prototype.forEach.call(document.querySelectorAll("[data-event-cta]"), function (link) {
      setLink(link, stateCopy);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-event-directions]"), function (link) {
      link.href = config.directionsUrl;
    });

    renderSessions(state);

    var statusRegion = document.querySelector("[data-registration-announcer]");
    if (statusRegion) {
      statusRegion.textContent = stateCopy.label;
    }
  }

  window.StargatePHXRegistration = {
    config: config,
    render: render
  };

  render(config.state);
}());
