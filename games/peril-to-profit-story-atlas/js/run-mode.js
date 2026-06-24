
(function () {
  const STORAGE_KEY = "goldspire-run-mode-state-v1";
  const GM_STATE_KEY = "goldspire-atlas-gm-state-v2";
  const PLAYER_DISPLAY_HEARTBEAT_KEY = "goldspire-player-display-heartbeat-v1";
  const SPOTLIGHT_STATE_KEY = "goldspire-run-spotlights-v1";
  const SPOTLIGHT_PANEL_KEY = "goldspire-run-spotlight-panel-open-v1";
  const SPOTLIGHT_ATTENTION_KEY = "goldspire-run-spotlight-attention-v1";
  const FACTION_ANSWER_KEY = "goldspire-faction-answers-v1";
  const SPOTLIGHT_DEFER_MODE = "defer-if-clock-critical";
  const atlasMechanics = window.ATLAS_MECHANICS || {};
  const atlasRules = atlasMechanics.rules_registry || [];
  const atlasRulesById = new Map(atlasRules.map((rule) => [rule.id, rule]));
  const PINNED_SHORTCUT_KEYS = ["7", "8", "9", "0"];
  const shortcuts = [
    ["ArrowRight / Space", "Next slide"],
    ["ArrowLeft", "Previous slide"],
    ["Shift+ArrowRight", "Next act/section"],
    ["Shift+ArrowLeft", "Previous act/section"],
    ["Home / End", "First / last slide"],
    ["F", "Fullscreen"],
    ["B", "Blackout player display"],
    ["R", "Reveal read-aloud"],
    ["I", "Reveal image"],
    ["O", "Open player display"],
    ["C", "Copy player-facing text"],
    ["Pin button", "Pin or remove current slide"],
    ["P", "Jump to latest pinned slide"],
    ["M", "Mark slide complete"],
    ["?", "Shortcut help"],
    ["1-6", "GM Rules, Conditions, PCs, Loot, Pronunciation, Sablewood"],
    ["7 / 8 / 9 / 0", "Jump to pinned slides, newest first"],
  ];
  let slides = [];
  let state = readState();
  let spotlightAttentionSignature = "";
  let spotlightAttentionUntil = 0;
  let lastDialogOpener = null;
  let playerDisplayWindow = null;
  let beatAutoplayTimer = null;
  let npcProfiles = {};
  let backupNpcs = [];
  let factionProfiles = {};
  let factionPicker = [];
  let locationProfiles = {};
  let locationPicker = [];
  let itemProfiles = {};
  let itemPicker = [];
  let clueProfiles = {};
  let cluePicker = [];
  let worldConnectionQuestions = {};
  let currentImprovSeed = null;

  function shouldOpenRunLinkInNewTab(link) {
    const href = link?.getAttribute?.("href") || "";
    if (!href || href.startsWith("#")) return false;
    if (/^(javascript:|mailto:|tel:)/i.test(href)) return false;
    if (link.closest("[data-run-go-slide], [data-scrub-slide-id]")) return false;
    return /(^|\/)(pages|wiki|sources)\//.test(href)
      || /\.html(?:[?#].*)?$/.test(href)
      || /\.(?:png|jpe?g|webp|pdf)(?:[?#].*)?$/i.test(href);
  }

  function decorateRunReferenceLinks(root = document) {
    if (root.matches?.("a[href]") && shouldOpenRunLinkInNewTab(root)) {
      root.target = "_blank";
      const rel = new Set(String(root.rel || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      root.rel = [...rel].join(" ");
    }
    root.querySelectorAll?.("a[href]")?.forEach((link) => {
      if (!shouldOpenRunLinkInNewTab(link)) return;
      link.target = "_blank";
      const rel = new Set(String(link.rel || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      link.rel = [...rel].join(" ");
    });
  }

  function setupRunReferenceLinkSafety() {
    decorateRunReferenceLinks(document);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) decorateRunReferenceLinks(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link || !shouldOpenRunLinkInNewTab(link)) return;
      decorateRunReferenceLinks(link.parentElement || document);
    }, true);
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "") || {};
    } catch {
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function readGmState() {
    try {
      return JSON.parse(localStorage.getItem(GM_STATE_KEY) || "") || {};
    } catch {
      return {};
    }
  }

  function writeGmState(next) {
    localStorage.setItem(GM_STATE_KEY, JSON.stringify(next));
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readBoolState(key, fallback = false) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return fallback;
      return value === "true";
    } catch {
      return fallback;
    }
  }

  function writeBoolState(key, value) {
    try {
      localStorage.setItem(key, value ? "true" : "false");
    } catch {}
  }

  function readSpotlightState() {
    const fallback = { acknowledged: {}, snoozed: {}, characters: {} };
    const value = readJson(SPOTLIGHT_STATE_KEY, fallback);
    value.acknowledged = value.acknowledged || {};
    value.snoozed = value.snoozed || {};
    value.characters = value.characters || {};
    return value;
  }

  function writeSpotlightState(next) {
    writeJson(SPOTLIGHT_STATE_KEY, next);
  }

  function spotlightSeenKey(spotlight) {
    return spotlight?.spotlight_id || "";
  }

  function priorityRank(value) {
    return { high: 0, med: 1, medium: 1, low: 2 }[String(value || "").toLowerCase()] ?? 1;
  }

  function spotlightTypeRank(value) {
    return value === "mechanic" ? 0 : value === "character" ? 1 : 2;
  }

  function spotlightTypeLabel(spotlight) {
    return spotlight?.type === "character" ? "Character spotlight" : "Mechanic spotlight";
  }

  function currentBeatLabel(slide) {
    const beat = activeBeatForSlide(slide);
    return [beat?.id, beat?.label, beat?.title, beat?.heading, beat?.displayMode].filter(Boolean).join(" ").toLowerCase();
  }

  function spotlightTriggerMatches(spotlight, slide) {
    const trigger = String(spotlight?.trigger || "scene-enter").toLowerCase();
    if (!trigger.startsWith("beat:")) return true;
    const token = trigger.replace(/^beat:/, "").trim();
    if (!token) return true;
    return currentBeatLabel(slide).includes(token);
  }

  function spotlightRowsForSlide(slide) {
    return (slide?.spotlights || [])
      .filter((spotlight) => spotlight && spotlightTriggerMatches(spotlight, slide))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || spotlightTypeRank(a.type) - spotlightTypeRank(b.type) || String(a.spotlight_id).localeCompare(String(b.spotlight_id)));
  }

  function allCharacterSpotlights() {
    return slides.flatMap((slide) => (slide.spotlights || [])
      .filter((spotlight) => spotlight.type === "character")
      .map((spotlight) => ({ slideId: slide.id, ...spotlight })));
  }

  function pendingSpotlightsByHalf() {
    const store = readSpotlightState();
    const byHalf = { early: [], late: [] };
    allCharacterSpotlights().forEach((spotlight) => {
      const half = spotlight.half === "late" ? "late" : "early";
      const character = spotlight.character_ref || spotlight.pc_name || spotlight.spotlight_id;
      const delivered = !!store.characters?.[character]?.[half] || !!store.acknowledged?.[spotlightSeenKey(spotlight)];
      if (!delivered) byHalf[half].push(spotlight.pc_name || character);
    });
    return {
      early: [...new Set(byHalf.early)],
      late: [...new Set(byHalf.late)],
    };
  }

  function clockCriticalActive() {
    const modalOpen = !!document.querySelector(".run-clock-modal:not([hidden])");
    const clockAlert = !!document.querySelector(".run-clock.is-alert, .run-clock.is-critical, .run-clock-chip.is-alert, .run-clock-chip.is-critical");
    const activeNotice = [...document.querySelectorAll("[data-run-clock-notices] .run-clock-notice, .run-clock-notice")]
      .some((notice) => {
        const severity = String(notice.dataset.severity || notice.dataset.noticeSeverity || notice.getAttribute("data-level") || "").toLowerCase();
        const text = notice.textContent || "";
        return /(critical|alert|overdue|behind|break)/.test(severity) || /wrap up now|overdue|way behind|longer break|midpoint/i.test(text);
      });
    return modalOpen || clockAlert || activeNotice;
  }

  function activeSpotlightForSlide(slide) {
    const rows = spotlightRowsForSlide(slide);
    const store = readSpotlightState();
    const active = rows.find((spotlight) => {
      const key = spotlightSeenKey(spotlight);
      if (store.acknowledged?.[key]) return false;
      if (store.snoozed?.[key] && Date.now() - Number(store.snoozed[key]) < 10 * 60 * 1000) return false;
      return true;
    });
    return { active, rows, store };
  }

  function spotlightCtaHref(destination) {
    const clean = String(destination || "").replace(/^\/+/, "");
    return clean ? `${clean.replace(/\/$/, "")}/` : "#";
  }

  function pendingSpotlightCount(pending) {
    return (pending.early?.length || 0) + (pending.late?.length || 0);
  }

  function renderPendingSpotlights(pending) {
    const hasPending = pending.early.length || pending.late.length;
    if (!hasPending) return "";
    const earlyText = pending.early.length ? pending.early.join(", ") : "Covered";
    const lateText = pending.late.length ? pending.late.join(", ") : "Covered";
    return `
      <section class="spotlight-pending" aria-label="Pending PC spotlights">
        <h2>Pending PC spotlights</h2>
        <div class="spotlight-pending-grid">
          <p><strong>Early half</strong>${escapeHtml(earlyText)}</p>
          <p><strong>Late half</strong>${escapeHtml(lateText)}</p>
        </div>
      </section>`;
  }

  function renderSpotlightCard(spotlight, queueCount, deferred = false) {
    if (!spotlight) {
      return deferred
        ? `<section class="spotlight-card is-deferred" data-spotlight-type="mechanic"><p class="spotlight-eyebrow"><span class="spotlight-type-pill">Queued</span></p><h2>Spotlight queued behind clock</h2><p class="spotlight-subheadline">A time-critical Run Clock notice has priority. Clear the clock notice to resume the scene spotlight.</p></section>`
        : "";
    }
    const lines = (spotlight.gm_runtime_payload || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
    const ctas = (spotlight.cta_cards || []).map((card) => {
      const href = spotlightCtaHref(card.destination_wiki);
      return `<a href="${escapeAttr(href)}" data-help-type="${escapeAttr(card.help_type || "")}" data-gm-only="${card.gm_only ? "true" : "false"}">${escapeHtml(card.label || "Open help")}</a>`;
    }).join("");
    const type = spotlight.type === "character" ? "character" : "mechanic";
    return `
      <section class="spotlight-card" data-spotlight-card data-spotlight-type="${escapeAttr(type)}" data-spotlight-id="${escapeAttr(spotlight.spotlight_id)}">
        <p class="spotlight-eyebrow">
          <span class="spotlight-type-pill">${escapeHtml(spotlightTypeLabel(spotlight))}</span>
          <span>${escapeHtml(spotlight.priority || "med")} priority</span>
        </p>
        <h2>${escapeHtml(spotlight.alert_headline || "Scene spotlight")}</h2>
        <p class="spotlight-subheadline">${escapeHtml(spotlight.alert_subheadline || "")}</p>
        ${lines ? `<ul class="spotlight-lines">${lines}</ul>` : ""}
        ${ctas ? `<div class="spotlight-cta-row">${ctas}</div>` : ""}
        <div class="spotlight-actions">
          <button type="button" data-spotlight-ack="${escapeAttr(spotlight.spotlight_id)}">Handled</button>
          <button type="button" data-spotlight-snooze="${escapeAttr(spotlight.spotlight_id)}">Later</button>
        </div>
        ${queueCount > 1 ? `<p class="spotlight-queue-note">${queueCount - 1} more spotlight${queueCount === 2 ? "" : "s"} queued for this scene.</p>` : ""}
      </section>`;
  }

  function renderSpotlightChannel() {
    const channel = document.querySelector("[data-spotlight-channel]");
    if (!channel) return;
    const slide = currentSlide();
    const pending = pendingSpotlightsByHalf();
    const pendingCount = pendingSpotlightCount(pending);
    const { active, rows } = slide ? activeSpotlightForSlide(slide) : { active: null, rows: [] };
    const criticalClock = clockCriticalActive();
    const shouldDefer = !!active && criticalClock && active.exclusivity === SPOTLIGHT_DEFER_MODE;
    const activeCard = shouldDefer ? renderSpotlightCard(null, rows.length, true) : renderSpotlightCard(active, rows.length, false);
    const hasActive = !!activeCard;
    const hasContent = hasActive || pendingCount > 0;
    if (!hasContent) {
      channel.innerHTML = "";
      channel.hidden = true;
      channel.className = "spotlight-channel";
      return;
    }
    const open = readBoolState(SPOTLIGHT_PANEL_KEY, false);
    const activeKey = active ? spotlightSeenKey(active) : (shouldDefer ? "deferred-spotlight" : "");
    let attention = false;
    if (hasActive && !open && activeKey) {
      if (spotlightAttentionSignature !== activeKey) {
        spotlightAttentionSignature = activeKey;
        spotlightAttentionUntil = Date.now() + 1500;
        try { localStorage.setItem(SPOTLIGHT_ATTENTION_KEY, activeKey); } catch {}
      }
      attention = Date.now() <= spotlightAttentionUntil;
    }
    const count = hasActive ? Math.max(1, rows.length) : pendingCount;
    const countLabel = hasActive
      ? `${count} scene spotlight${count === 1 ? "" : "s"}`
      : `${pendingCount} PC spotlight${pendingCount === 1 ? "" : "s"}`;
    const toggleLabel = `${open ? "Hide" : "Show"} spotlights: ${countLabel}`;
    channel.hidden = false;
    channel.className = [
      "spotlight-channel",
      open ? "is-open" : "is-collapsed",
      hasActive ? "has-active" : "",
      pendingCount ? "has-pending" : "",
      attention ? "has-attention" : "",
    ].filter(Boolean).join(" ");
    channel.innerHTML = `
      <section class="spotlight-tray" data-spotlight-tray aria-label="Spotlight tray">
        <button class="spotlight-tray-toggle" type="button" data-spotlight-toggle aria-label="${escapeAttr(toggleLabel)}" title="${escapeAttr(toggleLabel)}" aria-expanded="${open ? "true" : "false"}">
          <span class="spotlight-tray-icon" aria-hidden="true">!</span>
          <span class="spotlight-tray-count" aria-label="${escapeAttr(countLabel)}">${escapeHtml(String(count))}</span>
        </button>
        <div class="spotlight-tray-body" data-spotlight-tray-body${open ? "" : " hidden"}>
          ${activeCard}
          ${renderPendingSpotlights(pending)}
        </div>
      </section>`;
  }

  function setSpotlightTrayOpen(open) {
    writeBoolState(SPOTLIGHT_PANEL_KEY, !!open);
    renderSpotlightChannel();
  }

  function acknowledgeSpotlight(id) {
    const slide = currentSlide();
    const spotlight = (slide?.spotlights || []).find((row) => row.spotlight_id === id)
      || slides.flatMap((row) => row.spotlights || []).find((row) => row.spotlight_id === id);
    if (!spotlight) return;
    const store = readSpotlightState();
    store.acknowledged[spotlightSeenKey(spotlight)] = Date.now();
    if (spotlight.type === "character" && spotlight.character_ref) {
      store.characters[spotlight.character_ref] = store.characters[spotlight.character_ref] || {};
      store.characters[spotlight.character_ref][spotlight.half || "early"] = true;
    }
    writeSpotlightState(store);
    renderSpotlightChannel();
    showStatus("Spotlight marked handled");
  }

  function snoozeSpotlight(id) {
    const store = readSpotlightState();
    store.snoozed[id] = Date.now();
    writeSpotlightState(store);
    renderSpotlightChannel();
    showStatus("Spotlight moved later");
  }

  function resetSpotlights() {
    writeSpotlightState({ acknowledged: {}, snoozed: {}, characters: {} });
    renderSpotlightChannel();
    showStatus("Spotlight state reset");
  }

  async function loadSlides() {
    if (Array.isArray(window.GOLDSPIRE_SLIDES)) return window.GOLDSPIRE_SLIDES;
    try {
      const response = await fetch("data/slides.json");
      return await response.json();
    } catch {
      return [];
    }
  }

  async function loadJsonFile(path, fallback) {
    try {
      const response = await fetch(path);
      if (!response.ok) return fallback;
      return await response.json();
    } catch {
      return fallback;
    }
  }

  async function loadNpcData() {
    npcProfiles = await loadJsonFile("data/npc-profiles.json", {});
    backupNpcs = await loadJsonFile("data/backup-npcs.json", []);
  }

  async function loadFactionData() {
    factionProfiles = await loadJsonFile("data/faction-profiles.json", window.ATLAS_FACTIONS || {});
    factionPicker = await loadJsonFile("data/faction-picker.json", []);
    worldConnectionQuestions = await loadJsonFile("data/world-connection-questions.json", window.ATLAS_WORLD_CONNECTION_QUESTIONS || {});
  }

  async function loadLocationData() {
    locationProfiles = await loadJsonFile("data/location-profiles.json", window.ATLAS_LOCATIONS || {});
    locationPicker = await loadJsonFile("data/location-picker.json", []);
  }

  async function loadItemData() {
    itemProfiles = await loadJsonFile("data/item-profiles.json", window.ATLAS_ITEMS || {});
    itemPicker = await loadJsonFile("data/item-picker.json", []);
  }

  async function loadClueData() {
    clueProfiles = await loadJsonFile("data/clue-profiles.json", window.ATLAS_CLUES || {});
    cluePicker = await loadJsonFile("data/clue-picker.json", []);
  }

  function currentIndex() {
    return Math.max(0, slides.findIndex((slide) => slide.id === state.currentSlideId));
  }

  function currentSlide() {
    return slides[currentIndex()] || slides[0];
  }

  function defaultState() {
    return {
      currentSlideId: slides[0]?.id || "",
      completedSlides: [],
      pinnedSlides: [],
      revealedSlides: [],
      activeBeatBySlide: {},
      beatAutoplayBySlide: {},
      playerDisplayBlackout: false,
      autoCompletePreviousSceneOnNext: true,
      syncOnSlideChange: true,
      imageCollapsed: false,
      filmstripCollapsed: true,
      dismissedNpcCards: {},
      summonedNpcsBySlide: {},
      dismissedFactionCards: {},
      summonedFactionsBySlide: {},
      dismissedLocationCards: {},
      summonedLocationsBySlide: {},
      dismissedItemCards: {},
      summonedItemsBySlide: {},
      dismissedClueCards: {},
      summonedCluesBySlide: {},
    };
  }

  function normalizeState() {
    state = { ...defaultState(), ...state };
    if (!slides.some((slide) => slide.id === state.currentSlideId)) state.currentSlideId = slides[0]?.id || "";
    for (const key of ["completedSlides", "pinnedSlides", "revealedSlides"]) {
      if (!Array.isArray(state[key])) state[key] = [];
    }
    if (!state.activeBeatBySlide || typeof state.activeBeatBySlide !== "object" || Array.isArray(state.activeBeatBySlide)) state.activeBeatBySlide = {};
    if (!state.beatAutoplayBySlide || typeof state.beatAutoplayBySlide !== "object" || Array.isArray(state.beatAutoplayBySlide)) state.beatAutoplayBySlide = {};
    if (!state.dismissedNpcCards || typeof state.dismissedNpcCards !== "object" || Array.isArray(state.dismissedNpcCards)) state.dismissedNpcCards = {};
    if (!state.summonedNpcsBySlide || typeof state.summonedNpcsBySlide !== "object" || Array.isArray(state.summonedNpcsBySlide)) state.summonedNpcsBySlide = {};
    if (!state.dismissedFactionCards || typeof state.dismissedFactionCards !== "object" || Array.isArray(state.dismissedFactionCards)) state.dismissedFactionCards = {};
    if (!state.summonedFactionsBySlide || typeof state.summonedFactionsBySlide !== "object" || Array.isArray(state.summonedFactionsBySlide)) state.summonedFactionsBySlide = {};
    if (!state.dismissedLocationCards || typeof state.dismissedLocationCards !== "object" || Array.isArray(state.dismissedLocationCards)) state.dismissedLocationCards = {};
    if (!state.summonedLocationsBySlide || typeof state.summonedLocationsBySlide !== "object" || Array.isArray(state.summonedLocationsBySlide)) state.summonedLocationsBySlide = {};
    if (!state.dismissedItemCards || typeof state.dismissedItemCards !== "object" || Array.isArray(state.dismissedItemCards)) state.dismissedItemCards = {};
    if (!state.summonedItemsBySlide || typeof state.summonedItemsBySlide !== "object" || Array.isArray(state.summonedItemsBySlide)) state.summonedItemsBySlide = {};
    if (!state.dismissedClueCards || typeof state.dismissedClueCards !== "object" || Array.isArray(state.dismissedClueCards)) state.dismissedClueCards = {};
    if (!state.summonedCluesBySlide || typeof state.summonedCluesBySlide !== "object" || Array.isArray(state.summonedCluesBySlide)) state.summonedCluesBySlide = {};
    normalizePinnedSlides();
    saveState();
  }

  function normalizePinnedSlides() {
    const validIds = new Set(slides.map((slide) => slide.id));
    const seen = new Set();
    state.pinnedSlides = (state.pinnedSlides || [])
      .map((id) => String(id || ""))
      .filter((id) => {
        if (!id || !validIds.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, PINNED_SHORTCUT_KEYS.length);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  function runIcon(action, label, icon, danger = false, shortLabel = "") {
    const classes = danger ? "run-icon-button danger" : "run-icon-button";
    const short = shortLabel ? ` data-short-label="${escapeAttr(shortLabel)}"` : "";
    return `<button class="${classes}" type="button" data-run-action="${escapeAttr(action)}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}"${short}><img src="assets/icons/${escapeAttr(icon)}" alt="" aria-hidden="true"><span class="sr-only">${escapeHtml(label)}</span></button>`;
  }

  function playerTextToolGroup(mode = "player-display") {
    return `<div class="slide-action-group" aria-label="Player display and text actions">
      <p class="slide-action-group-label">Player Display / Text</p>
      <div class="slide-action-row">
        ${runIcon("show-image", "Send current beat image to Player Display", "live-player-display.png", false, "Image")}
        ${runIcon("show-current-text", "Send current beat text to Player Display", "action-reveal.png", false, "Text")}
        ${runIcon("copy-text", "Copy player text", "live-copy.png", false, "Copy")}
        ${runIcon("open-display", "Open Player Display for current beat", "live-open-window.png", false, "Open")}
        ${runIcon("print-text", "Print player text", "live-print.png", false, "Print")}
        ${runIcon("show-text", "Send current beat as fullscreen text", "live-fullscreen.png", false, "Full")}
      </div>
    </div>`;
  }

  function runPayloadAttr(payload) {
    return escapeAttr(JSON.stringify(payload || {}));
  }

  function cleanPlayerChunkText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function runPlayerTextPayload(title, text, sceneId = "") {
    const clean = cleanPlayerChunkText(text);
    return {
      kind: "text",
      id: sceneId || currentSlide()?.id || "player-text",
      title: cleanPlayerChunkText(title) || "Player Text",
      text: clean,
      caption: clean,
      readAloud: clean,
      publicObjective: clean,
      scene_id: sceneId || currentSlide()?.id || "",
      displayMode: "read-aloud-fullscreen",
    };
  }

  function runPlayerImagePayload(title, image, alt = "", caption = "", sceneId = "") {
    const cleanCaption = cleanPlayerChunkText(caption);
    return {
      kind: "image",
      id: sceneId || currentSlide()?.id || "player-image",
      title: cleanPlayerChunkText(title) || "Player Image",
      image,
      alt: cleanPlayerChunkText(alt) || cleanPlayerChunkText(title) || "Player-facing image.",
      caption: cleanCaption,
      text: cleanCaption,
      scene_id: sceneId || currentSlide()?.id || "",
      displayMode: "image-title-caption",
    };
  }

  function entityPlayerDisplayTitle(entity = {}) {
    return entity.player_display_title || entity.playerDisplayTitle || entity.name || "Entity";
  }

  function entityPlayerDisplayCaption(entity = {}) {
    return entity.player_display_caption || entity.playerDisplayCaption || entity.robust?.player_description || entity.summary || entity.role || "";
  }

  function runImageSendButton(title, image, alt = "", caption = "", sceneId = "") {
    if (!image) return "";
    return `<button class="run-inline-affordance run-image-send" type="button" data-run-inline-action="send-image" data-run-player-payload="${runPayloadAttr(runPlayerImagePayload(title, image, alt, caption, sceneId))}" aria-label="${escapeAttr(`Send ${title || "image"} to Player Display`)}" title="${escapeAttr(`Send ${title || "image"} to Player Display`)}"><img src="assets/icons/live-player-display.png" alt="" aria-hidden="true"><span class="sr-only">Send image to Player Display</span></button>`;
  }

  function runInlineIcon(action, label, icon) {
    return `<button class="run-inline-affordance" type="button" data-run-inline-action="${escapeAttr(action)}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}"><img src="assets/icons/${escapeAttr(icon)}" alt="" aria-hidden="true"><span class="sr-only">${escapeHtml(label)}</span></button>`;
  }

  function runTextActions() {
    return `<span class="run-throw-actions" aria-label="Player display text actions">${runInlineIcon("send-text", "Send text to Player Display", "action-reveal.png")}${runInlineIcon("copy-text", "Copy player text", "live-copy.png")}</span>`;
  }

  function runThrowableTextChunk(title, text, options = {}) {
    const clean = cleanPlayerChunkText(text);
    if (!clean) return options.empty || "";
    const tag = options.tag || "p";
    const className = options.className ? ` ${options.className}` : "";
    const bodyTag = ["div", "section", "article"].includes(tag) ? "div" : "span";
    const body = options.bodyHtml || linkifyEntities(clean);
    const payload = runPayloadAttr(runPlayerTextPayload(title, clean, options.sceneId || currentSlide()?.id || ""));
    return `<${tag} class="run-throwable-text${className}" data-run-player-payload="${payload}"><${bodyTag} class="run-throwable-body">${body}</${bodyTag}>${runTextActions()}</${tag}>`;
  }

  function runThrowableList(items, title, sceneId = "") {
    const rows = (items || []).filter(Boolean);
    if (!rows.length) return "";
    return `<ul>${rows.map((item) => runThrowableTextChunk(title, item, { tag: "li", sceneId })).join("")}</ul>`;
  }

  function npcProfileById(id) {
    if (!id) return null;
    if (npcProfiles[id]) return npcProfiles[id];
    const backup = (backupNpcs || []).find((row) => row.id === id);
    if (backup?.profile) return backup.profile;
    const slide = currentSlide();
    const summoned = (state.summonedNpcsBySlide?.[slide?.id] || []).find((entry) => entry.id === id);
    return summoned?.profile || null;
  }

  function npcName(profile = {}) {
    return profile.block1?.name || profile.player_safe?.name || profile.name || "NPC";
  }

  function npcOneLine(profile = {}) {
    return profile.block1?.one_line || profile.player_safe?.one_line || "";
  }

  function npcPhysicalDescription(profile = {}) {
    return profile.player_safe?.physical_description || profile.block2?.visual_read_aloud || profile.block2?.appearance || npcOneLine(profile);
  }

  function npcCombatSummary(profile = {}) {
    if (!profile.combatant && !profile.block5?.stat_block_ref) return "";
    return profile.block5?.combat_summary || profile.block5?.stat_block_ref || "";
  }

  function npcPlayerPayload(id) {
    const profile = npcProfileById(id);
    if (!profile) return null;
    const name = npcName(profile);
    const oneLine = npcOneLine(profile);
    const text = oneLine ? `${name}: ${oneLine}` : name;
    return runPlayerTextPayload(name, text, `npc-${id}`);
  }

  function npcDescriptionPayload(id) {
    const profile = npcProfileById(id);
    if (!profile) return null;
    const text = npcPhysicalDescription(profile);
    return text ? runPlayerTextPayload("A person enters the scene", text, `npc-description-${id}`) : null;
  }

  function npcDismissKey(slideId, npcId) {
    return `${slideId || "slide"}::${npcId || "npc"}`;
  }

  function currentNpcEntries(slide = currentSlide()) {
    if (!slide) return [];
    const entries = [];
    const seen = new Set();
    (slide.entityIds || []).forEach((id) => {
      const profile = npcProfiles[id];
      if (!profile || seen.has(id)) return;
      seen.add(id);
      entries.push({ id, profile, source: "scene" });
    });
    (state.summonedNpcsBySlide?.[slide.id] || []).forEach((entry) => {
      const id = entry.id || "";
      if (!id || seen.has(id)) return;
      const profile = entry.profile || npcProfiles[id];
      if (!profile) return;
      seen.add(id);
      entries.push({ id, profile, source: entry.source || "summoned" });
    });
    return entries;
  }

  function npcQuickCard(entry, slide) {
    const profile = entry.profile || {};
    const block = profile.block1 || {};
    const id = entry.id;
    const requiredAck = entry.source === "scene" ? "true" : "false";
    const offers = (block.offers_players || []).slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const physical = npcPhysicalDescription(profile);
    const combat = npcCombatSummary(profile);
    return `<section class="npc-quick-card" data-npc-card data-npc-id="${escapeAttr(id)}" data-source="${escapeAttr(entry.source)}">
      <p class="npc-eyebrow"><span>NPC quick-card</span><span>${entry.source === "scene" ? "Scene entry" : "Summoned"}</span></p>
      <h2>${escapeHtml(npcName(profile))}</h2>
      <p class="npc-player-line">${escapeHtml(npcOneLine(profile))}</p>
      ${physical ? `<p class="npc-physical-line">${escapeHtml(physical)}</p>` : ""}
      ${combat ? `<p class="npc-combat-line"><strong>Combat:</strong> ${escapeHtml(combat)}</p>` : ""}
      <dl class="npc-role-grid">
        <dt>Story</dt><dd>${escapeHtml(block.story_role || "")}</dd>
        <dt>Game</dt><dd>${escapeHtml(block.game_role || "")}</dd>
        <dt>Critical</dt><dd>${escapeHtml(block.critical_info || "")}</dd>
        <dt>Disposition</dt><dd>${escapeHtml(block.disposition_default || "")}</dd>
        <dt>Lever</dt><dd>${escapeHtml(block.the_lever || "")}</dd>
      </dl>
      ${offers ? `<details class="npc-offers"><summary>What they offer</summary><ul>${offers}</ul></details>` : ""}
      <div class="npc-card-actions">
        <button type="button" data-npc-profile-id="${escapeAttr(id)}">Full persona</button>
        <button type="button" data-npc-description="${escapeAttr(id)}">Show description</button>
        <button type="button" data-npc-player-line="${escapeAttr(id)}">Reveal name</button>
        <button type="button" data-npc-dismiss="${escapeAttr(id)}" data-npc-required="${requiredAck}">Dismiss</button>
      </div>
    </section>`;
  }

  function renderNpcChannel() {
    const channel = document.querySelector("[data-npc-channel]");
    if (!channel) return;
    const slide = currentSlide();
    const entries = currentNpcEntries(slide).filter((entry) => !state.dismissedNpcCards?.[npcDismissKey(slide?.id, entry.id)]);
    if (entries.length) {
      const activeSpotlight = typeof activeSpotlightForSlide === "function" ? activeSpotlightForSlide(slide)?.active : null;
      const spotlightPriority = String(activeSpotlight?.priority || "").toLowerCase();
      if (clockCriticalActive() || ["high", "urgent", "critical"].includes(spotlightPriority)) {
        channel.innerHTML = `<section class="npc-quick-card is-deferred" data-npc-card>
          <p class="npc-eyebrow"><span>NPC queued</span><span>${clockCriticalActive() ? "Clock priority" : "Spotlight priority"}</span></p>
          <h2>${entries.length} NPC quick-card${entries.length === 1 ? "" : "s"} waiting</h2>
          <p class="npc-player-line">Clear the higher-priority notice, then return here for role-first NPC context.</p>
        </section>`;
        return;
      }
    }
    channel.innerHTML = entries.map((entry) => npcQuickCard(entry, slide)).join("");
  }

  function npcValueMarkup(value) {
    if (Array.isArray(value)) {
      return value.length ? `<ul>${value.map((item) => `<li>${npcValueMarkup(item)}</li>`).join("")}</ul>` : `<p class="muted">No table-facing detail added.</p>`;
    }
    if (value && typeof value === "object") {
      return `<dl class="npc-dialog-dl">${Object.entries(value).map(([key, item]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${npcValueMarkup(item)}</dd>`).join("")}</dl>`;
    }
    return `<span>${escapeHtml(value || "")}</span>`;
  }

  function npcProfileSection(title, block) {
    const rows = Object.entries(block || {}).filter(([, value]) => value !== "" && value != null && !(Array.isArray(value) && !value.length));
    if (!rows.length) return "";
    return `<section class="npc-dialog-section"><h3>${escapeHtml(title)}</h3><dl class="npc-dialog-dl">${rows.map(([key, value]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${npcValueMarkup(value)}</dd>`).join("")}</dl></section>`;
  }

  function openNpcProfile(id) {
    const profile = npcProfileById(id);
    if (!profile) {
      showStatus("No NPC profile found");
      return;
    }
    lastDialogOpener = document.activeElement;
    const body = document.querySelector("[data-npc-profile-dialog-body]");
    if (!body) return;
    body.innerHTML = `<p class="private-note">GM-only NPC persona</p>
      <h2>${escapeHtml(npcName(profile))}</h2>
      <p class="npc-player-line">${escapeHtml(npcOneLine(profile))}</p>
      ${npcProfileSection("Role-first block", profile.block1 || {})}
      ${npcProfileSection("Persona", profile.block2 || {})}
      ${npcProfileSection("Interaction and persuasion", profile.block3 || {})}
      ${npcProfileSection("World tie and lore", profile.block4 || {})}
      ${profile.combatant || profile.block5?.stat_block_ref || profile.block5?.person_under_the_fight ? npcProfileSection("Combatant addendum", profile.block5 || {}) : ""}`;
    document.querySelector("#npc-profile-dialog")?.showModal();
  }

  function sendNpcPlayerLine(id) {
    const payload = npcPlayerPayload(id);
    if (!payload) {
      showStatus("No player-safe NPC line found");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Revealed NPC name and one-line");
  }

  function sendNpcDescription(id) {
    const payload = npcDescriptionPayload(id);
    if (!payload) {
      showStatus("No player-safe NPC description found");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent NPC description without name");
  }

  function dismissNpcCard(id) {
    const slide = currentSlide();
    state.dismissedNpcCards = { ...(state.dismissedNpcCards || {}), [npcDismissKey(slide?.id, id)]: Date.now() };
    saveState();
    renderNpcChannel();
    showStatus("NPC quick-card dismissed");
  }

  function backupSearchBlob(row) {
    const profile = row.profile || {};
    const block = profile.block1 || {};
    return [row.id, row.name, block.one_line, block.story_role, block.game_role, block.critical_info, ...(block.offers_players || [])].join(" ").toLowerCase();
  }

  function renderNpcSummonList() {
    const list = document.querySelector("[data-npc-summon-list]");
    if (!list) return;
    const query = String(document.querySelector("[data-npc-summon-search]")?.value || "").trim().toLowerCase();
    const rows = (backupNpcs || []).filter((row) => !query || backupSearchBlob(row).includes(query));
    list.innerHTML = rows.map((row) => {
      const profile = row.profile || {};
      const block = profile.block1 || {};
      const combat = npcCombatSummary(profile);
      return `<article class="npc-summon-card">
        <h3>${escapeHtml(npcName(profile))}</h3>
        <p>${escapeHtml(npcOneLine(profile))}</p>
        <p class="muted">${escapeHtml(block.game_role || "")}</p>
        ${combat ? `<p class="npc-combat-line"><strong>Combat:</strong> ${escapeHtml(combat)}</p>` : ""}
        <div class="npc-card-actions">
          <button type="button" data-npc-summon-id="${escapeAttr(row.id)}">Summon</button>
          <button type="button" data-npc-profile-id="${escapeAttr(row.id)}">Profile</button>
          <button type="button" data-npc-description="${escapeAttr(row.id)}">Show description</button>
          <button type="button" data-npc-player-line="${escapeAttr(row.id)}">Reveal name</button>
        </div>
      </article>`;
    }).join("") || `<p class="muted">No backup NPC matches that search.</p>`;
  }

  function summonNpc(id, profile = null, source = "summoned") {
    const slide = currentSlide();
    const resolved = profile || npcProfileById(id) || (backupNpcs || []).find((row) => row.id === id)?.profile;
    if (!slide || !resolved) {
      showStatus("No NPC available to summon");
      return;
    }
    const current = (state.summonedNpcsBySlide?.[slide.id] || []).filter((entry) => entry.id !== id);
    state.summonedNpcsBySlide = {
      ...(state.summonedNpcsBySlide || {}),
      [slide.id]: [...current, { id, profile: resolved, source, summonedAt: Date.now() }],
    };
    state.dismissedNpcCards = { ...(state.dismissedNpcCards || {}) };
    delete state.dismissedNpcCards[npcDismissKey(slide.id, id)];
    saveState();
    renderNpcChannel();
    showStatus(`Summoned ${npcName(resolved)}`);
  }

  function rollNpcImprovSeed(updateStatus = true) {
    const seeds = [
      { id: "ward-peddler", name: "Ward Peddler", one: "a charm seller whose pocket ward keeps sputtering", role: "Comic pressure valve and failed-protection seed.", lever: "They talk if the PCs inspect the charm instead of mocking it." },
      { id: "lost-courier", name: "Lost Courier", one: "a torn-tag courier who swears the safe road moved", role: "Travel nudge and courier rumor.", lever: "They help if someone offers a concrete way home." },
      { id: "bramble-forager", name: "Bramble Forager", one: "a muddy-kneed forest forager with one eye on the exits", role: "Mercy lane and local pressure.", lever: "They settle when the PCs promise not to hand them to corporate punishment." },
      { id: "collections-clerk", name: "Collections Clerk", one: "a damp-ledger clerk rehearsing a speech they hate", role: "Debt pressure and values test.", lever: "They bend if the PCs separate the person from the paperwork." },
      { id: "moss-elder", name: "Moss Elder", one: "an elder carrying warm food in a covered bowl", role: "Care reset and village truth.", lever: "They answer plain questions after the table accepts food or help." },
      { id: "checkpoint-clerk", name: "Checkpoint Clerk", one: "a stamp-pad clerk afraid one missing mark will ruin them", role: "Bureaucracy comedy and custody delay.", lever: "They cooperate if the PCs give them a face-saving form of permission." },
    ];
    currentImprovSeed = seeds[Math.floor(Math.random() * seeds.length)];
    const box = document.querySelector("[data-npc-improv-seed]");
    if (box) {
      box.innerHTML = `<p><strong>${escapeHtml(currentImprovSeed.name)}</strong>: ${escapeHtml(currentImprovSeed.one)}</p><p class="muted">${escapeHtml(currentImprovSeed.role)} Lever: ${escapeHtml(currentImprovSeed.lever)}</p>`;
    }
    if (updateStatus) showStatus("Rolled backup improv seed");
  }

  function addNpcImprovSeed() {
    if (!currentImprovSeed) rollNpcImprovSeed(false);
    const seed = currentImprovSeed;
    const id = `improv-${seed.id}-${Date.now()}`;
    const profile = {
      schema_version: "npc-profile-v1",
      backup: true,
      player_safe: { name: seed.name, one_line: seed.one, physical_description: seed.one, reveal_line: `${seed.name}: ${seed.one}` },
      block1: {
        name: seed.name,
        pronunciation: seed.name,
        one_line: seed.one,
        story_role: "Improvised utility NPC for this live scene.",
        game_role: seed.role,
        critical_info: "Use them as a single scene handle, then let player choices decide whether they matter again.",
        offers_players: ["A grounded question", "A nudge toward motion", "A scene-specific clue seed"],
        disposition_default: "Nervous, useful, and immediately playable.",
        the_lever: seed.lever,
      },
      block2: { wants_now: "Get through this moment without becoming the story's victim.", larger_motivation: "Stay human inside a scene that only needs one fast handle.", wants: "Get through this moment without becoming the story's victim.", motivation: "Stay human inside a scene that only needs one fast handle.", appearance: seed.one, visual_read_aloud: seed.one, voice: [`${seed.name}: I can help if we keep this simple.`] },
      block3: { persuasion_levers: "Presence 12 works after the PCs address the immediate fear.", what_moves_them: [{ trait: "Presence", dc: 12, result: "They give one useful route, rumor, or concession." }], combat_lever: "They are not here to fight unless cornered." },
      block4: { knows_about: { player_safe: ["One local pressure point."], gm_only: ["Seed only; do not make this improvised NPC canon without Kyle."] }, hidden_plot_hooks: ["Use as a seed, not a conclusion."], ties_to_pcs: ["Any PC can engage."] },
      block5: {},
    };
    summonNpc(id, profile, "improv");
  }

  function openNpcSummonDialog() {
    lastDialogOpener = document.activeElement;
    renderNpcSummonList();
    rollNpcImprovSeed(false);
    document.querySelector("#npc-summon-dialog")?.showModal();
    window.setTimeout(() => document.querySelector("[data-npc-summon-search]")?.focus(), 30);
  }

  function factionProfileById(id) {
    if (!id) return null;
    if (factionProfiles[id]) return factionProfiles[id];
    const picker = (factionPicker || []).find((row) => row.id === id);
    if (picker?.profile) return picker.profile;
    const slide = currentSlide();
    const summoned = (state.summonedFactionsBySlide?.[slide?.id] || []).find((entry) => entry.id === id);
    return summoned?.profile || null;
  }

  function factionName(profile = {}) {
    return profile.player_safe?.name || profile.block1?.name || profile.name || "Faction";
  }

  function factionPublicFace(profile = {}) {
    return profile.player_safe?.public_face || profile.block1?.public_face || "";
  }

  function factionSlogan(profile = {}) {
    return profile.player_safe?.slogan || profile.block4?.slogan || "";
  }

  function factionPublicPayload(id) {
    const profile = factionProfileById(id);
    if (!profile || profile.auto_surface === false) return null;
    const name = factionName(profile);
    const face = factionPublicFace(profile);
    const slogan = factionSlogan(profile);
    const text = [face ? `${name}: ${face}` : name, slogan ? `Slogan: ${slogan}` : ""].filter(Boolean).join(" ");
    return runPlayerTextPayload(name, text, `faction-${id}`);
  }

  function factionDismissKey(slideId, factionId) {
    return `${slideId || "slide"}::${factionId || "faction"}`;
  }

  function currentFactionEntries(slide = currentSlide()) {
    if (!slide) return [];
    const entries = [];
    const seen = new Set();
    [...(slide.factionIds || []), ...(slide.entityIds || [])].forEach((id) => {
      const profile = factionProfiles[id];
      if (!profile || profile.auto_surface === false || seen.has(id)) return;
      seen.add(id);
      entries.push({ id, profile, source: "scene" });
    });
    (state.summonedFactionsBySlide?.[slide.id] || []).forEach((entry) => {
      const id = entry.id || "";
      if (!id || seen.has(id)) return;
      const profile = entry.profile || factionProfiles[id];
      if (!profile || profile.auto_surface === false) return;
      seen.add(id);
      entries.push({ id, profile, source: entry.source || "summoned" });
    });
    return entries;
  }

  function factionPromptFor(profile = {}, slide = currentSlide()) {
    const id = profile.id || profile.entity_id || "";
    const scenePrompt = (slide?.worldConnectionPrompts || []).find((row) => row.faction_id === id);
    if (scenePrompt?.question) return scenePrompt;
    const promptKey = profile.prompt_key || "";
    const question = worldConnectionQuestions?.in_scene?.[promptKey] || "";
    if (!question) return null;
    return { id: `${slide?.id || "slide"}-${id || promptKey}-world-connection`, faction_id: id, label: factionName(profile), question };
  }

  function readFactionAnswers() {
    const fallback = { answers: [] };
    const value = readJson(FACTION_ANSWER_KEY, fallback);
    if (!Array.isArray(value.answers)) value.answers = [];
    return value;
  }

  function writeFactionAnswers(next) {
    writeJson(FACTION_ANSWER_KEY, next);
  }

  function latestFactionAnswer(promptId, slideId) {
    const rows = readFactionAnswers().answers || [];
    return [...rows].reverse().find((row) => row.promptId === promptId && row.slideId === slideId) || null;
  }

  function factionQuickCard(entry, slide) {
    const profile = entry.profile || {};
    const block1 = profile.block1 || {};
    const block2 = profile.block2 || {};
    const block3 = profile.block3 || {};
    const id = entry.id;
    const prompt = factionPromptFor(profile, slide);
    const promptId = prompt?.id || `${slide?.id || "slide"}-${id}-world-connection`;
    const logged = prompt ? latestFactionAnswer(promptId, slide?.id || "") : null;
    const currentMove = block2.current_moves || block1.place_in_story || "";
    const imagine = profile.imagine_it_like || "";
    const promptHtml = prompt?.question ? `<details class="faction-prompt" data-faction-prompt-id="${escapeAttr(promptId)}" data-faction-id="${escapeAttr(id)}" data-slide-id="${escapeAttr(slide?.id || "")}" open>
        <summary>World connection prompt</summary>
        <p>${escapeHtml(prompt.question)}</p>
        <textarea data-faction-answer-input placeholder="Log the player's answer as table canon."></textarea>
        <div class="faction-card-actions">
          <button type="button" data-faction-send-question>Show question</button>
          <button type="button" data-faction-save-answer>Log answer</button>
        </div>
        ${logged ? `<p class="faction-answer-log"><strong>Last answer:</strong> ${escapeHtml(logged.answer)}</p>` : ""}
      </details>` : "";
    return `<section class="faction-quick-card" data-faction-card data-faction-id="${escapeAttr(id)}" data-source="${escapeAttr(entry.source)}">
      <p class="npc-eyebrow"><span>Faction quick-card</span><span>${entry.source === "scene" ? "Scene entry" : "Summoned"}</span></p>
      <h2>${escapeHtml(factionName(profile))}</h2>
      <p class="faction-public-line">${escapeHtml(factionPublicFace(profile))}</p>
      ${imagine ? `<p class="faction-current-move"><strong>Imagine this like:</strong> ${escapeHtml(imagine)}</p>` : ""}
      ${currentMove ? `<p class="faction-current-move">${escapeHtml(currentMove)}</p>` : ""}
      <dl class="faction-role-grid">
        <dt>Story</dt><dd>${escapeHtml(block1.place_in_story || "")}</dd>
        <dt>Function</dt><dd>${escapeHtml(block1.what_they_really_do || "")}</dd>
        <dt>Disposition</dt><dd>${escapeHtml(block1.disposition_to_pcs || "")}</dd>
        <dt>Lever</dt><dd>${escapeHtml(block1.the_lever || "")}</dd>
        <dt>Preys on</dt><dd>${escapeHtml(block3.who_they_prey_on || "")}</dd>
      </dl>
      ${promptHtml}
      <div class="faction-card-actions">
        <button type="button" data-faction-profile-id="${escapeAttr(id)}">Full institution</button>
        <button type="button" data-faction-player-line="${escapeAttr(id)}">Send public face</button>
        <a class="button secondary" href="${escapeAttr(block1.wiki_link || `pages/entities/${id}.html`)}">Open wiki</a>
        <button type="button" data-faction-dismiss="${escapeAttr(id)}">Dismiss</button>
      </div>
    </section>`;
  }

  function renderFactionChannel() {
    const channel = document.querySelector("[data-faction-channel]");
    if (!channel) return;
    const slide = currentSlide();
    const entries = currentFactionEntries(slide).filter((entry) => !state.dismissedFactionCards?.[factionDismissKey(slide?.id, entry.id)]);
    if (entries.length) {
      const activeSpotlight = typeof activeSpotlightForSlide === "function" ? activeSpotlightForSlide(slide)?.active : null;
      const spotlightPriority = String(activeSpotlight?.priority || "").toLowerCase();
      if (clockCriticalActive() || ["high", "urgent", "critical"].includes(spotlightPriority)) {
        channel.innerHTML = `<section class="faction-quick-card is-deferred" data-faction-card>
          <p class="npc-eyebrow"><span>Faction queued</span><span>${clockCriticalActive() ? "Clock priority" : "Spotlight priority"}</span></p>
          <h2>${entries.length} faction card${entries.length === 1 ? "" : "s"} waiting</h2>
          <p class="faction-public-line">Clear the higher-priority notice, then return here for role-first faction context.</p>
        </section>`;
        return;
      }
    }
    channel.innerHTML = entries.map((entry) => factionQuickCard(entry, slide)).join("");
  }

  function factionValueMarkup(value) {
    if (Array.isArray(value)) {
      return value.length ? `<ul>${value.map((item) => `<li>${factionValueMarkup(item)}</li>`).join("")}</ul>` : `<p class="muted">No table-facing detail added.</p>`;
    }
    if (value && typeof value === "object") {
      return `<dl class="npc-dialog-dl">${Object.entries(value).map(([key, item]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${factionValueMarkup(item)}</dd>`).join("")}</dl>`;
    }
    return `<span>${linkifyEntities(value || "")}</span>`;
  }

  function factionProfileSection(title, block) {
    const rows = Object.entries(block || {}).filter(([, value]) => value !== "" && value != null && !(Array.isArray(value) && !value.length));
    if (!rows.length) return "";
    return `<section class="npc-dialog-section"><h3>${escapeHtml(title)}</h3><dl class="npc-dialog-dl">${rows.map(([key, value]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${factionValueMarkup(value)}</dd>`).join("")}</dl></section>`;
  }

  function openFactionProfile(id) {
    const profile = factionProfileById(id);
    if (!profile) {
      showStatus("No faction profile found");
      return;
    }
    lastDialogOpener = document.activeElement;
    const body = document.querySelector("[data-faction-profile-dialog-body]");
    if (!body) return;
    body.innerHTML = `<p class="private-note">GM-only faction institution</p>
      <h2>${escapeHtml(factionName(profile))}</h2>
      <p class="faction-public-line">${escapeHtml(factionPublicFace(profile))}</p>
      ${profile.atlas_lore_note ? `<p class="private-note">${escapeHtml(profile.atlas_lore_note)}</p>` : ""}
      ${factionProfileSection("Description bank", profile.writing_layer || {})}
      ${factionProfileSection("Role-first block", profile.block1 || {})}
      ${factionProfileSection("Living institution", profile.block2 || {})}
      ${factionProfileSection("Relationships", profile.block3 || {})}
      ${factionProfileSection("Brand voice", profile.block4 || {})}
      ${factionProfileSection("Secrets and disclosure", profile.block5 || {})}`;
    document.querySelector("#faction-profile-dialog")?.showModal();
  }

  function sendFactionPublicLine(id) {
    const payload = factionPublicPayload(id);
    if (!payload) {
      showStatus("No player-safe faction line found");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent faction public face");
  }

  function dismissFactionCard(id) {
    const slide = currentSlide();
    state.dismissedFactionCards = { ...(state.dismissedFactionCards || {}), [factionDismissKey(slide?.id, id)]: Date.now() };
    saveState();
    renderFactionChannel();
    showStatus("Faction quick-card dismissed");
  }

  function factionSearchBlob(row) {
    const profile = row.profile || {};
    const block1 = profile.block1 || {};
    const block2 = profile.block2 || {};
    const block3 = profile.block3 || {};
    return [row.id, row.name, row.public_face, row.slogan, block1.place_in_story, block1.what_they_really_do, block1.the_lever, block2.current_moves, ...(block3.allies || []), ...(block3.rivals || [])].join(" ").toLowerCase();
  }

  function renderFactionPickerList() {
    const list = document.querySelector("[data-faction-picker-list]");
    if (!list) return;
    const query = String(document.querySelector("[data-faction-picker-search]")?.value || "").trim().toLowerCase();
    const rows = (factionPicker || []).filter((row) => !query || factionSearchBlob(row).includes(query));
    list.innerHTML = rows.map((row) => {
      const profile = row.profile || {};
      const block1 = profile.block1 || {};
      return `<article class="npc-summon-card">
        <h3>${escapeHtml(factionName(profile))}</h3>
        <p>${escapeHtml(factionPublicFace(profile))}</p>
        <p class="muted">${escapeHtml(block1.place_in_story || row.slogan || "")}</p>
        <div class="npc-card-actions">
          <button type="button" data-faction-summon-id="${escapeAttr(row.id)}">Summon card</button>
          <button type="button" data-faction-profile-id="${escapeAttr(row.id)}">Profile</button>
          <button type="button" data-faction-player-line="${escapeAttr(row.id)}">Send public face</button>
        </div>
      </article>`;
    }).join("") || `<p class="muted">No faction matches that search.</p>`;
  }

  function summonFaction(id, profile = null, source = "summoned") {
    const slide = currentSlide();
    const resolved = profile || factionProfileById(id) || (factionPicker || []).find((row) => row.id === id)?.profile;
    if (!slide || !resolved || resolved.auto_surface === false) {
      showStatus("No player-safe faction card available to summon");
      return;
    }
    const current = (state.summonedFactionsBySlide?.[slide.id] || []).filter((entry) => entry.id !== id);
    state.summonedFactionsBySlide = {
      ...(state.summonedFactionsBySlide || {}),
      [slide.id]: [...current, { id, profile: resolved, source, summonedAt: Date.now() }],
    };
    state.dismissedFactionCards = { ...(state.dismissedFactionCards || {}) };
    delete state.dismissedFactionCards[factionDismissKey(slide.id, id)];
    saveState();
    renderFactionChannel();
    showStatus(`Summoned ${factionName(resolved)}`);
  }

  function openFactionPickerDialog() {
    lastDialogOpener = document.activeElement;
    renderFactionPickerList();
    document.querySelector("#faction-picker-dialog")?.showModal();
    window.setTimeout(() => document.querySelector("[data-faction-picker-search]")?.focus(), 30);
  }

  function locationProfileById(id) {
    if (!id) return null;
    if (locationProfiles[id]) return locationProfiles[id];
    const picker = (locationPicker || []).find((row) => row.id === id);
    if (picker?.profile) return picker.profile;
    const slide = currentSlide();
    const summoned = (state.summonedLocationsBySlide?.[slide?.id] || []).find((entry) => entry.id === id);
    return summoned?.profile || null;
  }

  function locationName(profile = {}) {
    return profile.player_safe?.name || profile.block1?.name || profile.name || "Location";
  }

  function locationOneLine(profile = {}) {
    return profile.player_safe?.one_line || profile.block1?.story_function || "";
  }

  function locationReadAloud(profile = {}) {
    return profile.player_safe?.read_aloud || profile.player_safe?.one_line || "";
  }

  function locationVisualAssets(profile = {}) {
    return profile.visual_assets || {};
  }

  function locationVisualSlot(profile = {}, key = "") {
    const visuals = locationVisualAssets(profile);
    if (key === "profile_scene") return visuals.profile_scene || null;
    if (key === "primary_map") return visuals.primary_map || null;
    return (visuals.beat_images || []).find((slot) => slot.key === key) || null;
  }

  function locationVisualImage(slot = {}) {
    return slot.runtime_path || slot.fallback_runtime_path || "";
  }

  function locationVisualPayload(id, key) {
    const profile = locationProfileById(id);
    const slot = locationVisualSlot(profile || {}, key);
    const image = locationVisualImage(slot || {});
    if (!profile || !slot || !image) return null;
    const title = `${locationName(profile)}: ${slot.label || "Location visual"}`;
    const caption = slot.player_caption || locationOneLine(profile) || locationReadAloud(profile);
    return runPlayerImagePayload(title, image, slot.alt || title, caption, `location-${id}-${key}`);
  }

  function locationVisualActionButton(id, key, label) {
    const payload = locationVisualPayload(id, key);
    if (!payload) return "";
    return `<button type="button" data-location-visual-id="${escapeAttr(id)}" data-location-visual-key="${escapeAttr(key)}">${escapeHtml(label)}</button>`;
  }

  function sendLocationVisual(id, key) {
    const payload = locationVisualPayload(id, key);
    if (!payload) {
      showStatus("No saved location visual is available yet");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent location visual");
  }

  function locationPublicPayload(id) {
    const profile = locationProfileById(id);
    if (!profile || profile.auto_surface === false) return null;
    const name = locationName(profile);
    const text = [locationOneLine(profile), locationReadAloud(profile)].filter(Boolean).join(" ");
    return runPlayerTextPayload(name, `${name}: ${text}`, `location-${id}`);
  }

  function locationDismissKey(slideId, locationId) {
    return `${slideId || "slide"}::${locationId || "location"}`;
  }

  function currentLocationEntries(slide = currentSlide()) {
    if (!slide) return [];
    const entries = [];
    const seen = new Set();
    const ids = [
      ...(slide.locationIds || []),
      ...(slide.locationProfileIds || []),
      ...(slide.entityIds || []),
      ...(slide.mapData?.entityIds || []),
      slide.mapData?.locationProfileId || "",
    ];
    ids.forEach((id) => {
      const profile = locationProfiles[id];
      if (!profile || profile.auto_surface === false || seen.has(id)) return;
      seen.add(id);
      entries.push({ id, profile, source: "scene" });
    });
    (state.summonedLocationsBySlide?.[slide.id] || []).forEach((entry) => {
      const id = entry.id || "";
      if (!id || seen.has(id)) return;
      const profile = entry.profile || locationProfiles[id];
      if (!profile || profile.auto_surface === false) return;
      seen.add(id);
      entries.push({ id, profile, source: entry.source || "summoned" });
    });
    return entries;
  }

  function locationQuickCard(entry, slide) {
    const profile = entry.profile || {};
    const block1 = profile.block1 || {};
    const block2 = profile.block2 || {};
    const block3 = profile.block3 || {};
    const block4 = profile.block4 || {};
    const imagine = profile.imagine_it_like || "";
    const senses = (block2.sensory_stack || []).slice(0, 3).map((row) => `<li><strong>${escapeHtml(row.sense || "Detail")}:</strong> ${escapeHtml(row.detail || "")}</li>`).join("");
    const actions = [...(block3.interactables || []), ...(block3.checks || [])].slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const motion = (block4.living_motion || []).slice(0, 2).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const id = entry.id;
    const visualActions = [
      locationVisualActionButton(id, "profile_scene", "Show profile image"),
      locationVisualActionButton(id, "primary_map", "Show map"),
      locationVisualActionButton(id, "beat_arrival", "Show arrival beat"),
      locationVisualActionButton(id, "beat_detail", "Show detail beat"),
    ].filter(Boolean).join("");
    return `<section class="location-quick-card" data-location-card data-location-id="${escapeAttr(id)}" data-source="${escapeAttr(entry.source)}">
      <p class="npc-eyebrow"><span>Location quick-card</span><span>${entry.source === "scene" ? "Scene entry" : "Opened"}</span></p>
      <h2>${escapeHtml(locationName(profile))}</h2>
      <p class="location-public-line">${escapeHtml(locationOneLine(profile))}</p>
      ${imagine ? `<p class="location-current-pressure"><strong>Imagine this like:</strong> ${escapeHtml(imagine)}</p>` : ""}
      ${block1.current_pressure ? `<p class="location-current-pressure">${escapeHtml(block1.current_pressure)}</p>` : ""}
      <dl class="location-role-grid">
        <dt>Story</dt><dd>${escapeHtml(block1.story_function || "")}</dd>
        <dt>GM use</dt><dd>${escapeHtml(block1.gm_orientation || "")}</dd>
        <dt>Capital</dt><dd>${escapeHtml(block1.capital_status || "")}</dd>
      </dl>
      ${senses ? `<details class="location-detail" open><summary>Sensory stack</summary><ul>${senses}</ul></details>` : ""}
      ${actions ? `<details class="location-detail"><summary>Player actions</summary><ul>${actions}</ul></details>` : ""}
      ${motion ? `<details class="location-detail"><summary>What keeps moving</summary><ul>${motion}</ul></details>` : ""}
      ${visualActions ? `<div class="location-card-actions location-visual-actions">${visualActions}</div>` : ""}
      <div class="location-card-actions">
        <button type="button" data-location-profile-id="${escapeAttr(id)}">Full place</button>
        <button type="button" data-location-player-line="${escapeAttr(id)}">Send read-aloud</button>
        <a class="button secondary" href="${escapeAttr(block1.wiki_link || `pages/entities/${id}.html`)}">Open wiki</a>
        <button type="button" data-location-dismiss="${escapeAttr(id)}">Dismiss</button>
      </div>
    </section>`;
  }

  function renderLocationChannel() {
    const channel = document.querySelector("[data-location-channel]");
    if (!channel) return;
    const slide = currentSlide();
    const entries = currentLocationEntries(slide).filter((entry) => !state.dismissedLocationCards?.[locationDismissKey(slide?.id, entry.id)]);
    if (entries.length) {
      const activeSpotlight = typeof activeSpotlightForSlide === "function" ? activeSpotlightForSlide(slide)?.active : null;
      const spotlightPriority = String(activeSpotlight?.priority || "").toLowerCase();
      if (clockCriticalActive() || ["high", "urgent", "critical"].includes(spotlightPriority)) {
        channel.innerHTML = `<section class="location-quick-card is-deferred" data-location-card>
          <p class="npc-eyebrow"><span>Location queued</span><span>${clockCriticalActive() ? "Clock priority" : "Spotlight priority"}</span></p>
          <h2>${entries.length} location card${entries.length === 1 ? "" : "s"} waiting</h2>
          <p class="location-public-line">Clear the higher-priority notice, then return here for place context.</p>
        </section>`;
        return;
      }
    }
    channel.innerHTML = entries.map((entry) => locationQuickCard(entry, slide)).join("");
  }

  function locationValueMarkup(value) {
    if (Array.isArray(value)) {
      return value.length ? `<ul>${value.map((item) => `<li>${locationValueMarkup(item)}</li>`).join("")}</ul>` : `<p class="muted">No table-facing detail added.</p>`;
    }
    if (value && typeof value === "object") {
      return `<dl class="npc-dialog-dl">${Object.entries(value).map(([key, item]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${locationValueMarkup(item)}</dd>`).join("")}</dl>`;
    }
    return `<span>${linkifyEntities(value || "")}</span>`;
  }

  function locationProfileSection(title, block) {
    const rows = Object.entries(block || {}).filter(([, value]) => value !== "" && value != null && !(Array.isArray(value) && !value.length));
    if (!rows.length) return "";
    return `<section class="npc-dialog-section"><h3>${escapeHtml(title)}</h3><dl class="npc-dialog-dl">${rows.map(([key, value]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${locationValueMarkup(value)}</dd>`).join("")}</dl></section>`;
  }

  function openLocationProfile(id) {
    const profile = locationProfileById(id);
    if (!profile) {
      showStatus("No location profile found");
      return;
    }
    lastDialogOpener = document.activeElement;
    const body = document.querySelector("[data-location-profile-dialog-body]");
    if (!body) return;
    body.innerHTML = `<p class="private-note">GM-only location profile</p>
      <h2>${escapeHtml(locationName(profile))}</h2>
      <p class="location-public-line">${escapeHtml(locationOneLine(profile))}</p>
      ${locationProfileSection("Orientation", profile.block1 || {})}
      ${locationProfileSection("Sensory and visible details", profile.block2 || {})}
      ${locationProfileSection("Player actions", profile.block3 || {})}
      ${locationProfileSection("Living motion and hazards", profile.block4 || {})}
      ${locationProfileSection("Living place: districts, ecology, off-path play", profile.living_place || {})}
      ${locationProfileSection("Connections and transitions", profile.block5 || {})}
      ${locationProfileSection("Visual asset queue", profile.visual_assets || {})}
      ${locationProfileSection("GM-only reveal discipline", profile.block6 || {})}`;
    document.querySelector("#location-profile-dialog")?.showModal();
  }

  function sendLocationPublicLine(id) {
    const payload = locationPublicPayload(id);
    if (!payload) {
      showStatus("No player-safe location text found");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent location read-aloud");
  }

  function dismissLocationCard(id) {
    const slide = currentSlide();
    state.dismissedLocationCards = { ...(state.dismissedLocationCards || {}), [locationDismissKey(slide?.id, id)]: Date.now() };
    saveState();
    renderLocationChannel();
    showStatus("Location quick-card dismissed");
  }

  function locationSearchBlob(row) {
    const profile = row.profile || {};
    const block1 = profile.block1 || {};
    const block4 = profile.block4 || {};
    return [row.id, row.name, row.one_line, block1.story_function, block1.current_pressure, block1.capital_status, ...(block4.living_motion || [])].join(" ").toLowerCase();
  }

  function renderLocationPickerList() {
    const list = document.querySelector("[data-location-picker-list]");
    if (!list) return;
    const query = String(document.querySelector("[data-location-picker-search]")?.value || "").trim().toLowerCase();
    const rows = (locationPicker || []).filter((row) => !query || locationSearchBlob(row).includes(query));
    list.innerHTML = rows.map((row) => {
      const profile = row.profile || {};
      const block1 = profile.block1 || {};
      return `<article class="npc-summon-card">
        <h3>${escapeHtml(locationName(profile))}</h3>
        <p>${escapeHtml(locationOneLine(profile))}</p>
        <p class="muted">${escapeHtml(block1.current_pressure || block1.story_function || "")}</p>
        <div class="npc-card-actions">
          <button type="button" data-location-summon-id="${escapeAttr(row.id)}">Open card</button>
          <button type="button" data-location-profile-id="${escapeAttr(row.id)}">Profile</button>
          <button type="button" data-location-player-line="${escapeAttr(row.id)}">Send read-aloud</button>
        </div>
      </article>`;
    }).join("") || `<p class="muted">No location matches that search.</p>`;
  }

  function summonLocation(id, profile = null, source = "opened") {
    const slide = currentSlide();
    const resolved = profile || locationProfileById(id) || (locationPicker || []).find((row) => row.id === id)?.profile;
    if (!slide || !resolved || resolved.auto_surface === false) {
      showStatus("No player-safe location card available");
      return;
    }
    const current = (state.summonedLocationsBySlide?.[slide.id] || []).filter((entry) => entry.id !== id);
    state.summonedLocationsBySlide = {
      ...(state.summonedLocationsBySlide || {}),
      [slide.id]: [...current, { id, profile: resolved, source, summonedAt: Date.now() }],
    };
    state.dismissedLocationCards = { ...(state.dismissedLocationCards || {}) };
    delete state.dismissedLocationCards[locationDismissKey(slide.id, id)];
    saveState();
    renderLocationChannel();
    showStatus(`Opened ${locationName(resolved)} location card`);
  }

  function openLocationPickerDialog() {
    lastDialogOpener = document.activeElement;
    renderLocationPickerList();
    document.querySelector("#location-picker-dialog")?.showModal();
    window.setTimeout(() => document.querySelector("[data-location-picker-search]")?.focus(), 30);
  }

  function itemProfileById(id) {
    if (!id) return null;
    if (itemProfiles[id]) return itemProfiles[id];
    const picker = (itemPicker || []).find((row) => row.id === id);
    if (picker?.profile) return picker.profile;
    const slide = currentSlide();
    const summoned = (state.summonedItemsBySlide?.[slide?.id] || []).find((entry) => entry.id === id);
    return summoned?.profile || null;
  }

  function itemName(profile = {}) {
    return profile.player_safe?.name || profile.block0?.item_name || profile.item_name || profile.name || "Item";
  }

  function itemFirstImpression(profile = {}) {
    return profile.player_safe?.first_impression || profile.player_safe?.one_line || profile.block1?.first_impression || "";
  }

  function itemTell(profile = {}) {
    return profile.block1?.the_tell || "";
  }

  function itemVisualSlot(profile = {}) {
    return profile.visual_assets?.profile_image || {};
  }

  function itemVisualImage(profile = {}) {
    const slot = itemVisualSlot(profile);
    return slot.runtime_path || profile.block6?.runtime_path || "";
  }

  function itemImagePayload(id) {
    const profile = itemProfileById(id);
    const image = itemVisualImage(profile || {});
    if (!profile || !image) return null;
    const slot = itemVisualSlot(profile);
    const title = itemName(profile);
    const caption = slot.player_caption || itemFirstImpression(profile);
    return runPlayerImagePayload(title, image, slot.alt || `${title} item image.`, caption, `item-${id}-image`);
  }

  function itemShowPayload(id) {
    const profile = itemProfileById(id);
    if (!profile || profile.auto_surface === false) return null;
    return runPlayerTextPayload(itemName(profile), `${itemName(profile)}: ${itemFirstImpression(profile)}`, `item-${id}-show`);
  }

  function itemTellPayload(id) {
    const profile = itemProfileById(id);
    if (!profile || profile.auto_surface === false) return null;
    const text = [itemTell(profile), profile.block1?.what_it_is, profile.block3?.mechanics || profile.block3?.narrative_function]
      .filter(Boolean)
      .join(" ");
    return runPlayerTextPayload(itemName(profile), text, `item-${id}-tell`);
  }

  function itemDismissKey(slideId, itemId) {
    return `${slideId || "slide"}::${itemId || "item"}`;
  }

  function currentItemEntries(slide = currentSlide()) {
    if (!slide) return [];
    const entries = [];
    const seen = new Set();
    const ids = [
      ...(slide.itemIds || []),
      ...(slide.entityIds || []),
      ...(slide.mapData?.entityIds || []),
    ];
    Object.entries(itemProfiles || {}).forEach(([id, profile]) => {
      if ((profile.block4?.surface_ids || []).includes(slide.id)) ids.push(id);
    });
    ids.forEach((id) => {
      const profile = itemProfiles[id];
      if (!profile || profile.auto_surface === false || seen.has(id)) return;
      seen.add(id);
      entries.push({ id, profile, source: "scene" });
    });
    (state.summonedItemsBySlide?.[slide.id] || []).forEach((entry) => {
      const id = entry.id || "";
      if (!id || seen.has(id)) return;
      const profile = entry.profile || itemProfiles[id];
      if (!profile || profile.auto_surface === false) return;
      seen.add(id);
      entries.push({ id, profile, source: entry.source || "opened" });
    });
    return entries;
  }

  function itemQuickCard(entry, slide) {
    const profile = entry.profile || {};
    const id = entry.id;
    const block1 = profile.block1 || {};
    const block2 = profile.block2 || {};
    const block3 = profile.block3 || {};
    const block4 = profile.block4 || {};
    const first = itemFirstImpression(profile);
    const tell = itemTell(profile);
    const mechanics = block3.mechanics || block3.narrative_function || "";
    const imageButton = itemImagePayload(id) ? `<button type="button" data-item-visual-id="${escapeAttr(id)}">Show image</button>` : "";
    return `<section class="item-quick-card" data-item-card data-item-id="${escapeAttr(id)}" data-source="${escapeAttr(entry.source)}">
      <p class="npc-eyebrow"><span>Item quick-card</span><span>${entry.source === "scene" ? "Scene entry" : "Opened"}</span></p>
      <h2>${escapeHtml(itemName(profile))}</h2>
      <p class="item-public-line">${escapeHtml(first)}</p>
      <dl class="item-role-grid">
        <dt>Kind</dt><dd>${escapeHtml(profile.item_kind || profile.block0?.item_kind || "")}</dd>
        <dt>Maker</dt><dd>${escapeHtml(block2.maker || "")}</dd>
        <dt>Loot</dt><dd>${escapeHtml(block4.loot_group || "")}</dd>
        <dt>Earned tell</dt><dd>${escapeHtml(tell)}</dd>
      </dl>
      ${mechanics ? `<details class="item-detail"><summary>Mechanical profile</summary><p>${escapeHtml(mechanics)}</p></details>` : ""}
      ${block2.ad_copy || block2.corporate_propaganda ? `<details class="item-detail"><summary>Ad copy / propaganda</summary><p>${escapeHtml(block2.ad_copy || block2.corporate_propaganda)}</p></details>` : ""}
      ${block2.unreliability || block2.comedy_beat ? `<details class="item-detail"><summary>Unreliability comedy</summary><p>${escapeHtml(block2.unreliability || block2.comedy_beat)}</p></details>` : ""}
      <div class="item-card-actions">
        <button type="button" data-item-profile-id="${escapeAttr(id)}">Full item</button>
        ${imageButton}
        <button type="button" data-item-player-show="${escapeAttr(id)}">Send SHOW</button>
        <button type="button" data-item-player-tell="${escapeAttr(id)}">Send earned TELL</button>
        <a class="button secondary" href="${escapeAttr(block1.wiki_link || `pages/entities/${id}.html`)}">Open wiki</a>
        <button type="button" data-item-dismiss="${escapeAttr(id)}">Dismiss</button>
      </div>
    </section>`;
  }

  function renderItemChannel() {
    const channel = document.querySelector("[data-item-channel]");
    if (!channel) return;
    const slide = currentSlide();
    const entries = currentItemEntries(slide).filter((entry) => !state.dismissedItemCards?.[itemDismissKey(slide?.id, entry.id)]);
    if (entries.length) {
      const activeSpotlight = typeof activeSpotlightForSlide === "function" ? activeSpotlightForSlide(slide)?.active : null;
      const spotlightPriority = String(activeSpotlight?.priority || "").toLowerCase();
      if (clockCriticalActive() || ["high", "urgent", "critical"].includes(spotlightPriority)) {
        channel.innerHTML = `<section class="item-quick-card is-deferred" data-item-card>
          <p class="npc-eyebrow"><span>Item queued</span><span>${clockCriticalActive() ? "Clock priority" : "Spotlight priority"}</span></p>
          <h2>${entries.length} item card${entries.length === 1 ? "" : "s"} waiting</h2>
          <p class="item-public-line">Clear the higher-priority notice, then return here for loot, prop, and asset context.</p>
        </section>`;
        return;
      }
    }
    channel.innerHTML = entries.map((entry) => itemQuickCard(entry, slide)).join("");
  }

  function itemValueMarkup(value) {
    if (Array.isArray(value)) {
      return value.length ? `<ul>${value.map((item) => `<li>${itemValueMarkup(item)}</li>`).join("")}</ul>` : `<p class="muted">No table-facing detail added.</p>`;
    }
    if (value && typeof value === "object") {
      return `<dl class="npc-dialog-dl">${Object.entries(value).map(([key, item]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${itemValueMarkup(item)}</dd>`).join("")}</dl>`;
    }
    return `<span>${linkifyEntities(value || "")}</span>`;
  }

  function itemProfileSection(title, block) {
    const rows = Object.entries(block || {}).filter(([, value]) => value !== "" && value != null && !(Array.isArray(value) && !value.length));
    if (!rows.length) return "";
    return `<section class="npc-dialog-section"><h3>${escapeHtml(title)}</h3><dl class="npc-dialog-dl">${rows.map(([key, value]) => `<dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${itemValueMarkup(value)}</dd>`).join("")}</dl></section>`;
  }

  function openItemProfile(id) {
    const profile = itemProfileById(id);
    if (!profile) {
      showStatus("No item profile found");
      return;
    }
    lastDialogOpener = document.activeElement;
    const body = document.querySelector("[data-item-profile-dialog-body]");
    if (!body) return;
    body.innerHTML = `<p class="private-note">GM-only item profile; player-safe SHOW/TELL buttons are on the card.</p>
      <h2>${escapeHtml(itemName(profile))}</h2>
      <p class="item-public-line">${escapeHtml(itemFirstImpression(profile))}</p>
      ${profile.atlas_lore_note ? `<p class="private-note">${escapeHtml(profile.atlas_lore_note)}</p>` : ""}
      ${itemProfileSection("Identity", profile.block0 || {})}
      ${itemProfileSection("SHOW / TELL split", profile.block1 || {})}
      ${itemProfileSection("Maker, ad copy, and unreliability", profile.block2 || {})}
      ${itemProfileSection("Mechanical profile", profile.block3 || {})}
      ${itemProfileSection("Loot grouping and source linkage", profile.block4 || {})}
      ${itemProfileSection("Earned progressive disclosure", profile.block5 || {})}
      ${itemProfileSection("Visual asset", profile.block6 || {})}`;
    document.querySelector("#item-profile-dialog")?.showModal();
  }

  function sendItemImage(id) {
    const payload = itemImagePayload(id);
    if (!payload) {
      showStatus("No saved item image is available yet");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent item image");
  }

  function sendItemShow(id) {
    const payload = itemShowPayload(id);
    if (!payload) {
      showStatus("No player-safe item SHOW text found");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent item SHOW text");
  }

  function sendItemTell(id) {
    const payload = itemTellPayload(id);
    if (!payload) {
      showStatus("No earned item TELL text found");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent earned item TELL text");
  }

  function dismissItemCard(id) {
    const slide = currentSlide();
    state.dismissedItemCards = { ...(state.dismissedItemCards || {}), [itemDismissKey(slide?.id, id)]: Date.now() };
    saveState();
    renderItemChannel();
    showStatus("Item quick-card dismissed");
  }

  function itemSearchBlob(row) {
    const profile = row.profile || {};
    return [
      row.id,
      row.name,
      row.kind,
      row.maker,
      row.loot_group,
      profile.block1?.first_impression,
      profile.block1?.the_tell,
      profile.block2?.ad_copy,
      profile.block2?.corporate_propaganda,
      profile.block3?.mechanics,
    ].join(" ").toLowerCase();
  }

  function renderItemPickerList() {
    const list = document.querySelector("[data-item-picker-list]");
    if (!list) return;
    const query = String(document.querySelector("[data-item-picker-search]")?.value || "").trim().toLowerCase();
    const rows = (itemPicker || []).filter((row) => !query || itemSearchBlob(row).includes(query));
    list.innerHTML = rows.map((row) => {
      const profile = row.profile || {};
      return `<article class="npc-summon-card">
        <h3>${escapeHtml(itemName(profile))}</h3>
        <p>${escapeHtml(itemFirstImpression(profile))}</p>
        <p class="muted">${escapeHtml(`${row.kind || ""} | ${row.maker || ""} | ${row.loot_group || ""}`)}</p>
        <div class="npc-card-actions">
          <button type="button" data-item-summon-id="${escapeAttr(row.id)}">Open card</button>
          <button type="button" data-item-profile-id="${escapeAttr(row.id)}">Profile</button>
          <button type="button" data-item-player-show="${escapeAttr(row.id)}">Send SHOW</button>
        </div>
      </article>`;
    }).join("") || `<p class="muted">No item matches that search.</p>`;
  }

  function summonItem(id, profile = null, source = "opened") {
    const slide = currentSlide();
    const resolved = profile || itemProfileById(id) || (itemPicker || []).find((row) => row.id === id)?.profile;
    if (!slide || !resolved || resolved.auto_surface === false) {
      showStatus("No player-safe item card available");
      return;
    }
    const current = (state.summonedItemsBySlide?.[slide.id] || []).filter((entry) => entry.id !== id);
    state.summonedItemsBySlide = {
      ...(state.summonedItemsBySlide || {}),
      [slide.id]: [...current, { id, profile: resolved, source, summonedAt: Date.now() }],
    };
    state.dismissedItemCards = { ...(state.dismissedItemCards || {}) };
    delete state.dismissedItemCards[itemDismissKey(slide.id, id)];
    saveState();
    renderItemChannel();
    showStatus(`Opened ${itemName(resolved)} item card`);
  }

  function openItemPickerDialog() {
    lastDialogOpener = document.activeElement;
    renderItemPickerList();
    document.querySelector("#item-picker-dialog")?.showModal();
    window.setTimeout(() => document.querySelector("[data-item-picker-search]")?.focus(), 30);
  }

  function clueProfileById(id) {
    if (!id) return null;
    if (clueProfiles[id]) return clueProfiles[id];
    const picker = (cluePicker || []).find((row) => row.id === id);
    if (picker?.profile) return picker.profile;
    const slide = currentSlide();
    const summoned = (state.summonedCluesBySlide?.[slide?.id] || []).find((entry) => entry.id === id);
    return summoned?.profile || null;
  }

  function clueName(profile = {}) {
    return profile.player_safe?.name || profile.block0?.clue_name || profile.clue_name || profile.name || "Clue";
  }

  function clueShow(profile = {}) {
    return profile.player_safe?.the_show || profile.player_safe?.one_line || profile.block2?.the_show || "";
  }

  function clueVisualSlot(profile = {}) {
    return profile.visual_assets?.profile_image || {};
  }

  function clueVisualImage(profile = {}) {
    const slot = clueVisualSlot(profile);
    return slot.runtime_path || profile.block8?.runtime_path || "";
  }

  function clueRollPaths(profile = {}) {
    return profile.block9?.roll_paths || [];
  }

  function cluePrimaryRolls(profile = {}, limit = 3) {
    const listed = profile.block9?.primary_rolls || [];
    if (listed.length) return listed.slice(0, limit);
    return clueRollPaths(profile)
      .slice()
      .sort((a, b) => {
        const rankA = a.rank === "strong path" ? 0 : a.rank === "alternate path" ? 1 : 2;
        const rankB = b.rank === "strong path" ? 0 : b.rank === "alternate path" ? 1 : 2;
        return rankA - rankB || Number(a.difficulty || 99) - Number(b.difficulty || 99);
      })
      .slice(0, limit)
      .map((path) => `${path.trait} D${path.difficulty}`);
  }

  function clueRollSummaryMarkup(profile = {}, limit = 6) {
    const rows = clueRollPaths(profile).slice(0, limit);
    if (!rows.length) return "";
    return `<details class="item-detail" open><summary>Discovery rolls</summary>
      <ul>${rows.map((path) => `<li><strong>${escapeHtml(path.trait || "")} D${escapeHtml(path.difficulty || "")}</strong> (${escapeHtml(path.rank || "")}) - ${linkifyEntities(path.call_for || "")}</li>`).join("")}</ul>
      <p><strong>Fear twist:</strong> ${linkifyEntities(rows[0]?.fear_spin || "")}</p>
    </details>`;
  }

  function clueMechanicDetailsMarkup(profile = {}) {
    const block9 = profile.block9 || {};
    const rows = clueRollPaths(profile);
    const pcRows = block9.per_character_discovery || [];
    const rollMarkup = rows.map((path) => `<article class="npc-summon-card">
      <h4>${escapeHtml(path.trait || "")} D${escapeHtml(path.difficulty || "")}</h4>
      <p class="muted">${escapeHtml(path.rank || "")} | ${escapeHtml(path.approach || "")}</p>
      <p>${linkifyEntities(path.call_for || "")}</p>
      <details><summary>Result scale</summary>
        <ul>
          <li><strong>Botch:</strong> ${linkifyEntities(path.result_scale?.botch || "")}</li>
          <li><strong>Miss:</strong> ${linkifyEntities(path.result_scale?.miss || "")}</li>
          <li><strong>Hit:</strong> ${linkifyEntities(path.result_scale?.hit || "")}</li>
          <li><strong>Clean:</strong> ${linkifyEntities(path.result_scale?.clean || "")}</li>
          <li><strong>Soar:</strong> ${linkifyEntities(path.result_scale?.soar || "")}</li>
          <li><strong>Critical:</strong> ${linkifyEntities(path.result_scale?.crit || "")}</li>
        </ul>
      </details>
      <p><strong>Hope:</strong> ${linkifyEntities(path.hope_spin || "")}</p>
      <p><strong>Fear:</strong> ${linkifyEntities(path.fear_spin || "")}</p>
    </article>`).join("");
    const pcMarkup = pcRows.map((row) => `<article class="npc-summon-card">
      <h4>${escapeHtml(row.pc_name || "")}</h4>
      <p class="muted">${escapeHtml(row.trait || "")} D${escapeHtml(row.difficulty || "")} | ${escapeHtml(row.focus || "")}</p>
      <p>${linkifyEntities(row.discovery || "")}</p>
      <p><strong>Roleplay cue:</strong> ${linkifyEntities(row.roleplay_cue || "")}</p>
      <p><strong>Success:</strong> ${linkifyEntities(row.on_success || "")}</p>
      <p><strong>Fear:</strong> ${linkifyEntities(row.on_fear || "")}</p>
    </article>`).join("");
    return `<section class="npc-dialog-section">
      <h3>Daggerheart Clue Stat Block</h3>
      <p>${linkifyEntities(block9.rule_status || "")}</p>
      <p><strong>Free discovery:</strong> ${linkifyEntities(block9.default_free_discovery || "")}</p>
      <p><strong>Primary rolls:</strong> ${escapeHtml(cluePrimaryRolls(profile, 6).join(", "))}</p>
      <p><strong>Difficulty note:</strong> ${linkifyEntities(block9.difficulty_notes || "")}</p>
      <div class="npc-summon-grid">${rollMarkup}</div>
      <h3>PC-Specific Discovery Routes</h3>
      <div class="npc-summon-grid">${pcMarkup}</div>
    </section>`;
  }

  function clueImagePayload(id) {
    const profile = clueProfileById(id);
    const image = clueVisualImage(profile || {});
    if (!profile || !image) return null;
    const slot = clueVisualSlot(profile);
    const title = clueName(profile);
    const caption = slot.player_caption || clueShow(profile);
    return runPlayerImagePayload(title, image, slot.alt || `${title} clue image.`, caption, `clue-${id}-image`);
  }

  function clueShowPayload(id) {
    const profile = clueProfileById(id);
    if (!profile || profile.auto_surface === false) return null;
    return runPlayerTextPayload(clueName(profile), `${clueName(profile)}: ${clueShow(profile)}`, `clue-${id}-show`);
  }

  function clueDismissKey(slideId, clueId) {
    return `${slideId || "slide"}::${clueId || "clue"}`;
  }

  function clueTierRank(profile = {}) {
    const tiers = (profile.block6?.run_mode_tier || []).map((tier) => String(tier).toUpperCase());
    if (tiers.some((tier) => tier.includes("MAND"))) return 0;
    if (tiers.some((tier) => tier.includes("FALL"))) return 1;
    if (tiers.some((tier) => tier.includes("OPT"))) return 2;
    if (tiers.some((tier) => tier.includes("COM"))) return 3;
    if (tiers.some((tier) => tier.includes("HIDDEN"))) return 4;
    return 5;
  }

  function currentClueEntries(slide = currentSlide()) {
    if (!slide) return [];
    const entries = [];
    const seen = new Set();
    const ids = [
      ...(slide.clueIds || []),
      ...(slide.entityIds || []),
      ...(slide.mapData?.entityIds || []),
    ];
    Object.entries(clueProfiles || {}).forEach(([id, profile]) => {
      if ((profile.block5?.found_in?.scene_ids || []).includes(slide.id)) ids.push(id);
    });
    ids.forEach((id) => {
      const profile = clueProfiles[id];
      if (!profile || profile.auto_surface === false || seen.has(id)) return;
      seen.add(id);
      entries.push({ id, profile, source: "scene" });
    });
    (state.summonedCluesBySlide?.[slide.id] || []).forEach((entry) => {
      const id = entry.id || "";
      if (!id || seen.has(id)) return;
      const profile = entry.profile || clueProfiles[id];
      if (!profile || profile.auto_surface === false) return;
      seen.add(id);
      entries.push({ id, profile, source: entry.source || "opened" });
    });
    return entries.sort((a, b) => clueTierRank(a.profile) - clueTierRank(b.profile) || clueName(a.profile).localeCompare(clueName(b.profile)));
  }

  function clueQuickCard(entry, slide) {
    const profile = entry.profile || {};
    const id = entry.id;
    const block1 = profile.block1 || {};
    const block3 = profile.block3 || {};
    const block4 = profile.block4 || {};
    const block5 = profile.block5 || {};
    const block6 = profile.block6 || {};
    const tier = (block6.run_mode_tier || []).join(", ");
    const isHidden = String(block1.plot_track || "").toUpperCase().includes("HIDDEN") || (block6.run_mode_tier || []).some((row) => String(row).toUpperCase().includes("HIDDEN"));
    const imageButton = clueImagePayload(id) ? `<button type="button" data-clue-visual-id="${escapeAttr(id)}">Show image</button>` : "";
    const siblingList = (block4.sibling_clues || []).slice(0, 4).join(", ");
    const primaryRolls = cluePrimaryRolls(profile, 3).join(", ");
    return `<section class="clue-quick-card ${isHidden ? "is-hidden-clue" : ""}" data-clue-card data-clue-id="${escapeAttr(id)}" data-source="${escapeAttr(entry.source)}">
      <p class="npc-eyebrow"><span>${isHidden ? "Hidden clue" : "Clue board"}</span><span>${escapeHtml(tier || "OPTIONAL")}</span></p>
      <h2>${escapeHtml(clueName(profile))}</h2>
      <p class="item-public-line">${escapeHtml(clueShow(profile))}</p>
      <dl class="item-role-grid">
        <dt>Points to</dt><dd>${escapeHtml(block1.points_to || "")}</dd>
        <dt>Primary rolls</dt><dd>${escapeHtml(primaryRolls)}</dd>
        <dt>Reveal</dt><dd>${escapeHtml(block1.reveal_cluster || "")}</dd>
        <dt>Track</dt><dd>${escapeHtml(block1.plot_track || "")}</dd>
        <dt>Scenes</dt><dd>${escapeHtml((block5.found_in?.scene_ids || []).join(", "))}</dd>
      </dl>
      ${clueRollSummaryMarkup(profile, 3)}
      <details class="item-detail" ${isHidden ? "" : "open"}><summary>Disclosure ladder</summary>
        <ul>
          <li><strong>Whisper:</strong> ${escapeHtml(block3.whisper || "")}</li>
          <li><strong>Nudge:</strong> ${escapeHtml(block3.nudge || "")}</li>
          <li><strong>Spell-It-Out:</strong> ${escapeHtml(block3.spell_it_out || "")}</li>
          <li><strong>Just-Tell-Them:</strong> ${escapeHtml(block3.just_tell_them || "")}</li>
        </ul>
      </details>
      ${siblingList ? `<details class="item-detail"><summary>Sibling clues</summary><p>${escapeHtml(siblingList)}</p></details>` : ""}
      <div class="item-card-actions">
        <button type="button" data-clue-profile-id="${escapeAttr(id)}">Full clue</button>
        ${imageButton}
        <button type="button" data-clue-player-show="${escapeAttr(id)}">Send SHOW</button>
        <a class="button secondary" href="${escapeAttr(block1.wiki_link || `pages/entities/${id}.html`)}">Open wiki</a>
        <button type="button" data-clue-dismiss="${escapeAttr(id)}">Dismiss</button>
      </div>
    </section>`;
  }

  function renderClueChannel() {
    const channel = document.querySelector("[data-clue-channel]");
    if (!channel) return;
    const slide = currentSlide();
    const entries = currentClueEntries(slide).filter((entry) => !state.dismissedClueCards?.[clueDismissKey(slide?.id, entry.id)]);
    if (entries.length) {
      const activeSpotlight = typeof activeSpotlightForSlide === "function" ? activeSpotlightForSlide(slide)?.active : null;
      const spotlightPriority = String(activeSpotlight?.priority || "").toLowerCase();
      if (clockCriticalActive() || ["urgent", "critical"].includes(spotlightPriority)) {
        channel.innerHTML = `<section class="clue-quick-card is-deferred" data-clue-card>
          <p class="npc-eyebrow"><span>Clues queued</span><span>${clockCriticalActive() ? "Clock priority" : "Spotlight priority"}</span></p>
          <h2>${entries.length} clue card${entries.length === 1 ? "" : "s"} waiting</h2>
          <p class="item-public-line">Clear the higher-priority notice, then return here for evidence and fallback rungs.</p>
        </section>`;
        return;
      }
    }
    channel.innerHTML = entries.map((entry) => clueQuickCard(entry, slide)).join("");
  }

  function openClueProfile(id) {
    const profile = clueProfileById(id);
    if (!profile) {
      showStatus("No clue profile found");
      return;
    }
    lastDialogOpener = document.activeElement;
    const body = document.querySelector("[data-clue-profile-dialog-body]");
    if (!body) return;
    body.innerHTML = `<p class="private-note">GM-only clue profile. Player-safe sends are limited to SHOW text and the evidence image.</p>
      <h2>${escapeHtml(clueName(profile))}</h2>
      <p class="item-public-line">${escapeHtml(clueShow(profile))}</p>
      ${profile.atlas_lore_note ? `<p class="private-note">${escapeHtml(profile.atlas_lore_note)}</p>` : ""}
      ${itemProfileSection("Identity", profile.block0 || {})}
      ${itemProfileSection("What It Points To", profile.block1 || {})}
      ${itemProfileSection("SHOW / TELL split", profile.block2 || {})}
      ${itemProfileSection("Disclosure Ladder", profile.block3 || {})}
      ${clueMechanicDetailsMarkup(profile)}
      ${itemProfileSection("Sibling Clues", profile.block4 || {})}
      ${itemProfileSection("Provenance and Earning", profile.block5 || {})}
      ${itemProfileSection("Run Mode Tier", profile.block6 || {})}
      ${itemProfileSection("Satire / Trademark", profile.block7 || {})}
      ${itemProfileSection("Visual Asset", profile.block8 || {})}`;
    document.querySelector("#clue-profile-dialog")?.showModal();
  }

  function sendClueImage(id) {
    const payload = clueImagePayload(id);
    if (!payload) {
      showStatus("No saved clue image is available yet");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent clue image");
  }

  function sendClueShow(id) {
    const payload = clueShowPayload(id);
    if (!payload) {
      showStatus("No player-safe clue SHOW text found");
      return;
    }
    sendRunPlayerPayload(payload);
    showStatus("Sent clue SHOW text");
  }

  function dismissClueCard(id) {
    const slide = currentSlide();
    state.dismissedClueCards = { ...(state.dismissedClueCards || {}), [clueDismissKey(slide?.id, id)]: Date.now() };
    saveState();
    renderClueChannel();
    showStatus("Clue card dismissed");
  }

  function clueSearchBlob(row) {
    const profile = row.profile || {};
    return [
      row.id,
      row.name,
      row.track,
      row.tier,
      row.cluster,
      row.show,
      profile.block1?.points_to,
      profile.block3?.whisper,
      profile.block3?.nudge,
      cluePrimaryRolls(profile, 6).join(" "),
    ].join(" ").toLowerCase();
  }

  function renderCluePickerList() {
    const list = document.querySelector("[data-clue-picker-list]");
    if (!list) return;
    const query = String(document.querySelector("[data-clue-picker-search]")?.value || "").trim().toLowerCase();
    const rows = (cluePicker || []).filter((row) => !query || clueSearchBlob(row).includes(query));
    list.innerHTML = rows.map((row) => {
      const profile = row.profile || {};
      return `<article class="npc-summon-card">
        <h3>${escapeHtml(clueName(profile))}</h3>
        <p>${escapeHtml(clueShow(profile))}</p>
        <p><strong>Rolls:</strong> ${escapeHtml(cluePrimaryRolls(profile, 3).join(", "))}</p>
        <p class="muted">${escapeHtml(`${row.track || ""} | ${row.tier || ""} | ${row.cluster || ""}`)}</p>
        <div class="npc-card-actions">
          <button type="button" data-clue-summon-id="${escapeAttr(row.id)}">Open card</button>
          <button type="button" data-clue-profile-id="${escapeAttr(row.id)}">Profile</button>
          <button type="button" data-clue-player-show="${escapeAttr(row.id)}">Send SHOW</button>
        </div>
      </article>`;
    }).join("") || `<p class="muted">No clue matches that search.</p>`;
  }

  function summonClue(id, profile = null, source = "opened") {
    const slide = currentSlide();
    const resolved = profile || clueProfileById(id) || (cluePicker || []).find((row) => row.id === id)?.profile;
    if (!slide || !resolved || resolved.auto_surface === false) {
      showStatus("No clue card available");
      return;
    }
    const current = (state.summonedCluesBySlide?.[slide.id] || []).filter((entry) => entry.id !== id);
    state.summonedCluesBySlide = {
      ...(state.summonedCluesBySlide || {}),
      [slide.id]: [...current, { id, profile: resolved, source, summonedAt: Date.now() }],
    };
    state.dismissedClueCards = { ...(state.dismissedClueCards || {}) };
    delete state.dismissedClueCards[clueDismissKey(slide.id, id)];
    saveState();
    renderClueChannel();
    showStatus(`Opened ${clueName(resolved)} clue card`);
  }

  function openCluePickerDialog() {
    lastDialogOpener = document.activeElement;
    renderCluePickerList();
    document.querySelector("#clue-picker-dialog")?.showModal();
    window.setTimeout(() => document.querySelector("[data-clue-picker-search]")?.focus(), 30);
  }

  function saveFactionAnswer(button) {
    const root = button?.closest("[data-faction-prompt-id]");
    const input = root?.querySelector("[data-faction-answer-input]");
    const answer = String(input?.value || "").trim();
    if (!root || !answer) {
      showStatus("Write an answer before logging it");
      return;
    }
    const store = readFactionAnswers();
    store.answers.push({
      id: `faction-answer-${Date.now()}`,
      promptId: root.dataset.factionPromptId || "",
      factionId: root.dataset.factionId || "",
      slideId: root.dataset.slideId || currentSlide()?.id || "",
      prompt: root.querySelector("p")?.textContent || "",
      answer,
      createdAt: new Date().toISOString(),
    });
    writeFactionAnswers(store);
    input.value = "";
    renderFactionChannel();
    showStatus("World-connection answer logged");
  }

  function sendFactionQuestion(button) {
    const root = button?.closest("[data-faction-prompt-id]");
    const question = root?.querySelector("p")?.textContent || "";
    if (!question) {
      showStatus("No world-connection question found");
      return;
    }
    sendRunPlayerPayload(runPlayerTextPayload("World connection question", question, root.dataset.slideId || currentSlide()?.id || ""));
    showStatus("Sent world-connection question");
  }

  function rowPlayerText(row, keys) {
    return keys.map((key) => {
      const label = String(key || "").replaceAll("_", " ");
      const value = cleanPlayerChunkText(row?.[key] || "");
      return value ? `${label}: ${value}` : "";
    }).filter(Boolean).join(" | ");
  }

  function gmReadAloudPanel(rows, title, sceneId = "") {
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : (rows ? [rows] : []);
    if (!safeRows.length) return "";
    return `<section class="slide-panel progressive-gm-readaloud"><h3>GM read-aloud</h3>${safeRows.map((row) => runThrowableTextChunk(title, row, { sceneId })).join("")}</section>`;
  }

  function slideById(id) {
    return slides.find((slide) => slide.id === id);
  }

  function activeBeatIndex(slide) {
    const beats = slide?.playerBeats || [];
    if (!beats.length) return -1;
    const stored = Number(state.activeBeatBySlide?.[slide.id]);
    if (Number.isInteger(stored) && stored >= 0 && stored < beats.length) return stored;
    const firstUseful = beats.findIndex((beat) => (beat.displayMode || "") !== "image-only");
    return firstUseful >= 0 ? firstUseful : 0;
  }

  function activeBeatForSlide(slide) {
    const index = activeBeatIndex(slide);
    return index >= 0 ? (slide.playerBeats || [])[index] : null;
  }

  function activeGmBeatForSlide(slide) {
    const index = activeBeatIndex(slide);
    if (index < 0) return null;
    return (slide.gmBeats || [])[index] || null;
  }

  function beatAutoplayEligible(slide) {
    return !!slide?.beatAutoplayEligible && (slide.playerBeats || []).length > 1;
  }

  function beatAutoplayOn(slide) {
    if (!beatAutoplayEligible(slide)) return false;
    if (Object.prototype.hasOwnProperty.call(state.beatAutoplayBySlide || {}, slide.id)) {
      return !!state.beatAutoplayBySlide[slide.id];
    }
    return !!slide.beatAutoplayDefault;
  }

  function displayModeForSlide(slide) {
    if (!slide) return "image-title-caption";
    if (slide.displayMode === "standby-carousel" && beatAutoplayOn(slide)) return "standby-carousel";
    return activeBeatForSlide(slide)?.displayMode || slide.displayMode || "image-title-caption";
  }

  function setActiveBeatIndex(slide, index) {
    if (!slide?.playerBeats?.[index]) return false;
    state.activeBeatBySlide = { ...(state.activeBeatBySlide || {}), [slide.id]: index };
    saveState();
    window.dispatchEvent(new CustomEvent("goldspire-run-beat-changed", { detail: { slide, beat: slide.playerBeats[index], index } }));
    return true;
  }

  function currentPlayerPayload(slide = currentSlide()) {
    if (!slide) return { displayMode: "image-title-caption" };
    if (slide.displayMode === "standby-carousel" && beatAutoplayOn(slide)) {
      return { displayMode: "standby-carousel" };
    }
    const beat = activeBeatForSlide(slide);
    return beat
      ? { displayMode: beat.displayMode || "text-first", playerBeat: beat }
      : { displayMode: displayModeForSlide(slide) };
  }

  function playerDisplayAlive() {
    try {
      const heartbeat = JSON.parse(localStorage.getItem(PLAYER_DISPLAY_HEARTBEAT_KEY) || "null");
      return !!heartbeat?.at && Date.now() - Number(heartbeat.at) < 4500;
    } catch {
      return false;
    }
  }

  function playerProjectionForTools(slide) {
    return playerProjection(slide, activeBeatForSlide(slide));
  }

  function clearBeatAutoplay() {
    if (beatAutoplayTimer) window.clearTimeout(beatAutoplayTimer);
    beatAutoplayTimer = null;
  }

  function advanceBeatAutoplay() {
    const slide = currentSlide();
    const beats = slide?.playerBeats || [];
    if (!beatAutoplayOn(slide) || beats.length < 2) return;
    const nextIndex = (activeBeatIndex(slide) + 1) % beats.length;
    setActiveBeatIndex(slide, nextIndex);
    if (slide.displayMode !== "standby-carousel") {
      const beat = beats[nextIndex];
      sendToPlayer("setSlide", { displayMode: beat.displayMode || "text-first", playerBeat: beat }, false, { autoOpen: false });
    }
    render();
  }

  function scheduleBeatAutoplay() {
    clearBeatAutoplay();
    const slide = currentSlide();
    if (!beatAutoplayOn(slide) || slide.displayMode === "standby-carousel") return;
    beatAutoplayTimer = window.setTimeout(advanceBeatAutoplay, Number(slide.beatAutoplayIntervalMs || 12000));
  }

  function toggleBeatAutoplay() {
    const slide = currentSlide();
    if (!beatAutoplayEligible(slide)) {
      showStatus("This slide does not have multiple display beats");
      return;
    }
    const next = !beatAutoplayOn(slide);
    state.beatAutoplayBySlide = { ...(state.beatAutoplayBySlide || {}), [slide.id]: next };
    saveState();
    if (next) {
      sendToPlayer("setSlide", currentPlayerPayload(slide), false, { autoOpen: false });
      showStatus("Auto beat display on");
    } else {
      const beat = activeBeatForSlide(slide);
      sendToPlayer("setSlide", beat ? { displayMode: beat.displayMode || "text-first", playerBeat: beat } : { displayMode: "image-title-caption" }, false, { autoOpen: false });
      showStatus("Auto beat display paused");
    }
    render();
  }

  function pinnedShortcutForSlide(id) {
    const index = (state.pinnedSlides || []).indexOf(id);
    return index >= 0 ? PINNED_SHORTCUT_KEYS[index] : "";
  }

  function pinnedBadge(slide) {
    const key = pinnedShortcutForSlide(slide.id);
    if (!key) return "";
    const label = key === PINNED_SHORTCUT_KEYS[0] ? `Pinned ${key} / P` : `Pinned ${key}`;
    return `<span class="slide-pill">${escapeHtml(label)}</span>`;
  }

  function pinnedButtonTitle(slide) {
    const title = slide.shortTitle || slide.title || slide.id;
    return title.length > 28 ? `${title.slice(0, 25)}...` : title;
  }

  function pinnedEntries() {
    return (state.pinnedSlides || [])
      .map((id, index) => ({ slide: slideById(id), key: PINNED_SHORTCUT_KEYS[index], index }))
      .filter((entry) => entry.slide && entry.key);
  }

  function renderPinnedShortcuts() {
    const target = document.querySelector("#run-pinned-shortcuts");
    if (!target) return;
    target.innerHTML = pinnedEntries().map(({ slide, key, index }) => {
      const latest = index === 0 ? " Latest" : "";
      const ariaLatest = index === 0 ? ", also P" : "";
      return `<button type="button" class="run-pinned-shortcut" data-run-go-slide="${escapeAttr(slide.id)}" aria-label="${escapeAttr(`Pinned shortcut ${key}${ariaLatest}: ${slide.title}`)}" title="${escapeAttr(`Jump to pinned slide ${key}${ariaLatest}: ${slide.title}`)}"><span class="pin-key">${escapeHtml(`${key}${latest}`)}</span> <span class="pin-title">${escapeHtml(pinnedButtonTitle(slide))}</span></button>`;
    }).join("");
  }

  function updatePinButton() {
    const button = document.querySelector('[data-run-action="pin"]');
    const slide = currentSlide();
    if (!button || !slide) return;
    const key = pinnedShortcutForSlide(slide.id);
    const label = key
      ? `Remove pinned shortcut ${key} from current slide`
      : "Pin current slide to 7; older pins shift toward 0";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    const sr = button.querySelector(".sr-only");
    if (sr) sr.textContent = label;
  }

  function fallbackImage(slide) {
    if (slide.mapData?.image) return slide.mapData.image;
    if (slide.image) return slide.image;
    const key = `${slide.id} ${slide.sectionId || ""} ${slide.sectionTitle || ""}`.toLowerCase();
    if (key.includes("act-one") || key.includes("logistics")) return "assets/scenes/S01-01-entering-sablewood.webp";
    if (key.includes("act-two") || key.includes("cargo")) return "assets/scenes/S02-03-bramble-union-ambush.webp";
    if (key.includes("act-three") || key.includes("hush")) return "assets/scenes/S03-01-arrival-at-hush.webp";
    if (key.includes("act-four") || key.includes("hanging")) return "assets/scenes/S04-02-the-hanging-office-exterior.webp";
    if (key.includes("act-five") || key.includes("ward")) return "assets/scenes/S05-01-open-valetm-ritual-site.webp";
    if (key.includes("epilogue") || key.includes("relay")) return "assets/scenes/S06-02-the-relay-spire-hook.webp";
    if (key.includes("prologue") || key.includes("contract")) return "assets/scenes/S00-01-the-job.webp";
    if (key.includes("conditions")) return "assets/entities/vulnerable.webp";
    if (key.includes("loot")) return "assets/entities/hexmart-pocket-wardtm-cracked.webp";
    if (key.includes("pronunciation")) return "assets/entities/party-reference.webp";
    return "assets/entities/party-reference.webp";
  }

  function playerTextForSlide(slide) {
    const projection = playerProjectionForTools(slide);
    return projection.readAloud || projection.publicObjective || projection.mapData?.readAloud || projection.mapData?.playerText || projection.caption || projection.title || "";
  }

  function imageForSlideTools(slide) {
    const projection = playerProjectionForTools(slide);
    return projection.mapData?.image || projection.image || fallbackImage(slide);
  }

  function showStatus(message) {
    const status = document.querySelector("#run-status");
    if (!status) return;
    status.textContent = message;
    status.classList.add("is-visible");
    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(() => status.classList.remove("is-visible"), 1800);
  }

  function applyViewState() {
    document.body.classList.toggle("image-hidden", !!state.imageCollapsed);
    document.body.classList.toggle("filmstrip-hidden", !!state.filmstripCollapsed);
    const imageButton = document.querySelector('[data-run-action="toggle-image"]');
    const filmstripButton = document.querySelector('[data-run-action="toggle-filmstrip"]');
    if (imageButton) {
      const label = state.imageCollapsed ? "Show image" : "Hide image";
      imageButton.setAttribute("aria-label", label);
      imageButton.setAttribute("title", label);
      const text = imageButton.querySelector(".run-button-label");
      if (text) text.textContent = label;
    }
    document.querySelectorAll('[data-run-action="toggle-filmstrip"]').forEach((btn) => {
      const label = state.filmstripCollapsed ? "Show filmstrip" : "Hide filmstrip";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      const text = btn.querySelector(".run-button-label");
      if (text) text.textContent = label;
    });
    const scrubToggle = document.querySelector(".scrub-toggle");
    if (scrubToggle) {
      scrubToggle.setAttribute("aria-expanded", state.filmstripCollapsed ? "false" : "true");
      const chev = scrubToggle.querySelector(".scrub-toggle-chevron");
      if (chev) chev.textContent = state.filmstripCollapsed ? "▴" : "▾";
      const lbl = scrubToggle.querySelector(".scrub-toggle-label");
      if (lbl) lbl.textContent = state.filmstripCollapsed ? "Show filmstrip" : "Hide filmstrip";
    }
  }

  function playerProjection(slide, beat = null, options = {}) {
    const selectedBeat = options.ignoreActiveBeat ? null : (beat || activeBeatForSlide(slide));
    if (selectedBeat) {
      return {
        id: selectedBeat.id || slide.id,
        type: "player-beat",
        title: selectedBeat.title || slide.title,
        image: selectedBeat.image || fallbackImage(slide),
        alt: selectedBeat.alt || selectedBeat.title || slide.title,
        caption: selectedBeat.caption || "",
        mood: "",
        publicObjective: selectedBeat.publicObjective || "",
        readAloud: selectedBeat.readAloud || selectedBeat.publicObjective || "",
        playerBullets: selectedBeat.playerBullets || [],
        playerTable: selectedBeat.playerTable || [],
        displayMode: selectedBeat.displayMode || "text-first",
        mapData: selectedBeat.mapData || null,
      };
    }
    const projection = slide.playerSafeProjection || null;
    if (projection) {
      return {
        ...projection,
        image: projection.image || fallbackImage(slide),
        alt: projection.alt || projection.title || "",
      };
    }
    const safeMap = slide.mapData ? safeMapData(slide.mapData) : null;
    return {
      id: slide.id,
      type: slide.type,
      mapType: slide.mapType,
      title: slide.title,
      image: safeMap?.playerSafeImage || safeMap?.image || fallbackImage(slide),
      alt: slide.alt || slide.title,
      caption: slide.caption || "",
      mood: slide.mood || "",
      publicObjective: slide.publicObjective || "",
      readAloud: slide.readAloud || "",
      mapData: safeMap,
    };
  }

  function safeMapData(mapData) {
    if (!mapData) return null;
    return {
      id: mapData.id,
      type: mapData.type,
      title: mapData.title,
      image: mapData.playerSafeImage || mapData.image,
      playerSafeImage: mapData.playerSafeImage || mapData.image,
      caption: mapData.caption || "",
      alt: mapData.alt || mapData.title,
      playerText: mapData.playerText || "",
      readAloud: mapData.readAloud || "",
      annotations: (mapData.annotations || []).map((annotation) => ({
        label: annotation.label || "",
        text: annotation.text || "",
        x: annotation.x || 0.5,
        y: annotation.y || 0.5,
      })),
    };
  }

  function send(type, payload = {}) {
    const slide = currentSlide();
    const playerBeat = payload.playerBeat || null;
    const cleanPayload = { ...payload };
    delete cleanPayload.playerBeat;
    const projectionOptions = cleanPayload.displayMode === "standby-carousel" ? { ignoreActiveBeat: true } : {};
    const sent = window.GoldspireDisplaySync?.send({
      protocol: "goldspire-run-sync-v1",
      type,
      slideId: slide?.id,
      payload: { slide: playerProjection(slide, playerBeat, projectionOptions), ...cleanPayload },
      source: "gm-run-mode",
    });
    return sent;
  }

  function ensurePlayerDisplay(focus = false, autoOpen = true) {
    const slide = currentSlide();
    const url = `player-display.html?slide=${encodeURIComponent(slide.id)}`;
    if (playerDisplayAlive()) {
      if (focus && playerDisplayWindow && !playerDisplayWindow.closed) playerDisplayWindow.focus?.();
      return playerDisplayWindow || true;
    }
    if (!autoOpen) return playerDisplayWindow && !playerDisplayWindow.closed ? playerDisplayWindow : null;
    if (!playerDisplayWindow || playerDisplayWindow.closed) {
      playerDisplayWindow = window.open(url, "goldspire-player-display", "popup=yes,width=1280,height=720");
    } else if (focus) {
      playerDisplayWindow.focus?.();
    }
    return playerDisplayWindow;
  }

  function sendToPlayer(type, payload = {}, focus = false, options = {}) {
    const autoOpen = options.autoOpen !== false;
    ensurePlayerDisplay(focus, autoOpen);
    if (type === "blackout") state.playerDisplayBlackout = true;
    else if (type !== "heartbeat") state.playerDisplayBlackout = false;
    saveState();
    return send(type, payload);
  }

  window.GoldspireRunMode = {
    currentSlide,
    send,
    showStatus,
    goTo: (id) => goTo(id),
    render: () => render(),
    spotlights: {
      read: readSpotlightState,
      reset: resetSpotlights,
      pending: pendingSpotlightsByHalf,
      render: renderSpotlightChannel,
    },
    factions: {
      profiles: () => factionProfiles,
      picker: () => factionPicker,
      answers: readFactionAnswers,
      render: renderFactionChannel,
      open: openFactionProfile,
    },
    locations: {
      profiles: () => locationProfiles,
      picker: () => locationPicker,
      render: renderLocationChannel,
      open: openLocationProfile,
    },
    items: {
      profiles: () => itemProfiles,
      picker: () => itemPicker,
      render: renderItemChannel,
      open: openItemProfile,
    },
    clues: {
      profiles: () => clueProfiles,
      picker: () => cluePicker,
      render: renderClueChannel,
      open: openClueProfile,
    },
  };

  function openPlayerDisplay() {
    const alreadyAlive = playerDisplayAlive();
    const win = ensurePlayerDisplay(true, true);
    window.setTimeout(() => sendToPlayer("setSlide", currentPlayerPayload(), false, { autoOpen: false }), 80);
    showStatus(alreadyAlive ? "Refreshed existing Player Display" : (win ? "Opened Player Display" : "Player Display pop-up was blocked"));
  }

  function render() {
    const slide = currentSlide();
    if (!slide) return;
    clearBeatAutoplay();
    document.title = `${slide.title} - Run Mode`;
    const select = document.querySelector("#run-slide-select");
    if (select) select.value = slide.id;
    document.querySelector("#run-position").textContent = `Slide ${currentIndex() + 1} / ${slides.length} - ${slide.id}`;
    const auto = document.querySelector("#run-auto-complete");
    if (auto) auto.checked = !!state.autoCompletePreviousSceneOnNext;
    const sync = document.querySelector("#run-sync-on-change");
    if (sync) sync.checked = !!state.syncOnSlideChange;
    const root = document.querySelector("[data-slide-root]");
    applyViewState();
    document.body.classList.toggle("prologue-run-slide", slide.sectionId === "PROLOGUE" && (slide.gmBeats || []).length > 0);
    root.innerHTML = slideMarkup(slide);
    renderPinnedShortcuts();
    updatePinButton();
    renderScrubber();
    bindRenderedSlide();
    updateRunQuickRef();
    saveState();
    if (state.syncOnSlideChange) {
      state.playerDisplayBlackout = false;
      saveState();
      send("setSlide", currentPlayerPayload(slide));
    }
    scheduleBeatAutoplay();
    renderNpcChannel();
    renderFactionChannel();
    renderLocationChannel();
    renderItemChannel();
    renderClueChannel();
    renderSpotlightChannel();
    window.dispatchEvent(new CustomEvent("goldspire-run-slide-rendered", { detail: { slide, state, index: currentIndex() } }));
  }

  function slideMarkup(slide) {
    if (slide.type === "map" && slide.mapData) return mapSlideMarkup(slide);
    const image = fallbackImage(slide);
    const hasImage = !!image;
    const isCheat = slide.type === "cheat";
    const beatQuick = playerBeatQuickActions(slide);
    const media = hasImage
      ? `<figure class="slide-media run-throwable-image"><button type="button" data-run-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(image)}" alt="${escapeAttr(slide.alt || slide.title)}"></button><button class="run-inline-affordance run-image-send" type="button" data-run-inline-action="send-image" data-run-player-payload="${runPayloadAttr(runPlayerImagePayload(slide.title, image, slide.alt || slide.title, slide.caption || slide.readAloud || slide.publicObjective || "", slide.id))}" aria-label="Send image to Player Display" title="Send image to Player Display"><img src="assets/icons/live-player-display.png" alt="" aria-hidden="true"><span class="sr-only">Send image to Player Display</span></button><figcaption>${escapeHtml(slide.caption || "")}</figcaption></figure>`
      : `<div class="slide-media slide-divider-art"><p>${escapeHtml(slide.caption || slide.sectionTitle || "")}</p></div>`;
    const detailStack = isCheat ? cheatReferencePanel(slide) : (slide.type === "session-zero" ? sessionZeroDetailStack(slide) : sceneDetailStack(slide));
    const mainClass = ["slide-main", slide.type === "session-zero" ? "session-zero-main" : "", (slide.gmBeats || []).length ? "progressive-main" : "", slide.sectionId === "PROLOGUE" && (slide.gmBeats || []).length ? "prologue-compact-main" : ""].filter(Boolean).join(" ");
    return `
      ${beatQuick}
      <section class="${mainClass}">
        ${media}
        <div class="slide-copy">
          <div class="slide-meta-row">
            <span class="slide-pill">${escapeHtml(slide.id)}</span>
            ${slide.sectionTitle && slide.sectionTitle !== slide.id ? `<span class="slide-pill">${escapeHtml(slide.sectionTitle)}</span>` : ""}
            ${slide.type ? `<span class="slide-pill">${escapeHtml(slide.type)}</span>` : ""}
            <label class="complete-current"><input type="checkbox" data-run-current-complete ${state.completedSlides.includes(slide.id) ? "checked" : ""}> Complete</label>
            ${pinnedBadge(slide)}
            ${state.lastAutoCompletedSlideId ? `<button class="undo-complete-button" type="button" data-run-action="undo-complete">Undo auto-complete: ${escapeHtml(state.lastAutoCompletedSlideId)}</button>` : ""}
          </div>
          <h2>${escapeHtml(slide.title)}</h2>
          ${slide.gmGoal ? `<p class="slide-goal"><strong>GM goal:</strong> ${linkifyEntities(slide.gmGoal)}</p>` : ""}
          ${slide.publicObjective ? runThrowableTextChunk("Public objective", slide.publicObjective, { bodyHtml: `<strong>Public objective:</strong> ${linkifyEntities(slide.publicObjective)}`, className: "slide-objective", sceneId: slide.id }) : ""}
          ${encounterEntry(slide)}
          ${playerTextToolGroup("player-display")}
          ${detailStack}
        </div>
      </section>`;
  }

  function mapSlideMarkup(slide) {
    const map = slide.mapData || {};
    const beatQuick = playerBeatQuickActions(slide);
    const sourceLabel = map.assetSourceType === "ai-generated-battlemap"
      ? "AI battle map"
      : (map.aiGeneratedPrimary ? "AI-generated map" : "Fallback map");
    return `
      ${beatQuick}
      <section class="slide-main map-slide-main">
        <div class="slide-media map-stage" data-map-stage>
          <img src="${escapeAttr(map.image || slide.image)}" alt="${escapeAttr(map.alt || slide.alt || slide.title)}">
        </div>
        <div class="slide-copy">
          <div class="slide-meta-row">
            <span class="slide-pill">${escapeHtml(slide.id)}</span>
            ${slide.sectionTitle ? `<span class="slide-pill">${escapeHtml(slide.sectionTitle)}</span>` : ""}
            <span class="slide-pill">${escapeHtml(map.type || slide.mapType || "map")}</span>
            <span class="slide-pill">${escapeHtml(sourceLabel)}</span>
            ${pinnedBadge(slide)}
          </div>
          <h2>${escapeHtml(slide.title)}</h2>
          ${slide.readAloud ? runThrowableTextChunk("Map read-aloud", slide.readAloud, { bodyHtml: `<strong>Read aloud:</strong> ${linkifyEntities(slide.readAloud)}`, className: "slide-objective", sceneId: slide.id }) : ""}
          ${encounterEntry(slide)}
          ${playerTextToolGroup("utility")}
          <div class="slide-action-group" aria-label="Map tools">
            <p class="slide-action-group-label">Map Tools</p>
            <div class="slide-action-row map-action-row">
            ${runIcon("expand-image", "Fullscreen map image", "live-fullscreen.png", false, "Full")}
            <button class="run-icon-button" type="button" data-map-print-player aria-label="Print player map image" title="Print player map image" data-short-label="Print"><img src="assets/icons/live-print.png" alt="" aria-hidden="true"><span class="sr-only">Print player map image</span></button>
            ${map.inspirationImage ? `<a class="run-icon-button" href="${escapeAttr(map.inspirationImage)}" target="_blank" rel="noopener" aria-label="Open visual inspiration" title="Open visual inspiration" data-short-label="Insp"><img src="assets/icons/live-fullscreen.png" alt="" aria-hidden="true"><span class="sr-only">Open visual inspiration</span></a>` : ""}
            ${map.schematicImage ? `<a class="run-icon-button" href="${escapeAttr(map.schematicImage)}" target="_blank" rel="noopener" aria-label="Open schematic reference" title="Open schematic reference" data-short-label="Ref"><img src="assets/icons/live-notes.png" alt="" aria-hidden="true"><span class="sr-only">Open schematic reference</span></a>` : ""}
            ${map.combatPage ? `<a class="run-icon-button" href="${escapeAttr(map.combatPage)}" aria-label="Open combat workspace" title="Open combat workspace" data-short-label="Fight"><img src="assets/icons/live-encounter.png" alt="" aria-hidden="true"><span class="sr-only">Open combat workspace</span></a>` : ""}
            </div>
          </div>
          ${map.inspirationImage ? `<details class="slide-panel"><summary>Visual inspiration alternate</summary><p class="muted">Use this for mood and location visualization. Use the primary map above for playable space.</p><a href="${escapeAttr(map.inspirationImage)}" target="_blank" rel="noopener">Open visual inspiration in a new tab</a></details>` : ""}
          ${map.schematicImage ? `<details class="slide-panel"><summary>Schematic alternate</summary><p class="muted">Older schematic reference board kept for quick table adjudication only. The visible map above is the AI-generated primary asset.</p><a href="${escapeAttr(map.schematicImage)}" target="_blank" rel="noopener">Open schematic in a new tab</a></details>` : ""}
          ${gmReadAloudPanel(slide.gmReadAloud || [], `${slide.title || "Map"} read-aloud`, slide.id)}
          ${slide.gmScript ? `<section class="slide-panel progressive-gm-script"><h3>GM script</h3><p>${linkifyEntities(slide.gmScript)}</p></section>` : ""}
          ${takeawayPanel(slide)}
          ${slide.gmChecklist?.length ? `<details class="slide-panel"><summary>GM checklist</summary>${listMarkup(slide.gmChecklist, "")}</details>` : ""}
          ${slide.gmPrivate?.length ? `<details class="slide-panel"><summary>GM-only notes</summary>${listMarkup(slide.gmPrivate, "")}</details>` : ""}
          ${perCharacterPanel(slide)}
          ${statePanel(slide)}
          ${mapInfoPanel(map)}
          ${entityPanel(slide)}
          ${gmNotesPanel(slide)}
        </div>
      </section>`;
  }

  function encounterEntry(slide) {
    if (slide.liveTools?.mode !== "encounter") return "";
    const mapIds = (slide.liveTools.mapIds || []).filter(Boolean);
    const firstMap = mapIds[0] || "";
    return `<section class="encounter-entry" data-encounter-entry data-encounter-id="${escapeAttr(slide.liveTools.encounterId || slide.id)}">
      <div>
        <strong>Encounter tools ready</strong>
        <p>Stats, map, terrain, Fear moves, enemy actions, and social off-ramps are one click away.</p>
      </div>
      <div class="encounter-entry-actions">
        <button class="encounter-open-button" type="button" data-encounter-action="open" aria-label="Open Encounter Cockpit" title="Open Encounter Cockpit"><img src="assets/icons/live-encounter.png" alt="" aria-hidden="true"><span>Encounter</span></button>
        ${firstMap ? `<button class="live-icon-button" type="button" data-run-go-slide="${escapeAttr(firstMap)}" aria-label="Open encounter map slide" title="Open encounter map slide"><img src="assets/icons/live-map.png" alt="" aria-hidden="true"><span class="sr-only">Open encounter map slide</span></button>` : ""}
      </div>
    </section>`;
  }

  function mapInfoPanel(map) {
    const cards = [
      map.gmOrientation ? mapInfoCard("GM orientation", `<p>${linkifyEntities(map.gmOrientation)}</p>`) : "",
      map.readAloud ? mapInfoCard("Read aloud", runThrowableTextChunk(map.title || "Map read-aloud", map.readAloud, { sceneId: map.id || "" })) : "",
      sensoryStackMarkup(map.sensoryStack || []),
      map.playerPrompts?.length ? mapInfoCard("Ask the players", runThrowableList(map.playerPrompts, map.title || "Player prompt", map.id || "")) : "",
      map.interactables?.length ? mapInfoCard("Interactables", runThrowableList(map.interactables, map.title || "Interactable", map.id || "")) : "",
      map.hazards?.length ? mapInfoCard("Hazards / pressure", linkifyList(map.hazards, "")) : "",
      map.checks?.length ? mapInfoCard("Checks", mapCheckMarkup(map.checks || [])) : "",
      map.fearSpends?.length ? mapInfoCard("Spend Fear here", linkifyList(map.fearSpends, "")) : "",
      map.hasCombat && map.combatBlock ? mapInfoCard("Combat", combatBlockMarkup(map.combatBlock)) : "",
      map.hasCombat && map.rangeBands?.length ? mapInfoCard("Range bands", rangeBandMarkup(map.rangeBands || [])) : "",
      map.transitions?.length ? mapInfoCard("Transitions", linkifyList(map.transitions, "")) : "",
      gmDetailsMarkup(map.gmDetails || []),
      map.hiddenTruth?.length ? mapInfoCard("Hidden truth layer", linkifyList(map.hiddenTruth, "")) : "",
      map.canonSource ? mapInfoCard("Canon source note", `<p>${escapeHtml(map.canonSource)}</p>`) : "",
    ].filter(Boolean);
    const actions = actionPanelMarkup(map.optionalRolls || [], map.actionNotes || []);
    if (!cards.length && !actions) return "";
    const notes = cards.length ? `<details class="slide-panel">
      <summary>Location operating notes</summary>
      <div class="map-info-grid">${cards.join("")}</div>
    </details>` : "";
    return `${notes}${actions}`;
  }

  function mapInfoCard(title, body) {
    if (!body) return "";
    return `<article class="map-info-card"><h3>${escapeHtml(title)}</h3>${body}</article>`;
  }

  function sensoryStackMarkup(rows) {
    const items = (rows || []).filter((row) => row && (row.detail || row.sense));
    if (!items.length) return "";
    return mapInfoCard("Sensory stack", `<dl class="sensory-stack">${items.map((row) => `<div><dt>${escapeHtml(row.sense || "Detail")}</dt><dd>${runThrowableTextChunk(row.sense || "Sensory detail", row.detail || "", { tag: "span", className: "run-sensory-chunk" })}</dd></div>`).join("")}</dl>`);
  }

  function actionPanelMarkup(rows, notes) {
    const items = (rows || []).filter(Boolean);
    const actionNotes = (notes || []).filter(Boolean);
    if (!items.length && !actionNotes.length) return "";
    const cards = items.map((row) => {
      const action = mapActionValue(row, ["Action", "action", "Move", "Prompt"]) || "Player action";
      const trait = mapActionValue(row, ["Trait", "trait", "Approach"]);
      const difficulty = mapActionValue(row, ["Diff", "Difficulty", "difficulty", "DC"]);
      const detail = mapActionValue(row, ["Notes", "Note", "Outcome", "Result"]);
      const meta = [
        trait ? `<span>Trait: ${escapeHtml(trait)}</span>` : "",
        difficulty ? `<span>Difficulty: ${escapeHtml(difficulty)}</span>` : "",
      ].filter(Boolean).join("");
      return `<article class="map-action-card"><h3>${linkifyEntities(action)}</h3>${meta ? `<div class="map-action-meta">${meta}</div>` : ""}${detail ? `<p>${linkifyEntities(detail)}</p>` : ""}</article>`;
    }).join("");
    const noteList = actionNotes.length ? `<ul class="map-action-notes">${actionNotes.map((row) => `<li>${linkifyEntities(row)}</li>`).join("")}</ul>` : "";
    return `<details class="slide-panel map-actions-panel">
      <summary>What players can do</summary>
      ${cards ? `<div class="map-action-card-list">${cards}</div>` : ""}
      ${noteList}
    </details>`;
  }

  function mapActionValue(row, keys) {
    for (const key of keys) {
      if (row && row[key]) return String(row[key]);
    }
    return "";
  }

  function combatBlockMarkup(text) {
    const blocks = String(text || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (!blocks.length) return "";
    return `<div class="combat-block">${blocks.map((line) => `<p>${linkifyEntities(line)}</p>`).join("")}</div>`;
  }

  function gmDetailsMarkup(rows) {
    const items = (rows || []).filter((row) => row && row.body);
    if (!items.length) return "";
    return mapInfoCard("Location-specific GM detail", items.map((row) => `<details><summary>${escapeHtml(row.title || "Detail")}</summary>${combatBlockMarkup(row.body)}</details>`).join(""));
  }

  function rangeBandMarkup(rows) {
    if (!rows.length) return "";
    return `<ul>${rows.map((row) => `<li><strong>${escapeHtml(row.label || row)}:</strong> ${escapeHtml(row.note || "")}</li>`).join("")}</ul>`;
  }

  function mapCheckMarkup(rows) {
    if (!rows.length) return "";
    return `<ul>${rows.map((row) => typeof row === "string" ? `<li>${escapeHtml(row)}</li>` : `<li><strong>${escapeHtml(row.check || row.title || "Check")}:</strong> ${escapeHtml(row.prompt || row.outcome || "")}</li>`).join("")}</ul>`;
  }

  function mapCompanionPanel(slide) {
    const ids = slide.companionMapIds || [];
    if (!ids.length) return "";
    const links = ids.map((id) => {
      const mapSlide = slides.find((item) => item.id === id);
      if (!mapSlide) return "";
      return `<button type="button" data-run-go-slide="${escapeAttr(id)}">${escapeHtml(mapSlide.title || id)}</button>`;
    }).join("");
    return `<details class="slide-panel"><summary>Maps / combat workspaces</summary><div class="map-companion-list">${links}</div></details>`;
  }

  function sessionZeroDetailStack(slide) {
    const checklist = slide.gmChecklist || [];
    const examples = slide.gmExamples || [];
    const privateNotes = slide.gmPrivate || [];
    const gmReadAloud = slide.gmReadAloud || [];
    return `<div class="run-detail-stack session-zero-gm-stack">
      <section class="slide-panel session-zero-gm-card">
        <h3>What players see</h3>
        ${runThrowableTextChunk(slide.title || "What players see", slide.readAloud || slide.publicObjective || slide.caption || "No player-facing text on this beat.", { sceneId: slide.id })}
        ${runThrowableList(slide.playerBullets || [], slide.title || "Player bullet", slide.id)}
        ${compactPlayerTable(slide.playerTable || [], slide.title || "Player table", slide.id)}
      </section>
      ${gmReadAloudPanel(gmReadAloud, `${slide.title || "GM"} read-aloud`, slide.id)}
      <section class="slide-panel session-zero-gm-card">
        <h3>GM script</h3>
        <p>${linkifyEntities(slide.gmScript || "Use the takeaways below, then move to the next beat.")}</p>
      </section>
      ${takeawaysMarkup(slide, {
        player: slide.playerTakeaway || "Players know what this beat is for.",
        story: slide.storyTakeaway || "This beat reinforces the story frame.",
        mechanic: slide.mechanicTakeaway || "Table readiness is the mechanic: make the next action clear and keep the spotlight usable."
      })}
      ${worldConnectionPromptPanel(slide)}
      ${perCharacterPanel(slide)}
      ${examples.length ? `<details class="slide-panel"><summary>Examples to show or say</summary>${runThrowableList(examples, `${slide.title || "Example"} example`, slide.id)}</details>` : ""}
      ${checklist.length ? `<details class="slide-panel"><summary>GM checklist</summary>${listMarkup(checklist, "")}</details>` : ""}
      ${privateNotes.length ? `<details class="slide-panel"><summary>GM-only notes</summary>${listMarkup(privateNotes, "")}</details>` : ""}
    </div>`;
  }

  function sceneDetailStack(slide) {
    if ((slide.gmBeats || []).length || slide.gmScript) return progressiveSceneDetailStack(slide);
    return `<div class="run-detail-stack">
      <details class="slide-panel" id="slide-readaloud" open>
        <summary>Player-facing read-aloud</summary>
        ${runThrowableTextChunk(slide.title || "Player-facing read-aloud", slide.readAloud || slide.publicObjective || slide.caption || "No read-aloud text on this slide.", { sceneId: slide.id })}
      </details>
      ${gmReadAloudPanel(slide.gmReadAloud || [], `${slide.title || "GM"} read-aloud`, slide.id)}
      ${takeawayPanel(slide)}
      ${perCharacterPanel(slide)}
      ${worldConnectionPromptPanel(slide)}
      ${playerBeatPanel(slide)}
      ${entityPanel(slide)}
      ${statePanel(slide)}
      ${storyScopePanel(slide)}
      ${mapCompanionPanel(slide)}
      ${mechanicsPanel(slide)}
      ${rollPanel(slide)}
      ${gmNotesPanel(slide)}
      ${runTablePanel(slide)}
    </div>`;
  }

  function progressiveSceneDetailStack(slide) {
    const beat = activeBeatForSlide(slide) || {};
    const gmBeat = activeGmBeatForSlide(slide) || {};
    const examples = [...(slide.gmExamples || []), ...(gmBeat.gmExamples || [])];
    const privateNotes = [...(slide.gmPrivate || []), ...(gmBeat.gmPrivate || [])];
    const checklist = slide.gmChecklist || [];
    const playerText = beat.readAloud || beat.publicObjective || slide.readAloud || slide.publicObjective || slide.caption || "";
    const gmScript = gmBeat.gmScript || slide.gmScript || "Use the player-facing beat, then ask what the table does.";
    const gmReadAloud = [...(slide.gmReadAloud || []), ...(gmBeat.gmReadAloud || [])];
    const playerTakeaway = gmBeat.playerTakeaway || slide.playerTakeaway || "";
    const storyTakeaway = gmBeat.storyTakeaway || slide.storyTakeaway || "";
    const mechanicTakeaway = gmBeat.mechanicTakeaway || slide.mechanicTakeaway || "";
    const showReferencePanels = slide.sectionId !== "PROLOGUE";
    const compactClass = slide.sectionId === "PROLOGUE" ? " is-prologue-compact" : "";
    return `<div class="run-detail-stack progressive-gm-stack${compactClass}">
      <section class="slide-panel progressive-active-beat">
        <p class="private-note">Current selected beat</p>
        <h3>${escapeHtml(beat.label || gmBeat.label || slide.shortTitle || "Beat")}</h3>
        <h4>What players see</h4>
        ${runThrowableTextChunk(beat.title || slide.title || "What players see", playerText || "Select a player beat to preview what the table sees.", { sceneId: slide.id })}
        ${runThrowableList(beat.playerBullets || [], beat.title || slide.title || "Player bullet", slide.id)}
        ${compactPlayerTable(beat.playerTable || [], beat.title || slide.title || "Player table", slide.id)}
      </section>
      ${gmReadAloudPanel(gmReadAloud, `${gmBeat.title || slide.title || "GM"} read-aloud`, slide.id)}
      <section class="slide-panel progressive-gm-script">
        <h3>GM script</h3>
        <p>${linkifyEntities(gmScript)}</p>
      </section>
      ${takeawaysMarkup(slide, {
        player: playerTakeaway || "Players understand what to do next.",
        story: storyTakeaway || "This beat reinforces the current story pressure.",
        mechanic: mechanicTakeaway || "Roll only when a risky outcome is uncertain."
      }, gmBeat.takeawayHelp || {})}
      ${perCharacterPanel(slide)}
      ${worldConnectionPromptPanel(slide)}
      ${examples.length ? `<details class="slide-panel"><summary>Examples to show or say</summary>${runThrowableList(examples, `${slide.title || "Example"} example`, slide.id)}</details>` : ""}
      ${checklist.length ? `<details class="slide-panel"><summary>GM checklist</summary>${listMarkup(checklist, "")}</details>` : ""}
      ${privateNotes.length ? `<details class="slide-panel"><summary>GM-only notes</summary>${listMarkup(privateNotes, "")}</details>` : ""}
      ${showReferencePanels ? statePanel(slide) : ""}
      ${showReferencePanels ? mechanicsPanel(slide) : ""}
      ${showReferencePanels ? entityPanel(slide) : ""}
      ${showReferencePanels ? rollPanel(slide) : ""}
      ${showReferencePanels ? runTablePanel(slide) : ""}
    </div>`;
  }

  function compactPlayerTable(rows, title = "Player table", sceneId = "") {
    const safeRows = (rows || []).filter(Boolean);
    if (!safeRows.length) return "";
    const keys = Array.from(safeRows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()));
    if (!keys.length) return "";
    const head = keys.map((key) => `<th>${escapeHtml(String(key).replaceAll("_", " "))}</th>`).join("") + '<th class="run-table-action-head">Show</th>';
    const body = safeRows.map((row) => {
      const text = rowPlayerText(row, keys);
      const payload = runPayloadAttr(runPlayerTextPayload(title, text, sceneId || currentSlide()?.id || ""));
      return `<tr class="run-throwable-row" data-run-player-payload="${payload}">${keys.map((key) => `<td>${escapeHtml(row[key] || "")}</td>`).join("")}<td class="run-table-throw-actions">${runTextActions()}</td></tr>`;
    }).join("");
    return `<div class="table-scroll"><table class="session-zero-preview-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function takeawaysMarkup(slide, values = {}, helpOverride = {}) {
    const items = [
      ["player", "Player takeaway", values.player],
      ["story", "Story takeaway", values.story],
      ["mechanic", "Mechanic takeaway", values.mechanic],
    ].filter(([, , text]) => text);
    if (!items.length) return "";
    return `<section class="slide-panel session-zero-takeaways">
      ${items.map(([kind, label, text]) => {
        const help = helpOverride[kind] || slide.takeawayHelp?.[kind] || {};
        const ruleIds = (help.ruleIds || slide.mechanicIds || []).filter(Boolean).join(",");
        return `<article class="takeaway-cue" tabindex="0" data-takeaway-kind="${escapeAttr(kind)}" data-takeaway-rules="${escapeAttr(ruleIds)}"><h3>${escapeHtml(label)}</h3><p>${linkifyEntities(text)}</p></article>`;
      }).join("")}
    </section>`;
  }

  function takeawayPanel(slide) {
    if (!slide.playerTakeaway && !slide.storyTakeaway && !slide.mechanicTakeaway) return "";
    return `<details class="slide-panel">
      <summary>Player / story / mechanic takeaways</summary>
      ${takeawaysMarkup(slide, { player: slide.playerTakeaway, story: slide.storyTakeaway, mechanic: slide.mechanicTakeaway })}
    </details>`;
  }

  function pcProfileForEntry(entry) {
    const profiles = readGmState().pc_profiles || {};
    return profiles[entry.pcId] || profiles[entry.pcName] || {};
  }

  function pcProfileAssigned(profile) {
    return !!(profile.player_name || profile.playerName || profile.assigned_player || profile.assignedPlayer || profile.current_player_name);
  }

  function pcProfileExplicitlyPresent(profile) {
    return profile.in_play === true || profile.active === true || profile.present === true || pcProfileAssigned(profile);
  }

  function pcProfileExplicitlyAbsent(profile) {
    return profile.in_play === false || profile.active === false || profile.present === false;
  }

  function activePerCharacterEntries(slide) {
    const entries = slide.perCharacterLayer || [];
    if (!entries.length) return [];
    const hasPositiveRoster = entries.some((entry) => pcProfileExplicitlyPresent(pcProfileForEntry(entry)));
    return entries.filter((entry) => {
      const profile = pcProfileForEntry(entry);
      if (pcProfileExplicitlyAbsent(profile)) return false;
      return hasPositiveRoster ? pcProfileExplicitlyPresent(profile) : true;
    });
  }

  function characterField(label, value) {
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) return "";
    let body = "";
    if (Array.isArray(value)) {
      body = `<ul>${value.map((item) => `<li>${linkifyEntities(item)}</li>`).join("")}</ul>`;
    } else if (typeof value === "object") {
      const prefix = [value.trait, value.difficulty ? `Difficulty ${value.difficulty}` : ""].filter(Boolean).join(" ");
      const text = value.text || value.result || "";
      body = `${prefix ? `<strong>${escapeHtml(prefix)}:</strong> ` : ""}${linkifyEntities(text)}`;
    } else {
      body = linkifyEntities(value);
    }
    return `<div><dt>${escapeHtml(label)}</dt><dd>${body}</dd></div>`;
  }

  function perCharacterPanel(slide) {
    const visibleEntries = activePerCharacterEntries(slide);
    if (!visibleEntries.length) return "";
    const originalEntries = slide.perCharacterLayer || [];
    const cards = visibleEntries.map((entry) => {
      const originalIndex = originalEntries.indexOf(entry);
      const cueButton = entry.playerCue
        ? `<button class="per-character-cue-button" type="button" data-character-cue-index="${escapeAttr(originalIndex)}" aria-label="${escapeAttr(`Show ${entry.pcName} cue to players`)}" title="${escapeAttr(`Show ${entry.pcName} cue to players`)}">Show cue</button>`
        : "";
      const fields = [
        characterField("Focus", entry.focus),
        characterField("Fantasy", entry.fantasy),
        characterField("Signature lane", entry.signatureLane || entry.lane),
        characterField("Complexity", entry.complexity),
        characterField("Built-in question", entry.builtInQuestion),
        characterField("Sample intro", entry.sampleIntro),
        characterField("Inherently knows / notices", entry.passive),
        characterField("Can discover", entry.discover),
        characterField("Can contribute", entry.contribute),
        characterField("GM prompt", entry.gmPrompt),
        characterField("GM prompts", entry.gmPrompts),
        characterField("Connection prompts", entry.connectionPrompts),
      ].filter(Boolean).join("");
      return `<article class="per-character-card">
        <header>
          <div>
            <h3>${escapeHtml(entry.pcName || "PC")}</h3>
            <p class="pc-meta">${escapeHtml([entry.pronouns, entry.ancestryClass].filter(Boolean).join(" · "))}</p>
          </div>
          ${cueButton}
        </header>
        <dl>${fields}</dl>
      </article>`;
    }).join("");
    return `<details class="slide-panel per-character-panel">
      <summary>Per-character layer <span class="muted">GM-only; filtered by active roster when assigned</span></summary>
      <div class="per-character-grid">${cards}</div>
    </details>`;
  }

  function gmNotesPanel(slide) {
    const notes = slide.gmNotes || [];
    if (!notes.length) return "";
    return `<details class="slide-panel"><summary>GM notes</summary>${linkifyList(notes, "")}</details>`;
  }

  function playerBeatPanel(slide) {
    const beats = slide.playerBeats || [];
    if (!beats.length) return "";
    const activeIndex = activeBeatIndex(slide);
    const buttons = beats.map((beat, index) => {
      const mode = String(beat.displayMode || "text-first").replaceAll("-", " ");
      const active = index === activeIndex ? " is-active" : "";
      return `<button class="${active.trim()}" type="button" data-player-beat-index="${index}" aria-pressed="${index === activeIndex ? "true" : "false"}"><strong>${escapeHtml(beat.label || `Beat ${index + 1}`)}</strong><span>${escapeHtml(mode)}</span></button>`;
    }).join("");
    return `<details class="slide-panel player-beat-panel" open>
      <summary>Player display beats</summary>
      <p class="muted">Send only the next thing players should see. Use image-only, hybrid, or text-only as the table needs.</p>
      <div class="player-beat-actions">${buttons}</div>
    </details>`;
  }

  function playerBeatQuickActions(slide) {
    const beats = slide.playerBeats || [];
    if (!beats.length) return "";
    const activeIndex = activeBeatIndex(slide);
    const autoToggle = beatAutoplayEligible(slide)
      ? `<button class="beat-autoplay-toggle ${beatAutoplayOn(slide) ? "is-active" : ""}" type="button" data-run-action="toggle-beat-autoplay" aria-pressed="${beatAutoplayOn(slide) ? "true" : "false"}"><strong>Auto</strong><span>${beatAutoplayOn(slide) ? "On" : "Off"}</span></button>`
      : "";
    const buttons = beats.map((beat, index) => {
      const mode = String(beat.displayMode || "text-first").replaceAll("-", " ");
      const active = index === activeIndex ? " is-active" : "";
      return `<button class="${active.trim()}" type="button" data-player-beat-index="${index}" aria-pressed="${index === activeIndex ? "true" : "false"}"><strong>${escapeHtml(beat.label || `Beat ${index + 1}`)}</strong><span>${escapeHtml(mode)}</span></button>`;
    }).join("");
    return `<section class="slide-action-group player-beat-quick" aria-label="Player display progressive beats">
      <p class="slide-action-group-label">Player Beats</p>
      <div class="player-beat-actions">${autoToggle}${buttons}</div>
    </section>`;
  }

  function referenceLinks(slide) {
    const refs = slide.references || [];
    if (!refs.length) return "";
    const rows = refs.map((ref) => {
      const ext = ref.external ? ' target="_blank" rel="noopener"' : "";
      const note = ref.note ? `<span class="cheat-ref-note">${escapeHtml(ref.note)}</span>` : "";
      return `<a class="button secondary cheat-ref-link" href="${escapeAttr(ref.href)}"${ext}>${escapeHtml(ref.label)}${ref.external ? " ↗" : ""}</a>${note}`;
    }).join("");
    return `<section class="slide-panel cheat-references" aria-label="Quick references"><h3>Jump to</h3><div class="cheat-ref-row">${rows}</div></section>`;
  }

  function storyScopePanel(slide) {
    const scope = slide.storyScope || {};
    const seeds = scope.scene_seeds || [];
    const pacing = scope.pacing || {};
    const rollMenu = scope.roll_menu || [];
    if (!seeds.length && !pacing.target && !rollMenu.length) return "";
    const seedRows = seeds.map((seed) => {
      const tags = (seed.tags || []).map((tag) => `<span class="scope-tag">${escapeHtml(tag)}</span>`).join("");
      const roll = seed.roll ? `<p class="muted"><strong>Roll / gate:</strong> ${escapeHtml(seed.roll)}</p>` : "";
      return `<article class="scope-seed-card"><div class="scope-tag-row">${tags}</div><p>${linkifyEntities(seed.text || "")}</p>${roll}</article>`;
    }).join("");
    const pacingHtml = pacing.target ? `<aside class="scope-pacing"><strong>${escapeHtml(pacing.target)}</strong><span>${escapeHtml(pacing.label || "")}</span><p>${escapeHtml(pacing.lever || "")}</p></aside>` : "";
    const rollHtml = rollMenu.length ? `<h4>Roll menu</h4>${listMarkup(rollMenu, "No act roll menu.")}` : "";
    return `<details class="slide-panel story-scope-panel">
      <summary>Manufactured-threat seeds / pacing</summary>
      <p class="muted">Seed, do not reveal. The surface objective stays heroic and simple.</p>
      <div class="scope-seed-grid">${seedRows || '<p class="muted">No scene-specific seed here; use the act tone if players investigate.</p>'}</div>
      ${rollHtml}
      ${pacingHtml}
    </details>`;
  }

  function cheatReferencePanel(slide) {
    return `<div class="run-detail-stack">
      ${referenceLinks(slide)}
      <section class="slide-panel cheat-reference" aria-label="Cheat sheet reference">
        <h3>Reference</h3>
        ${linkifyList(slide.gmNotes || [], "No cheat notes available.").replace("<ul>", '<ul class="cheat-reference-list">')}
      </section>
      ${statePanel(slide)}
      ${entityPanel(slide)}
    </div>`;
  }

  function runTablePanel(slide) {
    const hasContent = (slide.fearSpends || []).length || (slide.choicesConsequences || []).length || (slide.lootClues || []).length || (slide.playerQuestions || []).length || (slide.relationshipPrompts || []).length || slide.ownershipPrompt;
    if (!hasContent) return "";
    const fear = (slide.fearSpends || []).length ? `<h3>Fear spend ideas</h3>${listMarkup(slide.fearSpends || [], "")}` : "";
    const choices = (slide.choicesConsequences || []).length ? `<h3>Choices and consequences</h3>${choiceMarkup(slide.choicesConsequences || [])}` : "";
    const loot = (slide.lootClues || []).length ? `<h3>Loot / clues</h3>${listMarkup(slide.lootClues || [], "")}` : "";
    const questions = (slide.playerQuestions || []).length ? `<h3>Player questions</h3>${runThrowableList(slide.playerQuestions || [], `${slide.title || "Scene"} player question`, slide.id)}` : "";
    const relationships = (slide.relationshipPrompts || []).length ? `<h3>Relationship prompts</h3>${runThrowableList(slide.relationshipPrompts || [], `${slide.title || "Scene"} relationship prompt`, slide.id)}` : "";
    const ownership = slide.ownershipPrompt ? `<h3>Scene ownership prompt</h3>${runThrowableTextChunk(`${slide.title || "Scene"} ownership prompt`, slide.ownershipPrompt, { sceneId: slide.id })}` : "";
    return `<details class="slide-panel">
      <summary>Fear, choices, loot, questions</summary>
      ${fear}${choices}${loot}${questions}${relationships}${ownership}
    </details>`;
  }

  function worldConnectionPromptPanel(slide) {
    const prompts = (slide.worldConnectionPrompts || []).filter((row) => row?.question);
    if (!prompts.length) return "";
    const cards = prompts.map((prompt, index) => {
      const promptId = prompt.id || `${slide.id || "slide"}-world-connection-${index + 1}`;
      const logged = latestFactionAnswer(promptId, slide.id || "");
      return `<article class="faction-prompt world-connection-card" data-faction-prompt-id="${escapeAttr(promptId)}" data-faction-id="${escapeAttr(prompt.faction_id || "")}" data-slide-id="${escapeAttr(slide.id || "")}">
        <h3>${escapeHtml(prompt.label || "World connection")}</h3>
        <p>${escapeHtml(prompt.question)}</p>
        <textarea data-faction-answer-input placeholder="Log the answer as table canon for this run."></textarea>
        <div class="faction-card-actions">
          <button type="button" data-faction-send-question>Show question</button>
          <button type="button" data-faction-save-answer>Log answer</button>
        </div>
        ${logged ? `<p class="faction-answer-log"><strong>Last answer:</strong> ${escapeHtml(logged.answer)}</p>` : ""}
      </article>`;
    }).join("");
    return `<details class="slide-panel world-connection-panel">
      <summary>World connection prompts</summary>
      <p class="muted">Use only when the table has room. These answers become table-contributed canon for faction texture, not required plot gates.</p>
      <div class="world-connection-grid">${cards}</div>
    </details>`;
  }

  function listMarkup(items, empty) {
    const rows = (items || []).filter(Boolean);
    if (!rows.length) return empty ? `<p class="muted">${escapeHtml(empty)}</p>` : "";
    return `<ul>${rows.map((item) => `<li>${linkifyEntities(item)}</li>`).join("")}</ul>`;
  }

  function choiceMarkup(items) {
    if (!items.length) return '<p class="muted">No choice/consequence entries for this slide.</p>';
    return `<ul>${items.map((item) => `<li><strong>${escapeHtml(item.choice || "Choice")}:</strong> ${escapeHtml(item.consequence || "")} ${item.payoff ? `<em>${escapeHtml(item.payoff)}</em>` : ""}</li>`).join("")}</ul>`;
  }

  function entityPanel(slide, open = false) {
    const entities = slide.entities || [];
    if (!entities.length) return "";
    const rows = entities.map((entity) => {
      const href = `pages/entities/${encodeURIComponent(entity.id)}.html`;
      const icon = entity.icon ? `<img src="${escapeAttr(entity.icon)}" alt="">` : "";
      const show = entity.image ? `<button class="entity-show-button run-icon-button" type="button" data-show-entity-image="${escapeAttr(entity.id)}" aria-label="${escapeAttr(`Show ${entity.playerDisplayTitle || entity.name} image to players`)}" title="${escapeAttr(`Show ${entity.playerDisplayTitle || entity.name} image to players`)}"><img src="assets/icons/live-player-display.png" alt="" aria-hidden="true"><span class="sr-only">Show ${escapeHtml(entity.playerDisplayTitle || entity.name)} image to players</span></button>` : "";
      return `<span class="entity-quick-item"><a class="entity-quick-chip" href="${href}" data-entity="${escapeAttr(entity.id)}">${icon}<span>${escapeHtml(entity.name)}</span></a>${show}</span>`;
    }).join("");
    return `<details class="slide-panel entity-panel"${open ? " open" : ""}><summary>Key entities</summary><div class="entity-chip-row">${rows}</div></details>`;
  }

  function statePanel(slide) {
    const controls = slide.stateControls || [];
    if (!controls.length) return "";
    return `<details class="slide-panel"><summary>Relevant state controls</summary><div class="state-control-list">${controls.map(stateControlMarkup).join("")}</div></details>`;
  }

  function mechanicsPanel(slide) {
    const ids = slide.mechanicIds || [];
    if (!ids.length) return "";
    const chips = ids.map((id) => {
      const rule = atlasRulesById.get(id);
      if (!rule) return "";
      return `<a class="mechanic-chip" href="pages/rules/${escapeAttr(id)}.html" data-mechanic="${escapeAttr(id)}"><span>${escapeHtml(rule.title)}</span></a>`;
    }).join("");
    return `<details class="slide-panel"><summary>Scene mechanics</summary><div class="mechanic-chip-row">${chips}</div></details>`;
  }

  function stateControlMarkup(control) {
    const gmState = readGmState();
    const value = gmState[control.key];
    if (control.type === "select") {
      return `<label><span>${escapeHtml(control.label)}</span><select data-slide-state-field="${escapeAttr(control.key)}">${(control.options || []).map((option) => `<option value="${escapeAttr(option)}"${value === option ? " selected" : ""}>${escapeHtml(String(option).replaceAll("_", " "))}</option>`).join("")}</select></label>`;
    }
    if (control.type === "checkbox") {
      return `<label><span>${escapeHtml(control.label)}</span><input type="checkbox" data-slide-state-field="${escapeAttr(control.key)}"${value ? " checked" : ""}></label>`;
    }
    return `<label><span>${escapeHtml(control.label)}</span><input type="number" min="${escapeAttr(control.min ?? 0)}" max="${escapeAttr(control.max ?? 9)}" data-slide-state-field="${escapeAttr(control.key)}" value="${escapeAttr(value ?? control.min ?? 0)}"></label>`;
  }

  function rollPanel(slide) {
    const cards = slide.rollCards || [];
    if (!cards.length) return "";
    return `<details class="slide-panel"><summary>Roll cards</summary>${cards.map((card) => {
      const outcomes = card.outcomes || {};
      const official = card.official_results || {};
      const officialRows = [
        ["critical_success", "Critical Success"],
        ["success_with_hope", "Success with Hope"],
        ["success_with_fear", "Success with Fear"],
        ["failure_with_hope", "Failure with Hope"],
        ["failure_with_fear", "Failure with Fear"]
      ].map(([key, label]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(official[key] || "")}</li>`).join("");
      const outcomeBands = [
        ["hard_failure", "Hard Failure"],
        ["near_miss", "Near Miss"],
        ["mixed_success", "Mixed Success"],
        ["strong_success", "Strong Success"],
        ["exceptional_success", "Exceptional Success"],
        ["critical_success", "Critical Success"]
      ];
      const outcomeRows = outcomeBands.map(([key, label]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(outcomes[key] || "")}</li>`).join("");
      return `<article class="roll-mini-card"><h3>${escapeHtml(card.title || "Roll")}</h3><p><strong>Traits:</strong> ${escapeHtml((card.trait_options || []).join(", "))} <strong>Difficulty / DC:</strong> ${escapeHtml(card.difficulty || "")}</p><p>${escapeHtml(card.roll || "")}</p><h4>Official Daggerheart Results</h4><ul>${officialRows}</ul><h4>Outcome Options</h4><ul>${outcomeRows}</ul></article>`;
    }).join("")}</details>`;
  }

  function renderScrubber() {
    const scrubber = document.querySelector("[data-slide-scrubber]");
    let lastSection = null;
    const parts = [];
    slides.forEach((slide) => {
      if (slide.sectionId && slide.sectionId !== lastSection) {
        lastSection = slide.sectionId;
        parts.push(`<div class="scrub-act-divider" role="presentation"><span>${escapeHtml(slide.sectionTitle || slide.sectionId)}</span></div>`);
      }
      const image = fallbackImage(slide);
      const classes = [
        "scrub-dot",
        slide.id === state.currentSlideId ? "is-current" : "",
        state.completedSlides.includes(slide.id) ? "is-complete" : "",
        state.pinnedSlides.includes(slide.id) ? "is-pinned" : "",
        slide.type === "section" || slide.type === "act-divider" ? "is-section" : "",
        slide.type === "cheat" ? "is-cheat" : "",
        slide.type === "map" ? "is-map" : "",
      ].filter(Boolean).join(" ");
      const note = slide.caption || slide.gmGoal || slide.publicObjective || "";
      parts.push(`<button class="${classes}" type="button" data-scrub-slide-id="${escapeAttr(slide.id)}"`
        + ` data-cue-num="${escapeAttr(slide.slideNumber)}" data-cue-act="${escapeAttr(slide.sectionTitle || "")}"`
        + ` data-cue-title="${escapeAttr(slide.title)}" data-cue-note="${escapeAttr(note)}"`
        + ` aria-label="Go to slide ${escapeAttr(slide.slideNumber)}: ${escapeAttr(slide.title)} (${escapeAttr(slide.sectionTitle || "")})">`
        + `<img src="${escapeAttr(image)}" alt=""><span>${escapeHtml(`${slide.slideNumber}. ${slide.title}`)}</span></button>`);
    });
    scrubber.innerHTML = parts.join("");
    scrubber.querySelector(".scrub-dot.is-current")?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function bindRenderedSlide() {
    document.querySelector("[data-run-current-complete]")?.addEventListener("change", (event) => {
      const slide = currentSlide();
      markComplete(slide.id, event.target.checked);
      if (!event.target.checked && state.lastAutoCompletedSlideId === slide.id) {
        state.lastAutoCompletedSlideId = "";
        saveState();
      }
      render();
    });
    document.querySelectorAll("[data-slide-state-field]").forEach((field) => {
      field.addEventListener("change", () => {
        const gmState = readGmState();
        if (field.type === "checkbox") gmState[field.dataset.slideStateField] = field.checked;
        else if (field.type === "number") gmState[field.dataset.slideStateField] = Number(field.value);
        else gmState[field.dataset.slideStateField] = field.value;
        writeGmState(gmState);
      });
    });
    document.querySelectorAll("[data-player-beat-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const slide = currentSlide();
        const index = Number(button.dataset.playerBeatIndex);
        const beat = (slide.playerBeats || [])[index];
        if (!beat) return;
        setActiveBeatIndex(slide, index);
        sendToPlayer("setSlide", { displayMode: beat.displayMode || "text-first", playerBeat: beat }, false);
        showStatus(`Sent ${beat.label || "player beat"} to Player Display`);
        render();
      });
    });
    document.querySelectorAll("[data-show-entity-image]").forEach((button) => {
      button.addEventListener("click", () => showEntityImageToPlayers(button.dataset.showEntityImage));
    });
    document.querySelectorAll("[data-character-cue-index]").forEach((button) => {
      button.addEventListener("click", () => showCharacterCueToPlayers(Number(button.dataset.characterCueIndex)));
    });
    bindRunInlineActions();
  }

  function goTo(id, options = {}) {
    const nextIndex = slides.findIndex((slide) => slide.id === id);
    if (nextIndex < 0) return;
    const previous = currentSlide();
    const next = slides[nextIndex];
    if (options.autoComplete && previous?.completionEligible && previous.id !== next.id) {
      markComplete(previous.id, true);
      state.lastAutoCompletedSlideId = previous.id;
      showStatus(`Auto-completed ${previous.id}`);
    }
    state.currentSlideId = next.id;
    saveState();
    render();
  }

  function go(delta) {
    const idx = currentIndex();
    const next = Math.max(0, Math.min(slides.length - 1, idx + delta));
    goTo(slides[next].id, { autoComplete: delta > 0 && state.autoCompletePreviousSceneOnNext });
  }

  function goSection(delta) {
    const idx = currentIndex();
    const currentSection = currentSlide().sectionId;
    const candidates = slides
      .map((slide, index) => ({ slide, index }))
      .filter((entry) => entry.slide.sectionId !== currentSection && (delta > 0 ? entry.index > idx : entry.index < idx));
    const target = delta > 0 ? candidates[0] : candidates[candidates.length - 1];
    if (target) goTo(target.slide.id);
  }

  function markComplete(id, complete) {
    const set = new Set(state.completedSlides || []);
    if (complete) set.add(id);
    else set.delete(id);
    state.completedSlides = [...set];
    saveState();
  }

  function undoLastAutoComplete() {
    const id = state.lastAutoCompletedSlideId;
    if (!id) {
      showStatus("No auto-completed slide to undo");
      return;
    }
    markComplete(id, false);
    state.lastAutoCompletedSlideId = "";
    saveState();
    showStatus(`Undid completion for ${id}`);
    render();
  }

  function togglePinned() {
    const id = currentSlide().id;
    const existingIndex = (state.pinnedSlides || []).indexOf(id);
    if (existingIndex >= 0) {
      const removedKey = PINNED_SHORTCUT_KEYS[existingIndex] || "";
      state.pinnedSlides = state.pinnedSlides.filter((pinnedId) => pinnedId !== id);
      normalizePinnedSlides();
      saveState();
      showStatus(removedKey ? `Removed pinned shortcut ${removedKey}` : "Slide unpinned");
      render();
      return;
    }
    const previousPins = state.pinnedSlides || [];
    const droppedId = previousPins.length >= PINNED_SHORTCUT_KEYS.length ? previousPins[PINNED_SHORTCUT_KEYS.length - 1] : "";
    state.pinnedSlides = [id, ...previousPins.filter((pinnedId) => pinnedId !== id)].slice(0, PINNED_SHORTCUT_KEYS.length);
    normalizePinnedSlides();
    saveState();
    const droppedSlide = droppedId && droppedId !== id ? slideById(droppedId) : null;
    showStatus(`Pinned to 7. Press P or 7 to return.${droppedSlide ? ` Oldest pin dropped: ${droppedSlide.title}.` : ""}`);
    render();
  }

  function goToPinnedIndex(index) {
    normalizePinnedSlides();
    const id = state.pinnedSlides[index];
    const slide = slideById(id);
    if (!slide) {
      saveState();
      renderPinnedShortcuts();
      showStatus("Pinned shortcut is empty");
      return false;
    }
    goTo(slide.id);
    const key = PINNED_SHORTCUT_KEYS[index] || "P";
    showStatus(`Jumped to pinned ${key}: ${slide.title}`);
    return true;
  }

  function goToLatestPinned() {
    if (!state.pinnedSlides?.length) {
      showStatus("No pinned slides yet");
      return false;
    }
    return goToPinnedIndex(0);
  }

  function toggleComplete() {
    const id = currentSlide().id;
    markComplete(id, !state.completedSlides.includes(id));
    if (state.completedSlides.includes(id)) showStatus("Slide marked complete");
    else showStatus("Slide marked incomplete");
    render();
  }

  async function copyText(markdown = false) {
    const slide = currentSlide();
    const text = playerTextForSlide(slide);
    const output = markdown ? text.split(/\n+/).map((line) => `> ${line}`).join("\n") : text;
    try {
      await navigator.clipboard.writeText(output);
      flashActiveTool("Copied");
      showStatus(markdown ? "Copied Markdown quote to clipboard" : "Copied player text to clipboard");
    } catch {
      window.prompt("Copy player text:", output);
      showStatus("Copy fallback opened");
    }
    return output;
  }

  function runPlayerPayloadFromElement(element) {
    const holder = element?.closest?.("[data-run-player-payload]");
    try {
      return JSON.parse(holder?.dataset.runPlayerPayload || "{}");
    } catch {
      return {};
    }
  }

  async function copyRunPlayerPayload(payload) {
    const text = payload?.text || payload?.readAloud || payload?.publicObjective || payload?.caption || "";
    try {
      await navigator.clipboard.writeText(text);
      showStatus("Copied selected player-safe chunk");
    } catch {
      window.prompt("Copy player text:", text);
      showStatus("Copy fallback opened");
    }
    return text;
  }

  function sendRunPlayerPayload(payload) {
    const slide = currentSlide();
    if (!payload || (!payload.text && !payload.image)) {
      showStatus("No player-safe payload found");
      return;
    }
    const displayMode = payload.displayMode || (payload.kind === "image" ? "image-title-caption" : "read-aloud-fullscreen");
    const beat = {
      id: payload.id || `${slide.id}-inline`,
      title: payload.title || slide.title || "Player Display",
      image: payload.image || fallbackImage(slide),
      alt: payload.alt || payload.title || slide.title || "Player display asset.",
      caption: payload.caption || payload.text || "",
      publicObjective: payload.publicObjective || payload.text || payload.caption || "",
      readAloud: payload.readAloud || payload.text || payload.caption || "",
      playerBullets: [],
      playerTable: [],
      displayMode,
    };
    sendToPlayer("setSlide", { displayMode, playerBeat: beat }, false);
    markRevealed();
    showStatus(payload.kind === "image" ? "Sent image to Player Display" : "Sent selected text to Player Display");
  }

  function bindRunInlineActions(root = document) {
    root.querySelectorAll("[data-run-inline-action]").forEach((button) => {
      if (button.dataset.runInlineBound === "true") return;
      button.dataset.runInlineBound = "true";
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const payload = runPlayerPayloadFromElement(button);
        const action = button.dataset.runInlineAction;
        if (action === "copy-text") await copyRunPlayerPayload(payload);
        if (action === "send-text" || action === "send-image") sendRunPlayerPayload(payload);
      });
    });
  }

  function showCharacterCueToPlayers(index) {
    const slide = currentSlide();
    const entry = (slide.perCharacterLayer || [])[index];
    const text = entry?.playerCue || "";
    if (!text) {
      showStatus("No player-safe character cue available");
      return;
    }
    const displayMode = "read-aloud-fullscreen";
    const beat = {
      id: `${slide.id}-${entry.pcId || "pc"}-cue`,
      title: entry.pcName || slide.title || "Character cue",
      image: fallbackImage(slide),
      alt: entry.pcName || slide.title || "Character cue.",
      caption: text,
      publicObjective: text,
      readAloud: text,
      playerBullets: [],
      playerTable: [],
      displayMode,
    };
    sendToPlayer("setSlide", { displayMode, playerBeat: beat }, false);
    markRevealed();
    showStatus(`Sent ${entry.pcName || "character"} cue to Player Display`);
  }

  function openTextWindow(printNow = false) {
    const slide = currentSlide();
    const text = playerTextForSlide(slide);
    const win = window.open("", "_blank", "popup=yes,width=900,height=700");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(slide.title)}</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:3rem;background:#fff;color:#111}h1{font-size:2.4rem}p{font-size:2rem;line-height:1.35}</style></head><body><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(text)}</p></body></html>`);
    win.document.close();
    if (printNow) win.print();
    showStatus(printNow ? "Print window opened" : "Player text window opened");
  }

  function openImageWindow() {
    const slide = currentSlide();
    const image = imageForSlideTools(slide);
    if (!image) {
      showStatus("No image available for this slide");
      return;
    }
    const win = window.open("", "_blank", "popup=yes,width=1200,height=850");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(slide.title)}</title><style>html,body{margin:0;min-height:100%;background:#050607;color:#f7f4ec;font-family:system-ui,sans-serif}body{display:grid;grid-template-rows:auto 1fr}header{padding:.75rem 1rem;background:#111820;border-bottom:1px solid rgba(255,255,255,.16)}h1{font-size:1rem;margin:0}main{display:grid;place-items:center;padding:1rem}img{max-width:100%;max-height:calc(100vh - 5rem);object-fit:contain}</style></head><body><header><h1>${escapeHtml(slide.title)}</h1></header><main><img src="${escapeAttr(image)}" alt="${escapeAttr(slide.alt || slide.mapData?.alt || slide.title)}"></main></body></html>`);
    win.document.close();
    showStatus("Image window opened");
  }

  function flashActiveTool(label) {
    const button = document.activeElement?.closest?.(".run-icon-button");
    if (!button) return;
    const previous = button.getAttribute("data-short-label") || "";
    button.setAttribute("data-short-label", label);
    button.classList.add("is-confirmed");
    window.setTimeout(() => {
      if (previous) button.setAttribute("data-short-label", previous);
      button.classList.remove("is-confirmed");
    }, 1300);
  }

  function openImageDialog() {
    const slide = currentSlide();
    if (!imageForSlideTools(slide)) return;
    lastDialogOpener = document.activeElement;
    const dialog = document.querySelector("#run-image-dialog");
    document.querySelector("#run-expanded-image").src = imageForSlideTools(slide);
    document.querySelector("#run-expanded-image").alt = slide.alt || slide.mapData?.alt || slide.title;
    document.querySelector("#run-expanded-caption").textContent = slide.caption || "";
    document.querySelector("#run-expanded-raw").href = imageForSlideTools(slide);
    dialog.showModal();
  }

  function openTextDialog() {
    const slide = currentSlide();
    lastDialogOpener = document.activeElement;
    document.querySelector("#run-expanded-text-title").textContent = slide.title;
    document.querySelector("#run-expanded-text").textContent = playerTextForSlide(slide);
    document.querySelector("#run-text-dialog").showModal();
  }

  function showShortcuts() {
    lastDialogOpener = document.activeElement;
    document.querySelector("#shortcut-list").innerHTML = shortcuts.map(([key, label]) => `<div><strong>${escapeHtml(key)}</strong><br>${escapeHtml(label)}</div>`).join("");
    document.querySelector("#shortcut-help").showModal();
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return ["input", "textarea", "select"].includes(tag) || target.isContentEditable || !!target.closest("[data-disable-shortcuts], dialog form");
  }

  function hasTextSelection() {
    const selection = window.getSelection?.();
    return !!selection && !selection.isCollapsed && String(selection).trim().length > 0;
  }

  function handleAction(action) {
    if (action === "first") goTo(slides[0].id);
    if (action === "last") goTo(slides[slides.length - 1].id);
    if (action === "previous") go(-1);
    if (action === "next") go(1);
    if (action === "toggle-beat-autoplay") toggleBeatAutoplay();
    if (action === "show-image") { sendToPlayer("showImage", { displayMode: "image-only" }, false); showStatus("Sent current beat image to Player Display"); }
    if (action === "show-current-text") { sendToPlayer("setSlide", { ...currentPlayerPayload(), displayMode: "text-first" }, false); markRevealed(); showStatus("Sent current beat text to Player Display"); }
    if (action === "show-text") { sendToPlayer("showText", { displayMode: "read-aloud-fullscreen" }, false); markRevealed(); showStatus("Sent current beat fullscreen text to Player Display"); }
    if (action === "show-objective") { sendToPlayer("showObjective", { displayMode: "public-objective" }, false); showStatus("Sent objective to Player Display"); }
    if (action === "blackout") {
      if (state.playerDisplayBlackout) {
        sendToPlayer("setSlide", currentPlayerPayload(), false);
        showStatus("Player Display restored");
      } else {
        sendToPlayer("blackout", { displayMode: "blackout" }, false);
        showStatus("Player Display blacked out");
      }
    }
    if (action === "toggle-image") {
      state.imageCollapsed = !state.imageCollapsed;
      saveState();
      render();
      showStatus(state.imageCollapsed ? "Image hidden" : "Image visible");
    }
    if (action === "toggle-filmstrip") {
      state.filmstripCollapsed = !state.filmstripCollapsed;
      saveState();
      render();
      showStatus(state.filmstripCollapsed ? "Filmstrip hidden" : "Filmstrip visible");
    }
    if (action === "open-display") openPlayerDisplay();
    if (action === "open-image-window") openImageWindow();
    if (action === "copy-text") copyText(false);
    if (action === "copy-discord") copyText(true);
    if (action === "export-options") window.GoldspireExports?.openForSlide?.(currentSlide().id);
    if (action === "open-text-window") openTextWindow(false);
    if (action === "print-text") openTextWindow(true);
    if (action === "expand-image") openImageDialog();
    if (action === "expand-text") openTextDialog();
    if (action === "summon-npc") openNpcSummonDialog();
    if (action === "open-factions") openFactionPickerDialog();
    if (action === "open-locations") openLocationPickerDialog();
    if (action === "open-items") openItemPickerDialog();
    if (action === "open-clues") openCluePickerDialog();
    if (action === "toggle-complete") toggleComplete();
    if (action === "undo-complete") undoLastAutoComplete();
    if (action === "pin") togglePinned();
    if (action === "fullscreen") document.documentElement.requestFullscreen?.();
    if (action === "shortcuts") showShortcuts();
  }

  function markRevealed() {
    const set = new Set(state.revealedSlides || []);
    set.add(currentSlide().id);
    state.revealedSlides = [...set];
    saveState();
  }

  let ENTITY_INDEX = null;
  let RULE_TERM_INDEX = null;
  const IGNORED_ENTITY_ALIASES = new Set(["will"]);
  const IGNORED_RULE_ALIASES = new Set(["roll", "rolls", "check", "save", "help", "assist", "aid", "pass", "break", "pause", "rest", "hide", "force", "control"]);
  function entityMap() { return window.ATLAS_ENTITIES || {}; }
  function entityWikiHref(entity) { return `pages/entities/${encodeURIComponent(entity.id)}.html`; }
  function ruleWikiHref(id) { return `pages/rules/${encodeURIComponent(id)}.html`; }
  function entityById(id) {
    if (!ENTITY_INDEX) ENTITY_INDEX = buildEntityIndex();
    return ENTITY_INDEX.map.get(id) || null;
  }
  function showEntityImageToPlayers(entityId) {
    const entity = entityById(entityId);
    if (!entity?.image) {
      showStatus("No entity image available");
      return;
    }
    const title = entity.player_display_title || entity.name || "Entity";
    const caption = entity.player_display_caption || entity.robust?.player_description || entity.summary || "";
    const beat = {
      id: `entity-${entity.id}`,
      title,
      image: entity.image,
      alt: `${title} visual reference.`,
      caption,
      publicObjective: caption,
      readAloud: caption,
      playerBullets: [],
      playerTable: [],
      displayMode: "image-title-caption",
    };
    sendToPlayer("setSlide", { displayMode: "image-title-caption", playerBeat: beat }, false);
    showStatus(`Sent ${title} image to Player Display`);
  }
  function buildEntityIndex() {
    const map = new Map();
    const names = [];
    Object.values(entityMap()).forEach((entity) => {
      if (!entity || !entity.id) return;
      map.set(entity.id, entity);
      [entity.name, ...(entity.aliases || [])].filter(Boolean).forEach((label, index) => {
        const name = String(label).trim();
        const lower = name.toLowerCase();
        if (!name || IGNORED_ENTITY_ALIASES.has(lower)) return;
        if (index > 0 && name.length < 4) return;
        if (name.length >= 3) names.push({ name, id: entity.id, type: "entity" });
      });
    });
    names.sort((a, b) => b.name.length - a.name.length);
    return { map, names };
  }
  function buildRuleTermIndex() {
    const terms = [];
    const allowShort = new Set(["HP", "AC", "DC", "D&D", "DND"]);
    (atlasRules || []).forEach((rule) => {
      [rule.title, ...(rule.aliases || [])].filter(Boolean).forEach((label, index) => {
        const name = String(label).trim();
        const lower = name.toLowerCase();
        if (!name || IGNORED_RULE_ALIASES.has(lower)) return;
        if (index > 0 && name.length < 5 && !allowShort.has(name)) return;
        if (name.length < 3 && !allowShort.has(name)) return;
        terms.push({ name, id: rule.id, type: "mechanic" });
      });
    });
    terms.sort((a, b) => b.name.length - a.name.length);
    return terms;
  }
  function collectLinkMatches(escaped, terms) {
    const matches = [];
    for (const item of terms) {
      const safe = escapeHtml(item.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let re;
      try { re = new RegExp(`(?<![A-Za-z0-9])(${safe})(?![A-Za-z0-9])`, "gi"); } catch (err) { re = new RegExp(`\\b(${safe})\\b`, "gi"); }
      let m;
      while ((m = re.exec(escaped)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, id: item.id, text: m[0], type: item.type });
        if (m[0].length === 0) re.lastIndex += 1;
      }
    }
    return matches;
  }
  function linkifyEntities(text) {
    if (!text) return "";
    const escaped = escapeHtml(text);
    if (!ENTITY_INDEX) ENTITY_INDEX = buildEntityIndex();
    if (!RULE_TERM_INDEX) RULE_TERM_INDEX = buildRuleTermIndex();
    const matches = [
      ...collectLinkMatches(escaped, ENTITY_INDEX.names || []),
      ...collectLinkMatches(escaped, RULE_TERM_INDEX || []),
    ];
    matches.sort((a, b) => (a.start - b.start) || ((b.end - b.start) - (a.end - a.start)));
    const clean = [];
    let lastEnd = -1;
    for (const m of matches) { if (m.start >= lastEnd) { clean.push(m); lastEnd = m.end; } }
    if (!clean.length) return escaped;
    let out = "";
    let cursor = 0;
    for (const m of clean) {
      out += escaped.slice(cursor, m.start);
      if (m.type === "mechanic") {
        out += `<a class="mechanic-link inline-mechanic-link" data-mechanic="${escapeAttr(m.id)}" href="${escapeAttr(ruleWikiHref(m.id))}">${m.text}</a>`;
      } else {
        const entity = ENTITY_INDEX.map.get(m.id);
        const cls = (entity.meta && entity.meta.class) || "";
        out += `<a class="entity-link ${escapeAttr(cls)} inline-entity-link" data-entity="${escapeAttr(m.id)}" href="${escapeAttr(entityWikiHref(entity))}">${m.text}</a>`;
      }
      cursor = m.end;
    }
    out += escaped.slice(cursor);
    return out;
  }
  function linkifyList(items, empty) {
    const rows = (items || []).filter(Boolean);
    if (!rows.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
    return `<ul>${rows.map((item) => `<li>${linkifyEntities(item)}</li>`).join("")}</ul>`;
  }

  function ruleSearchBlob(rule) {
    return [rule.id, rule.title, rule.summary, rule.when, rule.answer, ...(rule.aliases || [])].join(" ").toLowerCase();
  }

  function matchingRules(query, limit = 6) {
    const q = String(query || "").trim().toLowerCase();
    const source = atlasRules || [];
    if (!q) return source.slice(0, limit);
    return source.filter((rule) => ruleSearchBlob(rule).includes(q)).slice(0, limit);
  }

  function updateRunQuickRef() {
    const widget = document.querySelector("[data-run-quick-ref]");
    if (!widget || !slides.length) return;
    const slide = currentSlide();
    widget.querySelector("[data-run-quick-current]").textContent = slide ? `${slide.id} · ${slide.title}` : "No slide selected.";
    const mechanics = widget.querySelector("[data-run-quick-mechanics]");
    if (mechanics) {
      mechanics.innerHTML = (slide?.mechanicIds || []).map((id) => {
        const rule = atlasRulesById.get(id);
        return rule ? `<a class="mechanic-chip" href="pages/rules/${escapeAttr(id)}.html" data-mechanic="${escapeAttr(id)}">${escapeHtml(rule.title)}</a>` : "";
      }).join("");
    }
    const pcNode = widget.querySelector("[data-run-quick-pcs]");
    if (pcNode) {
      const profiles = readGmState().pc_profiles || {};
      const pcs = Object.values(entityMap()).filter((entity) => entity.type === "pc" || (entity.tags || []).includes("pc"));
      pcNode.innerHTML = pcs.slice(0, 5).map((entity) => {
        const profile = { ...(entity.pc_profile || {}), ...(profiles[entity.id] || {}) };
        const name = profile.current_character_name || entity.name;
        const player = profile.player_name || "Unassigned";
        const pronunciation = profile.character_pronunciation || entity.short_pronunciation || entity.pronunciation || "";
        return `<p><strong>${escapeHtml(name)}</strong><br><span class="muted">${escapeHtml(player)} · ${escapeHtml(pronunciation)}</span></p>`;
      }).join("");
    }
    const input = widget.querySelector("[data-run-quick-rule-search]");
    const results = widget.querySelector("[data-run-quick-rule-results]");
    if (results) {
      results.innerHTML = matchingRules(input?.value || "", 6).map((rule) => `<a href="pages/rules/${escapeAttr(rule.id)}.html" data-mechanic="${escapeAttr(rule.id)}"><strong>${escapeHtml(rule.title)}</strong><span class="muted"> ${escapeHtml((rule.aliases || []).slice(0, 3).join(", "))}</span></a>`).join("");
    }
  }

  function setupRunQuickRef() {
    const widget = document.querySelector("[data-run-quick-ref]");
    if (!widget) return;
    const key = widget.dataset.persistKey || "goldspire.quickRef.state";
    const saved = { collapsed: true, ...readJson(key, {}) };
    const toggle = widget.querySelector("[data-run-quick-ref-toggle]");
    const reset = widget.querySelector("[data-run-quick-ref-reset]");
    const header = widget.querySelector("[data-run-quick-ref-drag]");
    const apply = () => {
      widget.classList.toggle("is-collapsed", !!saved.collapsed);
      toggle?.setAttribute("aria-expanded", saved.collapsed ? "false" : "true");
      if (saved.x != null && saved.y != null && !window.matchMedia("(max-width: 720px)").matches) {
        widget.style.left = `${saved.x}px`;
        widget.style.top = `${saved.y}px`;
        widget.style.right = "auto";
        widget.style.bottom = "auto";
      }
    };
    toggle?.addEventListener("click", () => {
      saved.collapsed = !saved.collapsed;
      writeJson(key, saved);
      apply();
    });
    reset?.addEventListener("click", () => {
      localStorage.removeItem(key);
      saved.collapsed = true;
      delete saved.x;
      delete saved.y;
      widget.style.left = "";
      widget.style.top = "";
      widget.style.right = "";
      widget.style.bottom = "";
      apply();
    });
    widget.querySelector("[data-run-quick-rule-search]")?.addEventListener("input", updateRunQuickRef);
    header?.addEventListener("pointerdown", (event) => {
      if (window.matchMedia("(max-width: 720px)").matches || event.target.closest("button")) return;
      const rect = widget.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const move = (moveEvent) => {
        saved.x = Math.max(8, Math.min(window.innerWidth - 80, rect.left + moveEvent.clientX - startX));
        saved.y = Math.max(8, Math.min(window.innerHeight - 48, rect.top + moveEvent.clientY - startY));
        apply();
      };
      const up = () => {
        writeJson(key, saved);
        header.removeEventListener("pointermove", move);
        header.removeEventListener("pointerup", up);
        header.removeEventListener("pointercancel", up);
      };
      header.addEventListener("pointermove", move);
      header.addEventListener("pointerup", up);
      header.addEventListener("pointercancel", up);
    });
    apply();
    updateRunQuickRef();
  }

  function setupEntityHoverCards() {
    const card = document.querySelector("#hover-card");
    if (!card) return;
    if (!ENTITY_INDEX) ENTITY_INDEX = buildEntityIndex();
    let pinned = false;
    let hideTimer;
    let activeTarget = null;
    let suppressedTarget = null;
    let suppressClearTimer = null;
    const closeButton = () => '<button class="hover-card-close" type="button" data-hover-card-close aria-label="Close cue card">Close</button>';
    const fill = (entity) => {
      const tags = (entity.tags || []).map((tag) => `<span class="track-pill">${escapeHtml(tag)}</span>`).join(" ");
      const scenes = escapeHtml((entity.appears_in || []).join(", ") || "Referenced lore");
      const icon = (entity.meta && entity.meta.icon_asset) || "";
      const label = (entity.meta && entity.meta.label) || entity.type || "";
      const playerTitle = entityPlayerDisplayTitle(entity);
      const playerCaption = entityPlayerDisplayCaption(entity);
      const playerSceneId = `entity-${entity.id || String(entity.name || "entity").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      const image = entity.image || "";
      const imageHtml = image
        ? `<figure class="hover-card-media-wrap run-throwable-image"><img class="hover-card-media" src="${escapeAttr(image)}" alt="${escapeAttr(playerTitle)}">${runImageSendButton(playerTitle, image, playerTitle, playerCaption, playerSceneId)}</figure>`
        : "";
      const summaryText = playerCaption || entity.summary || "";
      card.innerHTML = `
        ${closeButton()}
        ${imageHtml}
        <div class="private-note">${icon ? `<img class="type-icon" src="${escapeAttr(icon)}" alt="" aria-hidden="true"> ` : ""}${escapeHtml(label)}</div>
        <strong>${escapeHtml(entity.name)}</strong>
        <p class="pronunciation-line"><strong>Pronunciation:</strong> ${escapeHtml(entity.short_pronunciation || entity.pronunciation || "")}</p>
        ${runThrowableTextChunk(`${playerTitle} description`, summaryText, { sceneId: playerSceneId, className: "hover-card-player-text" })}
        ${entity.role ? `<p class="muted">${escapeHtml(entity.role)}</p>` : ""}
        <div class="track-row">${tags}</div>
        <p class="muted">Appears in: ${scenes}</p>
        ${entity.stat_summary ? `<p><strong>Stat:</strong> ${escapeHtml(entity.stat_summary)}</p>` : ""}
        <a class="button secondary hover-card-wiki" href="${escapeAttr(entityWikiHref(entity))}">Open full wiki entry &rarr;</a>`;
      bindRunInlineActions(card);
      decorateRunReferenceLinks(card);
    };
    const fillRule = (rule) => {
      const tag = String(rule.tag || "official").replaceAll("-", " ");
      card.innerHTML = `
        ${closeButton()}
        <div class="private-note">${escapeHtml(tag)}</div>
        <strong>${escapeHtml(rule.title || "")}</strong>
        <p>${escapeHtml(rule.summary || "")}</p>
        <p><strong>Use:</strong> ${escapeHtml(rule.when || "")}</p>
        ${rule.key_number ? `<p><strong>Key:</strong> ${escapeHtml(rule.key_number)}</p>` : ""}
        <a class="button secondary hover-card-wiki" href="pages/rules/${escapeAttr(rule.id)}.html">Open full rule page &rarr;</a>`;
      decorateRunReferenceLinks(card);
    };
    const fillTakeaway = (kind, target) => {
      const slide = currentSlide();
      const gmBeat = activeGmBeatForSlide(slide) || {};
      const help = gmBeat.takeawayHelp?.[kind] || slide.takeawayHelp?.[kind] || {};
      const labels = { player: "Player takeaway", story: "Story takeaway", mechanic: "Mechanic takeaway" };
      const visibleText = String(target?.textContent || "").trim();
      const statement = String(help.statement || "").trim();
      const deeper = String(help.deeper || help.body || "").trim();
      const ask = String(help.ask || help.faq || "").trim();
      const showStatement = statement && statement !== visibleText;
      const showDeeper = deeper && deeper !== visibleText && deeper !== statement;
      const ruleIds = String(target.dataset.takeawayRules || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const chips = ruleIds.map((id) => {
        const rule = atlasRulesById.get(id);
        return rule ? `<a class="mechanic-chip" href="${escapeAttr(ruleWikiHref(id))}" data-mechanic="${escapeAttr(id)}">${escapeHtml(rule.title)}</a>` : "";
      }).join("");
      const firstRule = ruleIds.find((id) => atlasRulesById.has(id));
      const href = firstRule
        ? ruleWikiHref(firstRule)
        : (slide.sectionId === "SESSION-ZERO" ? "pages/session-zero.html" : (slide.sourceSceneSlug ? `pages/scenes/${escapeAttr(slide.sourceSceneSlug)}.html` : "index.html"));
      card.innerHTML = `
        ${closeButton()}
        <div class="private-note">${escapeHtml(labels[kind] || "Takeaway")}</div>
        <strong>${escapeHtml(help.title || labels[kind] || "Takeaway")}</strong>
        ${showStatement ? `<p><strong>Table point:</strong> ${escapeHtml(statement)}</p>` : ""}
        ${help.say ? `<p><strong>Say it like this:</strong> ${escapeHtml(help.say)}</p>` : ""}
        ${ask ? `<p><strong>If players ask:</strong> ${escapeHtml(ask)}</p>` : ""}
        ${showDeeper ? `<p><strong>Deeper GM help:</strong> ${escapeHtml(deeper)}</p>` : ""}
        ${chips ? `<div class="mechanic-chip-row">${chips}</div>` : ""}
        <a class="button secondary hover-card-wiki" href="${escapeAttr(href)}">Open related reference &rarr;</a>`;
      decorateRunReferenceLinks(card);
    };
    const place = (target) => {
      const r = target.getBoundingClientRect();
      const gap = 12;
      const maxW = Math.max(240, window.innerWidth - (gap * 2));
      const maxH = Math.max(220, window.innerHeight - (gap * 2));
      card.style.maxWidth = `${maxW}px`;
      card.style.maxHeight = `${maxH}px`;
      const rect = card.getBoundingClientRect();
      const w = Math.min(rect.width || card.offsetWidth || 350, maxW);
      const h = Math.min(rect.height || card.offsetHeight || 260, maxH);
      const left = Math.min(window.innerWidth - w - gap, Math.max(gap, r.left));
      let top = r.bottom + 8;
      if (top + h > window.innerHeight - gap) top = Math.max(gap, r.top - h - 8);
      card.style.left = `${left}px`;
      card.style.top = `${Math.min(window.innerHeight - h - gap, Math.max(gap, top))}px`;
    };
    const bringTargetIntoView = (target) => {
      const r = target.getBoundingClientRect();
      const gap = 16;
      const offscreen = r.top < gap || r.left < gap || r.bottom > window.innerHeight - gap || r.right > window.innerWidth - gap;
      if (offscreen && target.scrollIntoView) {
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      }
    };
    const open = (target, pin) => {
      if (target === suppressedTarget) return;
      const rule = target.dataset.mechanic ? atlasRulesById.get(target.dataset.mechanic) : null;
      const entity = target.dataset.entity ? ENTITY_INDEX.map.get(target.dataset.entity) : null;
      const takeawayKind = target.dataset.takeawayKind || "";
      if (!rule && !entity && !takeawayKind) return;
      clearTimeout(hideTimer);
      activeTarget = target;
      bringTargetIntoView(target);
      if (takeawayKind) fillTakeaway(takeawayKind, target);
      else if (rule) fillRule(rule);
      else fill(entity);
      card.scrollTop = 0;
      card.style.left = "12px";
      card.style.top = "12px";
      card.classList.add("is-visible");
      if (pin) { pinned = true; card.classList.add("is-pinned"); }
      card.querySelectorAll("img").forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", () => place(target), { once: true });
          img.addEventListener("error", () => place(target), { once: true });
        }
      });
      place(target);
      requestAnimationFrame(() => place(target));
      setTimeout(() => place(target), 80);
      card.setAttribute("aria-hidden", "false");
    };
    const close = (suppress = false) => {
      clearTimeout(suppressClearTimer);
      if (suppress && activeTarget) suppressedTarget = activeTarget;
      pinned = false;
      card.classList.remove("is-visible", "is-pinned");
      card.setAttribute("aria-hidden", "true");
      activeTarget = null;
    };
    const handleReferenceEnter = (event) => {
      const target = event.target.closest("[data-entity], [data-mechanic], [data-takeaway-kind]");
      if (target && !pinned) open(target, false);
    };
    document.addEventListener("pointerover", handleReferenceEnter);
    document.addEventListener("mouseover", handleReferenceEnter);
    document.addEventListener("focusin", (event) => {
      const target = event.target.closest("[data-entity], [data-mechanic], [data-takeaway-kind]");
      if (target && !pinned) open(target, false);
    });
    document.addEventListener("pointerout", (event) => {
      if (pinned) return;
      const target = event.target.closest("[data-entity], [data-mechanic], [data-takeaway-kind]");
      if (!target) return;
      if (target === suppressedTarget) {
        clearTimeout(suppressClearTimer);
        suppressedTarget = null;
      }
      if (event.relatedTarget && card.contains(event.relatedTarget)) return;
      hideTimer = setTimeout(() => { if (!pinned) close(); }, 5000);
    });
    document.addEventListener("pointermove", (event) => {
      if (!suppressedTarget) return;
      if (suppressedTarget.contains(event.target) || card.contains(event.target)) {
        clearTimeout(suppressClearTimer);
        return;
      }
      clearTimeout(suppressClearTimer);
      suppressClearTimer = setTimeout(() => { suppressedTarget = null; }, 350);
    }, { passive: true });
    card.addEventListener("pointerenter", () => clearTimeout(hideTimer));
    card.addEventListener("pointerleave", () => {
      if (!pinned) hideTimer = setTimeout(close, 500);
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-hover-card-close]")) {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.target.closest(".hover-card-wiki")) return;
      const target = event.target.closest("[data-entity], [data-mechanic], [data-takeaway-kind]");
      if (target) { event.preventDefault(); open(target, true); return; }
      if (!card.classList.contains("is-visible")) return;
      if (!event.target.closest("#hover-card")) close();
    }, true);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && card.classList.contains("is-visible")) close(true); });
  }

  function setupScrubberCue() {
    const cue = document.querySelector("#scrub-cue");
    if (!cue) return;
    let hideTimer;
    const show = (dot) => {
      clearTimeout(hideTimer);
      const d = dot.dataset;
      cue.innerHTML = `<span class="scrub-cue-act">${escapeHtml(d.cueAct || "")}</span>`
        + `<strong>${escapeHtml(d.cueNum || "")}. ${escapeHtml(d.cueTitle || "")}</strong>`
        + (d.cueNote ? `<p>${escapeHtml(d.cueNote)}</p>` : "");
      cue.hidden = false;
      const r = dot.getBoundingClientRect();
      const w = cue.offsetWidth;
      let left = r.left + r.width / 2 - w / 2;
      left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
      cue.style.left = `${left}px`;
      cue.style.bottom = `${Math.max(8, window.innerHeight - r.top + 8)}px`;
    };
    document.addEventListener("pointerover", (event) => {
      const dot = event.target.closest("[data-scrub-slide-id]");
      if (dot) show(dot);
    });
    document.addEventListener("focusin", (event) => {
      const dot = event.target.closest("[data-scrub-slide-id]");
      if (dot) show(dot);
    });
    document.addEventListener("pointerout", (event) => {
      if (!event.target.closest("[data-scrub-slide-id]")) return;
      hideTimer = setTimeout(() => { cue.hidden = true; }, 130);
    });
  }

  function bindStaticControls() {
    document.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-run-action]");
      if (actionButton) handleAction(actionButton.dataset.runAction);
      const scrub = event.target.closest("[data-scrub-slide-id]");
      if (scrub) goTo(scrub.dataset.scrubSlideId);
      const goSlide = event.target.closest("[data-run-go-slide]");
      if (goSlide) goTo(goSlide.dataset.runGoSlide);
      const spotlightToggle = event.target.closest("[data-spotlight-toggle]");
      if (spotlightToggle) {
        setSpotlightTrayOpen(spotlightToggle.getAttribute("aria-expanded") !== "true");
      }
      const spotlightAck = event.target.closest("[data-spotlight-ack]");
      if (spotlightAck) acknowledgeSpotlight(spotlightAck.dataset.spotlightAck);
      const spotlightSnooze = event.target.closest("[data-spotlight-snooze]");
      if (spotlightSnooze) snoozeSpotlight(spotlightSnooze.dataset.spotlightSnooze);
      const spotlightReset = event.target.closest("[data-spotlight-reset]");
      if (spotlightReset) resetSpotlights();
      const npcProfile = event.target.closest("[data-npc-profile-id]");
      if (npcProfile) openNpcProfile(npcProfile.dataset.npcProfileId);
      const npcDescription = event.target.closest("[data-npc-description]");
      if (npcDescription) sendNpcDescription(npcDescription.dataset.npcDescription);
      const npcPlayerLine = event.target.closest("[data-npc-player-line]");
      if (npcPlayerLine) sendNpcPlayerLine(npcPlayerLine.dataset.npcPlayerLine);
      const npcDismiss = event.target.closest("[data-npc-dismiss]");
      if (npcDismiss) dismissNpcCard(npcDismiss.dataset.npcDismiss);
      const npcSummon = event.target.closest("[data-npc-summon-id]");
      if (npcSummon) summonNpc(npcSummon.dataset.npcSummonId);
      if (event.target.closest("[data-npc-roll-improv]")) rollNpcImprovSeed();
      if (event.target.closest("[data-npc-add-improv]")) addNpcImprovSeed();
      const factionProfile = event.target.closest("[data-faction-profile-id]");
      if (factionProfile) openFactionProfile(factionProfile.dataset.factionProfileId);
      const factionPlayerLine = event.target.closest("[data-faction-player-line]");
      if (factionPlayerLine) sendFactionPublicLine(factionPlayerLine.dataset.factionPlayerLine);
      const factionDismiss = event.target.closest("[data-faction-dismiss]");
      if (factionDismiss) dismissFactionCard(factionDismiss.dataset.factionDismiss);
      const factionSummon = event.target.closest("[data-faction-summon-id]");
      if (factionSummon) summonFaction(factionSummon.dataset.factionSummonId);
      const factionSave = event.target.closest("[data-faction-save-answer]");
      if (factionSave) saveFactionAnswer(factionSave);
      const factionSendQuestion = event.target.closest("[data-faction-send-question]");
      if (factionSendQuestion) sendFactionQuestion(factionSendQuestion);
      const locationProfile = event.target.closest("[data-location-profile-id]");
      if (locationProfile) openLocationProfile(locationProfile.dataset.locationProfileId);
      const locationPlayerLine = event.target.closest("[data-location-player-line]");
      if (locationPlayerLine) sendLocationPublicLine(locationPlayerLine.dataset.locationPlayerLine);
      const locationVisual = event.target.closest("[data-location-visual-id]");
      if (locationVisual) sendLocationVisual(locationVisual.dataset.locationVisualId, locationVisual.dataset.locationVisualKey);
      const locationDismiss = event.target.closest("[data-location-dismiss]");
      if (locationDismiss) dismissLocationCard(locationDismiss.dataset.locationDismiss);
      const locationSummon = event.target.closest("[data-location-summon-id]");
      if (locationSummon) summonLocation(locationSummon.dataset.locationSummonId);
      const itemProfile = event.target.closest("[data-item-profile-id]");
      if (itemProfile) openItemProfile(itemProfile.dataset.itemProfileId);
      const itemVisual = event.target.closest("[data-item-visual-id]");
      if (itemVisual) sendItemImage(itemVisual.dataset.itemVisualId);
      const itemShow = event.target.closest("[data-item-player-show]");
      if (itemShow) sendItemShow(itemShow.dataset.itemPlayerShow);
      const itemTell = event.target.closest("[data-item-player-tell]");
      if (itemTell) sendItemTell(itemTell.dataset.itemPlayerTell);
      const itemDismiss = event.target.closest("[data-item-dismiss]");
      if (itemDismiss) dismissItemCard(itemDismiss.dataset.itemDismiss);
      const itemSummon = event.target.closest("[data-item-summon-id]");
      if (itemSummon) summonItem(itemSummon.dataset.itemSummonId);
      const clueProfile = event.target.closest("[data-clue-profile-id]");
      if (clueProfile) openClueProfile(clueProfile.dataset.clueProfileId);
      const clueVisual = event.target.closest("[data-clue-visual-id]");
      if (clueVisual) sendClueImage(clueVisual.dataset.clueVisualId);
      const clueShow = event.target.closest("[data-clue-player-show]");
      if (clueShow) sendClueShow(clueShow.dataset.cluePlayerShow);
      const clueDismiss = event.target.closest("[data-clue-dismiss]");
      if (clueDismiss) dismissClueCard(clueDismiss.dataset.clueDismiss);
      const clueSummon = event.target.closest("[data-clue-summon-id]");
      if (clueSummon) summonClue(clueSummon.dataset.clueSummonId);
    });
    document.querySelector("#run-auto-complete")?.addEventListener("change", (event) => {
      state.autoCompletePreviousSceneOnNext = event.target.checked;
      saveState();
    });
    document.querySelector("#run-sync-on-change")?.addEventListener("change", (event) => {
      state.syncOnSlideChange = event.target.checked;
      saveState();
    });
    document.querySelector("#run-slide-select")?.addEventListener("change", (event) => goTo(event.target.value));
    document.querySelector("[data-npc-summon-search]")?.addEventListener("input", renderNpcSummonList);
    document.querySelector("[data-faction-picker-search]")?.addEventListener("input", renderFactionPickerList);
    document.querySelector("[data-location-picker-search]")?.addEventListener("input", renderLocationPickerList);
    document.querySelector("[data-item-picker-search]")?.addEventListener("input", renderItemPickerList);
    document.querySelector("[data-clue-picker-search]")?.addEventListener("input", renderCluePickerList);
    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("close", () => lastDialogOpener?.focus?.());
      dialog.addEventListener("cancel", () => lastDialogOpener?.focus?.());
    });
    const scrubber = document.querySelector("[data-slide-scrubber]");
    const jumpFromPoint = (event) => {
      if (event.target.closest("[data-scrub-slide-id]")) return;
      const rect = scrubber.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left + scrubber.scrollLeft) / scrubber.scrollWidth));
      const index = Math.round(ratio * (slides.length - 1));
      goTo(slides[index].id);
    };
    scrubber?.addEventListener("pointerdown", jumpFromPoint);
  }

  function bindKeyboard() {
    document.addEventListener("keydown", (event) => {
      if (isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (hasTextSelection()) return;
      if (event.key === "ArrowRight" && event.shiftKey) { event.preventDefault(); goSection(1); return; }
      if (event.key === "ArrowLeft" && event.shiftKey) { event.preventDefault(); goSection(-1); return; }
      if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); go(1); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); return; }
      if (event.key === "Home") { event.preventDefault(); goTo(slides[0].id); return; }
      if (event.key === "End") { event.preventDefault(); goTo(slides[slides.length - 1].id); return; }
      const key = event.key.toLowerCase();
      if (key === "f") { event.preventDefault(); handleAction("fullscreen"); return; }
      if (key === "b") { event.preventDefault(); handleAction("blackout"); return; }
      if (key === "r") { event.preventDefault(); handleAction("show-text"); return; }
      if (key === "i") { event.preventDefault(); handleAction("show-image"); return; }
      if (key === "o") { event.preventDefault(); handleAction("open-display"); return; }
      if (key === "c") { event.preventDefault(); handleAction("copy-text"); return; }
      if (key === "p") { event.preventDefault(); goToLatestPinned(); return; }
      if (key === "m") { event.preventDefault(); handleAction("toggle-complete"); return; }
      if (event.key === "?") { event.preventDefault(); showShortcuts(); return; }
      const cheat = { "1": "CHEAT-GM", "2": "CHEAT-CONDITIONS", "3": "CHEAT-PC", "4": "CHEAT-LOOT", "5": "CHEAT-PRONUNCIATION", "6": "SABLEWOOD-GUIDE" }[event.key];
      if (cheat) { event.preventDefault(); goTo(cheat); return; }
      const pinnedIndex = PINNED_SHORTCUT_KEYS.indexOf(event.key);
      if (pinnedIndex >= 0) { event.preventDefault(); goToPinnedIndex(pinnedIndex); }
    });
  }

  async function init() {
    slides = (await loadSlides()).sort((a, b) => a.order - b.order);
    await loadNpcData();
    await loadFactionData();
    await loadLocationData();
    await loadItemData();
    await loadClueData();
    normalizeState();
    const params = new URLSearchParams(location.search);
    const hash = location.hash.replace(/^#slide=?/, "").replace(/^#scene=?/, "");
    const requested = params.get("slide") || params.get("scene") || hash;
    if (requested && slides.some((slide) => slide.id === requested)) state.currentSlideId = requested;
    const select = document.querySelector("#run-slide-select");
    select.innerHTML = slides.map((slide) => `<option value="${escapeAttr(slide.id)}">${escapeHtml(`${slide.slideNumber}. ${slide.id} - ${slide.title}`)}</option>`).join("");
    setupRunReferenceLinkSafety();
    bindStaticControls();
    bindKeyboard();
    setupRunQuickRef();
    setupEntityHoverCards();
    setupScrubberCue();
    window.addEventListener("goldspire-run-slide-rendered", renderSpotlightChannel);
    window.addEventListener("goldspire-run-beat-changed", renderSpotlightChannel);
    window.addEventListener("goldspire-run-slide-rendered", renderFactionChannel);
    window.addEventListener("goldspire-run-beat-changed", renderFactionChannel);
    window.addEventListener("goldspire-run-slide-rendered", renderLocationChannel);
    window.addEventListener("goldspire-run-beat-changed", renderLocationChannel);
    window.addEventListener("goldspire-run-slide-rendered", renderItemChannel);
    window.addEventListener("goldspire-run-beat-changed", renderItemChannel);
    window.addEventListener("goldspire-run-slide-rendered", renderClueChannel);
    window.addEventListener("goldspire-run-beat-changed", renderClueChannel);
    window.addEventListener("storage", (event) => {
      if (event.key === SPOTLIGHT_STATE_KEY) renderSpotlightChannel();
      if (event.key === SPOTLIGHT_PANEL_KEY) renderSpotlightChannel();
      if (event.key === FACTION_ANSWER_KEY) renderFactionChannel();
    });
    window.setInterval(renderSpotlightChannel, 4000);
    window.setInterval(renderFactionChannel, 6000);
    window.setInterval(renderLocationChannel, 6500);
    window.setInterval(renderItemChannel, 7000);
    window.setInterval(renderClueChannel, 7200);
    render();
  }

  init();
})();
