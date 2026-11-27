/**
 * Perisai legalitas: satu benda padat dengan tepi membulat, bingkai timbul, dan centang berbentuk batang yang melayang
 * di depan (di sisi belakang juga ada, supaya utuh dilihat dari mana saja). Gerak diatur stage.ts.
 */
import {
  CatmullRomCurve3,
  Color,
  Curve,
  CurvePath,
  ExtrudeGeometry,
  Group,
  LineCurve3,
  Mesh,
  MeshBasicMaterial,
  QuadraticBezierCurve3,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { clamp01, ease, type Kit, type Model } from './stage';

const FRONT = 8; // permukaan depan (satuan gambar; tebal total 16)
const LIFT = FRONT + 3.7; // pusat batang centang
const FLAT = 0.58; // penampang centang dipipihkan

/** Garis luar perisai, berpusat di (0,0), tinggi 104 satuan; ketiga sudut atas sedikit membulat. */
function outline(scale = 1): Shape {
  const s = new Shape();
  const p = (x: number, y: number) => [x * scale, y * scale] as const;
  s.moveTo(...p(-5, 49.9));
  s.quadraticCurveTo(...p(0, 52), ...p(5, 49.9));
  s.lineTo(...p(37.5, 37.8));
  s.quadraticCurveTo(...p(42, 36), ...p(42, 31));
  s.lineTo(...p(42, 4));
  s.bezierCurveTo(...p(42, -24), ...p(24, -42), ...p(0, -52));
  s.bezierCurveTo(...p(-24, -42), ...p(-42, -24), ...p(-42, 4));
  s.lineTo(...p(-42, 31));
  s.quadraticCurveTo(...p(-42, 36), ...p(-37.5, 37.8));
  s.closePath();
  return s;
}

/** Jalur centang dengan siku membulat. */
function checkPath(): Curve<Vector3> {
  const v = (x: number, y: number) => new Vector3(x, y, 0);
  const path = new CurvePath<Vector3>();
  path.add(new LineCurve3(v(-19, 1), v(-9.5, -8.5)));
  path.add(new QuadraticBezierCurve3(v(-9.5, -8.5), v(-6, -12), v(-2.5, -8.5)));
  path.add(new LineCurve3(v(-2.5, -8.5), v(20, 15)));
  return path;
}

export function shieldModel({ keep, paint, own }: Kit): Model {
  const face = paint('#e50f26', { roughness: 0.34 });
  const side = paint('#a80a1b', { roughness: 0.3, metalness: 0.2 });
  const trim = paint('#ff8d95', { roughness: 0.26, metalness: 0.35 });
  const white = paint('#ffffff', { roughness: 0.3, metalness: 0 });
  white.emissive = new Color('#ffffff');
  white.emissiveIntensity = 0.12;
  const shade = own(new MeshBasicMaterial({ color: '#4a0008', transparent: true, opacity: 0.3, depthWrite: false }));

  const shield = new Group(); // satuan gambar → 52 satuan = 1
  shield.scale.setScalar(1 / 52);

  // badan: bevel membulat; ukuran luar tetap sama dengan garis luar
  const body = keep(
    new ExtrudeGeometry(outline(), {
      depth: 7,
      bevelThickness: 4.5,
      bevelSize: 4,
      bevelOffset: -4,
      bevelSegments: 10,
      curveSegments: 48,
    }),
  );
  body.translate(0, 0, -3.5);
  shield.add(new Mesh(toCreasedNormals(body, Math.PI / 5), [face, side]));

  // bingkai timbul di depan dan belakang
  const rimPoints = outline(0.8)
    .getSpacedPoints(180)
    .slice(0, -1)
    .map((p) => new Vector3(p.x, p.y, 0));
  const rim = keep(new TubeGeometry(new CatmullRomCurve3(rimPoints, true, 'centripetal'), 360, 1.15, 12, true));
  for (const z of [FRONT, -FRONT]) {
    const m = new Mesh(rim, trim);
    m.position.z = z;
    shield.add(m);
  }

  // centang: batang bulat yang melayang, dengan bayangan di permukaan perisai
  const path = checkPath();
  const SEG = 140;
  const RAD = 16;
  const R = 5;
  const tube = keep(new TubeGeometry(path, SEG, R, RAD, false));
  const cap = keep(new SphereGeometry(R, 24, 18));
  const flat = new Shape();
  {
    // bayangan: pita datar mengikuti jalur yang sama
    const pts = path.getSpacedPoints(90);
    const edge = (dir: number) =>
      pts.map((p, i) => {
        const t = path.getTangentAt(i / (pts.length - 1));
        return [p.x - t.y * R * dir, p.y + t.x * R * dir] as const;
      });
    const loop = [...edge(1), ...edge(-1).reverse()];
    flat.moveTo(...loop[0]);
    for (const p of loop.slice(1)) flat.lineTo(...p);
  }
  const shadowGeo = keep(new ShapeGeometry(flat));

  const ticks = [1, -1].map((dir) => {
    const g = new Group();
    // sisi belakang diputar setengah lingkaran supaya centangnya terbaca benar dari belakang
    g.rotation.y = dir > 0 ? 0 : Math.PI;
    const line = new Mesh(tube, white);
    const head = new Mesh(cap, white);
    const tail = new Mesh(cap, white);
    for (const m of [line, head, tail]) {
      m.position.z = LIFT;
      m.scale.z = FLAT;
    }
    const drop = new Mesh(shadowGeo, shade);
    drop.position.set(2.2, -3.4, FRONT + 0.15);
    g.add(drop, line, head, tail);
    shield.add(g);
    return { g, line, head, tail, drop };
  });

  const draw = (p: number) => {
    const n = Math.round(clamp01(p) * SEG);
    tube.setDrawRange(0, n * RAD * 6);
    const at = path.getPointAt(n / SEG);
    const start = path.getPointAt(0);
    for (const t of ticks) {
      t.line.visible = t.head.visible = t.tail.visible = n > 0;
      t.head.position.set(at.x, at.y, LIFT);
      t.tail.position.set(start.x, start.y, LIFT);
    }
    shade.opacity = 0.3 * clamp01((p - 0.55) / 0.45);
  };

  draw(1);

  return {
    object: shield,
    pose({ clock, since, spin, sway }) {
      draw(ease(clamp01((since - 0.95) / 0.6)));
      return {
        yaw: spin - 0.2 + sway * 0.36 * Math.sin(clock * 1.05),
        pitch: 0.07 + sway * 0.05 * Math.sin(clock * 0.8),
        bob: Math.sin(clock * 1.6) * 0.035,
      };
    },
    rest() {
      draw(1);
      return { yaw: -0.42, pitch: 0.07, bob: 0 };
    },
  };
}
