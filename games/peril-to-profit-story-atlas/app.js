
const atlasEntities = Object.values(window.ATLAS_ENTITIES || {});
const entitiesById = new Map(atlasEntities.map((entity) => [entity.id, entity]));
const atlasScenes = Object.values(window.ATLAS_SCENES || {});
const atlasUX = window.ATLAS_UX || {};
const stateKey = "goldspire-atlas-gm-state-v2";
const progressKey = "goldspire-atlas-progress-v2";
const pcProfilesKey = "goldspire-atlas-pc-profiles-v1";
const themeKey = "goldspire-theme-v1";
const playerChannelName = "goldspire-player-display-v1";
const playerChannel = "BroadcastChannel" in window ? new BroadcastChannel(playerChannelName) : null;

function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:|file:|data:|blob:)/.test(path)) return path;
  if (path.startsWith("../") || path.startsWith("./") || path.startsWith("/")) return path;
  let prefix = "";
  const parts = window.location.pathname.split("/pages/");
  if (parts.length > 1) {
    const depth = parts[1].split("/").filter(Boolean).length - 1;
    prefix = "../".repeat(Math.max(1, depth + 1));
  }
  return `${prefix}${path}`;
}

function openImageWindow(path, caption = "") {
  const url = new URL(assetUrl(path), window.location.href).href;
  const win = window.open("", "_blank", "popup=yes,width=1400,height=950");
  if (!win) {
    window.open(url, "_blank", "noopener");
    return;
  }
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(caption || "Atlas Image")}</title><style>html,body{margin:0;height:100%;background:#050607;color:#f6f0e6;font-family:system-ui,sans-serif}main{min-height:100%;display:grid;grid-template-rows:1fr auto}img{width:100%;height:100%;object-fit:contain}p{margin:0;padding:.75rem 1rem;background:#11161a}</style></head><body><main><img src="${url}" alt=""><p>${escapeHtml(caption)}</p></main></body></html>`);
  win.document.close();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

function bindOnce(element, key, eventName, handler) {
  if (!element || element.dataset[key] === "true") return;
  element.dataset[key] = "true";
  element.addEventListener(eventName, handler);
}

function setTheme(theme) {
  const selected = theme || localStorage.getItem(themeKey) || "light";
  document.documentElement.dataset.theme = selected;
  localStorage.setItem(themeKey, selected);
  document.querySelectorAll("[data-theme-select]").forEach((select) => {
    select.value = selected;
  });
}

function setupTheme() {
  setTheme(localStorage.getItem(themeKey) || "light");
  document.querySelectorAll("[data-theme-select]").forEach((select) => {
    select.addEventListener("change", () => setTheme(select.value));
  });
  document.querySelectorAll("[data-low-ink-toggle]").forEach((toggle) => {
    document.documentElement.dataset.lowInk = toggle.checked ? "true" : "false";
    toggle.addEventListener("change", () => {
      document.documentElement.dataset.lowInk = toggle.checked ? "true" : "false";
    });
  });
  document.querySelectorAll("[data-print-safe-toggle]").forEach((toggle) => {
    document.documentElement.dataset.printSafe = toggle.checked ? "true" : "false";
    toggle.addEventListener("change", () => {
      document.documentElement.dataset.printSafe = toggle.checked ? "true" : "false";
    });
  });
}

function scenePageUrl(scene) {
  if (!scene) return "index.html";
  const path = `pages/scenes/${scene.slug}.html`;
  return window.location.pathname.includes("/pages/") ? `../${path}` : path;
}

function entityPageUrl(entity) {
  if (!entity) return "pages/entity-index.html";
  const path = `pages/entities/${entity.id}.html`;
  return window.location.pathname.includes("/pages/") ? `../${path}` : path;
}

function playerDisplayUrl(id = "") {
  const base = window.location.pathname.includes("/pages/") ? "../player-display.html" : "player-display.html";
  return id ? `${base}?scene=${encodeURIComponent(id)}` : base;
}

function sendPlayerDisplay(payload) {
  const message = { ...payload, sent_at: Date.now() };
  localStorage.setItem("goldspire-player-display-message", JSON.stringify(message));
  if (message.scene_id) localStorage.setItem("goldspire-player-scene", message.scene_id);
  playerChannel?.postMessage(message);
}

function currentState() {
  return { ...defaultState(), ...readJson(stateKey, {}) };
}

function currentProgress() {
  return readJson(progressKey, { scenes: {}, acts: {}, collapsed: {}, pinned: {}, autoCollapse: false, currentSceneId: "S00-01" });
}

function setupFilters() {
  const buttons = document.querySelectorAll("[data-filter]");
  const search = document.querySelector("#atlas-search");
  const cards = [...document.querySelectorAll(".scene-card")];
  let active = "all";
  const apply = () => {
    const query = (search?.value || "").trim().toLowerCase();
    cards.forEach((card) => {
      const tags = card.dataset.tags || "";
      const text = card.innerText.toLowerCase();
      const filterMatch = active === "all" || tags.includes(active);
      const queryMatch = !query || text.includes(query);
      card.classList.toggle("is-hidden", !(filterMatch && queryMatch));
    });
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      active = button.dataset.filter;
      buttons.forEach((b) => b.classList.toggle("is-active", b === button));
      apply();
    });
  });
  search?.addEventListener("input", apply);
}

