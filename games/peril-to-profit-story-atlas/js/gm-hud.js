
(function () {
  const HUD_KEY = "goldspire-gm-hud-state-v1";
  const LOG_KEY = "goldspire-session-event-log-v1";
  const PC_KEY = "goldspire-atlas-pc-profiles-v1";
  const PROGRESS_KEY = "goldspire-atlas-progress-v1";
  const FEAR_MAX = 12;
  const spendOptions = (window.GOLDSPIRE_SESSION_COUNTERS_SCHEMA?.fearSpendOptions || []);
  const nowIso = () => new Date().toISOString();

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; }
  }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function activePcCount() {
    const profiles = readJson(PC_KEY, {});
    const rows = Object.values(profiles);
    const assigned = rows.filter((profile) => profile.status === "assigned" || profile.player_name).length;
    return assigned || 5;
  }
  function defaultState() {
    return {
      fear: 0,
      fearMax: FEAR_MAX,
      undoStack: [],
      sessionStartedAt: Date.now(),
      sceneStartedAt: Date.now(),
      currentSceneId: "",
      currentAct: "",
      activeCountdowns: [],
      partyHope: 0,
    };
  }
  let state = { ...defaultState(), ...readJson(HUD_KEY, {}) };
  function save() {
    state.fear = Math.max(0, Math.min(FEAR_MAX, Number(state.fear || 0)));
    writeJson(HUD_KEY, state);
    window.dispatchEvent(new CustomEvent("goldspire-hud-updated", { detail: { state } }));
  }
  function logEvent(type, payload = {}) {
    const log = readJson(LOG_KEY, []);
    log.push({ id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`, time: nowIso(), type, sceneId: state.currentSceneId, ...payload });
    writeJson(LOG_KEY, log.slice(-250));
  }
  function setFear(next, source = "manual") {
    state.undoStack = [...(state.undoStack || []), { fear: state.fear, source, time: Date.now() }].slice(-20);
    state.fear = Math.max(0, Math.min(FEAR_MAX, Number(next || 0)));
    save();
    logEvent("fear-change", { amount: state.fear, source });
  }
  function formatElapsed(start) {
    if (!start) return "00:00";
    const seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  function progressCompleteCount() {
    const progress = readJson(PROGRESS_KEY, {});
    return Object.values(progress.scenes || {}).filter(Boolean).length;
  }
  function render() {
    const root = document.querySelector("[data-gm-hud]");
    if (!root) return;
    root.className = "gm-dock";
    root.innerHTML = `
      <button class="gm-dock-icon" type="button" data-hud-action="fear-minus" aria-label="Remove 1 Fear" title="Remove 1 Fear"><img src="assets/icons/live-fear-minus.png" alt="" aria-hidden="true"><span class="sr-only">Remove 1 Fear</span></button>
      <button class="gm-fear-count" type="button" data-hud-action="open-fear" aria-label="Open Fear menu" title="Open Fear menu"><span>Fear</span><output data-hud-fear>${state.fear}</output><span>/12</span></button>
      <button class="gm-dock-icon" type="button" data-hud-action="fear-plus" aria-label="Gain 1 Fear" title="Gain 1 Fear"><img src="assets/icons/live-fear-plus.png" alt="" aria-hidden="true"><span class="sr-only">Gain 1 Fear</span></button>`;
    renderDrawer();
  }
  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function openFearDrawer() {
    const drawer = document.querySelector("[data-fear-drawer]");
    if (!drawer) return;
    drawer.hidden = false;
    renderDrawer();
  }
  function renderDrawer() {
    const drawer = document.querySelector("[data-fear-drawer]");
    if (!drawer || drawer.hidden) return;
    drawer.innerHTML = `
      <header class="console-header"><div><p class="drawer-kicker">GM table tools</p><h2>Fear and timers</h2><p class="drawer-muted">Use this to save table state between slides without letting it dominate the screen.</p></div><button type="button" class="live-icon-button" data-hud-action="close-fear" aria-label="Close Fear menu" title="Close Fear menu"><img src="assets/icons/action-collapse.png" alt="" aria-hidden="true"><span class="sr-only">Close Fear menu</span></button></header>
      <div class="drawer-action-row">
        <button type="button" data-hud-action="starting-fear"><strong>Set starting Fear</strong><br><span>Use assigned PC count. Current fallback is ${activePcCount()} PCs.</span></button>
        <button type="button" data-hud-action="undo"><strong>Undo last Fear change</strong><br><span>${(state.undoStack || []).length ? "Restore the previous Fear value." : "No Fear change to undo yet."}</span></button>
        <button type="button" data-hud-action="reset"><strong>Reset Fear and timers</strong><br><span>Confirmation required.</span></button>
      </div>
      <div class="map-info-grid" aria-label="Session counters">
        <article class="map-info-card"><h3>Current slide</h3><p>${escapeHtml(state.currentSceneId || "No slide selected")}</p></article>
        <article class="map-info-card"><h3>Current act</h3><p>${escapeHtml(state.currentAct || "No act selected")}</p></article>
        <article class="map-info-card"><h3>Session timer</h3><p>${formatElapsed(state.sessionStartedAt)}</p></article>
        <article class="map-info-card"><h3>Scene timer</h3><p>${formatElapsed(state.sceneStartedAt)}</p></article>
        <article class="map-info-card"><h3>Scenes complete</h3><p>${progressCompleteCount()}</p></article>
      </div>
      <h3>Official Fear spend menu</h3>
      <div class="fear-spend-grid">${spendOptions.map((option) => `
        <article class="fear-spend-option">
          <button type="button" data-fear-spend="${escapeHtml(option.id)}"><strong>${escapeHtml(option.label)}</strong><br><span>${escapeHtml(option.rules_text)}</span></button>
        </article>`).join("")}</div>
      <label class="state-mini-field"><span>Set Fear manually</span><input type="number" min="0" max="12" value="${state.fear}" data-hud-set-fear></label>`;
    drawer.querySelector("[data-hud-set-fear]")?.addEventListener("change", (event) => setFear(event.target.value, "manual-set"));
  }
  function handle(action) {
    if (action === "fear-plus") setFear(state.fear + 1, "plus-one");
    if (action === "fear-minus") setFear(state.fear - 1, "minus-one");
    if (action === "open-fear") openFearDrawer();
    if (action === "close-fear") document.querySelector("[data-fear-drawer]")?.setAttribute("hidden", "");
    if (action === "starting-fear") setFear(activePcCount(), "starting-fear");
    if (action === "undo") {
      const prev = (state.undoStack || []).pop();
      if (prev) { state.fear = prev.fear; save(); logEvent("fear-undo", { source: prev.source }); }
    }
    if (action === "reset") {
      if (!window.confirm("Reset Fear and session/scene timers? This does not clear scene progress.")) return;
      state = { ...defaultState(), sessionStartedAt: Date.now(), sceneStartedAt: Date.now() };
      save();
      logEvent("hud-reset", {});
    }
    render();
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hud-action]");
    if (button) handle(button.dataset.hudAction);
    const spend = event.target.closest("[data-fear-spend]");
    if (spend) {
      setFear(state.fear - 1, `spend:${spend.dataset.fearSpend}`);
      logEvent("fear-spend", { source: spend.dataset.fearSpend, amount: -1 });
      document.querySelector("[data-fear-drawer]")?.setAttribute("hidden", "");
      render();
    }
  });
  window.addEventListener("goldspire-run-slide-rendered", (event) => {
    const slide = event.detail?.slide || {};
    if (state.currentSceneId !== slide.id && slide.type !== "map") {
      state.sceneStartedAt = Date.now();
    }
    state.currentSceneId = slide.id || state.currentSceneId;
    state.currentAct = slide.sectionTitle || state.currentAct;
    save();
    render();
  });
  setInterval(render, 1000);
  save();
  render();
  window.GoldspireHud = { read: () => ({ ...state }), setFear, logEvent };
})();
