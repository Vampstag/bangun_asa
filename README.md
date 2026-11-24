# Bangun Asa — website

Astro 7 (static). Tanpa CMS dan tanpa backend, hasil build berupa HTML/CSS/JS statis yang bisa di-host di mana saja.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm install` | Pasang dependensi (sekali saja) |
| `npm run dev` | Server pengembangan di http://localhost:4321 |
| `npm run build` | Hasil jadi di folder `dist/` |
| `npm run preview` | Coba hasil build secara lokal |

Butuh Node 22.23.4 atau lebih baru.

## Mengubah isi tanpa menyentuh markup

| Mau ubah | Buka |
|---|---|
| **Semua teks** (Indonesia dan Inggris): menu, CTA, homepage, form, footer | `src/i18n/id.ts` dan `src/i18n/en.ts` |
| Kontak, alamat, sosmed, NIB/AHU, peta | `src/data/site.ts` |
| Gambar dan struktur data homepage (teks diambil dari kamus bahasa) | `src/data/home.ts` (`getHome(lang)`) |
| Foto | `src/assets/real/` (asli) dan `src/assets/img/` (stok sementara). Otomatis dioptimasi |
| Peta di footer | `src/data/site.ts` → `contact.map` (koordinat, tautan embed, dan tautan Google Maps) |
| Warna, font, jarak | `src/styles/global.css` (variabel di `:root`) |

## Dua bahasa (ID / EN)
- Indonesia di `/` (bahasa utama), Inggris di `/en/`. Bahasa dibaca dari URL (`langOf(Astro.url.pathname)`), tombol ID/EN ada di header (`LangSwitch.astro`).
- `en.ts` bertipe `Dict` dari `id.ts`: kalau ada teks yang kurang di salah satu bahasa, `npm run check` dan build gagal. Jadi tidak ada teks yang terlewat.
- Komponen mengambil teks lewat `t(lang)` (`src/i18n`) dan tautan lewat `href(to, lang)` (`src/data/site.ts`) supaya awalan `/en` otomatis.
- Hreflang, `og:locale`, JSON-LD, dan sitemap sudah mengikuti kedua bahasa.
- Bahasa baru: tambah kamus, tambahkan di `astro.config.mjs` (`i18n.locales`), buat folder halaman di `src/pages/<kode>/`.

## Dashboard konten (CMS) dan deploy otomatis
- Dashboard: `/admin/` (Sveltia CMS, gratis). Editor non-IT bisa mengubah **proyek**, **testimoni**, dan **kontak/sosial media** tanpa menyentuh kode. Datanya: `src/data/content/*.json`; form dashboard: `public/admin/config.yml`; foto unggahan: `src/assets/uploads/`.
- Simpan di dashboard = commit ke GitHub, lalu GitHub Actions (`.github/workflows/deploy.yml`) menjalankan `npm run verify` dan mengunggah ke cPanel lewat FTP.
- Setup lengkap (repo, FTP, login GitHub lewat Cloudflare Worker, serah terima dari situs PHP lama): `docs/SETUP-CMS-DAN-DEPLOY.md`. Panduan untuk editor: `docs/PANDUAN-EDITOR.md`.
- `public/admin/sveltia-cms.js` dan `chunks/` adalah salinan dari node_modules (dibuat otomatis saat dev/build, tidak di-commit).
- `public/.htaccess`: aturan Apache untuk cPanel, termasuk pengalihan alamat PHP lama.

## Halaman baru
1. Salin `src/pages/_template.astro` jadi `src/pages/nama-halaman.astro`. Hasilnya jadi `/nama-halaman/`.
2. Ganti `title`, `label`, `lead`, lalu isi section.
3. Tambahkan ke menu di `src/i18n/id.ts` dan `en.ts` (`nav`).

## Komponen (`src/components/`)

| Komponen | Props |
|---|---|
| `<Header theme="dark" />` | `theme`: `dark` jika section pertama gelap (hero foto) |
| `<PageHero label title lead />` | Judul halaman dalam. `title` memakai `\|` untuk baris baru |
| `<SectionHead label title />` | Heading awal section |
| `<Cta />` | Opsional `label`, `title` |
| `<Footer />` | Tanpa props |

Section homepage ada di `src/components/home/`. Tiap section membaca datanya dari `src/data/home.ts`.

## Struktur
```
src/
  assets/img/     foto
  components/     Header, Footer, Cta, PageHero, SectionHead, Lines
    home/         section homepage
  data/           site.ts (fakta bisnis, helper bahasa), home.ts (gambar + struktur homepage)
  i18n/           id.ts, en.ts (seluruh teks), index.ts (t)
  layouts/        Layout.astro (head, SEO dasar, font, skrip gerak)
  pages/          satu file = satu halaman
  scripts/        motion.ts (smooth scroll, reveal, parallax)
  styles/         global.css
```

## Alat bantu pengembangan

### Astro Dev Toolbar (pil gelap di bawah layar, hanya saat `npm run dev`)
Aplikasi bawaan Astro:
- **Astro Menu**: info proyek, tautan dokumentasi, tombol "Copy debug info".
- **Inspect**: melihat island dan props-nya di halaman.
- **Audit**: pemeriksaan cepat aksesibilitas dan performa (bukan pengganti Lighthouse).
- **Settings**: posisi toolbar, verbose logging, notifikasi.

Aplikasi buatan proyek ini (`src/dev-toolbar/`):
- **Grid (tekan `G`)**: overlay 12 kolom yang mengikuti layout situs, untuk memeriksa kesejajaran. Statusnya diingat.
- **Responsive**: ukuran viewport, breakpoint aktif, dan penunjuk elemen yang membuat halaman bisa digeser ke samping (diberi garis merah). Titik merah di ikon artinya ada overflow.

Matikan toolbar lewat `devToolbar: { enabled: false }` di `astro.config.mjs`.

### Kualitas kode
| Perintah | Fungsi |
|---|---|
| `npm run check` | Type-check TypeScript dan file Astro |
| `npm run lint` | ESLint, termasuk aturan aksesibilitas (jsx-a11y) |
| `npm run format` | Rapikan kode dengan Prettier (CSS tidak disentuh) |
| `npm run verify` | check + lint + format:check + build. Jalankan sebelum merilis |

### Aksesibilitas
Audit penuh dengan axe-core menemukan dan memperbaiki: ARIA tab yang salah, `aria-label` pada `<p>`, kontras warna, dan tombol WhatsApp di luar landmark. Aturan yang perlu dijaga:
- Warna teks sekunder (`--mute`) harus tetap di atas rasio 4,5:1. Jangan dimuda-kan.
- Teks yang diredupkan lewat `opacity` atau alpha harus tetap terbaca (judul besar minimal 3:1, teks biasa 4,5:1).
- Satu pengecualian yang disengaja: kalimat manifesto sengaja redup sebelum di-scroll (efek menyala per kata). Pengguna dengan reduce-motion melihatnya penuh.

## Merek, aset, dan sumber data
- **Warna:** navy `#1e3a5f` dan merah `#c62828` (diambil dari logo dan situs lama). Token ada di `:root` pada `src/styles/global.css`.
- **Logo:** dua varian di `src/assets/brand/` (terang/gelap). Bila logo diganti, jalankan `node tools/build-brand-assets.cjs <folder-sumber>`. Skrip itu juga membuat favicon dan gambar OG.
- **Foto asli:** `src/assets/real/` (proyek, tim, sertifikat) berasal dari situs lama bangunasa.com.
- **Data asli** dari situs lama: nama badan usaha, NIB, AHU, alamat, nomor CS, Instagram, TikTok, proses kerja (dipecah jadi 6 langkah tunggal), FAQ, tim, testimoni, koordinat peta.
- **Tidak dibawa** dari situs lama (bukan milik Bangun Asa atau tidak terverifikasi): foto genteng/atap bawaan template, badge BBB/Google, grafik garansi Owens Corning/GAF, dan entri portofolio contoh.

## Animasi dan transisi
- Transisi halaman memakai Astro View Transitions (`ClientRouter`). Skrip komponen dipasang lewat `astro:page-load`, dan `motion.ts` dibersihkan di `astro:before-swap`. Skrip baru yang menyentuh DOM harus mengikuti pola itu, kalau tidak listener-nya menggandakan diri tiap pindah halaman.
- Reveal gambar dengan mask: tambahkan `data-mask` pada elemen `.media`. Reveal teks halus: `data-reveal`.
- Efek tirai: hero `position: sticky` diam di tempat, semua section setelahnya dibungkus `.curtain` (`HomePage.astro`) dan naik menutupinya. Progresnya dihitung dari `.curtain`, bukan `.hero`, karena kotak elemen yang sticky tidak bergerak. Video di-pause saat tertutup. Section baru taruh di dalam `.curtain`.
- Tombol magnet: `src/scripts/magnet.ts`, hanya untuk mouse di desktop dan hanya 2 tombol (`TARGETS`: tombol kirim form dan tombol WhatsApp melayang; navbar sengaja tanpa magnet). Tidak ada efek apa pun di layar sentuh. Memakai properti CSS `translate`/`scale` (bukan `transform`) supaya tidak bentrok dengan animasi lain, dan nonaktif untuk reduced-motion.
- Menu hamburger: terbuka sebagai lingkaran dari tombol burger, item naik satu-satu. Menu selalu pas satu layar tanpa scroll (ukuran huruf mengikuti tinggi layar). Isinya link, kartu CS dengan tombol chat/telepon, dan baris ikon peta/Instagram/TikTok, diambil dari `SITE.contact` dan `SITE.social`. Tombol WhatsApp melayang disembunyikan selama menu terbuka karena kontaknya sudah ada di menu.
- Tombol WhatsApp melayang (`WhatsAppButton.astro`) membuka pilihan CS (daftar dari `SITE.contact.phones`); memilih satu langsung membuka chat WhatsApp CS itu dengan pesan sapaan sesuai bahasa. Menutup dengan klik di luar, Esc, atau scroll kembali ke atas.
- Progress baca di bawah header diatur oleh variabel `--progress` (`motion.ts`).
- Judul hero naik per baris dari balik mask: lihat prop `mask` pada `Lines.astro`.
- Lightbox (pratinjau gambar di halaman yang sama): beri `data-lightbox` dan `data-lb-alt` pada tautan `<a href="gambar-besar">`, lalu pasang `<Lightbox />` di halaman itu. Semua tautan bertanda di satu halaman menjadi satu galeri (panah, geser, Esc, klik latar untuk menutup). Dipakai pada sertifikat di section Legalitas. Gambar bisa di-zoom: klik gambar, tombol +/−, tombol `+` `-` `0`, scroll mouse, atau cubit di layar sentuh; saat ter-zoom gambar bisa digeser.
- Sertifikat tampil sebagai daftar ringkas. Pratinjau muncul saat hover/fokus, klik membuka lightbox.
- Layanan: di layar ≤900px (atau mode kurangi gerak) tampil sebagai accordion pendek, satu item terbuka dalam satu waktu (`[data-acc]` di `motion.ts` dan `global.css`). Di desktop tetap tab sticky.
- Karya: 4 kartu selalu tampil sebagai grid (2 kolom di tablet/mobile, 4 kolom di desktop).

## Yang masih perlu diganti atau dilengkapi
- **Hero:** video latar sekarang klip stok Mixkit (lihat `public/video/BACA-SAYA.txt`). Ganti dengan footage proyek asli.
- **Foto stok:** kartu B2B dan layanan "Bangunan Komersial" memakai foto stok karena belum ada foto proyek komersial.
- **Karya:** judul proyek bersifat deskriptif. Isi nama, lokasi, dan tahun proyek di `WORK` (`src/data/home.ts`).
- **Logo klien:** marquee sekarang menampilkan jenis bangunan. Untuk logo klien asli, isi field `logo` pada `TRUST.items`.
- **Testimoni:** isinya di `src/data/content/testimonials.json` (diedit lewat dashboard `/admin/`, atau langsung di file). Tiap testimoni: nama, teks Indonesia (wajib), teks Inggris (opsional; kosong = versi Inggris menampilkan teks asli dengan catatan), foto (opsional; tanpa foto dipakai avatar inisial). Yang tampil hanya foto/inisial, nama, dan isi. Tampilannya "adegan" sticky (kartu naik melewati judul, `motion.ts` + `.quote__*` di CSS); maksimal `FEATURED_MAX` (8, di `src/data/testimonials.ts`) testimoni teratas dipakai. Tanpa JS atau dengan reduced-motion jadi daftar kartu biasa. Sekarang 6 testimoni (5 dari ulasan Google Maps yang disalin pemilik, 1 dari situs lama; ejaan dirapikan, terjemahan Inggris dibuat dari teks Indonesia). Entri lain di situs lama ("apartement 20 lantai", founder, foto orang) tampak seperti data uji dan belum dipakai.
