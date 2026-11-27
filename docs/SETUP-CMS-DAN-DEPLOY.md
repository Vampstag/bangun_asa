# Setup dashboard konten (CMS) dan deploy otomatis ke cPanel

Untuk developer. Panduan untuk editor non-IT ada di [PANDUAN-EDITOR.md](PANDUAN-EDITOR.md).

## Cara kerjanya

```
Editor login di bangunasa.com/admin  →  simpan  →  commit otomatis ke GitHub
        →  GitHub Actions: cek + build  →  unggah via FTP ke cPanel  →  situs terbarui (± 2 menit)
```

- Dashboard: [Sveltia CMS](https://sveltiacms.app/) (gratis, open source, kompatibel dengan Decap CMS). Berkas aplikasinya disalin dari `node_modules` ke `public/admin/` oleh `tools/sync-cms.cjs` (otomatis saat `npm run dev` dan `npm run build`).
- Isi yang bisa diedit tersimpan sebagai file JSON di `src/data/content/`:
  - `projects.json`: daftar proyek (Karya terpilih)
  - `testimonials.json`: testimoni
  - `settings.json`: alamat, nomor CS, Instagram, TikTok
- Foto unggahan masuk ke `src/assets/uploads/` dan dioptimasi otomatis saat build.
- Konfigurasi form dashboard: `public/admin/config.yml`.
- Tidak ada server atau database tambahan, jadi tidak ada backend yang bisa diretas. Hak mengubah konten = hak tulis di repo GitHub.
- Kalau konten yang disimpan merusak situs (mis. JSON rusak), langkah `npm run verify` di GitHub Actions gagal dan **tidak ada yang terunggah**; situs yang sedang tayang tetap aman.

## 1. Repo GitHub

Repo: https://github.com/Vampstag/bangun_asa. Folder `bangun-asa-web` sudah diinisialisasi sebagai repo git (cabang `main`) dan repo itu terpasang sebagai `origin`.

> Folder induk `05_Bangun Asa` juga punya repo git kosong (tanpa commit) yang berisi `heritage-template/`. **Jangan pakai repo itu.** Repo proyek ini ada di dalam `bangun-asa-web` (akar repo = folder ini), karena path di `config.yml` dan workflow mengasumsikan itu. Jangan unggah `heritage-template/` ke GitHub.

Commit pertama dan push (dijalankan dari folder `bangun-asa-web`):

```bash
git status                      # pastikan tidak ada file .env atau kredensial
git add .
git commit -m "Situs Bangun Asa Konstruksi"
git push -u origin main
```

Setelah push pertama, workflow deploy langsung berjalan dan **gagal di langkah FTP** sampai rahasia FTP diisi (bagian 2). Itu normal dan tidak mengubah situs apa pun. Kalau repo GitHub dibuat publik, pertimbangkan menjadikannya private (isi proyek dan riwayat konten ikut terlihat).

## 2. Deploy otomatis ke cPanel (FTP)

1. Di cPanel → **FTP Accounts** → buat akun FTP **khusus deploy** yang hanya punya akses ke folder tujuan (jangan pakai akun cPanel utama).
2. Di GitHub: repo → **Settings → Secrets and variables → Actions**:
   - Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
   - Variables (opsional): `FTP_DIR` (bawaan `/public_html/`), `FTP_PROTOCOL` (bawaan `ftps`; pakai `ftp` bila server tidak mendukung FTPS)
3. **Uji dulu di subdomain/folder sementara** (mis. `FTP_DIR=/public_html/baru/` atau subdomain `baru.bangunasa.com`), bukan langsung ke situs utama.
4. Tab **Actions → Build dan deploy ke cPanel → Run workflow**. Kalau hijau, cek hasilnya di browser.

Catatan: versi action (`SamKirkland/FTP-Deploy-Action@v4.3.5`, `actions/checkout@v4`, `actions/setup-node@v4`) belum diuji dari sini; kalau Actions menolaknya, cek versi terbaru di halaman masing-masing action.

### Serah terima dari situs PHP lama (hati-hati)

Server klien sekarang berisi situs PHP lama. Deploy hanya **menambah/menimpa** file, tidak menghapus yang lama.

1. **Backup dulu**: cPanel → *Backup* (unduh *Home Directory* dan *Database*), atau salin `public_html` dan ekspor database lewat phpMyAdmin. Data testimoni dan portofolio lama ada di database itu.
2. Uji situs baru di tempat sementara (langkah 3 di atas) sampai beres.
3. Saat beralih: kosongkan isi `public_html` lama (setelah backup), lalu jalankan deploy ke `/public_html/`. Kalau file lama (`index.php`, folder `admin/`) tertinggal, `index.php` lama bisa mengalahkan `index.html` baru, dan folder `/admin/` lama akan bentrok dengan dashboard baru.
4. `public/.htaccess` mengalihkan alamat lama (`portfolio.php`, `testimonial.php`, `services.php`, dll.) ke bagian yang setara di situs baru. Aktifkan paksa HTTPS di file itu setelah SSL menyala.
5. Pastikan dashboard admin PHP lama dimatikan atau dihapus; login `admin` bawaan-nya lemah.

## 3. Login dashboard (GitHub OAuth)

GitHub tidak mengizinkan login langsung dari situs statis, jadi perlu **satu layanan kecil gratis** sebagai perantara. Yang paling umum dan gratis: Cloudflare Worker `sveltia-cms-auth`.

1. Daftar Cloudflare (gratis) dan deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) mengikuti README resminya (ikuti langkah di sana karena bisa berubah). Hasilnya alamat `https://NAMA.AKUN.workers.dev`.
2. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - Homepage URL: `https://bangunasa.com`
   - Authorization callback URL: `https://NAMA.AKUN.workers.dev/callback`
   - Simpan *Client ID* dan buat *Client secret*.
