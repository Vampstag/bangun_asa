/**
 * Gerak yang dibuat sengaja sedikit: smooth scroll, satu efek per section, semuanya halus dan berfungsi.
 *
 * Siklus hidup (penting untuk transisi halaman Astro):
 *   mountMotion()   dipanggil di muat awal dan setelah tiap navigasi (astro:page-load)
 *   unmountMotion() dipanggil sebelum DOM ditukar (astro:before-swap)
 * Semua listener, trigger, ticker, dan instance smooth-scroll dibersihkan di sana, jadi tidak ada kebocoran
 * atau efek ganda saat pengunjung berpindah halaman.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { mountMagnet } from './magnet';

const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));
const fmt = (n: number) => n.toLocaleString('id-ID');

/**
 * Services as a one-open-at-a-time accordion (tablet, mobile, and reduced motion).
 * CSS keys off [data-acc]; without this running, every service simply stays open.
 * Returns a function that restores the plain list.
 */
function mountAccordion(root: HTMLElement): () => void {
  const tabs = $$('[data-tab]', root);
  const btns = tabs.map((t) => $('[data-tab-btn]', t));
  const set = (open: number) =>
    tabs.forEach((t, k) => {
      t.classList.toggle('is-active', k === open);
      btns[k]?.setAttribute('aria-expanded', String(k === open));
    });

  root.setAttribute('data-acc', '');
  btns.forEach((b) => b?.removeAttribute('tabindex'));
  set(0);

  const handlers = tabs.map((t, i) => () => set(t.classList.contains('is-active') ? -1 : i));
  btns.forEach((b, i) => b?.addEventListener('click', handlers[i]));

  return () => {
    root.removeAttribute('data-acc');
    btns.forEach((b, i) => {
      b?.removeEventListener('click', handlers[i]);
      b?.removeAttribute('aria-expanded');
      b?.setAttribute('tabindex', '-1');
    });
    tabs.forEach((t, k) => t.classList.toggle('is-active', k === 0));
  };
}

let teardown: (() => void) | null = null;

export function mountMotion() {
  teardown?.();
  teardown = initMotion();
}

export function unmountMotion() {
  teardown?.();
  teardown = null;
}

