/**
 * Menyalin file CMS (Sveltia CMS) dari node_modules ke public/admin/ supaya dilayani dari situs sendiri
 * (tidak bergantung CDN). Dijalankan otomatis sebelum dev dan build. Hasil salinan tidak ikut di-commit.
 */
const fs = require('fs');
const path = require('path');

const from = path.join(__dirname, '..', 'node_modules', '@sveltia', 'cms', 'dist');
const to = path.join(__dirname, '..', 'public', 'admin');

if (!fs.existsSync(from)) {
  console.error('[cms] @sveltia/cms belum terpasang. Jalankan: npm install');
  process.exit(1);
}
fs.mkdirSync(to, { recursive: true });
fs.copyFileSync(path.join(from, 'sveltia-cms.js'), path.join(to, 'sveltia-cms.js'));
const chunks = path.join(from, 'chunks');
if (fs.existsSync(chunks)) {
  fs.rmSync(path.join(to, 'chunks'), { recursive: true, force: true });
  fs.cpSync(chunks, path.join(to, 'chunks'), { recursive: true, filter: (src) => !src.endsWith('.map') });
}
console.log('[cms] Sveltia CMS disalin ke public/admin/');
