/**
 * Detail konstruksi: bata per butir, genteng per keping, tulangan, pondasi batu kali, bekisting, perancah, instalasi air dan
 * listrik (MEP), keramik dan perabot, pekerja dengan APD, material di lokasi, dan tower crane. Satuan meter.
 * Benda berjumlah ribuan memakai InstancedMesh (satu kali gambar), jadi tetap ringan di HP.
 */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bar, box, pipe, type Mats, type WallSpec } from './kit';

const std = (color: number, o: Partial<T.MeshStandardMaterialParameters> = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
const UP = V(0, 1, 0);

/** Pengacak tetap, supaya variasi warna selalu sama. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export interface Inst {
  p: T.Vector3;
  s: T.Vector3;
  q?: T.Quaternion;
  c?: T.Color;
}

/** Kumpulan benda identik sebagai satu InstancedMesh. Urutan daftar = urutan pemasangan saat animasi. */
export function instanced(geo: T.BufferGeometry, mat: T.Material, items: Inst[], shadow = true) {
  const mesh = new T.InstancedMesh(geo, mat, Math.max(1, items.length));
  const m = new T.Matrix4();
  const q = new T.Quaternion();
  items.forEach((it, i) => {
    m.compose(it.p, it.q ?? q, it.s);
    mesh.setMatrixAt(i, m);
    if (it.c) mesh.setColorAt(i, it.c);
  });
  mesh.count = items.length;
  mesh.userData.total = items.length;
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

const unitBox = () => new T.BoxGeometry(1, 1, 1);

/* ------------------------------------------------------------------ bata */

export const COURSE = 0.1; // tinggi satu lapis bata + siar
const BRICK = 0.3; // panjang bata + siar
export const LINTEL = 0.15;

/** Bata untuk satu dinding berlubang, pasangan setengah bata (running bond). Disisakan tempat untuk balok latei. */
export function wallBricks(spec: WallSpec, base: number, out: Inst[], rand: () => number, columns: number[] = []) {
  const { len, h, t } = spec;
  const q = new T.Quaternion().setFromAxisAngle(UP, spec.rotY);
  const courses = Math.round(h / COURSE);
  for (let j = 0; j < courses; j++) {
    const y = j * COURSE + COURSE / 2;
    const off = (j % 2) * (BRICK / 2);
    for (let x = -len / 2 - off; x < len / 2 - 0.01; x += BRICK) {
      let parts: [number, number][] = [[Math.max(x, -len / 2), Math.min(x + BRICK, len / 2)]];
      for (const hole of spec.holes) {
        const top = hole.y1 < h - 0.05 ? hole.y1 + LINTEL : hole.y1;
        if (y < hole.y0 || y > top) continue;
        const ext = y > hole.y1 ? 0.15 : 0; // balok latei menumpang 15 cm di kiri dan kanan
        const l = hole.c - hole.w / 2 - ext;
        const r = hole.c + hole.w / 2 + ext;
        parts = parts.flatMap(([a, b]): [number, number][] => {
          if (b <= l || a >= r) return [[a, b]];
          const keep: [number, number][] = [];
          if (a < l) keep.push([a, l]);
          if (b > r) keep.push([r, b]);
          return keep;
        });
      }
      // ujung bata di sisi kolom dibuat bergerigi (selang-seling tiap dua lapis) supaya beton kolom mengunci dinding
      for (const lx of columns) {
        const half = Math.floor(j / 2) % 2 === 0 ? 0.078 : 0.14;
        parts = parts.flatMap(([a, b]): [number, number][] => {
          if (b <= lx - half || a >= lx + half) return [[a, b]];
          const keep: [number, number][] = [];
          if (a < lx - half) keep.push([a, lx - half]);
          if (b > lx + half) keep.push([lx + half, b]);
          return keep;
        });
      }
      for (const [a, b] of parts) {
        if (b - a < 0.05) continue;
        const p = V((a + b) / 2, 0, 0).applyQuaternion(q);
        p.set(p.x + spec.x, base + y, p.z + spec.z);
        out.push({
          p,
          q,
          s: V(b - a - 0.014, COURSE - 0.014, t * 0.9),
          c: new T.Color().setHSL(0.035 + rand() * 0.02, 0.45 + rand() * 0.1, 0.38 + rand() * 0.09),
        });
      }
    }
  }
}

/** Bata dinding segitiga (gable) di ujung atap. */
export function gableBricks(
  x: number,
  base: number,
  halfW: number,
  rise: number,
  t: number,
  out: Inst[],
  rand: () => number,
) {
  const q = new T.Quaternion().setFromAxisAngle(UP, Math.PI / 2);
  for (let j = 0; j * COURSE < rise - 0.03; j++) {
    const y = j * COURSE + COURSE / 2;
    const w = halfW * (1 - (y + COURSE / 2) / rise);
    const off = (j % 2) * (BRICK / 2);
    for (let z = -halfW - off; z < halfW; z += BRICK) {
      const a = Math.max(z, -w);
      const b = Math.min(z + BRICK, w);
      if (b - a < 0.05) continue;
      out.push({
        p: V(x, base + y, (a + b) / 2),
        q,
        s: V(b - a - 0.014, COURSE - 0.014, t * 0.9),
        c: new T.Color().setHSL(0.035 + rand() * 0.02, 0.45 + rand() * 0.1, 0.38 + rand() * 0.09),
      });
    }
  }
}

export const brickMesh = (items: Inst[]) => instanced(unitBox(), std(0xffffff, { roughness: 0.95 }), items);

/* ------------------------------------------------------------------ genteng */

/** Satu keping genteng beton: pelat, bibir samping, dan bibir bawah. */
export function tileGeometry() {
  const plate = new T.BoxGeometry(0.29, 0.022, 0.34);
  const side = new T.BoxGeometry(0.05, 0.05, 0.34).translate(0.115, 0.012, 0);
  const lip = new T.BoxGeometry(0.29, 0.04, 0.045).translate(0, 0.01, 0.148);
  const g = mergeGeometries([plate, side, lip]);
  plate.dispose();
  side.dispose();
  lip.dispose();
  return g;
}

/** Genteng satu sisi atap pelana, dipasang baris demi baris dari lisplang ke bubungan. sgn: 1 = sisi +z. */
export function roofTiles(
  sgn: number,
  pitch: number,
  ridgeY: number,
  eaveZ: number,
  halfX: number,
  mat: T.Material,
  rand: () => number,
) {
  const L = eaveZ / Math.cos(pitch);
  const q = new T.Quaternion().setFromEuler(new T.Euler(pitch, 0, 0));
  if (sgn < 0) q.premultiply(new T.Quaternion().setFromAxisAngle(UP, Math.PI));
  const items: Inst[] = [];
  const rows = Math.ceil(L / 0.29);
  const cols = Math.round((halfX * 2) / 0.29);
  const cw = (halfX * 2) / cols;
  for (let r = 0; r < rows; r++) {
    const s = Math.max(0.16, L - 0.15 - r * 0.29);
    const lift = 0.112;
    for (let c = 0; c < cols; c++) {
      const shade = 0.86 + rand() * 0.22;
      items.push({
        p: V(-halfX + cw / 2 + c * cw, ridgeY - s * Math.sin(pitch) + lift, sgn * s * Math.cos(pitch)),
        q,
        s: V(cw / 0.29, 1, 1),
        c: new T.Color(shade, shade, shade),
      });
    }
  }
  return instanced(tileGeometry(), mat, items);
}

/** Bubungan: genteng nok setengah lingkaran yang saling menumpang. */
export function ridgeTiles(y: number, halfX: number, mat: T.Material) {
  const geo = new T.CylinderGeometry(0.13, 0.145, 0.42, 14, 1, true, 0, Math.PI);
  geo.rotateZ(Math.PI / 2);
  const items: Inst[] = [];
  for (let x = -halfX + 0.2; x <= halfX - 0.1; x += 0.36)
    items.push({ p: V(x, y + 0.12, 0), s: V(1, 1, 1), c: new T.Color(0.97, 0.97, 0.97) });
  // memakai bahan yang sama dengan genteng, jadi ikut berubah warna saat atap diganti
  mat.side = T.DoubleSide;
  return instanced(geo, mat, items);
}

/** Reng (dudukan genteng) satu sisi. */
export function battens(sgn: number, pitch: number, ridgeY: number, eaveZ: number, halfX: number, mat: T.Material) {
  const L = eaveZ / Math.cos(pitch);
  const items: Inst[] = [];
  const q = new T.Quaternion().setFromEuler(new T.Euler(sgn * pitch, 0, 0));
  for (let s = L - 0.05; s > 0.1; s -= 0.29) {
    items.push({
      p: V(0, ridgeY - s * Math.sin(pitch) + 0.082, sgn * s * Math.cos(pitch)),
      q,
      s: V(halfX * 2, 0.028, 0.028),
    });
  }
  return instanced(unitBox(), mat, items, false);
}

/* ------------------------------------------------------------------ tulangan dan pondasi */

export const rebarMat = () => std(0x8a4b34, { roughness: 0.55, metalness: 0.45 });

/** Posisi (di sepanjang dinding) kolom-kolom yang berada pada dinding itu. */
export function columnsOnWall(spec: WallSpec, columns: [number, number][]) {
  const inv = new T.Quaternion().setFromAxisAngle(UP, -spec.rotY);
  const out: number[] = [];
  for (const [x, z] of columns) {
    const v = V(x - spec.x, 0, z - spec.z).applyQuaternion(inv);
    if (Math.abs(v.z) < 0.09 && Math.abs(v.x) <= spec.len / 2 + 0.12) out.push(v.x);
  }
  return out;
}

/** Angkur dinding ke kolom: besi 10 mm sepanjang 40 cm setiap 6 lapis bata (±60 cm). */
export function anchors(spec: WallSpec, columns: number[], base: number, out: Inst[]) {
  const q = new T.Quaternion().setFromAxisAngle(UP, spec.rotY);
  for (const lx of columns) {
    for (let k = 1; k <= 4; k++) {
      const y = k * COURSE * 6;
      for (const dir of [-1, 1]) {
        const end = lx + dir * 0.45;
        if (Math.abs(end) > spec.len / 2 + 0.02) continue;
        const blocked = spec.holes.some(
          (h) =>
            y > h.y0 && y < h.y1 + LINTEL && Math.max(lx, end) > h.c - h.w / 2 && Math.min(lx, end) < h.c + h.w / 2,
        );
        if (blocked) continue;
        const p = V(lx + dir * 0.23, 0, 0).applyQuaternion(q);
        p.set(p.x + spec.x, base + y, p.z + spec.z);
        out.push({ p, q, s: V(0.42, 0.018, 0.018) });
      }
    }
  }
}

export const anchorMesh = (items: Inst[], mat: T.Material) => instanced(unitBox(), mat, items, false);

/** Tekstur pasangan batu kali: batu tak beraturan dengan siar. 1 tekstur = 1 m. */
export function stoneTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  if (c) {
    const rand = seeded(29);
    c.fillStyle = '#b4ada0';
    c.fillRect(0, 0, 256, 256);
    const cell = 51.2;
    for (let y = 0; y < 5; y++)
      for (let x = -1; x < 6; x++) {
        const cx = x * cell + (y % 2) * (cell / 2) + cell / 2;
        const cy = y * cell + cell / 2;
        c.beginPath();
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const r = cell * (0.36 + rand() * 0.14);
          c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.86);
        }
        c.closePath();
        c.fillStyle = `hsl(${28 + rand() * 14}, ${6 + rand() * 7}%, ${38 + rand() * 20}%)`;
        c.fill();
      }
  }
  const t = new T.CanvasTexture(cv);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