function setupLightbox() {
  const dialog = document.querySelector("#lightbox");
  if (!dialog) return;
  const img = dialog.querySelector("img");
  const caption = dialog.querySelector(".dialog-caption");
  const prompt = dialog.querySelector(".dialog-prompt");
  const close = dialog.querySelector(".dialog-close");
  const raw = dialog.querySelector(".lightbox-raw-link");
  const windowButton = dialog.querySelector("[data-lightbox-window]");
  let currentImage = "";
  let currentCaption = "";
  document.querySelectorAll(".image-open").forEach((button) => {
    button.addEventListener("click", () => {
      const sceneId = button.dataset.sceneId || button.closest("[data-scene]")?.dataset.scene;
      const scene = atlasScenes.find((item) => item.id === sceneId);
      currentImage = button.dataset.image || "";
      currentCaption = button.dataset.caption || "";
      img.src = assetUrl(currentImage);
      img.alt = button.closest("figure")?.querySelector("img")?.alt || "";
      caption.textContent = currentCaption;
      if (raw) raw.href = assetUrl(currentImage);
      prompt.textContent = document.body.classList.contains("show-dev-prompts") ? (scene?.image_prompt_used || "") : "";
      dialog.showModal();
      close.focus();
    });
  });
  windowButton?.addEventListener("click", () => openImageWindow(currentImage, currentCaption));
  document.querySelectorAll("[data-image-window]").forEach((button) => {
    button.addEventListener("click", () => openImageWindow(button.dataset.imageWindow, button.dataset.caption || ""));
  });
  close?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function setupHoverCards() {
  const card = document.querySelector("#hover-card");
  if (!card) return;
  let hideTimer;
  const show = (target) => {
    const entity = entitiesById.get(target.dataset.entity);
    if (!entity) return;
    clearTimeout(hideTimer);
    const tags = (entity.tags || []).map((tag) => `<span class="track-pill">${escapeHtml(tag)}</span>`).join(" ");
    const scenes = escapeHtml((entity.appears_in || []).join(", ") || "Referenced lore");
    card.innerHTML = `
      <img src="${assetUrl(entity.image)}" alt="">
      <div class="private-note"><img class="type-icon" src="${assetUrl(entity.meta.icon_asset)}" alt="" aria-hidden="true"> ${escapeHtml(entity.meta.label)}</div>
      <strong>${escapeHtml(entity.name)}</strong>
      <p class="pronunciation-line"><strong>Pronunciation:</strong> ${escapeHtml(entity.short_pronunciation || entity.pronunciation || "")}</p>
      <p>${escapeHtml(entity.summary || "")}</p>
      <p class="muted">${escapeHtml(entity.role || "")}</p>
      <div class="track-row">${tags}</div>
      <p class="muted">Appears in: ${scenes}</p>
      ${entity.stat_summary ? `<p><strong>Stat:</strong> ${escapeHtml(entity.stat_summary)}</p>` : ""}
    `;
    const rect = target.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 370, Math.max(16, rect.left));
    const top = Math.min(window.innerHeight - 340, rect.bottom + 10);
    card.style.left = `${left}px`;
    card.style.top = `${Math.max(16, top)}px`;
    card.classList.add("is-visible");
    card.setAttribute("aria-hidden", "false");
  };
  const hide = () => {
    hideTimer = setTimeout(() => {
      card.classList.remove("is-visible");
      card.setAttribute("aria-hidden", "true");
    }, 80);
  };
  document.querySelectorAll("[data-entity]").forEach((target) => {
    target.addEventListener("pointerenter", () => show(target));
    target.addEventListener("focus", () => show(target));
    target.addEventListener("pointerleave", hide);
    target.addEventListener("blur", hide);
  });
}

function setupDevToggles() {
  const classMap = {
    prompts: "show-dev-prompts",
    assets: "show-dev-assets",
    qa: "show-dev-qa",
  };
  document.querySelectorAll("[data-dev-toggle]").forEach((toggle) => {
    const key = toggle.dataset.devToggle;
    const cls = classMap[key];
    const stored = localStorage.getItem(`goldspire-dev-${key}`) === "true";
    toggle.checked = stored;
    if (cls) document.body.classList.toggle(cls, stored);
    toggle.addEventListener("change", () => {
      localStorage.setItem(`goldspire-dev-${key}`, toggle.checked ? "true" : "false");
      if (cls) document.body.classList.toggle(cls, toggle.checked);
    });
  });
}

function setupRulesDrawer() {
  const drawer = document.querySelector("#rules-drawer");
  if (!drawer) return;
  const open = (targetId = "") => {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    const target = targetId ? drawer.querySelector(`#rule-${CSS.escape(targetId)}`) : null;
    if (target) target.scrollIntoView({ block: "start" });
    else drawer.querySelector("input")?.focus();
  };
  const close = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  };
  document.querySelectorAll("[data-rules-open]").forEach((button) => button.addEventListener("click", () => open(button.dataset.rulesTarget || "")));
  document.querySelectorAll("[data-rules-close]").forEach((button) => button.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  const search = drawer.querySelector("#rules-search");
  const sections = [...drawer.querySelectorAll("[data-rules-text]")];
  search?.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    sections.forEach((section) => {
      section.classList.toggle("is-hidden", !!query && !section.innerText.toLowerCase().includes(query));
    });
  });
  document.querySelectorAll("[data-dice-mode-set]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = { ...defaultState(), ...readJson(stateKey, {}) };
      state.dice_mode = button.dataset.diceModeSet;
      writeJson(stateKey, state);
      applyDiceMode(state.dice_mode);
      document.querySelectorAll('[data-state-field="dice_mode"]').forEach((field) => {
        if (field.tagName === "SELECT") field.value = state.dice_mode;
      });
    });
  });
}

function applyDiceMode(mode) {
  const selected = mode || "duality_2d12";
  document.documentElement.dataset.diceMode = selected;
  document.body?.classList.toggle("dice-mode-jenga", selected === "p2p_jenga_fear");
}

function applySessionZeroMode(mode) {
  const selected = mode || "quick_pregen";
  document.querySelectorAll("[data-session-zero-card]").forEach((card) => {
    const modes = (card.dataset.sessionZeroModes || "").split(/\s+/);
    card.dataset.modeHidden = modes.length && !modes.includes(selected) ? "true" : "false";
  });
  document.querySelectorAll("[data-run-mode-card]").forEach((card) => {
    card.dataset.modeHidden = card.dataset.runModeCard === selected ? "false" : "true";
  });
  document.querySelectorAll("[data-session-zero-mode-select]").forEach((select) => {
    select.value = selected;
  });
}

function defaultState() {
  return {
    strixwolf_outcome: "unresolved",
    strixwolf_trust: 0,
    strixwolf_blood_debt: false,
    bramble_outcome: "unresolved",
    bramble_truth_learned: false,
    hush_trust: "medium",
    custodian_trust: "medium",
    ward_stability: "unresolved",
    report_choice: "unresolved",
    dice_mode: "duality_2d12",
    session_zero_mode: "quick_pregen",
    character_mode: "pregen",
    marlowe_status: "pc",
    asset_custodian_confirmed: false,
    connections_complete: false,
    player_display_ready: false,
    prologue_ready: false,
  };
}

function conditionMatches(condition, state) {
  if (!condition || !condition.includes("=")) return false;
  const [key, rawValues] = condition.split("=");
  const allowed = rawValues.split("|");
  return allowed.includes(String(state[key]));
}

function applyConditionalNotes(state) {
  document.querySelectorAll(".conditional-note").forEach((note) => {
    note.classList.toggle("is-active", conditionMatches(note.dataset.when, state));
  });
}

function activeFlagCount(state = currentState()) {
  return Object.entries(state).filter(([key, value]) => {
    if (key === "dice_mode" || key === "session_zero_mode" || key === "character_mode") return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    return value && value !== "unresolved" && value !== "medium" && value !== "pc";
  }).length;
}

