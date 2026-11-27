# Panduan mengelola isi website (untuk tim konten dan marketing)

Tidak perlu paham pemrograman. Semua dilakukan lewat dashboard di browser.

## Masuk

1. Buka **bangunasa.com/admin**.
2. Klik **Sign in with GitHub** dan masuk dengan akun GitHub yang sudah didaftarkan oleh developer.
3. Anda akan melihat tiga menu di sebelah kiri: **Karya / Proyek**, **Testimoni**, **Pengaturan situs**.

## Setelah menyimpan

Klik **Save**. Perubahan **tidak langsung terlihat**: situs perlu sekitar **1 sampai 3 menit** untuk diperbarui. Muat ulang halaman situs setelah beberapa menit. Kalau setelah 10 menit belum berubah, hubungi developer.

## Menambah testimoni

1. Menu **Testimoni** → **Daftar testimoni** → **Add testimoni**.
2. Isi **Nama** dan **Isi testimoni (Indonesia)**. Ejaan boleh dirapikan, tapi isi jangan diubah.
3. **Isi testimoni (Inggris)** boleh dikosongkan.
4. Foto boleh dikosongkan. Kalau dikosongkan, situs memakai huruf awal nama.
5. **Save**.

Aturan penting:
- Hanya masukkan testimoni **asli**, dan pastikan pengirimnya setuju **namanya** (dan **fotonya**, kalau dipasang) ditampilkan. Boleh pakai nama depan atau inisial.
- Yang tampil di situs maksimal **8 testimoni teratas**. Taruh yang terbaik di paling atas (seret untuk menukar urutan).

## Menambah atau mengubah proyek

1. Menu **Karya / Proyek** → **Daftar proyek**.
2. **Add proyek**, lalu unggah **foto**, isi **judul**, dan **jenis** (mis. "Rumah tinggal" atau "Ruko · Tuban 2025").
3. **Deskripsi foto** pendek (mis. "Rumah dua lantai dengan aksen oranye") membantu Google dan pengguna tunanetra.
4. Tips foto: pakai foto tampak depan yang terang, orientasi tegak (potret), ukuran maksimal sekitar 5 MB. Situs mengecilkannya sendiri.
5. Pakai foto proyek sendiri, atau yang sudah diizinkan pemiliknya.

## Mengganti nomor CS, alamat, Instagram, TikTok

1. Menu **Pengaturan situs** → **Kontak dan sosial media**.
2. Ubah, lalu **Save**. Berubah di seluruh situs sekaligus: header, menu, footer, tombol WhatsApp, dan form.
3. Tulis nomor seperti biasa (mis. `0851 3851 6234`).

## Sistem giliran WhatsApp

Di halaman yang sama (**Kontak dan sosial media**):

- **Cara kerja tombol WhatsApp**
  - **Giliran otomatis** (bawaan): pengunjung cukup sekali ketuk. Tiap pengunjung baru mendapat satu CS secara acak merata, dan
    tetap ke CS yang sama selama 30 hari. Tombol Telepon, form penawaran, dan kalkulator mengikuti CS yang sama.
  - **Pengunjung memilih sendiri**: tombol membuka daftar CS.
- **Aktif menerima chat** (per nomor): matikan saat CS cuti, nyalakan lagi saat masuk. Nomor nonaktif tidak tampil di situs.
- Daftar CS di menu dan footer selalu mengarah ke orang yang namanya diketuk.

Catatan: karena situs ini tanpa server, pembagiannya **rata secara rata-rata**, bukan bergantian ketat satu-satu. Dengan sedikit
pengunjung, jumlah chat tiap CS bisa berbeda; makin banyak pengunjung, makin seimbang. Perubahan di dashboard baru tayang setelah
situs selesai dibangun ulang (beberapa menit).

## Pelacakan iklan dan statistik

Menu **Pengaturan situs** → **Pelacakan iklan dan statistik**. Isi ID yang dipakai, yang lain boleh kosong: **Google Analytics 4**,
**TikTok Pixel**, **Meta Pixel**. Pelacakan hanya berjalan di situs live.

| Kejadian | Kapan tercatat | TikTok / Meta |
| --- | --- | --- |
| `whatsapp_click` | tombol atau tautan WhatsApp diketuk | Contact |
| `phone_click` | tombol Telepon atau nomor diketuk | Contact |
| `form_submit` | form penawaran dikirim | SubmitForm / Lead |
| `calculator_use` | kalkulator mulai dipakai | hanya GA4 |
| `social_click`, `directions_click` | Instagram, TikTok, atau peta diketuk | hanya GA4 |

Tiap kejadian membawa `placement` (posisi tombol, mis. `hero`, `bilah_bawah_hp`, `footer`) dan, untuk WhatsApp, nama CS. Di GA4,
daftarkan `placement` dan `cs` sebagai *custom dimension* supaya bisa dilihat di laporan; `generate_lead` bisa ditandai sebagai
konversi. Nama, lokasi, dan isi pesan pengunjung **tidak** dikirim. Karena pelacakan ini memakai cookie pihak ketiga, tambahkan
halaman kebijakan privasi sebelum menjalankan iklan.

## Mengatur tarif kalkulator estimasi

Menu **Kalkulator estimasi** berisi harga rumah baru per m² di Tuban (standar, menengah, premium), faktor renovasi total, lebar kisaran,
koefisien jumlah lantai, daftar daerah beserta indeks biaya BPS, porsi komponen untuk renovasi sebagian, dan rumus durasi.
**Angka awalnya hasil riset harga pasar, bukan tarif Bangun Asa.** Cocokkan dulu dengan proyek yang sudah selesai (caranya di
[DASAR-KALKULATOR.md](DASAR-KALKULATOR.md)), lalu centang **Tarif sudah dikonfirmasi tim** dan simpan. Selama belum dicentang,
kalkulator tidak tampil di menu dan beranda situs.

- **Tiap 3 bulan:** cek harga per m², lalu ganti **Bulan data harga**.
- **Tiap Oktober:** perbarui indeks daerah dari publikasi BPS terbaru. Semua daerah, termasuk Tuban, harus dari tahun yang sama.

## Yang tidak bisa diubah dari dashboard

Teks bagian lain (layanan, proses kerja, FAQ, tim), tata letak, warna, dan fitur situs diubah oleh developer. Hubungi developer.

## Kalau salah

- Jangan panik: semua perubahan tercatat dan bisa dibatalkan oleh developer.
- Jangan menghapus nomor CS sampai kosong (minimal satu nomor harus ada).
- Jangan menaruh foto orang tanpa izin, dan jangan menyalin testimoni dari tempat lain tanpa sepengetahuan penulisnya.
