/**
 * Kalkulator 3D untuk bagian "Hitung biaya": badan gelap dengan tepi merah membulat, layar terang, dan tombol timbul.
 * Tombolnya "mengetik" sendiri hal yang ditanyakan kalkulator situs (luas bangunan, jumlah lantai), lalu layar berhenti
 * di "Rp ?" untuk mengundang pengunjung mencoba. Sengaja tanpa angka biaya.
 * Tidak berputar penuh supaya layarnya selalu terbaca; badannya miring halus mengikuti kursor.
 */
import {
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  SRGBColorSpace,
  type Material,
} from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { clamp01, type Kit, type Model, type Motion } from './stage';

const FONT = '"Inter Tight Variable", "Inter Tight", system-ui, sans-serif';

type Tone = 'digit' | 'util' | 'op' | 'equals';
const KEYS: [string, Tone][][] = [
  [
    ['C', 'util'],
    ['±', 'util'],
    ['%', 'util'],
    ['÷', 'op'],
  ],
  [
    ['7', 'digit'],
    ['8', 'digit'],
    ['9', 'digit'],
    ['×', 'op'],
  ],
  [
    ['4', 'digit'],
    ['5', 'digit'],
    ['6', 'digit'],
    ['−', 'op'],
  ],
  [
    ['1', 'digit'],
    ['2', 'digit'],
    ['3', 'digit'],
    ['+', 'op'],
  ],
  [
    ['0', 'digit'],
    ['.', 'digit'],
    ['m²', 'util'],
    ['=', 'equals'],
  ],
];

export interface ScreenText {
  area: string;
  floors: string;
  cost: string;
}

/** Urutan ketikan: [detik, tombol, isi layar sesudahnya]. Satu putaran 10 detik. */
const LOOP = 10;
const SCRIPT: [number, string, keyof ScreenText, string][] = [
  [0, '', 'area', '0'],
  [1.1, '7', 'area', '7'],
  [1.65, '2', 'area', '72'],
  [2.4, 'm²', 'area', '72 m²'],
  [3.4, '×', 'floors', '×'],
  [4.1, '2', 'floors', '2'],
  [5.1, '=', 'cost', 'Rp ?'],
  [9.5, 'C', 'area', '0'],
];
const PRESS = 0.3; // lama satu tekanan tombol (detik)

function rounded(w: number, h: number, r: number) {
  const s = new Shape();
  const x = w / 2;
  const y = h / 2;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y);
  s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r);
  s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y);
  s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r);
  s.quadraticCurveTo(-x, -y, -x + r, -y);
  s.closePath();
  return s;
}

