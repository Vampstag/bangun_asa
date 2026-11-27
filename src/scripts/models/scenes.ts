/**
 * Lima skena 3D: proses 7 langkah (mengikuti scroll), dan empat layanan (berputar sendiri): pembangunan baru,
 * renovasi sebagian, renovasi total, bangunan komersial. Setiap skena memberi `update` yang mengembalikan nomor keterangan.
 */
import * as T from 'three';
import { COLORS, easeIO, seg, wallGroup, box, type Hole, type Kit } from './kit';
import { House, LAYOUT_A, LAYOUT_B, YR, Y0, type Layout } from './house';
import { Shop } from './shop';
import { scaffoldFace, stoneTexture, trapezoid } from './detail';

export interface Ctx {
  /** garis waktu proses (0..7), dipakai skena "process" */
  u: number;
  /** waktu berjalan dalam detik */
  time: number;
}

export interface Scene3D {
  kit: Kit;
  group: T.Group;
  /** putaran awal (radian) */
  yaw: number;
  /** keadaan diam (tampil utuh) untuk pengguna yang memilih kurangi animasi */
  still: Ctx;
  update(ctx: Ctx): number;
}

/** Gerak berulang: membangun, menahan, membongkar kembali, jeda. Mengembalikan 0..1. */
function cycle(time: number, build: number, hold: number, back: number, rest: number) {
  const t = time % (build + hold + back + rest);
  if (t < build) return easeIO(t / build);
  if (t < build + hold) return 1;
  if (t < build + hold + back) return 1 - easeIO((t - build - hold) / back);
  return 0;
}

function house(): House {
  const h = new House();
  return h;
}

/**
 * Posisi scroll (0..7, satu angka per langkah) ke garis waktu model. Langkah 4 (Kontrak) hanya berisi penandatanganan;
 * semua pekerjaan pondasi sampai atap berada di langkah 5 (Pelaksanaan).
 */
