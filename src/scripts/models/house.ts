/**
 * Rumah tinggal satu lantai (9 m x 7 m, atap pelana 30 derajat, teras) dengan elemen konstruksi yang benar:
 * pondasi footplat dan batu kali, sloof, kolom, ring balok, dinding bata berlubang, rangka atap baja ringan, reng, genteng,
 * kusen dan kaca, instalasi air dan listrik, keramik dan perabot.
 * Setiap metode menerima jendela waktu [a, b] pada garis waktu `u`.
 */
import * as T from 'three';
import { Kit, bar, box, ease, openingGroup, pipe, seg, wallGroup, lerp, type Hole, type WallSpec } from './kit';
import { acUnit, dimLabel } from './props';
import * as D from './detail';

export const Y0 = 0.45; // permukaan lantai
export const WH = 3.0; // tinggi dinding di bawah ring balok
export const YR = Y0 + WH; // dasar ring balok
export const RING = 0.2;
export const YT = YR + RING; // dasar kuda-kuda
export const HW = 9;
export const HD = 7;
const PITCH = Math.PI / 6;
const TAN = Math.tan(PITCH);
export const RIDGE = (HD / 2) * TAN;
const XS = [-4.5, -1.5, 1.5, 4.5];
const ZS = [-3.5, 0, 3.5];
/**
 * Letak kolom: di setiap pertemuan dan ujung dinding. Jarak antar kolom paling jauh 3 m dan luas bidang dinding paling
 * besar 9 m² (dinding samping diberi kolom tambahan). Tidak ada kolom yang memotong pintu atau jendela di kedua denah.
 */
export const COLUMNS: [number, number][] = [
  ...XS.flatMap((x) => ZS.map((z): [number, number] => [x, z])),
  [-4.5, -0.95],
  [-4.5, 0.95],
  [4.5, -0.95],
  [4.5, 0.95],
];
const PORCH: [number, number][] = [
  [-4.4, 5.4],
  [-0.6, 5.4],
];
/** Garis pondasi menerus (juga letak sloof). */
const FOUNDATION: D.Line[] = [
  { x: -4.5, z: 3.5, len: 9, axis: 'x' },
  { x: -4.5, z: -3.5, len: 9, axis: 'x' },
  { x: -4.5, z: 0, len: 9, axis: 'x' },
  { x: -4.5, z: -3.5, len: 7, axis: 'z' },
  { x: 4.5, z: -3.5, len: 7, axis: 'z' },
  { x: -1.5, z: -3.5, len: 3.5, axis: 'z' },
  { x: 1.5, z: -3.5, len: 3.5, axis: 'z' },
  { x: -4.4, z: 3.5, len: 1.9, axis: 'z' },
  { x: -0.6, z: 3.5, len: 1.9, axis: 'z' },
  { x: -4.4, z: 5.4, len: 3.8, axis: 'x' },
];
/* ketinggian pondasi (m, 0 = muka tanah) */
export const FOOT = { sand: -0.75, stones: -0.7, masonry: -0.55, top: 0.15, sloofTop: 0.35 };
const T_WALL = 0.15;
const T_IN = 0.1;

export interface Layout {
  front: Hole[];
  back: Hole[];
  left: Hole[];
  right: Hole[];
  /** sekat dalam, koordinat dunia */
  inner: { axis: 'x' | 'z'; at: number; from: number; to: number; doors: { c: number; w: number }[] }[];
}

const win = (c: number, w: number, y0 = 0.9, y1 = 2.1): Hole => ({ c, w, y0, y1 });

export const LAYOUT_A: Layout = {
  front: [win(-2.5, 1.0, 0, 2.1), win(3.0, 1.4)],
  back: [win(-3.0, 1.2, 1.0), win(0, 1.2, 1.0), win(2.25, 0.9, 1.1), win(3.75, 0.6, 1.7, 2.1)],
  left: [win(-1.8, 1.2, 1.0)],
  right: [win(-2.5, 0.6, 1.6, 2.1), win(1.8, 1.2, 1.0)],
  inner: [
    {
      axis: 'z',
      at: 0,
      from: -4.425,
      to: 4.425,
      doors: [
        { c: -3.6, w: 0.85 },
        { c: 0.9, w: 0.85 },
        { c: 2.4, w: 0.85 },
      ],
    },
    { axis: 'x', at: -1.5, from: -3.425, to: -0.05, doors: [] },
    { axis: 'x', at: 1.5, from: -3.425, to: -0.05, doors: [] },
    { axis: 'x', at: 3.0, from: -3.425, to: -1.75, doors: [] },
    { axis: 'z', at: -1.75, from: 3.0, to: 4.425, doors: [{ c: 3.6, w: 0.7 }] },
  ],
};

/** Denah baru untuk renovasi total: jendela dan sekat berbeda. */
export const LAYOUT_B: Layout = {
  front: [win(-2.5, 1.0, 0, 2.1), win(0.15, 1.2), win(3.2, 1.4)],
  back: [win(-3.0, 0.9, 1.4), win(0, 1.4), win(3.0, 1.4)],
  left: [win(1.8, 1.2, 1.0)],
  right: [win(1.8, 1.2, 0.9)],
  inner: [
    { axis: 'z', at: -1.2, from: -4.425, to: 4.425, doors: [{ c: 0, w: 0.9 }] },
    { axis: 'x', at: -1.5, from: -3.425, to: -1.25, doors: [{ c: -2.4, w: 0.9 }] },
    { axis: 'x', at: 2.0, from: -1.15, to: 3.425, doors: [{ c: 1.2, w: 0.9 }] },
  ],
};

export function perimeterSpecs(l: Layout): { spec: WallSpec; door: boolean[] }[] {
  const mk = (len: number, x: number, z: number, rotY: number, holes: Hole[], flip: number) => {
    const hs = holes.map((h) => ({ ...h, c: h.c * flip }));
    return { spec: { len, h: WH, t: T_WALL, x, z, rotY, holes: hs }, door: holes.map((h) => h.y0 === 0) };
  };
  return [
    mk(HW, 0, 3.5, 0, l.front, 1),
    mk(HD - T_WALL, 4.5, 0, Math.PI / 2, l.right, -1),
    mk(HW, 0, -3.5, Math.PI, l.back, -1),
    mk(HD - T_WALL, -4.5, 0, -Math.PI / 2, l.left, 1),
  ];
}

export function innerSpecs(l: Layout): WallSpec[] {
  return l.inner.map((w) => {
    const len = w.to - w.from;
    const mid = (w.to + w.from) / 2;
    const holes: Hole[] = w.doors.map((d) => ({ c: d.c - mid, w: d.w, y0: 0, y1: 2.1 }));
    if (w.axis === 'z') return { len, h: WH, t: T_IN, x: mid, z: w.at, rotY: 0, holes };
    return { len, h: WH, t: T_IN, x: w.at, z: mid, rotY: -Math.PI / 2, holes };
  });
}

export interface HouseOpts {
  landscape?: boolean;
}

export class House extends Kit {
  /** Batas tapak: garis merah yang digambar di tanah. */
  site(a: number, b: number) {
    this.layer = 'site';
    const at = (f: number) => lerp(a, b, f);
    const t = 0.12;
    const edges: [number, number, number, number, 'x' | 'z'][] = [
      [-6.6, 7.2, 13.2, 0, 'x'],
      [6.6, -5.4, 12.6, 0.25, 'z'],
      [-6.6, -5.4, 13.2, 0.5, 'x'],
      [-6.6, -5.4, 12.6, 0.75, 'z'],
    ];
    for (const [x, z, len, f, ax] of edges) {
      if (ax === 'x') {
        const m = box(len, 0.02, t, x, 0.0, z, this.m.red, { pivot: 'left', edges: false, cast: false });
        m.userData.noFit = true;
        this.add(m, 'growX', at(f), at(f + 0.3));
      } else {
        const m = box(t, 0.02, len, x, 0.0, z, this.m.red, { pivot: 'back', edges: false, cast: false });
        m.userData.noFit = true;
        this.add(m, 'growZ', at(f), at(f + 0.3));
      }
    }
  }