3. Isi `GITHUB_CLIENT_ID` dan `GITHUB_CLIENT_SECRET` sebagai secret di Worker (ikuti README). Disarankan batasi `ALLOWED_DOMAINS` ke `bangunasa.com`.
4. Edit `public/admin/config.yml`:
   ```yaml
   backend:
     repo: PEMILIK/NAMA-REPO
     base_url: https://NAMA.AKUN.workers.dev
   ```
5. Commit dan push. Buka `https://bangunasa.com/admin/` → **Sign in with GitHub**.

Alternatif untuk uji lokal tanpa Worker: jalankan `npm run dev`, buka `http://localhost:4321/admin/index.html` (di server dev Astro alamat `/admin/` tanpa `index.html` belum jalan; di cPanel normal), di Chrome/Edge pilih **Work with Local Repository** lalu pilih folder `bangun-asa-web`. Perubahan langsung tertulis ke file lokal (belum di-commit).

## 4. Menambah editor

- Editor perlu **akun GitHub gratis** dan diundang sebagai *Collaborator* (hak **Write**) di repo: repo → *Settings → Collaborators*.
- **Akun GitHub boleh didaftarkan dengan email domain** (mis. `nama@bangunasa.com`). Tetapi login dashboard tetap lewat tombol GitHub; belum ada login "langsung pakai email domain" tanpa GitHub pada setup gratis ini.
- Kalau nanti editor menolak akun GitHub, pilihannya layanan login perantara berbayar/terhosting (mis. DecapBridge) atau membangun login sendiri. Itu perubahan terpisah.
- Aktifkan verifikasi 2 langkah di akun GitHub pemilik repo dan editor.

## 5. Operasional

- **Membatalkan kesalahan**: repo → *Commits* → pilih commit konten yang salah → *Revert*. Deploy otomatis berjalan lagi.
- **Deploy gagal**: lihat tab *Actions*; pesan error menunjukkan apakah itu konten rusak, FTP salah, atau hal lain.
- **Menambah isi yang bisa diedit** (mis. artikel/blog): tambah koleksi di `public/admin/config.yml`, buat file datanya, dan baca di kode seperti `src/data/testimonials.ts`.
- Bagian lain situs (teks section, layanan, FAQ, tim) masih ada di `src/i18n/id.ts` dan `en.ts`. Itu belum lewat dashboard; ubah lewat developer, atau pindahkan ke dashboard secara bertahap.

## 6. Media sosial: video TikTok otomatis

Section "Media sosial" (di bagian bawah beranda, sebelum kontak, dan di halaman Tentang) menampilkan kartu profil TikTok (nama, jumlah
pengikut) dan 4 video **terbaru** (diurutkan dari ID video; video yang disematkan di profil tidak diberi tempat khusus). Yang tampil hanya
thumbnail dan tombol putar: tanpa caption, penanda sematan, jumlah tayang, atau suka.

**Alurnya, tanpa campur tangan.** Workflow `.github/workflows/sync-tiktok.yml` berjalan setiap 6 jam dan menjalankan `tools/sync-tiktok.cjs`:

1. Membuka profil publik akun TikTok yang ada di `src/data/content/settings.json` (field `tiktok`) di Chrome tanpa tampilan.
2. Membandingkan daftar video dengan yang sudah tersimpan. **Tidak ada video baru: tidak ada perubahan, tidak ada commit, tidak ada deploy.**
3. Ada video baru: thumbnail diunduh dan dioptimasi ke `src/assets/social/` (tautan asli TikTok kedaluwarsa), data ditulis ke
   `src/data/content/tiktok.json`, di-commit otomatis, lalu situs di-deploy ulang. Video baru tampil sekitar 5 menit setelah workflow berikutnya jalan.

Jumlah pengikut diperbarui bersama video baru, atau paling lambat tiap 30 hari, supaya tidak ada deploy setiap hari hanya karena angkanya bergeser.

