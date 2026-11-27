/**
 * Kompleks bangunan komersial di satu jalan: gedung KANTOR 4 lantai (dinding kaca curtain wall, kanopi lobi, sirip peneduh,
 * inti lift, AHU di atap), RUKO 3 lantai dua unit (rolling door, balkon berpagar kaca, AC, kanopi, papan nama, tandon air),
 * dan KAFE 1 lantai (etalase kaca, atap beton menjorok, teras kayu, meja dan payung, lampu gantung, cerobong dapur).
 * Ketiganya dengan struktur kolom, balok, dan pelat yang benar, celah muai di antara gedung, trotoar, area parkir, dan mobil.
 */
import * as T from 'three';
import { COLORS, box, lerp, openingGroup, pipe, signTexture, wallGroup, type Hole } from './kit';
import { House } from './house';
import * as D from './detail';
import { acUnit, car, lamp, PALETTE, tableSet, tree } from './props';

const Y0 = 0.45;
const SL = 0.15;

interface Bld {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  floors: number;
  fh: number;
  col: number;
  xs: number[];
  zs: number[];
}

const OFFICE: Bld = {
  x0: -10,
  x1: -3.15,
  z0: -5,
  z1: 5,
  floors: 4,
  fh: 3.6,
  col: 0.3,
  xs: [-10, -6.575, -3.15],
  zs: [-5, 0, 5],
};
const RUKO: Bld = {
  x0: -2.85,
  x1: 5,
  z0: -5,
  z1: 5,
  floors: 3,
  fh: 3.6,
  col: 0.25,
  xs: [-2.85, 1.075, 5],
  zs: [-5, 0, 5],
};
const CAFE: Bld = {
  x0: 5.3,
  x1: 11,
  z0: -3,
  z1: 5,
  floors: 1,
  fh: 4.2,
  col: 0.25,
  xs: [5.3, 8.15, 11],
  zs: [-3, 1, 5],
};

const cx = (b: Bld) => (b.x0 + b.x1) / 2;
const cz = (b: Bld) => (b.z0 + b.z1) / 2;
const topOf = (b: Bld) => Y0 + b.floors * b.fh;

function glassMat() {
  return new T.MeshStandardMaterial({
    color: 0x7ba6c2,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.5,
  });
}

export class Shop extends House {
  /** Garis batas tapak yang digambar di tanah. */
  plot(a: number, b: number) {
    const at = (f: number) => lerp(a, b, f);
    const x0 = -12;
    const x1 = 12.5;
    const z0 = -6;
    const z1 = 12.8;
    const rib = (x: number, z: number, len: number, ax: 'x' | 'z', f: number) => {
      const m =
        ax === 'x'
          ? box(len, 0.02, 0.12, x, 0, z, this.m.red, { pivot: 'left', edges: false, cast: false })
          : box(0.12, 0.02, len, x, 0, z, this.m.red, { pivot: 'back', edges: false, cast: false });
      m.userData.noFit = true;
      this.add(m, ax === 'x' ? 'growX' : 'growZ', at(f), at(f + 0.3));
    };
    rib(x0, z1, x1 - x0, 'x', 0);
    rib(x1, z0, z1 - z0, 'z', 0.25);
    rib(x0, z0, x1 - x0, 'x', 0.5);
    rib(x0, z0, z1 - z0, 'z', 0.7);
  }

