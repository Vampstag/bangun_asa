/**
 * Penampil 3D (Three.js): satu kanvas per model. Render hanya saat terlihat, hemat di HP, diam bila pengguna memilih
 * "kurangi animasi". Model proses mengikuti scroll; model layanan berputar dan membangun sendiri berulang-ulang.
 */
import * as T from 'three';
import { SCENES, type Scene3D } from './scenes';
import { clamp01 } from './kit';
import { bake } from './bake';
import { fullState, restore, showLayers, type View } from './layers';

export interface Mounted {
  /** Untuk model yang berbagi kanvas: hanya yang aktif yang menggambar. Saat diaktifkan, animasinya mulai dari awal. */
  setActive(on: boolean): void;
  dispose(): void;
}

export interface MountOpts {
  /** jenis model; bawaan dari atribut data-model */
  kind?: string;
  /** mesin gambar bersama (pemiliknya yang membuang) */
  renderer?: T.WebGLRenderer;
}

function gridTexture() {
  const size = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d');
  if (c) {
    c.strokeStyle = 'rgba(18,18,18,0.16)';
    c.lineWidth = 1.5;
    const step = size / 20;
    for (let i = 0; i <= 20; i++) {
      c.beginPath();
      c.moveTo(i * step, 0);
      c.lineTo(i * step, size);
      c.moveTo(0, i * step);
      c.lineTo(size, i * step);
      c.stroke();
    }
    c.globalCompositeOperation = 'destination-in';
    const g = c.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
  }
  const t = new T.CanvasTexture(cv);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function createRenderer(canvas: HTMLCanvasElement): T.WebGLRenderer | null {
  const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
  let renderer: T.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = !coarse;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  return renderer;
}

export function mount(el: HTMLElement, opts: MountOpts = {}): Mounted | null {
  const kind = opts.kind ?? el.dataset.model ?? 'process';
  const canvas = el.querySelector('canvas');
  const make = SCENES[kind];
  if (!canvas || !make) return null;

  const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 901px)');

  const own = !opts.renderer;
  const made = opts.renderer ?? createRenderer(canvas);
  if (!made) return null;
  const renderer: T.WebGLRenderer = made;

  const scene = new T.Scene();
  const model: Scene3D = make();
  bake(model.kit.parts);
  const root = new T.Group();
  root.add(model.group);
  scene.add(root);

  // lantai: grid tipis yang memudar dan bidang penerima bayangan
  const ground = new T.Mesh(
    new T.PlaneGeometry(44, 44),
    new T.MeshBasicMaterial({ map: gridTexture(), transparent: true, depthWrite: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  root.add(ground);
  const shadow = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({ opacity: 0.2 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  shadow.receiveShadow = true;
  root.add(shadow);

  scene.add(new T.HemisphereLight(0xffffff, 0xd9d2c6, 1.15));
  const sun = new T.DirectionalLight(0xffffff, 2.3);
  sun.position.set(9, 16, 11);
  sun.castShadow = !coarse;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -14;
  sc.right = 14;
  sc.top = 14;
  sc.bottom = -14;
  sc.near = 1;
  sc.far = 60;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  const camera = new T.PerspectiveCamera(28, 1, 0.5, 220);
  const EL = 0.5;

  // Ukur bangunan utuh (tanpa garis batas tapak) untuk menentukan jarak kamera, supaya tidak ada bagian yang terpotong
  // di kanvas, berapa pun rasio kotaknya dan ke mana pun model berputar (putaran mengelilingi sumbu tengah).
  model.update(model.still);
  model.group.updateMatrixWorld(true);
  const box = new T.Box3();
  const tmp = new T.Box3();
  const measure = (o: T.Object3D) => {
    if (!o.visible || o.userData.noFit) return;
    if ((o as T.Mesh).isMesh) box.union(tmp.setFromObject(o));
    else for (const c of o.children) measure(c);
  };
  measure(model.group);
  const cy = (box.min.y + box.max.y) / 2;
  const corners: T.Vector3[] = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) corners.push(new T.Vector3(x, y, z));
  const target = new T.Vector3(0, cy * 0.85, 0);

  // Yang diukur adalah SEMUA bagian di semua tahap (termasuk alat berat, perancah, dan posisi awal bagian yang turun dari
  // atas), jadi tidak ada yang bisa terpotong kanvas. Pada model proses garis batas, pagar, dan pohon ikut dihitung, karena
  // model itu tampil utuh tanpa pudar di tepi.
  const full = kind === 'process';
  {
    const pts: T.Vector3[] = [];
    const add = (bb: T.Box3, lift = 0) => {
      for (const x of [bb.min.x, bb.max.x])
        for (const y of [bb.min.y + lift, bb.max.y + lift])
          for (const z of [bb.min.z, bb.max.z]) pts.push(new T.Vector3(x, y, z));
    };
    for (const part of model.kit.parts) fullState(part);
    model.group.updateMatrixWorld(true);
    const tmp = new T.Box3();
    const measure = (o: T.Object3D, lift: number) => {
      if (!full && o.userData.noFit) return;
      if ((o as T.Mesh).isMesh || (o as T.Sprite).isSprite) {
        tmp.setFromObject(o);
        if (tmp.isEmpty()) return;
        add(tmp);
        if (lift) add(tmp, lift);
      } else for (const c of o.children) measure(c, lift);
    };
    for (const part of model.kit.parts) measure(part.obj, part.kind === 'drop' ? part.h : 0);
    if (full) {
      // grid lantai dibuat memudar habis di dalam bingkai (bukan terpotong tepi kanvas)
      const reach = Math.max(...pts.map((p) => Math.hypot(p.x, p.z)));
      ground.scale.setScalar((reach * 2.05) / 44);
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        pts.push(new T.Vector3(Math.cos(ang) * reach * 0.88, 0, Math.sin(ang) * reach * 0.88));
      }
    }
    corners.length = 0;
    corners.push(...pts);
    model.update(model.still);
  }

  // Pemanasan: render sekali di beberapa titik waktu agar semua bagian (yang muncul dan hilang bertahap) sudah dikompilasi dan
  // diunggah ke GPU sebelum terlihat, jadi tidak ada tersendat saat bagian baru muncul.
  const warm = () => {
    model.update(model.still);
    renderer.compile(scene, camera);
    const ctxs =
      kind === 'process'
        ? [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7].map((u) => ({ u, time: 0 }))
        : [0, 3, 6, 9, 12, 14].map((time) => ({ u: 0, time }));
    for (const c of ctxs) {
      model.update(c);
      renderer.render(scene, camera);
    }
  };

  const fitAt = (elev: number) => {
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Cari jarak kamera paling dekat di mana kotak bangunan, pada setiap sudut putar yang mungkin, masih di dalam zona aman layar.
    const yawLo = full ? model.yaw - 0.35 : model.yaw - 0.95;
    const yawHi = full ? model.yaw + 0.95 : model.yaw + 0.95;
    const safeX = full ? 0.98 : 0.82;
    const safeY = full ? 0.96 : 0.8;
    let top = 0;
    let bottom = 0;
    const v = new T.Vector3();
    const extent = (dist: number) => {
      camera.position.set(target.x, target.y + Math.sin(elev) * dist, target.z + Math.cos(elev) * dist);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      let m = 0;
      top = -Infinity;
      bottom = Infinity;
      for (let i = 0; i <= 8; i++) {
        const yaw = yawLo + ((yawHi - yawLo) * i) / 8;
        const c = Math.cos(yaw);
        const sn = Math.sin(yaw);
        for (const p of corners) {
          v.set(p.x * c + p.z * sn, p.y, -p.x * sn + p.z * c).project(camera);
          top = Math.max(top, v.y);
          bottom = Math.min(bottom, v.y);
          m = Math.max(m, Math.abs(v.x) / safeX, Math.abs(v.y) / safeY);
        }
      }
      return m;
    };
    const closest = () => {
      let lo = 4;
      let hi = 400;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (extent(mid) > 1) lo = mid;
        else hi = mid;
      }
      extent(hi);
      return hi;
    };
    target.set(0, cy * 0.85, 0);
    let dist = closest();
    if (full) {
      const half = Math.tan((camera.fov * Math.PI) / 360);
      for (let pass = 0; pass < 4; pass++) {
        target.y += (((top + bottom) / 2) * dist * half) / Math.cos(elev);
        dist = closest();
      }
    }
    return { pos: camera.position.clone(), look: target.clone() };
  };

  let shotNormal = { pos: new T.Vector3(), look: new T.Vector3() };
  let shotPlan = shotNormal;
  let tilt = 0;
  const place = () => {
    camera.position.lerpVectors(shotNormal.pos, shotPlan.pos, tilt);
    camera.lookAt(shotNormal.look.clone().lerp(shotPlan.look, tilt));
  };
  const fit = () => {
    shotNormal = fitAt(EL);
    shotPlan = full ? fitAt(0.98) : shotNormal;
    place();
  };

  const section = el.closest('section');
  const steps = section?.querySelector<HTMLElement>('.proc__steps') ?? null;
  const capEl =
    (el.closest('[data-m3d-wrap]') ?? el.parentElement)?.querySelector<HTMLElement>('[data-m3d-cap]') ?? null;
  let captions: string[] = [];
  try {
    captions = JSON.parse(el.dataset.captions ?? '[]') as string[];
  } catch {
    captions = [];
  }

  let cur = 0;
  let view: View = 'follow';
  let applied: View = 'follow';
  let drag = 0;
  let dragFrom: number | null = null;
  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  let snap = true;
  let raf = 0;
  let visible = false;
  let lastCap = -1;
  let t0 = performance.now();
  let active = true;

  const readProgress = () => {
    if (!steps) return 1;
    const r = steps.getBoundingClientRect();
    // sama dengan garis aktif di motion.ts: desktop 58% tinggi layar, HP 76% (di bawah model yang menempel)
    return clamp01((innerHeight * (wide.matches ? 0.58 : 0.76) - r.top) / r.height);
  };

  const draw = (now: number) => {
    if (!active) return;
    const time = (now - t0) / 1000;
    let idx: number;
    let yaw: number;
    // gerak kursor dihaluskan supaya tidak melompat saat kursor masuk atau keluar
    mx += (tmx - mx) * 0.08;
    my += (tmy - my) * 0.08;
    for (const tick of model.kit.tickers) tick(reduce ? 0 : time);
    const wantTilt = view === 'plan' ? 1 : 0;
    tilt = reduce ? wantTilt : tilt + (wantTilt - tilt) * 0.09;
    place();
    if (view !== applied) {
      restore(model.kit);
      applied = view;
      if (view !== 'follow') {
        model.update({ u: 7, time });
        showLayers(model.kit, view);
      }
    }
    if (kind === 'process') {
      const target = reduce ? 1 : readProgress();
      // setelah kembali terlihat (mis. habis menggulir cepat), langsung ke posisi sebenarnya, tanpa mengejar dari nilai lama
      cur = reduce || snap ? target : cur + (target - cur) * 0.1;
      snap = false;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      idx = view === 'follow' ? model.update({ u: cur * 7, time }) : 6;
      // ayunan pelan di akhir ditumbuhkan bertahap, bukan menyala tiba-tiba
      const idleAmp = reduce ? 0 : 0.15 * Math.min(1, Math.max(0, (cur - 0.9) / 0.1));
      const idle = Math.sin(time * 0.6) * idleAmp;
      yaw = model.yaw + (view === 'follow' ? cur * 0.6 + idle : 0.35) + mx * 0.2 + drag;
    } else {
      idx = model.update(reduce ? model.still : { u: 0, time });
      yaw = model.yaw + (reduce ? 0 : Math.sin(time * 0.25) * 0.5) + mx * 0.4 + drag;
    }
    // putaran dibatasi pada rentang yang sudah diukur, jadi tidak pernah ada bagian keluar bingkai
    root.rotation.y = Math.min(
      full ? model.yaw + 0.95 : model.yaw + 0.95,
      Math.max(full ? model.yaw - 0.35 : model.yaw - 0.95, yaw),
    );
    root.rotation.x = full ? 0 : my * 0.04;
    renderer.render(scene, camera);
    if (capEl && captions.length && idx !== lastCap) {
      lastCap = idx;
      capEl.textContent = captions[Math.min(idx, captions.length - 1)] ?? '';
    }
  };

  const card = el.closest('.sc');
  const covered = () => {
    const next = card?.nextElementSibling;
    if (!card || !next) return false;
    return next.getBoundingClientRect().top < card.getBoundingClientRect().top + 90;
  };
  const loop = (now: number) => {
    raf = 0;
    if (!covered()) draw(now);
    if (active && visible && !reduce) raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const io = new IntersectionObserver(
    ([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) snap = true;
      if (visible) start();
    },
    { rootMargin: '80px' },
  );
  io.observe(el);

  const ro = new ResizeObserver(() => {
    if (!active) return;
    fit();
    if (reduce) draw(performance.now());
  });
  ro.observe(el);
  fit();
  warm();
  if (reduce) draw(performance.now());

  // geser mendatar untuk memutar (di HP, geser tegak tetap menggulir halaman)
  const redraw = () => {
    if (reduce || !visible) draw(performance.now());
  };
  const onDown = (e: PointerEvent) => {
    dragFrom = e.clientX - drag / 0.008;
    el.setPointerCapture?.(e.pointerId);
  };
  const onUp = () => (dragFrom = null);
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);

  const wrap = el.closest('[data-m3d-wrap]');
  const onView = (e: Event) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-view]');
    if (!btn || !wrap) return;
    view = btn.dataset.view as View;
    for (const b of wrap.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', String(b === btn));
    wrap.querySelector('[data-legend]')?.toggleAttribute('hidden', view !== 'mep');
    redraw();
    start();
  };
  wrap?.addEventListener('click', onView);

  const onMove = (e: PointerEvent) => {
    if (dragFrom !== null) {
      drag = Math.min(0.8, Math.max(-0.8, (e.clientX - dragFrom) * 0.008));
      redraw();
      return;
    }
    if (reduce || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    tmx = Math.min(1, Math.max(-1, ((e.clientX - r.left) / r.width) * 2 - 1));
    tmy = Math.min(1, Math.max(-1, ((e.clientY - r.top) / r.height) * 2 - 1));
  };
  const onLeave = () => {
    tmx = 0;
    tmy = 0;
  };
  el.addEventListener('pointermove', onMove, { passive: true });
  el.addEventListener('pointerleave', onLeave);

  return {
    setActive(on) {
      if (on === active) return;
      active = on;
      if (!on) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      t0 = performance.now();
      snap = true;
      fit();
      draw(t0);
      if (visible) start();
    },
    dispose() {
      io.disconnect();
      ro.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      wrap?.removeEventListener('click', onView);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      model.kit.dispose();
      if (own) renderer.dispose();
    },
  };
}