/** Lapisan di bawah batu kali: batu kosong (aanstamping) disusun berdiri. */
export function emptyStones(lines: Line[], y: number, mat: T.Material, rand: () => number) {
  const items: Inst[] = [];
  for (const l of lines)
    for (let t = 0.05; t < l.len; t += 0.17)
      for (const side of [-0.22, 0, 0.22]) {
        const j = (rand() - 0.5) * 0.05;
        const p = l.axis === 'x' ? V(l.x + t + j, y, l.z + side + j) : V(l.x + side + j, y, l.z + t + j);
        items.push({
          p,
          q: new T.Quaternion().setFromEuler(new T.Euler(rand() * 0.5, rand() * 3, rand() * 0.5)),
          s: V(0.85 + rand() * 0.3, 1.1 + rand() * 0.35, 0.85 + rand() * 0.3),
          c: new T.Color().setHSL(0.09, 0.06, 0.3 + rand() * 0.18),
        });
      }
  return instanced(new T.DodecahedronGeometry(0.075, 0), mat, items, false);
}

/** Badan pondasi batu kali berpenampang trapesium (lebar bawah dan atas), memanjang dari 0 ke arah sumbu lokal. */
export function trapezoid(
  len: number,
  bottom: number,
  top: number,
  height: number,
  mat: T.Material,
  edge: T.LineBasicMaterial,
  axis: 'x' | 'z',
) {
  const sh = new T.Shape();
  sh.moveTo(-bottom / 2, 0);
  sh.lineTo(bottom / 2, 0);
  sh.lineTo(top / 2, height);
  sh.lineTo(-top / 2, height);
  sh.closePath();
  const geo = new T.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false });
  if (axis === 'x') geo.rotateY(Math.PI / 2);
  const m = new T.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  m.add(new T.LineSegments(new T.EdgesGeometry(geo, 30), edge));
  const g = new T.Group();
  g.add(m);
  return g;
}

