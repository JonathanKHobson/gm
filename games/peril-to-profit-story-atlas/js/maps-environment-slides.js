
(function () {
  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function readReveals() { try { return JSON.parse(localStorage.getItem("goldspire-map-reveals-v1") || "{}") || {}; } catch { return {}; } }
  function writeReveals(value) { localStorage.setItem("goldspire-map-reveals-v1", JSON.stringify(value)); }
  function printPlayerMap(slide) {
    const map = slide.mapData;
    const win = window.open("", "_blank", "popup=yes,width=1100,height=800");
    if (!win || !map) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(map.title)}</title><style>html,body{margin:0;height:100%;background:#fff}body{display:grid;place-items:center}img{width:100%;height:100%;object-fit:contain}</style></head><body><img src="${escapeHtml(map.playerSafeImage || map.image)}" alt="${escapeHtml(map.alt || map.title)}"></body></html>`);
    win.document.close();
    win.print();
  }
  document.addEventListener("click", (event) => {
    const reveal = event.target.closest("[data-map-reveal]");
    if (reveal) {
      const key = reveal.dataset.mapReveal;
      const reveals = readReveals();
      reveals[key] = !reveals[key];
      writeReveals(reveals);
      window.GoldspireRunMode?.render?.();
      return;
    }
    if (event.target.closest("[data-map-print-player]")) {
      const slide = window.GoldspireRunMode?.currentSlide?.();
      if (slide) printPlayerMap(slide);
      return;
    }
  });
})();