function initMotion(): () => void {
  const root = document.documentElement;
  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Everything registered below is released by the function returned at the end.
  const ac = new AbortController();
  const listen = { signal: ac.signal };
  const cleanups: Array<() => void> = [];
  let lenis: Lenis | null = null;
  let mm: ReturnType<typeof gsap.matchMedia> | null = null;

  const destroy = () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
    mm?.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    lenis?.destroy();
    document.body.classList.remove('menu-open');
    delete root.dataset.motion;
  };

  /* ---------- smooth scroll ---------- */
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => gsap.ticker.remove(raf));
  }

  /* ---------- mobile menu ---------- */
  const menu = $('[data-menu]');
  const burger = $<HTMLButtonElement>('[data-burger]');
  const setMenu = (open: boolean) => {
    if (!menu || !burger) return;
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', (open ? burger.dataset.labelClose : burger.dataset.labelOpen) ?? '');
    if (open) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    if (open) lenis?.stop();
    else lenis?.start();
  };
  burger?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') setMenu(false);
    },
    listen,
  );

  /* ---------- scroll lock for modal overlays (lightbox sends this event) ---------- */
  document.addEventListener(
    'ba:scroll-lock',
    (e) => {
      const lock = (e as CustomEvent<boolean>).detail;
      if (lenis) {
        if (lock) lenis.stop();
        else lenis.start();
      } else {
        root.style.overflow = lock ? 'hidden' : '';
      }
    },
    listen,
  );

  /* ---------- same-page anchors ---------- */
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href') ?? '';
      if (id.length < 2 && id !== '#top') return;
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      const wasOpen = document.body.classList.contains('menu-open');
      if (wasOpen) setMenu(false);
      const y = id === '#top' ? 0 : target.getBoundingClientRect().top + scrollY;
      setTimeout(
        () => {
          if (lenis) {
            // Long trips (e.g. "back to top" from the footer, ~10,000px) need a longer, gentler glide: with a fixed
            // 1.4s and an ease-out curve almost the whole distance passed in the first few frames and it looked like a jump.
            const dist = Math.abs(y - scrollY);
            const duration = Math.min(3.4, Math.max(1.1, 0.8 + dist / 3200));
            const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
            lenis.scrollTo(y, { duration, easing: easeInOutCubic });
          } else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        },
        wasOpen ? 60 : 0,
      );
    },
    // Capture phase: this must run BEFORE Astro's page router, which also listens for clicks on links. The router skips
    // clicks that are already defaultPrevented; if it saw this one first it would jump to the hash instantly (no glide).
    { ...listen, capture: true },
  );

  /* ---------- sticky header: colour follows the section underneath + thin reading progress ---------- */
  const hdr = $('[data-hdr]');
  const darks = $$('[data-theme="dark"]');
  const curtain = $('[data-curtain]');
  const syncHeader = () => {
    if (!hdr) return;
    const probe = 38;
    // The hero stays pinned, so its box never moves; once the curtain has passed the header it no longer counts.
    const covered = curtain ? curtain.getBoundingClientRect().top <= probe : false;
    const onDark = darks.some((el) => {
      if (covered && el.classList.contains('hero')) return false;
      const r = el.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    hdr.classList.toggle('on-dark', onDark);
    hdr.classList.toggle('is-solid', scrollY > 40);
    const max = root.scrollHeight - innerHeight;
    hdr.style.setProperty('--progress', max > 0 ? String(Math.min(1, Math.max(0, scrollY / max))) : '0');
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncHeader });
  addEventListener('resize', syncHeader, listen);
  syncHeader();

  if (reduce) {
    $$('[data-count]').forEach((n) => {
      n.textContent = fmt(Number(n.dataset.count));
    });
    // Without the sticky stage, the services list becomes an accordion at every screen size.
    const accRoot = $('[data-tabs]');
    if (accRoot) cleanups.push(mountAccordion(accRoot));
    return destroy;
  }

  // Magnetic buttons + press feedback (skipped for reduced motion).
  cleanups.push(mountMagnet());

  /* ---------- hero: media settles, headline rises line by line from behind a mask ---------- */
  const heroImg = $$('.hero__media img, .hero__media video');
  if (heroImg.length) gsap.fromTo(heroImg, { scale: 1.08 }, { scale: 1, duration: 2, ease: 'power2.out' });

  /* ---------- hero curtain: the hero stays pinned (CSS sticky) while the next section slides up over it.
     Progress is measured on the curtain, never on the hero, because a pinned element's own box does not move. ---------- */
  const hero = $('.hero');
  const heroVideo = $<HTMLVideoElement>('.hero__video');
  if (hero && curtain) {
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: curtain,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          // Nothing of the hero is visible once covered, so stop decoding video frames.
          onLeave: () => heroVideo?.pause(),
          onEnterBack: () => void heroVideo?.play().catch(() => {}),
        },
      })
      .to('.hero__media', { scale: 1.12, yPercent: 7 }, 0)
      .to('.hero__shade', { opacity: 0.62 }, 0)
      .to('.hero__inner', { yPercent: -14, opacity: 0, ease: 'power1.in' }, 0);
  }
  const heroLines = $$('.hero .ln__in');
  if (heroLines.length) {
    // CSS hides the lines with translateY(110%); GSAP would read that as a pixel `y` and never clear it,
    // leaving the text stuck under the mask. Pin y to 0 on both ends so only yPercent animates.
    gsap.fromTo(
      heroLines,
      { yPercent: 110, y: 0 },
      { yPercent: 0, y: 0, duration: 1.3, ease: 'power4.out', stagger: 0.12, delay: 0.1 },
    );
  }
  if ($('[data-hero]'))
    gsap.to('[data-hero]', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, delay: 0.35 });

  /* ==========================================================================
     Sticky-scroll sections. Layout is CSS position:sticky (smooth with Lenis);
     JS only reads scroll progress. Each is created in DOM order.
     ========================================================================== */
  mm = gsap.matchMedia();
  const DESKTOP = '(min-width: 901px)';
  const pad = (n: number) => String(n).padStart(2, '0');
  const goTo = (y: number) => (lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' }));

  /* ---------- services: tabs driven by scroll, clickable ---------- */
  const tabsRoot = $('[data-tabs]');
  if (tabsRoot) {
    mm.add(`${DESKTOP} and (prefers-reduced-motion: no-preference)`, () => {
      const tabs = $$('[data-tab]', tabsRoot);
      const imgs = $$('[data-tab-img]', tabsRoot);
      const n = tabs.length;
      let cur = -1;

      const activate = (i: number) => {
        if (i === cur) return;
        cur = i;
        tabs.forEach((t, k) => {
          t.classList.toggle('is-active', k === i);
          $('[data-tab-btn]', t)?.setAttribute('aria-expanded', String(k === i));
        });
        imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
      };
      // Buttons are only meaningful (and focusable) while the sticky stage is active.
      tabs.forEach((t) => $('[data-tab-btn]', t)?.removeAttribute('tabindex'));
      activate(0);

      const st = ScrollTrigger.create({
        trigger: tabsRoot,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress * n;
          const i = Math.min(n - 1, Math.floor(p));
          activate(i);
          tabs.forEach((t, k) => t.style.setProperty('--p', String(k < i ? 1 : k > i ? 0 : Math.min(1, p - i))));
        },
      });

      const handlers = tabs.map((_, i) => () => goTo(st.start + ((i + 0.5) / n) * (st.end - st.start)));
      tabs.forEach((t, i) => $('[data-tab-btn]', t)?.addEventListener('click', handlers[i]));

      return () => {
        cur = -1;
        activate(0);
        tabs.forEach((t, i) => {
          const btn = $('[data-tab-btn]', t);
          btn?.removeEventListener('click', handlers[i]);
          btn?.removeAttribute('aria-expanded');
          btn?.setAttribute('tabindex', '-1');
          t.style.removeProperty('--p');
        });
      };
    });

    // Tablet and mobile: a short accordion instead of a tall list, so there is far less to scroll.
    mm.add('(max-width: 900px)', () => mountAccordion(tabsRoot));
  }

  /* ---------- work: horizontal slider that sticks while you scroll ---------- */
  const slider = $('[data-slider]');
  const track = $('[data-slider-track]');
  if (slider && track) {
    mm.add(`${DESKTOP} and (prefers-reduced-motion: no-preference)`, () => {
      const cur = $('[data-slider-cur]', slider);
      const bar = $('[data-slider-bar]', slider);
      const count = $$('.card:not(.card--end)', track).length;
      let dist = 0;

      const measure = () => {
        // scrollWidth omits the trailing padding of a flex container, so add it back to keep a right gutter.
        const gutter = parseFloat(getComputedStyle(track).paddingRight) || 0;
        dist = Math.max(0, track.scrollWidth + gutter - document.documentElement.clientWidth);
        slider.style.setProperty('--dist', `${dist}px`);
      };
      slider.setAttribute('data-pinned', '');
      measure();

      gsap.to(track, {
        x: () => -dist,
        ease: 'none',
        scrollTrigger: {
          trigger: slider,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onRefreshInit: () => {
            gsap.set(track, { x: 0 });
            measure();
          },
          onUpdate: (self) => {
            if (cur) cur.textContent = pad(Math.min(count, Math.round(self.progress * (count - 1)) + 1));
            bar?.style.setProperty('--p', String(self.progress));
          },
        },
      });

      return () => {
        slider.removeAttribute('data-pinned');
        slider.style.removeProperty('--dist');
        gsap.set(track, { clearProps: 'transform' });
      };
    });
  }

  /* ---------- process: sticky heading, steps light up as they pass ---------- */
  const proc = $('[data-proc]');
  if (proc) {
    mm.add(DESKTOP, () => {
      const steps = $$('[data-step]', proc);
      const cur = $('[data-proc-cur]', proc);
      const set = (i: number) => {
        steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
        if (cur) cur.textContent = pad(i + 1);
      };
      proc.setAttribute('data-proc-live', '');
      set(0);
      steps.forEach((s, i) =>
        ScrollTrigger.create({
          trigger: s,
          start: 'top 58%',
          end: 'bottom 58%',
          onToggle: (self) => {
            if (self.isActive) set(i);
          },
        }),
      );
      return () => {
        proc.removeAttribute('data-proc-live');
        set(0);
      };
    });
  }

  /* ---------- testimonials: sticky scene ----------
     A 100svh stage sticks to the screen (CSS) while the card column rises through the heading; the section's
     height is set here from the column's height so the scroll length always matches the number of cards.
     Without this running (no JS, reduced motion, very short screens) it stays a plain heading + list. */
  const qScene = $('[data-quote-scene]');
  const qCol = $('[data-quote-col]');
  const qTitle = $('[data-quote-title]');
  if (qScene && qCol && qTitle) {
    const SCENE = '(prefers-reduced-motion: no-preference) and (min-height: 520px)';
    const SPEED = 0.9; // scroll distance per distance travelled by the column (1 = card follows the scroll 1:1)
    mm.add(SCENE, () => {
      qScene.setAttribute('data-scene', '');
      const travel = () => innerHeight + qCol.offsetHeight * 0.8;
      const measure = () => {
        qScene.style.height = `${innerHeight + travel() * SPEED}px`;
      };
      measure();
      gsap.fromTo(
        qCol,
        { y: () => innerHeight },
        {
          y: () => -qCol.offsetHeight * 0.8,
          ease: 'none',
          scrollTrigger: {
            trigger: qScene,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onRefreshInit: () => {
              gsap.set(qCol, { y: 0 });
              measure();
            },
          },
        },
      );
      return () => {
        qScene.removeAttribute('data-scene');
        qScene.style.removeProperty('height');
        gsap.set(qCol, { clearProps: 'transform' });
      };
    });
    // Wide screens: the two heading lines slide apart (left line to the left edge, right line to the right edge)
    // over the first third of the scene. Transforms only, so it stays smooth; animating width would reflow the text every frame.
    mm.add(`${DESKTOP} and ${SCENE}`, () => {
      const lines = $$('span', qTitle);
      if (lines.length < 2) return;
      const shift = () => innerWidth * 0.14;
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: qScene,
            start: 'top top',
            end: () => `+=${(qScene.offsetHeight - innerHeight) * 0.3}`,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(lines[0], { x: () => shift() }, { x: 0 }, 0)
        .fromTo(lines[1], { x: () => -shift() }, { x: 0 }, 0);
      return () => {
        gsap.set(lines, { clearProps: 'transform' });
      };
    });
  }

  /* ---------- marquee: scroll-reactive, reverses on scroll up, slows on hover ---------- */
  const marqueeRows = $$('[data-cmq]').map((row) => ({
    row,
    track: $('.cmq__track', row) as HTMLElement,
    per: Number(row.dataset.per),
    dir: row.dataset.dir === 'right' ? 1 : -1,
    speed: Number(row.dataset.speed) || 40,
    x: 0,
    setW: 0,
    hover: 1,
    hoverTarget: 1,
    visible: false,
  }));
  if (marqueeRows.length) {
    const io = new IntersectionObserver((entries) =>
      entries.forEach((en) => {
        const m = marqueeRows.find((r) => r.row === en.target);
        if (m) m.visible = en.isIntersecting;
      }),
    );
    cleanups.push(() => io.disconnect());
    const measure = () =>
      marqueeRows.forEach((m) => {
        const kids = m.track.children;
        // One set = distance between the first item and the first item of the next copy.
        m.setW = (kids[m.per] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft;
        if (m.dir > 0 && m.x === 0) m.x = -m.setW;
      });
    marqueeRows.forEach((m) => {
      m.row.style.overflowX = 'hidden';
      io.observe(m.row);
      m.row.addEventListener('pointerenter', () => {
        m.hoverTarget = 0.12;
      });
      m.row.addEventListener('pointerleave', () => {
        m.hoverTarget = 1;
      });
    });
    measure();
    addEventListener('resize', measure, listen);
    addEventListener('load', measure, listen);

    let lastY = scrollY,
      boost = 0,
      dirMix = 1,
      flip = 1;
    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 64) / 1000;
      const dy = scrollY - lastY;
      lastY = scrollY;
      if (dy !== 0) flip = Math.sign(dy);
      boost += (Math.min(Math.abs(dy) * 0.22, 9) - boost) * 0.08;
      dirMix += (flip - dirMix) * 0.07;
      for (const m of marqueeRows) {
        if (!m.visible || !m.setW) continue;
        m.hover += (m.hoverTarget - m.hover) * 0.08;
        m.x += m.dir * m.speed * (1 + boost) * dirMix * m.hover * dt;
        if (m.x <= -m.setW) m.x += m.setW;
        else if (m.x > 0) m.x -= m.setW;
        m.track.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
      }
    };
    gsap.ticker.add(tick);
    cleanups.push(() => gsap.ticker.remove(tick));
  }

  /* ---------- soft reveal (text and small elements) ---------- */
  const onScreen = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  };
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => {
      // After a long jump, skipped elements show instantly; only what is on screen animates.
      const skipped = els.filter((el) => !onScreen(el));
      const visible = els.filter(onScreen);
      if (skipped.length) gsap.set(skipped, { opacity: 1, y: 0 });
      if (visible.length) gsap.to(visible, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09 });
    },
  });

  /* ---------- image mask reveal: the frame opens from the bottom while the photo settles ---------- */
  $$('[data-mask]').forEach((el) => {
    const img = $('img', el);
    const tl = gsap.timeline({ paused: true });
    tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, 0);
    if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.9, ease: 'power3.out' }, 0);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        if (onScreen(el)) tl.play();
        else tl.progress(1);
      },
    });
  });

  /* ---------- image parallax ---------- */
  $$<HTMLImageElement>('img[data-parallax]').forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  /* ---------- manifesto: words light up with scroll ---------- */
  const mani = $('[data-manifesto]');
  if (mani) {
    const words = (mani.textContent ?? '').trim().split(/\s+/);
    // Words stay real text (no aria-label on a <p>, no aria-hidden) so screen readers read the sentence naturally.
    mani.innerHTML = words.map((w) => `<span class="w">${w} </span>`).join('');
    gsap.fromTo(
      $$('.w', mani),
      { opacity: 0.18 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: { trigger: mani, start: 'top 82%', end: 'bottom 50%', scrub: true },
      },
    );
  }

  /* ---------- count up ---------- */
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () =>
        gsap.to(o, {
          v: end,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = fmt(Math.round(o.v));
          },
        }),
    });
  });

  // Lazy images and fonts change the page height after load, which would leave every scroll trigger measured against
  // a stale layout (effects starting late or early). Re-measure, debounced, whenever the document height really changes.
  let lastH = root.scrollHeight;
  let refreshTimer = 0;
  const heightWatch = new ResizeObserver(() => {
    if (Math.abs(root.scrollHeight - lastH) < 4) return;
    lastH = root.scrollHeight;
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 250);
  });
  heightWatch.observe(document.body);
  cleanups.push(() => {
    heightWatch.disconnect();
    clearTimeout(refreshTimer);
  });

  // Layout can settle after images/fonts load; remeasure once everything is in.
  if (document.readyState === 'complete') requestAnimationFrame(() => ScrollTrigger.refresh());
  else addEventListener('load', () => ScrollTrigger.refresh(), listen);
  root.dataset.motion = 'ready';

  return destroy;
}