/**
 * Tulangan satu kolom dari dasar pondasi sampai ring balok: 4 besi pokok dengan kait L di bawah dan di atas, sengkang
 * tiap 15 cm, dirapatkan jadi 7,5 cm pada 45 cm dekat sloof dan ring balok. Titik asal grup di y = bottom.
 */
export function columnCage(
  bottom: number,
  top: number,
  dense: [number, number][],
  mat: T.Material,
  line: T.LineBasicMaterial,
) {
  const g = new T.Group();
  g.position.y = bottom;
  const h = top - bottom;
  for (const [dx, dz] of [
    [-0.045, -0.045],
    [0.045, -0.045],
    [-0.045, 0.045],
    [0.045, 0.045],
  ]) {
    g.add(pipe(V(dx, 0, dz), V(dx, h, dz), 0.008, mat));
    g.add(pipe(V(dx, 0.005, dz), V(dx + Math.sign(dx) * 0.24, 0.005, dz), 0.008, mat));
    g.add(pipe(V(dx, h, dz), V(dx - Math.sign(dx) * 0.22, h, dz), 0.008, mat));
  }
  let y = 0.08;
  while (y < h - 0.03) {
    const r = 0.056;
    g.add(
      new T.LineLoop(new T.BufferGeometry().setFromPoints([V(-r, y, -r), V(r, y, -r), V(r, y, r), V(-r, y, r)]), line),
    );
    const world = y + bottom;
    y += dense.some(([a, b]) => world >= a && world <= b) ? 0.075 : 0.15;
  }
  return g;
}

export interface Line {
  x: number;
  z: number;
  len: number;
  axis: 'x' | 'z';
}

/** Rangkaian besi balok (sloof atau ring balok): 4 besi pokok dan sengkang tiap 25 cm. */
export function beamCage(lines: Line[], y: number, w: number, h: number, mat: T.Material) {
  const items: Inst[] = [];
  const dx = w / 2 - 0.025;
  const dy = h / 2 - 0.03;
  for (const l of lines) {
    const along = (t: number, side: number, up: number) =>
      l.axis === 'x' ? V(l.x + t, y + up, l.z + side) : V(l.x + side, y + up, l.z + t);
    for (const side of [-dx, dx])
      for (const up of [-dy, dy])
        items.push({
          p: along(l.len / 2, side, up),
          s: l.axis === 'x' ? V(l.len, 0.014, 0.014) : V(0.014, 0.014, l.len),
        });
    for (let t = 0.12; t < l.len; t += 0.25) {
      for (const up of [-dy, dy])
        items.push({ p: along(t, 0, up), s: l.axis === 'x' ? V(0.008, 0.008, dx * 2) : V(dx * 2, 0.008, 0.008) });
      for (const side of [-dx, dx]) items.push({ p: along(t, side, 0), s: V(0.008, dy * 2, 0.008) });
    }
  }
  return instanced(unitBox(), mat, items, false);
}

