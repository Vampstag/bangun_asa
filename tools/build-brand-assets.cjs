/**
 * Menyiapkan aset merek dari file sumber (logo asli Bangun Asa) menjadi file yang dipakai situs.
 * Jalankan ulang bila logo berubah:  node tools/build-brand-assets.cjs <folder-sumber>
 *
 * Folder sumber harus berisi:
 *   logo.png   logo horizontal (mark + teks "Bangun Asa KONSTRUKSI")
 *   mark.png   hanya chevron merah (persegi)
 *
 * Hasil:
 *   src/assets/brand/logo.png         logo untuk latar terang
 *   src/assets/brand/logo-light.png   teks gelap diubah putih, merah dipertahankan (latar gelap)
 *   public/favicon.png, apple-touch-icon.png, favicon-32.png, og.png
 */
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const src = path.resolve(process.argv[2] || '');
if (!process.argv[2]) { console.error('Pakai: node tools/build-brand-assets.cjs <folder-sumber>'); process.exit(1); }

const NAVY = { r: 30, g: 58, b: 95 }; // #1e3a5f
const out = (...p) => path.join(root, ...p);

(async () => {
  fs.mkdirSync(out('src/assets/brand'), { recursive: true });

  // 1) logo untuk latar terang: apa adanya
  await sharp(path.join(src, 'logo.png')).png({ compressionLevel: 9 }).toFile(out('src/assets/brand/logo.png'));

  // 2) logo untuk latar gelap: piksel gelap (teks) jadi putih-hangat, piksel merah tetap
  const { data, info } = await sharp(path.join(src, 'logo.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const isRed = r > 140 && g < 90 && b < 90;
    if (!isRed) { data[i] = 247; data[i + 1] = 246; data[i + 2] = 243; } // alpha dipertahankan agar tepi tetap halus
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(out('src/assets/brand/logo-light.png'));

  // 3) favicon + apple-touch-icon: chevron di atas latar putih bulat-sudut, supaya terbaca di tab gelap maupun terang
  const mark = await sharp(path.join(src, 'mark.png')).trim().toBuffer();
  const icon = async (size, file, pad = 0.2) => {
    const inner = Math.round(size * (1 - pad * 2));
    const m = await sharp(mark).resize(inner, inner, { fit: 'inside' }).toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
      .composite([{ input: m, gravity: 'center' }]).png().toFile(out('public', file));
  };
  await icon(512, 'favicon.png', 0.1);
  await icon(180, 'apple-touch-icon.png', 0.1);
  await icon(32, 'favicon-32.png', 0.12);

  // 4) gambar OG 1200x630: latar navy + logo versi terang
  const logoLight = await sharp(out('src/assets/brand/logo-light.png')).resize({ width: 640 }).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: NAVY } })
    .composite([{ input: logoLight, gravity: 'center' }]).png({ compressionLevel: 9 }).toFile(out('public/og.png'));

  console.log('ok: logo, logo-light, favicon (512/180/32), og.png');
})();
