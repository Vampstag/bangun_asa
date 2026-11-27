/**
 * Pintu masuk model 3D. Three.js (±600 KB) baru diunduh saat sebuah model hampir terlihat di layar,
 * jadi halaman tetap ringan untuk pengunjung yang tidak menggulir sampai sana.
 */
import type { Mounted } from './viewer';

let active: Mounted[] = [];
let io: IntersectionObserver | null = null;

const stop = () => {
  io?.disconnect();
  io = null;
  for (const m of active) m.dispose();
  active = [];
};

const init = () => {
  stop();
  const els = [...document.querySelectorAll<HTMLElement>('[data-model]')];
  if (!els.length) return;
  const started = new Set<Element>();
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || started.has(e.target)) continue;
        started.add(e.target);
        const el = e.target as HTMLElement;
        void import('./viewer').then(({ mount }) => {
          const m = mount(el);
          if (m) active.push(m);
          else el.closest('[data-m3d-wrap]')?.classList.add('is-off');
        });
      }
    },
    { rootMargin: '1400px' },
  );
  for (const el of els) io.observe(el);
};

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', stop);