/** Pondasi menerus batu kali di bawah sloof. */
export function stoneFoundation(lines: Line[], rand: () => number) {
  const items: Inst[] = [];
  for (let layer = 0; layer < 2; layer++) {
    for (const l of lines) {
      const spread = layer === 0 ? 0.15 : 0.08;
      for (let t = 0.1; t < l.len; t += 0.19) {
        for (const side of [-spread, spread]) {
          const j = (rand() - 0.5) * 0.05;
          const p =
            l.axis === 'x'
              ? V(l.x + t + j, 0.07 + layer * 0.12, l.z + side)
              : V(l.x + side, 0.07 + layer * 0.12, l.z + t + j);
          const shade = 0.34 + rand() * 0.2;
          items.push({
            p,
            q: new T.Quaternion().setFromEuler(new T.Euler(rand() * 3, rand() * 3, rand() * 3)),
            s: V(0.9 + rand() * 0.5, 0.7 + rand() * 0.35, 0.9 + rand() * 0.4),
            c: new T.Color().setHSL(0.09, 0.07, shade),
          });
        }
      }
    }
  }
  return instanced(new T.DodecahedronGeometry(0.1, 0), std(0xffffff, { roughness: 1, flatShading: true }), items);
}

/** Bekisting kayu di sekeliling kolom saat dicor, lengkap dengan klem. */
export function formwork(x: number, z: number, y: number, h: number, ply: T.Material, wood: T.Material) {
  const g = new T.Group();
  g.position.set(x, y, z);
  for (const side of [-0.1, 0.1]) g.add(box(0.22, h, 0.022, 0, 0, side, ply, { cast: false }));
  for (let k = 0; k < 4; k++) {
    const yy = 0.35 + k * 0.75;
    for (const side of [-0.135, 0.135]) g.add(box(0.34, 0.05, 0.04, 0, yy, side, wood, { edges: false }));
  }
  return g;
}

/** Perancah pipa di satu sisi dinding: dua baris tiang, palang, papan pijak, dan silang pengaku. */
export function scaffoldFace(
  p0: [number, number],
  p1: [number, number],
  normal: [number, number],
  mats: Mats,
  top = 3.0,
) {
  const g = new T.Group();
  const [x0, z0] = p0;
  const [x1, z1] = p1;
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.round(len / 1.6));
  const at = (t: number, off: number, y: number) =>
    V(x0 + (x1 - x0) * t + normal[0] * off, y, z0 + (z1 - z0) * t + normal[1] * off);
  const near = 0.45;
  const far = 1.05;
  for (let i = 0; i <= n; i++) {
    for (const off of [near, far]) g.add(pipe(at(i / n, off, 0), at(i / n, off, top), 0.026, mats.scaffold));
    for (const y of [1.5, 2.75]) g.add(pipe(at(i / n, near, y), at(i / n, far, y), 0.018, mats.scaffold));
  }
  for (const off of [near, far])
    for (const y of [0.35, 1.5, 2.75]) g.add(pipe(at(0, off, y), at(1, off, y), 0.018, mats.scaffold));
  for (let i = 0; i < n; i++) {
    g.add(pipe(at(i / n, far, 0.35), at((i + 1) / n, far, 1.5), 0.012, mats.scaffold));
    g.add(pipe(at((i + 1) / n, far, 1.5), at(i / n, far, 2.75), 0.012, mats.scaffold));
  }
  for (const y of [1.54, 2.79])
    g.add(bar(at(0, (near + far) / 2, y), at(1, (near + far) / 2, y), 0.5, 0.04, mats.wood, false));
  return g;
}

/* ------------------------------------------------------------------ orang (dengan APD) */

const SKIN = 0xc99573;

export interface PersonOpts {
  vest?: number | null;
  helmet?: number | null;
  shirt?: number;
  pants?: number;
  pose?: 'stand' | 'crouch' | 'reach' | 'hold';
  hijab?: number;
}

