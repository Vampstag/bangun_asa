/**
 * Perangkat dasar model 3D (Three.js): bahan, tekstur bata dan genteng, pembuat balok/dinding berlubang/batang miring,
 * dan sistem "bagian" (part) yang muncul bertahap sesuai garis waktu `u`. Satuan model: 1 unit = 1 meter.
 * Dipakai oleh house.ts (rumah) dan shop.ts (ruko), lalu dirangkai di scenes.ts.
 */
import * as T from 'three';

/**
 * rise/growX/growZ tumbuh, drop turun, pop membesar, fade memudar masuk. 'lay' memasang isi InstancedMesh satu per satu
 * (bata, genteng, tulangan), 'seq' memunculkan anak grup berurutan (jalur pipa), 'riseLin' naik rata mengikuti pasangan bata.
 */
export type Kind = 'rise' | 'growX' | 'growZ' | 'drop' | 'pop' | 'fade' | 'static' | 'lay' | 'seq' | 'riseLin';

/** Lapisan bangunan, dipakai tampilan "Struktur", "Instalasi", dan "Denah 3D". */
export type Layer =
  | 'site'
  | 'temp'
  | 'foundation'
  | 'footing'
  | 'rebar'
  | 'structure'
  | 'ring'
  | 'brick'
  | 'wall'
  | 'roofframe'
  | 'rooftile'
  | 'openings'
  | 'mep'
  | 'soil'
  | 'interior'
  | 'fixtures'
  | 'landscape';

export interface Part {
  obj: T.Object3D;
  kind: Kind;
  a: number;
  b: number;
  /** jendela waktu menghilang (opsional) */
  out?: [number, number];
  y0: number;
  h: number;
  mats: T.Material[];
  layer: Layer;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (u: number, a: number, b: number) => (b === a ? (u >= a ? 1 : 0) : clamp01((u - a) / (b - a)));
export const ease = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pengacak deterministik supaya tekstur selalu sama. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (ctx) draw(ctx, w, h);
  const tex = new T.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Pasangan bata setengah batu (running bond). 1 tekstur = 1 m x 1 m. */
export function brickTexture() {
  return canvasTex(256, 252, (c, w, h) => {
    const r = rng(7);
    c.fillStyle = '#cfc5b4';
    c.fillRect(0, 0, w, h);
    const rows = 14;
    const rh = h / rows;
    const bw = 64;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * (bw / 2);
      for (let x = -1; x < w / bw + 1; x++) {
        const l = 36 + r() * 8;
        c.fillStyle = `hsl(${12 + r() * 6}, ${44 + r() * 8}%, ${l}%)`;
        c.fillRect(x * bw + off + 1.5, y * rh + 1.5, bw - 3, rh - 3);
      }
    }
  });
}

/** Genteng berundak (skala abu-abu, warnanya diberikan oleh material). 1 tekstur = 1,6 m x 1,6 m. */
export function tileTexture() {
  return canvasTex(256, 256, (c, w, h) => {
    const rows = 8;
    const rh = h / rows;
    const tw = w / 5;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * (tw / 2);
      for (let x = -1; x < 6; x++) {
        const g = c.createLinearGradient(0, y * rh, 0, (y + 1) * rh);
        g.addColorStop(0, '#f2f2f2');
        g.addColorStop(0.78, '#cfcfcf');
        g.addColorStop(1, '#8e8e8e');
        c.fillStyle = g;
        c.fillRect(x * tw + off + 1, y * rh, tw - 2, rh);
      }
    }
  });
}

/** Papan nama: teks putih di atas warna dasar. */
export function signTexture(text: string, bg: string) {
  const tex = canvasTex(512, 128, (c, w, h) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    c.font = '700 64px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, w / 2, h / 2 + 4);
  });
  tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping;
  return tex;
}

export interface Mats {
  plaster: T.MeshStandardMaterial;
  brick: T.MeshStandardMaterial;
  concrete: T.MeshStandardMaterial;
  struct: T.MeshStandardMaterial;
  roof: T.MeshStandardMaterial;
  steel: T.MeshStandardMaterial;
  wood: T.MeshStandardMaterial;
  frame: T.MeshStandardMaterial;
  red: T.MeshStandardMaterial;
  dark: T.MeshStandardMaterial;
  paper: T.MeshStandardMaterial;
  foliage: T.MeshStandardMaterial;
  trunk: T.MeshStandardMaterial;
  scaffold: T.MeshStandardMaterial;
  ribbon: T.MeshBasicMaterial;
}

