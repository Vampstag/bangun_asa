/**
 * Logika kalkulator estimasi biaya dan durasi. Dipakai di server (keadaan awal) dan di browser dengan fungsi yang sama.
 * Angka ada di src/data/content/calculator.json (diedit lewat dashboard). Dasar dan sumbernya: docs/DASAR-KALKULATOR.md.
 *
 * Rumus (mengikuti pola resmi biaya bangunan gedung: luas x koefisien lantai x harga satuan per m2 daerah):
 *   biaya per m2 = harga dasar finishing (Tuban) x koefisien jumlah lantai x (IKK daerah / IKK Tuban) x faktor pekerjaan
 *   faktor pekerjaan: rumah baru 1; renovasi sebagian = jumlah bobot komponen yang dikerjakan; renovasi total = factor_full
 *   hasil ditampilkan sebagai kisaran, lebarnya berbeda per jenis pekerjaan
 * Sengaja TIDAK memberi angka untuk ruko/bangunan komersial (ragamnya terlalu lebar), dan tidak memberi durasi renovasi
 * (belum ada data yang bisa dipertanggungjawabkan).
 */
import raw from './content/calculator.json';

export type ProjectType = 'new' | 'partial' | 'full' | 'commercial';
export type Finish = 'standard' | 'mid' | 'premium';
export type Floors = 1 | 2 | 3;
export const PARTS = ['foundation', 'structure', 'floor', 'wall', 'ceiling', 'roof', 'utility', 'finishing'] as const;
export type Part = (typeof PARTS)[number];

export interface Input {
  type: ProjectType;
  finish: Finish;
  /** kunci daerah dari calculator.json, atau "other" */
  region: string;
  floors: Floors;
  /** bagian yang dikerjakan (hanya untuk renovasi sebagian) */
  parts?: Part[];
}

export const CALC = {
  /** false = tarif belum dikonfirmasi tim: kalkulator disembunyikan dari menu produksi. */
  confirmed: raw.confirmed === true,
  /** bulan data harga, "2026-11" */
  dataDate: raw.data_date,
  rate: { standard: raw.rate_standard, mid: raw.rate_mid, premium: raw.rate_premium } as Record<Finish, number>,
  full: raw.factor_full,
  range: raw.ranges as Record<Exclude<ProjectType, 'commercial'>, { low: number; high: number }>,
  floors: raw.floors as Record<string, number>,
  ikkYear: raw.ikk_year,
  ikkBase: raw.ikk_base,
  regions: raw.regions as { key: string; name: string; ikk: number }[],
  components: raw.components as Record<Part, number>,
  duration: raw.duration,
};

export const DEFAULT_PARTS: Part[] = ['floor', 'ceiling', 'finishing'];

export const LIMITS = {
  area: { min: 15, max: 600, step: 1, def: 72 },
  budget: { min: 50, max: 3000, step: 10, def: 300 }, // juta rupiah
};

/** Kalkulator tampil di menu dan beranda bila tarif sudah dikonfirmasi (atau saat pengembangan, supaya bisa dilihat). */
export const CALC_ENABLED = import.meta.env.DEV || CALC.confirmed;

/** Selisih biaya antardaerah: perbandingan Indeks Kemahalan Konstruksi BPS terhadap Tuban. */
export function regionFactor(key: string): number {
  const r = CALC.regions.find((x) => x.key === key);
  return r ? r.ikk / CALC.ikkBase : 1;
}

const totalWeight = () => PARTS.reduce((n, p) => n + CALC.components[p], 0);

/** Porsi tiap bagian (persen, jumlahnya 100). Renovasi sebagian hanya berisi bagian yang dipilih. */
export function breakdown(i: Input): { part: Part; pct: number }[] {
  const used = i.type === 'partial' ? PARTS.filter((p) => i.parts?.includes(p)) : [...PARTS];
  const sum = used.reduce((n, p) => n + CALC.components[p], 0);
  return used.map((part) => ({ part, pct: sum ? (CALC.components[part] / sum) * 100 : 0 }));
}

function workFactor(i: Input): number {
  if (i.type === 'new') return 1;
  if (i.type === 'full') return CALC.full;
  return (i.parts ?? []).reduce((n, p) => n + CALC.components[p], 0) / totalWeight();
}

