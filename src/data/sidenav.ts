/**
 * Daftar section untuk navigasi samping (SideNav.astro), per halaman, berurutan dari atas ke bawah.
 * Isinya id elemen di halaman; label tampilnya ada di kamus bahasa (ui.side). Section yang tidak ada di halaman
 * (mis. media sosial bila belum ada video) dilewati otomatis oleh skrip.
 */
export type SidePage = 'home' | 'projects' | 'services' | 'calculator' | 'about';

export const SIDE_NAV: Record<SidePage, string[]> = {
  home: ['top', 'legalitas', 'karya', 'layanan', 'hitung', 'testimoni', 'proses', 'faq', 'sosial', 'kontak'],
  projects: ['top', 'proyek', 'kontak'],
  services: ['top', 'cakupan', 'proses', 'faq', 'kontak'],
  calculator: ['top', 'kalkulator', 'dasar', 'catatan', 'kontak'],
  about: ['top', 'cerita', 'visi', 'alasan', 'sosial', 'tim', 'legalitas', 'kontak'],
};
