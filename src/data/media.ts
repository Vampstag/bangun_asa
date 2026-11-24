/**
 * Mencari gambar dari nama file. CMS menyimpan gambar sebagai teks, mis. "/src/assets/uploads/rumah-1.webp";
 * di sini teks itu diubah jadi gambar yang bisa dioptimasi Astro (dicocokkan lewat nama file).
 * Gambar harus ada di src/assets/uploads (unggahan CMS) atau src/assets/real (foto asli awal).
 */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/{real,uploads}/*.{webp,jpg,jpeg,png,avif}', {
  eager: true,
});

const byName = new Map(Object.entries(files).map(([p, m]) => [p.split('/').pop()!.toLowerCase(), m.default]));

export function resolveImage(ref?: string | null): ImageMetadata | undefined {
  if (!ref) return undefined;
  const img = byName.get(ref.split('/').pop()!.toLowerCase());
  if (!img) console.warn(`[cms] gambar tidak ditemukan, dilewati: ${ref}`);
  return img;
}
