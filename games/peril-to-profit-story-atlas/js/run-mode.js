
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
      imageCollapsed: false,
      filmstripCollapsed: true,
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

  function runIcon(action, label, icon, danger = false, shortLabel = "") {
    const classes = danger ? "run-icon-button danger" : "run-icon-button";
    const short = shortLabel ? ` data-short-label="${escapeAttr(shortLabel)}"` : "";
    return `<button class="${classes}" type="button" data-run-action="${escapeAttr(action)}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}"${short}><img src="assets/icons/${escapeAttr(icon)}" alt="" aria-hidden="true"><span class="sr-only">${escapeHtml(label)}</span></button>`;
  }

  function fallbackImage(slide) {
    if (slide.image) return slide.image;
    const key = `${slide.id} ${slide.sectionId || ""} ${slide.sectionTitle || ""}`.toLowerCase();
    if (key.includes("act-one") || key.includes("logistics")) return "assets/scenes/S01-01-entering-sablewoodtm-logistics-preserve.png";
    if (key.includes("act-two") || key.includes("cargo")) return "assets/scenes/S02-03-bramble-union-ambush.png";
    if (key.includes("act-three") || key.includes("hush")) return "assets/scenes/S03-01-arrival-at-hush.png";
    if (key.includes("act-four") || key.includes("hanging")) return "assets/scenes/S04-02-the-hanging-office-exterior.png";
    if (key.includes("act-five") || key.includes("ward")) return "assets/scenes/S05-01-open-valetm-ritual-site.png";
    if (key.includes("epilogue") || key.includes("relay")) return "assets/scenes/S06-02-the-relay-spire-hook.png";
    if (key.includes("prologue") || key.includes("contract")) return "assets/scenes/S00-01-the-job.png";
    if (key.includes("conditions")) return "assets/entities/vulnerable.png";
    if (key.includes("slider")) return "assets/entities/slider-system.png";
    if (key.includes("loot")) return "assets/entities/hexmart-pocket-wardtm-cracked.png";
    if (key.includes("pronunciation")) return "assets/entities/party-reference.png";
    return "assets/entities/party-reference.png";
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
    if (filmstripButton) {
      const label = state.filmstripCollapsed ? "Show filmstrip" : "Hide filmstrip";
      filmstripButton.setAttribute("aria-label", label);
      filmstripButton.setAttribute("title", label);
      const text = filmstripButton.querySelector(".run-button-label");
      if (text) text.textContent = label;
    }
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
      image: fallbackImage(slide),
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
    const sent = window.GoldspireDisplaySync?.send({
      protocol: "goldspire-run-sync-v1",
      type,
      slideId: slide?.id,
      payload: { slide: playerProjection(slide), ...payload },
      source: "gm-run-mode",
    });
    return sent;
  }

  function openPlayerDisplay() {
    const slide = currentSlide();
    window.open(`player-display.html?slide=${encodeURIComponent(slide.id)}`, "_blank", "noopener");
    send("setSlide", { displayMode: "image-title-caption" });
    showStatus("Opened Player Display");
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
    applyViewState();
    root.innerHTML = slideMarkup(slide);
    renderScrubber();
    bindRenderedSlide();
    saveState();
    if (state.syncOnSlideChange) send("setSlide", { displayMode: "image-title-caption" });
  }

  function slideMarkup(slide) {
    const image = fallbackImage(slide);
    const hasImage = !!image;
    const isCheat = slide.type === "cheat";
    const media = hasImage
      ? `<figure class="slide-media"><button type="button" data-run-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(image)}" alt="${escapeAttr(slide.alt || slide.title)}"></button><figcaption>${escapeHtml(slide.caption || "")}</figcaption></figure>`
      : `<div class="slide-media slide-divider-art"><p>${escapeHtml(slide.caption || slide.sectionTitle || "")}</p></div>`;
    const detailStack = isCheat ? cheatReferencePanel(slide) : sceneDetailStack(slide);
    return `
      <section class="slide-main">
        ${media}
        <div class="slide-copy">
          <div class="slide-meta-row">
            <span class="slide-pill">${escapeHtml(slide.id)}</span>
            ${slide.sectionTitle && slide.sectionTitle !== slide.id ? `<span class="slide-pill">${escapeHtml(slide.sectionTitle)}</span>` : ""}
            ${slide.type ? `<span class="slide-pill">${escapeHtml(slide.type)}</span>` : ""}
            <label class="complete-current"><input type="checkbox" data-run-current-complete ${state.completedSlides.includes(slide.id) ? "checked" : ""}> Complete</label>
            ${state.pinnedSlides.includes(slide.id) ? '<span class="slide-pill">Pinned</span>' : ""}
            ${state.lastAutoCompletedSlideId ? `<button class="undo-complete-button" type="button" data-run-action="undo-complete">Undo auto-complete: ${escapeHtml(state.lastAutoCompletedSlideId)}</button>` : ""}
          </div>
          <h2>${escapeHtml(slide.title)}</h2>
          ${slide.gmGoal ? `<p class="slide-goal"><strong>GM goal:</strong> ${linkifyEntities(slide.gmGoal)}</p>` : ""}
          ${slide.publicObjective ? `<p class="slide-objective"><strong>Public objective:</strong> ${linkifyEntities(slide.publicObjective)}</p>` : ""}
          <div class="slide-action-group" aria-label="Player display and text actions">
            <p class="slide-action-group-label">Player Display / Text</p>
            <div class="slide-action-row">
              ${runIcon("show-image", "Send image to Player Display", "action-open-image.png", false, "Image")}
              ${runIcon("show-text", "Send read-aloud to Player Display", "action-reveal.png", false, "Text")}
              ${runIcon("copy-text", "Copy player text", "action-copy.png", false, "Copy")}
              ${runIcon("open-text-window", "Open player text in new window", "action-open-window.png", false, "Open")}
              ${runIcon("print-text", "Print player text", "action-print.png", false, "Print")}
              ${runIcon("expand-text", "Fullscreen read-aloud text", "action-fullscreen.png", false, "Full")}
            </div>
          </div>
          ${detailStack}
        </div>
      </section>`;
  }

  function sceneDetailStack(slide) {
    return `<div class="run-detail-stack">
      <details class="slide-panel" id="slide-readaloud" open>
        <summary>Player-facing read-aloud</summary>
        <p>${linkifyEntities(slide.readAloud || slide.publicObjective || slide.caption || "No read-aloud text on this slide.")}</p>
      </details>
      ${entityPanel(slide)}
      ${statePanel(slide)}
      ${rollPanel(slide)}
      <details class="slide-panel">
        <summary>GM notes</summary>
        ${linkifyList(slide.gmNotes || [], "No GM notes for this slide.")}
      </details>
      ${runTablePanel(slide)}
    </div>`;
  }

  function cheatReferencePanel(slide) {
    return `<div class="run-detail-stack">
      <section class="slide-panel cheat-reference" aria-label="Cheat sheet reference">
        <h3>Reference</h3>
        ${listMarkup(slide.gmNotes || [], "No cheat notes available.").replace("<ul>", '<ul class="cheat-reference-list">')}
      </section>
      ${statePanel(slide)}
      ${entityPanel(slide)}
    </div>`;
  }

  function runTablePanel(slide) {
    const hasContent = (slide.fearSpends || []).length || (slide.choicesConsequences || []).length || (slide.lootClues || []).length || (slide.playerQuestions || []).length || (slide.relationshipPrompts || []).length || slide.ownershipPrompt;
    const open = hasContent ? " open" : "";
    return `<details class="slide-panel"${open}>
      <summary>Fear, choices, loot, questions</summary>
      <h3>Fear spend ideas</h3>${listMarkup(slide.fearSpends || [], "No Fear spends listed.")}
      <h3>Choices and consequences</h3>${choiceMarkup(slide.choicesConsequences || [])}
      <h3>Loot / clues</h3>${listMarkup(slide.lootClues || [], "No loot or clue panel for this slide.")}
      <h3>Player questions</h3>${listMarkup(slide.playerQuestions || [], "No player questions listed.")}
      <h3>Relationship prompts</h3>${listMarkup(slide.relationshipPrompts || [], "No relationship prompt listed.")}
      <h3>Scene ownership prompt</h3><p>${escapeHtml(slide.ownershipPrompt || "No ownership prompt listed.")}</p>
    </details>`;
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
      return `<a class="entity-quick-chip" href="${href}" data-entity="${escapeAttr(entity.id)}">${icon}<span>${escapeHtml(entity.name)}</span></a>`;
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
    return `<details class="slide-panel" open><summary>Roll cards</summary>${cards.map((card) => {
      const bands = card.bands || {};
      const official = card.official_results || {};
      const officialRows = [
        ["critical_success", "Critical Success"],
        ["success_with_hope", "Success with Hope"],
        ["success_with_fear", "Success with Fear"],
        ["failure_with_hope", "Failure with Hope"],
        ["failure_with_fear", "Failure with Fear"]
      ].map(([key, label]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(official[key] || "")}</li>`).join("");
      const sliderRows = ["botch", "miss", "hit", "clean", "soar", "crit"].map((band) => `<li><strong>${escapeHtml(band.charAt(0).toUpperCase() + band.slice(1))}:</strong> ${escapeHtml(bands[band] || "")}</li>`).join("");
      return `<article class="roll-mini-card"><h3>${escapeHtml(card.title || "Roll")}</h3><p><strong>Traits:</strong> ${escapeHtml((card.trait_options || []).join(", "))} <strong>Difficulty:</strong> ${escapeHtml(card.difficulty || "")}</p><p>${escapeHtml(card.roll || "")}</p><h4>Official Daggerheart Results</h4><ul>${officialRows}</ul><h4>Kyle Slider / House Overlay</h4><ul>${sliderRows}</ul></article>`;
    }).join("")}</details>`;
  }

  function renderScrubber() {
    const scrubber = document.querySelector("[data-slide-scrubber]");
    scrubber.innerHTML = slides.map((slide) => {
      const image = fallbackImage(slide);
      const classes = [
        "scrub-dot",
        slide.id === state.currentSlideId ? "is-current" : "",
        state.completedSlides.includes(slide.id) ? "is-complete" : "",
        state.pinnedSlides.includes(slide.id) ? "is-pinned" : "",
        slide.type === "section" || slide.type === "act-divider" ? "is-section" : "",
      ].filter(Boolean).join(" ");
      return `<button class="${classes}" type="button" data-scrub-slide-id="${escapeAttr(slide.id)}" title="${escapeAttr(`${slide.slideNumber}. ${slide.sectionTitle} - ${slide.title}`)}" aria-label="Go to slide ${escapeAttr(slide.slideNumber)}: ${escapeAttr(slide.title)}"><img src="${escapeAttr(image)}" alt=""><span>${escapeHtml(`${slide.slideNumber}. ${slide.title}`)}</span></button>`;
    }).join("");
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
    const set = new Set(state.pinnedSlides || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    state.pinnedSlides = [...set];
    saveState();
    showStatus(set.has(id) ? "Slide pinned" : "Slide unpinned");
    render();
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
    const text = slide.readAloud || slide.publicObjective || slide.caption || slide.title;
    const output = markdown ? text.split(/\n+/).map((line) => `> ${line}`).join("\n") : text;
    try {
      await navigator.clipboard.writeText(output);
      showStatus(markdown ? "Copied Markdown quote" : "Copied player text");
    } catch {
      window.prompt("Copy player text:", output);
      showStatus("Copy fallback opened");
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
    showStatus(printNow ? "Print window opened" : "Player text window opened");
  }

  function openImageDialog() {
    const slide = currentSlide();
    if (!fallbackImage(slide)) return;
    lastDialogOpener = document.activeElement;
    const dialog = document.querySelector("#run-image-dialog");
    document.querySelector("#run-expanded-image").src = fallbackImage(slide);
    document.querySelector("#run-expanded-image").alt = slide.alt || slide.title;
    document.querySelector("#run-expanded-caption").textContent = slide.caption || "";
    document.querySelector("#run-expanded-raw").href = fallbackImage(slide);
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
    if (action === "show-image") { send("showImage", { displayMode: "image-only" }); showStatus("Sent image to Player Display"); }
    if (action === "show-text") { send("showText", { displayMode: "read-aloud-fullscreen" }); markRevealed(); showStatus("Sent text to Player Display"); }
    if (action === "show-objective") { send("showObjective", { displayMode: "public-objective" }); showStatus("Sent objective to Player Display"); }
    if (action === "blackout") { send("blackout", { displayMode: "blackout" }); showStatus("Player Display blacked out"); }
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
    if (action === "copy-text") copyText(false);
    if (action === "copy-discord") copyText(true);
    if (action === "open-text-window") openTextWindow(false);
    if (action === "print-text") openTextWindow(true);
    if (action === "expand-image") openImageDialog();
    if (action === "expand-text") openTextDialog();
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
  function entityMap() { return window.ATLAS_ENTITIES || {}; }
  function entityWikiHref(entity) { return `pages/entities/${encodeURIComponent(entity.id)}.html`; }
  function buildEntityIndex() {
    const map = new Map();
    const names = [];
    Object.values(entityMap()).forEach((entity) => {
      if (!entity || !entity.id) return;
      map.set(entity.id, entity);
      [entity.name, ...(entity.aliases || [])].filter(Boolean).forEach((label) => {
        if (String(label).length >= 3) names.push({ name: String(label), id: entity.id });
      });
    });
    names.sort((a, b) => b.name.length - a.name.length);
    return { map, names };
  }
  function linkifyEntities(text) {
    if (!text) return "";
    const escaped = escapeHtml(text);
    if (!ENTITY_INDEX) ENTITY_INDEX = buildEntityIndex();
    if (!ENTITY_INDEX.names.length) return escaped;
    const matches = [];
    const usedId = new Set();
    for (const item of ENTITY_INDEX.names) {
      if (usedId.has(item.id)) continue;
      const safe = escapeHtml(item.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let re;
      try { re = new RegExp(`(?<![\\w])(${safe})(?![\\w])`, "i"); } catch (err) { re = new RegExp(`\\b(${safe})\\b`, "i"); }
      const m = re.exec(escaped);
      if (m) { matches.push({ start: m.index, end: m.index + m[0].length, id: item.id, text: m[0] }); usedId.add(item.id); }
    }
    matches.sort((a, b) => a.start - b.start);
    const clean = [];
    let lastEnd = -1;
    for (const m of matches) { if (m.start >= lastEnd) { clean.push(m); lastEnd = m.end; } }
    if (!clean.length) return escaped;
    let out = "";
    let cursor = 0;
    for (const m of clean) {
      const entity = ENTITY_INDEX.map.get(m.id);
      const cls = (entity.meta && entity.meta.class) || "";
      out += escaped.slice(cursor, m.start);
      out += `<a class="entity-link ${escapeAttr(cls)} inline-entity-link" data-entity="${escapeAttr(m.id)}" href="${escapeAttr(entityWikiHref(entity))}">${m.text}</a>`;
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

  function setupEntityHoverCards() {
    const card = document.querySelector("#hover-card");
    if (!card) return;
    if (!ENTITY_INDEX) ENTITY_INDEX = buildEntityIndex();
    let pinned = false;
    let hideTimer;
    const fill = (entity) => {
      const tags = (entity.tags || []).map((tag) => `<span class="track-pill">${escapeHtml(tag)}</span>`).join(" ");
      const scenes = escapeHtml((entity.appears_in || []).join(", ") || "Referenced lore");
      const icon = (entity.meta && entity.meta.icon_asset) || "";
      const label = (entity.meta && entity.meta.label) || entity.type || "";
      card.innerHTML = `
        ${entity.image ? `<img src="${escapeAttr(entity.image)}" alt="">` : ""}
        <div class="private-note">${icon ? `<img class="type-icon" src="${escapeAttr(icon)}" alt="" aria-hidden="true"> ` : ""}${escapeHtml(label)}</div>
        <strong>${escapeHtml(entity.name)}</strong>
        <p class="pronunciation-line"><strong>Pronunciation:</strong> ${escapeHtml(entity.short_pronunciation || entity.pronunciation || "")}</p>
        <p>${escapeHtml(entity.summary || "")}</p>
        ${entity.role ? `<p class="muted">${escapeHtml(entity.role)}</p>` : ""}
        <div class="track-row">${tags}</div>
        <p class="muted">Appears in: ${scenes}</p>
        ${entity.stat_summary ? `<p><strong>Stat:</strong> ${escapeHtml(entity.stat_summary)}</p>` : ""}
        <a class="button secondary hover-card-wiki" href="${escapeAttr(entityWikiHref(entity))}">Open full wiki entry &rarr;</a>`;
    };
    const place = (target) => {
      const r = target.getBoundingClientRect();
      const w = card.offsetWidth || 350;
      const left = Math.min(window.innerWidth - w - 16, Math.max(12, r.left));
      const h = card.offsetHeight;
      let top = r.bottom + 8;
      if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 8);
      card.style.left = `${left}px`;
      card.style.top = `${Math.max(12, top)}px`;
    };
    const open = (target, pin) => {
      const entity = ENTITY_INDEX.map.get(target.dataset.entity);
      if (!entity) return;
      clearTimeout(hideTimer);
      fill(entity);
      card.classList.add("is-visible");
      if (pin) { pinned = true; card.classList.add("is-pinned"); }
      place(target);
      card.setAttribute("aria-hidden", "false");
    };
    const close = () => {
      pinned = false;
      card.classList.remove("is-visible", "is-pinned");
      card.setAttribute("aria-hidden", "true");
    };
    document.addEventListener("pointerover", (event) => {
      const target = event.target.closest("[data-entity]");
      if (target && !pinned) open(target, false);
    });
    document.addEventListener("focusin", (event) => {
      const target = event.target.closest("[data-entity]");
      if (target && !pinned) open(target, false);
    });
    document.addEventListener("pointerout", (event) => {
      if (pinned) return;
      const target = event.target.closest("[data-entity]");
      if (!target) return;
      hideTimer = setTimeout(() => { if (!pinned) close(); }, 160);
    });
    card.addEventListener("pointerenter", () => clearTimeout(hideTimer));
    card.addEventListener("pointerleave", () => { if (!pinned) hideTimer = setTimeout(close, 160); });
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-entity]");
      if (target) { event.preventDefault(); open(target, true); return; }
      if (!card.classList.contains("is-visible")) return;
      if (event.target.closest(".hover-card-wiki")) return;
      if (!event.target.closest("#hover-card")) close();
    }, true);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && card.classList.contains("is-visible")) close(); });
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
    setupEntityHoverCards();
    render();
  }

  init();
})();
