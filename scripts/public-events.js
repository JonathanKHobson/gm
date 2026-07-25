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
      id: "stargate-phx-mox",
      name: "Stargate PHX at Mox",
      url: "https://events.moxboardinghouse.com/p/n/nmph2JKD",
      discoverDates: true
    }
  ];

  site.publicEvents = [
    {
      id: "goldspire-2026-07-25",
      game: "The Goldspire Messengers",
      system: "Daggerheart",
      tier: "Tier 1",
      status: "sold_out",
      title: "Daggerheart one-shot: Saturday, July 25",
      name: "The Goldspire Messengers",
      time: "10:30 AM-2:30 PM",
      venue: "Mox Boarding House Chandler",
      start: "2026-07-25T10:30:00-07:00",
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
      url: "https://events.moxboardinghouse.com/p/n/nmph2JKD",
      detailsUrl: "events/stargate-phx/",
      sourceId: "stargate-phx-mox",
      watchText: "Saturday, August 22, 2026 at 10:30 a.m.: Stargate Phoenix Site: Groundbreaking, Episode 1.01"
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
  site.tentativeEvents = [
    {
      id: "daggerheart-2026-08-04",
      game: "The Goldspire Messengers",
      system: "Daggerheart",
      tier: "Tier 1",
      dateLabel: "Aug 4",
      status: "tentative"
    },
    {
      id: "daggerheart-2026-08-25",
      game: "Tier 2 adventure",
      system: "Daggerheart",
      tier: "Tier 2",
      dateLabel: "Aug 25",
      status: "tentative"
    },
    {
      id: "daggerheart-2026-09-12",
      game: "Tier 2 adventure",
      system: "Daggerheart",
      tier: "Tier 2",
      dateLabel: "Sep 12",
      status: "tentative"
    }
  ];
}(window));
