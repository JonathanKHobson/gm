
(function () {
  const pages = document.querySelectorAll("[data-story-mode-page]");
  if (!pages.length) return;

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function applyFilters(root) {
    const query = normalize(root.querySelector("[data-story-search]")?.value);
    const act = normalize(root.querySelector("[data-story-act-filter]")?.value);
    const cards = root.querySelectorAll("[data-story-card]");
    cards.forEach((card) => {
      const haystack = normalize(card.textContent + " " + (card.dataset.tags || ""));
      const cardAct = normalize(card.dataset.act || "");
      const okQuery = !query || haystack.includes(query);
      const okAct = !act || cardAct === act;
      card.classList.toggle("story-hidden", !(okQuery && okAct));
    });
    root.querySelectorAll("[data-story-section]").forEach((section) => {
      const visibleCards = section.querySelectorAll("[data-story-card]:not(.story-hidden)").length;
      const sectionAct = normalize(section.dataset.act || "");
      const okAct = !act || sectionAct === act;
      section.classList.toggle("story-hidden", !okAct || (query && visibleCards === 0));
    });
  }

  pages.forEach((root) => {
    root.querySelectorAll("[data-story-search], [data-story-act-filter]").forEach((control) => {
      control.addEventListener("input", () => applyFilters(root));
      control.addEventListener("change", () => applyFilters(root));
    });
    root.querySelectorAll("[data-expand-all]").forEach((button) => {
      button.addEventListener("click", () => root.querySelectorAll("details[data-story-section]").forEach((details) => { details.open = true; }));
    });
    root.querySelectorAll("[data-collapse-all]").forEach((button) => {
      button.addEventListener("click", () => root.querySelectorAll("details[data-story-section]").forEach((details) => { details.open = false; }));
    });
    applyFilters(root);
  });

  const storyReader = document.querySelector("[data-story-reader]");
  if (storyReader && "speechSynthesis" in window) {
    const getText = () => Array.from(document.querySelectorAll("[data-story-chapter]:not(.story-hidden)"))
      .map((node) => node.innerText)
      .join("\n\n");
    document.querySelector("[data-story-read]")?.addEventListener("click", () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(getText());
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    });
    document.querySelector("[data-story-pause]")?.addEventListener("click", () => window.speechSynthesis.pause());
    document.querySelector("[data-story-resume]")?.addEventListener("click", () => window.speechSynthesis.resume());
    document.querySelector("[data-story-stop]")?.addEventListener("click", () => window.speechSynthesis.cancel());
  }
})();
