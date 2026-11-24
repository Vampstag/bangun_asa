/**
 * Kamus bahasa Indonesia (bahasa utama). SEMUA teks yang tampil di situs ada di sini dan di en.ts.
 * en.ts diketik sebagai `Dict`, jadi build gagal bila ada teks yang belum diterjemahkan.
 *
 * Sumber isi: situs lama bangunasa.com (beranda, Tentang Kami, Testimoni).
 */
export const id = {
  lang: 'id',
  ogLocale: 'id_ID',
  meta: {
    tagline: 'Jasa Konstruksi di Tuban, Jawa Timur',
    slogan: 'Membangun Asa Menjadi Nyata',
    description:
      'Bangun Asa Konstruksi melayani pembangunan dan renovasi rumah tinggal hingga bangunan komersial di Tuban, Jawa Timur, dan seluruh Pulau Jawa. Berdiri sejak 2024, dipercaya 200+ klien, proses transparan.',
    areaServed: ['Jawa Timur', 'Jawa Tengah', 'Jawa Barat'],
  },
  nav: [
    { label: 'Layanan', href: '/#layanan' },
    { label: 'Karya', href: '/#karya' },
    { label: 'Proses', href: '/#proses' },
    { label: 'Tim', href: '/#tim' },
  ],
  navCta: { label: 'Konsultasi Gratis', href: '/#kontak' },
  ui: {
    home: 'beranda',
    mainNav: 'Utama',
    menuOpen: 'Buka menu',
    menuClose: 'Tutup menu',
    menuContact: 'Kontak',
    language: 'Bahasa',
    quickContact: 'Kontak cepat',
    chatWhatsApp: 'Chat WhatsApp',
    chatWhatsAppAria: 'Chat lewat WhatsApp',
    backToTop: 'Kembali ke atas ↑',
    step: 'Langkah',
  },
  whatsappText: 'Halo Bangun Asa Konstruksi, saya ingin konsultasi proyek. Mohon informasi lebih lanjut. Terima kasih.',
  footer: { location: 'Lokasi kami', navigation: 'Navigasi', contact: 'Hubungi kami', follow: 'Ikuti' },
  menu: {
    nav: 'Menu',
    chatWith: 'Chat WhatsApp dengan',
    callTo: 'Telepon',
    directions: 'Petunjuk arah',
  },
  map: {
    show: 'Tampilkan peta',
    note: 'Dimuat dari Google Maps saat diklik',
    loading: 'Memuat peta…',
    directions: 'Petunjuk arah',
    open: 'Buka di Google Maps',
    title: 'Peta lokasi',
  },
  lightbox: {
    label: 'Pratinjau gambar',
    close: 'Tutup pratinjau',
    prev: 'Gambar sebelumnya',
    next: 'Gambar berikutnya',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    reset: 'Atur ulang zoom',
  },
  cta: {
    label: 'Kontak',
    title: 'Punya proyek?|Mari berdiskusi.',
    whatsapp: 'Chat WhatsApp',
    note: 'Konsultasi gratis, lengkap dengan estimasi anggaran yang transparan. Tidak ada risiko sampai Anda benar-benar yakin.',
  },
  form: {
    title: 'Ajukan penawaran gratis',
    name: 'Nama lengkap',
    type: 'Jenis proyek',
    choose: 'Pilih',
    estimate: 'Estimasi luas / budget',
    estimatePlaceholder: 'Mis. 120 m² atau Rp 500 juta',
    location: 'Lokasi proyek',
    locationPlaceholder: 'Kota / kabupaten',
    details: 'Detail kebutuhan',
    submit: 'Kirim lewat WhatsApp',
    note: 'Tombol ini membuka WhatsApp dengan pesan yang sudah terisi. Anda tetap bisa menyuntingnya sebelum mengirim.',
    projectTypes: ['Rumah Tinggal', 'Ruko', 'Kantor', 'Gudang', 'Kafe / Restoran', 'Renovasi', 'Lainnya'],
    message: {
      intro: 'Halo {brand}, saya ingin meminta penawaran.',
      name: 'Nama',
      type: 'Jenis proyek',
      estimate: 'Estimasi luas / budget',
      location: 'Lokasi',
      details: 'Detail kebutuhan',
    },
  },
  home: {
    hero: {
      tag: 'Jasa Konstruksi · Tuban, Jawa Timur',
      title: 'Membangun Asa|Menjadi Nyata.',
      lead: 'Bangun Asa Konstruksi hadir dengan pengalaman dan dedikasi tinggi untuk mewujudkan proyek impian Anda, dari rumah tinggal hingga bangunan komersial.',
      cta: 'Ajukan penawaran gratis',
      alt: 'Rumah dua lantai modern hasil proyek Bangun Asa Konstruksi',
    },
    trust: {
      aria: 'Jenis bangunan dan legalitas',
      clientsLabel: 'Yang kami bangun',
      clientsLead:
        'Dari hunian keluarga hingga ruang usaha: berbagai jenis bangunan dikerjakan dengan proses yang terencana dan transparan.',
      items: [
        'Rumah Tinggal',
        'Ruko',
        'Kantor',
        'Gudang',
        'Kafe & Restoran',
        'Renovasi Sebagian',
        'Renovasi Total',
        'Bangunan Komersial',
      ],
      legalLabel: 'Legalitas',
      legal: [
        { name: 'Badan usaha', text: 'PT BANGUN ASA KONSTRUKSI' },
        { name: 'Nomor Induk Berusaha (NIB)', text: '1106260081441' },
        { name: 'SK Kemenkumham (AHU)', text: 'AHU-A095587.AH.01.30.Tahun 2026' },
      ],
      certsLabel: 'Kompetensi',
      certsCaption:
        'Sertifikat kompetensi kerja tenaga ahli. Arahkan kursor untuk pratinjau, klik untuk melihat penuh dan zoom.',
      certs: [
        {
          title: 'Pengawas Lapangan Pekerjaan Drainase Perkotaan',
          kind: 'Sertifikat kompetensi',
          alt: 'Sertifikat kompetensi: Pengawas Lapangan Pekerjaan Drainase Perkotaan',
          attach: 'Lampiran',
          attachAlt: 'Lampiran sertifikat: Pengawas Lapangan Pekerjaan Drainase Perkotaan',
        },
        {
          title: 'Ahli Muda Perencana Pondasi',
          kind: 'Sertifikat kompetensi',
          alt: 'Sertifikat kompetensi: Ahli Muda Perencana Pondasi',
          attach: 'Lampiran',
          attachAlt: 'Lampiran sertifikat: Ahli Muda Perencana Pondasi',
        },
      ],
    },
    intro: {
      label: 'Tentang kami',
      text: 'Kami bukan sekadar kontraktor biasa. Kami adalah mitra pembangunan yang melayani rumah tinggal hingga bangunan komersial dengan presisi, perhatian, dan profesionalisme yang konsisten, dari renovasi kecil hingga proyek berskala besar.',
      imageAlt: 'Rumah minimalis modern hasil proyek Bangun Asa Konstruksi',
    },
    stats: [
      { text: 'Tahun berdiri PT Bangun Asa Konstruksi.' },
      { text: 'Klien dan proyek yang dipercayakan kepada kami.' },
      { text: 'Wilayah utama: Jawa Timur, Jawa Tengah, dan Jawa Barat.' },
    ],
    audience: {
      label: 'Untuk siapa kami bekerja',
      title: 'Mitra tepercaya bagi bisnis. Kontraktor ramah bagi rumah.',
      cards: [
        {
          tag: 'B2B',
          who: 'Ruko · Kantor · Gudang · Kafe & Restoran',
          title: 'Trusted partner',
          text: 'Arsitek, estimator, dan pengawas lapangan bekerja dalam satu sistem, memastikan setiap tahap pembangunan komersial berjalan efektif dengan kualitas yang konsisten.',
          points: [
            'Tim terintegrasi: arsitek, estimator, pengawas lapangan',
            'Estimasi RAB dan survei teknis sebelum proyek dimulai',
            'Kontrak jelas: ruang lingkup, nilai, jadwal, skema pembayaran',
            'Monitoring dan update progres berkala',
          ],
          cta: 'Ajukan penawaran',
          alt: 'Gedung bertingkat dengan derek menara saat konstruksi',
        },
        {
          tag: 'B2C',
          who: 'Pemilik rumah · Keluarga',
          title: 'Friendly contractor',
          text: 'Tempat keluarga bertumbuh. Kami membangun dan merenovasi hunian dengan standar mutu tinggi, material sesuai spesifikasi, dan pengawasan menyeluruh.',
          points: [
            'Konsultasi gratis, tanpa risiko sampai Anda yakin',
            'Anggaran fleksibel, disesuaikan kemampuan investasi Anda',
            'Anggaran, material, dan jadwal dijelaskan secara terbuka',
            'Laporan progres yang bisa Anda pantau',
          ],
          cta: 'Konsultasikan rumah Anda',
          alt: 'Teras dan fasad rumah minimalis hasil proyek Bangun Asa Konstruksi',
        },
      ],
    },
    services: {
      label: 'Layanan',
      title: 'Dari rumah hingga ruang usaha, dibangun dengan benar sejak awal.',
      cta: 'Diskusikan layanan ini',
      items: [
        {
          title: 'Pembangunan Unit Baru',
          text: 'Rumah tinggal, ruko, kantor, gudang, kafe, restoran, hingga bangunan komersial lainnya, dikerjakan melalui proses yang terencana, transparan, dan berorientasi pada kualitas.',
        },
        {
          title: 'Jasa Renovasi',
          text: 'Renovasi sebagian maupun total untuk rumah tinggal dan bangunan komersial, meningkatkan fungsi, kenyamanan, dan nilai bangunan Anda.',
        },
        {
          title: 'Renovasi Total',
          text: 'Pembaruan menyeluruh dari awal hingga akhir: perencanaan ulang struktur, pemilihan material, hingga eksekusi di lapangan.',
        },
        {
          title: 'Bangunan Komersial',
          text: 'Ruko, kantor, gudang, kafe, dan restoran dibangun oleh tim arsitek, estimator, dan pengawas lapangan yang bekerja terintegrasi.',
        },
      ],
    },
    work: {
      label: 'Karya terpilih',
      title: 'Setiap bangunan dikerjakan dengan presisi dan perhatian.',
      /** Daftar proyek ada di src/data/content/projects.json (diedit lewat CMS). */
      end: { label: 'Proyek berikutnya', title: 'Bisa jadi milik Anda.' },
    },
    process: {
      label: 'Cara kami bekerja',
      title: 'Enam langkah, satu standar yang sama.',
      lead: 'Dari konsultasi pertama hingga serah terima, tim kami mendampingi Anda di setiap tahap, dengan proses yang mengutamakan kejelasan, perencanaan matang, dan kualitas yang terjaga.',
      steps: [
        {
          title: 'Konsultasi',
          text: 'Kami mulai dari konsultasi awal untuk memahami kebutuhan, lokasi, dan anggaran Anda.',
        },
        {
          title: 'Perencanaan',
          text: 'Estimasi RAB, survei teknis ke lokasi, hingga finalisasi desain dan anggaran. Semua disepakati sebelum proyek dimulai.',
        },
        {
          title: 'Kontrak',
          text: 'Kesepakatan dituangkan dalam kontrak yang jelas: ruang lingkup, nilai proyek, jadwal, dan skema pembayaran.',
        },
        {
          title: 'Pelaksanaan',
          text: 'Pekerjaan pembangunan atau renovasi berjalan sesuai rencana, dengan monitoring dan update progres berkala.',
        },
        { title: 'Finishing', text: 'Tahap penyelesaian akhir agar setiap detail rapi dan sesuai spesifikasi.' },
        {
          title: 'Quality control',
          text: 'Pengecekan menyeluruh untuk memastikan hasil sesuai spesifikasi, rapi, dan siap diserahterimakan kepada Anda.',
        },
      ],
    },
    team: {
      label: 'Tim',
      title: 'Orang-orang di balik setiap bangunan.',
      lead: 'Arsitek, estimator, pengawas lapangan, dan tenaga konstruksi bekerja dalam satu sistem agar setiap tahap berjalan efektif dan terkoordinasi.',
      alt: 'Foto tim Bangun Asa Konstruksi: sembilan anggota tim dengan nama dan jabatan masing-masing',
      members: [
        { name: 'Pandu Ario Pratanu', role: 'General Manager' },
        { name: 'Hujan Setiakita', role: 'Project Manager' },
        { name: 'Joko Sunarto', role: 'Supervisor' },
        { name: 'Mu’tashimuddin', role: 'Humas & Legal' },
        { name: 'M. Fatchul Riski', role: 'Pengawas Lapangan' },
        { name: 'Rayana Surya Wiranata', role: 'Pengawas Lapangan' },
        { name: 'Reza Aprilia', role: 'Project Admin' },
        { name: 'Islamiana Darma Siwi', role: 'Customer Service' },
        { name: 'Lifyatin Nuzulul Rohmah', role: 'Arsitek' },
      ],
    },
    quote: {
      label: 'Kata mereka',
      /** "|" = pindah baris. Isi testimoni ada di src/data/testimonials.ts. */
      title: 'Dipercaya langsung|oleh klien kami.',
      translated: '',
      original: '',
      share: 'Pernah memakai jasa kami?',
      shareCta: 'Kirim testimoni lewat WhatsApp',
      shareText: 'Halo Bangun Asa Konstruksi, saya ingin mengirim testimoni tentang layanan kalian.',
    },
    faq: {
      label: 'FAQ',
      title: 'Pertanyaan yang sering diajukan.',
      items: [
        {
          q: 'Apa bedanya Bangun Asa dengan kontraktor lain?',
          a: 'Kami mengutamakan transparansi di setiap proses, mulai dari penyusunan anggaran, spesifikasi material, jadwal pelaksanaan, hingga laporan progres, sehingga klien bisa memantau proyek dengan jelas. Kami juga fleksibel menyesuaikan anggaran, tanpa mengabaikan keamanan, fungsi, dan kualitas bangunan.',
        },
        {
          q: 'Apakah konsultasi dikenakan biaya?',
          a: 'Tidak. Anda mendapat konsultasi gratis untuk kebutuhan pembangunan atau renovasi, lengkap dengan estimasi anggaran yang transparan dan fleksibel menyesuaikan kemampuan investasi Anda. Tidak ada risiko sampai Anda benar-benar yakin.',
        },
        {
          q: 'Berapa lama proses pengerjaan proyek berlangsung?',
          a: 'Durasi bergantung pada skala, kompleksitas, dan jenis bangunan. Rumah tinggal biasanya memakan waktu beberapa bulan, sementara proyek komersial bisa lebih lama. Kami menyusun jadwal pelaksanaan yang detail sejak tahap perencanaan, dengan laporan progres berkala.',
        },
        {
          q: 'Wilayah mana saja yang dilayani Bangun Asa Konstruksi?',
          a: 'Mayoritas proyek kami berada di Jawa Timur, namun kami juga dipercaya mengerjakan proyek di Jawa Tengah, Jawa Barat, dan wilayah lain di Pulau Jawa.',
        },
        {
          q: 'Mengapa perencanaan sejak awal itu penting?',
          a: 'Tanpa perencanaan matang, anggaran bisa membengkak karena perubahan desain di tengah jalan, dokumen legalitas dan perizinan bisa menghambat proses, dan waktu pengerjaan bisa molor. Persiapan sejak awal juga membuat bangunan lebih tahan lama dengan biaya perbaikan yang minim.',
        },
      ],
    },
  },
};

export type Dict = typeof id;