function updateDashboardSummary() {
  const progress = currentProgress();
  const scenesDone = Object.values(progress.scenes || {}).filter(Boolean).length;
  const state = currentState();
  const current = progress.currentSceneId || state.current_scene_id || localStorage.getItem("goldspire-player-scene") || "S00-01";
  document.querySelectorAll("[data-scenes-complete-count]").forEach((node) => node.textContent = scenesDone);
  document.querySelectorAll("[data-active-flags-count]").forEach((node) => node.textContent = activeFlagCount(state));
  document.querySelectorAll("[data-current-scene-label]").forEach((node) => node.textContent = current);
  document.querySelectorAll("[data-current-scene-select]").forEach((select) => {
    select.value = current;
  });
  const profiles = readJson(pcProfilesKey, {});
  const assigned = Object.values(profiles).filter((profile) => profile.status === "assigned" || profile.player_name).length;
  document.querySelectorAll("[data-pc-assigned-count]").forEach((node) => node.textContent = assigned);
  document.querySelectorAll("[data-act-meter]").forEach((meter) => {
    const actSlug = meter.dataset.actMeter;
    const actScenes = atlasScenes.filter((scene) => slug(scene.act) === actSlug);
    const complete = actScenes.filter((scene) => progress.scenes?.[scene.id]).length;
    meter.style.width = `${actScenes.length ? Math.round((complete / actScenes.length) * 100) : 0}%`;
  });
}

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function markdownStateReport(state, progress) {
  const lines = ["# Goldspire Session State", "", `Exported: ${new Date().toLocaleString()}`, "", "## Choice State"];
  Object.entries(state).forEach(([key, value]) => lines.push(`- **${key}:** ${value}`));
  lines.push("", "## Scene Progress");
  atlasScenes.forEach((scene) => lines.push(`- [${progress.scenes?.[scene.id] ? "x" : " "}] ${scene.id} - ${scene.title}`));
  const logs = readJson("goldspire-choice-log-v1", {});
  lines.push("", "## Decision Log");
  Object.entries(logs).forEach(([id, value]) => {
    if (String(value || "").trim()) lines.push(`- **${id}:** ${value}`);
  });
  return lines.join("\n");
}

function setupStateConsole() {
  const fields = [...document.querySelectorAll("[data-state-field]")];
  if (!fields.length) {
    const stored = { ...defaultState(), ...readJson(stateKey, {}) };
    applyConditionalNotes(stored);
    applyDiceMode(stored.dice_mode);
    applySessionZeroMode(stored.session_zero_mode);
    return;
  }
  let state = { ...defaultState(), ...readJson(stateKey, {}) };
  const fieldValue = (field) => {
    if (field.type === "checkbox") return field.checked;
    if (field.type === "number") return Number(field.value || 0);
    return field.value;
  };
  const syncControls = () => {
    fields.forEach((field) => {
      const key = field.dataset.stateField;
      if (field.type === "checkbox") field.checked = !!state[key];
      else field.value = state[key] ?? "";
    });
    applyConditionalNotes(state);
    applyDiceMode(state.dice_mode);
    applySessionZeroMode(state.session_zero_mode);
  };
  const persist = (changedField) => {
    if (changedField) {
      state[changedField.dataset.stateField] = fieldValue(changedField);
    }
    writeJson(stateKey, state);
    applyConditionalNotes(state);
    syncControls();
    updateDashboardSummary();
  };
  fields.forEach((field) => {
    if (field.dataset.stateBound === "true") return;
    field.dataset.stateBound = "true";
    field.addEventListener("input", () => persist(field));
    field.addEventListener("change", () => persist(field));
  });
  document.querySelectorAll("[data-state-export-open]").forEach((button) => {
    bindOnce(button, "stateExportOpenBound", "click", () => {
      document.querySelector("#export-state-panel")?.setAttribute("open", "");
      document.querySelector("#export-state-panel")?.scrollIntoView({ block: "center" });
    });
  });
  document.querySelectorAll("[data-state-import-open]").forEach((button) => {
    bindOnce(button, "stateImportOpenBound", "click", () => {
      document.querySelector("#import-state-panel")?.setAttribute("open", "");
      document.querySelector("#import-state-panel")?.scrollIntoView({ block: "center" });
    });
  });
  document.querySelectorAll("[data-state-reset-open]").forEach((button) => {
    bindOnce(button, "stateResetOpenBound", "click", () => {
      document.querySelector("#reset-state-panel")?.setAttribute("open", "");
      document.querySelector("#reset-state-panel")?.scrollIntoView({ block: "center" });
    });
  });
  const exportBox = document.querySelector("#state-export-json");
  const reportBox = document.querySelector("#state-report-markdown");
  const importBox = document.querySelector("#state-import-json");
  const validation = document.querySelector("#state-validation-message");
  const refreshExport = () => {
    if (exportBox) exportBox.value = JSON.stringify(state, null, 2);
    if (reportBox) reportBox.value = markdownStateReport(state, currentProgress());
  };
  bindOnce(document.querySelector("[data-state-export]"), "stateExportBound", "click", () => {
    refreshExport();
  });
  bindOnce(document.querySelector("[data-state-copy]"), "stateCopyBound", "click", async () => {
    refreshExport();
    if (exportBox?.value) await navigator.clipboard?.writeText(exportBox.value);
  });
  bindOnce(document.querySelector("[data-state-download]"), "stateDownloadBound", "click", () => {
    refreshExport();
    const blob = new Blob([exportBox?.value || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goldspire-state-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  bindOnce(document.querySelector("[data-state-report]"), "stateReportBound", "click", () => {
    refreshExport();
  });
  bindOnce(document.querySelector("#state-import-file"), "stateFileBound", "change", async (event) => {
    const file = event.target.files?.[0];
    if (!file || !importBox) return;
    importBox.value = await file.text();
  });
  const validateImport = () => {
    try {
      const parsed = JSON.parse(importBox?.value || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("State must be a JSON object.");
      if (validation) {
        validation.textContent = "Valid state JSON. Ready to apply.";
        validation.dataset.valid = "true";
      }
      return parsed;
    } catch (error) {
      if (validation) {
        validation.textContent = `Import failed: ${error.message}`;
        validation.dataset.valid = "false";
      }
      return null;
    }
  };
  bindOnce(document.querySelector("[data-state-validate]"), "stateValidateBound", "click", validateImport);
  bindOnce(document.querySelector("[data-state-import]"), "stateImportBound", "click", () => {
    const parsed = validateImport();
    if (!parsed) return;
    state = { ...defaultState(), ...parsed };
    writeJson(stateKey, state);
    syncControls();
    updateDashboardSummary();
  });
  document.querySelectorAll("[data-state-reset]").forEach((button) => {
    bindOnce(button, "stateResetBound", "click", () => {
      const mode = button.dataset.stateReset || "state";
      if (!confirm(`Reset ${mode}? This cannot be undone in this browser.`)) return;
      if (mode === "progress" || mode === "all") localStorage.removeItem(progressKey);
      if (mode === "pcs" || mode === "all") localStorage.removeItem(pcProfilesKey);
      if (mode === "state" || mode === "all") {
        state = defaultState();
        writeJson(stateKey, state);
      }
      syncControls();
      setupPcProfiles(true);
      updateDashboardSummary();
      window.dispatchEvent(new Event("goldspire-progress-updated"));
    });
  });
  document.querySelectorAll("[data-current-scene-select]").forEach((select) => {
    bindOnce(select, "currentSceneBound", "change", () => {
      const progress = currentProgress();
      progress.currentSceneId = select.value;
      writeJson(progressKey, progress);
      localStorage.setItem("goldspire-player-scene", select.value);
      updateDashboardSummary();
    });
  });
  document.querySelectorAll("[data-choice-log-field]").forEach((input) => {
    const logs = readJson("goldspire-choice-log-v1", {});
    input.value = logs[input.dataset.choiceLogField] || "";
    bindOnce(input, "choiceLogBound", "input", () => {
      const next = readJson("goldspire-choice-log-v1", {});
      next[input.dataset.choiceLogField] = input.value;
      writeJson("goldspire-choice-log-v1", next);
    });
  });
  syncControls();
  updateDashboardSummary();
}

function setupSceneProgress() {
  const progress = currentProgress();
  const auto = document.querySelector("[data-auto-collapse]");
  if (auto) {
    auto.checked = !!progress.autoCollapse;
    auto.addEventListener("change", () => {
      progress.autoCollapse = auto.checked;
      writeJson(progressKey, progress);
      updateDashboardSummary();
    });
  }
  const applyScene = (id) => {
    document.querySelectorAll(`[data-scene="${CSS.escape(id)}"]`).forEach((card) => {
      card.classList.toggle("is-complete", !!progress.scenes[id]);
      card.classList.toggle("is-collapsed", !!progress.collapsed[id] || (!!progress.autoCollapse && !!progress.scenes[id]));
      card.classList.toggle("is-pinned", !!progress.pinned[id]);
    });
    document.querySelectorAll(`[data-scene-complete="${CSS.escape(id)}"]`).forEach((input) => {
      input.checked = !!progress.scenes[id];
    });
    document.querySelectorAll(`[data-dashboard-scene-row="${CSS.escape(id)}"]`).forEach((row) => {
      row.classList.toggle("is-complete", !!progress.scenes[id]);
    });
  };
  document.querySelectorAll("[data-scene-complete]").forEach((input) => {
    const id = input.dataset.sceneComplete;
    input.checked = !!progress.scenes[id];
    applyScene(id);
    input.addEventListener("change", () => {
      progress.scenes[id] = input.checked;
      writeJson(progressKey, progress);
      applyScene(id);
      updateDashboardSummary();
    });
  });
  document.querySelectorAll("[data-scene-toggle]").forEach((button) => {
    const id = button.dataset.sceneToggle;
    button.addEventListener("click", () => {
      progress.collapsed[id] = !progress.collapsed[id];
      writeJson(progressKey, progress);
      applyScene(id);
      updateDashboardSummary();
    });
  });
  document.querySelectorAll("[data-scene-pin]").forEach((button) => {
    const id = button.dataset.scenePin;
    button.addEventListener("click", () => {
      progress.pinned[id] = !progress.pinned[id];
      writeJson(progressKey, progress);
      applyScene(id);
      updateDashboardSummary();
    });
  });
  document.querySelectorAll("[data-act-complete]").forEach((input) => {
    const id = input.dataset.actComplete;
    const section = document.querySelector(`#${CSS.escape(id)}`);
    input.checked = !!progress.acts[id];
    section?.classList.toggle("is-complete", input.checked);
    input.addEventListener("change", () => {
      progress.acts[id] = input.checked;
      section?.classList.toggle("is-complete", input.checked);
      writeJson(progressKey, progress);
      updateDashboardSummary();
    });
  });
  document.querySelectorAll("[data-act-toggle]").forEach((button) => {
    const id = button.dataset.actToggle;
    const section = document.querySelector(`#${CSS.escape(id)}`);
    if (progress.acts[`collapsed-${id}`]) section?.classList.add("is-collapsed");
    button.addEventListener("click", () => {
      section?.classList.toggle("is-collapsed");
      progress.acts[`collapsed-${id}`] = section?.classList.contains("is-collapsed");
      writeJson(progressKey, progress);
      updateDashboardSummary();
    });
  });
  updateDashboardSummary();
  window.addEventListener("goldspire-progress-updated", () => {
    const next = currentProgress();
    Object.assign(progress, next);
    Object.keys(progress.scenes || {}).forEach(applyScene);
    updateDashboardSummary();
  });
}

function setupShowPlayerButtons() {
  document.querySelectorAll("[data-show-player-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.showPlayerScene;
      const scene = atlasScenes.find((item) => item.id === id);
      sendPlayerDisplay({ type: "scene", scene_id: id, mode: "title" });
      window.open(playerDisplayUrl(id), "_blank");
    });
  });
  document.querySelectorAll("[data-show-player-session]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.showPlayerSession;
      sendPlayerDisplay({ type: "scene", scene_id: id, mode: "title" });
      window.open(playerDisplayUrl(id), "_blank");
    });
  });
}