/** Orang setinggi ±1,7 m: pekerja memakai helm dan rompi reflektif. */
export function person(o: PersonOpts = {}) {
  const g = new T.Group();
  const pose = o.pose ?? 'stand';
  const vest = o.vest === undefined ? 0xf26b1d : o.vest;
  const helmet = o.helmet === undefined ? 0xf2c230 : o.helmet;
  const pants = std(o.pants ?? 0x2b3346);
  const shirt = std(o.shirt ?? 0x56616f);
  const skin = std(SKIN);
  const low = pose === 'crouch' ? 0.34 : 0;
  for (const x of [-0.1, 0.1]) {
    if (pose === 'crouch') {
      g.add(bar(V(x, 0.48, -0.1), V(x, 0.5, 0.24), 0.14, 0.14, pants, false));
      g.add(box(0.13, 0.48, 0.14, x, 0, 0.22, pants, { edges: false }));
    } else g.add(box(0.14, 0.82, 0.16, x, 0, 0, pants, { edges: false }));
    g.add(box(0.15, 0.08, 0.24, x, 0, pose === 'crouch' ? 0.27 : 0.04, std(0x1c1a19), { edges: false }));
  }
  const body = new T.Group();
  body.position.set(0, 0.82 - low, pose === 'crouch' ? -0.1 : 0);
  if (pose === 'crouch') body.rotation.x = 0.45;
  body.add(box(0.42, 0.6, 0.24, 0, 0, 0, vest === null ? shirt : std(vest, { roughness: 0.7 }), { edges: false }));
  if (vest !== null) {
    const strip = std(0xe9edf0, { emissive: 0x8a9096, emissiveIntensity: 0.35 });
    for (const y of [0.14, 0.28]) body.add(box(0.43, 0.035, 0.25, 0, y, 0, strip, { edges: false }));
  }
  const head = new T.Mesh(new T.SphereGeometry(0.13, 14, 12), skin);
  head.position.y = 0.78;
  head.castShadow = true;
  body.add(head);
  if (o.hijab !== undefined) {
    const veil = new T.Mesh(new T.SphereGeometry(0.16, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), std(o.hijab));
    veil.position.y = 0.79;
    const drape = new T.Mesh(new T.ConeGeometry(0.22, 0.34, 14, 1, true), std(o.hijab, { side: T.DoubleSide }));
    drape.position.set(0, 0.6, -0.02);
    body.add(veil, drape);
  } else if (helmet !== null) {
    const dome = new T.Mesh(
      new T.SphereGeometry(0.155, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      std(helmet, { roughness: 0.5 }),
    );
    dome.position.y = 0.82;
    dome.castShadow = true;
    const brim = new T.Mesh(new T.CylinderGeometry(0.175, 0.175, 0.022, 18), std(helmet, { roughness: 0.5 }));
    brim.position.y = 0.825;
    body.add(dome, brim);
  } else {
    const hair = new T.Mesh(new T.SphereGeometry(0.138, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), std(0x241c18));
    hair.position.y = 0.8;
    body.add(hair);
  }
  for (const x of [-0.27, 0.27]) {
    const sleeve = vest === null ? shirt : shirt;
    const elbow = V(x * 1.08, 0.24, pose === 'stand' ? 0.02 : 0.2);
    const hand =
      pose === 'reach' ? V(x * 0.7, 0.55, 0.45) : pose === 'stand' ? V(x * 1.1, -0.06, 0.04) : V(x * 0.55, 0.22, 0.44);
    body.add(bar(V(x, 0.55, 0), elbow, 0.1, 0.1, sleeve, false));
    body.add(bar(elbow, hand, 0.085, 0.085, skin, false));
  }
  g.add(body);
  return g;
}

/** Rambu ukur bergaris merah-putih yang dipegang asisten surveyor. */
export function staffPole(mats: Mats) {
  const g = new T.Group();
  for (let k = 0; k < 10; k++)
    g.add(box(0.07, 0.25, 0.03, 0, k * 0.25, 0, k % 2 ? mats.red : mats.paper, { edges: false }));
  return g;
}

/* ------------------------------------------------------------------ material di lokasi */

export function brickStack(rand: () => number) {
  const g = new T.Group();
  g.add(box(0.9, 0.07, 0.65, 0, 0, 0, std(0x8a6a4a), { edges: false }));
  const items: Inst[] = [];
  for (let l = 0; l < 5; l++)
    for (let i = 0; i < 4; i++)
      for (let k = 0; k < 3; k++) {
        items.push({
          p: V(-0.31 + i * 0.205, 0.11 + l * 0.082, -0.2 + k * 0.2),
          s: V(0.19, 0.072, 0.17),
          c: new T.Color().setHSL(0.04 + rand() * 0.02, 0.5, 0.4 + rand() * 0.08),
        });
      }
  g.add(brickMesh(items));
  return g;
}

export function sandPile() {
  const g = new T.Group();
  const cone = new T.Mesh(new T.ConeGeometry(0.8, 0.55, 18, 3), std(0xb99f74, { roughness: 1, flatShading: true }));
  cone.position.y = 0.27;
  cone.castShadow = true;
  g.add(cone);
  return g;
}

export function cementSacks() {
  const g = new T.Group();
  const sack = std(0xbdb6a6, { roughness: 1 });
  for (let l = 0; l < 3; l++)
    for (let i = 0; i < 2; i++) g.add(box(0.36, 0.13, 0.58, -0.2 + i * 0.4 + (l % 2) * 0.03, l * 0.135, 0, sack));
  return g;
}

/** Molen pengaduk beton. Drum bisa diputar lewat g.userData.drum. */
export function mixer(mats: Mats) {
  const g = new T.Group();
  const paint = std(0xd9891f, { roughness: 0.6, metalness: 0.2 });
  g.add(box(0.9, 0.08, 0.5, 0, 0.28, 0, mats.dark, { edges: false }));
  for (const x of [-0.32, 0.32])
    for (const z of [-0.29, 0.29]) {
      const w = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.09, 14), mats.dark);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.16, z);
      g.add(w);
    }
  const tilt = new T.Group();
  tilt.position.set(0.04, 0.78, 0);
  tilt.rotation.z = -0.6;
  const drum = new T.Group();
  drum.userData.dynamic = true;
  const belly = new T.Mesh(new T.CylinderGeometry(0.34, 0.26, 0.5, 16), paint);
  const mouth = new T.Mesh(
    new T.CylinderGeometry(0.18, 0.34, 0.24, 16, 1, true),
    std(0xd9891f, { side: T.DoubleSide }),
  );
  mouth.position.y = 0.37;
  belly.castShadow = true;
  drum.add(belly, mouth, box(0.04, 0.4, 0.74, 0, -0.2, 0, mats.dark, { edges: false }));
  tilt.add(drum);
  g.add(tilt);
  g.add(bar(V(-0.2, 0.3, 0), V(0.04, 0.78, 0), 0.07, 0.07, mats.steel, false));
  g.userData.drum = drum;
  return g;
}

