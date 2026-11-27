/**
 * Data media sosial (TikTok) untuk section "Media sosial".
 * Sumber: src/data/content/tiktok.json + thumbnail di src/assets/social/, dihasilkan otomatis oleh tools/sync-tiktok.cjs
 * (dijalankan terjadwal oleh .github/workflows/sync-tiktok.yml, atau manual: npm run sync:tiktok). Jangan diedit manual.
 * Video diurutkan dari yang terbaru; yang ditampilkan hanya thumbnail dan tombol putar (tanpa caption, sematan, atau angka tayang).
 */
import type { ImageMetadata } from 'astro';
import { SITE } from './site';
import data from './content/tiktok.json';

const covers = import.meta.glob<{ default: ImageMetadata }>('/src/assets/social/*.webp', { eager: true });
const coverByName = new Map(Object.entries(covers).map(([p, m]) => [p.split('/').pop()!, m.default]));

interface RawVideo {
  id: string;
  url: string;
  cover: string;
}

/** "27.3K" -> "27,3 rb" (Indonesia) atau "27.3K" (Inggris); angka biasa diberi pemisah ribuan sesuai bahasa. */
export function formatCount(raw: string, lang?: string): string {
  const m = String(raw ?? '')
    .trim()
    .match(/^([\d.,]+)\s?([KMB])?$/i);
  if (!m) return raw;
  const isEn = lang === 'en';
  if (!m[2]) return Number(m[1].replace(/[.,]/g, '')).toLocaleString(isEn ? 'en-US' : 'id-ID');
  if (isEn) return `${m[1]}${m[2].toUpperCase()}`;
  const unit = { K: ' rb', M: ' jt', B: ' M' }[m[2].toUpperCase() as 'K' | 'M' | 'B'];
  return `${m[1].replace('.', ',')}${unit}`;
}

export function getSocial(lang?: string, limit = 4) {
  const videos = (data.videos as RawVideo[]).flatMap((v) => {
    const image = coverByName.get(v.cover);
    if (!image) return []; // thumbnail hilang: lewati, jangan merusak halaman
    return [{ ...v, image }];
  });
  const tiktok = SITE.social.find((s) => /tiktok/i.test(s.label));
  const instagram = SITE.social.find((s) => /instagram/i.test(s.label));
  return {
    profile: {
      name: data.profile.name,
      handle: data.profile.handle,
      url: tiktok?.href || data.profile.url,
      followers: formatCount(data.profile.followers, lang),
      instagram: instagram?.href,
    },
    videos: videos.slice(0, limit),
    hasVideos: videos.length > 0,
  };
}