function setupSessionZeroTools() {
  const notesKey = "goldspire-session-zero-notes-v1";
  const connectionsKey = "goldspire-session-zero-connections-v1";
  const noteFields = [...document.querySelectorAll("[data-sz-field]")];
  let notes = readJson(notesKey, {});
  const syncNotes = () => {
    noteFields.forEach((field) => {
      field.value = notes[field.dataset.szField] || "";
    });
  };
  noteFields.forEach((field) => {
    field.addEventListener("input", () => {
      notes[field.dataset.szField] = field.value;
      writeJson(notesKey, notes);
    });
  });
  syncNotes();

  const renderConnections = () => {
    const records = readJson(connectionsKey, []);
    document.querySelectorAll("[data-connection-records]").forEach((target) => {
      target.innerHTML = records.map((record, index) => `
        <article class="connection-record">
          <strong>${escapeHtml(record.asker || "PC A")} -> ${escapeHtml(record.answerer || "PC B")}</strong>
          <p>${escapeHtml(record.prompt || "")}</p>
          <p>${escapeHtml(record.answer || "")}</p>
          <button type="button" data-connection-delete="${index}">Remove</button>
        </article>
      `).join("");
      target.querySelectorAll("[data-connection-delete]").forEach((button) => {
        button.addEventListener("click", () => {
          const next = readJson(connectionsKey, []);
          next.splice(Number(button.dataset.connectionDelete), 1);
          writeJson(connectionsKey, next);
          renderConnections();
        });
      });
    });
  };
  document.querySelectorAll("[data-connection-builder]").forEach((builder) => {
    builder.querySelector("[data-connection-add]")?.addEventListener("click", () => {
      const record = {};
      builder.querySelectorAll("[data-connection-field]").forEach((field) => {
        record[field.dataset.connectionField] = field.value;
      });
      const records = readJson(connectionsKey, []);
      records.push(record);
      writeJson(connectionsKey, records);
      builder.querySelectorAll("[data-connection-field]").forEach((field) => {
        if (field.tagName !== "SELECT") field.value = "";
      });
      renderConnections();
    });
  });
  renderConnections();

  document.querySelector("[data-sz-export]")?.addEventListener("click", () => {
    const records = readJson(connectionsKey, []);
    const box = document.querySelector("#session-zero-export");
    if (!box) return;
    const lines = ["# Goldspire Session Zero Notes", "", "## Notes"];
    Object.entries(readJson(notesKey, {})).forEach(([key, value]) => {
      lines.push(`- **${key.replaceAll("_", " ")}:** ${value || ""}`);
    });
    lines.push("", "## Connections");
    records.forEach((record) => {
      lines.push(`- **${record.asker || "PC A"} -> ${record.answerer || "PC B"}:** ${record.prompt || ""} ${record.answer || ""}`);
    });
    box.value = lines.join("\n");
  });
  document.querySelector("[data-sz-reset]")?.addEventListener("click", () => {
    writeJson(notesKey, {});
    writeJson(connectionsKey, []);
    notes = {};
    syncNotes();
    renderConnections();
    const box = document.querySelector("#session-zero-export");
    if (box) box.value = "";
  });
}