/* ------------------------------------------------------------------ MEP: air bersih, air kotor, listrik */

export const MEP_COLORS = { water: 0x1f6fe0, waste: 0x2f8a57, power: 0xf0871c };

/** Jalur pipa lewat beberapa titik; setiap ruas dan sambungan jadi anak terpisah supaya bisa muncul berurutan. */
export function run(points: [number, number, number][], r: number, mat: T.Material) {
  const out: T.Object3D[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    out.push(pipe(V(...points[i]), V(...points[i + 1]), r, mat));
    if (i > 0) {
      const joint = new T.Mesh(new T.SphereGeometry(r * 1.45, 10, 8), mat);
      joint.position.set(...points[i]);
      out.push(joint);
    }
  }
  return out;
}

export function group(...items: (T.Object3D | T.Object3D[])[]) {
  const g = new T.Group();
  g.add(...items.flat());
  return g;
}

/** Tandon air di menara baja beserta pompa. */
export function waterTower(mats: Mats) {
  const g = new T.Group();
  const legs: [number, number][] = [
    [-0.42, -0.42],
    [0.42, -0.42],
    [0.42, 0.42],
    [-0.42, 0.42],
  ];
  legs.forEach(([x, z], i) => {
    const [nx, nz] = legs[(i + 1) % 4];
    g.add(pipe(V(x, 0, z), V(x, 2.5, z), 0.035, mats.steel));
    g.add(pipe(V(x, 0.3, z), V(nx, 1.35, nz), 0.014, mats.steel));
    g.add(pipe(V(x, 1.35, z), V(nx, 2.35, nz), 0.014, mats.steel));
  });
  g.add(box(1.0, 0.07, 1.0, 0, 2.5, 0, mats.steel));
  const orange = std(0xe5721d, { roughness: 0.55 });
  const tank = new T.Mesh(new T.CylinderGeometry(0.48, 0.48, 0.86, 22), orange);
  tank.position.y = 3.0;
  tank.castShadow = true;
  const dome = new T.Mesh(new T.SphereGeometry(0.48, 22, 8, 0, Math.PI * 2, 0, Math.PI / 2), orange);
  dome.scale.y = 0.35;
  dome.position.y = 3.43;
  g.add(tank, dome);
  for (const y of [2.78, 3.05, 3.3]) {
    const rib = new T.Mesh(new T.TorusGeometry(0.485, 0.012, 6, 28), orange);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = y;
    g.add(rib);
  }
  g.add(box(0.3, 0.22, 0.22, -0.7, 0.05, 0.25, mats.dark));
  return g;
}

/** Bak beton tembus pandang (septic tank atau penangkap lemak) dengan tutup. */
export function pit(w: number, h: number, d: number) {
  const g = new T.Group();
  g.add(box(w, h, d, 0, 0, 0, std(0x9a948a, { transparent: true, opacity: 0.5, depthWrite: false }), { cast: false }));
  g.add(box(w * 0.34, 0.05, d * 0.5, -w * 0.18, h, 0, std(0x6d675f), { cast: false }));
  return g;
}

export function soakWell(r: number, h: number) {
  const g = new T.Group();
  const m = new T.Mesh(
    new T.CylinderGeometry(r, r, h, 18, 3, true),
    std(0x9a948a, { transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false }),
  );
  m.position.y = h / 2;
  m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry, 20), new T.LineBasicMaterial({ color: 0x4a453f })));
  g.add(m);
  return g;
}

/* ------------------------------------------------------------------ interior */

/** Keramik 60 x 60 dengan nat, dipasang baris demi baris. */
export function floorTiles(x0: number, x1: number, z0: number, z1: number, y: number, rand: () => number) {
  const items: Inst[] = [];
  const nx = Math.round((x1 - x0) / 0.6);
  const nz = Math.round((z1 - z0) / 0.6);
  const sx = (x1 - x0) / nx;
  const sz = (z1 - z0) / nz;
  for (let k = 0; k < nz; k++)
    for (let i = 0; i < nx; i++) {
      const v = 0.8 + rand() * 0.05;
      items.push({
        p: V(x0 + sx * (i + 0.5), y, z0 + sz * (k + 0.5)),
        s: V(sx - 0.018, 0.016, sz - 0.018),
        c: new T.Color(v, v * 0.975, v * 0.93),
      });
    }
  return instanced(unitBox(), std(0xffffff, { roughness: 0.5 }), items, false);
}

