/**
 * Perlengkapan kecil untuk skena 3D: mobil, pohon, tiang lampu, set meja kafe dengan payung, unit AC, label ukuran.
 * Semua dalam meter dan berpusat di dasar (y = 0) kecuali disebut lain.
 */
import * as T from 'three';
import { box, COLORS, pipe, type Mats } from './kit';

const std = (color: number, o: Partial<T.MeshStandardMaterialParameters> = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.8, ...o });

/** Mobil sedan sederhana, panjang 4,3 m sepanjang sumbu x. */
export function car(color: number) {
  const g = new T.Group();
  const body = std(color, { roughness: 0.45, metalness: 0.35 });
  const glass = std(0x2d3a45, { roughness: 0.2, metalness: 0.3 });
  const dark = std(0x1b1b1b);
  g.add(box(4.3, 0.55, 1.8, 0, 0.32, 0, body, { edges: false }));
  g.add(box(2.3, 0.55, 1.6, -0.2, 0.87, 0, glass, { edges: false }));
  g.add(box(2.1, 0.06, 1.5, -0.2, 1.42, 0, body, { edges: false }));
  for (const [x, z] of [
    [1.35, 0.9],
    [-1.35, 0.9],
    [1.35, -0.9],
    [-1.35, -0.9],
  ]) {
    const w = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.22, 16), dark);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.33, z);
    w.castShadow = true;
    g.add(w);
  }
  g.add(
    box(0.05, 0.12, 1.4, 2.16, 0.55, 0, std(0xfff1c9, { emissive: 0xfff1c9, emissiveIntensity: 0.5 }), {
      edges: false,
    }),
  );
  return g;
}

export function tree(mats: Mats, s = 1) {
  const g = new T.Group();
  g.add(box(0.26 * s, 2.0 * s, 0.26 * s, 0, 0, 0, mats.trunk, { edges: false }));
  const f1 = new T.Mesh(new T.IcosahedronGeometry(1.2 * s, 1), mats.foliage);
  f1.position.y = 2.9 * s;
  f1.castShadow = true;
  const f2 = new T.Mesh(new T.IcosahedronGeometry(0.85 * s, 1), mats.foliage);
  f2.position.set(0.65 * s, 2.35 * s, 0.4 * s);
  f2.castShadow = true;
  g.add(f1, f2);
  return g;
}

/** Tiang lampu jalan dengan lengan dan kepala lampu menyala. */
export function lamp(mats: Mats, h = 6) {
  const g = new T.Group();
  g.add(pipe(new T.Vector3(0, 0, 0), new T.Vector3(0, h, 0), 0.06, mats.steel));
  g.add(pipe(new T.Vector3(0, h, 0), new T.Vector3(0, h + 0.1, -1.1), 0.045, mats.steel));
  g.add(
    box(0.5, 0.1, 0.22, 0, h + 0.02, -1.15, std(0xfff1c9, { emissive: 0xfff1c9, emissiveIntensity: 0.7 }), {
      edges: false,
    }),
  );
  g.add(box(0.3, 0.06, 0.3, 0, 0, 0, mats.concrete, { edges: false }));
  return g;
}

/** Meja bundar, dua kursi, dan payung. */
export function tableSet(mats: Mats, umbrella: number) {
  const g = new T.Group();
  const top = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.04, 20), mats.paper);
  top.position.y = 0.75;
  top.castShadow = true;
  g.add(top);
  g.add(pipe(new T.Vector3(0, 0, 0), new T.Vector3(0, 0.75, 0), 0.025, mats.steel));
  for (const sgn of [-1, 1]) {
    g.add(box(0.4, 0.04, 0.4, sgn * 0.7, 0.44, 0, mats.wood, { edges: false }));
    g.add(box(0.4, 0.4, 0.04, sgn * 0.7 + sgn * 0.18, 0.46, 0, mats.wood, { edges: false }));
    g.add(box(0.04, 0.44, 0.04, sgn * 0.7, 0, 0.16, mats.steel, { edges: false }));
    g.add(box(0.04, 0.44, 0.04, sgn * 0.7, 0, -0.16, mats.steel, { edges: false }));
  }
  g.add(pipe(new T.Vector3(0, 0, 0), new T.Vector3(0, 2.3, 0), 0.02, mats.steel));
  const cone = new T.Mesh(new T.ConeGeometry(0.85, 0.34, 14), std(umbrella, { roughness: 0.9 }));
  cone.position.y = 2.42;
  cone.castShadow = true;
  g.add(cone);
  return g;
}

/** Unit AC luar (outdoor) pada braket, menghadap +z. */
export function acUnit(mats: Mats) {
  const g = new T.Group();
  g.add(box(0.85, 0.6, 0.35, 0, 0, 0, mats.paper, { edges: false }));
  const fan = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.02, 16), std(0x333333));
  fan.rotation.x = Math.PI / 2;
  fan.position.set(0, 0.3, 0.18);
  g.add(fan);
  g.add(box(0.9, 0.03, 0.4, 0, -0.03, 0, mats.steel, { edges: false }));
  return g;
}

/** Label ukuran (sprite) yang selalu menghadap kamera. */
export function dimLabel(text: string) {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 80;
  const c = cv.getContext('2d');
  if (c) {
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.fillRect(0, 0, 256, 80);
    c.strokeStyle = '#c62828';
    c.lineWidth = 3;
    c.strokeRect(1.5, 1.5, 253, 77);
    c.fillStyle = '#1d1b1a';
    c.font = '600 40px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 128, 42);
  }
  const tex = new T.CanvasTexture(cv);
  tex.colorSpace = T.SRGBColorSpace;
  const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(2.0, 0.62, 1);
  sp.renderOrder = 10;
  return sp;
}

export const PALETTE = { white: 0xe9e7e2, black: 0x2a2a2a, red: COLORS.red };