function defaultPcProfiles() {
  const profiles = {};
  (atlasUX.pc_schema?.profiles || []).forEach((profile) => {
    profiles[profile.pc_id] = {
      ...profile,
      spotlight_count: profile.spotlight_count || 0,
      hope_generated: profile.hope_generated || 0,
      fear_generated: profile.fear_generated || 0,
      safety_private_notes: profile.safety_private_notes || "",
    };
  });
  return profiles;
}

function getPcProfiles() {
  return { ...defaultPcProfiles(), ...readJson(pcProfilesKey, {}) };
}

function fieldValueFromCard(field) {
  if (field.type === "number") return Number(field.value || 0);
  return field.value;
}

function syncPcPrintCards(profiles) {
  document.querySelectorAll("[data-pc-print-card]").forEach((card) => {
    const profile = profiles[card.dataset.pcPrintCard] || {};
    card.querySelectorAll("[data-print-current_character_name]").forEach((node) => node.textContent = profile.current_character_name || profile.default_character_name || "");
    card.querySelectorAll("[data-print-player_name]").forEach((node) => node.textContent = profile.player_name || "");
    card.querySelectorAll("[data-print-character_pronunciation]").forEach((node) => node.textContent = profile.character_pronunciation || "");
    card.querySelectorAll("[data-print-character_pronouns]").forEach((node) => node.textContent = profile.character_pronouns || "");
    card.querySelectorAll("[data-print-class]").forEach((node) => node.textContent = profile.class || "");
    card.querySelectorAll("[data-print-ancestry]").forEach((node) => node.textContent = profile.ancestry || "");
    card.querySelectorAll("[data-print-community]").forEach((node) => node.textContent = profile.community || "");
    card.querySelectorAll("[data-print-heritage]").forEach((node) => node.textContent = profile.heritage || "");
    card.querySelectorAll("[data-print-experiences_text]").forEach((node) => node.textContent = profile.experiences_text || (profile.experiences || []).join(", "));
    card.querySelectorAll("[data-print-connection_answers_text]").forEach((node) => node.textContent = profile.connection_answers_text || (profile.connection_answers || []).join("; "));
    card.querySelectorAll("[data-print-table_notes]").forEach((node) => node.textContent = profile.table_notes || "");
  });
}

function setupPcProfiles(forceReset = false) {
  const managers = document.querySelectorAll("[data-pc-profile-manager], .pc-cheat-page");
  const hasPcSurface = managers.length || document.querySelector("[data-pc-print-card]");
  if (!hasPcSurface) return;
  if (forceReset) localStorage.removeItem(pcProfilesKey);
  let profiles = getPcProfiles();
  const saveAll = () => {
    writeJson(pcProfilesKey, profiles);
    syncPcPrintCards(profiles);
    updateDashboardSummary();
  };
  document.querySelectorAll("[data-pc-profile]").forEach((card) => {
    const id = card.dataset.pcProfile;
    const profile = profiles[id] || {};
    card.querySelectorAll("[data-pc-field]").forEach((field) => {
      const key = field.dataset.pcField;
      if (key === "experiences_text") field.value = profile.experiences_text || (profile.experiences || []).join(", ");
      else if (key === "custom_experiences_text") field.value = profile.custom_experiences_text || (profile.custom_experiences || []).join("\n");
      else if (key === "connection_answers_text") field.value = profile.connection_answers_text || (profile.connection_answers || []).join("\n");
      else field.value = profile[key] ?? "";
      field.addEventListener("input", () => {
        profiles[id] = { ...(profiles[id] || {}), [key]: fieldValueFromCard(field) };
        card.querySelector("[data-pc-display-name]") && (card.querySelector("[data-pc-display-name]").textContent = profiles[id].current_character_name || profiles[id].default_character_name || id);
        card.querySelector("[data-pc-display-pronunciation]") && (card.querySelector("[data-pc-display-pronunciation]").textContent = profiles[id].character_pronunciation || "");
        saveAll();
      });
      field.addEventListener("change", () => {
        profiles[id] = { ...(profiles[id] || {}), [key]: fieldValueFromCard(field) };
        saveAll();
      });
    });
  });
  document.querySelectorAll("[data-pc-save]").forEach((button) => {
    button.addEventListener("click", () => saveAll());
  });
  document.querySelectorAll("[data-pc-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.pcReset;
      profiles[id] = defaultPcProfiles()[id] || {};
      saveAll();
      location.reload();
    });
  });
  const box = document.querySelector("#pc-profile-json");
  document.querySelector("[data-pc-export]")?.addEventListener("click", () => {
    if (box) box.value = JSON.stringify(profiles, null, 2);
    document.querySelector("#pc-import-panel")?.setAttribute("open", "");
  });
  document.querySelector("[data-pc-copy]")?.addEventListener("click", async () => {
    if (box) box.value = JSON.stringify(profiles, null, 2);
    if (box?.value) await navigator.clipboard?.writeText(box.value);
  });
  document.querySelector("[data-pc-import-open]")?.addEventListener("click", () => {
    document.querySelector("#pc-import-panel")?.setAttribute("open", "");
    document.querySelector("#pc-import-panel")?.scrollIntoView({ block: "center" });
  });
  document.querySelector("[data-pc-import]")?.addEventListener("click", () => {
    try {
      profiles = { ...defaultPcProfiles(), ...JSON.parse(box?.value || "{}") };
      saveAll();
      location.reload();
    } catch {
      if (box) box.value = "Import failed: paste valid PC profile JSON.";
    }
  });
  document.querySelector("[data-pc-reset-all]")?.addEventListener("click", () => {
    if (!confirm("Reset all PC/player profiles?")) return;
    profiles = defaultPcProfiles();
    saveAll();
    location.reload();
  });
  syncPcPrintCards(profiles);
  updateDashboardSummary();
}

