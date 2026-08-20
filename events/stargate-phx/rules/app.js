(() => {
  "use strict";

  const elements = {
    shell: document.querySelector(".app-shell"),
    menuButton: document.querySelector("#menu-button"),
    menuClose: document.querySelector("#sidebar-close"),
    menuScrim: document.querySelector("#menu-scrim"),
    toc: document.querySelector("#toc"),
    previous: document.querySelector("#previous-page"),
    next: document.querySelector("#next-page"),
    pageInput: document.querySelector("#page-input"),
    pageCount: document.querySelector("#page-count"),
    title: document.querySelector("#current-section-title"),
    frame: document.querySelector("#page-frame"),
    image: document.querySelector("#page-image"),
    text: document.querySelector("#page-text"),
    loading: document.querySelector("#page-loading"),
    imageView: document.querySelector("#image-view-button"),
    textView: document.querySelector("#text-view-button"),
    fit: document.querySelector("#fit-button"),
    searchForm: document.querySelector("#search-form"),
    searchInput: document.querySelector("#search-input"),
    searchPanel: document.querySelector("#search-panel"),
    searchClose: document.querySelector("#search-close"),
    searchSummary: document.querySelector("#search-summary"),
    searchResults: document.querySelector("#search-results"),
    status: document.querySelector("#status-live"),
    download: document.querySelector("#download-link"),
  };

  const state = {
    meta: null,
    search: null,
    page: 1,
    view: "image",
    fit: true,
    query: "",
    searchTimer: null,
  };

  const escapeHtml = (value) => value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  })[character]);

  function parseHash() {
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    return {
      page: Number(params.get("page")) || 1,
      query: params.get("q") || "",
    };
  }

  function setHash() {
    const params = new URLSearchParams({ page: String(state.page) });
    if (state.query) params.set("q", state.query);
    history.replaceState(null, "", `#${params.toString()}`);
  }

  function setMenu(open) {
    elements.shell.dataset.menuOpen = String(open);
    elements.menuButton.setAttribute("aria-expanded", String(open));
    if (open) elements.menuClose.focus();
  }

  function renderToc() {
    const fragment = document.createDocumentFragment();
    state.meta.toc.forEach((entry) => {
      const link = document.createElement("a");
      link.href = `#page=${entry.page}`;
      link.dataset.page = String(entry.page);
      link.dataset.level = String(entry.level);
      link.innerHTML = `<span>${escapeHtml(entry.title)}</span><span class="toc-page">${entry.page}</span>`;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showPage(entry.page);
        setMenu(false);
      });
      fragment.append(link);
    });
    elements.toc.replaceChildren(fragment);
  }

  function updateActiveToc() {
    let active = null;
    elements.toc.querySelectorAll("a").forEach((link) => {
      if (Number(link.dataset.page) <= state.page) active = link;
      link.removeAttribute("aria-current");
    });
    active?.setAttribute("aria-current", "location");
  }

  function loadLocalDataScript(source) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = source;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Local reader data could not be loaded."));
      document.head.append(script);
    });
  }

  async function ensureSearchIndex() {
    if (!state.search) {
      elements.searchSummary.textContent = "Loading the searchable text index…";
      if (window.__RULEBOOK_SEARCH__) {
        state.search = window.__RULEBOOK_SEARCH__;
      } else if (location.protocol === "file:") {
        await loadLocalDataScript("data/search-index.js");
        state.search = window.__RULEBOOK_SEARCH__;
      } else {
        const response = await fetch("data/search-index.json");
        if (!response.ok) throw new Error("Search index could not be loaded.");
        state.search = await response.json();
      }
      if (!state.search) throw new Error("Search index could not be loaded.");
    }
    return state.search;
  }

  function currentSearchPage() {
    return state.search?.pages[state.page - 1] || null;
  }

  async function renderCurrentText() {
    await ensureSearchIndex();
    const page = currentSearchPage();
    elements.text.textContent = page?.text || "No extractable text was found on this page.";
  }

  function preloadNeighbor(number) {
    if (number < 1 || number > state.meta.pageCount) return;
    const image = new Image();
    image.src = state.meta.pages[number - 1].image;
  }

  async function showPage(number, announce = true) {
    if (!state.meta) return;
    const page = Math.max(1, Math.min(state.meta.pageCount, Number(number) || 1));
    const record = state.meta.pages[page - 1];
    state.page = page;
    elements.pageInput.value = String(page);
    elements.previous.disabled = page === 1;
    elements.next.disabled = page === state.meta.pageCount;
    elements.title.textContent = record.title;
    elements.image.alt = `Rulebook page ${page}: ${record.title}`;
    elements.image.width = record.width;
    elements.image.height = record.height;
    elements.loading.hidden = false;
    elements.loading.textContent = `Loading page ${page}…`;
    elements.image.src = record.image;
    elements.image.onload = () => { elements.loading.hidden = true; };
    elements.image.onerror = () => { elements.loading.textContent = `Page ${page} could not be loaded.`; };
    if (state.view === "text") await renderCurrentText();
    updateActiveToc();
    setHash();
    document.title = `${record.title} · Page ${page} · Stargate SG-1 Rulebook`;
    if (announce) elements.status.textContent = `Page ${page} of ${state.meta.pageCount}, ${record.title}`;
    preloadNeighbor(page - 1);
    preloadNeighbor(page + 1);
  }

  async function setView(view) {
    state.view = view;
    const textMode = view === "text";
    elements.image.hidden = textMode;
    elements.text.hidden = !textMode;
    elements.loading.hidden = textMode || elements.image.complete;
    elements.frame.classList.toggle("is-text", textMode);
    elements.imageView.classList.toggle("is-active", !textMode);
    elements.textView.classList.toggle("is-active", textMode);
    elements.imageView.setAttribute("aria-pressed", String(!textMode));
    elements.textView.setAttribute("aria-pressed", String(textMode));
    if (textMode) await renderCurrentText();
    elements.status.textContent = textMode ? "Text view enabled" : "Page image view enabled";
  }

  function setFit(enabled) {
    state.fit = enabled;
    elements.frame.classList.toggle("is-fit", enabled);
    elements.fit.classList.toggle("is-active", enabled);
    elements.fit.setAttribute("aria-pressed", String(enabled));
    elements.fit.textContent = enabled ? "Fit" : "Full size";
  }

  function snippet(text, query) {
    const normalized = text.replace(/\s+/g, " ");
    const index = normalized.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    const start = Math.max(0, index - 90);
    const end = Math.min(normalized.length, index + query.length + 150);
    let value = normalized.slice(start, end);
    if (start > 0) value = `…${value}`;
    if (end < normalized.length) value = `${value}…`;
    const escaped = escapeHtml(value);
    const pattern = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    return escaped.replace(pattern, "<mark>$1</mark>");
  }

  async function runSearch(query) {
    const trimmed = query.trim();
    state.query = trimmed;
    if (trimmed.length < 2) {
      elements.searchPanel.hidden = true;
      elements.searchInput.setAttribute("aria-expanded", "false");
      setHash();
      return;
    }
    elements.searchPanel.hidden = false;
    elements.searchInput.setAttribute("aria-expanded", "true");
    try {
      const index = await ensureSearchIndex();
      const needle = trimmed.toLocaleLowerCase();
      const matches = index.pages
        .filter((page) => page.text.toLocaleLowerCase().includes(needle))
        .slice(0, 60);
      elements.searchSummary.textContent = `${matches.length}${matches.length === 60 ? "+" : ""} matching pages for “${trimmed}”`;
      const fragment = document.createDocumentFragment();
      matches.forEach((page) => {
        const item = document.createElement("li");
        item.className = "search-result";
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `<span class="search-result-header"><span class="search-result-title">${escapeHtml(page.title)}</span><span>Page ${page.number}</span></span><p class="search-snippet">${snippet(page.text, trimmed)}</p>`;
        button.addEventListener("click", async () => {
          await showPage(page.number);
          elements.searchPanel.hidden = true;
          elements.searchInput.setAttribute("aria-expanded", "false");
          document.querySelector("#reader-main").focus();
        });
        item.append(button);
        fragment.append(item);
      });
      if (!matches.length) {
        const item = document.createElement("li");
        item.textContent = "No page text matched. Try a shorter term or alternate spelling.";
        fragment.append(item);
      }
      elements.searchResults.replaceChildren(fragment);
      setHash();
    } catch (error) {
      elements.searchSummary.textContent = error.message;
      elements.searchResults.replaceChildren();
    }
  }

  function closeSearch() {
    elements.searchPanel.hidden = true;
    elements.searchInput.setAttribute("aria-expanded", "false");
    elements.searchInput.focus();
  }

  function wireEvents() {
    elements.menuButton.addEventListener("click", () => setMenu(true));
    elements.menuClose.addEventListener("click", () => setMenu(false));
    elements.menuScrim.addEventListener("click", () => setMenu(false));
    elements.previous.addEventListener("click", () => showPage(state.page - 1));
    elements.next.addEventListener("click", () => showPage(state.page + 1));
    elements.pageInput.addEventListener("change", () => showPage(elements.pageInput.value));
    elements.imageView.addEventListener("click", () => setView("image"));
    elements.textView.addEventListener("click", () => setView("text"));
    elements.fit.addEventListener("click", () => setFit(!state.fit));
    elements.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch(elements.searchInput.value);
    });
    elements.searchInput.addEventListener("input", () => {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => runSearch(elements.searchInput.value), 180);
    });
    elements.searchClose.addEventListener("click", closeSearch);
    addEventListener("keydown", (event) => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        elements.searchInput.focus();
      } else if (event.key === "Escape") {
        if (!elements.searchPanel.hidden) closeSearch();
        else setMenu(false);
      } else if (!typing && event.key === "ArrowLeft") showPage(state.page - 1);
      else if (!typing && event.key === "ArrowRight") showPage(state.page + 1);
      else if (!typing && event.key.toLowerCase() === "t") setView(state.view === "text" ? "image" : "text");
    });
  }

  async function start() {
    wireEvents();
    try {
      if (window.__RULEBOOK_METADATA__) {
        state.meta = window.__RULEBOOK_METADATA__;
      } else {
        const response = await fetch("data/metadata.json");
        if (!response.ok) throw new Error("Reader metadata could not be loaded.");
        state.meta = await response.json();
      }
      elements.pageInput.max = String(state.meta.pageCount);
      elements.pageCount.textContent = `of ${state.meta.pageCount}`;
      renderToc();
      const hash = parseHash();
      state.query = hash.query;
      elements.searchInput.value = hash.query;
      await showPage(hash.page, false);
      if (hash.query) await runSearch(hash.query);
      if (!elements.download.href || elements.download.href.endsWith("/downloads/")) elements.download.hidden = true;
    } catch (error) {
      elements.loading.textContent = error.message;
      elements.title.textContent = "Reader unavailable";
    }
  }

  start();
})();
