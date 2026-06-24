
const atlasEntities = Object.values(window.ATLAS_ENTITIES || {});
const entitiesById = new Map(atlasEntities.map((entity) => [entity.id, entity]));
const atlasScenes = Object.values(window.ATLAS_SCENES || {});
const atlasUX = window.ATLAS_UX || {};
const atlasMechanics = window.ATLAS_MECHANICS || {};
const atlasRules = atlasMechanics.rules_registry || [];
const atlasRulesById = new Map(atlasRules.map((rule) => [rule.id, rule]));
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

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function cleanPlayerChunkText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function playerPayloadAttr(payload) {
  return escapeHtml(JSON.stringify(payload || {}));
}

function staticPlayerTextPayload(title, text, id = "") {
  const clean = cleanPlayerChunkText(text);
  return {
    kind: "text",
    id: id || `static-player-text-${Date.now()}`,
    title: cleanPlayerChunkText(title) || "Player Text",
    text: clean,
    caption: clean,
    readAloud: clean,
    publicObjective: clean,
    scene_id: id || "",
    displayMode: "read-aloud-fullscreen",
  };
}

function staticPlayerImagePayload(title, image, alt = "", caption = "", id = "") {
  const cleanCaption = cleanPlayerChunkText(caption);
  return {
    kind: "image",
    id: id || `static-player-image-${Date.now()}`,
    title: cleanPlayerChunkText(title) || "Player Image",
    image,
    alt: cleanPlayerChunkText(alt) || cleanPlayerChunkText(title) || "Player-facing image.",
    caption: cleanCaption,
    text: cleanCaption,
    scene_id: id || "",
    displayMode: "image-title-caption",
  };
}

function staticPlayerIconButton(icon, label, attrs, className = "") {
  const classes = `throwable-action${className ? ` ${className}` : ""}`;
  return `<button class="${classes}" type="button" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${attrs}><img src="${escapeHtml(assetUrl(`assets/icons/${icon}`))}" alt="" aria-hidden="true"><span class="sr-only">${escapeHtml(label)}</span></button>`;
}

function staticPlayerTextActions() {
  return `<span class="throwable-text-actions" aria-label="Player display text actions">${staticPlayerIconButton("action-reveal.png", "Send text to Player Display", "data-send-player-payload", "throwable-send-text")}${staticPlayerIconButton("action-copy.png", "Copy player text", "data-copy-player-payload", "throwable-copy-text")}</span>`;
}

function staticThrowableTextChunk(title, text, id = "", bodyHtml = "") {
  const clean = cleanPlayerChunkText(text);
  if (!clean) return "";
  return `<p class="throwable-text-chunk hover-card-player-text" data-player-display-payload="${playerPayloadAttr(staticPlayerTextPayload(title, clean, id))}"><span class="throwable-text-body">${bodyHtml || escapeHtml(clean)}</span>${staticPlayerTextActions()}</p>`;
}

function staticImageSendButton(title, image, alt = "", caption = "", id = "") {
  if (!image) return "";
  return staticPlayerIconButton(
    "live-player-display.png",
    "Send image to Player Display",
    `data-send-player-payload data-player-display-payload="${playerPayloadAttr(staticPlayerImagePayload(title, image, alt, caption, id))}"`,
    "throwable-image-send",
  );
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

function rulePageUrl(ruleId) {
  const path = `pages/rules/${ruleId}.html`;
  return window.location.pathname.includes("/pages/") ? `../${path}` : path;
}

function playerDisplayUrl(id = "") {
  const base = window.location.pathname.includes("/pages/") ? "../player-display.html" : "player-display.html";
  return id ? `${base}?slide=${encodeURIComponent(id)}` : base;
}

let playerDisplayWindow = null;

function playerRootAsset(path) {
  let value = String(path || "");
  while (value.startsWith("../")) value = value.slice(3);
  if (value.startsWith("./")) value = value.slice(2);
  return value;
}

function playerSlideFromPayload(payload = {}) {
  if (payload.type === "scene" && payload.scene_id) {
    const scene = atlasScenes.find((item) => item.id === payload.scene_id);
    if (scene) {
      return {
        id: scene.id,
        type: "scene",
        title: scene.title || scene.id,
        image: playerRootAsset(scene.image || ""),
        alt: scene.image_alt || scene.title || "Scene image.",
        caption: scene.caption || "",
        mood: "",
        publicObjective: scene.objective || scene.short || scene.caption || "",
        readAloud: scene.read_aloud || scene.readAloud || scene.caption || "",
        playerBullets: [],
        playerTable: [],
        playerBeats: [],
        displayMode: payload.mode === "image" ? "image-only" : "image-title-caption",
        playerSafe: true,
      };
    }
  }
  const text = payload.text || payload.readAloud || payload.publicObjective || payload.caption || "";
  const image = playerRootAsset(payload.image || "");
  const displayMode = payload.displayMode || (image ? "image-title-caption" : "read-aloud-fullscreen");
  return {
    id: payload.id || payload.scene_id || `static-player-payload-${Date.now()}`,
    type: "static-player-payload",
    title: payload.title || "Player Text",
    image,
    alt: payload.alt || payload.title || "Player-facing display item.",
    caption: payload.caption || text,
    mood: "",
    publicObjective: payload.publicObjective || text,
    readAloud: payload.readAloud || text,
    playerBullets: payload.playerBullets || [],
    playerTable: payload.playerTable || [],
    playerBeats: [],
    displayMode,
    playerSafe: true,
  };
}

function openPlayerDisplayWindow(id = "") {
  const url = playerDisplayUrl(id);
  if (!playerDisplayWindow || playerDisplayWindow.closed) {
    playerDisplayWindow = window.open(url, "goldspire-player-display", "popup=yes,width=1280,height=720");
  } else {
    playerDisplayWindow.focus?.();
  }
  return playerDisplayWindow;
}

function sendPlayerDisplay(payload = {}) {
  if (payload.type === "mode" && payload.mode === "blackout") {
    const message = { type: "blackout", payload: { displayMode: "blackout" }, source: "static-atlas" };
    if (window.GoldspireDisplaySync?.send) window.GoldspireDisplaySync.send(message);
    else {
      try {
        localStorage.setItem("goldspire-run-sync-message-v1", JSON.stringify({
          protocol: "goldspire-run-sync-v1",
          type: "blackout",
          slideId: null,
          payload: { displayMode: "blackout" },
          sentAt: Date.now(),
          source: "static-atlas",
        }));
      } catch {}
    }
    return message;
  }
  const slide = playerSlideFromPayload(payload);
  const displayMode = payload.displayMode || slide.displayMode || "image-title-caption";
  if (payload.scene_id) localStorage.setItem("goldspire-player-scene", payload.scene_id);
  const message = {
    protocol: "goldspire-run-sync-v1",
    type: "setSlide",
    slideId: slide.id,
    payload: { displayMode, slide },
    sentAt: Date.now(),
    source: "static-atlas",
  };
  if (window.GoldspireDisplaySync?.send) {
    window.GoldspireDisplaySync.send(message);
  } else {
    try { localStorage.setItem("goldspire-run-sync-message-v1", JSON.stringify(message)); } catch {}
  }
  try {
    localStorage.setItem("goldspire-player-display-message", JSON.stringify({ ...payload, sent_at: Date.now() }));
    playerChannel?.postMessage({ ...payload, sent_at: Date.now() });
  } catch {}
  return message;
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
  let activeTarget = null;
  const compactMediaTypes = new Set(["faction", "company", "corp", "corporation", "mechanic", "condition"]);
  const clearHideTimer = () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
  };
  const hideNow = () => {
    clearHideTimer();
    card.classList.remove("is-visible");
    card.setAttribute("aria-hidden", "true");
    card.style.left = "";
    card.style.top = "";
    card.style.right = "";
    card.style.bottom = "";
    activeTarget = null;
  };
  const positionCard = (target) => {
    if (!target || !card.classList.contains("is-visible")) return;
    const edge = 12;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (viewportWidth <= 640) {
      card.style.left = `${edge}px`;
      card.style.right = `${edge}px`;
      card.style.top = "auto";
      card.style.bottom = `${edge}px`;
      card.style.maxHeight = `min(68vh, ${Math.max(260, viewportHeight - (edge * 2))}px)`;
      return;
    }
    card.style.right = "auto";
    card.style.bottom = "auto";
    card.style.maxHeight = "";
    const targetRect = target.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const preferredLeft = targetRect.left + (targetRect.width / 2) - (cardRect.width / 2);
    const maxLeft = Math.max(edge, viewportWidth - cardRect.width - edge);
    const left = Math.min(maxLeft, Math.max(edge, preferredLeft));
    const belowTop = targetRect.bottom + edge;
    const aboveTop = targetRect.top - cardRect.height - edge;
    let top = belowTop;
    if (belowTop + cardRect.height > viewportHeight - edge && aboveTop >= edge) {
      top = aboveTop;
    } else {
      const maxTop = Math.max(edge, viewportHeight - cardRect.height - edge);
      top = Math.min(maxTop, Math.max(edge, top));
    }
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
  };
  const showCard = (target, html, classes = []) => {
    activeTarget = target;
    clearHideTimer();
    card.classList.remove("hover-card--compact-media", "hover-card--large-media", "hover-card--mechanic");
    classes.forEach((className) => card.classList.add(className));
    card.innerHTML = html;
    setupPlayerSafeActions();
    card.setAttribute("aria-hidden", "false");
    card.classList.add("is-visible");
    positionCard(target);
    card.querySelectorAll("img").forEach((image) => {
      image.addEventListener("load", () => positionCard(target), { once: true });
    });
  };
  const show = (target) => {
    if (target.dataset.mechanic) {
      const rule = atlasRulesById.get(target.dataset.mechanic);
      if (!rule) return;
      clearHideTimer();
      const tag = String(rule.tag || "official").replaceAll("-", " ");
      showCard(target, `
        <div class="hover-card-layout">
          <div class="hover-card-copy">
            <div class="private-note">${escapeHtml(tag)}</div>
            <strong>${escapeHtml(rule.title || "")}</strong>
            <p>${escapeHtml(rule.summary || "")}</p>
            <p><strong>Use:</strong> ${escapeHtml(rule.when || "")}</p>
            ${rule.key_number ? `<p><strong>Key:</strong> ${escapeHtml(rule.key_number)}</p>` : ""}
            <p><a class="mechanic-link" href="${escapeHtml(rulePageUrl(rule.id))}">Open full rule page</a></p>
          </div>
        </div>
      `, ["hover-card--mechanic"]);
      return;
    }
    const entity = entitiesById.get(target.dataset.entity);
    if (!entity) return;
    clearHideTimer();
    const tags = (entity.tags || []).map((tag) => `<span class="track-pill">${escapeHtml(tag)}</span>`).join(" ");
    const scenes = escapeHtml((entity.appears_in || []).join(", ") || "Referenced lore");
    const entityType = String(entity.type || entity.category || "").toLowerCase();
    const compactMedia = compactMediaTypes.has(entityType);
    const playerTitle = entity.player_display_title || entity.playerDisplayTitle || entity.name || "Entity";
    const playerCaption = entity.player_display_caption || entity.playerDisplayCaption || entity.robust?.player_description || entity.summary || entity.role || "";
    const playerId = `entity-${entity.id || String(entity.name || "entity").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const imageHtml = entity.image
      ? `<figure class="hover-card-media-wrap throwable-image-inline"><img class="hover-card-media" src="${assetUrl(entity.image)}" alt="${escapeHtml(playerTitle)}">${staticImageSendButton(playerTitle, entity.image, playerTitle, playerCaption, playerId)}</figure>`
      : "";
    const iconHtml = entity.meta?.icon_asset ? `<img class="type-icon" src="${assetUrl(entity.meta.icon_asset)}" alt="" aria-hidden="true">` : "";
    const playerTextHtml = staticThrowableTextChunk(`${playerTitle} description`, playerCaption || entity.summary || "", playerId, escapeHtml(playerCaption || entity.summary || ""));
    showCard(target, `
      <div class="hover-card-layout">
        ${imageHtml}
        <div class="hover-card-copy">
          <div class="private-note">${iconHtml} ${escapeHtml(entity.meta?.label || entity.type || "Entity")}</div>
          <strong>${escapeHtml(entity.name)}</strong>
          <p class="pronunciation-line"><strong>Pronunciation:</strong> ${escapeHtml(entity.short_pronunciation || entity.pronunciation || "")}</p>
          ${playerTextHtml}
          <p class="muted">${escapeHtml(entity.role || "")}</p>
          <div class="track-row">${tags}</div>
          <p class="muted">Appears in: ${scenes}</p>
          ${entity.stat_summary ? `<p><strong>Stat:</strong> ${escapeHtml(entity.stat_summary)}</p>` : ""}
          <p><a href="${escapeHtml(entityPageUrl(entity))}">Open wiki page</a></p>
        </div>
      </div>
    `, [compactMedia ? "hover-card--compact-media" : "hover-card--large-media"]);
  };
  const hide = (delay = 240) => {
    clearHideTimer();
    const effectiveDelay = window.innerWidth <= 640 && card.classList.contains("is-visible")
      ? Math.max(delay, 1200)
      : delay;
    hideTimer = setTimeout(() => {
      const targetStillActive = activeTarget && (activeTarget.matches(":hover") || document.activeElement === activeTarget);
      const cardStillActive = card.matches(":hover") || card.contains(document.activeElement);
      if (targetStillActive || cardStillActive) return;
      hideNow();
    }, effectiveDelay);
  };
  card.addEventListener("pointerenter", clearHideTimer);
  card.addEventListener("pointerleave", () => hide(220));
  card.addEventListener("focusin", clearHideTimer);
  card.addEventListener("focusout", () => hide(220));
  window.addEventListener("resize", () => positionCard(activeTarget), { passive: true });
  window.addEventListener("scroll", () => positionCard(activeTarget), { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideNow();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!card.classList.contains("is-visible")) return;
    if (card.contains(event.target) || activeTarget?.contains(event.target)) return;
    hideNow();
  });
  document.querySelectorAll("[data-entity], [data-mechanic]").forEach((target) => {
    target.addEventListener("pointerenter", () => show(target));
    target.addEventListener("mouseenter", () => show(target));
    target.addEventListener("focus", () => show(target));
    target.addEventListener("pointerleave", () => hide(260));
    target.addEventListener("mouseleave", () => hide(260));
    target.addEventListener("blur", () => hide(260));
    target.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch" || window.innerWidth > 640) return;
      if (activeTarget === target && card.classList.contains("is-visible")) return;
      event.preventDefault();
      show(target);
    });
  });
}

function setupDevToggles() {
  const classMap = {
    prompts: "show-dev-prompts",
    assets: "show-dev-assets",
    qa: "show-dev-qa",
  };
  const toggles = [...document.querySelectorAll("[data-dev-toggle]")];
  const updateDevMode = () => {
    document.body.dataset.devMode = toggles.some((toggle) => toggle.checked) ? "true" : "false";
  };
  toggles.forEach((toggle) => {
    const key = toggle.dataset.devToggle;
    const cls = classMap[key];
    const stored = localStorage.getItem(`goldspire-dev-${key}`) === "true";
    toggle.checked = stored;
    if (cls) document.body.classList.toggle(cls, stored);
    toggle.addEventListener("change", () => {
      localStorage.setItem(`goldspire-dev-${key}`, toggle.checked ? "true" : "false");
      if (cls) document.body.classList.toggle(cls, toggle.checked);
      updateDevMode();
    });
  });
  updateDevMode();
}

function setupRulesDrawer() {
  const drawer = document.querySelector("#rules-drawer");
  if (!drawer) return;
  const open = (targetId = "") => {
    drawer.hidden = false;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    const target = targetId ? drawer.querySelector(`#rule-${CSS.escape(targetId)}`) : null;
    if (target) target.scrollIntoView({ block: "start" });
    else drawer.querySelector("input")?.focus();
  };
  const close = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.hidden = true;
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
}

