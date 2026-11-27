/**
 * Optimasi untuk HP: di dalam tiap bagian (yang bergerak sebagai satu kesatuan), benda yang memakai bahan sama digabung
 * menjadi satu geometri, termasuk garis tepinya. Tampilan tidak berubah, tetapi jumlah perintah gambar turun jauh.
 * Yang tidak digabung: InstancedMesh, label (sprite), jalur pipa yang muncul berurutan, dan subpohon bertanda
 * userData.dynamic (drum molen, lengan crane) yang digabung sendiri supaya tetap bisa berputar.
 */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Part } from './kit';

interface Bucket {
  line: boolean;
  material: T.Material;
  cast: boolean;
  receive: boolean;
  nodes: (T.Mesh | T.LineSegments | T.LineLoop)[];
}

/** LineLoop (sengkang) diubah menjadi pasangan titik supaya bisa digabung dengan garis lain. */
function asSegments(geo: T.BufferGeometry) {
  const pos = geo.getAttribute('position');
  const pts: T.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    pts.push(
      new T.Vector3().fromBufferAttribute(pos, i),
      new T.Vector3().fromBufferAttribute(pos, (i + 1) % pos.count),
    );
  }
  return new T.BufferGeometry().setFromPoints(pts);
}

function bakeRoot(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map<string, Bucket>();
  const dynamic: T.Object3D[] = [];

  const visit = (o: T.Object3D) => {
    if (o !== root && o.userData.dynamic) {
      dynamic.push(o);
      return;
    }
    const mesh = o as T.Mesh;
    const line = (o as T.Line).isLine;
    const solid = mesh.isMesh && !(o as T.InstancedMesh).isInstancedMesh;
    if (o !== root && (solid || line) && !Array.isArray(mesh.material)) {
      const material = mesh.material as T.Material;
      const key = `${line ? 'l' : 'm'}:${material.uuid}:${mesh.castShadow}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { line, material, cast: mesh.castShadow, receive: mesh.receiveShadow, nodes: [] }));
      b.nodes.push(mesh);
    }
    for (const c of o.children) visit(c);
  };
  visit(root);

  for (const b of buckets.values()) {
    if (b.nodes.length < 2) continue;
    const geos = b.nodes.map((n) => {
      let g = (n as T.LineLoop).isLineLoop ? asSegments(n.geometry) : n.geometry.clone();
      if (!b.line && g.index) {
        const flat = g.toNonIndexed();
        g.dispose();
        g = flat;
      }
      if (b.line && g.index) g = g.toNonIndexed();
      for (const name of Object.keys(g.attributes)) {
        if (name !== 'position' && (b.line || (name !== 'normal' && name !== 'uv'))) g.deleteAttribute(name);
      }
      g.clearGroups();
      g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, n.matrixWorld));
      return g;
    });
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue; // atribut tidak cocok: biarkan apa adanya
    const out = b.line ? new T.LineSegments(merged, b.material) : new T.Mesh(merged, b.material);
    out.castShadow = b.cast;
    out.receiveShadow = b.receive;
    // anak yang tidak ikut digabung dipindahkan dulu supaya tidak hilang bersama induknya
    for (const n of b.nodes) {
      for (const child of [...n.children]) root.attach(child);
    }
    for (const n of b.nodes) {
      n.removeFromParent();
      n.geometry.dispose();
    }
    root.add(out);
  }
  for (const d of dynamic) bakeRoot(d);
}

export function bake(parts: Part[]) {
  for (const p of parts) {
    // 'seq' memunculkan anak satu per satu; 'fade' sudah memakai bahan sendiri sehingga aman digabung
    if (p.kind === 'seq' || p.kind === 'lay') continue;
    bakeRoot(p.obj);
  }
}
