
(function () {
  const PLAYER_DISPLAY_HEARTBEAT_KEY = "goldspire-player-display-heartbeat-v1";
  let slides = Array.isArray(window.GOLDSPIRE_SLIDES) ? window.GOLDSPIRE_SLIDES : [];
  let currentSlide = null;
  let displayMode = "waiting";
  let fontScale = 1;
  let carouselIndex = 0;
  let carouselTimer = null;

  function pulseHeartbeat(closed = false) {
    try {
      localStorage.setItem(PLAYER_DISPLAY_HEARTBEAT_KEY, JSON.stringify({
        at: closed ? 0 : Date.now(),
        closed,
        slideId: currentSlide?.id || "",
        mode: displayMode,
      }));
    } catch {}
  }

  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("'", "&#39;"); }

  function playerIcon(action, label, icon) {
    return `<button class="run-icon-button" type="button" data-player-action="${escapeAttr(action)}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}"><img src="assets/icons/${escapeAttr(icon)}" alt="" aria-hidden="true"><span class="sr-only">${escapeHtml(label)}</span></button>`;
  }

  function safe(slide) {
    if (!slide) return null;
    const projection = slide.playerSafeProjection || slide;
    return {
      id: projection.id,
      title: projection.title,
      image: projection.image || "",
      alt: projection.alt || projection.title,
      caption: projection.caption || "",
      mood: projection.mood || "",
      publicObjective: projection.publicObjective || "",
      readAloud: projection.readAloud || "",
      playerBullets: projection.playerBullets || [],
      playerTable: projection.playerTable || [],
      playerBeats: projection.playerBeats || [],
      displayMode: projection.displayMode || "",
      mapData: projection.mapData || null,
    };
  }

  function findSlide(id) {
    return safe(slides.find((slide) => slide.id === id)) || safe(slides[0]);
  }

  function render(mode = displayMode) {
    clearCarouselTimer();
    displayMode = mode || displayMode;
    pulseHeartbeat();
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
      root.innerHTML = `<section class="player-text-fullscreen"><div><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.readAloud || slide.publicObjective || slide.caption)}</p>${playerList(slide)}${playerTable(slide)}${playerIcon("expand-text", "Expand text", "live-fullscreen.png")}</div></section>`;
      return;
    }
    if (displayMode === "public-objective") {
      root.innerHTML = `<section class="player-objective"><div><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.publicObjective || slide.caption)}</p>${playerList(slide)}${playerTable(slide)}</div></section>`;
      return;
    }
    if (displayMode === "conditions") {
      const text = slide.publicConditions || "No public conditions are currently shown.";
      root.innerHTML = `<section class="player-objective"><div><h1>Public Status</h1><p>${escapeHtml(text)}</p></div></section>`;
      return;
    }
    if (displayMode === "handout") {
      root.innerHTML = `<section class="player-objective"><div><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.readAloud || slide.publicObjective || slide.caption)}</p>${playerList(slide)}${playerTable(slide)}</div></section>`;
      return;
    }
    if (displayMode === "qr-card" || slide.displayMode === "qr-card") {
      root.innerHTML = qrCardMarkup(slide);
      return;
    }
    if (slide.mapData && ["image-title-caption", "image-title", "map", "map-only", "map-text", "map-annotations"].includes(displayMode)) {
      root.innerHTML = `<section class="player-slide player-map-slide">${playerMapMarkup(slide, displayMode)}</section>`;
      return;
    }
    if (displayMode === "image-only") {
      root.innerHTML = `<section class="player-slide"><button type="button" data-player-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.alt)}"></button></section>`;
      return;
    }
    if ((displayMode === "standby-carousel" || slide.displayMode === "standby-carousel") && (slide.playerBeats || []).length) {
      const beats = slide.playerBeats || [];
      const beat = beats[Math.max(0, Math.min(beats.length - 1, carouselIndex % beats.length))];
      root.innerHTML = beatMarkup(beat);
      carouselTimer = window.setTimeout(() => {
        carouselIndex = (carouselIndex + 1) % beats.length;
        render(displayMode);
      }, 9000);
      return;
    }
    if (slide.displayMode === "standby-poster") {
      root.innerHTML = `<section class="player-slide player-standby-poster"><button type="button" data-player-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.alt)}"></button></section>`;
      return;
    }
    if (slide.displayMode === "text-first" || !slide.image) {
      root.innerHTML = `<section class="player-objective player-text-card"><div><h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.readAloud || slide.publicObjective || slide.caption)}</p>${playerList(slide)}${playerTable(slide)}</div></section>`;
      return;
    }
    const showCaption = displayMode !== "image-title";
    root.innerHTML = `<section class="player-slide"><button type="button" data-player-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.alt)}"></button><div class="player-caption"><h1>${escapeHtml(slide.title)}</h1>${showCaption ? `<p>${escapeHtml(slide.readAloud || slide.publicObjective || slide.caption || slide.mood || "")}</p>${playerList(slide)}${playerTable(slide)}` : ""}</div></section>`;
  }

  function clearCarouselTimer() {
    if (carouselTimer) window.clearTimeout(carouselTimer);
    carouselTimer = null;
  }

  function beatMarkup(beat) {
    const mode = beat.displayMode || "text-first";
    if (mode === "qr-card") {
      return qrCardMarkup(beat);
    }
    if (mode === "standby-poster" || mode === "image-only") {
      return `<section class="player-slide player-standby-poster"><button type="button" data-player-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(beat.image || "")}" alt="${escapeAttr(beat.alt || beat.title || "")}"></button></section>`;
    }
    if (["map-only", "map-text", "map-annotations", "map"].includes(mode) && beat.mapData) {
      return `<section class="player-slide player-map-slide">${playerMapMarkup(beat, mode)}</section>`;
    }
    if (mode === "image-title-caption" && beat.image) {
      return `<section class="player-slide"><button type="button" data-player-action="expand-image" aria-label="Expand image"><img src="${escapeAttr(beat.image)}" alt="${escapeAttr(beat.alt || beat.title || "")}"></button><div class="player-caption"><h1>${escapeHtml(beat.title || "")}</h1><p>${escapeHtml(beat.readAloud || beat.publicObjective || beat.caption || "")}</p>${playerList(beat)}${playerTable(beat)}</div></section>`;
    }
    return `<section class="player-objective player-text-card"><div><h1>${escapeHtml(beat.title || "")}</h1><p>${escapeHtml(beat.readAloud || beat.publicObjective || beat.caption || "")}</p>${playerList(beat)}${playerTable(beat)}</div></section>`;
  }

  function qrCardMarkup(slide) {
    const text = slide.readAloud || slide.publicObjective || slide.caption || "";
    const url = slide.caption || "";
    return `<section class="player-qr-slide">
      <div>
        <h1>${escapeHtml(slide.title || "FAQ")}</h1>
        <p>${escapeHtml(text)}</p>
        ${playerList(slide)}
      </div>
      <aside class="player-qr-panel" aria-label="FAQ QR code">
        <div class="qr-shell"><img src="${escapeAttr(slide.image || "")}" alt="${escapeAttr(slide.alt || "QR code")}"></div>
        ${url ? `<p class="player-qr-url">${escapeHtml(url)}</p>` : ""}
      </aside>
    </section>`;
  }

  function playerList(slide) {
    const rows = (slide.playerBullets || []).filter(Boolean);
    if (!rows.length) return "";
    return `<ul class="player-bullet-list">${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join("")}</ul>`;
  }

  function playerTable(slide) {
    const rows = (slide.playerTable || []).filter(Boolean);
    if (!rows.length) return "";
    const keys = Array.from(rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()));
    if (!keys.length) return "";
    const head = keys.map((key) => `<th>${escapeHtml(String(key).replaceAll("_", " "))}</th>`).join("");
    const body = rows.map((row) => `<tr>${keys.map((key) => `<td>${escapeHtml(row[key] || "")}</td>`).join("")}</tr>`).join("");
    return `<table class="player-info-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function playerMapMarkup(slide, mode = "map-only") {
    const map = slide.mapData || {};
    const image = map.playerSafeImage || map.image || slide.image;
    const annotations = mode === "map-annotations" ? (map.annotations || []).map((annotation, index) => {
      const x = Number(annotation.x || 0.5);
      const offset = index % 2 === 0 ? "-1.25rem" : "1.25rem";
      return `
      <aside class="player-map-annotation ${x > 0.68 ? "is-left" : ""}" style="--x:${x};--y:${Number(annotation.y || 0.5)};--offset:${offset}">
        ${annotation.label ? `<strong>${escapeHtml(annotation.label)}</strong>` : ""}
        ${annotation.text ? `<span>${escapeHtml(annotation.text)}</span>` : ""}
      </aside>`;
    }).join("") : "";
    const description = slide.readAloud || slide.publicObjective || map.readAloud || map.playerText || "";
    const showText = ["map", "map-text", "map-annotations", "image-title-caption"].includes(mode) && !!description;
    const caption = showText ? `<div class="player-caption player-map-caption"><h1>${escapeHtml(slide.title || map.title || "")}</h1><p>${escapeHtml(description)}</p></div>` : "";
    return `<div class="player-map-frame"><img src="${escapeAttr(image)}" alt="${escapeAttr(map.alt || slide.alt || slide.title)}">${annotations}</div>${caption}`;
  }

  function handleMessage(message) {
    if (!message || message.protocol !== "goldspire-run-sync-v1") return;
    const slide = message.payload?.slide || findSlide(message.slideId);
    if (slide) {
      const next = safe(slide);
      if (next?.id !== currentSlide?.id) carouselIndex = 0;
      currentSlide = next;
    }
    if (message.type === "blackout") return render("blackout");
    if (message.type === "showImage") return render("image-only");
    if (message.type === "showMap") return render("map");
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
    if (action === "blackout") {
      render(displayMode === "blackout" ? (currentSlide?.displayMode || "image-title-caption") : "blackout");
    }
    if (["image-title-caption", "read-aloud-fullscreen"].includes(action)) render(action);
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
  window.setInterval(() => pulseHeartbeat(), 1000);
  window.addEventListener("pagehide", () => pulseHeartbeat(true));
  window.GoldspireDisplaySync?.listen(handleMessage);
  currentSlide = findSlide(new URLSearchParams(location.search).get("slide"));
  const last = window.GoldspireDisplaySync?.lastMessage?.();
  if (last) handleMessage(last);
  else render(currentSlide?.displayMode || "image-title-caption");
})();
