/* Native details keeps all destinations usable without JavaScript. */
(() => {
  const menu = document.querySelector('.gmk-menu');
  if (!menu) return;
  menu.dataset.enhanced = 'true';
  const trigger = menu.querySelector('summary');
  const desktop = matchMedia('(min-width: 1051px)');
  const sync = () => { menu.open = desktop.matches; };
  sync();
  desktop.addEventListener('change', sync);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open && !desktop.matches) {
      menu.open = false;
      trigger.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!desktop.matches && menu.open && !menu.contains(event.target)) menu.open = false;
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    if (!desktop.matches) menu.open = false;
  }));
})();