/** null = tidak dihitung otomatis (bangunan komersial, atau renovasi sebagian tanpa bagian terpilih). */
export function costPerM2(i: Input): number | null {
  if (i.type === 'commercial') return null;
  const work = workFactor(i);
  if (!work) return null;
  return CALC.rate[i.finish] * (CALC.floors[String(i.floors)] ?? 1) * regionFactor(i.region) * work;
}

export function estimateCost(i: Input, area: number) {
  const perM2 = costPerM2(i);
  if (perM2 === null || i.type === 'commercial') return null;
  const mid = area * perM2;
  const r = CALC.range[i.type];
  return { perM2, mid, low: mid * (1 - r.low), high: mid * (1 + r.high) };
}

/** Kebalikannya: dari anggaran (rupiah) ke luas yang realistis. */
export function estimateArea(i: Input, budget: number) {
  const perM2 = costPerM2(i);
  if (perM2 === null || i.type === 'commercial') return null;
  const r = CALC.range[i.type];
  return {
    perM2,
    mid: budget / perM2,
    low: budget / (perM2 * (1 + r.high)),
    high: budget / (perM2 * (1 - r.low)),
  };
}

/** Durasi hanya untuk rumah baru; jenis lain ditentukan setelah survei. */
export function estimateWeeks(i: Input, area: number) {
  if (i.type !== 'new') return null;
  const d = CALC.duration;
  const w = (d.base + d.perM2 * area) * ((d.floors as Record<string, number>)[String(i.floors)] ?? 1);
  return { low: Math.max(4, Math.round(w * (1 - d.low))), high: Math.max(5, Math.round(w * (1 + d.high))) };
}

/* ---------- format tampilan (dipakai bersama di server dan browser) ---------- */

export interface Words {
  juta: string;
  miliar: string;
  minggu: string;
  bulan: string;
}

const roundRp = (n: number) =>
  n < 1e8 ? Math.round(n / 1e6) * 1e6 : n < 1e9 ? Math.round(n / 5e6) * 5e6 : Math.round(n / 1e7) * 1e7;
const num = (n: number, lang?: string, digits = 0) =>
  n.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: digits });

export function fmtRp(n: number, w: Words, lang?: string): string {
  const r = roundRp(n);
  return r >= 1e9 ? `Rp ${num(r / 1e9, lang, 2)} ${w.miliar}` : `Rp ${num(r / 1e6, lang)} ${w.juta}`;
}

export function fmtRange(low: number, high: number, w: Words, lang?: string): string {
  const a = roundRp(low);
  const b = roundRp(high);
  if (b < 1e9) return `Rp ${num(a / 1e6, lang)}–${num(b / 1e6, lang)} ${w.juta}`;
  if (a >= 1e9) return `Rp ${num(a / 1e9, lang, 1)}–${num(b / 1e9, lang, 1)} ${w.miliar}`;
  return `${fmtRp(a, w, lang)} – ${fmtRp(b, w, lang)}`;
}

export function fmtAreaRange(low: number, high: number, lang?: string): string {
  return `${num(Math.round(low), lang)}–${num(Math.round(high), lang)} m²`;
}

export function fmtWeeks(r: { low: number; high: number }, w: Words, lang?: string): string {
  const ml = Math.max(1, Math.round(r.low / 4.33));
  const mh = Math.max(1, Math.round(r.high / 4.33));
  const months = ml === mh ? `${num(ml, lang)}` : `${num(ml, lang)}–${num(mh, lang)}`;
  return `${r.low}–${r.high} ${w.minggu} (±${months} ${w.bulan})`;
}

/** Mengisi penanda {nama} di sebuah teks dengan nilai dari `vars`. */
export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

/** Biaya per m2, satu desimal (Rp 3,9 juta), supaya tidak terbulat kasar. */
export function fmtPerM2(n: number, w: Words, lang?: string): string {
  return `Rp ${num(n / 1e6, lang, 1)} ${w.juta}`;
}

/** "2026-11" -> "November 2026". */
export function fmtMonth(ym: string, lang?: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 15)).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
