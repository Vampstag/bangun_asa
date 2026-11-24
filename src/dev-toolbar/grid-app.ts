import { defineToolbarApp } from 'astro/toolbar';

/**
 * Overlay grid 12 kolom yang mengikuti layout situs (variabel --max dan --gut di global.css).
 * Berguna untuk memeriksa apakah elemen menempel pada kolom yang sama di setiap section.
 * Pintasan: tekan "G" (di luar kolom input). Status diingat di localStorage.
 */
const ID = 'ba-grid-overlay';
const KEY = 'ba:grid';

function ensureOverlay(): HTMLElement {
  let el = document.getElementById(ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = ID;
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:none';
  el.innerHTML = `
    <div style="max-width:var(--max,1440px);margin:0 auto;height:100%;padding:0 var(--gut,24px);box-sizing:border-box;
                display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--gut,24px)">
      ${Array.from(
        { length: 12 },
        (_, i) =>
          `<div style="background:rgba(232,147,12,.09);border-inline:1px solid rgba(232,147,12,.28);position:relative">
           <span style="position:absolute;top:84px;left:4px;font:600 10px/1 system-ui;color:rgba(232,147,12,.9)">${i + 1}</span>
         </div>`,
      ).join('')}
    </div>`;
  document.body.appendChild(el);
  return el;
}

export default defineToolbarApp({
  init(_canvas, app) {
    const overlay = ensureOverlay();
    const apply = (on: boolean) => {
      overlay.style.display = on ? 'block' : 'none';
      try {
        localStorage.setItem(KEY, on ? '1' : '0');
      } catch {
        /* storage may be blocked */
      }
    };

    let saved = false;
    try {
      saved = localStorage.getItem(KEY) === '1';
    } catch {
      /* ignore */
    }
    if (saved) {
      apply(true);
      app.toggleState({ state: true });
    }

    app.onToggled(({ state }) => apply(state));

    let on = saved;
    addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() !== 'g' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      on = !on;
      apply(on);
      app.toggleState({ state: on });
    });
    app.onToggled(({ state }) => {
      on = state;
    });
  },
});
