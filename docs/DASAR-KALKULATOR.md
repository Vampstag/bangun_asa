# Dasar perhitungan kalkulator biaya

Data per November 2026. Angka di kalkulator **berasal dari riset, belum tarif Bangun Asa**. Selama belum dikonfirmasi,
kalkulator tidak tampil di situs yang tayang.

## Yang kami butuhkan dari tim Bangun Asa

1. Isi tabel [Kalibrasi](#kalibrasi-dengan-proyek-sendiri) dengan 3 sampai 5 proyek yang sudah selesai (tanpa nama klien).
2. Cocokkan [spesifikasi tiap tingkat finishing](#spesifikasi-acuan) dengan paket yang benar-benar ditawarkan.
3. Jawab [pertanyaan terbuka](#pertanyaan-terbuka).
4. Perbarui tarif di dashboard (menu **Kalkulator estimasi**), lalu centang **Tarif sudah dikonfirmasi tim**.

## Rumus

```
biaya per m² = harga dasar finishing di Tuban
             × koefisien jumlah lantai
             × (indeks biaya daerah ÷ indeks biaya Tuban)
             × faktor jenis pekerjaan
biaya        = luas total semua lantai × biaya per m², ditampilkan sebagai kisaran
```

Contoh: rumah baru standar 72 m², 1 lantai, Tuban = 72 × Rp3,9 juta = Rp281 juta, ditampilkan **Rp225 sampai 365 juta**.

## Harga dasar (rumah baru, bahan dan upah, di Tuban)

| Finishing | Tarif dipakai | Sebaran data pasar |
|---|---|---|
| Standar | Rp3,9 juta/m² | 3,15 sampai 4,00 (4 daftar harga) |
| Menengah | Rp4,9 juta/m² | 4,20 sampai 5,25 (5 daftar harga) |
| Premium | Rp6,8 juta/m² | 6,00 sampai 8,00 (4 daftar harga) |

Cara menghitungnya: diambil **nilai tengah (median)** dari titik tengah tiap daftar harga.
Harga bertanggal 2025 dinaikkan 9,59% (kenaikan harga bahan bangunan setahun menurut BPS, Oktober 2026). Harga dari daerah
tertentu disesuaikan ke Tuban memakai indeks BPS 2026.

| Sumber (dibuka langsung) | Daerah, tanggal | Standar | Menengah | Premium (juta/m²) |
|---|---|---|---|---|
| [Anugerah Tafinna Agung](https://anugerahtafinnaagung.co.id/biaya-bangun-rumah-2026-di-jawa-timur-update-terbaru/) | Jawa Timur, Agu 2026 | 2,8–3,5 | 3,6–4,8 | 5,0–7,0 |
| [Migunani Sukses Makmur](https://migunanisuksesmakmur.com/bangun-rumah-borongan/) | Jawa Timur, Nov 2025 | 3,0–3,8 | 3,8–4,8 | mulai 5,0 (tidak dipakai, tanpa batas atas) |
| [CariBisnis](https://caribisnis.id/artikel/biaya-bangun-rumah-per-meter-2026) | Nasional, Jun 2026 | 3,5–4,5 | 4,5–6,0 | 6,0–10,0+ |
| [MBD Kontraktor](https://www.mbdkontraktor.com/rincian-harga-borongan-bangun-rumah/) | Medan, Jul 2026 | 3,5–4,5 | 4,5–6,0 | 6,0–7,5 |
| [Madina Build](https://madinabuild.com/jasa-bangun-rumah-di-bojonegoro/) | Bojonegoro, Sep 2026 | tidak ada | mulai 5,0 | mulai 7,0 (termasuk desain) |

Sumber yang sengaja tidak dipakai: daftar Jabodetabek (wilayahnya terlalu jauh), satu halaman Gresik yang tidak jelas apakah
untuk bangun baru atau renovasi, dan satu situs Bojonegoro yang ternyata sudah dialihkan ke domain judi.

## Jumlah lantai

| Lantai | Koefisien |
|---|---|
| 1 | 1,000 |
| 2 | 1,090 |
| 3 | 1,120 |

Sumber: [Permen PU 45/2007](https://jdih.pu.go.id/internal/assets/assets/produk/PermenPUPR/2007/12/PerMenPU45-2007.pdf)
(dibuka langsung). Peraturan itu sudah diganti. Menurut sumber sekunder, nilai yang sama dipakai di Kepmen PUPR
1044/KPTS/M/2018; teks Kepmen tersebut belum kami buka. Bentuk rumusnya (luas × koefisien lantai × harga satuan daerah)
sesuai [Kepmen PUPR 943/2024](https://jdih.pu.go.id/internal/assets/assets/produk/KepmenPUPR/2024/05/2024kmpupr943.pdf).
Koefisien ini dibuat untuk gedung negara, jadi untuk rumah 2 lantai sebaiknya dicek dengan proyek sendiri.

## Lokasi

[BPS, Indeks Kemahalan Konstruksi Provinsi dan Kabupaten/Kota 2026](https://www.bps.go.id/id/publication/2026/10/01/b37430e50df8d88d771bb79c/indeks-kemahalan-konstruksi-provinsi-dan-kabupaten-kota-2026.html),
terbit 1 Oktober 2026, Kota Medan = 100, Tabel 17 (Jawa Tengah) dan Tabel 19 (Jawa Timur).

| Daerah | Indeks | Dibanding Tuban | Daerah | Indeks | Dibanding Tuban |
|---|---|---|---|---|---|
| Tuban | 100,05 | 0% | Kediri (kabupaten) | 95,06 | −5,0% |
| Bojonegoro | 101,50 | +1,4% | Nganjuk | 96,47 | −3,6% |
| Lamongan | 102,36 | +2,3% | Ngawi | 92,46 | −7,6% |
| Gresik | 111,23 | +11,2% | Rembang | 102,95 | +2,9% |
| Surabaya | 106,45 | +6,4% | Blora | 103,33 | +3,3% |
| Sidoarjo | 105,51 | +5,5% | Pati | 104,09 | +4,0% |
| Mojokerto (kabupaten) | 103,93 | +3,9% | Kota Semarang | 108,26 | +8,2% |
| Jombang | 103,34 | +3,3% | Kota Malang | 104,13 | +4,1% |

Indeks ini mengukur kemahalan konstruksi secara umum, bukan khusus rumah tinggal. Ongkos angkut dan penginapan tukang untuk
proyek jauh belum dihitung. Daerah di luar daftar dihitung setara Tuban dan diberi catatan di layar.

## Renovasi

**Renovasi sebagian** = biaya rumah baru × jumlah porsi bagian yang dikerjakan. Porsi diambil dari nilai tengah kolom
**Rumah Negara** pada tabel persentase komponen Permen PU 45/2007 (halaman 62 berkas PDF):

| Bagian | Rentang resmi | Dipakai |
|---|---|---|
| Pondasi | 3–7% | 5 |
| Struktur | 20–25% | 22,5 |
| Lantai | 10–15% | 12,5 |
| Dinding | 10–15% | 12,5 |
| Plafon | 8–10% | 9 |
| Atap | 10–15% | 12,5 |
| Utilitas (listrik dan air) | 8–10% | 9 |
| Finishing | 15–20% | 17,5 |

Jumlahnya 100,5, lalu dijadikan 100%. Sebagai pembanding, atap + plafon standar menjadi sekitar Rp0,83 juta/m², berada di
dalam kisaran pasar Rp0,25 sampai 0,90 juta/m² ([Maxcon](https://maxcon.co.id/biaya-renovasi-rumah-terbaru-2026-lengkap/)).
Cara ini belum memperhitungkan biaya bongkar, jadi batas atas kisarannya dibuat lebih lebar (+40%).

**Renovasi total** = 90% biaya rumah baru, kisaran −30% sampai +35%. **Ini angka yang paling lemah**, karena sumbernya
bertentangan:

- Permen PU 45/2007 membatasi biaya perbaikan kerusakan berat paling banyak **65%** dari biaya bangun baru (ringan 30%,
  sedang 45%). Itu batas untuk memulihkan bangunan negara, bukan merombak denah.
- Daftar harga pasar menyebut renovasi total **Rp4,5 sampai 8 juta/m²**
  ([Genis, Jawa Timur](https://www.jasarenovasirumahgenis.com/biaya-renovasi-rumah-jawa-timur/), Maxcon), setara atau di
  atas bangun baru, dengan spesifikasi yang tidak dijelaskan.

Angka 90% adalah keputusan di antara keduanya dan **wajib dikoreksi dengan data proyek sendiri**.

**Ruko dan bangunan komersial tidak diberi angka.** Gudang, kafe, dan ruko terlalu berbeda, dan kami tidak menemukan data
yang layak. Kalkulator mengarahkan pengunjung ke WhatsApp.

## Lebar kisaran

| Jenis | Kisaran | Alasan |
|---|---|---|
| Rumah baru | −20% / +30% | Tanpa gambar dan survei. Mencakup sebaran data pasar (−18% / +17%) |
| Renovasi sebagian | −20% / +40% | Kerusakan tersembunyi dan biaya bongkar |
| Renovasi total | −30% / +35% | Sumber bertentangan |

Standar AACE International 56R-08 untuk estimasi tahap paling awal (Class 5) bangunan menyebut kira-kira −20 sampai −30%
dan +30 sampai +50%. Kami mengutipnya dari salinan dan panduan turunan yang muncul di pencarian, bukan dari dokumen resmi
AACE.

## Durasi (hanya rumah baru)

`minggu = (8 + 0,08 × luas) × faktor lantai (1 / 1,4 / 1,8)`, ditampilkan −15% sampai +20%.

| Contoh | Hasil kalkulator | Pembanding |
|---|---|---|
| 72 m², 1 lantai | 12–17 minggu | Situs kontraktor: 3 sampai 5 bulan untuk tipe 36–45 |
| 120 m², 2 lantai | 21–30 minggu | Madina Build: paling lama 8 bulan untuk 101–200 m²; situs lain 6–9 bulan untuk tipe 70–90 dua lantai |

Rumus ini **disusun agar sesuai pembanding tersebut, bukan diturunkan dari penelitian**. Jurnal yang muncul di pencarian
(tipe 36 sekitar 65–92 hari, tipe 70 sekitar 91 hari) baru kami baca ringkasannya, dan lingkup kerjanya berbeda-beda.
Durasi renovasi sengaja tidak ditampilkan.

## Spesifikasi acuan

Angka per m² hanya berarti bila spesifikasinya jelas. Tabel ini disusun dari daftar paket penyedia jasa di atas dan **tampil
di halaman kalkulator**, jadi harus sesuai dengan paket Bangun Asa.

| Bagian | Standar | Menengah | Premium |
|---|---|---|---|
| Pondasi dan struktur | Batu kali dan footplat, beton bertulang | Sama dengan standar | Beton bertulang sesuai hitungan struktur |
| Dinding | Bata ringan, plester, cat standar | Bata ringan, cat lebih tahan | Bata ringan atau bata merah, finishing khusus |
| Lantai | Keramik 40×40 | Granit 60×60 | Granit 80×80 atau setara |
| Atap dan plafon | Baja ringan, genteng beton, gipsum | Baja ringan, genteng keramik, gipsum | Genteng keramik atau bitumen, plafon bertingkat |
| Pintu dan jendela | Kusen standar | Kusen aluminium | Aluminium kelas atas, UPVC, atau kayu pilihan |
| Sanitasi | Lokal ber-SNI | Kelas menengah | Kelas atas |

Teks spesifikasi ada di `src/i18n/id.ts` dan `en.ts` (`calculator.basis.spec`).

## Pertanyaan terbuka

1. Apakah desain arsitektur termasuk dalam harga borongan Bangun Asa? Kalkulator saat ini menulis **belum termasuk**.
2. Apakah PBG, sambungan PLN, dan air memang selalu di luar harga?
3. Berapa lama masa garansi (retensi) yang bisa dicantumkan?
4. Daerah mana yang benar-benar dilayani, dan apakah ada biaya tambahan untuk proyek jauh?
5. Berapa biaya minimum proyek yang masih diterima?

## Kalibrasi dengan proyek sendiri

Isi dari proyek yang **sudah selesai** (biaya akhir, bukan penawaran awal). Jangan tulis nama atau alamat klien.

| No | Jenis (baru / renovasi) | Tahun selesai | Kabupaten | Luas total (m²) | Lantai | Finishing | Bagian direnovasi | Biaya akhir (Rp) | Lama (minggu) | Catatan (desain, pondasi dalam, pagar, dll.) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | |
| 2 | | | | | | | | | | |
| 3 | | | | | | | | | | |
| 4 | | | | | | | | | | |
| 5 | | | | | | | | | | |

Cara memakainya, per proyek:

1. Keluarkan biaya pekerjaan yang tidak dihitung kalkulator (pagar, perizinan, perabot, dan lainnya).
2. `harga dasar = biaya akhir ÷ (luas × koefisien lantai × indeks daerah ÷ 100,05)`.
3. Untuk proyek lama, naikkan sesuai kenaikan harga bahan sampai sekarang.
4. Ambil nilai tengah per tingkat finishing, lalu bandingkan dengan tarif di atas.
5. Kisaran baru boleh dipersempit bila hasil beberapa proyek memang berdekatan.

## Batas yang perlu diketahui

- Tidak ditemukan daftar harga borongan khusus Kabupaten Tuban.
- Daftar harga kontraktor adalah materi pemasaran. Metodenya tidak dijelaskan dan tidak diaudit.
- Standar harga satuan bangunan gedung negara Tuban yang berlaku sekarang belum didapat. Satu hasil pencarian menyebut
  Rp5,05 sampai 5,60 juta/m² (2022), tetapi dokumennya tidak bisa dibuka, jadi tidak dipakai. Angka itu adalah batas atas
  untuk gedung pemerintah, bukan harga rumah.
- Tidak ditemukan jurnal yang menguji harga per m² untuk rumah di Tuban dan sekitarnya.

## Jadwal pembaruan

Harga bahan bangunan naik 9,59% dalam setahun sampai Oktober 2026
([BPS, dikutip Databoks](https://databoks.katadata.co.id/ekonomi-makro/statistik/3a6719d2aa29da8/indeks-harga-perdagangan-besar-ihpb-bahan-bangunan)).

- **Tiap 3 bulan:** cek tarif dasar, lalu ganti **Bulan data harga** di dashboard.
- **Tiap Oktober:** perbarui indeks daerah dari publikasi BPS terbaru. Semua daerah, termasuk Tuban, harus dari tahun yang
  sama.