export const COLORS = {
  plaster: 0xf1eee7,
  concrete: 0xc4bfb5,
  roof: 0x57524d,
  red: 0xc62828,
  dark: 0x1d1b1a,
  oldWall: 0xcdbb9c,
  oldRoof: 0xb06a45,
};

function std(color: number, o: Partial<T.MeshStandardMaterialParameters> = {}) {
  return new T.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...o });
}

export function makeMats(): Mats {
  const brickTex = brickTexture();
  const tileTex = tileTexture();
  return {
    plaster: std(COLORS.plaster),
    brick: std(0xffffff, { map: brickTex }),
    concrete: std(COLORS.concrete),
    struct: std(COLORS.concrete),
    roof: std(COLORS.roof, { map: tileTex, roughness: 0.8 }),
    steel: std(0x9aa0a6, { roughness: 0.5, metalness: 0.5 }),
    wood: std(0x7a5a43),
    frame: std(0xfafafa, { roughness: 0.6 }),
    red: std(COLORS.red, { roughness: 0.7 }),
    dark: std(COLORS.dark, { roughness: 0.7 }),
    paper: std(0xffffff),
    foliage: std(0x7f9a6a),
    trunk: std(0x6d5340),
    scaffold: std(0xbfc3c7, { roughness: 0.5, metalness: 0.6 }),
    ribbon: new T.MeshBasicMaterial({ color: COLORS.red }),
  };
}

export const edgeMat = new T.LineBasicMaterial({ color: 0x121212, transparent: true, opacity: 0.3 });

/** Skala UV kotak agar pola bata/genteng berukuran tetap (unit = meter per satu ulangan tekstur). */
export function scaleUV(geo: T.BoxGeometry, w: number, h: number, d: number, unit = 1) {
  const uv = geo.attributes.uv as T.BufferAttribute;
  const dims = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * dims[f][0]) / unit, (uv.getY(k) * dims[f][1]) / unit);
    }
  }
  uv.needsUpdate = true;
}

export interface BoxOpts {
  edges?: boolean;
  cast?: boolean;
  /** titik tumpu: 'base' = dasar tengah (default), 'left' = ujung -x, 'back' = ujung -z, 'center' */
  pivot?: 'base' | 'left' | 'back' | 'center';
  uv?: number;
}

/** Balok: (x, y, z) = titik tumpu; y = dasar balok. */
export function box(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: T.Material,
  o: BoxOpts = {},
) {
  const geo = new T.BoxGeometry(w, h, d);
  if (o.uv) scaleUV(geo, w, h, d, o.uv);
  const pivot = o.pivot ?? 'base';
  if (pivot === 'base') geo.translate(0, h / 2, 0);
  else if (pivot === 'left') geo.translate(w / 2, h / 2, 0);
  else if (pivot === 'back') geo.translate(0, h / 2, d / 2);
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = o.cast ?? true;
  m.receiveShadow = true;
  if (o.edges !== false) m.add(new T.LineSegments(new T.EdgesGeometry(geo, 30), edgeMat));
  return m;
}

const Z_AXIS = new T.Vector3(0, 0, 1);

/** Batang dari titik p1 ke p2 (penampang w x h). */
export function bar(p1: T.Vector3, p2: T.Vector3, w: number, h: number, mat: T.Material, edges = true) {
  const dir = new T.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new T.BoxGeometry(w, h, len);
  const m = new T.Mesh(geo, mat);
  m.position.copy(p1).add(p2).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(Z_AXIS, dir.normalize());
  m.castShadow = true;
  m.receiveShadow = true;
  if (edges) m.add(new T.LineSegments(new T.EdgesGeometry(geo, 30), edgeMat));
  return m;
}