  /** Struktur beton bertulang: footplat, sloof, kolom dan pelat lantai per tingkat. */
  frame(b: Bld, a: number, e: number) {
    const at = (f: number) => lerp(a, e, f);
    const w = b.x1 - b.x0;
    const d = b.z1 - b.z0;
    const rust = D.rebarMat();
    let i = 0;
    for (const x of b.xs) {
      for (const z of b.zs) {
        const p = b.col > 0.28 ? 1.1 : 0.9;
        this.add(box(p, 0.3, p, x, 0, z, this.m.concrete), 'rise', at(i * 0.01), at(0.12 + i * 0.01));
        i++;
      }
    }
    for (const z of b.zs)
      this.add(box(w, 0.25, 0.2, b.x0, 0.3, z, this.m.concrete, { pivot: 'left' }), 'growX', at(0.1), at(0.22));
    for (const x of b.xs)
      this.add(box(0.2, 0.25, d, x, 0.3, b.z0, this.m.concrete, { pivot: 'back' }), 'growZ', at(0.14), at(0.26));
    this.add(box(w + 0.3, 0.12, d + 0.3, cx(b), Y0 - 0.12, cz(b), this.m.concrete), 'rise', at(0.22), at(0.3));
    for (let L = 0; L < b.floors; L++) {
      const s0 = 0.3 + (0.7 * L) / b.floors;
      const s1 = 0.3 + (0.7 * (L + 1)) / b.floors;
      const y = Y0 + L * b.fh;
      let k = 0;
      for (const x of b.xs) {
        for (const z of b.zs) {
          this.add(
            box(b.col, b.fh - SL, b.col, x, y, z, this.m.struct),
            'rise',
            at(s0 + k * 0.004),
            at(s0 + (s1 - s0) * 0.6),
          );
          k++;
        }
      }
      const top = y + b.fh;
      this.add(
        box(w + b.col, SL, d + b.col, cx(b), top - SL, cz(b), this.m.struct),
        'rise',
        at(s0 + (s1 - s0) * 0.5),
        at(s1),
      );
      // balok induk dan anak di bawah pelat, mengikuti grid kolom
      const beams = new T.Group();
      for (const z of b.zs) beams.add(box(w, 0.34, 0.2, cx(b), top - SL - 0.34, z, this.m.struct));
      for (const x of b.xs) beams.add(box(0.2, 0.34, d, x, top - SL - 0.34, cz(b), this.m.struct));
      this.add(beams, 'rise', at(s0 + (s1 - s0) * 0.45), at(s1));
      // besi sambungan (stek) di atas pelat sampai kolom lantai berikutnya dicor
      const stek = new T.Group();
      for (const x of b.xs)
        for (const z of b.zs)
          for (const dx of [-0.07, 0.07])
            for (const dz of [-0.07, 0.07])
              stek.add(box(0.022, 0.7, 0.022, x + dx, top, z + dz, rust, { edges: false, cast: false }));
      this.add(stek, 'rise', at(s1 - 0.02), at(s1 + 0.04), {
        out: L < b.floors - 1 ? [at(s1 + 0.1), at(s1 + 0.14)] : [4.2, 4.5],
      });
    }
    if (!this.painted.includes(this.m.struct)) this.painted.push(this.m.struct);
  }

  /** Dinding bata samping/belakang dengan jendela pita per lantai. */
  sideWalls(b: Bld, sides: ('left' | 'right' | 'back')[], winPos: number[], winW: number, a: number, e: number) {
    const at = (f: number) => lerp(a, e, f);
    const H = b.floors * b.fh - SL;
    const mk = (side: 'left' | 'right' | 'back') => {
      const holes: Hole[] = [];
      for (let L = 0; L < b.floors; L++) {
        for (const p of winPos) {
          const c = side === 'left' ? p : -p;
          holes.push({ c, w: winW, y0: L * b.fh + 0.9, y1: L * b.fh + 2.4 });
        }
      }
      if (side === 'left')
        return wallGroup(
          { len: b.z1 - b.z0 - b.col, h: H, t: 0.2, x: b.x0, z: cz(b), rotY: -Math.PI / 2, holes },
          this.m.brick,
        );
      if (side === 'right')
        return wallGroup(
          { len: b.z1 - b.z0 - b.col, h: H, t: 0.2, x: b.x1, z: cz(b), rotY: Math.PI / 2, holes },
          this.m.brick,
        );
      return wallGroup(
        { len: b.x1 - b.x0 - b.col, h: H, t: 0.2, x: cx(b), z: b.z0, rotY: Math.PI, holes },
        this.m.brick,
      );
    };
    sides.forEach((s, i) => {
      const g = mk(s);
      g.position.y = Y0;
      this.add(g, 'rise', at(i * 0.2), at(0.6 + i * 0.2));
      // jendela
      for (let L = 0; L < b.floors; L++) {
        for (const p of winPos) {
          const hole: Hole = { c: 0, w: winW, y0: L * b.fh + 0.9, y1: L * b.fh + 2.4 };
          const og = openingGroup(hole, 0.2, this.m);
          if (s === 'left') {
            og.position.set(b.x0, Y0, cz(b) + p);
            og.rotation.y = -Math.PI / 2;
          } else if (s === 'right') {
            og.position.set(b.x1, Y0, cz(b) + p);
            og.rotation.y = Math.PI / 2;
          } else {
            og.position.set(cx(b) + p, Y0, b.z0);
            og.rotation.y = Math.PI;
          }
          this.add(og, 'fade', at(0.55 + L * 0.06), at(1));
        }
      }
    });
  }

