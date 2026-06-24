
(function () {
  const workspaces = window.GOLDSPIRE_COMBAT_WORKSPACES || [];
  const maps = window.GOLDSPIRE_MAPS || [];
  const fearOptions = window.GOLDSPIRE_SESSION_COUNTERS_SCHEMA?.fearSpendOptions || [];
  let currentSlide = null;
  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; } }
  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("'", "&#39;"); }
  function listMarkup(items, empty) {
    const rows = (items || []).filter(Boolean);
    if (!rows.length) return `<p class="drawer-muted">${escapeHtml(empty)}</p>`;
    return `<ul>${rows.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }
  function workspaceFor(slide) {
    const id = slide?.liveTools?.encounterId || (slide?.linkedSceneIds || [])[0] || slide?.id;
    return workspaces.find((workspace) => workspace.id === id) || null;
  }
  function mapFor(workspace, slide) {
    const id = workspace?.mapId || slide?.mapData?.id || (slide?.companionMapIds || [])[0];
    return maps.find((map) => map.id === id) || slide?.mapData || null;
  }
  function mapSourceLabel(map) {
    if (!map) return "";
    if (map.assetSourceType === "ai-generated-battlemap") return "AI-generated battle map";
    if (map.aiGeneratedPrimary) return "AI-generated location map";
    return "Fallback map";
  }
  function safeMapProjection(map, slide) {
    if (!map) return null;
    const safeMap = {
      id: map.id,
      type: map.type,
      title: map.title,
      image: map.playerSafeImage || map.image,
      playerSafeImage: map.playerSafeImage || map.image,
      caption: map.caption || "",
      alt: map.alt || map.title,
      playerText: map.playerText || map.caption || "",
      readAloud: map.readAloud || "",
      visibleDetails: map.visibleDetails || [],
      subtleDetails: map.subtleDetails || [],
      soundSmellTexture: map.soundSmellTexture || map.sensorySummary || [],
      annotations: map.annotations || [],
    };
    return {
      id: map.id,
      title: map.title || slide?.title,
      sectionTitle: slide?.sectionTitle || "",
      image: safeMap.image,
      alt: safeMap.alt,
      caption: safeMap.playerText || safeMap.caption,
      readAloud: safeMap.readAloud || safeMap.playerText || safeMap.caption,
      publicObjective: safeMap.playerText || "",
      slideNumber: slide?.slideNumber,
      totalSlides: slide?.totalSlides,
      mapData: safeMap,
    };
  }
  function pcNames() {
    const profiles = readJson("goldspire-atlas-pc-profiles-v1", {});
    const values = Object.values(profiles || {});
    if (!values.length) return ["Marlowe Fairwind", "Barnacle", "Garrick Reed", "Khari Nix", "Varian Soto"];
    return values.map((profile) => profile.current_character_name || profile.default_character_name || profile.name).filter(Boolean);
  }
  function combatantMarkup(combatants) {
    if (!combatants?.length) return "<p class=\"drawer-muted\">No combatants listed for this workspace.</p>";
    return `<div class="encounter-combatants">${combatants.map((entity) => `
      <article class="combatant-mini-card">
        <h4>${escapeHtml(entity.name)}</h4>
        <p class="drawer-muted">${escapeHtml(entity.type || "combatant")}</p>
        ${entity.stat_summary ? `<p><strong>Stats:</strong> ${escapeHtml(entity.stat_summary)}</p>` : ""}
        ${entity.wants ? `<p><strong>Wants:</strong> ${escapeHtml(entity.wants)}</p>` : ""}
        ${entity.fears ? `<p><strong>Pressure point:</strong> ${escapeHtml(entity.fears)}</p>` : ""}
        ${entity.summary ? `<p>${escapeHtml(entity.summary)}</p>` : ""}
        ${(entity.sample_dialogue || []).length ? `<p><strong>Line:</strong> ${escapeHtml((entity.sample_dialogue || [])[0])}</p>` : ""}
      </article>`).join("")}</div>`;
  }
  function fearSpendMarkup() {
    return `<div class="fear-spend-grid">${fearOptions.map((option) => `
      <article class="fear-spend-option">
        <button type="button" data-encounter-spend="${escapeAttr(option.id)}"><strong>${escapeHtml(option.label)}</strong><br><span>${escapeHtml(option.rules_text)}</span></button>
      </article>`).join("")}</div>`;
  }
  function actionCards(combat) {
    const rows = [
      ...(combat.combatantNotes || []).map((note) => ({ title: "Threat behavior", text: note })),
      ...(combat.snappyLines || []).map((line) => ({ title: "Line at the table", text: line })),
    ];
    if (!rows.length) rows.push({ title: "Pressure move", text: "Move the threat toward the objective, split attention, or make the terrain matter." });
    return `<div class="encounter-action-list">${rows.map((row) => `<article class="encounter-action-card"><strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.text)}</p></article>`).join("")}</div>`;
  }
  function renderDrawer() {
    const drawer = document.querySelector("[data-encounter-drawer]");
    if (!drawer || drawer.hidden || !currentSlide) return;
    const workspace = workspaceFor(currentSlide);
    const combat = workspace?.combat || {};
    const map = mapFor(workspace, currentSlide);
    const scene = workspace?.scene || currentSlide;
    const combatPage = map?.combatPage || (workspace?.slug ? `pages/combat/${workspace.slug}.html` : "");
    drawer.innerHTML = `
      <header class="console-header">
        <div>
          <p class="drawer-kicker">Encounter Cockpit</p>
          <h2>${escapeHtml(workspace?.title || currentSlide.title)}</h2>
          <p class="drawer-muted">Combat is fiction-first. Use this for stats, terrain, motives, Fear moves, and social off-ramps without turning Daggerheart into fixed initiative.</p>
        </div>
        <button class="live-icon-button" type="button" data-encounter-action="close" aria-label="Close Encounter Cockpit" title="Close Encounter Cockpit"><img src="assets/icons/action-collapse.png" alt="" aria-hidden="true"><span class="sr-only">Close Encounter Cockpit</span></button>
      </header>
      <div class="encounter-toolbar">
        ${combatPage ? `<a class="button secondary" href="${escapeAttr(combatPage)}"><img src="assets/icons/live-notes.png" alt="" aria-hidden="true"> Open combat page</a>` : ""}
        ${map ? `<button type="button" data-encounter-action="send-map"><img src="assets/icons/live-player-display.png" alt="" aria-hidden="true"> Send map</button>` : ""}
        ${map ? `<button type="button" data-encounter-action="open-map-image"><img src="assets/icons/live-map.png" alt="" aria-hidden="true"> Open map image</button>` : ""}
        ${map?.inspirationImage ? `<button type="button" data-encounter-action="open-inspiration-image"><img src="assets/icons/live-fullscreen.png" alt="" aria-hidden="true"> Visual inspiration</button>` : ""}
        ${map?.schematicImage ? `<button type="button" data-encounter-action="open-schematic-image"><img src="assets/icons/live-notes.png" alt="" aria-hidden="true"> Schematic reference</button>` : ""}
        <button type="button" data-encounter-action="copy-brief"><img src="assets/icons/live-copy.png" alt="" aria-hidden="true"> Copy encounter brief</button>
      </div>
      <div class="encounter-grid">
        <article class="encounter-card">
          <h3>Run Objective</h3>
          <p><strong>Stakes:</strong> ${escapeHtml(scene.short || currentSlide.gmGoal || "Keep pressure tied to the scene objective.")}</p>
          <p><strong>Aggression:</strong> ${escapeHtml(combat.aggression || "Use only as much pressure as the fiction earns.")}</p>
          <p><strong>Likely PC position:</strong> ${escapeHtml(combat.startingPosition || "Use the scene image and current fiction to place the party.")}</p>
          <p><strong>Threat entry:</strong> ${escapeHtml(combat.enemyEntry || "No special entry listed.")}</p>
        </article>
        <article class="encounter-card encounter-map-card">
          <h3>Map / Space</h3>
          ${map ? `<p class="drawer-kicker">${escapeHtml(mapSourceLabel(map))}</p>` : ""}
          ${map ? `<img src="${escapeAttr(map.image || map.playerSafeImage)}" alt="${escapeAttr(map.alt || map.title)}">` : "<p class=\"drawer-muted\">No map attached.</p>"}
          <p>${escapeHtml(map?.playerText || map?.caption || "Use range bands instead of grid-square assumptions.")}</p>
          ${map?.inspirationImage ? `<details><summary>Visual inspiration alternate</summary><p class="drawer-muted">Use this for mood, location flavor, and player visualization. Use the battle map above for tactical space.</p><a href="${escapeAttr(map.inspirationImage)}" target="_blank" rel="noopener">Open visual inspiration</a></details>` : ""}
          ${map?.schematicImage ? `<details><summary>Schematic alternate</summary><p class="drawer-muted">Use this only as a quick reference if the older spatial board helps clarify a table call.</p><a href="${escapeAttr(map.schematicImage)}" target="_blank" rel="noopener">Open schematic map</a></details>` : ""}
        </article>
        <article class="encounter-card">
          <h3>Use the Environment</h3>
          <p><strong>Terrain:</strong></p>${listMarkup(combat.terrain || map?.hazards || [], "No terrain list available.")}
          <p><strong>Hide:</strong></p>${listMarkup(combat.hideOptions || [], "Offer cover where the fiction supports it.")}
          <p><strong>Climb:</strong></p>${listMarkup(combat.climbOptions || [], "No obvious climb options listed.")}
          <p><strong>Improvise with:</strong></p>${listMarkup(combat.improvisedAssets || map?.interactables || [], "No improvised assets listed.")}
        </article>
        <article class="encounter-card">
          <h3>Combatants</h3>
          ${combatantMarkup(workspace?.combatants || [])}
        </article>
        <article class="encounter-card">
          <h3>Enemy Moves Now</h3>
          ${actionCards(combat)}
        </article>
        <article class="encounter-card">
          <h3>Resolve Without Slaughter</h3>
          <p><strong>Social off-ramp:</strong> ${escapeHtml(combat.socialDefeat || "Let players talk down, redirect, bargain, protect, or withdraw if the fiction supports it.")}</p>
          <p><strong>If they go violent:</strong> ${escapeHtml(combat.violentConsequence || "Show consequences through witnesses, evidence, stress, or later trust.")}</p>
          <p><strong>If they show mercy/control:</strong> ${escapeHtml(combat.mercyReward || "Reward restraint with better information, safer positioning, or future trust.")}</p>
        </article>
        <article class="encounter-card">
          <h3>Official Fear Options</h3>
          ${fearSpendMarkup()}
        </article>
        <article class="encounter-card">
          <h3>Next Move</h3>
          <section data-next-move-kit aria-label="Next Move Kit"></section>
        </article>
      </div>`;
    window.dispatchEvent(new CustomEvent("goldspire-encounter-opened", { detail: { slide: currentSlide, workspace } }));
  }
  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function briefText(workspace, combat, map) {
    return [
      workspace?.title || currentSlide?.title || "Encounter",
      `Aggression: ${combat.aggression || "fiction-first pressure"}`,
      `Starting position: ${combat.startingPosition || "current fiction"}`,
      `Threat entry: ${combat.enemyEntry || "none listed"}`,
      `Terrain: ${(combat.terrain || map?.hazards || []).join(", ")}`,
      `Social off-ramp: ${combat.socialDefeat || "offer a fictionally earned alternative"}`,
    ].join("\n");
  }
  async function copyBrief() {
    const workspace = workspaceFor(currentSlide);
    const combat = workspace?.combat || {};
    const map = mapFor(workspace, currentSlide);
    const text = briefText(workspace, combat, map);
    try { await navigator.clipboard.writeText(text); } catch { window.prompt("Copy encounter brief:", text); }
    window.GoldspireRunMode?.showStatus?.("Copied encounter brief");
  }
  function sendMap() {
    const workspace = workspaceFor(currentSlide);
    const map = mapFor(workspace, currentSlide);
    const projection = safeMapProjection(map, currentSlide);
    if (!projection) return;
    window.GoldspireRunMode?.send?.("showMap", { displayMode: "map", slide: projection });
    window.GoldspireRunMode?.showStatus?.("Sent map");
  }
  function openMapImage() {
    const workspace = workspaceFor(currentSlide);
    const map = mapFor(workspace, currentSlide);
    const src = map?.image || map?.playerSafeImage;
    if (src) window.open(src, "_blank", "noopener");
  }
  function openSchematicImage() {
    const workspace = workspaceFor(currentSlide);
    const map = mapFor(workspace, currentSlide);
    const src = map?.schematicImage || map?.schematicPlayerSafeImage;
    if (src) window.open(src, "_blank", "noopener");
  }
  function openInspirationImage() {
    const workspace = workspaceFor(currentSlide);
    const map = mapFor(workspace, currentSlide);
    const src = map?.inspirationImage || map?.inspirationPlayerSafeImage;
    if (src) window.open(src, "_blank", "noopener");
  }
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-encounter-action]")?.dataset.encounterAction;
    if (action === "open") {
      const drawer = document.querySelector("[data-encounter-drawer]");
      if (drawer) drawer.hidden = false;
      renderDrawer();
    }
    if (action === "close") document.querySelector("[data-encounter-drawer]")?.setAttribute("hidden", "");
    if (action === "send-map") sendMap();
    if (action === "open-map-image") openMapImage();
    if (action === "open-inspiration-image") openInspirationImage();
    if (action === "open-schematic-image") openSchematicImage();
    if (action === "copy-brief") copyBrief();
    const spend = event.target.closest("[data-encounter-spend]");
    if (spend) {
      const hud = window.GoldspireHud;
      const currentFear = hud?.read?.().fear || 0;
      hud?.setFear?.(currentFear - 1, `encounter:${spend.dataset.encounterSpend}`);
      hud?.logEvent?.("encounter-fear-spend", { source: spend.dataset.encounterSpend, sceneId: currentSlide?.id });
      window.GoldspireRunMode?.showStatus?.("Spent 1 Fear");
    }
  });
  window.addEventListener("goldspire-run-slide-rendered", (event) => {
    currentSlide = event.detail?.slide || null;
    const drawer = document.querySelector("[data-encounter-drawer]");
    if (drawer && !drawer.hidden) renderDrawer();
  });
  window.GoldspireEncounterCockpit = { open: () => {
    const drawer = document.querySelector("[data-encounter-drawer]");
    if (drawer) drawer.hidden = false;
    renderDrawer();
  }};
})();
