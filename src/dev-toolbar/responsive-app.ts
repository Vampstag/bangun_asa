import { defineToolbarApp } from 'astro/toolbar';

/**
 * Responsive: ukuran viewport + breakpoint aktif, dan pendeteksi penyebab scroll horizontal.
 * Titik putus mengikuti global.css (640 / 900 / 1000). Titik merah pada ikon = ada overflow.
 */
const BREAKPOINTS = [
  { max: 640, name: 'Mobile' },
  { max: 900, name: 'Tablet' },
  { max: 1000, name: 'Tablet lebar' },
  { max: Infinity, name: 'Desktop' },
];

const label = (w: number) => BREAKPOINTS.find((b) => w <= b.max)?.name ?? 'Desktop';

const isClipped = (el: Element) => {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (getComputedStyle(p).overflowX !== 'visible') return true;
  }
  return false;
};

const describe = (el: Element) => {
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList.length ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  return `${el.tagName.toLowerCase()}${id}${cls}`;
};

function findOffenders(): Element[] {
  const vw = document.documentElement.clientWidth;
  const out: Element[] = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('astro-dev-toolbar, #ba-grid-overlay')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= vw + 1) continue;
    if (getComputedStyle(el).position === 'fixed' || isClipped(el)) continue;
    out.push(el);
  }
  return out.slice(0, 8);
}

export default defineToolbarApp({
  init(canvas, app) {
    const win = document.createElement('astro-dev-toolbar-window');
    const body = document.createElement('div');
    body.style.cssText = 'display:grid;gap:10px;font:13px/1.45 system-ui;min-width:260px';
    win.appendChild(body);
    canvas.appendChild(win);

    let outlined: Element[] = [];
    const clearOutline = () => {
      outlined.forEach((el) => ((el as HTMLElement).style.outline = ''));
      outlined = [];
    };

    const render = () => {
      const w = innerWidth;
      const offenders =
        document.documentElement.scrollWidth > document.documentElement.clientWidth ? findOffenders() : [];
      clearOutline();
      offenders.forEach((el) => {
        (el as HTMLElement).style.outline = '2px solid #ff4d4f';
      });
      outlined = offenders;
      app.toggleNotification({ state: offenders.length > 0, level: 'error' });

      body.innerHTML = `
        <div style="font-size:22px;font-weight:600;letter-spacing:-.02em">${w} × ${innerHeight}</div>
        <div>${label(w)} · DPR ${devicePixelRatio}</div>
        <div style="opacity:.7">Titik putus CSS: 640 / 900 / 1000 px</div>
        <div style="height:1px;background:rgba(255,255,255,.14)"></div>
        ${
          offenders.length
            ? `<div style="color:#ff8a8a;font-weight:600">Scroll horizontal: ${offenders.length} elemen melebihi layar</div>
             ${offenders.map((el) => `<code style="opacity:.85">${describe(el)}</code>`).join('')}
             <div style="opacity:.6">Elemen diberi garis merah di halaman.</div>`
            : '<div style="color:#7be0a0;font-weight:600">Tidak ada scroll horizontal</div>'
        }`;
    };

    let t = 0;
    const schedule = () => {
      clearTimeout(t);
      t = window.setTimeout(render, 150);
    };
    addEventListener('resize', schedule);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    app.onToggled(({ state }) => {
      win.style.display = state ? '' : 'none';
      if (!state) clearOutline();
      else render();
    });
    win.style.display = 'none';
    render();
  },
});