  survey(a: number, b: number, out: [number, number]) {
    this.layer = 'temp';
    const at = (f: number) => lerp(a, b, f);
    const sx = 5.8;
    const sz = 4.8;
    const corners: [number, number][] = [
      [-sx, sz],
      [sx, sz],
      [sx, -sz],
      [-sx, -sz],
    ];
    corners.forEach(([x, z], i) => {
      const g = new T.Group();
      g.position.set(x, 0, z);
      g.add(box(0.07, 1.1, 0.07, 0, 0, 0, this.m.wood, { edges: false }));
      g.add(box(0.075, 0.12, 0.075, 0, 1.0, 0, this.m.red, { edges: false }));
      this.add(g, 'rise', at(i * 0.06), at(0.3 + i * 0.06), { out });
    });
    // bouwplank (papan acuan) di antara patok
    const boards: [number, number, number, number, 'x' | 'z'][] = [
      [-sx, sz, 2 * sx, 0.3, 'x'],
      [sx, -sz, 2 * sz, 0.36, 'z'],
      [-sx, -sz, 2 * sx, 0.42, 'x'],
      [-sx, -sz, 2 * sz, 0.48, 'z'],
    ];
    for (const [x, z, len, f, ax] of boards) {
      const m =
        ax === 'x'
          ? box(len, 0.18, 0.025, x, 0.9, z, this.m.wood, { pivot: 'left', edges: false })
          : box(0.025, 0.18, len, x, 0.9, z, this.m.wood, { pivot: 'back', edges: false });
      this.add(m, ax === 'x' ? 'growX' : 'growZ', at(f), at(f + 0.2), { out });
    }
    // benang as bangunan
    const strings: [number, number, number, number, 'x' | 'z'][] = [
      [-sx, 3.5, 2 * sx, 0.55, 'x'],
      [-sx, -3.5, 2 * sx, 0.62, 'x'],
      [4.5, -sz, 2 * sz, 0.69, 'z'],
      [-4.5, -sz, 2 * sz, 0.76, 'z'],
    ];
    for (const [x, z, len, f, ax] of strings) {
      const m =
        ax === 'x'
          ? box(len, 0.014, 0.014, x, 0.99, z, this.m.red, { pivot: 'left', edges: false, cast: false })
          : box(0.014, 0.014, len, x, 0.99, z, this.m.red, { pivot: 'back', edges: false, cast: false });
      this.add(m, ax === 'x' ? 'growX' : 'growZ', at(f), at(f + 0.22), { out });
    }
    // alat ukur (theodolite) di atas tripod
    const g = new T.Group();
    g.position.set(-5.9, 0, 6.1);
    const head = new T.Vector3(0, 1.45, 0);
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2 + 0.4;
      g.add(pipe(head, new T.Vector3(Math.cos(ang) * 0.62, 0, Math.sin(ang) * 0.62), 0.022, this.m.wood));
    }
    g.add(box(0.2, 0.06, 0.2, 0, 1.45, 0, this.m.steel, { edges: false }));
    g.add(box(0.14, 0.2, 0.12, 0, 1.51, 0, this.m.dark, { edges: false }));
    g.add(box(0.05, 0.05, 0.2, 0, 1.64, 0.02, this.m.red, { edges: false }));
    this.add(g, 'pop', at(0), at(0.3), { out });
  }

  plan(a: number, b: number, out: [number, number]) {
    this.layer = 'temp';
    const at = (f: number) => lerp(a, b, f);
    const rib = (x: number, z: number, len: number, ax: 'x' | 'z', f: number, w = 0.07) => {
      const m =
        ax === 'x'
          ? box(len, 0.02, w, x, 0.03, z, this.m.red, { pivot: 'left', edges: false, cast: false })
          : box(w, 0.02, len, x, 0.03, z, this.m.red, { pivot: 'back', edges: false, cast: false });
      this.add(m, ax === 'x' ? 'growX' : 'growZ', at(f), at(f + 0.25), { out });
    };
    rib(-4.5, 3.5, 9, 'x', 0);
    rib(4.5, -3.5, 7, 'z', 0.15);
    rib(-4.5, -3.5, 9, 'x', 0.3);
    rib(-4.5, -3.5, 7, 'z', 0.45);
    rib(-4.5, 0, 9, 'x', 0.6, 0.05);
    rib(-1.5, -3.5, 3.5, 'z', 0.66, 0.05);
    rib(1.5, -3.5, 3.5, 'z', 0.7, 0.05);
    rib(3.0, -3.5, 1.75, 'z', 0.74, 0.05);
    rib(3.0, -1.75, 1.5, 'x', 0.76, 0.05);
    // garis ukuran: lebar 9,00 m dan panjang 7,00 m
    const tick = (x: number, z: number, ax: 'x' | 'z') =>
      this.add(
        ax === 'x'
          ? box(0.06, 0.02, 0.5, x, 0.03, z, this.m.red, { edges: false, cast: false })
          : box(0.5, 0.02, 0.06, x, 0.03, z, this.m.red, { edges: false, cast: false }),
        'pop',
        at(0.85),
        at(1),
        { out },
      );
    rib(-4.5, -4.5, 9, 'x', 0.8, 0.04);
    tick(-4.5, -4.5, 'x');
    tick(4.5, -4.5, 'x');
    rib(5.5, -3.5, 7, 'z', 0.85, 0.04);
    tick(5.5, -3.5, 'z');
    tick(5.5, 3.5, 'z');
    const lw = new T.Group();
    lw.position.set(0, 0.35, -4.5);
    lw.add(dimLabel('9,00 m'));
    this.add(lw, 'pop', at(0.9), at(1), { out });
    const ld = new T.Group();
    ld.position.set(5.5, 0.35, 0);
    ld.add(dimLabel('7,00 m'));
    this.add(ld, 'pop', at(0.92), at(1), { out });
    // teras
    rib(-4.5, 5.5, 4, 'x', 0.75, 0.05);
    rib(-4.5, 3.5, 2, 'z', 0.8, 0.05);
    rib(-0.5, 3.5, 2, 'z', 0.8, 0.05);
  }

  /**
   * Pondasi menerus di dalam galian: pasir urug, batu kosong, batu kali trapesium (lebar bawah 62 cm, atas 30 cm,
   * puncaknya 15 cm di atas tanah). Tulangan kolom berdiri di atas lantai kerja sejak awal, lalu sloof dan pelat lantai.
   * Di akhir galian diurug kembali (bidang tanah naik). `cageOut` = saat tulangan sudah terbungkus beton kolom.
   */
  foundation(a: number, b: number, cageOut: [number, number] = [b + 0.001, b + 0.002]) {
    this.layer = 'foundation';
    const at = (f: number) => lerp(a, b, f);
    const rand = D.seeded(11);
    const clip = { clippingPlanes: [this.ground] };
    const rust = D.rebarMat();
    rust.clippingPlanes = [this.ground];
    const stirrup = new T.LineBasicMaterial({ color: 0x7a4b3a, ...clip });
    const sand = new T.MeshStandardMaterial({ color: 0xcdb27c, roughness: 1, ...clip });
    const stone = new T.MeshStandardMaterial({ map: D.stoneTexture(), roughness: 1, ...clip });
    const rubble = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, ...clip });
    const lean = new T.MeshStandardMaterial({ color: 0xaaa59a, roughness: 1, ...clip });
    const edge = new T.LineBasicMaterial({ color: 0x1b1917, transparent: true, opacity: 0.35, ...clip });
    this.fill = [at(0.9), at(1)];
    const grow = (
      o: T.Object3D,
      axis: 'x' | 'z',
      f0: number,
      f1: number,
      layer: 'foundation' | 'footing' = 'foundation',
    ) => this.add(o, axis === 'x' ? 'growX' : 'growZ', at(f0), at(f1), { layer });

    // tanda tepi galian dan tumpukan tanah hasil galian
    const dirt = new T.MeshStandardMaterial({ color: 0x8c6a48, roughness: 1, flatShading: true });
    FOUNDATION.forEach((l, i) => {
      for (const side of [-0.42, 0.42]) {
        const m =
          l.axis === 'x'
            ? box(l.len, 0.02, 0.035, l.x, 0.004, l.z + side, dirt, { pivot: 'left', edges: false, cast: false })
            : box(0.035, 0.02, l.len, l.x + side, 0.004, l.z, dirt, { pivot: 'back', edges: false, cast: false });
        this.add(m, l.axis === 'x' ? 'growX' : 'growZ', at(i * 0.008), at(0.08 + i * 0.008), {
          out: [at(0.88), at(0.94)],
          layer: 'temp',
        });
      }
    });
    for (const [x, z] of [
      [-5.9, -3.0],
      [6.0, 3.4],
      [1.6, 6.4],
    ]) {
      const pile = new T.Mesh(new T.ConeGeometry(0.6, 0.42, 14, 2), dirt);
      pile.geometry.translate(0, 0.21, 0);
      pile.position.set(x, 0, z);
      pile.castShadow = true;
      this.add(pile, 'pop', at(0.05), at(0.14), { out: [at(0.9), at(0.98)], layer: 'temp' });
    }

    // pasir urug, lalu batu kosong
    FOUNDATION.forEach((l, i) => {
      const g = new T.Group();
      g.position.set(l.x, FOOT.sand, l.z);
      g.add(
        l.axis === 'x'
          ? box(l.len, FOOT.stones - FOOT.sand, 0.76, 0, 0, 0, sand, { pivot: 'left', edges: false, cast: false })
          : box(0.76, FOOT.stones - FOOT.sand, l.len, 0, 0, 0, sand, { pivot: 'back', edges: false, cast: false }),
      );
      grow(g, l.axis, 0.08 + i * 0.008, 0.15 + i * 0.008, 'footing');
    });
    this.add(D.emptyStones(FOUNDATION, (FOOT.stones + FOOT.masonry) / 2, rubble, rand), 'lay', at(0.14), at(0.28), {
      layer: 'footing',
    });

    // lantai kerja dan tulangan kolom berdiri di dalam galian sebelum batu kali dipasang
    const dense: [number, number][] = [
      [FOOT.sloofTop, FOOT.sloofTop + 0.45],
      [YR - 0.45, YR + RING],
    ];
    const posts: { x: number; z: number; top: number }[] = [
      ...COLUMNS.map(([x, z]) => ({ x, z, top: YR + RING - 0.04 })),
      ...PORCH.map(([x, z]) => ({ x, z, top: Y0 + 2.9 })),
    ];
    posts.forEach(({ x, z, top }, i) => {
      this.add(box(0.34, 0.05, 0.34, x, FOOT.masonry, z, lean, { edges: false }), 'pop', at(0.24), at(0.3), {
        layer: 'foundation',
      });
      const cage = D.columnCage(FOOT.masonry + 0.05, top, dense, rust, stirrup);
      cage.position.x = x;
      cage.position.z = z;
      this.add(cage, 'rise', at(0.28 + i * 0.006), at(0.4 + i * 0.006), { out: cageOut, layer: 'rebar' });
    });

    // batu kali
    FOUNDATION.forEach((l, i) => {
      const g = D.trapezoid(l.len + 0.3, 0.62, 0.3, FOOT.top - FOOT.masonry, stone, edge, l.axis);
      g.position.set(l.axis === 'x' ? l.x - 0.15 : l.x, FOOT.masonry, l.axis === 'z' ? l.z - 0.15 : l.z);
      grow(g, l.axis, 0.42 + i * 0.016, 0.54 + i * 0.016, 'footing');
    });

    // rangkaian besi sloof di atas batu kali, lalu dicor 15 x 20 cm
    this.add(D.beamCage(FOUNDATION, (FOOT.top + FOOT.sloofTop) / 2, 0.15, 0.2, rust), 'lay', at(0.62), at(0.74), {
      out: [at(0.86), at(0.88)],
      layer: 'rebar',
    });
    FOUNDATION.forEach((l, i) => {
      const m =
        l.axis === 'x'
          ? box(l.len + 0.15, FOOT.sloofTop - FOOT.top, 0.15, l.x - 0.075, FOOT.top, l.z, this.m.concrete, {
              pivot: 'left',
            })
          : box(0.15, FOOT.sloofTop - FOOT.top, l.len + 0.15, l.x, FOOT.top, l.z - 0.075, this.m.concrete, {
              pivot: 'back',
            });
      grow(m, l.axis, 0.74 + i * 0.008, 0.82 + i * 0.008);
    });
    // urugan dalam bangunan, lantai kerja, dan pelat lantai
    this.add(box(9.1, Y0 - FOOT.sloofTop, 7.1, 0, FOOT.sloofTop, 0, this.m.concrete), 'rise', at(0.9), at(0.99), {
      layer: 'foundation',
    });
    this.add(box(4.1, Y0 - FOOT.sloofTop, 2.1, -2.5, FOOT.sloofTop, 4.5, this.m.concrete), 'rise', at(0.92), at(1), {
      layer: 'foundation',
    });
  }

  /** Bekisting dipasang menjepit dinding bergerigi, lalu kolom dicor. */
  castColumns(a: number, b: number) {
    this.layer = 'structure';
    const at = (f: number) => lerp(a, b, f);
    const ply = new T.MeshStandardMaterial({ color: 0xc89b62, roughness: 0.9 });
    COLUMNS.forEach(([x, z], i) => {
      this.add(D.formwork(x, z, Y0, WH, ply, this.m.wood), 'rise', at(i * 0.016), at(0.2 + i * 0.016), {
        out: [at(0.82 + i * 0.008), at(0.9 + i * 0.008)],
        layer: 'temp',
      });
      this.add(box(0.15, WH, 0.15, x, Y0, z, this.m.struct), 'rise', at(0.26 + i * 0.022), at(0.5 + i * 0.022));
    });
    if (!this.painted.includes(this.m.struct)) this.painted.push(this.m.struct);
  }

  /** Ring balok 15 x 20 cm mengikat puncak semua kolom dan dinding. */
  ringBeam(a: number, b: number) {
    const at = (f: number) => lerp(a, b, f);
    const rust = D.rebarMat();
    const lines: D.Line[] = [
      { x: -4.5, z: 3.5, len: 9, axis: 'x' },
      { x: 4.5, z: -3.5, len: 7, axis: 'z' },
      { x: -4.5, z: -3.5, len: 9, axis: 'x' },
      { x: -4.5, z: -3.5, len: 7, axis: 'z' },
      { x: -4.5, z: 0, len: 9, axis: 'x' },
    ];
    this.add(D.beamCage(lines, YR + RING / 2, 0.15, RING, rust), 'lay', at(0), at(0.5), {
      out: [at(1), at(1) + 0.02],
      layer: 'rebar',
    });
    lines.forEach((l, i) => {
      const m =
        l.axis === 'x'
          ? box(l.len, RING, 0.15, l.x, YR, l.z, this.m.struct, { pivot: 'left' })
          : box(0.15, RING, l.len, l.x, YR, l.z, this.m.struct, { pivot: 'back' });
      this.add(m, l.axis === 'x' ? 'growX' : 'growZ', at(0.48 + i * 0.07), at(0.72 + i * 0.07), { layer: 'ring' });
    });
  }

  /** Bingkai beton ampig: dua balok miring mengikuti kemiringan atap dan satu tiang tengah, di kedua ujung. */
  gableFrame(a: number, b: number) {
    for (const sx of [-4.5, 4.5]) {
      const g = new T.Group();
      g.position.set(sx, YT, 0);
      for (const sz of [-1, 1]) {
        g.add(bar(new T.Vector3(0, -0.02, sz * 3.5), new T.Vector3(0, RIDGE - 0.1, 0), 0.15, 0.12, this.m.struct));
      }
      g.add(box(0.15, RIDGE - 0.12, 0.12, 0, 0, 0, this.m.struct));
      this.add(g, 'rise', a, b, { layer: 'ring' });
    }
  }

  /** Dinding segitiga (ampig) dipasang setelah ring balok, lalu dibingkai beton. */
  gableWalls(a: number, b: number, frame = true) {
    const at = (f: number) => lerp(a, b, f);
    const rand = D.seeded(31);
    const gable: D.Inst[] = [];
    for (const sx of [-1, 1]) D.gableBricks(sx * 4.5, YT, HD / 2, RIDGE, T_WALL, gable, rand);
    gable.sort((p, q) => p.p.y - q.p.y);
    this.add(D.brickMesh(gable), 'lay', a, at(0.72), { layer: 'brick' });
    const mortar = new T.MeshStandardMaterial({ color: 0xbfb6a6, roughness: 1 });
    for (const sx of [-1, 1])
      this.add(this.gablePrism(sx, T_WALL * 0.55, mortar, false), 'riseLin', a, at(0.72), { layer: 'brick' });
    if (frame) this.gableFrame(at(0.68), b);
  }

  /** Kolom, ring balok, dan bingkai ampig sekaligus (untuk bangunan yang sudah berdiri). */
  structure(a: number, b: number) {
    this.castColumns(a, lerp(a, b, 0.6));
    this.ringBeam(lerp(a, b, 0.6), lerp(a, b, 0.9));
    this.gableFrame(lerp(a, b, 0.9), b);
  }

  walls(
    a: number,
    b: number,
    layout: Layout,
    mat: T.Material = this.m.brick,
    o: { out?: [number, number]; kind?: 'rise' | 'static' } = {},
  ) {
    if (mat === this.m.brick) this.brickWalls(a, b, layout);
    else this.solidWalls(a, b, layout, mat, o);
  }

  /**
   * Pasangan bata dipasang SEBELUM kolom dicor: lapis demi lapis di antara tulangan kolom, ujungnya bergerigi, dengan
   * angkur setiap 6 lapis, serta balok latei di atas setiap bukaan.
   */
  private brickWalls(a: number, b: number, layout: Layout) {
    const at = (f: number) => lerp(a, b, f);
    const rand = D.seeded(23);
    const specs = [...perimeterSpecs(layout).map((p) => p.spec), ...innerSpecs(layout)];
    const wall: D.Inst[] = [];
    const ties: D.Inst[] = [];
    for (const spec of specs) {
      const cols = D.columnsOnWall(spec, COLUMNS);
      D.wallBricks(spec, Y0, wall, rand, cols);
      D.anchors(spec, cols, Y0, ties);
    }
    wall.sort((p, q) => p.p.y - q.p.y);
    ties.sort((p, q) => p.p.y - q.p.y);
    const split = 1;
    this.add(D.brickMesh(wall), 'lay', a, b, { layer: 'brick' });
    this.add(D.anchorMesh(ties, D.rebarMat()), 'lay', a, b, { layer: 'rebar' });
    // adukan siar di belakang bata, naik bersamaan; di tempat kolom dibiarkan kosong sampai dicor
    const mortar = new T.MeshStandardMaterial({ color: 0xbfb6a6, roughness: 1 });
    for (const spec of specs) {
      const gaps: Hole[] = D.columnsOnWall(spec, COLUMNS)
        .filter((c) => Math.abs(c) < spec.len / 2 - 0.15)
        .map((c) => ({ c, w: 0.2, y0: 0, y1: spec.h }));
      const g = wallGroup({ ...spec, t: spec.t * 0.55, holes: [...spec.holes, ...gaps] }, mortar, 1, false);
      g.position.y = Y0;
      this.add(g, 'riseLin', a, b, { layer: 'brick' });
    }
    // balok latei beton di atas pintu dan jendela
    for (const spec of specs) {
      for (const hole of spec.holes) {
        if (hole.y1 > spec.h - 0.2) continue;
        const g = new T.Group();
        g.position.set(spec.x, Y0, spec.z);
        g.rotation.y = spec.rotY;
        g.add(box(hole.w + 0.3, D.LINTEL, spec.t * 0.96, hole.c, hole.y1, 0, this.m.concrete));
        const f = (split * (hole.y1 + D.LINTEL)) / WH;
        this.add(g, 'rise', at(f - 0.05), at(f + 0.03), { layer: 'brick' });
      }
    }
  }

  private gablePrism(sx: number, t: number, mat: T.Material, edges = true) {
    const sh = new T.Shape();
    sh.moveTo(-3.5, 0);
    sh.lineTo(3.5, 0);
    sh.lineTo(0, RIDGE);
    sh.closePath();
    const geo = new T.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false });
    geo.translate(0, 0, -t / 2);
    const m = new T.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    if (edges)
      m.add(
        new T.LineSegments(
          new T.EdgesGeometry(geo, 30),
          new T.LineBasicMaterial({ color: 0x121212, transparent: true, opacity: 0.3 }),
        ),
      );
    m.position.set(sx * 4.5, YT, 0);
    m.rotation.y = Math.PI / 2;
    return m;
  }

  private solidWalls(
    a: number,
    b: number,
    layout: Layout,
    mat: T.Material,
    o: { out?: [number, number]; kind?: 'rise' | 'static' },
  ) {
    const at = (f: number) => lerp(a, b, f);
    const kind = o.kind ?? 'rise';
    perimeterSpecs(layout).forEach(({ spec }, i) => {
      const g = wallGroup(spec, mat);
      g.position.y = Y0;
      const out: [number, number] | undefined = o.out ? [o.out[0] + i * 0.07, o.out[1] + i * 0.07] : undefined;
      this.add(g, kind, at(i * 0.18), at(0.45 + i * 0.18), { out, layer: 'wall' });
    });
    innerSpecs(layout).forEach((spec, i) => {
      const g = wallGroup(spec, mat);
      g.position.y = Y0;
      this.add(g, kind, at(0.4 + i * 0.1), at(0.8 + i * 0.05), { out: o.out, layer: 'wall' });
    });
    for (const sx of [-1, 1])
      this.add(this.gablePrism(sx, T_WALL, mat), kind, at(0.78), at(1), { out: o.out, layer: 'wall' });
  }

  /** Plesteran menutup bata dari bawah ke atas (abu semen), lalu dicat putih pada jendela waktu `paint`. */
  plasterSkin(a: number, b: number, layout: Layout, paint: [number, number]) {
    const at = (f: number) => lerp(a, b, f);
    const skin = new T.MeshStandardMaterial({ color: 0xaaa49a, roughness: 0.95 });
    const specs = [...perimeterSpecs(layout).map((p) => p.spec), ...innerSpecs(layout)];
    specs.forEach((spec, i) => {
      const g = wallGroup({ ...spec, t: spec.t + 0.014 }, skin);
      g.position.y = Y0;
      this.add(g, 'rise', at((i / specs.length) * 0.5), at(0.45 + (i / specs.length) * 0.5), { layer: 'wall' });
    });
    for (const sx of [-1, 1])
      this.add(this.gablePrism(sx, T_WALL + 0.014, skin), 'rise', at(0.7), b, { layer: 'wall' });
    this.skin = { mat: skin, paint };
    this.plaster = paint;
  }

  private skin: { mat: T.MeshStandardMaterial; paint: [number, number] } | null = null;
  /** jendela waktu urugan kembali */
  private fill: [number, number] | null = null;

  update(u: number) {
    super.update(u);
    if (this.fill) this.ground.constant = 0.8 - ease(seg(u, this.fill[0], this.fill[1])) * 0.798;
    for (const [o, k] of this.scaled) o.scale.multiplyScalar(k);
    if (this.skin) {
      const k = ease(seg(u, this.skin.paint[0], this.skin.paint[1]));
      this.skin.mat.color.setHex(0xaaa49a).lerp(this.plasterTo, k);
    }
  }

  porch(a: number, b: number, drop = 1.2) {
    const at = (f: number) => lerp(a, b, f);
    for (const x of [-4.4, -0.6]) {
      this.add(box(0.2, 2.9, 0.2, x, Y0, 5.4, this.m.struct), 'rise', at(x < -2 ? 0 : 0.1), at(0.5), {
        layer: 'structure',
      });
    }
    this.add(box(4.8, 0.14, 2.7, -2.5, Y0 + 2.9, 4.6, this.m.struct), 'drop', at(0.45), at(1), {
      h: drop,
      layer: 'roofframe',
    });
  }

  /** Atap pelana baja ringan: kuda-kuda, ikatan angin, profil nok, alumunium foil, reng, genteng per keping, nok, lisplang. */
  roof(
    a: number,
    b: number,
    o: { mat?: T.MeshStandardMaterial; out?: [number, number]; static?: boolean; drop?: number } = {},
  ) {
    const at = (f: number) => lerp(a, b, f);
    const h = o.drop ?? 1.5;
    const ridgeY = YT + RIDGE;
    const eaveZ = HD / 2 + 0.6;
    const eaveY = YT - 0.6 * TAN;
    const rand = D.seeded(41);
    const add = (obj: T.Object3D, f0: number, f1: number, layer: 'roofframe' | 'rooftile', lay = false) => {
      if (o.static) this.add(obj, 'drop', -1, -1, { out: o.out, h, layer });
      else this.add(obj, lay ? 'lay' : 'drop', at(f0), at(f1), { out: o.out, h, layer });
    };
    // kuda-kuda baja ringan
    // jarak antar kuda-kuda 1,125 m; di kedua ujung perannya digantikan dinding ampig berbingkai beton
    const xs = Array.from({ length: 7 }, (_, i) => -3.375 + i * 1.125);
    xs.forEach((x, i) => {
      const g = new T.Group();
      const steel = this.m.steel;
      const s = 0.05;
      const hh = 0.09;
      g.add(bar(new T.Vector3(x, YT, -HD / 2), new T.Vector3(x, YT, HD / 2), s, hh, steel));
      g.add(bar(new T.Vector3(x, eaveY, -eaveZ), new T.Vector3(x, ridgeY, 0), s, hh, steel));
      g.add(bar(new T.Vector3(x, eaveY, eaveZ), new T.Vector3(x, ridgeY, 0), s, hh, steel));
      g.add(bar(new T.Vector3(x, YT, 0), new T.Vector3(x, ridgeY, 0), s, hh, steel));
      for (const sz of [-1, 1]) {
        // rangka batang pola W: tiang tiap 87,5 cm dan batang miring di antaranya
        const stops = [0, 0.875, 1.75, 2.625];
        const top = (z: number) => ridgeY - z * TAN;
        for (let k = 1; k < stops.length; k++) {
          const z = stops[k];
          g.add(bar(new T.Vector3(x, YT, sz * z), new T.Vector3(x, top(z), sz * z), 0.035, 0.05, steel, false));
          g.add(
            bar(new T.Vector3(x, YT, sz * stops[k - 1]), new T.Vector3(x, top(z), sz * z), 0.035, 0.05, steel, false),
          );
        }
        // pelat tumpuan di atas ring balok
        g.add(box(0.14, 0.05, 0.2, x, YT - 0.03, sz * 3.5, this.m.dark, { edges: false }));
      }
      add(g, i * 0.028, 0.24 + i * 0.028, 'roofframe');
    });
    // ikatan angin (bracing silang) di bidang atap
    const brace = new T.Group();
    for (const sz of [-1, 1])
      for (const [x0, x1] of [
        [-4.5, -1.5],
        [1.5, 4.5],
      ]) {
        const lo = (x: number) => new T.Vector3(x, YT + 0.06, sz * 3.5);
        const hi = (x: number) => new T.Vector3(x, ridgeY - 0.35 * TAN + 0.02, sz * 0.35);
        brace.add(
          bar(lo(x0), hi(x1), 0.04, 0.012, this.m.steel, false),
          bar(lo(x1), hi(x0), 0.04, 0.012, this.m.steel, false),
        );
      }
    add(brace, 0.38, 0.48, 'roofframe');
    // profil nok menyatukan puncak semua kuda-kuda
    add(box(10.1, 0.06, 0.09, 0, ridgeY - 0.01, 0, this.m.steel, { edges: false }), 0.4, 0.52, 'roofframe');
    // lapisan alumunium foil peredam panas
    const foil = new T.MeshStandardMaterial({ color: 0xcfd6da, roughness: 0.32, metalness: 0.75, side: T.DoubleSide });
    const L = eaveZ / Math.cos(PITCH);
    for (const sgn of [-1, 1]) {
      const geo = new T.BoxGeometry(10.1, 0.006, L - 0.06);
      geo.translate(5.05, 0, 0);
      const m = new T.Mesh(geo, foil);
      m.position.set(-5.05, (eaveY + ridgeY) / 2 + 0.066, sgn * (eaveZ / 2));
      m.rotation.x = sgn * PITCH;
      if (o.static) this.add(m, 'drop', -1, -1, { out: o.out, h, layer: 'rooftile' });
      else this.add(m, 'growX', at(sgn < 0 ? 0.5 : 0.54), at(sgn < 0 ? 0.6 : 0.64), { layer: 'rooftile' });
    }
    // reng, lalu genteng dipasang dari lisplang ke bubungan
    const tileMat =
      o.mat ?? new T.MeshStandardMaterial({ color: this.m.roof.color.clone(), roughness: 0.78, metalness: 0.02 });
    for (const sgn of [-1, 1]) {
      add(
        D.battens(sgn, PITCH, ridgeY, eaveZ, 5.05, this.m.steel),
        sgn < 0 ? 0.56 : 0.6,
        sgn < 0 ? 0.66 : 0.7,
        'roofframe',
        true,
      );
      add(
        D.roofTiles(sgn, PITCH, ridgeY, eaveZ, 5.1, tileMat, rand),
        sgn < 0 ? 0.66 : 0.72,
        sgn < 0 ? 0.88 : 0.94,
        'rooftile',
        true,
      );
    }
    add(D.ridgeTiles(ridgeY + 0.06, 5.12, tileMat), 0.94, 0.99, 'rooftile', true);
    // lisplang, talang, pipa tegak
    const trim = new T.Group();
    for (const sgn of [-1, 1]) {
      trim.add(box(10.2, 0.2, 0.03, 0, eaveY - 0.05, sgn * (eaveZ + 0.02), this.m.frame, { edges: false }));
      for (const sx of [-5.1, 5.1]) {
        trim.add(
          bar(
            new T.Vector3(sx, eaveY - 0.05, sgn * eaveZ),
            new T.Vector3(sx, ridgeY + 0.05, 0),
            0.03,
            0.2,
            this.m.frame,
            false,
          ),
        );
      }
    }
    for (const sgn of [-1, 1])
      trim.add(box(10.0, 0.09, 0.13, 0, eaveY - 0.2, sgn * (eaveZ + 0.1), this.m.steel, { edges: false }));
    for (const [px, pz] of [
      [4.9, 4.28],
      [-4.9, -4.28],
    ])
      trim.add(pipe(new T.Vector3(px, eaveY - 0.2, pz), new T.Vector3(px, 0.05, pz), 0.04, this.m.steel));
    add(trim, 0.94, 1, 'rooftile');
  }

  openings(a: number, b: number, layout: Layout, o: { out?: [number, number]; static?: boolean } = {}) {
    this.layer = 'openings';
    const at = (f: number) => lerp(a, b, f);
    let n = 0;
    for (const { spec, door } of perimeterSpecs(layout)) {
      spec.holes.forEach((hole, i) => {
        const g = openingGroup(hole, spec.t, this.m, door[i]);
        g.position.set(spec.x, Y0, spec.z);
        g.rotation.y = spec.rotY;
        if (o.static) this.add(g, 'fade', -1, -1, { out: o.out });
        else this.add(g, 'fade', at(n * 0.08), at(0.4 + n * 0.08), { out: o.out });
        n++;
      });
    }
  }

  /** Pipa air kotor di bawah lantai: ke septic tank dan sumur resapan, serta bak penangkap lemak dari dapur. */
  drainage(a: number, b: number, out: [number, number]) {
    const at = (f: number) => lerp(a, b, f);
    const waste = new T.MeshStandardMaterial({
      color: D.MEP_COLORS.waste,
      roughness: 0.6,
      clippingPlanes: [this.ground],
    });
    // pipa udara septic tank, muncul di atas tanah
    const vent = new T.MeshStandardMaterial({ color: D.MEP_COLORS.waste, roughness: 0.6 });
    this.add(
      D.group(
        D.run(
          [
            [4.6, -0.05, -5.25],
            [4.6, 0.85, -5.25],
            [4.78, 0.85, -5.25],
          ],
          0.05,
          vent,
        ),
      ),
      'seq',
      at(0.7),
      b,
      {
        layer: 'soil',
      },
    );
    const tank = D.pit(1.5, 0.6, 0.9);
    tank.position.set(4.6, -0.62, -5.0);
    const well = D.soakWell(0.45, 0.7);
    well.position.set(6.0, -0.72, -4.2);
    const trap = D.pit(0.55, 0.34, 0.45);
    trap.position.set(1.9, -0.3, -4.2);
    this.add(tank, 'pop', at(0), at(0.3), { out, layer: 'soil' });
    this.add(well, 'pop', at(0.15), at(0.45), { out, layer: 'soil' });
    this.add(trap, 'pop', at(0.25), at(0.55), { out, layer: 'soil' });
    this.add(
      D.group(
        D.run(
          [
            [3.45, 0.28, -3.0],
            [3.45, -0.12, -3.0],
            [3.9, -0.18, -4.6],
          ],
          0.096,
          waste,
        ),
        D.run(
          [
            [4.2, 0.1, -2.1],
            [4.2, -0.1, -2.1],
            [3.55, -0.14, -3.0],
          ],
          0.056,
          waste,
        ),
        D.run(
          [
            [5.25, -0.2, -4.9],
            [6.0, -0.28, -4.5],
          ],
          0.088,
          waste,
        ),
        D.run(
          [
            [1.94, 0.3, -3.35],
            [1.94, -0.05, -3.35],
            [1.9, -0.08, -4.1],
          ],
          0.064,
          waste,
        ),
        D.run(
          [
            [2.1, -0.12, -4.25],
            [3.9, -0.2, -4.85],
          ],
          0.072,
          waste,
        ),
      ),
      'seq',
      at(0.3),
      b,
      { out, layer: 'soil' },
    );
  }

  /** Instalasi air bersih (tandon, pompa, pipa) dan listrik (kWh meter, konduit, saklar, stop kontak, titik lampu). */
  services(a: number, b: number) {
    const at = (f: number) => lerp(a, b, f);
    const water = new T.MeshStandardMaterial({ color: D.MEP_COLORS.water, roughness: 0.45 });
    const power = new T.MeshStandardMaterial({ color: D.MEP_COLORS.power, roughness: 0.5 });
    const tower = D.waterTower(this.m);
    tower.position.set(5.75, 0, -2.3);
    this.add(tower, 'rise', at(0), at(0.25), { layer: 'fixtures' });
    this.add(
      D.group(
        D.run(
          [
            [5.75, 2.5, -2.3],
            [5.75, 2.25, -2.3],
            [4.62, 2.25, -2.3],
            [4.62, 1.35, -2.3],
            [4.38, 1.35, -2.3],
            [4.38, 1.35, -3.38],
          ],
          0.051,
          water,
        ),
        D.run(
          [
            [4.38, 1.35, -3.38],
            [3.45, 1.35, -3.38],
            [3.45, 1.0, -3.38],
            [3.45, 0.85, -3.16],
          ],
          0.045,
          water,
        ),
        D.run(
          [
            [3.45, 1.35, -3.38],
            [2.12, 1.35, -3.38],
            [2.12, 1.52, -3.38],
          ],
          0.045,
          water,
        ),
        D.run(
          [
            [4.38, 1.35, -2.3],
            [4.38, 2.45, -2.1],
            [4.38, 2.45, -1.86],
            [4.38, 1.25, -1.86],
          ],
          0.04,
          water,
        ),
      ),
      'seq',
      at(0.15),
      at(0.55),
      { layer: 'mep' },
    );
    const top = YR - 0.12;
    const lights: [number, number][] = [
      [-3.0, -1.75],
      [0, -1.75],
      [2.25, -1.4],
      [3.7, -2.65],
      [-2.2, 1.75],
      [2.4, 1.75],
    ];
    this.add(
      D.group(
        D.run(
          [
            [4.62, 1.9, 2.9],
            [4.62, top, 2.9],
            [4.34, top, 2.9],
            [4.34, top, 0.08],
          ],
          0.035,
          power,
        ),
        D.run(
          [
            [4.34, top, 0.08],
            [-4.34, top, 0.08],
          ],
          0.035,
          power,
        ),
        ...lights.map(([x, z]) =>
          D.run(
            [
              [x, top, 0.08],
              [x, top, z],
            ],
            0.029,
            power,
          ),
        ),
        // turunan ke saklar dan stop kontak
        ...[-3.0, -1.2, 0.2, 1.7, 3.0, 4.1].map((x) =>
          D.run(
            [
              [x, top, 0.08],
              [x, Y0 + 1.2, 0.08],
            ],
            0.024,
            power,
          ),
        ),
        ...[-4.34, 4.34].map((x) =>
          D.run(
            [
              [x, top, 0.08],
              [x, top, 3.3],
              [x, Y0 + 0.35, 3.3],
            ],
            0.024,
            power,
          ),
        ),
      ),
      'seq',
      at(0.35),
      at(0.85),
      { layer: 'mep' },
    );
    const outlet = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const glow = new T.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffdf8a, emissiveIntensity: 0.9 });
    const points = new T.Group();
    for (const x of [-3.0, -1.2, 0.2, 1.7, 3.0, 4.1]) points.add(box(0.14, 0.14, 0.05, x, Y0 + 1.13, 0.1, outlet));
    for (const x of [-4.34, 4.34]) points.add(box(0.05, 0.14, 0.14, x, Y0 + 0.3, 3.3, outlet));
    for (const [x, z] of lights) {
      const lamp = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.05, 18), glow);
      lamp.position.set(x, top - 0.02, z);
      points.add(lamp);
    }
    // kWh meter dan panel MCB
    points.add(
      box(0.12, 0.42, 0.32, 4.68, 1.55, 2.9, this.m.paper),
      box(0.03, 0.12, 0.2, 4.75, 1.76, 2.9, this.m.dark, { edges: false }),
    );
    this.add(points, 'seq', at(0.7), b, { layer: 'mep' });
  }

  /** Keramik lantai dan perabot (terlihat pada tampilan "Denah 3D"). */
  interior(a: number, b: number) {
    const at = (f: number) => lerp(a, b, f);
    const rand = D.seeded(57);
    this.add(D.floorTiles(-4.4, 4.4, -3.4, 3.4, Y0 + 0.008, rand), 'lay', at(0), at(0.6), { layer: 'interior' });
    this.add(D.floorTiles(-4.45, -0.55, 3.6, 5.45, Y0 + 0.008, rand), 'lay', at(0.45), at(0.65), { layer: 'interior' });
    D.furniture(Y0 + 0.016, this.m).forEach((g, i) =>
      this.add(g, 'pop', at(0.55 + i * 0.025), at(0.75 + i * 0.018), { layer: 'interior' }),
    );
  }

  /** Material dan alat di lokasi: tumpukan bata, pasir, semen, dan molen yang berputar. */
  materials(a: number, b: number, out: [number, number]) {
    const at = (f: number) => lerp(a, b, f);
    const rand = D.seeded(71);
    const put = (o: T.Object3D, x: number, z: number, f: number, ry = 0) => {
      o.position.set(x, 0, z);
      o.rotation.y = ry;
      this.add(o, 'pop', at(f), at(f + 0.4), { out, layer: 'temp' });
    };
    put(D.brickStack(rand), 6.0, 0.4, 0, Math.PI / 2);
    put(D.brickStack(rand), 6.0, 1.6, 0.15, Math.PI / 2);
    put(D.sandPile(), -5.8, 3.7, 0.2);
    put(D.cementSacks(), -5.9, 2.2, 0.35, Math.PI / 2);
    const molen = D.mixer(this.m);
    put(molen, -5.85, 0.5, 0.5, -0.5);
    const drum = molen.userData.drum as T.Object3D;
    this.tickers.push((time) => (drum.rotation.y = time * 3));
  }

  /** Satu orang yang hadir pada jendela waktu tertentu. */
  worker(a: number, b: number, at: [number, number, number], ry: number, o: D.PersonOpts = {}, extra?: T.Object3D) {
    const g = D.person(o);
    if (extra) g.add(extra);
    g.position.set(...at);
    g.rotation.y = ry;
    this.add(g, 'pop', a, a + 0.08, { out: [b, b + 0.08], layer: 'temp' });
  }

  /** Tim di tiap tahap, semuanya ber-APD, ditutup serah terima kunci kepada keluarga pemilik. */
  crew() {
    const paper = box(0.6, 0.02, 0.42, 0, 1.12, 0.46, this.m.paper);
    const WHITE = 0xf4f2ec;
    // survei: surveyor di alat ukur, asisten memegang rambu
    this.worker(1.05, 1.95, [-6.2, 0, 6.5], 2.4, { helmet: WHITE, pose: 'reach' });
    const rod = D.staffPole(this.m);
    rod.position.set(0.05, 0.2, 0.46);
    this.worker(1.25, 1.95, [4.9, 0, 4.0], -1.2, { pose: 'hold' }, rod);
    // perencanaan: pengawas dan pemilik membahas gambar kerja
    this.worker(2.12, 2.92, [-3.0, 0, 6.35], 2.75, { helmet: WHITE, pose: 'hold' }, paper);
    this.worker(2.18, 2.92, [-1.7, 0, 6.35], -2.75, { vest: null, helmet: WHITE, shirt: 0x7a2f2f });
    // pondasi: tukang besi
    this.worker(3.18, 3.86, [-3.0, 0, -1.75], 0.6, { pose: 'crouch' });
    this.worker(3.3, 3.86, [3.0, 0, 1.75], -2.2, { pose: 'crouch', vest: 0xc6d63a });
    this.worker(3.42, 3.9, [-6.2, 0, 1.3], 1.9, { pose: 'reach' });
    // struktur dan dinding: tukang batu di perancah dan di lantai
    this.worker(4.26, 5.46, [-0.8, 1.56, -4.25], 0, { pose: 'reach' });
    this.worker(4.3, 5.46, [2.6, 1.56, -4.25], 0, { pose: 'hold', vest: 0xc6d63a });
    this.worker(4.08, 4.46, [2.7, Y0, 4.05], Math.PI, { pose: 'crouch' });
    this.worker(4.06, 4.9, [6.0, 0, 2.7], -1.6, { helmet: WHITE, pose: 'stand' });
    // atap: dua tukang di atas rangka
    for (const [x, z, ry] of [
      [-2.2, 2.3, Math.PI],
      [2.4, 1.2, Math.PI],
    ]) {
      const y = YT + RIDGE - (Math.abs(z) / Math.cos(PITCH)) * Math.sin(PITCH) + 0.1;
      this.worker(4.98, 5.2, [x, y, z], ry, { pose: 'crouch' });
    }
    // finishing: tukang cat dengan rol panjang
    const roller = new T.Group();
    roller.add(
      pipe(new T.Vector3(0.18, 1.35, 0.45), new T.Vector3(0.18, 2.3, 0.62), 0.018, this.m.wood),
      box(0.36, 0.1, 0.1, 0.18, 2.27, 0.63, this.m.paper),
    );
    this.worker(5.55, 5.96, [3.7, 0, 4.15], Math.PI, { pose: 'reach' }, roller);
    this.worker(5.62, 5.96, [-5.35, 0, 1.3], Math.PI / 2, { pose: 'reach', vest: 0xc6d63a });
    // serah terima: tim Bangun Asa menyerahkan kunci kepada keluarga pemilik
    const key = new T.Group();
    const gold = new T.MeshStandardMaterial({ color: 0xe6b422, metalness: 0.7, roughness: 0.35 });
    const ring = new T.Mesh(new T.TorusGeometry(0.07, 0.022, 8, 18), gold);
    ring.position.set(0.12, 1.1, 0.5);
    key.add(ring, box(0.24, 0.035, 0.035, 0.31, 1.08, 0.5, gold, { edges: false }));
    const stay = (
      a: number,
      at: [number, number, number],
      ry: number,
      o: D.PersonOpts,
      extra?: T.Object3D,
      scale = 1,
    ) => {
      const g = D.person(o);
      if (extra) g.add(extra);
      g.position.set(...at);
      g.rotation.y = ry;
      this.add(g, 'pop', a, a + 0.18, { layer: 'landscape' });
      if (scale !== 1) this.scaled.set(g, scale);
    };
    stay(6.3, [-3.6, 0, 6.45], 1.35, { helmet: WHITE, pose: 'hold' }, key);
    stay(6.42, [-4.45, 0, 6.15], 1.2, {});
    stay(6.5, [-1.65, 0, 6.45], -1.35, { vest: null, helmet: null, shirt: 0x2f5d7a, pose: 'hold' });
    stay(6.58, [-0.85, 0, 6.25], -1.25, {
      vest: null,
      helmet: null,
      shirt: 0x8a3b52,
      pants: 0x3d3140,
      hijab: 0x9b3c55,
    });
    stay(6.66, [-1.25, 0, 6.38], -1.5, { vest: null, helmet: null, shirt: 0xd9a13b }, undefined, 0.68);
  }

  /** Langkah Kontrak: tim dan keluarga pemilik menandatangani dokumen di lokasi. Belum ada pekerjaan fisik. */
  contract(a: number, b: number) {
    const out: [number, number] = [b + 0.01, b + 0.08];
    const pop = (o: T.Object3D, delay: number) =>
      this.add(o, 'pop', a + delay, a + delay + 0.015, { out, layer: 'temp' });
    const table = new T.Group();
    table.position.set(-2.4, 0, 6.35);
    table.add(box(1.2, 0.05, 0.72, 0, 0.78, 0, this.m.wood));
    for (const x of [-0.52, 0.52])
      for (const z of [-0.28, 0.28]) table.add(box(0.06, 0.78, 0.06, x, 0, z, this.m.wood, { edges: false }));
    // lembar kontrak dengan baris teks, meterai merah, dan pulpen
    table.add(box(0.5, 0.012, 0.36, -0.05, 0.835, 0, this.m.paper));
    for (let k = 0; k < 4; k++)
      table.add(box(0.34, 0.004, 0.018, -0.07, 0.848, -0.11 + k * 0.06, this.m.dark, { edges: false, cast: false }));
    table.add(box(0.09, 0.006, 0.07, 0.1, 0.848, 0.1, this.m.red, { edges: false }));
    table.add(box(0.24, 0.016, 0.018, 0.32, 0.836, 0.04, this.m.dark, { edges: false }));
    pop(table, 0);
    const person = (at: [number, number, number], ry: number, o: D.PersonOpts, delay: number) => {
      const g = D.person(o);
      g.position.set(...at);
      g.rotation.y = ry;
      pop(g, delay);
    };
    person([-3.4, 0, 6.35], Math.PI / 2, { helmet: 0xf4f2ec, pose: 'hold' }, 0.008);
    person([-1.4, 0, 6.35], -Math.PI / 2, { vest: null, helmet: null, shirt: 0x2f5d7a, pose: 'hold' }, 0.016);
    person(
      [-1.15, 0, 5.75],
      -1.2,
      { vest: null, helmet: null, shirt: 0x8a3b52, pants: 0x3d3140, hijab: 0x9b3c55 },
      0.024,
    );
  }

  /** Perlengkapan dinding luar: unit AC di sisi kanan, lampu teras, papan nomor rumah. */
  fixtures(a: number, b: number) {
    this.layer = 'fixtures';
    const at = (f: number) => lerp(a, b, f);
    const ac = acUnit(this.m);
    ac.position.set(4.82, Y0 + 1.1, 0.4);
    ac.rotation.y = Math.PI / 2;
    this.add(ac, 'pop', at(0.3), at(0.7));
    const glow = new T.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xfff1c9, emissiveIntensity: 0.8 });
    const lampG = new T.Group();
    lampG.add(box(0.14, 0.2, 0.1, -1.55, Y0 + 2.3, 3.62, glow, { edges: false }));
    lampG.add(box(0.3, 0.2, 0.03, -3.5, Y0 + 1.6, 3.6, this.m.red, { edges: false }));
    this.add(lampG, 'pop', at(0.5), at(0.9));
  }

  landscape(a: number, b: number) {
    this.layer = 'landscape';
    const at = (f: number) => lerp(a, b, f);
    // jalan setapak dari teras ke gerbang
    for (let i = 0; i < 4; i++) {
      const st = box(1.0, 0.06, 0.3, -2.5, 0.0, 5.8 + i * 0.37, this.m.concrete);
      st.userData.noFit = true;
      this.add(st, 'pop', at(i * 0.08), at(0.2 + i * 0.08));
    }
    // pagar depan dengan celah gerbang
    const posts: number[] = [];
    for (let x = -6.6; x <= 6.61; x += 1.65) if (Math.abs(x + 2.5) > 1.1) posts.push(x);
    const fence = new T.Group();
    for (const x of posts) fence.add(box(0.14, 1.1, 0.14, x, 0, 7.2, this.m.concrete));
    const addRail = (x0: number, x1: number) => {
      for (const y of [0.4, 0.95])
        fence.add(box(x1 - x0, 0.05, 0.05, (x0 + x1) / 2, y, 7.2, this.m.steel, { edges: false }));
    };
    addRail(-6.6, -3.6);
    addRail(-1.4, 6.6);
    fence.userData.noFit = true;
    this.add(fence, 'rise', at(0.3), at(0.7));
    // pohon dan semak
    const tree = new T.Group();
    tree.position.set(5.6, 0, 5.7);
    tree.scale.setScalar(0.75);
    tree.add(box(0.28, 2.2, 0.28, 0, 0, 0, this.m.trunk, { edges: false }));
    const f1 = new T.Mesh(new T.IcosahedronGeometry(1.3, 1), this.m.foliage);
    f1.position.set(0, 3.0, 0);
    f1.castShadow = true;
    const f2 = new T.Mesh(new T.IcosahedronGeometry(0.9, 1), this.m.foliage);
    f2.position.set(0.7, 2.4, 0.5);
    f2.castShadow = true;
    tree.add(f1, f2);
    tree.userData.noFit = true;
    this.add(tree, 'pop', at(0.5), at(0.9));
    const bush = new T.Mesh(new T.IcosahedronGeometry(0.5, 1), this.m.foliage);
    bush.position.set(-5.2, 0.35, 5.6);
    bush.castShadow = true;
    bush.userData.noFit = true;
    this.add(bush, 'pop', at(0.6), at(0.9));
  }

  /** Perancah pipa baja di sisi kanan rumah (untuk skena renovasi). */
  scaffold(a: number, b: number, out?: [number, number]) {
    this.layer = 'temp';
    const at = (f: number) => lerp(a, b, f);
    const g = new T.Group();
    const rows = [5.4, 6.2];
    const zs = [-3.5, -1.5, 0.5, 2.5, 4.5];
    const top = 6.0;
    for (const x of rows) {
      for (const z of zs) g.add(pipe(new T.Vector3(x, 0, z), new T.Vector3(x, top, z), 0.03, this.m.scaffold));
      for (const y of [1.2, 2.6, 4.0, 5.4])
        g.add(pipe(new T.Vector3(x, y, zs[0]), new T.Vector3(x, y, zs[zs.length - 1]), 0.022, this.m.scaffold));
    }
    for (const y of [1.2, 2.6, 4.0, 5.4])
      for (const z of zs)
        g.add(pipe(new T.Vector3(rows[0], y, z), new T.Vector3(rows[1], y, z), 0.022, this.m.scaffold));
    for (const y of [2.6, 4.0]) g.add(box(0.8, 0.04, 8, 5.8, y, 0.5, this.m.wood, { edges: false }));
    for (let i = 0; i < 3; i++) {
      g.add(
        pipe(
          new T.Vector3(rows[0], i * 1.4, zs[i]),
          new T.Vector3(rows[0], (i + 1) * 1.4 + 0.2, zs[i + 2]),
          0.02,
          this.m.scaffold,
        ),
      );
    }
    this.add(g, 'rise', at(0), at(1), { out });
  }

  /** Susun lengkap untuk model proses (7 langkah). */
  buildProcess() {
    this.site(0, 0.85);
    this.survey(1.0, 1.9, [3.45, 3.85]);
    this.plan(2.0, 2.9, [3.1, 3.4]);
    this.contract(3.0, 3.1);
    // pekerjaan fisik baru dimulai setelah kontrak (langkah 5: Pelaksanaan)
    this.drainage(3.16, 3.66, [3.9, 4.0]);
    this.foundation(3.1, 4.0, [4.64, 4.7]);
    this.materials(3.14, 3.45, [5.55, 5.8]);
    // urutan pasangan bata terkekang: bata, kolom, ring balok, ampig, atap
    this.walls(4.03, 4.42, LAYOUT_A);
    this.layer = 'temp';
    for (const face of [
      D.scaffoldFace([-4.4, -3.55], [4.4, -3.55], [0, -1], this.m),
      D.scaffoldFace([-4.55, -3.4], [-4.55, 3.4], [-1, 0], this.m),
    ])
      this.add(face, 'rise', 4.2, 4.34, { out: [5.5, 5.66] });
    this.porch(4.44, 4.76, 1);
    this.castColumns(4.42, 4.62);
    this.ringBeam(4.6, 4.74);
    this.gableWalls(4.72, 4.86);
    this.roof(4.84, 5.22, { drop: 1 });
    this.services(5.18, 5.44);
    this.openings(5.5, 5.82, LAYOUT_A);
    this.plasterSkin(5.28, 5.66, LAYOUT_A, [5.66, 5.96]);
    this.interior(5.55, 6.0);
    this.fixtures(5.75, 5.98);
    this.landscape(6.0, 6.7);
    this.crew();
  }

  /** skala dasar benda yang lebih kecil (anak), karena animasi 'pop' mengatur skala */
  private scaled = new Map<T.Object3D, number>();
}