export function furniture(floor: number, mats: Mats) {
  const wood = std(0x9a7656);
  const soft = std(0x8b97a6);
  const linen = std(0xf3efe8);
  const white = std(0xffffff, { roughness: 0.35 });
  const counter = std(0x4a4846, { roughness: 0.4 });
  const sets: T.Group[] = [];
  const set = (x: number, z: number, build: (g: T.Group) => void, ry = 0) => {
    const g = new T.Group();
    g.position.set(x, floor, z);
    g.rotation.y = ry;
    build(g);
    sets.push(g);
  };
  const bed = (blanket: T.Material) => (g: T.Group) => {
    g.add(box(1.4, 0.28, 2.0, 0, 0, 0, wood), box(1.34, 0.18, 1.9, 0, 0.28, 0, linen));
    g.add(box(1.36, 0.04, 1.2, 0, 0.46, 0.34, blanket));
    for (const x of [-0.34, 0.34]) g.add(box(0.5, 0.1, 0.34, x, 0.46, -0.68, white));
    g.add(box(1.4, 0.8, 0.08, 0, 0, -1.02, wood));
  };
  const wardrobe = (g: T.Group) => {
    g.add(box(1.0, 1.9, 0.5, 0, 0, 0, wood), box(0.02, 1.8, 0.02, 0, 0.05, 0.26, mats.dark));
  };
  // dua kamar tidur
  set(-3.5, -2.3, bed(mats.red));
  set(-2.0, -0.55, wardrobe, Math.PI);
  set(-0.4, -2.3, bed(soft));
  set(0.95, -0.55, wardrobe, Math.PI);
  // ruang keluarga: sofa, meja, rak TV
  set(-0.3, 0.75, (g) => {
    g.add(box(2.0, 0.4, 0.8, 0, 0, 0, soft), box(2.0, 0.5, 0.2, 0, 0.4, -0.3, soft));
    for (const x of [-1.08, 1.08]) g.add(box(0.18, 0.62, 0.8, x, 0, 0, soft));
  });
  set(-0.3, 1.95, (g) => g.add(box(0.95, 0.36, 0.55, 0, 0, 0, wood)));
  set(-0.3, 3.15, (g) => g.add(box(1.7, 0.4, 0.4, 0, 0, 0, wood), box(1.15, 0.65, 0.05, 0, 0.55, 0.12, mats.dark)));
  // meja makan empat kursi
  set(2.85, 1.65, (g) => {
    const top = new T.Mesh(new T.CylinderGeometry(0.58, 0.58, 0.06, 26), wood);
    top.position.y = 0.74;
    top.castShadow = true;
    g.add(top, box(0.12, 0.72, 0.12, 0, 0, 0, mats.dark));
    for (const [x, z] of [
      [0.82, 0],
      [-0.82, 0],
      [0, 0.82],
      [0, -0.82],
    ]) {
      g.add(box(0.42, 0.06, 0.42, x, 0.43, z, wood), box(0.34, 0.43, 0.34, x, 0, z, mats.dark));
      g.add(box(x ? 0.05 : 0.42, 0.46, x ? 0.42 : 0.05, x * 1.22, 0.45, z * 1.22, wood));
    }
  });
  // dapur: meja L, bak cuci, kompor, kulkas
  set(2.22, -3.12, (g) => {
    g.add(box(1.3, 0.84, 0.55, 0, 0, 0, linen), box(1.34, 0.05, 0.59, 0, 0.84, 0, counter));
    g.add(
      box(0.44, 0.03, 0.34, -0.28, 0.885, 0, mats.steel),
      pipe(new T.Vector3(-0.28, 0.89, -0.22), new T.Vector3(-0.28, 1.12, -0.12), 0.016, mats.steel),
    );
    g.add(box(0.48, 0.03, 0.34, 0.34, 0.885, 0, mats.dark));
  });
  set(1.88, -2.15, (g) => g.add(box(0.55, 0.84, 1.3, 0, 0, 0, linen), box(0.59, 0.05, 1.32, 0, 0.84, 0, counter)));
  set(
    4.05,
    -0.45,
    (g) => g.add(box(0.65, 1.75, 0.6, 0, 0, 0, mats.steel), box(0.03, 0.5, 0.04, -0.2, 1.0, 0.31, mats.dark)),
    Math.PI,
  );
  // kamar mandi: kloset, wastafel, bak air
  set(3.45, -3.05, (g) => {
    const bowl = new T.Mesh(new T.CylinderGeometry(0.2, 0.15, 0.34, 18), white);
    bowl.position.y = 0.17;
    bowl.scale.z = 1.25;
    g.add(bowl, box(0.46, 0.46, 0.18, 0, 0.3, -0.3, white));
  });
  set(
    4.2,
    -2.05,
    (g) => g.add(box(0.4, 0.14, 0.34, 0, 0.74, 0, white), box(0.09, 0.74, 0.09, 0, 0, 0, white)),
    Math.PI,
  );
  set(4.1, -3.05, (g) =>
    g.add(
      box(0.55, 0.62, 0.55, 0, 0, 0, std(0xdfe7ea)),
      box(0.46, 0.02, 0.46, 0, 0.62, 0, std(0x6fb4d9, { roughness: 0.15 })),
    ),
  );
  return sets;
}

/* ------------------------------------------------------------------ alat berat (gedung komersial) */

