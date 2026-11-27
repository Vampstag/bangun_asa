/**
 * Panggung bersama untuk ikon 3D (perisai legalitas, kunci rumah): mesin gambar, pencahayaan, bahan, dan fisika gerak.
 *
 * Gerak dihitung terus-menerus dari posisi dan kecepatan, tidak memakai animasi yang diganti-ganti, jadi tidak pernah
 * melompat: disorot kursor, putarannya bertambah cepat dengan halus; dilepas, ia melambat dan berhenti menghadap depan
 * dengan pegas; disorot lagi di tengah jalan, ia lanjut dari posisi dan kecepatan saat itu juga.
 */
import {
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Material,
  MeshPhysicalMaterial,
  type MeshPhysicalMaterialParameters,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Badge {
  /** Mulai animasi masuk (sekali). */
  enter(): void;
  /** Berhenti menggambar saat di luar layar. */
  setRunning(on: boolean): void;
  dispose(): void;
}

/** Keadaan gerak yang diberikan panggung kepada model di setiap frame. */
export interface Motion {
  dt: number;
  /** waktu berjalan (hanya bertambah selama terlihat) */
  clock: number;
  /** detik sejak mulai masuk */
  since: number;
  /** sudut putar utama dari fisika (0 = menghadap depan) */
  spin: number;
  /** 0..1: seberapa kuat gerak diam (melemah saat disorot) */
  sway: number;
  /** true tepat di frame saat kursor mulai menyorot atau layar diketuk */
  nudge: boolean;
  /** kecepatan kursor mendatar di atas ikon (px per detik), sudah dihaluskan */
  push: number;
  /** posisi kursor di atas ikon, -1..1 dari tengah, sudah dihaluskan (0 bila tidak disorot) */
  look: { x: number; y: number };
}

export interface Pose {
  yaw: number;
  pitch: number;
  /** naik-turun (satuan dunia) */
  bob: number;
}

export interface Model {
  object: Group;
  pose(m: Motion): Pose;
  /** pose diam untuk pengguna yang memilih "kurangi animasi" */
  rest(): Pose;
}

export interface Kit {
  /** elemen tempat ikon dipasang (untuk membaca teks dari atribut data-*) */
  host: HTMLElement;
  /** Mendaftarkan geometri supaya ikut dibuang. */
  keep<G extends BufferGeometry>(g: G): G;
  /** Mendaftarkan bahan supaya ikut dibuang. */
  own<M extends Material>(m: M): M;
  paint(color: string, o?: MeshPhysicalMaterialParameters): MeshPhysicalMaterial;
}

const TAU = Math.PI * 2;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
/** Mendekati sasaran secara halus, hasilnya sama berapa pun jumlah frame per detiknya. */
export const approach = (v: number, to: number, rate: number, dt: number) => v + (to - v) * (1 - Math.exp(-rate * dt));

export function createStage(host: HTMLElement, build: (kit: Kit) => Model, opts: { still: boolean }): Badge | null {
  const canvas = document.createElement('canvas');
  canvas.className = 'b3d__canvas';
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, host.clientWidth > 240 ? 2 : 3));
  renderer.toneMapping = NeutralToneMapping; // menjaga merah tetap merah

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const camera = new PerspectiveCamera(24, 1, 0.1, 50);
  camera.position.set(0, 0, 6.35);
  const key = new DirectionalLight(0xffffff, 1.7);
  key.position.set(-3, 3.5, 4);
  const side = new DirectionalLight(0xffd9d4, 1.1);
  side.position.set(4, -1, 2);
  scene.add(key, side);

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const kit: Kit = {
    host,
    keep: (g) => {
      geometries.push(g);
      return g;
    },
    own: (m) => {
      materials.push(m);
      return m;
    },
    paint: (color, o = {}) =>
      kit.own(
        new MeshPhysicalMaterial({
          color: new Color(color),
          roughness: 0.32,
          metalness: 0.08,
          clearcoat: 1,
          clearcoatRoughness: 0.16,
          ...o,
        }),
      ),
  };
  const model = build(kit);
  const rig = new Group();
  rig.add(model.object);
  scene.add(rig);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  /* ---------- gerak ---------- */
  let spin = opts.still ? 0 : -TAU; // sudut putar utama
  let speed = 0; // kecepatan putar (rad/detik)
  let target: number | null = 0; // arah berhenti saat tidak disorot
  let hover = false;
  let boost = 0; // sisa waktu putaran cepat setelah diketuk (detik)
  let nudge = false;
  let push = 0;
  let pushRaw = 0;
  const look = { x: 0, y: 0 };
  const lookRaw = { x: 0, y: 0 };
  let sway = 0;
  let clock = 0;
  let since = -1;
  let running = false;
  let frame = 0;
  let last = 0;
  const shadow = host.querySelector<HTMLElement>('.b3d__shadow');

  const render = (p: Pose, size: number) => {
    rig.rotation.set(p.pitch, p.yaw, 0);
    rig.position.y = p.bob;
    rig.scale.setScalar(size);
    renderer.render(scene, camera);
  };

  const step = (dt: number) => {
    clock += dt;
    since += dt;
    const spinning = hover || boost > 0;
    if (spinning) {
      const want = boost > 0 ? 8.5 : 2.7;
      boost = Math.max(0, boost - dt);
      speed = approach(speed, want, boost > 0 ? 7 : 3, dt);
      spin += speed * dt;
      target = null;
    } else {
      if (target === null) {
        // berhenti menghadap depan: pilih putaran terdekat yang masih bisa dicapai tanpa berbalik mendadak
        const ahead = spin + speed / 3;
        target = Math.round(ahead / TAU) * TAU;
        if (target < ahead - 0.6) target += TAU;
      }
      // pegas teredam kritis: melambat dan mendarat tanpa memantul
      const k = 9;
      speed += (k * (target - spin) - 2 * Math.sqrt(k) * speed) * dt;
      spin += speed * dt;
      if (Math.abs(target - spin) < 0.002 && Math.abs(speed) < 0.01 && Math.abs(spin) >= TAU) {
        // sudut dikembalikan ke dekat nol; satu putaran penuh tampak sama persis
        spin -= target;
        target = 0;
      }
    }
    sway = approach(sway, spinning || since < 1.2 ? 0 : 1, spinning ? 4 : 1.1, dt);
    push = approach(push, pushRaw, 10, dt);
    pushRaw = approach(pushRaw, 0, 12, dt);
    look.x = approach(look.x, lookRaw.x, 5, dt);
    look.y = approach(look.y, lookRaw.y, 5, dt);

    const p = model.pose({ dt, clock, since, spin, sway, nudge, push, look });
    nudge = false;
    const grow = 1 - Math.pow(1 - clamp01(since / 1.1), 3);
    render(p, 0.45 + 0.55 * grow);
    if (shadow) {
      // bayangan lantai: menyempit saat ikon naik atau terlihat dari samping
      const high = (Math.sin(clock * 1.6) + 1) * 0.5;
      const wide = (0.45 + 0.55 * Math.abs(Math.cos(p.yaw))) * (1 - 0.1 * high) * grow;
      shadow.style.transform = `scaleX(${wide.toFixed(3)})`;
      shadow.style.opacity = String((1 - 0.25 * high) * grow);
    }
    host.dataset.yaw = p.yaw.toFixed(4);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!running || since < 0) return;
    // jeda panjang (tab disembunyikan, di luar layar) tidak membuat loncatan
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    step(dt);
    frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!frame && running && since >= 0 && !opts.still) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  };

  const ac = new AbortController();
  const on = { signal: ac.signal };
  let px: number | null = null;
  let pt = 0;
  host.addEventListener(
    'pointerenter',
    (e) => {
      if (e.pointerType === 'touch') return;
      hover = true;
      nudge = true;
    },
    on,
  );
  host.addEventListener(
    'pointermove',
    (e) => {
      if (px !== null && e.timeStamp > pt) pushRaw = ((e.clientX - px) / (e.timeStamp - pt)) * 1000;
      if (e.pointerType !== 'touch') {
        const r = host.getBoundingClientRect();
        lookRaw.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        lookRaw.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      }
      px = e.clientX;
      pt = e.timeStamp;
    },
    on,
  );
  host.addEventListener(
    'pointerleave',
    () => {
      hover = false;
      px = null;
      lookRaw.x = lookRaw.y = 0;
    },
    on,
  );
  // di HP: diketuk berarti berputar satu dorongan
  host.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch') return;
      boost = 0.55;
      nudge = true;
    },
    on,
  );

  const still = () => render(model.rest(), 1);

  host.append(canvas);
  const ro = new ResizeObserver(() => {
    resize();
    if (opts.still) still();
    else if (!frame && since >= 0) step(0);
  });
  ro.observe(canvas);
  resize();

  return {
    enter() {
      if (since >= 0) return;
      since = 0;
      host.classList.add('is-3d');
      if (opts.still) still();
      else wake();
    },
    setRunning(v) {
      running = v;
      if (v) wake();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    dispose() {
      ac.abort();
      ro.disconnect();
      cancelAnimationFrame(frame);
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