function ruleSearchBlob(rule) {
  return [
    rule.id,
    rule.title,
    rule.summary,
    rule.when,
    rule.not_when,
    rule.question,
    rule.answer,
    rule.example,
    ...(rule.aliases || []),
    ...(rule.related || []),
  ].join(" ").toLowerCase();
}

function matchingRules(query, limit = 8) {
  const q = String(query || "").trim().toLowerCase();
  const rules = atlasRules.length ? atlasRules : [];
  if (!q) return rules.slice(0, limit);
  return rules.filter((rule) => ruleSearchBlob(rule).includes(q)).slice(0, limit);
}

function setupRuleSearchInputs() {
  document.querySelectorAll("#gm-rule-search, #rules-page-search").forEach((input) => {
    const scope = input.closest(".wiki-page") || document;
    const cards = [...scope.querySelectorAll("[data-rules-text], .gm-cheat-card, .rules-index-page .rule-quick-card")];
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      const matchedIds = new Set(matchingRules(query, 100).map((rule) => rule.id));
      cards.forEach((card) => {
        const text = card.innerText.toLowerCase();
        const hasLinkedRule = [...card.querySelectorAll("[data-mechanic]")].some((link) => matchedIds.has(link.dataset.mechanic));
        card.classList.toggle("is-hidden", !!query && !text.includes(query) && !hasLinkedRule);
      });
    });
  });
}

let quickRefUpdater = null;

function setupQuickReference() {
  const widget = document.querySelector("[data-quick-ref]");
  if (!widget) return;
  const key = widget.dataset.persistKey || "goldspire.quickRef.state";
  const toggle = widget.querySelector("[data-quick-ref-toggle]");
  const reset = widget.querySelector("[data-quick-ref-reset]");
  const header = widget.querySelector("[data-quick-ref-drag]");
  const search = widget.querySelector("[data-quick-rule-search]");
  const results = widget.querySelector("[data-quick-rule-results]");
  const saved = { collapsed: true, ...readJson(key, {}) };

  const persist = () => writeJson(key, saved);
  const applyPosition = () => {
    widget.classList.toggle("is-collapsed", !!saved.collapsed);
    toggle?.setAttribute("aria-expanded", saved.collapsed ? "false" : "true");
    if (saved.x != null && saved.y != null && !window.matchMedia("(max-width: 720px)").matches) {
      widget.style.left = `${saved.x}px`;
      widget.style.top = `${saved.y}px`;
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    }
  };
  const renderSearch = () => {
    if (!results) return;
    const matches = matchingRules(search?.value || "", 6);
    results.innerHTML = matches.map((rule) => `<a href="${escapeHtml(rulePageUrl(rule.id))}" data-mechanic="${escapeHtml(rule.id)}"><strong>${escapeHtml(rule.title)}</strong><span class="muted"> ${escapeHtml((rule.aliases || []).slice(0, 3).join(", "))}</span></a>`).join("");
  };
  quickRefUpdater = () => {
    const progress = currentProgress();
    const state = currentState();
    const currentId = progress.currentSceneId || state.current_scene_id || localStorage.getItem("goldspire-player-scene") || "S00-01";
    const scene = atlasScenes.find((item) => item.id === currentId);
    const currentNode = widget.querySelector("[data-quick-current-scene]");
    if (currentNode) currentNode.textContent = scene ? `${scene.id} · ${scene.title}` : currentId;
    const sceneRules = (atlasMechanics.scene_rule_chips || {})[currentId] || [];
    const mechanicsNode = widget.querySelector("[data-quick-scene-mechanics]");
    if (mechanicsNode) {
      mechanicsNode.innerHTML = sceneRules.map((id) => {
        const rule = atlasRulesById.get(id);
        return rule ? `<a class="mechanic-chip" href="${escapeHtml(rulePageUrl(id))}" data-mechanic="${escapeHtml(id)}"><span>${escapeHtml(rule.title)}</span></a>` : "";
      }).join("");
    }
    const profiles = readJson(pcProfilesKey, {});
    const pcs = atlasEntities.filter((entity) => entity.type === "pc" || (entity.tags || []).includes("pc"));
    const pcNode = widget.querySelector("[data-quick-pc-list]");
    if (pcNode) {
      pcNode.innerHTML = pcs.slice(0, 5).map((entity) => {
        const profile = { ...(entity.pc_profile || {}), ...(profiles[entity.id] || {}) };
        const name = profile.current_character_name || entity.name;
        const player = profile.player_name || "Unassigned";
        const pronunciation = profile.character_pronunciation || entity.short_pronunciation || entity.pronunciation || "";
        return `<p><strong>${escapeHtml(name)}</strong><br><span class="muted">${escapeHtml(player)} · ${escapeHtml(pronunciation)}</span></p>`;
      }).join("");
    }
    renderSearch();
  };
  toggle?.addEventListener("click", () => {
    saved.collapsed = !saved.collapsed;
    persist();
    applyPosition();
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
    applyPosition();
  });
  search?.addEventListener("input", renderSearch);
  header?.addEventListener("pointerdown", (event) => {
    if (window.matchMedia("(max-width: 720px)").matches || event.target.closest("button")) return;
    const start = widget.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    header.setPointerCapture?.(event.pointerId);
    const move = (moveEvent) => {
      saved.x = Math.min(window.innerWidth - 80, Math.max(8, start.left + moveEvent.clientX - startX));
      saved.y = Math.min(window.innerHeight - 48, Math.max(8, start.top + moveEvent.clientY - startY));
      applyPosition();
    };
    const up = () => {
      persist();
      header.removeEventListener("pointermove", move);
      header.removeEventListener("pointerup", up);
      header.removeEventListener("pointercancel", up);
    };
    header.addEventListener("pointermove", move);
    header.addEventListener("pointerup", up);
    header.addEventListener("pointercancel", up);
  });
  window.addEventListener("storage", (event) => {
    if ([progressKey, stateKey, pcProfilesKey, "goldspire-player-scene"].includes(event.key)) quickRefUpdater?.();
  });
  applyPosition();
  quickRefUpdater();
}