export function calculatorModel({ keep, own, paint, host }: Kit): Model {
  let text: ScreenText = { area: '', floors: '', cost: '' };
  try {
    text = { ...text, ...(JSON.parse(host.dataset.screen ?? '{}') as Partial<ScreenText>) };
  } catch {
    /* tanpa teks: layar hanya menampilkan angka */
  }

  const graphite = paint('#262322', { roughness: 0.4, metalness: 0.15 });
  const edge = paint('#d80d22', { roughness: 0.3, metalness: 0.2 });
  const bezel = paint('#0f0e0e', { roughness: 0.18, metalness: 0.3 });
  const tones: Record<Tone, [Material, string]> = {
    digit: [paint('#f4f1ea', { roughness: 0.34 }), '#1c1a19'],
    util: [paint('#bdb8af', { roughness: 0.36, metalness: 0.15 }), '#1c1a19'],
    op: [paint('#524d4a', { roughness: 0.36, metalness: 0.2 }), '#ffffff'],
    equals: [paint('#e50f26', { roughness: 0.3 }), '#ffffff'],
  };

  /** Lempengan bersudut dan bertepi membulat, tebal total `depth + 2 * bevel`, berpusat di z = 0. */
  const slab = (w: number, h: number, r: number, depth: number, bevel: number) => {
    const g = new ExtrudeGeometry(rounded(w, h, r), {
      depth,
      bevelThickness: bevel,
      bevelSize: bevel * 0.9,
      bevelOffset: -bevel * 0.9,
      bevelSegments: 8,
      curveSegments: 20,
    });
    g.translate(0, 0, -depth / 2);
    return keep(toCreasedNormals(g, Math.PI / 5));
  };
  const textures: CanvasTexture[] = [];
  /** Gambar datar (label tombol, isi layar) yang tidak terpengaruh cahaya supaya tetap tajam. */
  const decal = (cw: number, ch: number, w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    textures.push(texture);
    const material = own(new MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }));
    material.addEventListener('dispose', () => texture.dispose());
    return { mesh: new Mesh(keep(new PlaneGeometry(w, h)), material), ctx: canvas.getContext('2d'), texture, cw, ch };
  };

  const all = new Group();
  const tilt = new Group();
  tilt.rotation.z = 0.07;
  all.add(tilt);

  // badan: muka gelap, tepi merah
  tilt.add(new Mesh(slab(68, 102, 12, 7, 3.6), [graphite, edge]));
  const FACE = 7.1;

  // layar
  const frame = new Mesh(slab(58, 27, 5, 0.8, 0.7), bezel);
  frame.position.set(0, 31.5, FACE + 0.4);
  tilt.add(frame);
  const screen = decal(768, 336, 54, 23.6);
  screen.mesh.position.set(0, 31.5, FACE + 1.62);
  tilt.add(screen.mesh);

  let shownKey = '';
  const drawScreen = (label: string, value: string, hot: boolean, caret: boolean) => {
    const id = `${label}|${value}|${caret}`;
    const c = screen.ctx;
    if (!c || id === shownKey) return;
    shownKey = id;
    c.clearRect(0, 0, screen.cw, screen.ch);
    c.fillStyle = '#f7f6f3';
    c.beginPath();
    c.roundRect(0, 0, screen.cw, screen.ch, 44);
    c.fill();
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#5d5954';
    c.font = `600 66px ${FONT}`;
    c.textAlign = 'left';
    c.fillText(label, 44, 102, screen.cw - 88);
    c.fillStyle = hot ? '#d80d22' : '#161514';
    c.font = `${hot ? 700 : 600} 150px ${FONT}`;
    c.textAlign = 'right';
    c.fillText(value, screen.cw - 54, 272, screen.cw - 100);
    if (caret) {
      c.fillStyle = '#d80d22';
      c.fillRect(screen.cw - 40, 156, 10, 124);
    }
    screen.texture.needsUpdate = true;
  };

  // tombol
  const keys = new Map<string, Group>();
  const keyGeo = slab(12.2, 9.6, 3, 2, 1.4);
  const REST_Z = FACE + 1.9;
  const faces: (() => void)[] = [];
  KEYS.forEach((row, r) =>
    row.forEach(([label, tone], i) => {
      const [material, ink] = tones[tone];
      const g = new Group();
      g.position.set((i - 1.5) * 14.2, 10 - r * 12.1, REST_Z);
      g.add(new Mesh(keyGeo, material));
      const face = decal(160, 126, 11, 8.7);
      face.mesh.position.z = 2.48;
      g.add(face.mesh);
      faces.push(() => {
        const c = face.ctx;
        if (!c) return;
        c.clearRect(0, 0, face.cw, face.ch);
        c.fillStyle = ink;
        c.font = `600 ${label.length > 1 ? 58 : 72}px ${FONT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(label, face.cw / 2, face.ch / 2 + 4);
        face.texture.needsUpdate = true;
      });
      keys.set(label, g);
      tilt.add(g);
    }),
  );
  const paintText = () => {
    for (const draw of faces) draw();
    shownKey = '';
  };
  paintText();
  drawScreen(text.area, '0', false, true);
  // digambar ulang setelah font situs siap, supaya bentuk hurufnya sama
  void document.fonts?.load(`600 100px ${FONT}`).then(paintText, () => {});

  all.scale.setScalar(1 / 52);

  const show = (t: number, blink: boolean) => {
    let step = 0;
    for (let i = 0; i < SCRIPT.length; i++) if (t >= SCRIPT[i][0]) step = i;
    const [, , label, value] = SCRIPT[step];
    const done = label === 'cost';
    drawScreen(text[label], value, done, !done && blink);
    for (const [name, g] of keys) {
      let down = 0;
      for (const [at, pressed] of SCRIPT) {
        if (pressed !== name) continue;
        const d = (t - at + PRESS / 2) / PRESS;
        if (d > 0 && d < 1) down = Math.max(down, Math.sin(d * Math.PI));
      }
      g.position.z = REST_Z - down * 2.5;
    }
  };

  return {
    object: all,
    pose({ clock, since, sway, look }: Motion) {
      show(since < 1.2 ? 0 : (since - 1.2) % LOOP, Math.floor(clock * 2) % 2 === 0);
      const settle = Math.pow(1 - clamp01(since / 1.4), 3); // masuk: berputar sedikit lalu mengendap
      return {
        yaw: -0.36 - settle * 1.5 + sway * 0.13 * Math.sin(clock * 0.65) + look.x * 0.3,
        pitch: -0.16 + sway * 0.035 * Math.sin(clock * 0.9) + look.y * 0.16,
        bob: Math.sin(clock * 1.35) * 0.035,
      };
    },
    rest() {
      show(6, false);
      return { yaw: -0.36, pitch: -0.16, bob: 0 };
    },
  };
}
