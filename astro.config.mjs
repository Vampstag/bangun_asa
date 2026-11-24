// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import devToolbarApps from './src/dev-toolbar/integration.mjs';

// https://astro.build/config
export default defineConfig({
  // Domain produksi: dipakai untuk canonical, gambar OG, dan sitemap.
  site: 'https://bangunasa.com',
  // Dua bahasa: Indonesia di "/" (utama) dan Inggris di "/en/". Teks ada di src/i18n.
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Pil gelap di bawah layar saat `npm run dev` adalah Astro Dev Toolbar (hanya mode pengembangan).
  devToolbar: { enabled: true },
  integrations: [
    // Aplikasi toolbar buatan sendiri: Grid dan Responsive (lihat src/dev-toolbar/).
    devToolbarApps(),
    // Sitemap menyertakan alternatif bahasa (hreflang) untuk tiap halaman.
    sitemap({ i18n: { defaultLocale: 'id', locales: { id: 'id-ID', en: 'en-US' } } }),
  ],
});
