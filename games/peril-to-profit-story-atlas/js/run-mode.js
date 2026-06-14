
(function () {
  const STORAGE_KEY = "goldspire-run-mode-state-v1";
  const GM_STATE_KEY = "goldspire-atlas-gm-state-v2";
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
    ["P", "Pin current slide"],
    ["M", "Mark slide complete"],
    ["?", "Shortcut help"],
    ["1-5", "GM Cheat, Conditions, Slider, PC Sheet, Pronunciation"],
  ];
  let slides = [];
  let state = readState();
  let lastDialogOpener = null;

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

  async function loadSlides() {
    if (Array.isArray(window.GOLDSPIRE_SLIDES)) return window.GOLDSPIRE_SLIDES;
    try {
      const response = await fetch("data/slides.json");
      return await response.json();
    } catch {
      return [];
    }
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
      autoCompletePreviousSceneOnNext: true,
      syncOnSlideChange: true,
    };
  }

  function normalizeState() {
    state = { ...defaultState(), ...state };
    if (!slides.some((slide) => slide.id === state.currentSlideId)) state.currentSlideId = slides[0]?.id || "";
    for (const key of ["completedSlides", "pinnedSlides", "revealedSlides"]) {
      if (!Array.isArray(state[key])) state[key] = [];
    }
    saveState();
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

  function playerProjection(slide) {
    return {
      id: slide.id,
      type: slide.type,
      sectionId: slide.sectionId,
      sectionTitle: slide.sectionTitle,
      title: slide.title,
      shortTitle: slide.shortTitle,
      order: slide.order,
      playerSafe: !!slide.playerSafe,
      completionEligible: !!slide.completionEligible,
      image: slide.image || "",
      alt: slide.alt || slide.title,
      caption: slide.caption || "",
      mood: slide.mood || "",
      publicObjective: slide.publicObjective || "",
      readAloud: slide.readAloud || "",
      slideNumber: slide.slideNumber,
      totalSlides: slide.totalSlides,
    };
  }

  function send(type, payload = {}) {
    const slide = currentSlide();
    return window.GoldspireDisplaySync?.send({
      protocol: "goldspire-run-sync-v1",
      type,
      slideId: slide?.id,
      payload: { slide: playerProjection(slide), ...payload },
      source: "gm-run-mode",
    });
  }

  function openPlayerDisplay() {
    const slide = currentSlide();
    window.open(`player-display.html?slide=${encodeURIComponent(slide.id)}`, "_blank", "noopener");
    send("setSlide", { displayMode: "image-title-caption" });
  }

  function render() {
    const slide = currentSlide();
    if (!slide) return;
    document.title = `${slide.title} - Run Mode`;
    const select = document.querySelector("#run-slide-select");
    if (select) select.value = slide.id;
    document.querySelector("#run-position").textContent = `Slide ${currentIndex() + 1} / ${slides.length} - ${slide.id}`;
    const auto = document.querySelector("#run-auto-complete");
    if (auto) auto.checked = !!state.autoCompletePreviousSceneOnNext;
    const sync = document.querySelector("#run-sync-on-change");
    if (sync) sync.checked = !!state.syncOnSlideChange;
    const root = document.querySelector("[data-slide-root]");
    root.innerHTML = slideMarkup(slide);
    renderScrubber();
    bindRenderedSlide();
    saveState();
    if (state.syncOnSlideChange) send("setSlide", { displayMode: "image-title-caption" });
  }

  function slideMarkup(slide) {
    const hasImage = !!slide.image;
    const isCheat = slide.type === "cheat";
    const media = hasImage
      ? `<figure class="slide-media"><button type="button" data-run-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.alt || slide.title)}"></button><figcaption>${escapeHtml(slide.caption || "")}</figcaption></figure>`
      : `<div class="slide-media slide-divider-art"><p>${escapeHtml(slide.caption || slide.sectionTitle || "")}</p></div>`;
    return `
      <section class="slide-main">
        ${media}
        <div class="slide-copy">
          <div class="slide-meta-row">
            <span class="slide-pill">${escapeHtml(slide.id)}</span>
            <span class="slide-pill">${escapeHtml(slide.sectionTitle || "")}</span>
            <span class="slide-pill">${escapeHtml(slide.type || "")}</span>
            ${state.completedSlides.includes(slide.id) ? '<span class="slide-pill">Complete</span>' : ""}
            ${state.pinnedSlides.includes(slide.id) ? '<span class="slide-pill">Pinned</span>' : ""}
          </div>
          <h2>${escapeHtml(slide.title)}</h2>
          ${slide.gmGoal ? `<p class="slide-goal"><strong>GM goal:</strong> ${escapeHtml(slide.gmGoal)}</p>` : ""}
          ${slide.publicObjective ? `<p class="slide-objective"><strong>Public objective:</strong> ${escapeHtml(slide.publicObjective)}</p>` : ""}
          <div class="slide-action-row">
            <button type="button" data-run-action="show-image" aria-label="Show image to players">Show Image</button>
            <button type="button" data-run-action="show-text" aria-label="Show player text to players">Show Text</button>
            <button type="button" data-run-action="copy-text" aria-label="Copy player text">Copy Text</button>
            <button type="button" data-run-action="open-text-window" aria-label="Open player text in new window">Open Text Window</button>
            <button type="button" data-run-action="print-text" aria-label="Print player text">Print Text</button>
            <button type="button" data-run-action="expand-text" aria-label="Expand read-aloud text">Fullscreen Text</button>
          </div>
        </div>
      </section>
      <aside class="slide-rail">
        <details class="slide-panel" id="slide-readaloud">
          <summary>Player-facing read-aloud</summary>
          <p>${escapeHtml(slide.readAloud || slide.publicObjective || slide.caption || "No read-aloud text on this slide.")}</p>
        </details>
        ${entityPanel(slide)}
        ${statePanel(slide)}
        ${rollPanel(slide)}
        <details class="slide-panel">
          <summary>GM notes</summary>
          ${listMarkup(slide.gmNotes || [], isCheat ? "No cheat notes." : "No GM notes for this slide.")}
        </details>
        <details class="slide-panel">
          <summary>Fear, choices, loot, questions</summary>
          <h3>Fear spend ideas</h3>${listMarkup(slide.fearSpends || [], "No Fear spends listed.")}
          <h3>Choices and consequences</h3>${choiceMarkup(slide.choicesConsequences || [])}
          <h3>Loot / clues</h3>${listMarkup(slide.lootClues || [], "No loot or clue panel for this slide.")}
          <h3>Player questions</h3>${listMarkup(slide.playerQuestions || [], "No player questions listed.")}
        </details>
      </aside>`;
  }

  function listMarkup(items, empty) {
    const rows = (items || []).filter(Boolean);
    if (!rows.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
    return `<ul>${rows.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function choiceMarkup(items) {
    if (!items.length) return '<p class="muted">No choice/consequence entries for this slide.</p>';
    return `<ul>${items.map((item) => `<li><strong>${escapeHtml(item.choice || "Choice")}:</strong> ${escapeHtml(item.consequence || "")} ${item.payoff ? `<em>${escapeHtml(item.payoff)}</em>` : ""}</li>`).join("")}</ul>`;
  }

  function entityPanel(slide) {
    const entities = slide.entities || [];
    if (!entities.length) return '<details class="slide-panel"><summary>Key entities</summary><p class="muted">No key entities on this slide.</p></details>';
    const rows = entities.map((entity) => {
      const href = `pages/entities/${encodeURIComponent(entity.id)}.html`;
      const icon = entity.icon ? `<img src="${escapeAttr(entity.icon)}" alt="">` : "";
      return `<a class="entity-quick-chip" href="${href}" data-entity-id="${escapeAttr(entity.id)}">${icon}<span>${escapeHtml(entity.name)}</span></a>`;
    }).join("");
    return `<details class="slide-panel" open><summary>Key entities</summary><div class="entity-chip-row">${rows}</div></details>`;
  }

  function statePanel(slide) {
    const controls = slide.stateControls || [];
    if (!controls.length) return '<details class="slide-panel"><summary>Relevant state controls</summary><p class="muted">No contextual state controls here.</p></details>';
    return `<details class="slide-panel" open><summary>Relevant state controls</summary><div class="state-control-list">${controls.map(stateControlMarkup).join("")}</div></details>`;
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
    if (!cards.length) return '<details class="slide-panel"><summary>Roll cards</summary><p>No roll needed unless uncertainty or pressure makes a roll useful.</p></details>';
    return `<details class="slide-panel"><summary>Roll cards</summary>${cards.map((card) => {
      const bands = card.bands || {};
      return `<article class="roll-mini-card"><h3>${escapeHtml(card.title || "Roll")}</h3><p><strong>Traits:</strong> ${escapeHtml((card.trait_options || []).join(", "))} <strong>Hinge:</strong> ${escapeHtml(card.difficulty || "")}</p><p>${escapeHtml(card.roll || "")}</p><ul><li><strong>Botch:</strong> ${escapeHtml(bands.botch || "")}</li><li><strong>Hit:</strong> ${escapeHtml(bands.hit || "")}</li><li><strong>Soar:</strong> ${escapeHtml(bands.soar || "")}</li><li><strong>Fear:</strong> ${escapeHtml(card.fear_spin || "")}</li></ul></article>`;
    }).join("")}</details>`;
  }

  function renderScrubber() {
    const scrubber = document.querySelector("[data-slide-scrubber]");
    scrubber.innerHTML = slides.map((slide) => {
      const classes = [
        "scrub-dot",
        slide.id === state.currentSlideId ? "is-current" : "",
        state.completedSlides.includes(slide.id) ? "is-complete" : "",
        state.pinnedSlides.includes(slide.id) ? "is-pinned" : "",
        slide.type === "section" || slide.type === "act-divider" ? "is-section" : "",
      ].filter(Boolean).join(" ");
      return `<button class="${classes}" type="button" data-scrub-slide-id="${escapeAttr(slide.id)}" title="${escapeAttr(`${slide.slideNumber}. ${slide.sectionTitle} - ${slide.title}`)}" aria-label="Go to slide ${escapeAttr(slide.slideNumber)}: ${escapeAttr(slide.title)}"></button>`;
    }).join("");
  }

  function bindRenderedSlide() {
    document.querySelectorAll("[data-slide-state-field]").forEach((field) => {
      field.addEventListener("change", () => {
        const gmState = readGmState();
        if (field.type === "checkbox") gmState[field.dataset.slideStateField] = field.checked;
        else if (field.type === "number") gmState[field.dataset.slideStateField] = Number(field.value);
        else gmState[field.dataset.slideStateField] = field.value;
        writeGmState(gmState);
      });
    });
  }

  function goTo(id, options = {}) {
    const nextIndex = slides.findIndex((slide) => slide.id === id);
    if (nextIndex < 0) return;
    const previous = currentSlide();
    const next = slides[nextIndex];
    if (options.autoComplete && previous?.completionEligible && previous.id !== next.id) markComplete(previous.id, true);
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

  function togglePinned() {
    const id = currentSlide().id;
    const set = new Set(state.pinnedSlides || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    state.pinnedSlides = [...set];
    saveState();
    render();
  }

  function toggleComplete() {
    const id = currentSlide().id;
    markComplete(id, !state.completedSlides.includes(id));
    render();
  }

  async function copyText(markdown = false) {
    const slide = currentSlide();
    const text = slide.readAloud || slide.publicObjective || slide.caption || slide.title;
    const output = markdown ? text.split(/\n+/).map((line) => `> ${line}`).join("\n") : text;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      window.prompt("Copy player text:", output);
    }
    return output;
  }

  function openTextWindow(printNow = false) {
    const slide = currentSlide();
    const text = slide.readAloud || slide.publicObjective || slide.caption || "";
    const win = window.open("", "_blank", "popup=yes,width=900,height=700");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(slide.title)}</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:3rem;background:#fff;color:#111}h1{font-size:2.4rem}p{font-size:2rem;line-height:1.35}</style></head><body><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(text)}</p></body></html>`);
    win.document.close();
    if (printNow) win.print();
  }

  function openImageDialog() {
    const slide = currentSlide();
    if (!slide.image) return;
    lastDialogOpener = document.activeElement;
    const dialog = document.querySelector("#run-image-dialog");
    document.querySelector("#run-expanded-image").src = slide.image;
    document.querySelector("#run-expanded-image").alt = slide.alt || slide.title;
    document.querySelector("#run-expanded-caption").textContent = slide.caption || "";
    document.querySelector("#run-expanded-raw").href = slide.image;
    dialog.showModal();
  }

  function openTextDialog() {
    const slide = currentSlide();
    lastDialogOpener = document.activeElement;
    document.querySelector("#run-expanded-text-title").textContent = slide.title;
    document.querySelector("#run-expanded-text").textContent = slide.readAloud || slide.publicObjective || slide.caption || "";
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

  function handleAction(action) {
    if (action === "first") goTo(slides[0].id);
    if (action === "last") goTo(slides[slides.length - 1].id);
    if (action === "previous") go(-1);
    if (action === "next") go(1);
    if (action === "show-image") send("showImage", { displayMode: "image-only" });
    if (action === "show-text") { send("showText", { displayMode: "read-aloud-fullscreen" }); markRevealed(); }
    if (action === "show-objective") send("showObjective", { displayMode: "public-objective" });
    if (action === "blackout") send("blackout", { displayMode: "blackout" });
    if (action === "open-display") openPlayerDisplay();
    if (action === "copy-text") copyText(false);
    if (action === "copy-discord") copyText(true);
    if (action === "open-text-window") openTextWindow(false);
    if (action === "print-text") openTextWindow(true);
    if (action === "expand-image") openImageDialog();
    if (action === "expand-text") openTextDialog();
    if (action === "toggle-complete") toggleComplete();
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

  function bindStaticControls() {
    document.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-run-action]");
      if (actionButton) handleAction(actionButton.dataset.runAction);
      const scrub = event.target.closest("[data-scrub-slide-id]");
      if (scrub) goTo(scrub.dataset.scrubSlideId);
      const goSlide = event.target.closest("[data-run-go-slide]");
      if (goSlide) goTo(goSlide.dataset.runGoSlide);
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
      if (event.key === "ArrowRight" && event.shiftKey) { event.preventDefault(); goSection(1); return; }
      if (event.key === "ArrowLeft" && event.shiftKey) { event.preventDefault(); goSection(-1); return; }
      if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); go(1); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); return; }
      if (event.key === "Home") { event.preventDefault(); goTo(slides[0].id); return; }
      if (event.key === "End") { event.preventDefault(); goTo(slides[slides.length - 1].id); return; }
      const key = event.key.toLowerCase();
      if (key === "f") handleAction("fullscreen");
      if (key === "b") handleAction("blackout");
      if (key === "r") handleAction("show-text");
      if (key === "i") handleAction("show-image");
      if (key === "o") handleAction("open-display");
      if (key === "c") handleAction("copy-text");
      if (key === "p") handleAction("pin");
      if (key === "m") handleAction("toggle-complete");
      if (event.key === "?") showShortcuts();
      const cheat = { "1": "CHEAT-GM", "2": "CHEAT-CONDITIONS", "3": "CHEAT-SLIDER", "4": "CHEAT-PC", "5": "CHEAT-PRONUNCIATION" }[event.key];
      if (cheat) goTo(cheat);
    });
  }

  async function init() {
    slides = (await loadSlides()).sort((a, b) => a.order - b.order);
    normalizeState();
    const params = new URLSearchParams(location.search);
    const hash = location.hash.replace(/^#slide=?/, "").replace(/^#scene=?/, "");
    const requested = params.get("slide") || params.get("scene") || hash;
    if (requested && slides.some((slide) => slide.id === requested)) state.currentSlideId = requested;
    const select = document.querySelector("#run-slide-select");
    select.innerHTML = slides.map((slide) => `<option value="${escapeAttr(slide.id)}">${escapeHtml(`${slide.slideNumber}. ${slide.id} - ${slide.title}`)}</option>`).join("");
    bindStaticControls();
    bindKeyboard();
    render();
  }

  init();
})();
