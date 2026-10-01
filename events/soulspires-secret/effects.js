/* Soulspire atmosphere. No content depends on this script. */
(() => {
  'use strict';

  const root = document.documentElement;
  const controls = document.querySelector('.ss-atmosphere-controls');
  const effectsButton = document.getElementById('ss-effects-toggle');
  const soundButton = document.getElementById('ss-sound-toggle');
  const soundStatus = document.getElementById('ss-sound-status');
  const audio = document.getElementById('ss-entrance-audio');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sections = [...document.querySelectorAll('.ss-hero, .ss-booking-strip, .ss-section, .ss-final')];
  let effectsWanted = !reduced.matches;
  let observer;

  function updateEffects() {
    const enabled = effectsWanted && !reduced.matches;
    root.classList.toggle('ss-effects-on', enabled);
    if (!effectsButton) return;
    effectsButton.disabled = reduced.matches;
    effectsButton.setAttribute('aria-pressed', String(enabled));
    effectsButton.textContent = reduced.matches ? 'Effects off (reduced motion)' : enabled ? 'Effects on' : 'Effects off';
    effectsButton.title = reduced.matches ? 'Motion is reduced in your device settings' : 'Toggle page motion';
  }

  if (effectsButton) {
    effectsButton.addEventListener('click', () => {
      effectsWanted = !effectsWanted;
      updateEffects();
    });
  }
  reduced.addEventListener('change', updateEffects);
  updateEffects();

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(entry.target.classList.contains('ss-hero') ? 'ss-entered' : 'ss-revealed');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
    for (const section of sections) observer.observe(section);
  } else {
    for (const section of sections) section.classList.add(section.classList.contains('ss-hero') ? 'ss-entered' : 'ss-revealed');
  }
  root.classList.add('ss-effects-ready');

  if (controls) controls.hidden = false;
  if (!audio || !soundButton || !soundStatus) return;

  const STORAGE_KEY = 'gmk-soulspire-entrance-seen';
  const MAX_SECONDS = 3;
  let playing = false;
  let stopTimer = 0;
  let playToken = 0;
  let hasPlayed = false;
  audio.loop = false;
  audio.volume = .3;

  function setSoundButton() {
    soundButton.setAttribute('aria-pressed', String(playing));
    soundButton.textContent = playing ? 'Mute sound' : hasPlayed ? 'Replay 3-second sound' : 'Play 3-second sound';
  }
  function stop(message) {
    playToken++;
    clearTimeout(stopTimer);
    stopTimer = 0;
    audio.pause();
    audio.currentTime = 0;
    playing = false;
    soundStatus.textContent = message;
    setSoundButton();
  }
  async function play() {
    if (document.hidden) return;
    const token = ++playToken;
    clearTimeout(stopTimer);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = .3;
    try {
      await audio.play();
      if (token !== playToken || document.hidden) {
        audio.pause();
        return;
      }
      playing = true;
      hasPlayed = true;
      soundStatus.textContent = 'Playing a 3-second entrance cue.';
      setSoundButton();
      stopTimer = window.setTimeout(() => stop('Entrance cue finished.'), MAX_SECONDS * 1000 + 50);
    } catch {
      if (token !== playToken) return;
      playing = false;
      soundStatus.textContent = 'Sound is off. Select Play to hear the 3-second cue.';
      setSoundButton();
    }
  }
  soundButton.addEventListener('click', () => {
    if (playing) stop('Sound muted.');
    else play();
  });
  audio.addEventListener('timeupdate', () => {
    if (playing && audio.currentTime >= MAX_SECONDS) stop('Entrance cue finished.');
  });
  audio.addEventListener('ended', () => stop('Entrance cue finished.'));
  audio.addEventListener('error', () => stop('Sound could not load. The page still works.'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop('Sound stopped when you left the page.');
  });
  window.addEventListener('pagehide', () => {
    stop('Sound stopped.');
    observer?.disconnect();
  });
  setSoundButton();

  let firstVisit = false;
  try {
    firstVisit = localStorage.getItem(STORAGE_KEY) === null;
    if (firstVisit) localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    soundStatus.textContent = 'Sound is available by request. Select Play 3-second sound.';
    return;
  }
  if (firstVisit) play();
  else soundStatus.textContent = 'Sound is optional. Play it if you like.';
})();
