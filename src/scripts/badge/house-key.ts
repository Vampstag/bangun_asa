/**
 * Kunci rumah dengan gantungan: cincin logam, anak kunci (kepala bulat beraksen merah dan bilah bergerigi), serta
 * gantungan berbentuk rumah merah. Gambaran serah terima: saat rumah itu menjadi milik klien.
 *
 * Gerak: kunci dan gantungan berayun seperti bandul (posisi dan kecepatan dihitung terus, jadi dorongan kursor hanya
 * menambah kecepatan, tidak pernah memindahkan posisi). Disorot, anak kunci berputar pada porosnya sendiri memakai
 * fisika putaran yang sama dengan perisai (stage.ts).
 */
import {
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  Path,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Kit, Model, Motion } from './stage';

const KEY_REST = 0.36; // sudut diam anak kunci (rad), miring ke kanan
const TAG_REST = -0.6; // gantungan miring ke kiri
const DROP = 8; // tambahan panjang rantai

/** Bandul teredam: mengayun menuju sudut diamnya. */
function pendulum(rest: number, stiffness: number, damping: number, start: number) {
  let angle = start;
  let speed = 0;
  return {
    kick(v: number) {
      speed += v;
    },
    step(dt: number, drive: number) {
      // ayunan dibatasi dengan lembut: makin jauh dari diam, makin kuat ditarik kembali
      const off = angle - rest;
      speed += (-stiffness * off - 60 * off * off * off - damping * speed + drive) * dt;
      angle += speed * dt;
      return angle;
    },
  };
}

