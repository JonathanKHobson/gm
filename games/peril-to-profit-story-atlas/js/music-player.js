
(function () {
  const STATE_KEY = "goldspire-music-state-v1";
  const PLAYBACK_KEY = "goldspire-music-playback-v1";
  const PANEL_KEY = "goldspire-music-panel-open-v1";
  const library = window.GOLDSPIRE_MUSIC_LIBRARY || { tracks: [], playlists: [], defaultVolume: 0.18 };
  const tracks = Array.isArray(library.tracks) ? library.tracks : [];
  const playlists = Array.isArray(library.playlists) ? library.playlists : [];
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const playlistById = new Map(playlists.map((playlist) => [playlist.id, playlist]));
  const runRoot = document.querySelector("[data-music-player]");
  const musicPanel = document.querySelector("[data-music-panel]");
  const audio = document.querySelector("[data-music-audio]");
  const unlockButton = document.querySelector("[data-music-unlock]");
  let musicState = normalizeState(readJson(STATE_KEY, {}));
  let lastVolumeSend = 0;

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function readBool(key, fallback = false) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return fallback;
      return value === "true";
    } catch {
      return fallback;
    }
  }

  function writeBool(key, value) {
    try {
      localStorage.setItem(key, value ? "true" : "false");
    } catch {}
  }

  function defaultPlaylistId() {
    return library.defaultPlaylistId || playlists[0]?.id || "";
  }

  function defaultTrackId(playlistId = defaultPlaylistId(), variant = "all") {
    const ids = filteredTrackIds({ playlistId, variant });
    return library.defaultTrackId && ids.includes(library.defaultTrackId)
      ? library.defaultTrackId
      : ids[0] || tracks[0]?.id || "";
  }

  function normalizeState(input = {}) {
    const playlistId = playlistById.has(input.playlistId) ? input.playlistId : defaultPlaylistId();
    const variant = ["all", "instrumental", "vocal", "ad"].includes(input.variant) ? input.variant : "all";
    const volume = Number.isFinite(Number(input.volume)) ? Math.max(0, Math.min(1, Number(input.volume))) : Number(library.defaultVolume || 0.18);
    let trackId = trackById.has(input.trackId) ? input.trackId : defaultTrackId(playlistId, variant);
    const allowed = filteredTrackIds({ playlistId, variant });
    if (allowed.length && !allowed.includes(trackId)) trackId = allowed[0];
    return {
      playlistId,
      trackId,
      variant,
      volume,
      playing: !!input.playing,
      updatedAt: input.updatedAt || Date.now(),
    };
  }

  function saveState(next = musicState) {
    musicState = normalizeState({ ...next, updatedAt: Date.now() });
    writeJson(STATE_KEY, musicState);
    return musicState;
  }

  function trackMatchesVariant(track, variant) {
    if (!track) return false;
    if (variant === "all") return true;
    if (variant === "ad") return track.kind === "ad" || track.variant === "ad";
    return track.variant === variant;
  }

  function playlistTrackIds(playlistId) {
    const playlist = playlistById.get(playlistId);
    const ids = Array.isArray(playlist?.track_ids) ? playlist.track_ids : tracks.map((track) => track.id);
    return ids.filter((id) => trackById.has(id));
  }

  function filteredTrackIds(state = musicState) {
    return playlistTrackIds(state.playlistId).filter((id) => trackMatchesVariant(trackById.get(id), state.variant));
  }

  function currentTrack() {
    return trackById.get(musicState.trackId) || null;
  }

  function currentPlaylist() {
    return playlistById.get(musicState.playlistId) || null;
  }

  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function openPlayerDisplay() {
    const slide = window.GoldspireRunMode?.currentSlide?.();
    const slideId = slide?.id || new URLSearchParams(location.search).get("slide") || "";
    const suffix = slideId ? `?slide=${encodeURIComponent(slideId)}` : "";
    const win = window.open(`player-display.html${suffix}`, "goldspire-player-display", "popup=yes,width=1280,height=720");
    win?.focus?.();
    return win;
  }

  function sendMusic(type, extra = {}) {
    if (!window.GoldspireDisplaySync?.send) {
      setStatus("Player Display sync is not loaded.", "alert");
      return;
    }
    window.GoldspireDisplaySync.send({
      type,
      payload: { state: musicState, ...extra },
      source: "gm-run-mode-music",
    });
  }

  function setStatus(text, tone = "") {
    if (!runRoot) return;
    const node = runRoot.querySelector("[data-music-status]");
    if (node) node.textContent = text || "";
    const pill = document.querySelector("[data-music-status-pill]");
    if (pill) {
      pill.textContent = musicState.playing ? "Playing" : "Off";
      pill.classList.toggle("is-playing", !!musicState.playing && tone !== "alert");
      pill.classList.toggle("is-alert", tone === "alert");
      if (tone === "alert") pill.textContent = "Check";
    }
  }

  function renderControls() {
    if (!runRoot) return;
    const playlistSelect = runRoot.querySelector("[data-music-playlist]");
    const trackSelect = runRoot.querySelector("[data-music-track]");
    const variantSelect = runRoot.querySelector("[data-music-variant]");
    const volume = runRoot.querySelector("[data-music-volume]");
    const volumeLabel = runRoot.querySelector("[data-music-volume-label]");
    const now = runRoot.querySelector("[data-music-now]");
    const summaryNow = document.querySelector("[data-music-summary-now]");
    const playButton = runRoot.querySelector('[data-music-action="play-pause"]');

    if (playlistSelect && !playlistSelect.options.length) {
      playlistSelect.innerHTML = playlists.map((playlist) => `<option value="${escapeHtml(playlist.id)}">${escapeHtml(playlist.label || playlist.id)}</option>`).join("");
    }
    if (playlistSelect) playlistSelect.value = musicState.playlistId;
    if (variantSelect) variantSelect.value = musicState.variant;

    const ids = filteredTrackIds();
    if (trackSelect) {
      trackSelect.innerHTML = ids.map((id) => {
        const track = trackById.get(id);
        return `<option value="${escapeHtml(id)}">${escapeHtml(track?.title || id)}</option>`;
      }).join("");
      trackSelect.value = ids.includes(musicState.trackId) ? musicState.trackId : ids[0] || "";
      trackSelect.disabled = !ids.length;
    }
    if (volume) volume.value = String(Math.round(musicState.volume * 100));
    if (volumeLabel) volumeLabel.textContent = `${Math.round(musicState.volume * 100)}%`;

    const track = currentTrack();
    const playlist = currentPlaylist();
    const summaryText = track
      ? `${track.title}${musicState.playing ? " / playing" : ""}`
      : tracks.length ? "Ready" : "No tracks";
    if (summaryNow) {
      summaryNow.textContent = summaryText;
      summaryNow.setAttribute("title", summaryText);
    }
    if (now) {
      now.innerHTML = track
        ? `<strong>${escapeHtml(track.title)}</strong><br><span>${escapeHtml(playlist?.label || "")}${track.variant ? ` / ${escapeHtml(track.variant)}` : ""}</span>`
        : "No track loaded";
    }
    if (playButton) {
      playButton.dataset.shortLabel = musicState.playing ? "Pause" : "Play";
      playButton.setAttribute("aria-label", musicState.playing ? "Pause music" : "Play music");
      playButton.setAttribute("title", musicState.playing ? "Pause music" : "Play music");
    }
    const playback = readJson(PLAYBACK_KEY, {});
    if (playback.error === "audio-locked") setStatus("Click Enable table audio on Player Display.", "alert");
    else if (musicState.playing) setStatus("Playing from Player Display.");
    else setStatus(tracks.length ? "Ready." : "No music tracks loaded.", tracks.length ? "" : "alert");
  }

  function chooseRelative(delta) {
    const ids = filteredTrackIds();
    if (!ids.length) return;
    const currentIndex = Math.max(0, ids.indexOf(musicState.trackId));
    const nextIndex = (currentIndex + delta + ids.length) % ids.length;
    musicState.trackId = ids[nextIndex];
    saveState(musicState);
  }

  function updatePlaylist(value) {
    musicState.playlistId = value;
    const ids = filteredTrackIds();
    musicState.trackId = ids.includes(musicState.trackId) ? musicState.trackId : ids[0] || "";
    saveState(musicState);
    sendMusic("musicSetPlaylist");
  }

  function updateVariant(value) {
    musicState.variant = value;
    const ids = filteredTrackIds();
    musicState.trackId = ids.includes(musicState.trackId) ? musicState.trackId : ids[0] || "";
    saveState(musicState);
    sendMusic("musicSetVariant");
  }

  function updateTrack(value) {
    musicState.trackId = value;
    saveState(musicState);
    sendMusic("musicSetTrack");
  }

  function updateVolume(value, quiet = false) {
    musicState.volume = Math.max(0, Math.min(1, Number(value) / 100));
    saveState(musicState);
    if (!quiet || Date.now() - lastVolumeSend > 120) {
      lastVolumeSend = Date.now();
      sendMusic("musicSetVolume");
    }
  }

  function setMusicPanelOpen(open) {
    if (!musicPanel) return;
    musicPanel.open = !!open;
    writeBool(PANEL_KEY, !!open);
  }

  function handleRunAction(action) {
    if (!tracks.length && !["open-display", "collapse-panel"].includes(action)) return;
    if (action === "collapse-panel") {
      setMusicPanelOpen(false);
      return;
    }
    if (action === "open-display") {
      openPlayerDisplay();
      setStatus("Player Display opened.");
      return;
    }
    if (action === "play-pause") {
      musicState.playing = !musicState.playing;
      saveState(musicState);
      sendMusic(musicState.playing ? "musicPlay" : "musicPause");
    }
    if (action === "next") {
      chooseRelative(1);
      sendMusic("musicNext");
    }
    if (action === "previous") {
      chooseRelative(-1);
      sendMusic("musicPrevious");
    }
    if (action === "restart") {
      saveState(musicState);
      sendMusic("musicRestart");
    }
    if (action === "table-volume") {
      updateVolume(18);
      sendMusic("musicSetVolume");
    }
    if (action === "lobby-volume") {
      updateVolume(45);
      sendMusic("musicSetVolume");
    }
    renderControls();
  }

  function setupRunControls() {
    if (!runRoot) return;
    if (musicPanel) {
      setMusicPanelOpen(readBool(PANEL_KEY, false));
      musicPanel.addEventListener("toggle", () => {
        writeBool(PANEL_KEY, musicPanel.open);
      });
      document.addEventListener("pointerdown", (event) => {
        if (!musicPanel.open || musicPanel.contains(event.target)) return;
        setMusicPanelOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !musicPanel.open) return;
        setMusicPanelOpen(false);
      });
    }
    renderControls();
    runRoot.addEventListener("click", (event) => {
      const button = event.target.closest("[data-music-action]");
      if (!button) return;
      event.preventDefault();
      handleRunAction(button.dataset.musicAction);
    });
    runRoot.querySelector("[data-music-playlist]")?.addEventListener("change", (event) => {
      updatePlaylist(event.target.value);
      renderControls();
    });
    runRoot.querySelector("[data-music-track]")?.addEventListener("change", (event) => {
      updateTrack(event.target.value);
      renderControls();
    });
    runRoot.querySelector("[data-music-variant]")?.addEventListener("change", (event) => {
      updateVariant(event.target.value);
      renderControls();
    });
    runRoot.querySelector("[data-music-volume]")?.addEventListener("input", (event) => {
      updateVolume(event.target.value, true);
      renderControls();
    });
    runRoot.querySelector("[data-music-volume]")?.addEventListener("change", (event) => {
      updateVolume(event.target.value);
      renderControls();
    });
    window.addEventListener("storage", (event) => {
      if (event.key === STATE_KEY) {
        musicState = normalizeState(readJson(STATE_KEY, {}));
        renderControls();
      }
      if (event.key === PLAYBACK_KEY) renderControls();
    });
    window.setInterval(renderControls, 1500);
  }

  function writePlayback(extra = {}) {
    const track = currentTrack();
    writeJson(PLAYBACK_KEY, {
      at: Date.now(),
      trackId: musicState.trackId,
      title: track?.title || "",
      playing: !!musicState.playing,
      volume: musicState.volume,
      currentTime: audio ? audio.currentTime || 0 : 0,
      duration: audio ? audio.duration || 0 : 0,
      ...extra,
    });
  }

  function setUnlockVisible(visible) {
    if (unlockButton) unlockButton.hidden = !visible;
  }

  function setAudioSource() {
    if (!audio) return;
    const track = currentTrack();
    if (!track) {
      audio.removeAttribute("src");
      return;
    }
    const src = track.src || "";
    if (!audio.src.endsWith(src)) {
      audio.src = src;
      audio.load();
    }
    audio.volume = musicState.volume;
  }

  async function attemptPlay(reason = "play") {
    if (!audio || !currentTrack()) return;
    setAudioSource();
    try {
      await audio.play();
      musicState.playing = true;
      saveState(musicState);
      setUnlockVisible(false);
      writePlayback({ error: "", reason });
    } catch (error) {
      setUnlockVisible(true);
      writePlayback({ error: "audio-locked", detail: String(error && error.message ? error.message : error), reason });
    }
  }

  function pauseAudio() {
    if (!audio) return;
    audio.pause();
    musicState.playing = false;
    saveState(musicState);
    writePlayback({ error: "" });
  }

  function advanceAudio(delta) {
    chooseRelative(delta);
    setAudioSource();
    saveState(musicState);
  }

  function handleMusicMessage(message) {
    if (!audio || !message || message.protocol !== "goldspire-run-sync-v1" || !String(message.type || "").startsWith("music")) return;
    const nextState = message.payload?.state || readJson(STATE_KEY, {});
    musicState = saveState(nextState);
    setAudioSource();
    if (message.type === "musicPause") {
      pauseAudio();
      return;
    }
    if (message.type === "musicRestart" && audio) {
      audio.currentTime = 0;
    }
    if (message.type === "musicSetVolume") {
      audio.volume = musicState.volume;
      writePlayback({ error: "" });
      return;
    }
    if (musicState.playing || message.type === "musicPlay") {
      attemptPlay(message.type);
    } else {
      writePlayback({ error: "" });
    }
  }

  function setupAudioTarget() {
    if (!audio) return;
    setAudioSource();
    writePlayback({ error: "" });
    audio.addEventListener("ended", () => {
      if (!musicState.playing) return;
      advanceAudio(1);
      attemptPlay("ended-next");
    });
    audio.addEventListener("timeupdate", () => {
      if (Math.floor(Date.now() / 1000) % 3 === 0) writePlayback({ error: "" });
    });
    unlockButton?.addEventListener("click", () => attemptPlay("manual-unlock"));
    window.GoldspireDisplaySync?.listen(handleMusicMessage);
    const last = window.GoldspireDisplaySync?.lastMessage?.();
    if (last && String(last.type || "").startsWith("music")) handleMusicMessage(last);
    else if (musicState.playing) attemptPlay("restore");
  }

  window.GoldspireMusic = {
    library,
    readState: () => normalizeState(readJson(STATE_KEY, {})),
    currentTrack,
  };

  setupRunControls();
  setupAudioTarget();
})();