  // ---------------- KANTOR ----------------
  office(a: number, e: number) {
    const b = OFFICE;
    const at = (f: number) => lerp(a, e, f);
    const w = b.x1 - b.x0;
    const zf = b.z1;
    this.sideWalls(b, ['left', 'back', 'right'], [-3.2, 0, 3.2], 2.0, a, at(0.5));
    const dark = this.m.dark;
    // curtain wall: kaca per lantai, spandrel logam, mullion tiap 1,14 m, sirip peneduh
    for (let L = 0; L < b.floors; L++) {
      const y = Y0 + L * b.fh;
      const f0 = 0.35 + L * 0.13;
      const g = new T.Group();
      const gh = L === 0 ? b.fh - 0.45 : b.fh - 0.95;
      const gy = L === 0 ? y : y + 0.8;
      const pane = new T.Mesh(new T.BoxGeometry(w, gh, 0.04), glassMat());
      pane.position.set(cx(b), gy + gh / 2, zf + 0.02);
      g.add(pane);
      this.add(g, 'fade', at(f0), at(f0 + 0.2));
      const frameG = new T.Group();
      const n = Math.round(w / 1.14);
      for (let k = 0; k <= n; k++)
        frameG.add(box(0.07, gh, 0.12, b.x0 + (k * w) / n, gy, zf + 0.04, dark, { edges: false }));
      frameG.add(box(w, 0.06, 0.12, cx(b), gy, zf + 0.04, dark, { edges: false }));
      frameG.add(box(w, 0.06, 0.12, cx(b), gy + gh - 0.06, zf + 0.04, dark, { edges: false }));
      if (L > 0) frameG.add(box(w, 0.95, 0.1, cx(b), y - 0.2, zf + 0.05, this.m.steel, { edges: false }));
      this.add(frameG, 'rise', at(f0), at(f0 + 0.2));
      if (L > 0)
        this.add(
          box(w, 0.04, 0.55, cx(b), y + 2.6, zf + 0.3, dark, { edges: false }),
          'growX',
          at(f0 + 0.1),
          at(f0 + 0.3),
        );
    }
    // kanopi lobi + pintu putar + papan nama
    const lobby = new T.Group();
    lobby.add(box(4.2, 0.2, 2.4, cx(b), Y0 + 3.0, zf + 1.2, this.m.struct));
    lobby.add(box(0.05, 0.9, 0.05, cx(b) - 1.9, Y0 + 3.0, zf + 2.2, this.m.steel, { edges: false }));
    lobby.add(box(0.05, 0.9, 0.05, cx(b) + 1.9, Y0 + 3.0, zf + 2.2, this.m.steel, { edges: false }));
    lobby.add(
      pipe(
        new T.Vector3(cx(b) - 1.9, Y0 + 3.9, zf + 2.2),
        new T.Vector3(cx(b) - 1.9, Y0 + 3.2, zf + 2.2),
        0.015,
        this.m.steel,
      ),
    );
    lobby.add(box(4.6, 0.12, 2.6, cx(b), 0, zf + 1.3, this.m.concrete));
    const rev = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 2.3, 20, 1, true), glassMat());
    rev.position.set(cx(b), Y0 + 1.15, zf + 0.9);
    lobby.add(rev);
    for (let k = 0; k < 4; k++) {
      const blade = box(0.04, 2.2, 0.82, cx(b), Y0, zf + 0.9, this.m.steel, { edges: false });
      blade.rotation.y = (k * Math.PI) / 2 + 0.5;
      blade.position.set(cx(b), Y0, zf + 0.9);
      lobby.add(blade);
    }
    this.add(lobby, 'drop', at(0.62), at(0.8), { h: 1.2 });
    const sign = new T.Mesh(
      new T.BoxGeometry(3.6, 0.6, 0.1),
      new T.MeshStandardMaterial({ map: signTexture('KANTOR', '#1d1b1a'), roughness: 0.6 }),
    );
    sign.position.set(cx(b), Y0 + 3.55, zf + 0.12);
    sign.castShadow = true;
    this.add(sign, 'pop', at(0.78), at(0.95));
    // atap: parapet, inti lift, AHU, tiang antena
    const roof = new T.Group();
    const top = topOf(b);
    roof.add(box(w + 0.3, 0.9, 0.15, cx(b), top, b.z1, this.m.struct));
    roof.add(box(w + 0.3, 0.9, 0.15, cx(b), top, b.z0, this.m.struct));
    roof.add(box(0.15, 0.9, b.z1 - b.z0, b.x0, top, cz(b), this.m.struct));
    roof.add(box(0.15, 0.9, b.z1 - b.z0, b.x1, top, cz(b), this.m.struct));
    this.add(roof, 'rise', at(0.7), at(0.9));
    const core = new T.Group();
    core.add(box(3.2, 2.3, 3.0, b.x0 + 2.3, top, b.z0 + 2.1, this.m.struct));
    for (const dx of [0, 1.7]) {
      core.add(box(1.4, 1.0, 1.0, b.x0 + 2.6 + dx, top, b.z1 - 3.0, this.m.steel));
      const fan = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 0.05, 16), this.m.dark);
      fan.position.set(b.x0 + 2.6 + dx, top + 1.03, b.z1 - 3.0);
      core.add(fan);
    }
    core.add(
      pipe(
        new T.Vector3(b.x1 - 1.2, top, b.z0 + 1.5),
        new T.Vector3(b.x1 - 1.2, top + 4.2, b.z0 + 1.5),
        0.04,
        this.m.steel,
      ),
    );
    core.add(
      pipe(
        new T.Vector3(b.x1 - 1.6, top + 3.6, b.z0 + 1.5),
        new T.Vector3(b.x1 - 0.8, top + 3.6, b.z0 + 1.5),
        0.025,
        this.m.steel,
      ),
    );
    this.add(core, 'pop', at(0.8), at(1));
  }

  // ---------------- RUKO ----------------
  ruko(a: number, e: number) {
    const b = RUKO;
    const at = (f: number) => lerp(a, e, f);
    const w = b.x1 - b.x0;
    const zf = b.z1;
    const H = b.floors * b.fh - SL;
    this.sideWalls(b, ['back', 'right'], [-2.5, 2.5], 1.4, a, at(0.5));
    // dinding depan dengan lubang etalase dan jendela
    const holes: Hole[] = [];
    const units = [-1.95, 1.95];
    for (const c of units) holes.push({ c, w: 3.5, y0: 0.5, y1: 3.0 });
    for (let L = 1; L < b.floors; L++)
      for (const c of units) holes.push({ c, w: 2.4, y0: L * b.fh + 0.9, y1: L * b.fh + 2.4 });
    const front = wallGroup({ len: w, h: H, t: 0.2, x: cx(b), z: zf, rotY: 0, holes }, this.m.brick);
    front.position.y = Y0;
    this.add(front, 'rise', at(0.3), at(0.8));
    // jendela lantai atas
    for (let L = 1; L < b.floors; L++) {
      units.forEach((c, i) => {
        const og = openingGroup({ c: 0, w: 2.4, y0: L * b.fh + 0.9, y1: L * b.fh + 2.4 }, 0.2, this.m);
        og.position.set(cx(b) + c, Y0, zf);
        this.add(og, 'fade', at(0.55 + L * 0.08 + i * 0.04), at(0.95));
      });
    }
    // unit kiri: rolling door setengah terbuka; unit kanan: etalase kaca
    const rd = new T.Group();
    rd.position.set(cx(b) + units[0], Y0, zf + 0.03);
    const slats = new T.MeshStandardMaterial({ color: 0xa7acb1, roughness: 0.45, metalness: 0.5 });
    rd.add(box(3.5, 1.2, 0.05, 0, 0.5, 0, slats, { edges: false }));
    for (let k = 0; k < 9; k++) rd.add(box(3.5, 0.012, 0.06, 0, 0.5 + k * 0.13, 0, this.m.dark, { edges: false }));
    rd.add(box(3.7, 0.3, 0.3, 0, 2.72, 0.06, slats, { edges: false }));
    for (const x of [-1.78, 1.78]) rd.add(box(0.08, 2.5, 0.1, x, 0.5, 0, this.m.dark, { edges: false }));
    this.add(rd, 'rise', at(0.6), at(0.9));
    const shop = openingGroup({ c: 0, w: 3.5, y0: 0.5, y1: 3.0 }, 0.2, this.m);
    shop.position.set(cx(b) + units[1], Y0, zf);
    this.add(shop, 'fade', at(0.62), at(1));
    // kanopi lantai 1, balkon lantai 2 dengan pagar kaca
    this.add(box(w + 0.2, 0.12, 1.0, cx(b), Y0 + 3.1, zf + 0.5, this.m.struct), 'drop', at(0.4), at(0.6), { h: 0.8 });
    const bal = new T.Group();
    bal.add(box(w - 0.4, SL, 1.3, cx(b), Y0 + b.fh - SL, zf + 0.65, this.m.struct));
    const rail = new T.Mesh(new T.BoxGeometry(w - 0.4, 1.0, 0.02), glassMat());
    rail.position.set(cx(b), Y0 + b.fh + 0.5, zf + 1.27);
    bal.add(rail);
    for (let k = 0; k <= 4; k++)
      bal.add(
        box(0.05, 1.05, 0.05, cx(b) - (w - 0.4) / 2 + (k * (w - 0.4)) / 4, Y0 + b.fh, zf + 1.27, this.m.steel, {
          edges: false,
        }),
      );
    bal.add(box(w - 0.4, 0.05, 0.06, cx(b), Y0 + b.fh + 1.0, zf + 1.27, this.m.steel, { edges: false }));
    this.add(bal, 'drop', at(0.7), at(0.9), { h: 1.2 });
    // AC luar di lantai 3
    units.forEach((c, i) => {
      const ac = acUnit(this.m);
      ac.position.set(cx(b) + c + 1.6, Y0 + 2 * b.fh + 0.4, zf + 0.3);
      this.add(ac, 'pop', at(0.85 + i * 0.05), at(1));
    });
    // papan nama unit, kornis, parapet, tandon air
    const labels: [string, string, number][] = [
      ['TOKO', '#c62828', units[0]],
      ['SALON', '#1d1b1a', units[1]],
    ];
    labels.forEach(([text, bg, c], i) => {
      const s = new T.Mesh(
        new T.BoxGeometry(3.3, 0.6, 0.1),
        new T.MeshStandardMaterial({ map: signTexture(text, bg), roughness: 0.6 }),
      );
      s.position.set(cx(b) + c, Y0 + 3.55, zf + 0.12);
      s.castShadow = true;
      this.add(s, 'pop', at(0.75 + i * 0.08), at(0.95));
    });
    const top = topOf(b);
    const par = new T.Group();
    par.add(box(w + 0.3, 0.9, 0.15, cx(b), top, b.z1, this.m.struct));
    par.add(box(w + 0.3, 0.9, 0.15, cx(b), top, b.z0, this.m.struct));
    par.add(box(0.15, 0.9, b.z1 - b.z0, b.x0, top, cz(b), this.m.struct));
    par.add(box(0.15, 0.9, b.z1 - b.z0, b.x1, top, cz(b), this.m.struct));
    par.add(box(w + 0.5, 0.18, 0.45, cx(b), top + 0.9, b.z1 + 0.05, this.m.struct, { edges: false }));
    this.add(par, 'rise', at(0.7), at(0.9));
    const tank = new T.Group();
    tank.position.set(cx(b) + 1.5, top, b.z0 + 2.2);
    for (const [dx, dz] of [
      [-0.45, -0.45],
      [0.45, -0.45],
      [-0.45, 0.45],
      [0.45, 0.45],
    ])
      tank.add(box(0.07, 1.0, 0.07, dx, 0, dz, this.m.steel, { edges: false }));
    const body = new T.Mesh(
      new T.CylinderGeometry(0.7, 0.7, 1.3, 20),
      new T.MeshStandardMaterial({ color: COLORS.dark, roughness: 0.5 }),
    );
    body.position.y = 1.65;
    body.castShadow = true;
    tank.add(body);
    this.add(tank, 'pop', at(0.85), at(1));
  }

  // ---------------- KAFE ----------------
  cafe(a: number, e: number) {
    const b = CAFE;
    const at = (f: number) => lerp(a, e, f);
    const w = b.x1 - b.x0;
    const d = b.z1 - b.z0;
    const zf = b.z1;
    const top = topOf(b);
    this.sideWalls(b, ['back'], [-1.6, 1.6], 1.2, a, at(0.4));
    // etalase kaca depan dan sisi kanan, pintu geser di tengah
    const gh = b.fh - 0.45;
    const front = new T.Group();
    const pane = new T.Mesh(new T.BoxGeometry(w, gh, 0.04), glassMat());
    pane.position.set(cx(b), Y0 + gh / 2, zf + 0.02);
    front.add(pane);
    const side = new T.Mesh(new T.BoxGeometry(0.04, gh, d), glassMat());
    side.position.set(b.x1 + 0.02, Y0 + gh / 2, cz(b));
    front.add(side);
    this.add(front, 'fade', at(0.3), at(0.6));
    const mull = new T.Group();
    for (let k = 0; k <= 4; k++)
      mull.add(box(0.07, gh, 0.12, b.x0 + (k * w) / 4, Y0, zf + 0.04, this.m.dark, { edges: false }));
    for (let k = 0; k <= 5; k++)
      mull.add(box(0.12, gh, 0.07, b.x1 + 0.04, Y0, b.z0 + (k * d) / 5, this.m.dark, { edges: false }));
    mull.add(box(w, 0.07, 0.12, cx(b), Y0 + gh - 0.07, zf + 0.04, this.m.dark, { edges: false }));
    mull.add(box(w, 0.07, 0.12, cx(b), Y0, zf + 0.04, this.m.dark, { edges: false }));
    this.add(mull, 'rise', at(0.3), at(0.6));
    // atap beton menjorok ke depan di atas teras, dua tiang baja, lisplang dan papan nama
    const roof = new T.Group();
    roof.add(box(w + 0.2, 0.18, d + 2.5, cx(b), top, cz(b) + 1.25, this.m.struct));
    roof.add(box(w + 0.2, 0.4, 0.1, cx(b), top - 0.22, zf + 2.5, this.m.frame));
    roof.add(box(w + 0.2, 0.1, 0.14, cx(b), top - 0.32, zf + 2.5, this.m.wood, { edges: false }));
    for (const x of [b.x0 + 0.1, b.x1 - 0.1])
      roof.add(pipe(new T.Vector3(x, Y0, zf + 2.2), new T.Vector3(x, top, zf + 2.2), 0.07, this.m.steel));
    this.add(roof, 'drop', at(0.5), at(0.75), { h: 1.2 });
    const sign = new T.Mesh(
      new T.BoxGeometry(2.4, 0.5, 0.08),
      new T.MeshStandardMaterial({ map: signTexture('KAFE', '#c62828'), roughness: 0.6 }),
    );
    sign.position.set(cx(b), top + 0.3, zf + 2.4);
    sign.castShadow = true;
    this.add(sign, 'pop', at(0.75), at(0.9));
    // kisi kayu di dinding belakang
    const slats = new T.Group();
    for (let k = 0; k < 26; k++)
      slats.add(box(0.06, 3.5, 0.08, b.x0 + 0.3 + k * 0.2, Y0, b.z0 - 0.14, this.m.wood, { edges: false }));
    this.add(slats, 'rise', at(0.4), at(0.7));
    // teras kayu, meja, kursi, payung, pot tanaman
    this.add(box(w, 0.15, 2.8, cx(b), 0, zf + 1.4, this.m.wood), 'rise', at(0.45), at(0.7));
    const furn = new T.Group();
    const umb = [PALETTE.red, PALETTE.white, PALETTE.red, PALETTE.white];
    [
      [6.3, 1.6],
      [8.1, 1.7],
      [9.9, 1.6],
      [7.2, 3.4],
    ].forEach(([x, dz], i) => {
      const t = tableSet(this.m, umb[i]);
      t.position.set(x, 0.15, zf + dz);
      furn.add(t);
    });
    for (const x of [b.x0 + 0.3, b.x1 - 0.3]) {
      furn.add(box(0.8, 0.5, 0.4, x, 0.15, zf + 2.6, this.m.concrete, { edges: false }));
      const fol = new T.Mesh(new T.IcosahedronGeometry(0.4, 1), this.m.foliage);
      fol.position.set(x, 0.95, zf + 2.6);
      furn.add(fol);
    }
    this.add(furn, 'pop', at(0.75), at(1));
    // lampu gantung di bawah atap
    const lights = new T.Group();
    const glow = new T.MeshBasicMaterial({ color: 0xffe2a8 });
    for (let k = 0; k < 9; k++) {
      const s = new T.Mesh(new T.SphereGeometry(0.07, 8, 8), glow);
      s.position.set(b.x0 + 0.3 + (k * (w - 0.6)) / 8, top - 0.55 - Math.sin((k / 8) * Math.PI) * -0.05, zf + 2.2);
      lights.add(s);
    }
    this.add(lights, 'pop', at(0.85), at(1));
    // cerobong dapur dan AC di atap
    const duct = new T.Group();
    duct.position.set(b.x0 + 1.4, top + 0.18, b.z0 + 1.3);
    duct.add(pipe(new T.Vector3(0, 0, 0), new T.Vector3(0, 1.4, 0), 0.28, this.m.steel));
    const hood = new T.Mesh(new T.ConeGeometry(0.5, 0.3, 14), this.m.steel);
    hood.position.y = 1.55;
    duct.add(hood);
    for (const dx of [1.8, 2.8]) {
      const ac = acUnit(this.m);
      ac.position.set(dx, 0, 0.6);
      duct.add(ac);
    }
    this.add(duct, 'pop', at(0.8), at(1));
  }

  /** Trotoar, area parkir beraspal dengan marka, mobil, pohon, dan lampu jalan. */
  street(a: number, e: number) {
    const at = (f: number) => lerp(a, e, f);
    const walk = box(15.7, 0.12, 2.1, -2.65, 0, 5.3, this.m.concrete, { pivot: 'base' });
    walk.position.x = -2.65;
    this.add(walk, 'rise', at(0), at(0.3));
    const asphalt = box(
      24.5,
      0.05,
      5.3,
      0.25,
      0,
      8.2,
      new T.MeshStandardMaterial({ color: 0x4a4a4c, roughness: 0.95 }),
      { pivot: 'back', edges: false, cast: false },
    );
    asphalt.userData.noFit = true;
    asphalt.position.set(0.25, 0, 8.2);
    this.add(asphalt, 'rise', at(0.05), at(0.35));
    const lines = new T.Group();
    for (let k = 0; k < 9; k++)
      lines.add(
        box(0.1, 0.01, 3.9, -9.5 + k * 2.9, 0.05, 8.5, this.m.paper, { pivot: 'back', edges: false, cast: false }),
      );
    lines.userData.noFit = true;
    this.add(lines, 'rise', at(0.3), at(0.5));
  }

  /** Mobil, pohon, dan lampu jalan (muncul paling akhir). */
  streetProps(a: number, e: number) {
    const at = (f: number) => lerp(a, e, f);
    const cars = [
      { x: -8.0, c: PALETTE.white },
      { x: -2.2, c: PALETTE.black },
      { x: 3.6, c: PALETTE.red },
    ];
    cars.forEach(({ x, c }, i) => {
      const cr = car(c);
      cr.rotation.y = Math.PI / 2;
      cr.position.set(x, 0.05, 10.2);
      this.add(cr, 'drop', at(i * 0.15), at(0.45 + i * 0.15), { h: 0.8 });
    });
    for (const [x, s] of [
      [-10.8, 1],
      [-2.4, 0.9],
      [11.8, 1.1],
    ]) {
      const t = tree(this.m, s);
      t.position.set(x, 0, 6.9);
      this.add(t, 'pop', at(0.3), at(0.7));
    }
    for (const x of [-3.0, 5.15]) {
      const l = lamp(this.m, 6);
      l.position.set(x, 0, 7.3);
      this.add(l, 'rise', at(0.5), at(0.9));
    }
  }

  /** Tower crane, perancah gedung kantor, truk ready mix, dan para pekerja selama konstruksi. */
  construction() {
    this.layer = 'temp';
    const crane = D.towerCrane(this.m, 17.6, 10.4);
    crane.position.set(-11.2, 0, -3.6);
    // crane muncul dan hilang utuh (bukan menyusut ke tanah)
    const craneHold = new T.Group();
    craneHold.add(crane);
    this.add(craneHold, 'seq', 0.35, 0.4, { out: [4.85, 4.9] });
    const jib = crane.userData.jib as T.Object3D;
    this.tickers.push((time) => (jib.rotation.y = Math.sin(time * 0.28) * 0.28 - 0.06));
    // perancah bertingkat di sisi kiri gedung kantor
    const scaffold = new T.Group();
    for (let k = 0; k < 5; k++) {
      const lift = D.scaffoldFace([-10.05, -4.6], [-10.05, 4.6], [-1, 0], this.m, 2.75);
      lift.position.y = k * 2.75;
      scaffold.add(lift);
    }
    this.add(scaffold, 'rise', 1.5, 3.0, { out: [4.4, 4.75] });
    const truck = D.mixerTruck(this.m);
    truck.position.set(7.2, 0.05, 10.3);
    truck.rotation.y = Math.PI;
    this.add(truck, 'pop', 0.45, 0.8, { out: [3.2, 3.5] });
    const drum = truck.userData.drum as T.Object3D;
    this.tickers.push((time) => (drum.rotation.y = time * 1.6));
    const rand = D.seeded(91);
    for (const [x, z, f] of [
      [2.4, 7.4, 0.5],
      [3.5, 7.4, 0.6],
    ]) {
      const st = D.brickStack(rand);
      st.position.set(x, 0.1, z);
      this.add(st, 'pop', f + 0.4, f + 0.7, { out: [4.2, 4.5] });
    }
    const sand = D.sandPile();
    sand.position.set(0.9, 0.1, 7.5);
    this.add(sand, 'pop', 0.8, 1.1, { out: [4.2, 4.5] });
    const WHITE = 0xf4f2ec;
    this.worker(0.5, 1.9, [-7.6, 0.45, 3.2], 0.4, { pose: 'crouch' });
    this.worker(0.7, 1.9, [1.2, 0.45, 2.4], -0.8, { pose: 'crouch', vest: 0xc6d63a });
    this.worker(0.6, 4.4, [5.6, 0.12, 7.6], -2.4, { helmet: WHITE, pose: 'hold' });
    this.worker(1.9, 2.5, [-6.2, 4.05, 3.8], 0.2, { pose: 'reach' });
    this.worker(2.3, 3.0, [-5.0, 11.25, 3.9], -0.3, { pose: 'hold', vest: 0xc6d63a });
    this.worker(2.2, 3.1, [2.8, 7.65, 3.9], 0.5, { pose: 'crouch' });
    this.worker(2.9, 4.4, [-1.6, 0.12, 6.4], Math.PI, { pose: 'reach' });
    this.worker(3.1, 4.4, [8.2, 0.15, 6.6], Math.PI, { pose: 'reach', vest: 0xc6d63a });
  }

  buildShop() {
    this.construction();
    this.plot(0, 0.4);
    this.street(0.2, 1.0);
    this.frame(OFFICE, 0.4, 2.6);
    this.frame(RUKO, 0.55, 2.45);
    this.frame(CAFE, 0.7, 1.8);
    this.office(2.5, 4.6);
    this.ruko(2.4, 4.4);
    this.cafe(2.0, 4.2);
    this.plaster = [4.9, 5.7];
    this.streetProps(5.0, 6.0);
    this.group.position.set(-0.3, 0, -3.3);
  }
}
