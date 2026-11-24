/**
 * Fakta situs yang sama di semua bahasa (kontak, legalitas, sosial, peta, kredit).
 * Kontak dan sosial media diedit lewat CMS (src/data/content/settings.json); sisanya tetap di sini.
 * Teks yang diterjemahkan ada di src/i18n/id.ts dan en.ts.
 * Link internal ditulis dari root situs, mis. '/#karya'; awalan bahasa (/en) ditambahkan otomatis oleh href().
 *
 * Sumber data: situs lama bangunasa.com (kontak, alamat, legalitas, sosial) dan tautan Google Maps resmi.
 */
import type { Lang } from '../i18n';
import { t } from '../i18n';
import settings from './content/settings.json';

/**
 * Nomor yang diketik manusia ("0851 3851 6234") diubah ke format internasional ("+6285138516234")
 * untuk tautan tel: dan WhatsApp. Editor cukup mengetik nomor seperti biasa, tidak perlu format khusus.
 */
export function toTel(display: string): string {
  const d = display.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.startsWith('62')) return `+${d}`;
  if (d.startsWith('0')) return `+62${d.slice(1)}`;
  return `+62${d}`;
}

interface RawPhone {
  name?: string;
  display?: string;
}

/** Hanya nomor yang lengkap (nama dan angka) yang dipakai; entri setengah jadi dari CMS dilewati. */
const phones = (settings.phones as RawPhone[])
  .filter((p) => p.name?.trim() && p.display?.trim())
  .map((p) => ({ name: p.name!.trim(), display: p.display!.trim(), tel: toTel(p.display!) }));

export const SITE = {
  brand: 'Bangun Asa Konstruksi',
  legalName: 'PT Bangun Asa Konstruksi',
  contact: {
    // Diedit lewat CMS: src/data/content/settings.json
    address: settings.address.trim(),
    /** Nomor customer service. Nomor pertama jadi nomor WhatsApp utama (tombol, form, tautan). */
    phones,
    /** Nomor WhatsApp utama: tanpa "+" dan tanpa spasi (dari nomor CS pertama). */
    whatsapp: (phones[0]?.tel ?? '').replace('+', ''),
    /**
     * Peta di footer. Koordinat dan tautan diambil dari profil Google Maps resmi
     * "Bangun Asa Konstruksi" (https://maps.app.goo.gl/RXHo1ise32PhTaek7).
     */
    map: {
      embedUrl: 'https://www.google.com/maps?q=-6.8835457,112.0428209&z=17&output=embed',
      openUrl: 'https://maps.app.goo.gl/RXHo1ise32PhTaek7',
      destination: '-6.8835457,112.0428209',
    },
  },
  social: [
    { label: 'Instagram', href: settings.instagram.trim() },
    { label: 'TikTok', href: settings.tiktok.trim() },
  ].filter((s) => s.href),
  /** Legalitas badan usaha (dari halaman Tentang Kami situs lama). */
  legal: {
    name: 'PT BANGUN ASA KONSTRUKSI',
    nib: '1106260081441',
    ahu: 'AHU-A095587.AH.01.30.Tahun 2026',
  },
  credit: { prefix: 'Designed & developed by', name: 'MDKG', href: 'https://hellodimas.my.id/' },
};

/* ---------- bahasa + link helpers ---------- */

const norm = (p: string) => p.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
const base = () => import.meta.env.BASE_URL.replace(/\/$/, '');
const EXTERNAL = /^(mailto:|tel:|https?:|#)/i;

/** Bahasa dari path URL: "/en/..." adalah Inggris, selain itu Indonesia. */
export function langOf(path: string): Lang {
  const rest = path.slice(base().length);
  return rest === '/en' || rest.startsWith('/en/') ? 'en' : 'id';
}

/** Menambahkan awalan bahasa pada path internal. "/" → "/en/" untuk Inggris. */
function localize(path: string, lang: Lang): string {
  const prefix = lang === 'en' ? '/en' : '';
  return base() + prefix + (path === '/' && prefix ? '/' : path);
}

/** URL halaman yang sama dalam bahasa lain. */
export function altLangUrl(current: string): string {
  const rest = current.slice(base().length);
  if (langOf(current) === 'en') return base() + (rest.replace(/^\/en/, '') || '/');
  return base() + '/en' + (rest === '/' ? '/' : rest);
}

/** Link yang menunjuk ke halaman yang sama dijadikan '#hash' agar smooth scroll jalan tanpa reload. */
export function href(to: string, current: string): string {
  if (EXTERNAL.test(to)) return to;
  const [path, hash] = to.split('#');
  const target = localize(path || '/', langOf(current));
  if (norm(target) === norm(current)) return hash ? `#${hash}` : '#top';
  return target + (hash ? `#${hash}` : '');
}

/** True jika link menunjuk halaman ini (tanpa hash), untuk penanda menu aktif. */
export function isCurrent(to: string, current: string): boolean {
  if (EXTERNAL.test(to) || to.includes('#')) return false;
  return norm(localize(to, langOf(current))) === norm(current);
}

/** Tautan WhatsApp dengan pesan terisi (default: pesan sapaan sesuai bahasa). */
export function whatsappUrl(lang: Lang, text?: string, number: string = SITE.contact.whatsapp): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text ?? t(lang).whatsappText)}`;
}
