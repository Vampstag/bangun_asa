/**
 * Magnetic buttons: the form submit button and the floating WhatsApp button lean toward the cursor when it gets close, then spring back with a little
 * overshoot when it leaves; a press squeezes them slightly. Mouse on desktop only: nothing happens on touch screens.
 *
 * Uses the individual CSS `translate` / `scale` properties (not `transform`), so it never fights the
 * transforms that other code or CSS already put on these elements (e.g. the floating WhatsApp button's slide-in).
 * The ticker only runs while something is moving.
 */
import gsap from 'gsap';

const TARGETS = ['.qform__btn', '.wa'].join(',');

/** How far (fraction of the cursor offset) the button follows the pointer, and the cap in px. */
const PULL = (el: Element) => (el.matches('.wa') ? 0.4 : 0.34);
const MAX = 16;
const REACH = 44; // px around the element where the pull starts
const SQUEEZE = 0.94;

interface Item {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  vs: number;
  tx: number;
  ty: number;
  ts: number;
  live: boolean;
}

export function mountMagnet(): () => void {
  // Touch devices (and anything without a real hover pointer) get no magnet and no squeeze at all.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const items: Item[] = Array.from(document.querySelectorAll<HTMLElement>(TARGETS)).map((el) => ({
    el,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    s: 1,
    vs: 0,
    tx: 0,
    ty: 0,
    ts: 1,
    live: false,
  }));
  if (!items.length) return () => {};

  const ac = new AbortController();
  const opt = { signal: ac.signal };
  let running = false;

  const K = 0.2; // spring stiffness
  const D = 0.72; // damping per 60fps frame (lower = less bounce)

  const tick = (_t: number, deltaMs: number) => {
    const f = Math.min(deltaMs, 50) / 16.667;
    let any = false;
    for (const m of items) {
      if (!m.live) continue;
      m.vx = (m.vx + (m.tx - m.x) * K * f) * Math.pow(D, f);
      m.vy = (m.vy + (m.ty - m.y) * K * f) * Math.pow(D, f);
      m.vs = (m.vs + (m.ts - m.s) * K * f) * Math.pow(D, f);
      m.x += m.vx * f;
      m.y += m.vy * f;
      m.s += m.vs * f;
      const rest =
        Math.abs(m.tx - m.x) < 0.05 &&
        Math.abs(m.ty - m.y) < 0.05 &&
        Math.abs(m.ts - m.s) < 0.0006 &&
        Math.abs(m.vx) < 0.05 &&
        Math.abs(m.vy) < 0.05 &&
        Math.abs(m.vs) < 0.0006;
      if (rest && m.tx === 0 && m.ty === 0 && m.ts === 1) {
        m.x = m.y = 0;
        m.s = 1;
        m.live = false;
        m.el.style.removeProperty('translate');
        m.el.style.removeProperty('scale');
        continue;
      }
      any = true;
      m.el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      m.el.style.scale = m.s.toFixed(4);
    }
    if (!any) {
      gsap.ticker.remove(tick);
      running = false;
    }
  };
  const wake = (m: Item) => {
    m.live = true;
    if (!running) {
      running = true;
      gsap.ticker.add(tick);
    }
  };

  /** Hidden menu items, the not-yet-visible WhatsApp button, and display:none nav links must not react. */
  const usable = (el: HTMLElement, r: DOMRect) => {
    if (!r.width || !r.height) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.pointerEvents !== 'none';
  };

  {
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        for (const m of items) {
          const r = m.el.getBoundingClientRect();
          // The element is already shifted by the pull, so measure from where it would rest.
          const left = r.left - m.x;
          const top = r.top - m.y;
          const near =
            e.clientX > left - REACH &&
            e.clientX < left + r.width + REACH &&
            e.clientY > top - REACH &&
            e.clientY < top + r.height + REACH;
          let tx = 0;
          let ty = 0;
          if (near && usable(m.el, r)) {
            const k = PULL(m.el);
            tx = Math.max(-MAX, Math.min(MAX, (e.clientX - (left + r.width / 2)) * k));
            ty = Math.max(-MAX, Math.min(MAX, (e.clientY - (top + r.height / 2)) * k));
          }
          if (tx !== m.tx || ty !== m.ty) {
            m.tx = tx;
            m.ty = ty;
            wake(m);
          }
        }
      },
      { ...opt, passive: true },
    );
    // Pointer left the window: let everything go.
    document.documentElement.addEventListener(
      'pointerleave',
      () =>
        items.forEach((m) => {
          m.tx = m.ty = 0;
          wake(m);
        }),
      opt,
    );
  }

  // Press feedback (mouse only).
  addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const hit = (e.target as Element | null)?.closest?.(TARGETS);
      const m = hit && items.find((i) => i.el === hit);
      if (m) {
        m.ts = SQUEEZE;
        wake(m);
      }
    },
    opt,
  );
  const release = () =>
    items.forEach((m) => {
      if (m.ts !== 1) {
        m.ts = 1;
        wake(m);
      }
    });
  addEventListener('pointerup', release, opt);
  addEventListener('pointercancel', release, opt);
  addEventListener('blur', release, opt);

  return () => {
    ac.abort();
    if (running) gsap.ticker.remove(tick);
    running = false;
    items.forEach((m) => {
      m.el.style.removeProperty('translate');
      m.el.style.removeProperty('scale');
    });
  };
}
