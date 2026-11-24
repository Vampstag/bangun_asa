/**
 * Testimoni klien. Isinya ada di src/data/content/testimonials.json dan diedit lewat CMS (/admin/),
 * tapi bisa juga diedit langsung di file JSON itu.
 *
 * Yang tampil hanya: foto (atau avatar inisial), nama, dan isi testimoni.
 * Tampilannya "adegan" sticky: kartu naik melewati judul sambil di-scroll. Maksimal `FEATURED_MAX` testimoni
 * (urutan paling atas) yang dipakai di adegan itu, supaya scroll-nya tidak terlalu panjang. Taruh yang terbaik di atas.
 *
 * Aturan praktis:
 * - Hanya masukkan testimoni asli dan yang pengirimnya mengizinkan namanya (dan fotonya, kalau ada) ditampilkan.
 * - Teks Indonesia wajib. Teks Inggris opsional: kalau kosong, versi Inggris menampilkan teks Indonesia aslinya
 *   dengan catatan "Original in Indonesian", jadi tidak perlu menerjemahkan dulu.
 * - Foto opsional (tanpa foto dipakai avatar inisial). Jangan pakai foto profil orang lain dari internet tanpa izin orangnya.
 */
import type { ImageMetadata } from 'astro';
import data from './content/testimonials.json';
import { resolveImage } from './media';

/** Jumlah testimoni maksimal yang tampil di section. */
export const FEATURED_MAX = 8;

export interface Testimonial {
  name: string;
  text: { id: string; en?: string };
  photo?: ImageMetadata;
}

interface RawTestimonial {
  name?: string;
  text_id?: string;
  text_en?: string;
  photo?: string;
}

export const TESTIMONIALS: Testimonial[] = (data.items as RawTestimonial[])
  .filter((i) => i.name?.trim() && i.text_id?.trim()) // entri setengah jadi dilewati, tidak merusak halaman
  .map((i) => ({
    name: i.name!.trim(),
    text: { id: i.text_id!.trim(), en: i.text_en?.trim() || undefined },
    photo: resolveImage(i.photo),
  }));
