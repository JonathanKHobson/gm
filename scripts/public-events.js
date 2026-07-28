(function (global) {
  "use strict";

  var site = global.GameMasterKyle = global.GameMasterKyle || {};

  site.publicEventSources = [
    {
      id: "goldspire-mox",
      name: "The Goldspire Messengers at Mox",
      url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5",
      discoverDates: false
    },
    {
      id: "goldspire-tier-two-mox",
      name: "The Dying Spires at Mox",
      url: "https://events.moxboardinghouse.com/p/n/zdRmLjPV/v5",
      discoverDates: true,
      dateDiscoveryPath: "calendar_day_view"
    },
    {
      id: "stargate-phx-mox",
      name: "Stargate PHX at Mox",
      url: "https://events.moxboardinghouse.com/p/n/nmph2JKD",
      discoverDates: true
    }
  ];

  site.publicEvents = [
    {
      id: "goldspire-2026-08-04",
      game: "The Goldspire Messengers",
      system: "Daggerheart",
      tier: "Tier 1",
      status: "live",
      title: "Daggerheart one-shot: Tuesday, August 4",
      name: "The Goldspire Messengers",
      bookingTitle: "Daggerheart Tier 1: The Goldspire Messengers",
      bookingLabel: "Book Tier 1",
      time: "5:00-10:00 PM",
      venue: "Mox Boarding House Chandler",
      start: "2026-08-04T17:00:00-07:00",
      url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5",
      detailsUrl: "events/goldspire/",
      sourceId: "goldspire-mox"
    },
    {
      id: "stargate-phx-2026-08-22",
      game: "Stargate PHX",
      system: "Stargate RPG",
      status: "live",
      title: "Stargate sci-fi one-shot: Saturday, August 22",
      name: "Stargate PHX: Groundbreaking",
      time: "Starts at 10:30 AM",
      venue: "Mox Boarding House Chandler",
      start: "2026-08-22T10:30:00-07:00",
      featurePriority: 100,
      url: "https://events.moxboardinghouse.com/p/n/nmph2JKD",
      detailsUrl: "events/stargate-phx/",
      sourceId: "stargate-phx-mox",
      watchText: "Saturday, August 22, 2026 at 10:30 a.m.: Stargate Phoenix Site: Groundbreaking, Episode 1.01"
    },
    {
      id: "goldspire-tier-two-2026-08-25",
      game: "The Dying Spires",
      system: "Daggerheart",
      tier: "Tier 2",
      status: "live",
      title: "Daggerheart Tier 2 one-shot: Tuesday, August 25",
      name: "The Dying Spires",
      bookingTitle: "Daggerheart Tier 2: The Dying Spires",
      bookingLabel: "Book Tier 2",
      time: "5:00-10:00 PM",
      venue: "Mox Boarding House Chandler",
      start: "2026-08-25T17:00:00-07:00",
      url: "https://events.moxboardinghouse.com/p/n/zdRmLjPV/v5",
      detailsUrl: "events/goldspire/",
      sourceId: "goldspire-tier-two-mox",
      watchText: "The Dying Spires"
    },
    {
      id: "stargate-phx-2026-09-05",
      game: "Stargate PHX",
      system: "Stargate RPG",
      status: "live",
      title: "Stargate sci-fi one-shot: Saturday, September 5",
      name: "Stargate PHX: Watershed",
      time: "Starts at 10:30 AM",
      venue: "Mox Boarding House Chandler",
      start: "2026-09-05T10:30:00-07:00",
      url: "https://events.moxboardinghouse.com/p/n/nmph2JKD",
      detailsUrl: "events/stargate-phx/",
      sourceId: "stargate-phx-mox",
      watchText: "Saturday, September 5, 2026 at 10:30 a.m.: Stargate Phoenix Site: Watershed, Episode 1.02"
    },
    {
      id: "goldspire-tier-two-2026-09-12",
      game: "The Dying Spires",
      system: "Daggerheart",
      tier: "Tier 2",
      status: "live",
      title: "Daggerheart Tier 2 one-shot: Saturday, September 12",
      name: "The Dying Spires",
      bookingTitle: "Daggerheart Tier 2: The Dying Spires",
      bookingLabel: "Book Tier 2",
      time: "10:30 AM-3:30 PM",
      venue: "Mox Boarding House Chandler",
      start: "2026-09-12T10:30:00-07:00",
      url: "https://events.moxboardinghouse.com/p/n/zdRmLjPV/v5",
      detailsUrl: "events/goldspire/",
      sourceId: "goldspire-tier-two-mox",
      watchText: "The Dying Spires"
    },
    {
      id: "stargate-phx-2026-09-19",
      game: "Stargate PHX",
      system: "Stargate RPG",
      status: "live",
      title: "Stargate sci-fi one-shot: Saturday, September 19",
      name: "Stargate PHX: A Matter of Fae",
      time: "Starts at 10:30 AM",
      venue: "Mox Boarding House Chandler",
      start: "2026-09-19T10:30:00-07:00",
      url: "https://events.moxboardinghouse.com/p/n/nmph2JKD",
      detailsUrl: "events/stargate-phx/",
      sourceId: "stargate-phx-mox",
      watchText: "Saturday, September 19, 2026 at 10:30 a.m.: Stargate Phoenix Site: A Matter of Fae, Episode 1.03"
    }
  ];

  // Tentative dates are intentionally separate. They never become booking CTAs
  // until a verified listing is added to publicEvents above.
  site.tentativeEvents = [];
}(window));