const WARP: [number, number][] = [
  [0, 0],
  [3, 3],
  [4, 3.1],
  [5, 5.2],
  [6, 6],
  [7, 7],
];
function warp(u: number) {
  for (let i = 1; i < WARP.length; i++) {
    const [x0, y0] = WARP[i - 1];
    const [x1, y1] = WARP[i];
    if (u <= x1) return y0 + ((u - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 7;
}

export function processScene(): Scene3D {
  const kit = house();
  kit.buildProcess();
  return {
    kit,
    group: kit.group,
    yaw: -0.75,
    still: { u: 7, time: 0 },
    update: ({ u }) => {
      kit.update(warp(u));
      return Math.min(6, Math.floor(u));
    },
  };
}

export function newBuildScene(): Scene3D {
  const kit = house();
  kit.site(0, 0.3);
  kit.foundation(0.3, 1.4, [2.14, 2.18]);
  kit.materials(0.4, 0.8, [3.1, 3.4]);
  kit.walls(1.42, 1.94, LAYOUT_A);
  kit.layer = 'temp';
  kit.add(scaffoldFace([-4.4, -3.55], [4.4, -3.55], [0, -1], kit.m), 'rise', 1.6, 1.82, { out: [3.2, 3.45] });
  kit.porch(2.0, 2.4);
  kit.castColumns(1.92, 2.12);
  kit.ringBeam(2.1, 2.22);
  kit.gableWalls(2.2, 2.34);
  kit.roof(2.32, 2.95);
  kit.services(2.85, 3.05);
  kit.openings(3.15, 3.5, LAYOUT_A);
  kit.plasterSkin(3.0, 3.4, LAYOUT_A, [3.4, 3.8]);
  kit.worker(0.5, 1.35, [-3.0, 0, -1.75], 0.6, { pose: 'crouch' });
  kit.worker(0.7, 1.35, [3.0, 0, 1.75], -2.2, { pose: 'crouch', vest: 0xc6d63a });
  kit.worker(1.75, 3.1, [-0.8, 1.56, -4.25], 0, { pose: 'reach' });
  kit.worker(1.8, 2.4, [2.7, Y0, 4.05], Math.PI, { pose: 'crouch', vest: 0xc6d63a });
  kit.worker(1.2, 3.3, [5.0, 0, 4.9], -2.0, { helmet: 0xf4f2ec });
  const MAX = 3.9;
  return {
    kit,
    group: kit.group,
    yaw: -0.7,
    still: { u: 0, time: 12 },
    update: ({ time }) => {
      const u = MAX * cycle(time, 11, 3, 2.5, 0.6);
      kit.update(u);
      return u < 1.4 ? 0 : u < 2.3 ? 1 : u < 2.9 ? 2 : 3;
    },
  };
}

const LAYOUT_RENO: Layout = { ...LAYOUT_A, left: [] };

export function renovationScene(): Scene3D {
  const kit = house();
  const m = kit.m;
  const oldWall = m.plaster.clone();
  oldWall.color.setHex(COLORS.oldWall);
  const oldRoof = m.roof.clone();
  oldRoof.color.setHex(COLORS.oldRoof);
  oldRoof.map = null;

  // rumah lama (sudah berdiri)
  kit.foundation(-10, -9);
  kit.structure(-10, -9);
  kit.walls(-10, -9, LAYOUT_RENO, oldWall, { kind: 'rise' });
  kit.porch(-10, -9);
  kit.roof(-10, -9, { mat: oldRoof, static: true });
  kit.openings(-10, -9, LAYOUT_RENO);

  // perancah di sisi kanan
  kit.scaffold(0.2, 0.9, [4.3, 4.9]);

  // tambahan ruang di sisi kiri
  const extMat = m.brick;
  const ext: { g: T.Group; a: number; b: number }[] = [];
  const wall = (len: number, x: number, z: number, rotY: number, holes: Hole[], a: number, b: number) => {
    const g = wallGroup({ len, h: 2.8, t: 0.15, x, z, rotY, holes }, extMat);
    g.position.y = Y0;
    ext.push({ g, a, b });
  };
  wall(4, -8, -1.5, -Math.PI / 2, [{ c: 0, w: 1.4, y0: 0.9, y1: 2.1 }], 1.3, 1.9);
  wall(3.5, -6.25, 0.5, 0, [{ c: -0.5, w: 1.2, y0: 0.9, y1: 2.1 }], 1.5, 2.1);
  wall(3.5, -6.25, -3.5, Math.PI, [{ c: 0, w: 1.0, y0: 1.2, y1: 2.1 }], 1.7, 2.3);
  for (const { g, a, b } of ext) kit.add(g, 'rise', a, b);
  const stone = new T.MeshStandardMaterial({ map: stoneTexture(), roughness: 1, clippingPlanes: [kit.ground] });
  const edge = new T.LineBasicMaterial({
    color: 0x1b1917,
    transparent: true,
    opacity: 0.35,
    clippingPlanes: [kit.ground],
  });
  const lines: [number, number, number, 'x' | 'z'][] = [
    [-8, 0.5, 3.5, 'x'],
    [-8, -3.5, 3.5, 'x'],
    [-8, -3.5, 4, 'z'],
  ];
  for (const [x, z, len, axis] of lines) {
    const f = trapezoid(len, 0.62, 0.3, 0.7, stone, edge, axis);
    f.position.set(x, -0.55, z);
    kit.add(f, axis === 'x' ? 'growX' : 'growZ', 0.5, 0.85, { layer: 'foundation' });
    const sloof =
      axis === 'x'
        ? box(len, 0.2, 0.15, x, 0.15, z, m.concrete, { pivot: 'left' })
        : box(0.15, 0.2, len, x, 0.15, z, m.concrete, { pivot: 'back' });
    kit.add(sloof, axis === 'x' ? 'growX' : 'growZ', 0.82, 1.05, { layer: 'foundation' });
  }
  for (const [x, z] of [
    [-8, 0.5],
    [-8, -3.5],
  ])
    kit.add(box(0.15, 2.8, 0.15, x, Y0, z, m.struct), 'rise', 1.9, 2.15, { layer: 'structure' });
  kit.add(box(3.7, 0.1, 4.1, -6.15, Y0 - 0.1, -1.5, m.concrete), 'rise', 0.9, 1.3);
  kit.add(box(3.9, 0.15, 4.3, -6.2, YR - 0.2, -1.5, m.struct), 'drop', 2.0, 2.6, { h: 1.2 });
  kit.materials(0.5, 0.9, [3.8, 4.1]);
  kit.worker(0.9, 3.9, [5.8, 4.04, -0.5], -Math.PI / 2, { pose: 'reach' });
  kit.worker(1.2, 2.8, [-7.2, 0, 1.4], 2.6, { pose: 'hold', vest: 0xc6d63a });
  kit.worker(2.6, 4.1, [3.6, 0, 4.4], Math.PI, { pose: 'reach' });
  kit.worker(0.5, 4.2, [-0.3, 0, 6.6], Math.PI, { helmet: 0xf4f2ec });
  kit.painted.push(m.struct);
  kit.plaster = [3.3, 4.0];

  const MAX = 4.4;
  return {
    kit,
    group: kit.group,
    yaw: -0.7,
    still: { u: 0, time: 13 },
    update: ({ time }) => {
      const u = MAX * cycle(time, 12, 3, 2.5, 0.6);
      kit.update(u);
      // atap ganti warna, dinding lama dicat ulang
      const roofK = easeIO(seg(u, 2.5, 3.3));
      oldRoof.color.setHex(COLORS.oldRoof).lerp(new T.Color(COLORS.roof), roofK);
      const wallK = easeIO(seg(u, 3.3, 4.0));
      oldWall.color.setHex(COLORS.oldWall).lerp(new T.Color(COLORS.plaster), wallK);
      return u < 0.4 ? 0 : u < 1.0 ? 1 : u < 3.3 ? 2 : 3;
    },
  };
}

export function totalScene(): Scene3D {
  const kit = house();
  const m = kit.m;
  const oldWall = m.plaster.clone();
  oldWall.color.setHex(COLORS.oldWall);
  const oldRoof = m.roof.clone();
  oldRoof.color.setHex(COLORS.oldRoof);
  oldRoof.map = null;

  // bangunan lama: dinding, atap, dan kusen dibongkar; pondasi, kolom, dan ring balok dipertahankan
  kit.foundation(-10, -9);
  kit.structure(-10, -9);
  kit.walls(-10, -9, LAYOUT_A, oldWall, { kind: 'rise', out: [0.9, 1.6] });
  kit.roof(-10, -9, { mat: oldRoof, static: true, out: [0.35, 1.1], drop: 2.2 });
  kit.openings(-10, -9, LAYOUT_A, { static: true, out: [0.8, 1.3] });
  kit.porch(-10, -9);

  // denah dan dinding baru, atap baru
  kit.materials(1.3, 1.7, [4.3, 4.6]);
  kit.walls(2.3, 3.2, LAYOUT_B);
  kit.gableWalls(3.1, 3.34, false);
  kit.layer = 'temp';
  kit.add(scaffoldFace([-4.4, -3.55], [4.4, -3.55], [0, -1], kit.m), 'rise', 2.2, 2.45, { out: [4.4, 4.6] });
  kit.roof(3.3, 4.1, {});
  kit.openings(4.3, 4.75, LAYOUT_B);
  kit.plasterSkin(4.1, 4.5, LAYOUT_B, [4.5, 4.9]);
  kit.worker(0.5, 2.0, [-2.6, 0, 5.9], Math.PI, { pose: 'hold', helmet: 0xf4f2ec });
  kit.worker(1.4, 2.3, [2.0, Y0, 1.4], 2.2, { pose: 'crouch', vest: 0xc6d63a });
  kit.worker(2.4, 4.2, [-0.8, 1.56, -4.25], 0, { pose: 'reach' });
  kit.worker(2.5, 3.3, [2.7, Y0, 4.05], Math.PI, { pose: 'crouch' });

  const MAX = 5.0;
  return {
    kit,
    group: kit.group,
    yaw: -0.65,
    still: { u: 0, time: 14 },
    update: ({ time }) => {
      const u = MAX * cycle(time, 13, 3, 2.5, 0.6);
      kit.update(u);
      return u < 0.4 ? 0 : u < 2.3 ? 1 : u < 3.3 ? 2 : 3;
    },
  };
}

export function commercialScene(): Scene3D {
  const kit = new Shop();
  kit.buildShop();
  const MAX = 6.0;
  return {
    kit,
    group: kit.group,
    yaw: -0.4,
    still: { u: 0, time: 14 },
    update: ({ time }) => {
      const u = MAX * cycle(time, 13, 3, 2.5, 0.6);
      kit.update(u);
      return u < 2.5 ? 0 : u < 3.9 ? 1 : u < 5.0 ? 2 : 3;
    },
  };
}

export const SCENES: Record<string, () => Scene3D> = {
  process: processScene,
  new: newBuildScene,
  renovation: renovationScene,
  total: totalScene,
  commercial: commercialScene,
};
