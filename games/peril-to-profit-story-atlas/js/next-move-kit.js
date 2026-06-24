
(function () {
  const data = window.GOLDSPIRE_NEXT_MOVES || {};
  const order = data.officialOutcomeOrder || [];
  let currentSlide = null;
  let selectedOutcome = order[1]?.id || "success_with_hope";
  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function cardsFor(slideId, outcome) {
    const sceneCards = data.scenes?.[slideId]?.outcomes?.[outcome] || [];
    const globalCards = data.global?.[outcome] || [];
    return [...sceneCards, ...globalCards].slice(0, 6);
  }
  function render() {
    const roots = document.querySelectorAll("[data-next-move-kit]");
    if (!roots.length || !currentSlide) return;
    const cards = cardsFor(currentSlide.id, selectedOutcome);
    roots.forEach((root) => {
      root.className = "next-move-kit";
      root.innerHTML = `
        <p class="muted">Official Daggerheart outcomes first; Slider is a house overlay.</p>
        <div class="next-move-outcomes">${order.map((item) => `<button type="button" data-next-outcome="${escapeHtml(item.id)}" ${item.id === selectedOutcome ? 'aria-pressed="true"' : ""}>${escapeHtml(item.label)}</button>`).join("")}</div>
        <details>
          <summary>Kyle Slider overlay</summary>
          <div class="slider-outcomes">${(data.sliderBands || []).map((item) => `<button type="button" data-slider-band="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`).join("")}</div>
        </details>
        <div class="next-move-grid">${cards.map((card, index) => cardMarkup(card, index)).join("")}</div>`;
    });
  }
  function cardMarkup(card, index) {
    return `<article class="next-move-card" data-player-safe="${card.playerSafe !== false}">
      <p class="private-note">${card.playerSafe === false ? "GM-only" : "Player-safe"}</p>
      <h4>${escapeHtml(card.title || "Next move")}</h4>
      <p><strong>Say this:</strong> ${escapeHtml(card.say || "")}</p>
      <p><strong>Mechanic:</strong> ${escapeHtml(card.mechanic || "")}</p>
      <p><strong>Fiction move:</strong> ${escapeHtml(card.move || "")}</p>
      ${card.payoff ? `<p><strong>Clue / payoff:</strong> ${escapeHtml(card.payoff)}</p>` : ""}
      <footer>
        <button type="button" data-next-copy="${index}">Copy</button>
        <button type="button" data-next-log="${index}">Log</button>
        ${card.playerSafe !== false ? `<button type="button" data-next-send="${index}">Show to players</button>` : ""}
      </footer>
    </article>`;
  }
  function currentCards() { return cardsFor(currentSlide?.id, selectedOutcome); }
  async function copyCard(card) {
    const text = `${card.title}\nSay this: ${card.say}\nMechanic: ${card.mechanic}\nFiction move: ${card.move}${card.payoff ? `\nClue / payoff: ${card.payoff}` : ""}`;
    try { await navigator.clipboard.writeText(text); } catch { window.prompt("Copy Next Move:", text); }
    window.GoldspireRunMode?.showStatus?.("Copied Next Move");
  }
  function logCard(card) {
    const key = "goldspire-choice-log-v1";
    let logs = {};
    try { logs = JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch {}
    const existing = logs[currentSlide.id] || "";
    logs[currentSlide.id] = `${existing}${existing ? "\n" : ""}Next Move: ${card.title} - ${card.move || card.say}`;
    localStorage.setItem(key, JSON.stringify(logs));
    window.GoldspireHud?.logEvent?.("next-move-log", { source: selectedOutcome, note: card.title, sceneId: currentSlide.id });
    window.GoldspireRunMode?.showStatus?.("Logged Next Move");
  }
  function sendCard(card) {
    if (card.playerSafe === false) return;
    window.GoldspireRunMode?.send?.("showHandout", {
      displayMode: "handout",
      slide: {
        id: currentSlide.id,
        title: card.title,
        sectionTitle: currentSlide.sectionTitle,
        image: currentSlide.image,
        alt: currentSlide.alt,
        caption: card.say || card.move || "",
        readAloud: card.say || card.move || "",
        publicObjective: card.move || "",
        slideNumber: currentSlide.slideNumber,
        totalSlides: currentSlide.totalSlides,
      },
    });
    window.GoldspireRunMode?.showStatus?.("Sent Next Move text");
  }
  document.addEventListener("click", (event) => {
    const outcome = event.target.closest("[data-next-outcome]");
    if (outcome) { selectedOutcome = outcome.dataset.nextOutcome; render(); return; }
    if (event.target.closest("[data-slider-band]")) {
      window.GoldspireRunMode?.showStatus?.("Slider noted as house overlay");
      return;
    }
    const cards = currentCards();
    const copy = event.target.closest("[data-next-copy]");
    if (copy) copyCard(cards[Number(copy.dataset.nextCopy)]);
    const log = event.target.closest("[data-next-log]");
    if (log) logCard(cards[Number(log.dataset.nextLog)]);
    const send = event.target.closest("[data-next-send]");
    if (send) sendCard(cards[Number(send.dataset.nextSend)]);
  });
  window.addEventListener("goldspire-run-slide-rendered", (event) => {
    currentSlide = event.detail?.slide;
    selectedOutcome = order[1]?.id || "success_with_hope";
    render();
  });
  window.addEventListener("goldspire-encounter-opened", (event) => {
    currentSlide = event.detail?.slide || currentSlide;
    render();
  });
})();
