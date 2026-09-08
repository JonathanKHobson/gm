(() => {
  document.querySelectorAll('.gmk-video-load').forEach(button => {
    button.addEventListener('click', () => {
      const panel = button.closest('.gmk-video');
      const frame = document.createElement('iframe');
      frame.src = panel.dataset.videoSrc;
      frame.title = panel.dataset.videoTitle;
      frame.allow = 'fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      panel.replaceChildren(frame);
      frame.focus();
    });
  });
})();