function applyDiceMode(mode) {
  const selected = mode || "duality_2d12";
  document.documentElement.dataset.diceMode = selected;
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
    strixwolf_disposition: "unresolved",
    strixwolf_outcome: "unresolved",
    strixwolf_trust: 0,
    strixwolf_blood_debt: false,
    bramble_outcome: "unresolved",
    bramble_truth_learned: false,
    package_status: "held",
    hush_trust: "neutral",
    custodian_route: "unknown",
    ward_awareness: "none",
    festival_participation: false,
    festival_boon: "none",
    hush_clues: "none",
    custodian_trust: "neutral",
    ward_stability: "fragile",
    ritual_prep: "unready",
    keystone_understanding: "surface",
    ritual_countdown: 8,
    ritual_outcome: "unresolved",
    protected_whom: "unresolved",
    custodian_fate: "unresolved",
    report_choice: "unresolved",
    relay_hook_accepted: false,
    epilogue_tone: "triumphant",
    hidden_hook_discovered: false,
    sequel_direction: "undecided",
    rewards_granted: false,
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
  quickRefUpdater?.();
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
      if (!confirm(`Reset ${mode}? This cannot be undone. Export your state first if you want a backup.`)) return;
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
      openPlayerDisplayWindow(id);
      sendPlayerDisplay({ type: "scene", scene_id: id, mode: "title" });
    });
  });
  document.querySelectorAll("[data-show-player-session]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.showPlayerSession;
      openPlayerDisplayWindow(id);
      sendPlayerDisplay({ type: "scene", scene_id: id, mode: "title" });
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
  const localDefaults = {
    hp_override: "",
    stress_override: "",
    evasion_override: "",
    armor_override: "",
    damage_thresholds_override: "",
    gm_notes: "",
    outcome_promises: "",
    outcome_scars: "",
    outcome_favors: "",
    outcome_open_threads: "",
    secrets_revealed: "",
    session_notes: "",
  };
  (atlasUX.pc_schema?.profiles || []).forEach((profile) => {
    profiles[profile.pc_id] = {
      ...localDefaults,
      ...profile,
      spotlight_count: profile.spotlight_count || 0,
      hope_generated: profile.hope_generated || 0,
      fear_generated: profile.fear_generated || 0,
      safety_private_notes: profile.safety_private_notes || "",
    };
  });
  return profiles;
}

function mergePcProfiles(rawProfiles = {}) {
  const defaults = defaultPcProfiles();
  const profiles = { ...defaults };
  Object.entries(rawProfiles || {}).forEach(([id, profile]) => {
    profiles[id] = { ...(defaults[id] || {}), ...(profile || {}) };
  });
  return profiles;
}

function getPcProfiles() {
  return mergePcProfiles(readJson(pcProfilesKey, {}));
}

function fieldValueFromCard(field) {
  if (field.type === "number") return Number(field.value || 0);
  return field.value;
}

function syncPcPrintCards(profiles) {
  const setPrintOverride = (card, selector, value) => {
    const hasValue = value !== undefined && value !== null && String(value).trim() !== "";
    card.querySelectorAll(selector).forEach((node) => {
      if (node.dataset.defaultHtml === undefined) node.dataset.defaultHtml = node.innerHTML;
      if (hasValue) node.textContent = String(value).trim();
      else node.innerHTML = node.dataset.defaultHtml;
    });
  };
  const linesFromValue = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || "").split(/\n|;/).map((item) => item.trim()).filter(Boolean);
  };
  const setPrintList = (card, selector, value) => {
    const lines = linesFromValue(value);
    card.querySelectorAll(selector).forEach((node) => {
      if (node.dataset.defaultHtml === undefined) node.dataset.defaultHtml = node.innerHTML;
      if (!lines.length) {
        node.innerHTML = node.dataset.defaultHtml;
        return;
      }
      node.innerHTML = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
    });
  };
  document.querySelectorAll("[data-pc-print-card]").forEach((card) => {
    const profile = profiles[card.dataset.pcPrintCard] || {};
    const classLine = [profile.class, profile.subclass].filter(Boolean).join(" / ");
    const ancestryLine = [profile.ancestry, profile.community].filter(Boolean).join(" / ");
    const experienceOverride = [profile.experiences_text || "", profile.custom_experiences_text || ""].filter(Boolean).join("\n");
    setPrintOverride(card, "[data-print-current_character_name]", profile.current_character_name || profile.default_character_name);
    setPrintOverride(card, "[data-print-player_name]", profile.player_name || "Unassigned");
    setPrintOverride(card, "[data-print-character_pronunciation]", profile.character_pronunciation);
    setPrintOverride(card, "[data-print-character_pronouns]", profile.character_pronouns);
    setPrintOverride(card, "[data-print-class]", classLine);
    setPrintOverride(card, "[data-print-ancestry]", ancestryLine);
    setPrintOverride(card, "[data-print-community]", profile.community);
    setPrintOverride(card, "[data-print-heritage]", profile.heritage);
    setPrintOverride(card, "[data-print-hp_override]", profile.hp_override);
    setPrintOverride(card, "[data-print-stress_override]", profile.stress_override);
    setPrintOverride(card, "[data-print-evasion_override]", profile.evasion_override);
    setPrintOverride(card, "[data-print-armor_override]", profile.armor_override);
    setPrintOverride(card, "[data-print-damage_thresholds_override]", profile.damage_thresholds_override);
    setPrintList(card, "[data-print-experiences_text]", experienceOverride);
    setPrintList(card, "[data-print-connection_answers_text]", profile.connection_answers_text || profile.connection_answers || []);
    setPrintOverride(card, "[data-print-table_notes]", profile.table_notes);
    setPrintOverride(card, "[data-print-outcome_promises]", profile.outcome_promises);
    setPrintOverride(card, "[data-print-outcome_scars]", profile.outcome_scars);
    setPrintOverride(card, "[data-print-outcome_favors]", profile.outcome_favors);
    setPrintOverride(card, "[data-print-outcome_open_threads]", profile.outcome_open_threads);
    setPrintOverride(card, "[data-print-secrets_revealed]", profile.secrets_revealed);
    setPrintOverride(card, "[data-print-session_notes]", profile.session_notes);
    setPrintOverride(card, "[data-print-gm_notes]", profile.gm_notes);
    setPrintOverride(card, "[data-print-player_notes]", profile.player_notes);
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
      profiles = mergePcProfiles(JSON.parse(box?.value || "{}"));
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
    { label: "Story Outline", type: "Tool", url: window.location.pathname.includes("/pages/") ? "story-outline.html" : "pages/story-outline.html" },
    { label: "Storyboard", type: "Tool", url: window.location.pathname.includes("/pages/") ? "storyboard.html" : "pages/storyboard.html" },
    { label: "Story", type: "Tool", url: window.location.pathname.includes("/pages/") ? "story.html" : "pages/story.html" },
    { label: "GM Dashboard", type: "Tool", url: window.location.pathname.includes("/pages/") ? "gm-dashboard.html" : "pages/gm-dashboard.html" },
    { label: "Entity Wiki", type: "Tool", url: window.location.pathname.includes("/pages/") ? "entity-index.html" : "pages/entity-index.html" },
    { label: "Handouts Hub", type: "Tool", url: window.location.pathname.includes("/pages/") ? "handouts.html" : "pages/handouts.html" },
    { label: "PC Cheat Sheet", type: "Tool", url: window.location.pathname.includes("/pages/") ? "pc-cheat-sheet.html" : "pages/pc-cheat-sheet.html" },
    { label: "Session Zero", type: "Tool", url: window.location.pathname.includes("/pages/") ? "session-zero.html" : "pages/session-zero.html" },
    { label: "Session Zero FAQ", type: "Wiki", url: window.location.pathname.includes("/pages/") ? "session-zero-faq.html" : "pages/session-zero-faq.html" },
    { label: "Session Zero Cue Cards", type: "Wiki", url: window.location.pathname.includes("/pages/") ? "session-zero-cue-cards.html" : "pages/session-zero-cue-cards.html" },
    { label: "Safety Tools", type: "Wiki", url: window.location.pathname.includes("/pages/") ? "safety-tools.html" : "pages/safety-tools.html" },
    { label: "Character Sheet Guide", type: "Wiki", url: window.location.pathname.includes("/pages/") ? "character-sheet-guide.html" : "pages/character-sheet-guide.html" },
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

function playerDisplayPayloadFromElement(element) {
  const container = element?.closest("[data-player-display-payload], [data-player-safe-payload]");
  try {
    return JSON.parse(container?.dataset.playerDisplayPayload || container?.dataset.playerSafePayload || "{}");
  } catch {
    return {};
  }
}

async function copyPlayerPayloadText(payload) {
  const text = payload.text || payload.readAloud || payload.publicObjective || payload.caption || "";
  try {
    await navigator.clipboard?.writeText(text);
  } catch {
    window.prompt("Copy player text:", text);
  }
}

function openPlayerSafeWindow(payload) {
  const win = window.open("", "_blank", "popup=yes,width=900,height=680");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(payload.title || "Player Text")}</title><style>body{margin:0;padding:clamp(2rem,5vw,5rem);font-family:system-ui,sans-serif;line-height:1.65;background:#fffdf8;color:#1e2428}main{max-width:62rem;margin:auto}h1{font-size:clamp(2.2rem,6vw,4rem);line-height:1.05}p{font-size:clamp(1.2rem,3vw,1.8rem)}</style></head><body><main><h1>${escapeHtml(payload.title || "Player Text")}</h1><p>${escapeHtml(payload.text || "")}</p></main></body></html>`);
  win.document.close();
}

function setupPlayerSafeActions() {
  document.querySelectorAll("[data-send-player-payload]").forEach((button) => {
    if (button.dataset.playerActionBound === "true") return;
    button.dataset.playerActionBound = "true";
    button.addEventListener("click", () => {
      const payload = playerDisplayPayloadFromElement(button);
      openPlayerDisplayWindow(payload.scene_id || payload.id || "");
      sendPlayerDisplay(payload);
    });
  });
  document.querySelectorAll("[data-copy-player-payload]").forEach((button) => {
    if (button.dataset.playerActionBound === "true") return;
    button.dataset.playerActionBound = "true";
    button.addEventListener("click", async () => {
      await copyPlayerPayloadText(playerDisplayPayloadFromElement(button));
    });
  });
  document.querySelectorAll("[data-copy-player-safe]").forEach((button) => {
    if (button.dataset.playerActionBound === "true") return;
    button.dataset.playerActionBound = "true";
    button.addEventListener("click", async () => {
      const payload = playerPayloadFromContainer(button.closest("[data-player-safe-payload]"));
      await copyPlayerPayloadText(payload);
    });
  });
  document.querySelectorAll("[data-open-player-safe-window]").forEach((button) => {
    if (button.dataset.playerActionBound === "true") return;
    button.dataset.playerActionBound = "true";
    button.addEventListener("click", () => openPlayerSafeWindow(playerPayloadFromContainer(button.closest("[data-player-safe-payload]"))));
  });
  document.querySelectorAll("[data-send-player-safe]").forEach((button) => {
    if (button.dataset.playerActionBound === "true") return;
    button.dataset.playerActionBound = "true";
    button.addEventListener("click", () => {
      const payload = playerPayloadFromContainer(button.closest("[data-player-safe-payload]"));
      openPlayerDisplayWindow(payload.scene_id || payload.id || "");
      sendPlayerDisplay(payload);
    });
  });
  document.querySelectorAll("[data-print-player-safe]").forEach((button) => {
    if (button.dataset.playerActionBound === "true") return;
    button.dataset.playerActionBound = "true";
    button.addEventListener("click", () => openPlayerSafeWindow(playerPayloadFromContainer(button.closest("[data-player-safe-payload]"))));
  });
}

function setupHandoutExportFilters() {
  document.querySelectorAll("[data-handouts-hub]").forEach((page) => {
    if (page.dataset.handoutHubBound === "true") return;
    page.dataset.handoutHubBound = "true";
    const tabs = [...page.querySelectorAll("[data-handout-tab]")];
    const panels = [...page.querySelectorAll("[data-handout-panel]")];
    const search = page.querySelector("[data-handout-search]");
    const kindFilter = page.querySelector("[data-handout-kind-filter]");
    const archetypeFilter = page.querySelector("[data-handout-archetype-filter]");
    const disclosureFilter = page.querySelector("[data-handout-disclosure-filter]");
    const status = page.querySelector("[data-handout-results-status]");
    const showAllButton = page.querySelector("[data-handout-show-all]");

    function activePanel() {
      const tab = page.dataset.activeHandoutTab || "handouts";
      return panels.find((panel) => panel.dataset.handoutPanel === tab);
    }

    function cardMatchesFilters(card) {
      const query = (search?.value || "").trim().toLowerCase();
      const kind = kindFilter?.value || "all";
      const archetype = archetypeFilter?.value || "all";
      const disclosure = disclosureFilter?.value || "all";
      const showUnavailable = page.dataset.showAllHandouts === "true";
      if (!showUnavailable && card.dataset.available === "false") return false;
      if (query && !(card.dataset.search || "").includes(query)) return false;
      if (kind !== "all" && card.dataset.kind !== kind) return false;
      if (archetype !== "all" && card.dataset.archetype !== archetype) return false;
      if (disclosure !== "all" && card.dataset.disclosure !== disclosure) return false;
      return true;
    }

    function refresh() {
      const active = page.dataset.activeHandoutTab || "handouts";
      tabs.forEach((tab) => {
        const selected = tab.dataset.handoutTab === active;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.handoutPanel !== active;
      });
      const panel = activePanel();
      let visible = 0;
      let total = 0;
      page.querySelectorAll("[data-handout-card]").forEach((card) => {
        if (!panel || !panel.contains(card)) {
          card.dataset.handoutHidden = "true";
          return;
        }
        total += 1;
        const matched = cardMatchesFilters(card);
        card.dataset.handoutHidden = matched ? "false" : "true";
        if (matched) visible += 1;
      });
      if (status) {
        const label = tabs.find((tab) => tab.dataset.handoutTab === active)?.textContent?.trim() || "handouts";
        status.textContent = `${visible} of ${total} ${label} cards shown.`;
      }
      if (showAllButton) {
        const showMissing = page.dataset.showAllHandouts !== "true";
        showAllButton.textContent = showMissing ? "Show missing" : "Hide missing";
        showAllButton.setAttribute(
          "aria-label",
          showMissing ? "Show entries with no player handout" : "Hide entries with no player handout",
        );
        showAllButton.setAttribute(
          "title",
          showMissing ? "Show entries with no player handout" : "Hide entries with no player handout",
        );
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        page.dataset.activeHandoutTab = tab.dataset.handoutTab || "handouts";
        refresh();
      });
      tab.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      });
    });
    [search, kindFilter, archetypeFilter, disclosureFilter].forEach((control) => {
      control?.addEventListener("input", refresh);
      control?.addEventListener("change", refresh);
    });
    showAllButton?.addEventListener("click", () => {
      page.dataset.showAllHandouts = page.dataset.showAllHandouts === "true" ? "false" : "true";
      refresh();
    });
    refresh();
  });
}

