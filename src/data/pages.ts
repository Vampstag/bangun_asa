/**
 * Data halaman dalam (Proyek, Layanan, Tentang). Teks ada di src/i18n (kunci "pages"); daftar proyek dibaca dari
 * src/data/content/projects.json (diedit lewat CMS), sama seperti bagian "Karya terpilih" di beranda.
 */
import type { ImageMetadata } from 'astro';
import { t } from '../i18n';
import { resolveImage } from './media';
import projectsData from './content/projects.json';

interface RawProject {
  title_id?: string;
  title_en?: string;
  meta_id?: string;
  meta_en?: string;
  image?: string;
  alt_id?: string;
  alt_en?: string;
}

export type ProjectType = 'new' | 'renovation';

export interface ArchiveProject {
  title: string;
  /** Teks jenis dan kota seperti yang diisi di CMS, mis. "Renovasi · Tuban". */
  meta: string;
  type: ProjectType;
  /** Kota diambil dari bagian setelah "·" pada meta (Indonesia). Kosong bila tidak ada. */
  city: string;
  alt: string;
  image: ImageMetadata;
  /** Indeks pilihan "jenis proyek" di form: 0 = rumah tinggal, 5 = renovasi. */
  prefill: number;
}

export function getProjects(lang?: string): ArchiveProject[] {
  const isEn = lang === 'en';
  return (projectsData.items as RawProject[]).flatMap((p) => {
    const image = resolveImage(p.image);
    const title = ((isEn ? p.title_en : '') || p.title_id || '').trim();
    if (!image || !title) return [];
    const metaId = (p.meta_id ?? '').trim();
    const type: ProjectType = /renovasi/i.test(metaId) ? 'renovation' : 'new';
    return [
      {
        title,
        meta: ((isEn ? p.meta_en : '') || metaId).trim(),
        type,
        city: metaId.split('·')[1]?.trim() ?? '',
        alt: ((isEn ? p.alt_en : '') || p.alt_id || title).trim(),
        image,
        prefill: type === 'renovation' ? 5 : 0,
      },
    ];
  });
}

export function getPages(lang?: string) {
  const p = t(lang);
  const services = t(lang).home.services;
  return {
    projects: p.pages.projects,
    services: {
      ...p.pages.services,
      /** Judul dan ringkasan tiap layanan dipakai bersama dengan beranda. */
      items: services.items.map((s, i) => ({
        ...s,
        tag: p.pages.services.tags[i],
        scope: p.pages.services.scopes[i],
      })),
      cta: services.cta,
    },
    about: p.pages.about,
  };
}