Video **tidak dimuat sampai diklik**: pengunjung melihat thumbnail milik kita, dan player resmi TikTok baru dimuat saat diklik. Halaman ringan,
dan tidak ada skrip TikTok sebelum pengunjung memilih memutar.

**Kenapa lewat skrip.** TikTok tidak punya API publik gratis untuk daftar video sebuah akun; halaman profilnya hanya terisi di browser
sungguhan dan tidak bisa dibaca langsung dari browser pengunjung (CORS dan anti-bot). Display API resmi butuh aplikasi developer yang
disetujui TikTok dan token login pemilik akun yang kedaluwarsa.

**Yang perlu diperhatikan.**

- Workflow terjadwal hanya berjalan setelah file ini ada di cabang `main` GitHub. Uji pertama: tab **Actions → Sinkron video TikTok → Run workflow**.
- Repo yang lama tanpa aktivitas bisa membuat GitHub menonaktifkan workflow terjadwal; kalau itu terjadi, aktifkan lagi di tab Actions.
- TikTok bisa saja memblokir alamat IP server GitHub. Kalau begitu, job berwarna merah dan **situs tidak berubah** (data lama tetap tampil).
  Cadangannya: jalankan dari komputer sendiri dengan `tools/sync-tiktok-local.cmd` (sync, commit, push bila ada video baru), dijadwalkan lewat
  Task Scheduler, mis. `schtasks /Create /SC DAILY /TN "Sinkron TikTok Bangun Asa" /TR "\"D:\jalur\ke\bangun-asa-web\tools\sync-tiktok-local.cmd\"" /ST 09:00`
  (komputer harus menyala dan git sudah punya akses push).
- Skrip membaca struktur halaman TikTok. Kalau TikTok mengubahnya, skrip gagal dengan pesan jelas tanpa merusak situs; selector di
  `extractInPage` perlu diperbarui.
- Manual: `npm run sync:tiktok` (tambah `-- --dry` untuk hanya melihat hasil, `-- --force` untuk menulis ulang walau tidak ada video baru, `-- --from-file=data.json` untuk uji tanpa browser dan internet).
  Skrip hanya membaca data publik, tanpa kunci atau akun.

## 7. Kalkulator estimasi biaya

Halaman `/calculator` (`/en/calculator`) berisi kalkulator interaktif tanpa server: jenis pekerjaan, luas bangunan atau anggaran, jumlah lantai,
tingkat finishing, lokasi (per kabupaten/kota), dan untuk renovasi sebagian, bagian yang dikerjakan. Hasilnya **kisaran biaya** dan gambaran
pembagian biaya; **durasi hanya untuk rumah baru**; **ruko dan bangunan komersial sengaja tidak diberi angka** (diarahkan ke WhatsApp).
Hasil bisa dikirim ke WhatsApp atau mengisi form penawaran. Di bawah kalkulator ada bagian "Dari mana angka ini?". Rumus ada di
`src/data/calculator.ts`, angkanya di `src/data/content/calculator.json` (semua bisa diedit dari dashboard), dan sumber setiap angka
di [DASAR-KALKULATOR.md](DASAR-KALKULATOR.md).

**Tarif WAJIB dikonfirmasi sebelum tayang.** Angka awal adalah hasil riset harga pasar, bukan tarif Bangun Asa. Karena itu selama
`confirmed` bernilai `false`:

- di build produksi, kalkulator tidak muncul di menu, footer, navigasi samping, dan beranda, tidak masuk sitemap, dan halamannya ber-`noindex`;
- halamannya tetap bisa dibuka lewat alamat langsung dan menampilkan catatan bahwa tarifnya belum dikonfirmasi;
- saat pengembangan (`npm run dev`) kalkulator tetap tampil supaya bisa dicoba.

Langkah menayangkan: tim Bangun Asa mengikuti bagian kalibrasi di DASAR-KALKULATOR.md, mengisi tarif di dashboard, lalu mencentang
**Tarif sudah dikonfirmasi tim**. Setelah deploy, kalkulator otomatis muncul di menu dan beranda, dan penjelasan "harga dasar" di
halaman berganti menjadi tarif yang ditetapkan tim. Teks spesifikasi tiap finishing ada di `src/i18n` (`calculator.basis.spec`).

## Keamanan

- Jangan menaruh kredensial (FTP, cPanel, database, OAuth secret) di repo, di `config.yml`, atau di chat. Hanya di GitHub Secrets / secret Worker.
- Password hosting klien yang sama atau mirip di banyak akun harus diganti, dan verifikasi 2 langkah diaktifkan di email dan akun hosting.
- `/admin/` ditandai `noindex` dan diblok di `robots.txt`. Itu bukan pengaman: pengamannya adalah login GitHub dan hak tulis repo.
