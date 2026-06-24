
(function () {
  const slides = (window.GOLDSPIRE_SLIDES || []).filter((slide) => slide.playerSafe);
  let index = 0;
  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("'", "&#39;"); }
  function safe(slide) { return slide.playerSafeProjection || slide; }
  function setFromUrl() {
    const id = new URLSearchParams(location.search).get("slide");
    const found = slides.findIndex((slide) => slide.id === id);
    index = found >= 0 ? found : 0;
  }
  function render() {
    const slide = safe(slides[index]);
    document.querySelector("#follow-current").innerHTML = `<h2>${escapeHtml(slide.title)}</h2>${slide.image ? `<img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.alt || slide.title)}">` : ""}<p>${escapeHtml(slide.publicObjective || slide.caption || "")}</p>${slide.readAloud ? `<blockquote>${escapeHtml(slide.readAloud)}</blockquote>` : ""}`;
    document.querySelector("#follow-toc").innerHTML = slides.map((raw, idx) => {
      const item = safe(raw);
      return `<a href="player-follow.html?slide=${encodeURIComponent(item.id)}" ${idx === index ? 'aria-current="page"' : ""}><span>${escapeHtml(item.title)}</span></a>`;
    }).join("");
    history.replaceState(null, "", `player-follow.html?slide=${encodeURIComponent(slide.id)}`);
  }
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-follow-action]");
    if (!button) return;
    const action = button.dataset.followAction;
    if (action === "previous") index = Math.max(0, index - 1);
    if (action === "next") index = Math.min(slides.length - 1, index + 1);
    if (action === "copy-url") {
      const url = location.href;
      try { await navigator.clipboard.writeText(url); }
      catch { window.prompt("Copy slide URL:", url); }
    }
    render();
  });
  setFromUrl();
  render();
})();