/** Rangka batang kisi lurus antara dua titik (untuk tiang dan lengan crane). */
function lattice(a: T.Vector3, b: T.Vector3, w: number, seg: number, mat: T.Material, items: T.Object3D[]) {
  const dir = new T.Vector3().subVectors(b, a).normalize();
  const side = Math.abs(dir.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const u = new T.Vector3()
    .crossVectors(dir, side)
    .normalize()
    .multiplyScalar(w / 2);
  const v = new T.Vector3()
    .crossVectors(dir, u)
    .normalize()
    .multiplyScalar(w / 2);
  const corners = [
    new T.Vector3().add(u).add(v),
    new T.Vector3().add(u).sub(v),
    new T.Vector3().sub(u).sub(v),
    new T.Vector3().sub(u).add(v),
  ];
  const len = a.distanceTo(b);
  const n = Math.max(1, Math.round(len / seg));
  for (const c of corners) items.push(pipe(a.clone().add(c), b.clone().add(c), 0.05, mat));
  for (let i = 0; i < n; i++) {
    const p = a.clone().lerp(b, i / n);
    const q = a.clone().lerp(b, (i + 1) / n);
    corners.forEach((c, k) => {
      const d = corners[(k + 1) % 4];
      items.push(pipe(p.clone().add(c), q.clone().add(d), 0.022, mat));
    });
  }
}

/** Tower crane. Lengan (g.userData.jib) bisa diputar; beban menggantung di kabel. */
export function towerCrane(mats: Mats, height: number, reach: number) {
  const g = new T.Group();
  const yellow = std(0xf2b01e, { roughness: 0.55, metalness: 0.2 });
  const mast: T.Object3D[] = [];
  lattice(V(0, 0, 0), V(0, height, 0), 0.6, 1.1, yellow, mast);
  g.add(...mast, box(1.8, 0.35, 1.8, 0, 0, 0, mats.concrete));
  const jib = new T.Group();
  jib.userData.dynamic = true;
  jib.position.y = height;
  const arm: T.Object3D[] = [];
  lattice(V(0.2, 0.25, 0), V(reach, 0.25, 0), 0.42, 0.9, yellow, arm);
  lattice(V(-0.2, 0.25, 0), V(-3.2, 0.25, 0), 0.42, 0.9, yellow, arm);
  jib.add(...arm);
  jib.add(box(0.9, 0.65, 0.8, -3.0, -0.35, 0, mats.concrete), box(0.75, 0.7, 0.7, 0.55, -0.55, 0.45, mats.paper));
  jib.add(pipe(V(0, 0.45, 0), V(0, 1.55, 0), 0.06, yellow));
  for (const x of [reach * 0.7, -3.0]) jib.add(pipe(V(0, 1.55, 0), V(x, 0.45, 0), 0.016, mats.dark));
  const hookX = reach * 0.72;
  jib.add(
    pipe(V(hookX, 0.05, 0), V(hookX, -3.0, 0), 0.012, mats.dark),
    box(0.18, 0.2, 0.18, hookX, -3.2, 0, mats.dark),
  );
  for (const dz of [-0.16, 0, 0.16]) jib.add(box(1.7, 0.07, 0.07, hookX, -3.62, dz, mats.steel));
  for (const x of [-0.7, 0.7]) jib.add(pipe(V(hookX, -3.2, 0), V(hookX + x, -3.56, 0), 0.01, mats.dark));
  g.add(jib);
  g.userData.jib = jib;
  return g;
}

/** Truk molen (ready mix), panjang searah sumbu x. */
export function mixerTruck(mats: Mats) {
  const g = new T.Group();
  const cab = std(0xc62828, { roughness: 0.5, metalness: 0.2 });
  g.add(box(5.4, 0.22, 1.7, 0, 0.62, 0, mats.dark), box(1.35, 1.35, 1.85, 2.0, 0.84, 0, cab));
  g.add(box(0.05, 0.55, 1.65, 2.7, 1.52, 0, std(0x2d3a45, { roughness: 0.2, metalness: 0.4 })));
  for (const x of [2.0, -0.9, -2.0])
    for (const z of [-0.92, 0.92]) {
      const w = new T.Mesh(new T.CylinderGeometry(0.48, 0.48, 0.34, 18), mats.dark);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.48, z);
      w.castShadow = true;
      g.add(w);
    }
  const tilt = new T.Group();
  tilt.position.set(-0.85, 1.85, 0);
  tilt.rotation.z = Math.PI / 2 - 0.22;
  const drum = new T.Group();
  drum.userData.dynamic = true;
  const parts: [number, number, number][] = [
    [0.5, 0.85, -0.95],
    [0.9, 0.9, 0],
    [0.9, 0.5, 0.95],
  ];
  parts.forEach(([top, bottom, y]) => {
    const m = new T.Mesh(new T.CylinderGeometry(top, bottom, 0.95, 20), std(0xeceae5, { roughness: 0.6 }));
    m.position.y = -y;
    m.castShadow = true;
    drum.add(m);
  });
  for (const y of [-0.4, 0.4]) {
    const band = new T.Mesh(new T.TorusGeometry(0.91, 0.04, 6, 26), cab);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    drum.add(band);
  }
  drum.add(box(0.07, 1.6, 1.9, 0, -0.8, 0, cab, { edges: false }));
  tilt.add(drum);
  g.add(tilt, bar(V(-2.2, 1.5, 0), V(-3.2, 0.75, 0), 0.45, 0.07, mats.steel, false));
  g.userData.drum = drum;
  return g;
}