function setupEntityIndex() {
  const cards = [...document.querySelectorAll("[data-entity-card]")];
  if (!cards.length) return;
  const search = document.querySelector("#entity-index-search");
  const typeFilter = document.querySelector("#entity-type-filter");
  const sort = document.querySelector("#entity-sort");
  const apply = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const type = typeFilter?.value || "all";
    cards.forEach((card) => {
      const matchesQuery = !query || card.innerText.toLowerCase().includes(query);
      const matchesType = type === "all" || card.dataset.type === type;
      card.classList.toggle("is-hidden", !(matchesQuery && matchesType));
    });
    const mode = sort?.value || "alpha";
    document.querySelectorAll("[data-category-section]").forEach((section) => {
      const grid = section.querySelector(".entity-index-grid");
      const local = [...grid.querySelectorAll("[data-entity-card]")];
      local.sort((a, b) => {
        if (mode === "first") return (a.dataset.first || "").localeCompare(b.dataset.first || "") || (a.dataset.name || "").localeCompare(b.dataset.name || "");
        if (mode === "tier") return (a.dataset.tier || "").localeCompare(b.dataset.tier || "") || (a.dataset.name || "").localeCompare(b.dataset.name || "");
        if (mode === "type") return (a.dataset.type || "").localeCompare(b.dataset.type || "") || (a.dataset.name || "").localeCompare(b.dataset.name || "");
        return (a.dataset.name || "").localeCompare(b.dataset.name || "");
      });
      local.forEach((card) => grid.appendChild(card));
    });
  };
  search?.addEventListener("input", apply);
  typeFilter?.addEventListener("change", apply);
  sort?.addEventListener("change", apply);
  const hash = window.location.hash.match(/category-([a-z-]+)/)?.[1];
  if (hash && typeFilter) {
    typeFilter.value = hash;
    apply();
  }
}

function setupQuickNavigation() {
  document.querySelectorAll("[data-scene-jump]").forEach((select) => {
    if (!select.options.length) {
      select.innerHTML = `<option value="">Scene jump</option>` + atlasScenes.map((scene) => `<option value="${escapeHtml(scenePageUrl(scene))}">${escapeHtml(scene.id)} · ${escapeHtml(scene.title)}</option>`).join("");
    }
    select.addEventListener("change", () => {
      if (select.value) window.location.href = select.value;
    });
  });
  const dialog = document.querySelector("#command-palette");
  const input = document.querySelector("#command-search");
  const results = document.querySelector("#command-results");
  const commands = [
    { label: "Run Mode", type: "Tool", url: window.location.pathname.includes("/pages/") ? "../run.html" : "run.html" },
    { label: "GM Dashboard", type: "Tool", url: window.location.pathname.includes("/pages/") ? "gm-dashboard.html" : "pages/gm-dashboard.html" },
    { label: "Entity Wiki", type: "Tool", url: window.location.pathname.includes("/pages/") ? "entity-index.html" : "pages/entity-index.html" },
    { label: "Handouts Hub", type: "Tool", url: window.location.pathname.includes("/pages/") ? "handouts.html" : "pages/handouts.html" },
    { label: "PC Cheat Sheet", type: "Tool", url: window.location.pathname.includes("/pages/") ? "pc-cheat-sheet.html" : "pages/pc-cheat-sheet.html" },
    ...atlasScenes.map((scene) => ({ label: `${scene.id} · ${scene.title}`, type: scene.act, url: scenePageUrl(scene) })),
    ...atlasEntities.map((entity) => ({ label: entity.name, type: entity.meta?.label || entity.type, url: entityPageUrl(entity) })),
  ];
  const render = () => {
    if (!results) return;
    const q = (input?.value || "").trim().toLowerCase();
    const rows = commands.filter((item) => !q || `${item.label} ${item.type}`.toLowerCase().includes(q)).slice(0, 40);
    results.innerHTML = rows.map((item) => `<a href="${escapeHtml(item.url)}"><span>${escapeHtml(item.label)}</span><small>${escapeHtml(item.type)}</small></a>`).join("");
  };
  document.querySelectorAll("[data-command-palette-open]").forEach((button) => {
    button.addEventListener("click", () => {
      dialog?.showModal();
      render();
      input?.focus();
    });
  });
  document.querySelectorAll("[data-command-palette-close]").forEach((button) => button.addEventListener("click", () => dialog?.close()));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      dialog?.showModal();
      render();
      input?.focus();
    }
  });
  input?.addEventListener("input", render);
}

function setupCollapsibleWikiSections() {
  document.querySelectorAll("[data-collapsible-sections]").forEach((root) => {
    if (root.dataset.sectionsReady === "true") return;
    root.dataset.sectionsReady = "true";
    const headings = [...root.querySelectorAll("h2")].filter((heading) => !heading.closest("details") && !heading.closest("header"));
    headings.forEach((heading) => {
      const details = document.createElement("details");
      details.className = "wiki-auto-section";
      details.open = !heading.textContent.toLowerCase().includes("gm-only") && !heading.textContent.toLowerCase().includes("image prompt");
      const summary = document.createElement("summary");
      summary.innerHTML = heading.innerHTML;
      details.appendChild(summary);
      heading.replaceWith(details);
      let node = details.nextSibling;
      while (node && !(node.nodeType === 1 && node.matches("h2"))) {
        const next = node.nextSibling;
        details.appendChild(node);
        node = next;
      }
    });
  });
}

function playerPayloadFromContainer(container) {
  try {
    return JSON.parse(container?.dataset.playerSafePayload || "{}");
  } catch {
    return {};
  }
}

function openPlayerSafeWindow(payload) {
  const win = window.open("", "_blank", "popup=yes,width=900,height=680");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(payload.title || "Player Text")}</title><style>body{margin:0;padding:clamp(2rem,5vw,5rem);font-family:system-ui,sans-serif;line-height:1.65;background:#fffdf8;color:#1e2428}main{max-width:62rem;margin:auto}h1{font-size:clamp(2.2rem,6vw,4rem);line-height:1.05}p{font-size:clamp(1.2rem,3vw,1.8rem)}</style></head><body><main><h1>${escapeHtml(payload.title || "Player Text")}</h1><p>${escapeHtml(payload.text || "")}</p></main></body></html>`);
  win.document.close();
}

