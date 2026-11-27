// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import sitemap from '@astrojs/sitemap';
import devToolbarApps from './src/dev-toolbar/integration.mjs';

// Tarif kalkulator sudah dikonfirmasi? (src/data/content/calculator.json)
const calcConfirmed =
  JSON.parse(fs.readFileSync(new URL('./src/data/content/calculator.json', import.meta.url), 'utf8')).confirmed ===
  true;

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
  // Three.js (model 3D) dimuat terpisah dan malas, jadi ukuran chunk-nya sengaja besar.
  vite: { build: { chunkSizeWarningLimit: 900 } },
  integrations: [
    // Aplikasi toolbar buatan sendiri: Grid dan Responsive (lihat src/dev-toolbar/).
    devToolbarApps(),
    // Sitemap menyertakan alternatif bahasa (hreflang) untuk tiap halaman.
    sitemap({
      // Halaman kalkulator ber-noindex selama tarifnya belum dikonfirmasi, jadi tidak boleh ada di sitemap.
      filter: (page) => calcConfirmed || !page.includes('/calculator'),
      i18n: { defaultLocale: 'id', locales: { id: 'id-ID', en: 'en-US' } },
    }),
  ],
});
