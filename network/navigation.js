/* Optional enhancement: every destination and the disclosure work without JS. */
(() => {
  document.querySelectorAll('.kh-network').forEach((bar) => {
    const menu = bar.querySelector('details');
    if (!menu) return;
    const close = () => { menu.open = false; };
    bar.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open) {
        close();
        menu.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!bar.contains(event.target)) close();
    });
    bar.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
  });
})();
