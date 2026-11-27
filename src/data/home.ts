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
import proyek5 from '../assets/uploads/proyek-5.webp';
import denah2Lantai from '../assets/real/denah-2-lantai.webp';
import denahMemanjang from '../assets/real/denah-memanjang.webp';
import tim from '../assets/real/tim.webp';
import type { IconName } from './icons';
import sertifikat1 from '../assets/real/sertifikat-1.webp';
import sertifikat2 from '../assets/real/sertifikat-2.webp';
import sertifikat3 from '../assets/real/sertifikat-3.webp';
import sertifikat4 from '../assets/real/sertifikat-4.webp';

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

export type ProcessIcon = 'consult' | 'survey' | 'plan' | 'contract' | 'build' | 'quality' | 'handover';

/** Ikon marquee jenis bangunan, urutannya sama dengan trust.items di kamus bahasa. */
const TRUST_ICONS: IconName[] = ['home', 'shop', 'office', 'warehouse', 'cafe', 'repair', 'tools', 'commercial'];

export function getHome(lang?: string) {
  const h = t(lang).home;
  const isEn = lang === 'en';

  const HERO = {
    /**
     * Video latar, dua versi di public/video/: hero-hd.mp4 (1080p, layar lebar) dan hero-sd.mp4 (720p, HP dan koneksi
     * lambat); salah satu cukup. Tanpa file, hero otomatis memakai foto di bawah. Foto juga jadi cadangan saat video
     * belum siap, saat reduced-motion, dan saat mode hemat data.
     */
    video: { hd: 'video/hero-hd.mp4', sd: 'video/hero-sd.mp4' },
    image: proyek3,
    alt: h.hero.alt,
    waCta: h.hero.waCta,
    workLink: h.hero.workLink,
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
    items: h.trust.items.map((name, i) => ({ name, icon: TRUST_ICONS[i] })) as {
      name: string;
      icon?: IconName;
      logo?: ImageMetadata;
    }[],
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

  const INTRO = {
    label: h.intro.label,
    text: h.intro.text,
    image: proyek1,
    imageAlt: h.intro.imageAlt,
    /** Lima keunggulan (dari compro) dan wilayah kerja (dari katalog). */
    why: h.intro.why,
    coverage: h.intro.coverage,
  };

  // `plain`: tampil apa adanya tanpa animasi hitung (angka tahun tidak cocok dihitung dari 0).
  const STATS = [
    { value: 200, plain: false, suffix: '+', text: h.stats[0].text },
    { value: 3, plain: false, suffix: '', text: h.stats[1].text },
    { value: 10, plain: false, suffix: '+', text: h.stats[2].text },
  ];

  /** Dua kartu ringkas (B2B dan B2C) dengan ikon merek di tengah. Tidak memakai foto. */
  const AUDIENCE = {
    aria: h.audience.aria,
    cards: h.audience.cards.map((c, i) => ({
      ...c,
      tone: i === 0 ? 'b2b' : 'b2c',
      /** Indeks pilihan "jenis proyek" di form yang diisi otomatis saat kartu diklik (B2B: ruko, B2C: rumah). */
      prefill: i === 0 ? 1 : 0,
      href: CONTACT,
    })),
  };

  const BAND = {
    title: h.band.title,
    text: h.band.text,
    primary: { label: h.band.primary, href: CONTACT },
    secondary: h.band.secondary,
  };

  const SERVICES = {
    label: h.services.label,
    title: h.services.title,
    cta: h.services.cta,
    href: CONTACT,
    items: h.services.items.map((s, i) => ({
      ...s,
      // Foto proyek asli untuk bangun baru dan renovasi; denah (gambar kerja dari katalog) untuk renovasi total dan
      // bangunan komersial, karena belum ada foto proyek komersial asli. Denah ditampilkan utuh (fit: 'plan').
      image: [proyek5, proyek2, denah2Lantai, denahMemanjang][i],
      fit: ['photo', 'photo', 'plan', 'plan'][i],
    })),
  };

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

  const icons: ProcessIcon[] = ['consult', 'survey', 'plan', 'contract', 'build', 'quality', 'handover'];
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

  return { HERO, TRUST, INTRO, STATS, AUDIENCE, BAND, SERVICES, WORK, PROCESS, TEAM, QUOTE, FAQ };
}