function setupExportOptions() {
  const formatLabels = {
    printer: "Printer",
    pdf: "PDF",
    markdown: "Markdown",
    json: "JSON",
    docx: "DOCX",
  };
  const variantLabels = {
    raw: "Raw page",
    gm: "GM handout",
    player: "Player handout",
  };
  const formatOrder = ["printer", "pdf", "markdown", "json", "docx"];
  let manifestPromise = null;

  function atlasRootUrl() {
    const script = [...document.scripts].find((item) => /(?:^|\/)app\.js(?:\?|$)/.test(item.getAttribute("src") || ""));
    if (script?.src) return new URL(".", script.src);
    return new URL("./", window.location.href);
  }

  function rootHref(path) {
    return new URL(path, atlasRootUrl()).href;
  }

  function currentRootRelativePath() {
    const root = atlasRootUrl().href;
    const here = window.location.href.split("#")[0].split("?")[0];
    if (here.startsWith(root)) return decodeURIComponent(here.slice(root.length));
    return decodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
  }

  function loadManifest() {
    if (window.ATLAS_EXPORT_MANIFEST) return Promise.resolve(window.ATLAS_EXPORT_MANIFEST);
    if (!manifestPromise) {
      manifestPromise = fetch(rootHref("exports/export-manifest.json")).then((response) => response.json());
    }
    return manifestPromise;
  }

  function ensureDialog() {
    let dialog = document.querySelector("#export-options-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "export-options-dialog";
    dialog.className = "export-dialog";
    document.body.appendChild(dialog);
    return dialog;
  }

  function formatLinks(formats = {}) {
    const links = formatOrder
      .filter((format) => formats[format])
      .map((format) => `<a class="button tertiary" href="${escapeAttr(rootHref(formats[format]))}" target="_blank" rel="noopener">${escapeHtml(formatLabels[format])}</a>`)
      .join("");
    return links || '<p class="muted">Not generated for this variant.</p>';
  }

  function variantPanel(name, data = {}) {
    const available = data.available !== false && !!data.formats;
    const meta = [];
    if (data.archetype) meta.push(data.archetype);
    if (data.disclosure_tier) meta.push(`tier: ${data.disclosure_tier}`);
    if (data.featured) meta.push("featured");
    return `<article class="export-variant-panel">
      <h3>${escapeHtml(variantLabels[name] || name)}</h3>
      ${meta.length ? `<p class="muted">${escapeHtml(meta.join(" · "))}</p>` : ""}
      ${available ? `<div class="export-format-links">${formatLinks(data.formats)}</div>` : `<p class="muted">${escapeHtml(data.reason || data.status || "No export available.")}</p>`}
    </article>`;
  }

  function packLinks(siteExports = {}) {
    const context = siteExports.context || {};
    const packs = siteExports.player_handout_packs || {};
    return `<section class="export-variant-panel">
      <h3>Whole-site context</h3>
      <div class="export-pack-row">${formatLinks({ json: context.json, markdown: context.markdown })}</div>
    </section>
    <section class="export-variant-panel">
      <h3>Featured player handouts</h3>
      <div class="export-pack-row">${formatLinks(packs.featured || {})}</div>
    </section>
    <section class="export-variant-panel">
      <h3>All player handouts</h3>
      <div class="export-pack-row">${formatLinks(packs.all || {})}</div>
    </section>`;
  }

  function renderDialog(manifest, entry, note = "") {
    const dialog = ensureDialog();
    const variants = entry?.variants || {};
    dialog.innerHTML = `<form method="dialog">
      <div class="export-dialog-header">
        <div>
          <p class="private-note">Static export options</p>
          <h2>${escapeHtml(entry?.title || "Story Atlas Exports")}</h2>
          <p class="muted">${escapeHtml(note || (entry ? `${entry.kind}:${entry.id}` : "Whole-site backup/context exports"))}</p>
        </div>
        <button class="dialog-close" value="close" aria-label="Close export options">x</button>
      </div>
      <section class="export-dialog-grid">
        ${entry ? ["raw", "gm", "player"].map((variant) => variantPanel(variant, variants[variant] || {})).join("") : ""}
        ${packLinks(manifest.site_exports || {})}
      </section>
    </form>`;
    dialog.showModal?.();
  }

  async function openForEntry(entryKey, note = "") {
    const manifest = await loadManifest();
    const entry = (manifest.entries || []).find((item) => item.key === entryKey);
    renderDialog(manifest, entry, note);
  }

  async function openForSlide(slideId) {
    await openForEntry(`slide:${slideId}`, "Run Mode exports use the current slide.");
  }

  async function openForCurrentPage() {
    const manifest = await loadManifest();
    const rel = currentRootRelativePath() || "index.html";
    const entry = (manifest.entries || []).find((item) => item.page_href === rel);
    renderDialog(manifest, entry, entry ? "Current page exports" : `No page-specific export matched ${rel}; showing site packs.`);
  }

  document.querySelectorAll("[data-export-options]").forEach((button) => {
    if (button.dataset.exportOptionsBound === "true") return;
    button.dataset.exportOptionsBound = "true";
    button.addEventListener("click", () => openForCurrentPage());
  });

  window.GoldspireExports = {
    openForCurrentPage,
    openForSlide,
    openForEntry,
    manifest: loadManifest,
  };
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
    const outcomes = card.outcomes || {};
    const outcomeBands = atlasMechanics.outcome_bands || [];
    const rows = outcomeBands.map((band) => `<tr><th>${escapeHtml(band.label || "")}<small>${escapeHtml(band.range || "")}</small></th><td>${escapeHtml(outcomes[band.key] || band.summary || "")}</td></tr>`).join("");
    return `<details class="roll-card" open><summary><span>${escapeHtml(card.title || "Roll")}</span><span class="roll-meta">${escapeHtml((card.trait_options || []).join(", "))} · DC ${escapeHtml(card.difficulty || "")}</span></summary>
      <p><strong>Roll:</strong> ${escapeHtml(card.roll || "")}</p>
      <p><strong>Why:</strong> ${escapeHtml(card.why_this_trait || "")}</p>
      <table><tbody>${rows}</tbody></table>
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
    const stateControlHtml = sceneStateKeys(scene.id).map(stateControlMarkup).join("");
    const stateControlPanel = document.querySelector("#run-state-controls")?.closest(".contextual-state");
    document.querySelector("#run-state-controls").innerHTML = stateControlHtml;
    if (stateControlPanel) stateControlPanel.hidden = !stateControlHtml;
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
    openPlayerDisplayWindow(scene?.id || "");
    if (scene) sendPlayerDisplay({ type: "scene", scene_id: scene.id, mode: "title" });
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

const runClockKey = "goldspire.runClock.v1";
const runClockSessionPlan = {
  targetMinutes: 210,
  softWallMinutes: 240,
  hardWallMinutes: 300,
};
let runClockIntervalId = null;
const runClockSeverityRank = {
  none: 0,
  soft: 1,
  nudge: 1,
  break: 2,
  warning: 3,
  alert: 4,
  critical: 5,
};

function readRunClockState() {
  try {
    return normalizeRunClockState(JSON.parse(localStorage.getItem(runClockKey) || "null") || {});
  } catch {
    return normalizeRunClockState({});
  }
}

function saveRunClockState(state) {
  localStorage.setItem(runClockKey, JSON.stringify(normalizeRunClockState(state)));
}

function runClockDefaultSettings() {
  return {
    actPacingAlerts: true,
    scenePacingAlerts: true,
    softCheckIns: true,
    hourlyBreakPrompts: true,
    playerBreakAlerts: true,
    modalEscalation: true,
  };
}

function normalizeRunClockObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeRunClockState(state) {
  const next = normalizeRunClockObject(state);
  const now = Date.now();
  const legacyStartedAt = Number(next.startedAt || 0);
  if (!next.version && legacyStartedAt) {
    const legacyEnd = Number(next.stoppedAt || next.pausedAt || now);
    next.elapsedMs = Math.max(0, legacyEnd - legacyStartedAt - Number(next.pausedTotalMs || 0) + Number(next.elapsedAdjustMs || 0));
    next.status = next.stoppedAt ? "stopped" : next.pausedAt ? "paused" : "running";
    next.lastStartedAt = next.status === "running" ? now : null;
    next.visible = true;
  }
  next.version = 2;
  next.status = ["stopped", "running", "paused"].includes(next.status) ? next.status : "stopped";
  next.visible = Boolean(next.visible || next.status !== "stopped" || Number(next.elapsedMs || 0) > 0);
  next.elapsedMs = Math.max(0, Number(next.elapsedMs || 0));
  next.lastStartedAt = next.status === "running" ? Number(next.lastStartedAt || now) : null;
  next.segmentIndex = Math.max(0, Number(next.segmentIndex || 0));
  next.sceneIndex = Math.max(0, Number(next.sceneIndex || 0));
  next.segmentStartMs = Math.max(0, Number(next.segmentStartMs || 0));
  next.sceneStartMs = Math.max(0, Number(next.sceneStartMs || 0));
  next.dismissedNotices = normalizeRunClockObject(next.dismissedNotices);
  next.permanentlyDismissedNotices = normalizeRunClockObject(next.permanentlyDismissedNotices);
  next.snoozedNotices = normalizeRunClockObject(next.snoozedNotices);
  next.noticeFirstSeen = normalizeRunClockObject(next.noticeFirstSeen);
  next.modalDismissedNotices = normalizeRunClockObject(next.modalDismissedNotices);
  next.playerBreakNoticesSent = normalizeRunClockObject(next.playerBreakNoticesSent);
  next.settings = { ...runClockDefaultSettings(), ...normalizeRunClockObject(next.settings) };
  next.breakLog = Array.isArray(next.breakLog) ? next.breakLog : [];
  next.breakActive = Boolean(next.breakActive);
  next.breakStartedAt = next.breakActive ? Number(next.breakStartedAt || now) : null;
  next.currentScheduleId = typeof next.currentScheduleId === "string" ? next.currentScheduleId : "";
  next.currentScene = typeof next.currentScene === "string" ? next.currentScene : "";
  next.currentSceneTitle = typeof next.currentSceneTitle === "string" ? next.currentSceneTitle : "";
  next.sceneOrderBySegment = normalizeRunClockObject(next.sceneOrderBySegment);
  return next;
}

function newRunClockState(now = Date.now(), settings = null, status = "stopped") {
  const safeStatus = ["stopped", "running", "paused"].includes(status) ? status : "stopped";
  return {
    version: 2,
    visible: true,
    status: safeStatus,
    elapsedMs: 0,
    lastStartedAt: safeStatus === "running" ? now : null,
    segmentIndex: 0,
    sceneIndex: 0,
    segmentStartMs: 0,
    sceneStartMs: 0,
    scheduleIndexOverride: null,
    currentScheduleId: "",
    currentScene: "",
    currentSceneTitle: "",
    sceneOrderBySegment: {},
    breakActive: false,
    breakStartedAt: null,
    breakLog: [],
    dismissedNotices: {},
    permanentlyDismissedNotices: {},
    snoozedNotices: {},
    noticeFirstSeen: {},
    modalDismissedNotices: {},
    playerBreakNoticesSent: {},
    settings: { ...runClockDefaultSettings(), ...(settings || {}) },
  };
}

function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function runClockElapsed(state, now = Date.now()) {
  const base = Math.max(0, Number(state.elapsedMs || 0));
  if (state.status !== "running") return base;
  return Math.max(0, base + (now - Number(state.lastStartedAt || now)));
}

function runClockSchedule() {
  return (window.ATLAS_STORY_SCOPE && window.ATLAS_STORY_SCOPE.pacing_schedule) || [];
}

function runClockSegmentStartMinutes(index) {
  const schedule = runClockSchedule();
  if (!schedule.length || index <= 0) return 0;
  return Number(schedule[index - 1]?.targetEndMinutes || 0);
}

function runClockSegmentDurationMs(index) {
  const schedule = runClockSchedule();
  const row = schedule[index] || schedule[0];
  if (!row) return 30 * 60000;
  return Math.max(5 * 60000, (Number(row.targetEndMinutes || 0) - runClockSegmentStartMinutes(index)) * 60000);
}

function runClockCurrentSegmentIndex(state, elapsedMinutes = null) {
  const schedule = runClockSchedule();
  if (!schedule.length) return 0;
  if (Number.isInteger(state.scheduleIndexOverride)) {
    return Math.max(0, Math.min(schedule.length - 1, state.scheduleIndexOverride));
  }
  if (state.currentScheduleId) {
    const found = schedule.findIndex((item) => item.id === state.currentScheduleId);
    if (found >= 0) return found;
  }
  const minutes = elapsedMinutes == null ? runClockElapsed(state) / 60000 : elapsedMinutes;
  const found = schedule.findIndex((item) => minutes < Number(item.targetEndMinutes || 0));
  return found >= 0 ? found : schedule.length - 1;
}

function runClockSlidesForSegment(segmentId) {
  const slides = Array.isArray(window.GOLDSPIRE_SLIDES) ? window.GOLDSPIRE_SLIDES : [];
  return slides.filter((slide) => {
    const pacingId = slide?.storyScope?.pacing?.id || "";
    if (pacingId !== segmentId) return false;
    if (slide.type === "cheat") return false;
    return slide.completionEligible !== false || slide.type === "scene" || slide.type === "map";
  });
}

function runClockSlideWeight(slide) {
  if (!slide) return 1;
  if (String(slide.id || "").startsWith("MAP-COMBAT")) return 2.2;
  if (String(slide.id || "").startsWith("MAP-")) return 1.35;
  if (slide.type === "section") return .35;
  const beats = Math.max(1, (slide.playerBeats || []).length, (slide.gmBeats || []).length);
  return Math.min(3, 1 + beats * .18);
}

function runClockSceneBudgetMs(state, row) {
  if (!row) return 8 * 60000;
  const slides = runClockSlidesForSegment(row.id);
  const current = slides.find((slide) => slide.id === state.currentScene);
  if (!current || !slides.length) return Math.min(12 * 60000, Math.max(5 * 60000, runClockSegmentDurationMs(state.segmentIndex) / 4));
  const totalWeight = slides.reduce((sum, slide) => sum + runClockSlideWeight(slide), 0) || 1;
  return Math.max(4 * 60000, Math.min(18 * 60000, runClockSegmentDurationMs(state.segmentIndex) * (runClockSlideWeight(current) / totalWeight)));
}

function runClockCurrentRenderedSlide() {
  const selectValue = document.querySelector("#run-slide-select")?.value || "";
  const positionText = document.querySelector("#run-position")?.textContent || "";
  const match = positionText.match(/-\s+([A-Z0-9-]+)$/i);
  const id = selectValue || match?.[1] || "";
  const slides = Array.isArray(window.GOLDSPIRE_SLIDES) ? window.GOLDSPIRE_SLIDES : [];
  return slides.find((slide) => slide.id === id) || null;
}

function runClockApplySlideContext(state, slide, elapsedMs = runClockElapsed(state)) {
  if (!slide?.id) return false;
  let changed = false;
  const pacing = slide.storyScope?.pacing || {};
  if (pacing.id && state.currentScheduleId !== pacing.id) {
    state.currentScheduleId = pacing.id;
    state.scheduleIndexOverride = null;
    changed = true;
  }
  const segmentIndex = runClockCurrentSegmentIndex(state, elapsedMs / 60000);
  if (state.segmentIndex !== segmentIndex) {
    state.segmentIndex = segmentIndex;
    state.segmentStartMs = elapsedMs;
    changed = true;
  }
  const segmentId = pacing.id || state.currentScheduleId || "ACT0";
  state.sceneOrderBySegment[segmentId] = Array.isArray(state.sceneOrderBySegment[segmentId]) ? state.sceneOrderBySegment[segmentId] : [];
  if (!state.sceneOrderBySegment[segmentId].includes(slide.id)) {
    state.sceneOrderBySegment[segmentId].push(slide.id);
    changed = true;
  }
  const sceneIndex = Math.max(0, state.sceneOrderBySegment[segmentId].indexOf(slide.id));
  if (state.currentScene !== slide.id) {
    state.sceneStartMs = elapsedMs;
    changed = true;
  }
  if (state.sceneIndex !== sceneIndex) changed = true;
  state.sceneIndex = sceneIndex;
  state.currentScene = slide.id;
  state.currentSceneTitle = slide.title || "";
  return changed;
}

function runClockBreakSchedule() {
  return [
    { id: "hour-1-break", targetMinutes: 60, target: "1:00", label: "Top-of-hour break check", note: "Ask whether the table wants a five-minute reset before the next pressure beat.", kind: "short" },
    { id: "midpoint-break", targetMinutes: 105, target: "1:45", label: "Longer midpoint break check", note: "Offer a longer reset if the group wants it; resume when everyone is back.", kind: "midpoint" },
    { id: "hour-3-break", targetMinutes: 180, target: "3:00", label: "Top-of-hour break check", note: "Check water, focus, comfort, and whether anyone needs five minutes before the finale closes.", kind: "short" },
    { id: "target-closeout", targetMinutes: 210, target: "3:30", label: "Nominal closeout target", note: "Start landing the ending, rewards, and report choice.", kind: "close" },
    { id: "soft-wall", targetMinutes: 240, target: "4:00", label: "Soft wall", note: "You are in slack time. Move to the fastest satisfying ending.", kind: "wall" },
    { id: "hard-wall", targetMinutes: 300, target: "5:00", label: "Hard wall", note: "Close the session now unless the table explicitly chooses overtime.", kind: "hard-wall" }
  ];
}

function runClockBreakPrompt(elapsedMinutes, state = {}) {
  if (state.breakActive) {
    return `Break active: ${formatClock(Date.now() - Number(state.breakStartedAt || Date.now()))} elapsed. End break when everyone is ready.`;
  }
  const breaks = runClockBreakSchedule();
  const upcoming = breaks.find((item) => elapsedMinutes < item.targetMinutes + 5);
  if (!upcoming) return "Ask the table as needed.";
  const delta = upcoming.targetMinutes - elapsedMinutes;
  if (delta > 5) return `${upcoming.label} near ${upcoming.target}.`;
  if (delta > 0) return `${upcoming.label} coming up: ${upcoming.note}`;
  return `${upcoming.label} is due now: ${upcoming.note}`;
}

function runClockRow(state, elapsedMinutes) {
  const schedule = runClockSchedule();
  if (!schedule.length) return null;
  return schedule[runClockCurrentSegmentIndex(state, elapsedMinutes)] || schedule[0];
}

function runClockNextRow(row) {
  const schedule = runClockSchedule();
  const index = schedule.findIndex((item) => item.id === row?.id);
  return index >= 0 ? schedule[index + 1] : null;
}

function runClockNoticeAllowed(state, notice, now) {
  if (state.permanentlyDismissedNotices?.[notice.id]) return false;
  if (state.dismissedNotices?.[notice.id]) return false;
  const snoozedUntil = Number(state.snoozedNotices?.[notice.id] || 0);
  return !snoozedUntil || snoozedUntil <= now;
}

function pushRunClockNotice(notices, notice) {
  if (!notice?.id) return;
  notices.push({
    persistent: false,
    modalAfterMs: 0,
    autoClearMs: 0,
    action: "",
    ...notice,
  });
}

function runClockRawNotices(state, elapsedMs) {
  const notices = [];
  const elapsedMinutes = elapsedMs / 60000;
  const settings = { ...runClockDefaultSettings(), ...(state.settings || {}) };
  const row = runClockRow(state, elapsedMinutes);
  const targetMs = row ? Number(row.targetEndMinutes || 0) * 60000 : 0;
  const sceneBudgetMs = runClockSceneBudgetMs(state, row);
  const sceneElapsedMs = Math.max(0, elapsedMs - Number(state.sceneStartMs || 0));
  const sceneRemainingMs = sceneBudgetMs - sceneElapsedMs;
  if (settings.softCheckIns && state.status === "running" && elapsedMinutes >= 20) {
    const checkpoint = Math.floor(elapsedMinutes / 25) * 25;
    const checkpointMs = checkpoint * 60000;
    if (checkpoint >= 25 && elapsedMs - checkpointMs >= 0 && elapsedMs - checkpointMs < 60 * 1000) {
      pushRunClockNotice(notices, {
        id: `soft-check-${checkpoint}`,
        severity: "soft",
        title: "Table energy check",
        message: "Quick GM-only check: is the table engaged, comfortable, and clear on the next question?",
        autoClearMs: 12000,
      });
    }
  }
  if (settings.scenePacingAlerts && row && state.currentScene && sceneBudgetMs) {
    const sceneLabel = state.currentSceneTitle || state.currentScene || "Current scene";
    if (sceneRemainingMs <= 2 * 60000 && sceneRemainingMs > 0) {
      pushRunClockNotice(notices, {
        id: `${state.currentScene}-scene-two-minute`,
        severity: "nudge",
        title: "Scene boundary soon",
        message: `${sceneLabel} has about ${formatClock(sceneRemainingMs)} left in its scene budget. Put the next choice or transition on the table.`,
        autoClearMs: 14000,
      });
    }
    if (sceneRemainingMs <= 0 && sceneRemainingMs > -3 * 60000) {
      pushRunClockNotice(notices, {
        id: `${state.currentScene}-scene-overrun`,
        severity: "warning",
        title: "Scene budget reached",
        message: `${sceneLabel} is at its budget. Close the current exchange, reveal, or roll and move forward.`,
        autoClearMs: 18000,
      });
    }
    if (sceneRemainingMs <= -3 * 60000 && sceneRemainingMs > -7 * 60000) {
      pushRunClockNotice(notices, {
        id: `${state.currentScene}-scene-overrun-firm`,
        severity: "alert",
        title: "Scene overrun",
        message: `${sceneLabel} is over by ${formatClock(Math.abs(sceneRemainingMs))}. Make an intentional cut or pay this time from the next scene.`,
        persistent: true,
      });
    }
    if (sceneRemainingMs <= -7 * 60000) {
      pushRunClockNotice(notices, {
        id: `${state.currentScene}-scene-critical`,
        severity: "critical",
        title: "Scene needs a hard cut",
        message: `${sceneLabel} is over by ${formatClock(Math.abs(sceneRemainingMs))}. Summarize the outcome and advance unless this is the finale.`,
        persistent: true,
        modalAfterMs: 60000,
      });
    }
  }
  if (settings.actPacingAlerts && row && targetMs) {
    const remaining = targetMs - elapsedMs;
    const nextRow = runClockNextRow(row);
    const nextLabel = nextRow ? nextRow.label : "the next closing beat";
    if (remaining <= 5 * 60000 && remaining > 1 * 60000) {
      pushRunClockNotice(notices, {
        id: `${row.id}-five-minute-wrap`,
        severity: "nudge",
        title: "Five-minute pacing nudge",
        message: `${row.label} should wrap by ${row.target}. Start looking for the handoff into ${nextLabel}.`,
        autoClearMs: 14000,
      });
    }
    if (remaining <= 1 * 60000 && remaining > 0) {
      pushRunClockNotice(notices, {
        id: `${row.id}-one-minute-wrap`,
        severity: "warning",
        title: "One-minute wrap nudge",
        message: `${row.label} is almost at target. Put the next decision, reveal, or transition in front of the table now.`,
        autoClearMs: 18000,
      });
    }
    if (remaining <= 0 && remaining > -5 * 60000) {
      pushRunClockNotice(notices, {
        id: `${row.id}-transition-now`,
        severity: "alert",
        title: "Transition target reached",
        message: `${row.label} hit its ${row.target} target. Move toward ${nextLabel} unless this table moment is worth buying time.`,
        persistent: true,
      });
    }
    if (remaining <= -5 * 60000) {
      pushRunClockNotice(notices, {
        id: `${row.id}-past-target`,
        severity: "critical",
        title: "Past target",
        message: `${row.label} is over target by ${formatClock(Math.abs(remaining))}. You should be in ${nextLabel} now, or make an intentional cut.`,
        persistent: true,
        modalAfterMs: 90000,
      });
    }
  }
  if (elapsedMs >= runClockSessionPlan.targetMinutes * 60000 && elapsedMs < runClockSessionPlan.softWallMinutes * 60000) {
    pushRunClockNotice(notices, {
      id: "session-target-reached",
      severity: "warning",
      title: "Nominal session target reached",
      message: "The 3:30 target is here. Start landing the current act, rewards, report choice, or epilogue bridge.",
      persistent: true,
    });
  }
  if (elapsedMs >= runClockSessionPlan.softWallMinutes * 60000 && elapsedMs < runClockSessionPlan.hardWallMinutes * 60000) {
    pushRunClockNotice(notices, {
      id: "session-soft-wall",
      severity: "critical",
      title: "Soft wall reached",
      message: "You are past 4:00. Use the fastest satisfying ending and avoid opening new branches.",
      persistent: true,
      modalAfterMs: 30000,
    });
  }
  if (elapsedMs >= runClockSessionPlan.hardWallMinutes * 60000) {
    pushRunClockNotice(notices, {
      id: "session-hard-wall",
      severity: "critical",
      title: "Hard wall reached",
      message: "You are at 5:00. Close the session now unless everyone explicitly chooses overtime.",
      persistent: true,
      modalAfterMs: 1,
    });
  }
  if (settings.hourlyBreakPrompts) {
    runClockBreakSchedule().forEach((item) => {
      const targetMs = Number(item.targetMinutes || 0) * 60000;
      const remaining = targetMs - elapsedMs;
      if (remaining <= 5 * 60000 && remaining > 0) {
        pushRunClockNotice(notices, {
          id: `${item.id}-soon`,
          severity: item.kind === "midpoint" ? "warning" : "nudge",
          title: `${item.label} soon`,
          message: `${item.label} lands at ${item.target}. ${item.note}`,
          autoClearMs: 16000,
        });
      }
      if (remaining <= 0 && remaining > -10 * 60000) {
        pushRunClockNotice(notices, {
          id: `${item.id}-due`,
          severity: item.kind === "midpoint" || item.kind === "wall" || item.kind === "hard-wall" ? "critical" : "break",
          title: `${item.label} due`,
          message: `${item.label}: ${item.note}`,
          persistent: true,
          modalAfterMs: item.kind === "midpoint" ? 30000 : item.kind === "hard-wall" ? 1 : 0,
          action: item.kind === "midpoint" || item.kind === "short" ? "break" : "",
          playerSafe: item.kind === "midpoint" || item.kind === "short",
        });
      }
    });
  }
  return notices;
}

function runClockActiveNotices(state, elapsedMs, now = Date.now()) {
  let changed = false;
  const active = [];
  runClockRawNotices(state, elapsedMs).forEach((notice) => {
    if (!runClockNoticeAllowed(state, notice, now)) return;
    if (!state.noticeFirstSeen[notice.id]) {
      state.noticeFirstSeen[notice.id] = now;
      changed = true;
    }
    const firstSeen = Number(state.noticeFirstSeen[notice.id] || now);
    if (notice.autoClearMs && now - firstSeen > notice.autoClearMs) {
      state.dismissedNotices[notice.id] = now;
      changed = true;
      return;
    }
    active.push(notice);
  });
  runClockActiveNotices.changed = changed;
  return active.sort((a, b) => (runClockSeverityRank[b.severity] || 0) - (runClockSeverityRank[a.severity] || 0));
}

function runClockHighestSeverity(notices) {
  return (notices || []).reduce((best, notice) => {
    return (runClockSeverityRank[notice.severity] || 0) > (runClockSeverityRank[best] || 0) ? notice.severity : best;
  }, "none");
}

function runClockStatusText(state, now = Date.now()) {
  if (state.breakActive) return `Break active for ${formatClock(now - Number(state.breakStartedAt || now))}`;
  if (state.status === "running") return "Running";
  if (state.status === "paused") return "Paused";
  return "Stopped";
}

function runClockMaybeSendPlayerBreakNotice(state, notices, now = Date.now()) {
  if (!state.settings?.playerBreakAlerts) return false;
  let changed = false;
  (notices || []).forEach((notice) => {
    if (!notice.playerSafe || notice.action !== "break" || state.playerBreakNoticesSent?.[notice.id]) return;
    sendPlayerDisplay({
      id: `clock-break-${notice.id}`,
      title: "Break check",
      text: `${notice.title}: ${notice.message}`,
      readAloud: `${notice.title}: ${notice.message}`,
      playerBullets: ["Stretch, refill water, check comfort, and come back when everyone is ready."],
      displayMode: "text-first",
    });
    state.playerBreakNoticesSent[notice.id] = now;
    changed = true;
  });
  return changed;
}

function runClockRenderNotices(host, notices) {
  if (!host) return;
  if (!notices.length) {
    host.innerHTML = `<p class="run-clock-notice-empty">No active pacing notices.</p>`;
    return;
  }
  host.innerHTML = `<div class="run-clock-notice-list">${notices.map((notice) => {
    const breakAction = notice.action === "break"
      ? `<button type="button" data-run-clock-notice-start-break="${escapeAttr(notice.id)}">Start break</button>`
      : "";
    return `<article class="run-clock-notice" data-severity="${escapeAttr(notice.severity)}" data-notice-id="${escapeAttr(notice.id)}">
      <h5>${escapeHtml(notice.title)}</h5>
      <p>${escapeHtml(notice.message)}</p>
      <div class="run-clock-notice-actions">
        ${breakAction}
        <button type="button" data-run-clock-notice-snooze="${escapeAttr(notice.id)}">Snooze 5 min</button>
        <button type="button" data-run-clock-notice-dismiss="${escapeAttr(notice.id)}">Dismiss</button>
        ${notice.severity === "critical" ? `<button type="button" data-run-clock-notice-dismiss-permanent="${escapeAttr(notice.id)}">Stop this alert</button>` : ""}
      </div>
    </article>`;
  }).join("")}</div>`;
}

function runClockEscalatingNotice(state, notices, now = Date.now()) {
  if (!state.settings?.modalEscalation) return null;
  return (notices || []).find((notice) => {
    if (!notice.modalAfterMs || state.modalDismissedNotices?.[notice.id]) return false;
    const firstSeen = Number(state.noticeFirstSeen?.[notice.id] || now);
    return now - firstSeen >= notice.modalAfterMs;
  }) || null;
}

function runClockRenderModal(clock, notice) {
  const modal = clock.querySelector("[data-run-clock-modal]");
  if (!modal) return;
  modal.dataset.noticeId = notice?.id || "";
  if (!notice) {
    modal.hidden = true;
    return;
  }
  modal.hidden = false;
  const title = modal.querySelector("[data-run-clock-modal-title]");
  const message = modal.querySelector("[data-run-clock-modal-message]");
  if (title) title.textContent = notice.title;
  if (message) message.textContent = notice.message;
  window.requestAnimationFrame(() => {
    modal.querySelector("button")?.focus?.();
  });
}

function runClockDismissNotice(id, mode = "dismiss") {
  const state = readRunClockState();
  if (!id) return;
  if (mode === "permanent") {
    state.permanentlyDismissedNotices[id] = Date.now();
  } else if (mode === "modal") {
    state.modalDismissedNotices[id] = Date.now();
  } else {
    state.dismissedNotices[id] = Date.now();
  }
  saveRunClockState(state);
  updateRunClock();
}

function runClockSnoozeNotice(id, minutes = 5) {
  const state = readRunClockState();
  if (!id) return;
  state.snoozedNotices[id] = Date.now() + minutes * 60000;
  saveRunClockState(state);
  updateRunClock();
}

function runClockStartBreak(fromNoticeId = "") {
  const state = readRunClockState();
  if (!state.visible) return;
  const now = Date.now();
  state.elapsedMs = runClockElapsed(state, now);
  state.lastStartedAt = null;
  state.status = "paused";
  state.breakActive = true;
  state.breakStartedAt = now;
  if (fromNoticeId) state.dismissedNotices[fromNoticeId] = now;
  saveRunClockState(state);
  syncRunClockLoop(state);
  updateRunClock();
}

function runClockEndBreak() {
  const state = readRunClockState();
  if (!state.visible) return;
  const now = Date.now();
  if (state.breakActive) {
    state.breakLog.push({ startedAt: state.breakStartedAt || now, endedAt: now });
  }
  state.breakActive = false;
  state.breakStartedAt = null;
  state.status = "running";
  state.lastStartedAt = now;
  saveRunClockState(state);
  syncRunClockLoop(state);
  updateRunClock();
}

function runClockMarkBreakHandled() {
  const state = readRunClockState();
  const now = Date.now();
  const elapsed = runClockElapsed(state, now);
  runClockRawNotices(state, elapsed)
    .filter((notice) => notice.severity === "break" || notice.action === "break" || notice.id.includes("break"))
    .forEach((notice) => {
      state.dismissedNotices[notice.id] = now;
      state.modalDismissedNotices[notice.id] = now;
    });
  saveRunClockState(state);
  updateRunClock();
}

function syncRunClockLoop(state = readRunClockState()) {
  if (state.status === "running" && state.visible) {
    if (!runClockIntervalId) runClockIntervalId = window.setInterval(updateRunClock, 1000);
    return;
  }
  if (runClockIntervalId) {
    window.clearInterval(runClockIntervalId);
    runClockIntervalId = null;
  }
}

function runClockStart() {
  const now = Date.now();
  const state = readRunClockState();
  state.visible = true;
  state.status = "running";
  state.lastStartedAt = now;
  state.breakActive = false;
  state.breakStartedAt = null;
  if (!state.currentScene) runClockApplySlideContext(state, runClockCurrentRenderedSlide(), runClockElapsed(state, now));
  saveRunClockState(state);
  syncRunClockLoop(state);
  updateRunClock();
}

function runClockPauseToggle() {
  const now = Date.now();
  const state = readRunClockState();
  if (!state.visible) return;
  if (state.status === "running") {
    state.elapsedMs = runClockElapsed(state, now);
    state.lastStartedAt = null;
    state.status = "paused";
    state.breakActive = false;
    state.breakStartedAt = null;
  } else if (state.status === "paused") {
    state.status = "running";
    state.lastStartedAt = now;
  }
  saveRunClockState(state);
  syncRunClockLoop(state);
  updateRunClock();
}

function runClockStop() {
  const now = Date.now();
  const state = readRunClockState();
  if (!state.visible) return;
  state.elapsedMs = runClockElapsed(state, now);
  state.lastStartedAt = null;
  state.status = "stopped";
  state.breakActive = false;
  state.breakStartedAt = null;
  saveRunClockState(state);
  syncRunClockLoop(state);
  updateRunClock();
}

function runClockReset(options = {}) {
  const existing = readRunClockState();
  const hasTime = runClockElapsed(existing) > 0 || existing.status === "running" || existing.status === "paused" || existing.breakActive;
  if (options.confirm && hasTime && !confirm("Reset the Run Clock to 00:00 and stop it?")) return;
  const reset = newRunClockState(Date.now(), existing.settings, "stopped");
  reset.visible = true;
  saveRunClockState(reset);
  syncRunClockLoop(reset);
  updateRunClock();
}

function runClockRestart(options = {}) {
  const existing = readRunClockState();
  const hasTime = runClockElapsed(existing) > 0 || existing.status === "running" || existing.status === "paused" || existing.breakActive;
  if (options.confirm && hasTime && !confirm("Restart the Run Clock at 00:00 now?")) return;
  const restart = newRunClockState(Date.now(), existing.settings, "running");
  restart.visible = true;
  saveRunClockState(restart);
  syncRunClockLoop(restart);
  updateRunClock();
}

function updateRunClock() {
  const state = readRunClockState();
  const now = Date.now();
  const clocks = document.querySelectorAll("[data-run-clock]");
  let stateChanged = false;
  clocks.forEach((clock) => {
    if (!state.visible) {
      clock.hidden = true;
      return;
    }
    clock.hidden = false;
    const elapsed = runClockElapsed(state, now);
    const elapsedMinutes = elapsed / 60000;
    const row = runClockRow(state, elapsedMinutes);
    const targetMs = row ? Number(row.targetEndMinutes || 0) * 60000 : 0;
    const remaining = targetMs ? targetMs - elapsed : 0;
    const nextSegmentIndex = runClockCurrentSegmentIndex(state, elapsedMinutes);
    const nextSegmentStartMs = runClockSegmentStartMinutes(nextSegmentIndex) * 60000;
    if (state.segmentIndex !== nextSegmentIndex || state.segmentStartMs !== nextSegmentStartMs) stateChanged = true;
    state.segmentIndex = nextSegmentIndex;
    state.segmentStartMs = nextSegmentStartMs;
    const notices = runClockActiveNotices(state, elapsed, now);
    if (runClockMaybeSendPlayerBreakNotice(state, notices, now)) stateChanged = true;
    const severity = runClockHighestSeverity(notices);
    clock.classList.toggle("is-running", state.status === "running");
    clock.classList.toggle("is-paused", state.status === "paused" && !state.breakActive);
    clock.classList.toggle("is-stopped", state.status === "stopped");
    clock.classList.toggle("is-break", !!state.breakActive || severity === "break");
    clock.classList.toggle("is-nudge", severity === "nudge" || severity === "soft");
    clock.classList.toggle("is-warning", severity === "warning");
    clock.classList.toggle("is-alert", severity === "alert" || severity === "critical");
    clock.classList.toggle("is-critical", severity === "critical");
    clock.querySelectorAll("[data-run-clock-elapsed], [data-run-clock-elapsed-long]").forEach((node) => {
      node.textContent = formatClock(elapsed);
    });
    const sceneLabel = state.currentSceneTitle ? `${state.currentScene}: ${state.currentSceneTitle}` : "";
    const context = sceneLabel || (row && row.label) || "Run clock";
    const target = row ? `Target ${row.target}` : "";
    clock.querySelector("[data-run-clock-context]").textContent = context;
    clock.querySelector("[data-run-clock-target]").textContent = target;
    const sceneBudgetMs = runClockSceneBudgetMs(state, row);
    const sceneElapsedMs = Math.max(0, elapsed - Number(state.sceneStartMs || 0));
    const sceneRemainingMs = sceneBudgetMs - sceneElapsedMs;
    const sceneTarget = state.currentScene
      ? `${state.currentSceneTitle || state.currentScene}: ${sceneRemainingMs < 0 ? "over by " : ""}${formatClock(Math.abs(sceneRemainingMs))}`
      : "No scene target yet.";
    const sceneNode = clock.querySelector("[data-run-clock-scene-target]");
    if (sceneNode) sceneNode.textContent = sceneTarget;
    clock.querySelector("[data-run-clock-current-target]").textContent = row ? `${row.label} ends by ${row.target}` : "No segment target loaded";
    const sessionNode = clock.querySelector("[data-run-clock-session-target]");
    if (sessionNode) sessionNode.textContent = `Target ${formatClock(runClockSessionPlan.targetMinutes * 60000)}; soft wall ${formatClock(runClockSessionPlan.softWallMinutes * 60000)}; hard wall ${formatClock(runClockSessionPlan.hardWallMinutes * 60000)}.`;
    clock.querySelector("[data-run-clock-remaining]").textContent = targetMs ? `${remaining < 0 ? "Segment over by " : ""}${formatClock(Math.abs(remaining))}` : "--";
    const statusNode = clock.querySelector("[data-run-clock-status]");
    if (statusNode) statusNode.textContent = runClockStatusText(state, now);
    const breakNode = clock.querySelector("[data-run-clock-break]");
    if (breakNode) breakNode.textContent = runClockBreakPrompt(elapsedMinutes, state);
    const breakStatus = clock.querySelector("[data-run-clock-break-status]");
    if (breakStatus) breakStatus.textContent = state.breakActive ? `Break active: ${formatClock(now - Number(state.breakStartedAt || now))}` : `Break mode off. ${state.breakLog.length ? `${state.breakLog.length} break${state.breakLog.length === 1 ? "" : "s"} logged.` : ""}`;
    const noticeHost = clock.querySelector("[data-run-clock-notices]");
    runClockRenderNotices(noticeHost, notices);
    runClockRenderModal(clock, runClockEscalatingNotice(state, notices, now));
    clock.querySelectorAll("[data-run-clock-setting]").forEach((input) => {
      input.checked = !!state.settings?.[input.dataset.runClockSetting];
    });
    const scheduleHost = clock.querySelector("[data-run-clock-schedule]");
    if (scheduleHost && !scheduleHost.dataset.rendered) {
      scheduleHost.dataset.rendered = "true";
      const rows = runClockSchedule().map((item) => `
        <tr data-run-clock-row="${escapeAttr(item.id)}">
          <th>${escapeHtml(item.target)}</th>
          <td><strong>${escapeHtml(item.label)}</strong><br><span class="muted">${escapeHtml(item.context || "")}</span></td>
          <td>${escapeHtml(item.lever || "")}</td>
        </tr>`).join("");
      const breakRows = runClockBreakSchedule().map((item) => `
        <tr>
          <th>${escapeHtml(item.target)}</th>
          <td><strong>${escapeHtml(item.label)}</strong></td>
          <td>${escapeHtml(item.note)}</td>
        </tr>`).join("");
      scheduleHost.innerHTML = `<table class="run-clock-table"><thead><tr><th>Target</th><th>Act / scene</th><th>Pacing lever</th></tr></thead><tbody>${rows}</tbody></table>
        <h4>Optional break prompts</h4>
        <table class="run-clock-table"><thead><tr><th>Target</th><th>Break</th><th>GM note</th></tr></thead><tbody>${breakRows}</tbody></table>`;
    }
    clock.querySelectorAll("[data-run-clock-row]").forEach((tr) => {
      tr.classList.toggle("is-current", row && tr.dataset.runClockRow === row.id);
    });
    const startButton = clock.querySelector("[data-run-clock-start]");
    if (startButton) {
      const label = state.status === "running" ? "Running" : state.status === "paused" ? "Resume" : "Start";
      const span = startButton.querySelector("span");
      if (span) span.textContent = label;
      else startButton.textContent = label;
      startButton.disabled = state.status === "running";
    }
    const pauseButton = clock.querySelector("[data-run-clock-pause]");
    if (pauseButton) {
      const label = state.status === "paused" ? "Resume" : "Pause";
      const span = pauseButton.querySelector("span");
      if (span) span.textContent = label;
      else pauseButton.textContent = label;
      pauseButton.disabled = state.status === "stopped";
    }
    const stopButton = clock.querySelector("[data-run-clock-stop]");
    if (stopButton) stopButton.disabled = state.status === "stopped";
  });
  if (runClockActiveNotices.changed || stateChanged) saveRunClockState(state);
  syncRunClockLoop(state);
}

function setupRunClock() {
  const startButtons = document.querySelectorAll("[data-run-clock-start]");
  startButtons.forEach((button) => {
    button.addEventListener("click", () => {
      runClockStart();
    });
  });
  document.querySelectorAll("[data-run-clock-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest("[data-run-clock]")?.querySelector("[data-run-clock-panel]");
      if (!panel) return;
      const nextHidden = !panel.hidden;
      panel.hidden = nextHidden;
      document.querySelectorAll("[data-run-clock-toggle]").forEach((toggle) => {
        if (toggle.closest("[data-run-clock]") === button.closest("[data-run-clock]")) {
          toggle.setAttribute("aria-expanded", String(!nextHidden));
        }
      });
    });
  });
  document.querySelectorAll("[data-run-clock-pause]").forEach((button) => {
    button.addEventListener("click", () => {
      runClockPauseToggle();
    });
  });
  document.querySelectorAll("[data-run-clock-stop]").forEach((button) => {
    button.addEventListener("click", () => {
      runClockStop();
    });
  });
  document.querySelectorAll("[data-run-clock-restart]").forEach((button) => {
    button.addEventListener("click", () => {
      runClockRestart({ confirm: true });
    });
  });
  document.querySelectorAll("[data-run-clock-adjust]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = readRunClockState();
      if (!state.visible) return;
      state.elapsedMs = Math.max(0, runClockElapsed(state) + Number(button.dataset.runClockAdjust || 0));
      state.lastStartedAt = state.status === "running" ? Date.now() : null;
      state.dismissedNotices = {};
      state.noticeFirstSeen = {};
      saveRunClockState(state);
      updateRunClock();
    });
  });
  document.querySelectorAll("[data-run-clock-break-start]").forEach((button) => {
    button.addEventListener("click", () => runClockStartBreak());
  });
  document.querySelectorAll("[data-run-clock-break-end]").forEach((button) => {
    button.addEventListener("click", () => runClockEndBreak());
  });
  document.querySelectorAll("[data-run-clock-break-done]").forEach((button) => {
    button.addEventListener("click", () => runClockMarkBreakHandled());
  });
  document.querySelectorAll("[data-run-clock-setting]").forEach((input) => {
    input.addEventListener("change", () => {
      const state = readRunClockState();
      state.settings = { ...runClockDefaultSettings(), ...(state.settings || {}), [input.dataset.runClockSetting]: !!input.checked };
      saveRunClockState(state);
      updateRunClock();
    });
  });
  document.querySelectorAll("[data-run-clock-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      runClockReset({ confirm: true });
    });
  });
  document.querySelectorAll("[data-run-clock-advance]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = readRunClockState();
      if (!state.visible) return;
      const schedule = runClockSchedule();
      const current = runClockRow(state, runClockElapsed(state) / 60000);
      const currentIndex = Math.max(0, schedule.findIndex((row) => row.id === current?.id));
      const nextIndex = Math.min(schedule.length - 1, currentIndex + 1);
      state.scheduleIndexOverride = nextIndex;
      state.currentScheduleId = schedule[nextIndex]?.id || "";
      state.segmentIndex = nextIndex;
      state.segmentStartMs = runClockElapsed(state);
      state.currentScene = "";
      state.currentSceneTitle = "";
      state.sceneIndex = 0;
      state.sceneStartMs = runClockElapsed(state);
      saveRunClockState(state);
      updateRunClock();
    });
  });
  document.addEventListener("click", (event) => {
    const dismiss = event.target.closest("[data-run-clock-notice-dismiss]");
    if (dismiss) {
      runClockDismissNotice(dismiss.dataset.runClockNoticeDismiss, "dismiss");
      return;
    }
    const dismissPermanent = event.target.closest("[data-run-clock-notice-dismiss-permanent]");
    if (dismissPermanent) {
      runClockDismissNotice(dismissPermanent.dataset.runClockNoticeDismissPermanent, "permanent");
      return;
    }
    const snooze = event.target.closest("[data-run-clock-notice-snooze]");
    if (snooze) {
      runClockSnoozeNotice(snooze.dataset.runClockNoticeSnooze, 5);
      return;
    }
    const startBreak = event.target.closest("[data-run-clock-notice-start-break]");
    if (startBreak) {
      runClockStartBreak(startBreak.dataset.runClockNoticeStartBreak || "");
      return;
    }
    const modalDismiss = event.target.closest("[data-run-clock-modal-dismiss]");
    if (modalDismiss) {
      const id = modalDismiss.closest("[data-run-clock-modal]")?.dataset.noticeId || "";
      runClockDismissNotice(id, "modal");
      return;
    }
    const modalPermanent = event.target.closest("[data-run-clock-modal-dismiss-permanent]");
    if (modalPermanent) {
      const id = modalPermanent.closest("[data-run-clock-modal]")?.dataset.noticeId || "";
      runClockDismissNotice(id, "permanent");
      return;
    }
    const modalSnooze = event.target.closest("[data-run-clock-modal-snooze]");
    if (modalSnooze) {
      const id = modalSnooze.closest("[data-run-clock-modal]")?.dataset.noticeId || "";
      runClockSnoozeNotice(id, 5);
    }
  });
  window.addEventListener("goldspire-run-slide-rendered", (event) => {
    const slide = event.detail?.slide || {};
    if (!slide.id || !readRunClockState().visible) return;
    const state = readRunClockState();
    runClockApplySlideContext(state, slide, runClockElapsed(state));
    saveRunClockState(state);
    updateRunClock();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === runClockKey) updateRunClock();
  });
  updateRunClock();
  syncRunClockLoop();
}

setupTheme();
setupRunClock();
setupQuickNavigation();
setupCollapsibleWikiSections();
setupFilters();
setupLightbox();
setupHoverCards();
setupDevToggles();
setupRulesDrawer();
setupRuleSearchInputs();
setupQuickReference();
setupRunMode();
setupStateConsole();
setupSceneProgress();
setupShowPlayerButtons();
setupSessionZeroTools();
setupPcProfiles();
setupEntityIndex();
setupPlayerSafeActions();
setupHandoutExportFilters();
setupExportOptions();
setupPlayerDisplay();
updateDashboardSummary();