function setupPlayerSafeActions() {
  document.querySelectorAll("[data-copy-player-safe]").forEach((button) => {
    button.addEventListener("click", async () => {
      const payload = playerPayloadFromContainer(button.closest("[data-player-safe-payload]"));
      await navigator.clipboard?.writeText(payload.text || "");
    });
  });
  document.querySelectorAll("[data-open-player-safe-window]").forEach((button) => {
    button.addEventListener("click", () => openPlayerSafeWindow(playerPayloadFromContainer(button.closest("[data-player-safe-payload]"))));
  });
  document.querySelectorAll("[data-send-player-safe]").forEach((button) => {
    button.addEventListener("click", () => {
      const payload = playerPayloadFromContainer(button.closest("[data-player-safe-payload]"));
      sendPlayerDisplay({ type: "text", mode: "readaloud", title: payload.title, text: payload.text, scene_id: payload.scene_id });
      window.open(playerDisplayUrl(payload.scene_id || ""), "_blank");
    });
  });
  document.querySelectorAll("[data-print-player-safe]").forEach((button) => {
    button.addEventListener("click", () => openPlayerSafeWindow(playerPayloadFromContainer(button.closest("[data-player-safe-payload]"))));
  });
}

function stateControlMarkup(key) {
  const field = (window.ATLAS_STATE_FIELDS || []).find((item) => item.key === key);
  if (!field) return "";
  const label = escapeHtml(field.label || key);
  if (field.type === "select") {
    return `<label class="state-mini-field"><span>${label}</span><select data-state-field="${escapeHtml(key)}">${(field.options || []).map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(String(opt).replaceAll("_", " "))}</option>`).join("")}</select></label>`;
  }
  if (field.type === "checkbox") {
    return `<label class="state-mini-field state-mini-check"><input type="checkbox" data-state-field="${escapeHtml(key)}"><span>${label}</span></label>`;
  }
  return `<label class="state-mini-field"><span>${label}</span><input type="number" min="${field.min || 0}" max="${field.max || 9}" data-state-field="${escapeHtml(key)}"></label>`;
}

function sceneStateKeys(sceneId) {
  const contexts = atlasUX.state_contexts || {};
  return Object.entries(contexts).filter(([, context]) => (context.scene_ids || []).includes(sceneId)).map(([key]) => key);
}

function runRollMarkup(scene) {
  const cards = scene.roll_cards || [];
  if (!cards.length) return "<p>No roll needed unless pressure makes the outcome uncertain.</p>";
  return cards.slice(0, 3).map((card) => {
    const bands = card.bands || {};
    return `<details class="roll-card" open><summary><span>${escapeHtml(card.title || "Roll")}</span><span class="roll-meta">${escapeHtml((card.trait_options || []).join(", "))} · Hinge ${escapeHtml(card.difficulty || "")}</span></summary>
      <p><strong>Roll:</strong> ${escapeHtml(card.roll || "")}</p>
      <p><strong>Why:</strong> ${escapeHtml(card.why_this_trait || "")}</p>
      <table><tbody>
        <tr><th>Botch</th><td>${escapeHtml(bands.botch || "")}</td></tr>
        <tr><th>Miss</th><td>${escapeHtml(bands.miss || "")}</td></tr>
        <tr><th>Hit</th><td>${escapeHtml(bands.hit || "")}</td></tr>
        <tr><th>Clean</th><td>${escapeHtml(bands.clean || "")}</td></tr>
        <tr><th>Soar</th><td>${escapeHtml(bands.soar || "")}</td></tr>
        <tr><th>Crit</th><td>${escapeHtml(bands.crit || "")}</td></tr>
      </tbody></table>
      <p><strong>Hope:</strong> ${escapeHtml(card.hope_spin || "")}</p>
      <p><strong>Fear:</strong> ${escapeHtml(card.fear_spin || "")}</p>
    </details>`;
  }).join("");
}

function setupRunMode() {
  const shell = document.querySelector("[data-run-mode]");
  if (!shell) return;
  const ids = window.RUN_SCENE_IDS || atlasScenes.map((scene) => scene.id);
  const select = document.querySelector("#run-scene-select");
  const params = new URLSearchParams(window.location.search);
  const hashScene = window.location.hash.replace(/^#scene=?/, "");
  let index = Math.max(0, ids.indexOf(params.get("scene") || hashScene || currentProgress().currentSceneId || ids[0]));
  const progress = currentProgress();
  const auto = document.querySelector("#run-auto-complete");
  if (auto) {
    auto.checked = !!progress.autoCompletePreviousSceneOnNext;
    auto.addEventListener("change", () => {
      progress.autoCompletePreviousSceneOnNext = auto.checked;
      writeJson(progressKey, progress);
    });
  }
  const render = () => {
    const id = ids[index] || ids[0];
    const scene = atlasScenes.find((item) => item.id === id);
    if (!scene) return;
    progress.currentSceneId = scene.id;
    writeJson(progressKey, progress);
    localStorage.setItem("goldspire-player-scene", scene.id);
    if (select) select.value = scene.id;
    document.querySelector("#run-scene-image").src = assetUrl(scene.image);
    document.querySelector("#run-scene-image").alt = `${scene.title} scene art`;
    document.querySelector("#run-scene-caption").textContent = scene.caption || "";
    document.querySelector("#run-scene-act").textContent = `${scene.id} · ${scene.act}`;
    document.querySelector("#run-scene-title").textContent = scene.title;
    document.querySelector("#run-scene-goal").textContent = scene.short || "";
    document.querySelector("#run-scene-readaloud").textContent = scene.read_aloud || "";
    const entities = (scene.entities || []).map((name) => atlasEntities.find((entity) => entity.name === name)).filter(Boolean);
    document.querySelector("#run-entity-links").innerHTML = entities.map((entity) => `<a class="entity-link ${escapeHtml(entity.meta.class)}" href="${escapeHtml(entityPageUrl(entity))}" data-entity="${escapeHtml(entity.id)}"><img class="type-icon" src="${assetUrl(entity.meta.icon_asset)}" alt="" aria-hidden="true"><span>${escapeHtml(entity.name)}</span></a>`).join("");
    document.querySelector("#run-rolls").innerHTML = runRollMarkup(scene);
    document.querySelector("#run-state-controls").innerHTML = sceneStateKeys(scene.id).map(stateControlMarkup).join("") || "<p class=\"muted\">No scene-specific state controls.</p>";
    document.querySelector("#run-gm-details").innerHTML = `<ul>${(scene.gm_notes || []).filter(Boolean).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul><h4>Fear spends</h4><ul>${(scene.fear_spends || []).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`;
    document.querySelector("#run-loot-clues").innerHTML = `<h4>Questions</h4><ul>${(scene.player_questions || []).map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul><h4>Loot / Search</h4><ul>${(scene.loot || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    const page = document.querySelector("#run-open-scene-page");
    if (page) page.href = scenePageUrl(scene);
    document.querySelectorAll("[data-run-scrub]").forEach((button) => {
      button.classList.toggle("is-current", button.dataset.runScrub === scene.id);
      button.classList.toggle("is-complete", !!progress.scenes?.[button.dataset.runScrub]);
    });
    document.querySelector("#run-read-actions").innerHTML = "";
    updateDashboardSummary();
    setupHoverCards();
    setupStateConsole();
  };
  const go = (nextIndex) => {
    const prevId = ids[index];
    if (auto?.checked && prevId && nextIndex !== index) {
      progress.scenes = progress.scenes || {};
      progress.scenes[prevId] = true;
    }
    index = Math.max(0, Math.min(ids.length - 1, nextIndex));
    render();
    window.dispatchEvent(new Event("goldspire-progress-updated"));
  };
  select?.addEventListener("change", () => go(ids.indexOf(select.value)));
  document.querySelector("[data-run-first]")?.addEventListener("click", () => go(0));
  document.querySelector("[data-run-prev]")?.addEventListener("click", () => go(index - 1));
  document.querySelector("[data-run-next]")?.addEventListener("click", () => go(index + 1));
  document.querySelector("[data-run-last]")?.addEventListener("click", () => go(ids.length - 1));
  document.querySelector("[data-run-show-players]")?.addEventListener("click", () => {
    const scene = atlasScenes.find((item) => item.id === ids[index]);
    if (scene) sendPlayerDisplay({ type: "scene", scene_id: scene.id, mode: "title" });
    window.open(playerDisplayUrl(scene?.id || ""), "_blank");
  });
  document.querySelector("[data-run-blackout]")?.addEventListener("click", () => sendPlayerDisplay({ type: "mode", mode: "blackout" }));
  document.querySelector("[data-run-fullscreen]")?.addEventListener("click", () => shell.requestFullscreen?.());
  document.querySelectorAll("[data-run-scrub]").forEach((button) => {
    button.addEventListener("click", () => go(ids.indexOf(button.dataset.runScrub)));
  });
  render();
}

function setupPlayerDisplay() {
  const scenes = window.PLAYER_SCENES || {};
  const select = document.querySelector("#player-scene-select");
  if (!select) return;
  const image = document.querySelector("#player-scene-image");
  const title = document.querySelector("#player-scene-title");
  const act = document.querySelector("#player-scene-act");
  const caption = document.querySelector("#player-scene-caption");
  const read = document.querySelector("#player-scene-readaloud");
  const mechanics = document.querySelector("#player-mechanics-cue");
  const objective = document.querySelector("#player-public-objective");
  const conditions = document.querySelector("#player-conditions-cue");
  const blackout = document.querySelector("#player-blackout");
  const params = new URLSearchParams(window.location.search);
  const stored = params.get("scene") || (params.get("session") === "zero" ? "SZ-00" : "") || localStorage.getItem("goldspire-player-scene") || Object.keys(scenes)[0];
  let displayMode = "title";
  const applyMode = (mode) => {
    displayMode = mode || displayMode;
    const isBlackout = displayMode === "blackout";
    if (blackout) blackout.hidden = !isBlackout;
    const readToggle = document.querySelector("#player-show-readaloud");
    const mechanicToggle = document.querySelector("#player-show-mechanics");
    const objectiveOn = displayMode === "objective" || displayMode === "readaloud";
    if (readToggle) readToggle.checked = displayMode === "readaloud";
    read.hidden = isBlackout || !readToggle?.checked;
    mechanics.hidden = isBlackout || !mechanicToggle?.checked;
    objective.hidden = isBlackout || !objectiveOn;
    caption.hidden = isBlackout || displayMode === "image";
    title.hidden = isBlackout || displayMode === "image";
  };
  const render = () => {
    const scene = scenes[select.value] || scenes[Object.keys(scenes)[0]];
    if (!scene) return;
    localStorage.setItem("goldspire-player-scene", scene.id);
    image.src = scene.image;
    image.alt = `${scene.title} scene art`;
    title.textContent = scene.title;
    act.textContent = `${scene.id} · ${scene.act}`;
    caption.textContent = scene.caption;
    objective.textContent = scene.objective || "";
    read.textContent = scene.read_aloud;
    mechanics.textContent = scene.mechanics_caption || "Mechanics are hidden unless the GM toggles them.";
    conditions.textContent = (scene.conditions || []).join(", ");
    read.hidden = !document.querySelector("#player-show-readaloud")?.checked;
    mechanics.hidden = !document.querySelector("#player-show-mechanics")?.checked;
    conditions.hidden = !document.querySelector("#player-show-conditions")?.checked || !(scene.conditions || []).length;
    document.body.classList.toggle("player-fill-image", !!document.querySelector("#player-fill-image")?.checked);
    applyMode(displayMode);
  };
  const handleMessage = (message) => {
    if (!message) return;
    if (message.type === "mode") {
      applyMode(message.mode);
      return;
    }
    if (message.type === "text") {
      if (message.scene_id && scenes[message.scene_id]) select.value = message.scene_id;
      title.textContent = message.title || "Player Text";
      read.textContent = message.text || "";
      const readToggle = document.querySelector("#player-show-readaloud");
      if (readToggle) readToggle.checked = true;
      applyMode(message.mode || "readaloud");
      return;
    }
    if (message.scene_id && scenes[message.scene_id]) {
      select.value = message.scene_id;
      displayMode = message.mode || displayMode;
      render();
    }
  };
  if (stored && scenes[stored]) select.value = stored;
  select.addEventListener("change", render);
  document.querySelector("#player-show-readaloud")?.addEventListener("change", render);
  document.querySelector("#player-show-mechanics")?.addEventListener("change", render);
  document.querySelector("#player-show-conditions")?.addEventListener("change", render);
  document.querySelector("#player-fill-image")?.addEventListener("change", render);
  document.querySelector("#player-fullscreen")?.addEventListener("click", () => {
    document.querySelector("#player-display-stage")?.requestFullscreen?.();
  });
  document.querySelector("#player-open-image-window")?.addEventListener("click", () => {
    const scene = scenes[select.value] || scenes[Object.keys(scenes)[0]];
    if (scene) openImageWindow(scene.image, scene.caption);
  });
  document.querySelectorAll("[data-player-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      applyMode(button.dataset.playerMode);
    });
  });
  playerChannel?.addEventListener("message", (event) => handleMessage(event.data));
  window.addEventListener("storage", (event) => {
    if (event.key !== "goldspire-player-display-message" || !event.newValue) return;
    try { handleMessage(JSON.parse(event.newValue)); } catch {}
  });
  try { handleMessage(JSON.parse(localStorage.getItem("goldspire-player-display-message") || "null")); } catch {}
  render();
}

setupTheme();
setupQuickNavigation();
setupCollapsibleWikiSections();
setupFilters();
setupLightbox();
setupHoverCards();
setupDevToggles();
setupRulesDrawer();
setupRunMode();
setupStateConsole();
setupSceneProgress();
setupShowPlayerButtons();
setupSessionZeroTools();
setupPcProfiles();
setupEntityIndex();
setupPlayerSafeActions();
setupPlayerDisplay();
updateDashboardSummary();
