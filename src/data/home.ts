/**
 * Struktur konten homepage: menggabungkan TEKS dari kamus bahasa (src/i18n) dengan hal yang sama
 * di semua bahasa (gambar, ikon, tautan, angka).
 *
 * - Ubah teks: src/i18n/id.ts dan en.ts
 * - Ubah foto, urutan, atau angka: file ini
 *
 * Sumber isi: situs lama bangunasa.com. Hal yang belum ada datanya ditandai "PLACEHOLDER".
 */
import { t } from '../i18n';
import { TESTIMONIALS, FEATURED_MAX } from './testimonials';
import { resolveImage } from './media';
import projectsData from './content/projects.json';
import proyek1 from '../assets/real/proyek-1.webp';
import proyek2 from '../assets/real/proyek-2.webp';
import proyek3 from '../assets/real/proyek-3.webp';
import proyek4 from '../assets/real/proyek-4.webp';
import tim from '../assets/real/tim.webp';
import sertifikat1 from '../assets/real/sertifikat-1.webp';
import sertifikat2 from '../assets/real/sertifikat-2.webp';
import sertifikat3 from '../assets/real/sertifikat-3.webp';
import sertifikat4 from '../assets/real/sertifikat-4.webp';
// PLACEHOLDER: foto stok untuk bangunan komersial (belum ada foto proyek komersial asli).
import stokKomersial from '../assets/img/p4.webp';
import stokFasad from '../assets/img/p2.webp';

const CONTACT = '/#kontak';

interface RawProject {
  title_id?: string;
  title_en?: string;
  meta_id?: string;
  meta_en?: string;
  image?: string;
  alt_id?: string;
  alt_en?: string;
}

export type ProcessIcon = 'consult' | 'plan' | 'contract' | 'build' | 'finish' | 'quality';

export function getHome(lang?: string) {
  const h = t(lang).home;
  const isEn = lang === 'en';

  const HERO = {
    /**
     * Video latar. Taruh file di public/video/ dengan nama hero.mp4 (wajib) dan hero.webm (opsional).
     * Tanpa file, hero otomatis memakai foto di bawah. Foto juga jadi cadangan saat video belum siap,
     * saat reduced-motion, dan saat mode hemat data.
     */
    video: { mp4: 'video/hero.mp4', webm: 'video/hero.webm' },
    image: proyek3,
    alt: h.hero.alt,
    tag: h.hero.tag,
    title: h.hero.title,
    lead: h.hero.lead,
    cta: { label: h.hero.cta, href: CONTACT },
  };

  /** Marquee: jenis bangunan yang dikerjakan. Untuk logo klien, isi field `logo`. */
  const TRUST = {
    aria: h.trust.aria,
    clientsLabel: h.trust.clientsLabel,
    clientsLead: h.trust.clientsLead,
    items: h.trust.items.map((name) => ({ name })) as { name: string; logo?: ImageMetadata }[],
    legalLabel: h.trust.legalLabel,
    legal: h.trust.legal,
    certsLabel: h.trust.certsLabel,
    certsCaption: h.trust.certsCaption,
    /** Setiap sertifikat punya gambar utama dan lampiran. Urutan gambar = urutan teks di kamus. */
    certs: h.trust.certs.map((c, i) => ({
      ...c,
      image: [sertifikat1, sertifikat3][i],
      attachImage: [sertifikat2, sertifikat4][i],
    })),
  };

  const INTRO = { label: h.intro.label, text: h.intro.text, image: proyek1, imageAlt: h.intro.imageAlt };

  // `plain`: tampil apa adanya tanpa animasi hitung (angka tahun tidak cocok dihitung dari 0).
  const STATS = [
    { value: 2024, plain: true, suffix: '', text: h.stats[0].text },
    { value: 200, plain: false, suffix: '+', text: h.stats[1].text },
    { value: 3, plain: false, suffix: '', text: h.stats[2].text },
  ];

  const AUDIENCE = {
    label: h.audience.label,
    title: h.audience.title,
    cards: h.audience.cards.map((c, i) => ({
      ...c,
      tone: i === 0 ? 'b2b' : 'b2c',
      href: CONTACT,
      // PLACEHOLDER (kartu B2B): ganti dengan foto proyek komersial Bangun Asa
      image: [stokKomersial, proyek2][i],
    })),
  };

  const SERVICES = {
    label: h.services.label,
    title: h.services.title,
    cta: h.services.cta,
    href: CONTACT,
    items: h.services.items.map((s, i) => ({
      ...s,
      // PLACEHOLDER (layanan ke-4): ganti dengan foto proyek komersial Bangun Asa
      image: [proyek3, proyek2, proyek4, stokFasad][i],
    })),
  };

  /**
   * Daftar proyek diedit lewat CMS: src/data/content/projects.json (judul, jenis, foto, deskripsi foto; Indonesia dan Inggris).
   * Proyek tanpa foto yang valid dilewati supaya kartu tidak rusak. Bahasa Inggris kosong = memakai teks Indonesia.
   */
  const WORK = {
    label: h.work.label,
    title: h.work.title,
    items: (projectsData.items as RawProject[]).flatMap((p) => {
      const image = resolveImage(p.image);
      const title = (isEn ? p.title_en : '') || p.title_id;
      if (!image || !title?.trim()) return [];
      return [
        {
          title: title.trim(),
          meta: ((isEn ? p.meta_en : '') || p.meta_id || '').trim(),
          alt: ((isEn ? p.alt_en : '') || p.alt_id || title).trim(),
          image,
          href: CONTACT,
        },
      ];
    }),
    end: { ...h.work.end, href: CONTACT },
  };

  const icons: ProcessIcon[] = ['consult', 'plan', 'contract', 'build', 'finish', 'quality'];
  const PROCESS = {
    label: h.process.label,
    title: h.process.title,
    lead: h.process.lead,
    steps: h.process.steps.map((s, i) => ({ ...s, icon: icons[i] })),
  };

  /** Nama dan jabatan dibaca dari foto tim di situs lama. */
  const TEAM = { ...h.team, image: tim };

  /** Teks testimoni dari src/data/testimonials.ts, digabung dengan label UI dari kamus bahasa. */
  const QUOTE = {
    label: h.quote.label,
    title: h.quote.title,
    share: h.quote.share,
    shareCta: h.quote.shareCta,
    shareText: h.quote.shareText,
    items: TESTIMONIALS.slice(0, FEATURED_MAX).map((x) => ({
      name: x.name,
      text: isEn ? (x.text.en ?? x.text.id) : x.text.id,
      /** Bahasa teks bila berbeda dari halaman (versi Inggris tanpa terjemahan menampilkan teks Indonesia). */
      textLang: isEn && !x.text.en ? 'id' : undefined,
      note: isEn ? (x.text.en ? h.quote.translated : h.quote.original) : '',
      photo: x.photo,
    })),
  };

  const FAQ = h.faq;

  return { HERO, TRUST, INTRO, STATS, AUDIENCE, SERVICES, WORK, PROCESS, TEAM, QUOTE, FAQ };
}
