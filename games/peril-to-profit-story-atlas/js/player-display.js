
(function () {
  let slides = Array.isArray(window.GOLDSPIRE_SLIDES) ? window.GOLDSPIRE_SLIDES : [];
  let currentSlide = null;
  let displayMode = "waiting";
  let fontScale = 1;

  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("'", "&#39;"); }

  function safe(slide) {
    if (!slide) return null;
    const projection = slide.playerSafeProjection || slide;
    return {
      id: projection.id,
      title: projection.title,
      sectionTitle: projection.sectionTitle,
      image: projection.image || "",
      alt: projection.alt || projection.title,
      caption: projection.caption || "",
      mood: projection.mood || "",
      publicObjective: projection.publicObjective || "",
      readAloud: projection.readAloud || "",
      slideNumber: projection.slideNumber,
      totalSlides: projection.totalSlides,
    };
  }

  function findSlide(id) {
    return safe(slides.find((slide) => slide.id === id)) || safe(slides[0]);
  }

  function render(mode = displayMode) {
    displayMode = mode || displayMode;
    const root = document.querySelector("#player-screen");
    document.body.dataset.displayMode = displayMode;
    document.body.style.setProperty("--player-font-scale", String(fontScale));
    const slide = currentSlide || findSlide(new URLSearchParams(location.search).get("slide"));
    if (!slide) {
      root.innerHTML = '<section class="player-waiting"><h1>Waiting for the GM</h1><p>Open Run Mode and send a slide.</p></section>';
      return;
    }
    if (displayMode === "blackout") {
      root.innerHTML = '<section class="player-blackout" aria-label="Display hidden"><h1>Hold</h1></section>';
      return;
    }
    if (displayMode === "read-aloud-fullscreen") {
      root.innerHTML = `<section class="player-text-fullscreen"><div><p class="slide-pill">Slide ${escapeHtml(slide.slideNumber)} / ${escapeHtml(slide.totalSlides)}</p><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.readAloud || slide.publicObjective || slide.caption)}</p><button type="button" data-player-action="expand-text">Expand Text</button></div></section>`;
      return;
    }
    if (displayMode === "public-objective") {
      root.innerHTML = `<section class="player-objective"><div><p class="slide-pill">${escapeHtml(slide.sectionTitle)}</p><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.publicObjective || slide.caption)}</p></div></section>`;
      return;
    }
    if (displayMode === "conditions") {
      const text = slide.publicConditions || "No public conditions are currently shown.";
      root.innerHTML = `<section class="player-objective"><div><h1>Public Status</h1><p>${escapeHtml(text)}</p></div></section>`;
      return;
    }
    if (displayMode === "handout") {
      root.innerHTML = `<section class="player-objective"><div><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.readAloud || slide.publicObjective || slide.caption)}</p></div></section>`;
      return;
    }
    if (displayMode === "image-only") {
      root.innerHTML = `<section class="player-slide"><button type="button" data-player-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.alt)}"></button></section>`;
      return;
    }
    const showCaption = displayMode !== "image-title";
    root.innerHTML = `<section class="player-slide"><button type="button" data-player-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.alt)}"></button><div class="player-caption"><p class="slide-pill">Slide ${escapeHtml(slide.slideNumber)} / ${escapeHtml(slide.totalSlides)} - ${escapeHtml(slide.sectionTitle)}</p><h1>${escapeHtml(slide.title)}</h1>${showCaption ? `<p>${escapeHtml(slide.caption || slide.mood || "")}</p>` : ""}</div></section>`;
  }

  function handleMessage(message) {
    if (!message || message.protocol !== "goldspire-run-sync-v1") return;
    const slide = message.payload?.slide || findSlide(message.slideId);
    if (slide) currentSlide = safe(slide);
    if (message.type === "blackout") return render("blackout");
    if (message.type === "showImage") return render("image-only");
    if (message.type === "showText") return render("read-aloud-fullscreen");
    if (message.type === "showObjective") return render("public-objective");
    if (message.type === "showConditions") return render("conditions");
    if (message.type === "showHandout") return render("handout");
    if (message.type === "clearDisplay") return render("waiting");
    if (message.type === "setSlide") return render(message.payload?.displayMode || "image-title-caption");
  }

  function openImageDialog() {
    const slide = currentSlide || findSlide(new URLSearchParams(location.search).get("slide"));
    if (!slide?.image) return;
    document.querySelector("#player-expanded-image").src = slide.image;
    document.querySelector("#player-expanded-image").alt = slide.alt || slide.title;
    document.querySelector("#player-expanded-caption").textContent = slide.caption || "";
    document.querySelector("#player-image-dialog").showModal();
  }

  function openTextDialog() {
    const slide = currentSlide || findSlide(new URLSearchParams(location.search).get("slide"));
    document.querySelector("#player-expanded-title").textContent = slide?.title || "";
    document.querySelector("#player-expanded-text").textContent = slide?.readAloud || slide?.publicObjective || slide?.caption || "";
    document.querySelector("#player-text-dialog").showModal();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-player-action]");
    if (!button) return;
    const action = button.dataset.playerAction;
    if (["blackout", "image-title-caption", "read-aloud-fullscreen"].includes(action)) render(action);
    if (action === "font-up") { fontScale = Math.min(1.8, fontScale + .1); render(); }
    if (action === "font-down") { fontScale = Math.max(.8, fontScale - .1); render(); }
    if (action === "contrast") document.body.classList.toggle("high-contrast");
    if (action === "motion") document.body.classList.toggle("reduced-motion");
    if (action === "fullscreen") document.documentElement.requestFullscreen?.();
    if (action === "expand-image") openImageDialog();
    if (action === "expand-text") openTextDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  });
  window.GoldspireDisplaySync?.listen(handleMessage);
  currentSlide = findSlide(new URLSearchParams(location.search).get("slide"));
  const last = window.GoldspireDisplaySync?.lastMessage?.();
  if (last) handleMessage(last);
  else render("image-title-caption");
})();