/** Pipa silinder dari p1 ke p2 (perancah, tiang). */
export function pipe(p1: T.Vector3, p2: T.Vector3, r: number, mat: T.Material) {
  const dir = new T.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new T.CylinderGeometry(r, r, len, 8);
  const m = new T.Mesh(geo, mat);
  m.position.copy(p1).add(p2).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

export interface Hole {
  /** pusat lubang di sepanjang dinding (0 = tengah dinding) */
  c: number;
  w: number;
  /** tinggi bawah dan atas lubang dari dasar dinding */
  y0: number;
  y1: number;
}

export interface WallSpec {
  len: number;
  h: number;
  t: number;
  x: number;
  z: number;
  rotY: number;
  holes: Hole[];
}

/** Dinding bata dengan lubang pintu/jendela. Dasar di y=0, memanjang sepanjang sumbu x lokal. */
export function wallGroup(spec: WallSpec, mat: T.Material, uv = 1, edges = true) {
  const g = new T.Group();
  const { len, h, t } = spec;
  const holes = [...spec.holes].sort((p, q) => p.c - q.c);
  let cur = -len / 2;
  const seg1 = (x0: number, x1: number, y0: number, y1: number) => {
    const w = x1 - x0;
    const hh = y1 - y0;
    if (w < 0.005 || hh < 0.005) return;
    g.add(box(w, hh, t, (x0 + x1) / 2, y0, 0, mat, { uv, edges }));
  };
  for (const hole of holes) {
    const l = hole.c - hole.w / 2;
    const r = hole.c + hole.w / 2;
    seg1(cur, l, 0, h);
    seg1(l, r, 0, hole.y0);
    seg1(l, r, hole.y1, h);
    cur = r;
  }
  seg1(cur, len / 2, 0, h);
  g.position.set(spec.x, 0, spec.z);
  g.rotation.y = spec.rotY;
  return g;
}

/** Kusen + kaca (dan daun pintu bila y0 = 0) untuk satu lubang, dalam sistem koordinat dinding. */
export function openingGroup(hole: Hole, t: number, mats: Mats, door = false) {
  const g = new T.Group();
  const fw = 0.06;
  const fd = t + 0.04;
  const h = hole.y1 - hole.y0;
  const frameMat = mats.frame.clone();
  const glassMat = new T.MeshStandardMaterial({
    color: 0x7ba6c2,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const add = (m: T.Mesh) => {
    g.add(m);
    return m;
  };
  add(box(fw, h, fd, hole.c - hole.w / 2 + fw / 2, hole.y0, 0, frameMat));
  add(box(fw, h, fd, hole.c + hole.w / 2 - fw / 2, hole.y0, 0, frameMat));
  add(box(hole.w, fw, fd, hole.c, hole.y1 - fw, 0, frameMat));
  if (door) {
    const leafMat = mats.red.clone();
    add(box(hole.w - 2 * fw, h - fw, 0.05, hole.c, hole.y0, 0, leafMat));
    add(box(0.04, 0.04, 0.14, hole.c + hole.w / 2 - 0.2, hole.y0 + h * 0.48, 0, mats.steel.clone(), { edges: false }));
    g.userData.mats = [frameMat, leafMat];
  } else {
    add(box(hole.w, fw, fd, hole.c, hole.y0, 0, frameMat));
    const glass = new T.Mesh(new T.BoxGeometry(hole.w - 2 * fw, h - 2 * fw, 0.015), glassMat);
    glass.position.set(hole.c, hole.y0 + h / 2, 0);
    g.add(glass);
    // sirip tengah jendela
    add(box(0.035, h - 2 * fw, fd * 0.7, hole.c, hole.y0 + fw, 0, frameMat, { edges: false }));
    // ambang jendela menonjol keluar
    add(box(hole.w + 0.12, 0.04, t + 0.16, hole.c, hole.y0 - 0.04, 0.04, mats.concrete.clone()));
    g.userData.mats = [frameMat, glassMat];
  }
  return g;
}

export class Kit {
  group = new T.Group();
  parts: Part[] = [];
  m: Mats = makeMats();
  /** jendela waktu pengecatan dinding (bata menjadi plesteran putih) */
  plaster: [number, number] | null = null;
  plasterFrom = new T.Color(0xb86a4f);
  plasterTo = new T.Color(COLORS.plaster);
  /** bahan yang ikut dicat bersama dinding */
  painted: T.MeshStandardMaterial[] = [];
  /** lapisan untuk bagian yang ditambahkan berikutnya */
  layer: Layer = 'site';
  /** gerak mandiri (drum molen, lengan crane) */
  tickers: ((time: number) => void)[] = [];
  /** bidang tanah: bahan bagian terkubur dipotong di bawahnya. constant 0.8 = galian terbuka, 0.002 = sudah diurug */
  ground = new T.Plane(new T.Vector3(0, 1, 0), 0.8);

  add(
    obj: T.Object3D,
    kind: Kind,
    a: number,
    b: number,
    ex: { out?: [number, number]; h?: number; layer?: Layer } = {},
  ) {
    const mats: T.Material[] = [];
    if (kind === 'fade') {
      obj.traverse((o) => {
        const mesh = o as T.Mesh;
        if (mesh.isMesh) {
          const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mm of ms) {
            mm.transparent = true;
            mm.userData.o = mm.userData.o ?? mm.opacity;
            mats.push(mm);
          }
        }
      });
    }
    this.parts.push({
      obj,
      kind,
      a,
      b,
      out: ex.out,
      y0: obj.position.y,
      h: ex.h ?? 1.5,
      mats,
      layer: ex.layer ?? this.layer,
    });
    this.group.add(obj);
    return obj;
  }

  update(u: number) {
    for (const p of this.parts) {
      let t = p.kind === 'static' ? 1 : ease(seg(u, p.a, p.b));
      if (p.out) t *= 1 - ease(seg(u, p.out[0], p.out[1]));
      const o = p.obj;
      o.visible = t > 0.003;
      // pemasangan satu per satu berjalan rata (bukan melambat di akhir)
      let k = 0;
      if (p.kind === 'lay' || p.kind === 'seq' || p.kind === 'riseLin') {
        k = seg(u, p.a, p.b) * (p.out ? 1 - seg(u, p.out[0], p.out[1]) : 1);
        o.visible = k > 0.001;
      }
      switch (p.kind) {
        case 'lay':
          (o as T.InstancedMesh).count = Math.round((o.userData.total as number) * k);
          break;
        case 'seq': {
          const shown = Math.ceil(o.children.length * k);
          o.children.forEach((c, i) => (c.visible = i < shown));
          break;
        }
        case 'riseLin':
          o.scale.y = Math.max(k, 1e-4);
          break;
        case 'rise':
          o.scale.y = Math.max(t, 1e-4);
          break;
        case 'growX':
          o.scale.x = Math.max(t, 1e-4);
          break;
        case 'growZ':
          o.scale.z = Math.max(t, 1e-4);
          break;
        case 'drop':
          o.position.y = p.y0 + (1 - t) * p.h;
          break;
        case 'pop':
          o.scale.setScalar(Math.max(t, 1e-4));
          break;
        case 'fade':
          for (const m of p.mats) m.opacity = ((m.userData.o as number) ?? 1) * t;
          break;
        default:
          break;
      }
    }
    if (this.plaster) {
      const k = ease(seg(u, this.plaster[0], this.plaster[1]));
      const m = this.m.brick;
      if (k < 0.01) {
        m.map = this.brickTexOrig;
        m.color.set(0xffffff);
      } else {
        m.map = this.whiteTex;
        m.color.copy(this.plasterFrom).lerp(this.plasterTo, k);
      }
      for (const s of this.painted) s.color.copy(new T.Color(COLORS.concrete)).lerp(this.plasterTo, k);
    }
  }

  private brickTexOrig: T.Texture | null = this.m.brick.map;
  private whiteTex = (() => {
    const t = new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    t.colorSpace = T.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  })();

  dispose() {
    this.group.traverse((o) => {
      const mesh = o as T.Mesh;
      if (mesh.isMesh || (o as T.LineSegments).isLineSegments) {
        (mesh.geometry as T.BufferGeometry | undefined)?.dispose();
      }
    });
    for (const k of Object.keys(this.m) as (keyof Mats)[]) this.m[k].dispose();
  }
}
