/**
 * Tampilan lapisan model proses, seperti penampil gambar teknik: "Struktur" (pondasi, besi, kolom tembus pandang, rangka
 * atap), "Instalasi" (pipa air bersih, air kotor, listrik; bangunan jadi bayangan), dan "Denah 3D" (dipotong setinggi
 * ±1,1 m sehingga ruangan, keramik, dan perabot terlihat). "Ikuti langkah" mengembalikan model seperti semula.
 */
import * as T from 'three';
import type { Kit, Layer, Part } from './kit';

export type View = 'follow' | 'structure' | 'mep' | 'plan';
type Rule = 'show' | 'ghost' | 'xray' | 'cut';

// lapisan yang tidak disebut disembunyikan
const RULES: Record<Exclude<View, 'follow'>, Partial<Record<Layer, Rule>>> = {
  structure: {
    site: 'show',
    footing: 'show',
    foundation: 'xray',
    rebar: 'show',
    structure: 'xray',
    ring: 'xray',
    roofframe: 'show',
  },
  mep: {
    site: 'show',
    footing: 'ghost',
    foundation: 'ghost',
    structure: 'ghost',
    ring: 'ghost',
    wall: 'ghost',
    mep: 'show',
    soil: 'show',
    fixtures: 'show',
  },
  plan: {
    site: 'show',
    footing: 'show',
    foundation: 'show',
    structure: 'cut',
    wall: 'cut',
    openings: 'cut',
    interior: 'show',
    landscape: 'show',
  },
};

const ghost = new T.MeshStandardMaterial({ color: 0x9a968e, transparent: true, opacity: 0.06, depthWrite: false });
const xray = new T.MeshStandardMaterial({ color: 0xbdb8ae, transparent: true, opacity: 0.34, depthWrite: false });
const faintLine = new T.LineBasicMaterial({ color: 0x4a453f, transparent: true, opacity: 0.07, depthWrite: false });
const CUT = 0.38;

/** Bagian dalam keadaan lengkap: terlihat, ukuran penuh, semua isinya terpasang. */
export function fullState(part: Part) {
  const o = part.obj;
  o.visible = true;
  o.scale.setScalar(1);
  o.position.y = part.y0;
  if (part.kind === 'lay') (o as T.InstancedMesh).count = o.userData.total as number;
  if (part.kind === 'seq') for (const c of o.children) c.visible = true;
}

/** Kembalikan bahan dan ukuran asli sebelum model dianimasikan lagi. */
export function restore(kit: Kit) {
  for (const part of kit.parts) {
    part.obj.scale.setScalar(1);
    part.obj.traverse((c) => {
      const mesh = c as T.Mesh;
      if (mesh.userData.keep) {
        mesh.material = mesh.userData.keep as T.Material;
        delete mesh.userData.keep;
      }
    });
  }
}

export function showLayers(kit: Kit, view: View) {
  if (view === 'follow') return;
  // tampilan teknis memperlihatkan juga bagian di bawah tanah
  kit.ground.constant = view === 'plan' ? 0.002 : 0.8;
  const rules = RULES[view];
  for (const part of kit.parts) {
    const rule = rules[part.layer];
    // bagian dinding yang berada di atas bidang potong (mis. segitiga atap) tidak ikut denah
    if (!rule || (rule === 'cut' && part.y0 > 1.5)) {
      part.obj.visible = false;
      continue;
    }
    const scale = part.obj.scale.x || 1;
    fullState(part);
    // orang tetap pada ukuran aslinya
    if (part.layer === 'landscape' && scale < 0.9) part.obj.scale.setScalar(scale);
    if (rule === 'cut') part.obj.scale.y = CUT;
    if (rule === 'ghost' || rule === 'xray') {
      part.obj.traverse((c) => {
        const mesh = c as T.Mesh;
        const line = (c as T.LineSegments).isLineSegments;
        if (line && rule === 'ghost') {
          mesh.userData.keep ??= mesh.material;
          mesh.material = faintLine;
        }
        if (!mesh.isMesh) return;
        mesh.userData.keep ??= mesh.material;
        mesh.material = rule === 'ghost' ? ghost : xray;
      });
    }
  }
}
