# Bahan sumber dari klien

Folder ini berisi dokumen dan video asli dari klien sebagai bahan rujukan desain dan konten. **Isinya tidak ikut ke GitHub**
(besar, dan memuat nama serta nomor klien); hanya README ini yang ikut. Salinan ada di komputer pengembang. Jangan taruh
file di sini yang ingin ditayangkan di situs: untuk itu pakai `public/` atau `src/assets/`.

| File | Isi | Dipakai untuk |
| --- | --- | --- |
| `profil-perusahaan.pdf` | Company profile (21 hal): cerita, visi dan misi, layanan, alur kerja, tim, portofolio, testimoni | Teks Tentang, proses 7 langkah, keunggulan, proyek, testimoni |
| `katalog-2026.pdf` | Katalog (8 hal): tentang, 6 alasan memilih, wilayah layanan, testimoni, peta kantor | Wilayah kerja, testimoni, kontak |
| `referensi-fasad-denah.pdf` | Katalog referensi fasad (14 gaya) dan contoh denah (64 hal) | Contoh denah dan nama gaya di section "Referensi desain". **Foto/render fasad di dalamnya milik pihak ketiga, jangan dipasang di situs.** |
| `alur-klien.pdf` | Client's Journey (8 hal): 8 langkah setelah survei lokasi | Rujukan proses setelah survei |
| `logo-bangun-asa.png` | Logo | Rujukan |
| `hero-video-sumber-asli.mp4` | Video hero revisi (terpasang): 1920x1080, 36,8 detik, 50 fps, 43 MB | Sumber untuk `public/video/hero-hd.mp4` dan `hero-sd.mp4` |
| `hero-video-sumber-v1.mp4` | Video hero versi pertama (sudah tidak dipakai) | Cadangan |

## Video hero
`public/video/hero-hd.mp4` (1920x1080, ±3 Mbps, 14,0 MB, untuk layar lebar) dan `hero-sd.mp4` (1280x720, ±1,5 Mbps, 7,0 MB, untuk
HP dan koneksi lambat) adalah versi kompres dari `hero-video-sumber-asli.mp4`: H.264, tanpa audio, 50 fps (sama dengan sumber),
metadata di depan berkas (faststart). Kalau video diganti, kompres lagi dengan pengaturan yang sama (panduan lengkap di `public/video/BACA-SAYA.txt`).
