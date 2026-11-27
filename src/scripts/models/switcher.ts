/**
 * Model 3D layanan di beranda: satu kanvas yang menampilkan model sesuai layanan yang sedang aktif.
 * - Desktop (panggung menempel): kanvas ada di kolom kanan.
 * - HP dan tablet (akordeon): kanvas dipindahkan ke dalam layanan yang sedang terbuka.
 * Layanan aktif dibaca dari kelas "is-active" yang sudah diatur motion.ts, jadi tidak ada logika gulir kedua.
 * Three.js baru diunduh saat bagian ini mendekati layar. Tanpa WebGL, foto cadangan tampil kembali.
 */
import type { Mounted } from './viewer';

let teardown: (() => void) | null = null;

function init(section: HTMLElement) {
  const host = section.querySelector<HTMLElement>('[data-svc3d-host]');
  const canvas = host?.querySelector('canvas');
  const visual = host?.parentElement;
  const tabs = Array.from(section.querySelectorAll<HTMLElement>('[data-tab]'));
  if (!host || !canvas || !visual || !tabs.length) return () => {};
  const kinds = (host.dataset.kinds ?? '').split(',');

  const ac = new AbortController();
  const built = new Map<string, Mounted>();
  let dead = false;
  let release = () => {};
  let apply: (() => void) | null = null;
  let shown = '';
  let swapping = 0;

  const activeIndex = () => tabs.findIndex((t) => t.classList.contains('is-active'));

  // tempat kanvas: kolom kanan bila terlihat, kalau tidak di dalam akordeon yang terbuka
  const place = () => {
    const desktop = getComputedStyle(visual).display !== 'none';
    const i = activeIndex();
    const slot = desktop ? visual : (tabs[i]?.querySelector<HTMLElement>('.tab__m') ?? null);
    if (!slot) return; // semua akordeon tertutup: biarkan di tempat terakhir
    if (host.parentElement !== slot) {
      for (const f of section.querySelectorAll('.tab__m.has-3d')) f.classList.remove('has-3d');
      if (desktop) visual.prepend(host);
      else {
        slot.classList.add('has-3d');
        slot.append(host);
      }
    }
  };

  const fail = () => section.classList.add('is-flat');

  const load = () =>
    import('./viewer').then(({ mount, createRenderer }) => {
      if (dead) return;
      const renderer = createRenderer(canvas);
      if (!renderer) return fail();
      release = () => {
        for (const m of built.values()) m.dispose();
        built.clear();
        renderer.dispose();
        renderer.forceContextLoss();
      };
      const show = (kind: string) => {
        for (const m of built.values()) m.setActive(false);
        const ready = built.get(kind);
        if (ready) ready.setActive(true);
        else {
          const m = mount(host, { kind, renderer });
          if (m) built.set(kind, m);
        }
        shown = kind;
      };
      apply = () => {
        const kind = kinds[activeIndex()];
        if (!kind || kind === shown) return;
        window.clearTimeout(swapping);
        if (!shown) return show(kind);
        // memudar sebentar saat berganti model
        host.classList.add('is-swapping');
        swapping = window.setTimeout(() => {
          const now = kinds[activeIndex()] ?? kind;
          if (now !== shown) show(now);
          requestAnimationFrame(() => host.classList.remove('is-swapping'));
        }, 180);
      };
      apply();
      if (!shown) apply();
    });

  const refresh = () => {
    place();
    apply?.();
  };
  const watch = new MutationObserver(refresh);
  for (const t of tabs) watch.observe(t, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', refresh, { signal: ac.signal });
  // mode akordeon dipasang motion.ts setelah halaman dimuat
  const settle = [0, 200, 900].map((ms) => window.setTimeout(refresh, ms));

  const near = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      refresh();
      load().catch(fail);
    },
    { rootMargin: '900px 0px' },
  );
  near.observe(section);

  return () => {
    dead = true;
    near.disconnect();
    watch.disconnect();
    ac.abort();
    settle.forEach((t) => window.clearTimeout(t));
    window.clearTimeout(swapping);
    release();
  };
}

document.addEventListener('astro:page-load', () => {
  teardown?.();
  const section = document.querySelector<HTMLElement>('[data-svc3d]');
  teardown = section ? init(section) : null;
});
document.addEventListener('astro:before-swap', () => {
  teardown?.();
  teardown = null;
});