export function houseKeyModel({ keep, paint }: Kit): Model {
  const silver = paint('#dfe3e8', { metalness: 1, roughness: 0.24, clearcoat: 0.6 });
  const steel = paint('#aeb4bc', { metalness: 1, roughness: 0.34, clearcoat: 0.4 });
  const red = paint('#e50f26', { roughness: 0.32 });
  const redSide = paint('#a80a1b', { roughness: 0.3, metalness: 0.2 });
  const trim = paint('#ff8d95', { roughness: 0.26, metalness: 0.35 });
  const white = paint('#ffffff', { roughness: 0.3, metalness: 0 });
  white.emissive = new Color('#ffffff');
  white.emissiveIntensity = 0.12;

  const mesh = (g: ConstructorParameters<typeof Mesh>[0], m: ConstructorParameters<typeof Mesh>[1], to: Group) => {
    const o = new Mesh(g, m);
    to.add(o);
    return o;
  };
  /** Lempengan bertepi membulat setebal `depth + 2 * bevel`, berpusat di z = 0. */
  const slab = (shape: Shape, depth: number, bevel: number) => {
    const g = new ExtrudeGeometry(shape, {
      depth,
      bevelThickness: bevel,
      bevelSize: bevel * 0.85,
      bevelOffset: -bevel * 0.85,
      bevelSegments: 8,
      curveSegments: 40,
    });
    g.translate(0, 0, -depth / 2);
    return keep(toCreasedNormals(g, Math.PI / 5));
  };

  const all = new Group();
  const inner = new Group(); // digeser supaya seluruh rangkaian berada di tengah bingkai
  all.add(inner);

  // cincin gantungan; titik gantungnya di dasar cincin
  const ring = mesh(keep(new TorusGeometry(13.5, 2.3, 20, 72)), silver, inner);
  ring.position.set(0, 13.5, 0);
  ring.rotation.y = 0.32;

  /* ---------- anak kunci ---------- */
  const keySwing = new Group();
  keySwing.position.z = 3.2;
  inner.add(keySwing);
  const keySpin = new Group(); // berputar pada poros bilahnya sendiri
  keySwing.add(keySpin);

  const bow = new Shape();
  bow.absarc(0, -11, 16, 0, Math.PI * 2, false);
  const eye = new Path();
  eye.absarc(0, -0.5, 4.2, 0, Math.PI * 2, true);
  bow.holes.push(eye);
  mesh(slab(bow, 3, 2.2), silver, keySpin);
  // aksen merah di kedua sisi kepala kunci
  const dot = keep(new CylinderGeometry(7.2, 7.2, 1.4, 48));
  const halo = keep(new TorusGeometry(7.4, 0.9, 12, 56));
  for (const z of [3.4, -3.4]) {
    const d = mesh(dot, red, keySpin);
    d.rotation.x = Math.PI / 2;
    d.position.set(0, -14.5, z);
    const h = mesh(halo, trim, keySpin);
    h.position.set(0, -14.5, z + Math.sign(z) * 0.5);
  }
  // leher
  const collar = mesh(keep(new CylinderGeometry(7.4, 7.4, 4.6, 40)), steel, keySpin);
  collar.scale.z = 0.5;
  collar.position.y = -28.5;
  // bilah bergerigi
  const blade = new Shape();
  blade.moveTo(-4.4, -29);
  blade.lineTo(4.4, -29);
  for (const [x, y] of [
    [4.4, -36],
    [9.4, -39.5],
    [9.4, -42.5],
    [5.4, -45],
    [8.6, -48],
    [8.6, -50.5],
    [4.8, -53],
    [10, -56.5],
    [10, -59],
    [4.4, -62],
    [4.4, -65],
    [0, -70],
    [-4.4, -65],
  ])
    blade.lineTo(x, y);
  blade.closePath();
  mesh(slab(blade, 2.2, 1.1), silver, keySpin);
  // alur di tengah bilah
  const groove = keep(new CylinderGeometry(0.95, 0.95, 32, 14));
  for (const z of [2.25, -2.25]) {
    const g = mesh(groove, steel, keySpin);
    g.scale.z = 0.45;
    g.position.set(-1.1, -47, z);
  }

  /* ---------- gantungan berbentuk rumah ---------- */
  const tagSwing = new Group();
  tagSwing.position.z = -3.6;
  inner.add(tagSwing);
  // tiga mata rantai berselang-seling
  const link = keep(new TorusGeometry(4.4, 1.15, 14, 40));
  [-2.5, -10.5, -18.5].forEach((y, i) => {
    const l = mesh(link, silver, tagSwing);
    l.position.y = y;
    l.scale.y = 1.25;
    if (i % 2) l.rotation.y = Math.PI / 2.4;
  });
  const home = new Group(); // rumahnya, digantung di ujung rantai
  home.position.y = -DROP;
  tagSwing.add(home);

  const house = (scale: number) => {
    const s = new Shape();
    const p = (x: number, y: number) => [x * scale, -37 + (y + 37) * scale] as const;
    s.moveTo(...p(-3, -15.6));
    s.quadraticCurveTo(...p(0, -13), ...p(3, -15.6));
    s.lineTo(...p(18.2, -28.8));
    s.quadraticCurveTo(...p(20.5, -30.8), ...p(17.5, -31.6));
    s.lineTo(...p(15.5, -32));
    s.lineTo(...p(15.5, -56));
    s.quadraticCurveTo(...p(15.5, -60), ...p(11.5, -60));
    s.lineTo(...p(-11.5, -60));
    s.quadraticCurveTo(...p(-15.5, -60), ...p(-15.5, -56));
    s.lineTo(...p(-15.5, -32));
    s.lineTo(...p(-17.5, -31.6));
    s.quadraticCurveTo(...p(-20.5, -30.8), ...p(-18.2, -28.8));
    s.closePath();
    return s;
  };
  const tagBody = house(1);
  const hole = new Path();
  hole.absarc(0, -19.6, 2.1, 0, Math.PI * 2, true);
  tagBody.holes.push(hole);
  const body = new Mesh(slab(tagBody, 3.4, 2.6), [red, redSide]);
  home.add(body);
  const points = house(0.77)
    .getSpacedPoints(140)
    .slice(0, -1)
    .map((p) => new Vector3(p.x, p.y, 0));
  const rim = keep(new TubeGeometry(new CatmullRomCurve3(points, true, 'centripetal'), 280, 0.75, 10, true));
  // pintu melengkung dan jendela bulat, putih, di kedua sisi
  const door = new Shape();
  door.moveTo(-5.2, -56);
  door.lineTo(-5.2, -46);
  door.absarc(0, -46, 5.2, Math.PI, 0, true);
  door.lineTo(5.2, -56);
  door.closePath();
  const doorGeo = slab(door, 0.6, 0.8);
  const windowGeo = keep(new TorusGeometry(3, 1.05, 12, 40));
  for (const z of [4.35, -4.35]) {
    const r = mesh(rim, trim, home);
    r.position.z = z;
    mesh(doorGeo, white, home).position.z = z + Math.sign(z) * 0.7;
    mesh(windowGeo, white, home).position.set(0, -33, z + Math.sign(z) * 0.5);
  }

  inner.position.y = 18; // pusat rangkaian (cincin sampai ujung bilah) di titik nol
  all.scale.setScalar(1 / 52);

  // diayun masuk: mulai dari sudut yang lebih lebar, lalu mengendap sendiri
  const keyBob = pendulum(KEY_REST, 26, 1.5, KEY_REST + 0.55);
  const tagBob = pendulum(TAG_REST, 19, 1.3, TAG_REST - 0.5);
  const place = (k: number, t: number, turn: number) => {
    keySwing.rotation.z = k;
    tagSwing.rotation.z = t;
    keySpin.rotation.y = turn;
  };
  place(KEY_REST, TAG_REST, 0);

  return {
    object: all,
    pose({ dt, clock, spin, sway, nudge, push }: Motion) {
      if (nudge) {
        keyBob.kick(1.5);
        tagBob.kick(-1.9);
      }
      const drive = Math.max(-14, Math.min(14, push * 0.02));
      // dorongan kecil terus-menerus supaya tidak pernah benar-benar mati
      const k = keyBob.step(dt, sway * 1.5 * Math.sin(clock * 2.05) + drive * 0.7);
      const t = tagBob.step(dt, sway * 1.7 * Math.sin(clock * 1.7 + 1.9) + drive);
      place(k, t, spin);
      return {
        yaw: -0.18 + sway * 0.26 * Math.sin(clock * 0.75),
        pitch: 0.05,
        bob: Math.sin(clock * 1.6) * 0.025,
      };
    },
    rest() {
      place(KEY_REST, TAG_REST, -0.35);
      return { yaw: -0.3, pitch: 0.05, bob: 0 };
    },
  };
}
