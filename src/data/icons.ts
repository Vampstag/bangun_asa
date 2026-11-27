/**
 * Ikon garis minimal (viewBox 24x24; garis mengikuti warna teks). Dipakai lewat komponen Icon.astro dan di Process.astro.
 * Tambah ikon baru cukup dengan menambah satu baris di sini.
 */
export const ICONS = {
  consult:
    '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h-.5A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 9h8M8 12h5"/>',
  survey: '<path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>',
  plan: '<path d="M4 20V4l16 16z"/><path d="M8 16v-5l5 5z"/>',
  contract: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="m9.5 14.5 2 2 3.5-4"/>',
  build: '<path d="M5 16a7 7 0 0 1 14 0"/><path d="M3 16h18v3H3z"/><path d="M12 9v3"/>',
  quality: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  handover: '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21M18 12v3M15 12v2"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  tools: '<path d="M14 7a4 4 0 0 0 5 5l-9.5 9.5a2.1 2.1 0 0 1-3-3L16 9a4 4 0 0 0-2-2z"/>',
  layout: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 11h8M12 4v16M12 15h8"/>',
  shop: '<path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.9.3 5 2.6 5 5.8"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21 12 18.5 16.5 21 15 13.5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  office:
    '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-3h4v3"/>',
  warehouse: '<path d="M3 10 12 4l9 6v11H3z"/><path d="M8 21v-7h8v7"/><path d="M8 17.5h8"/>',
  cafe: '<path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5v2.5M12 3.5v2.5"/>',
  repair:
    '<rect x="4" y="4" width="14" height="5" rx="1"/><path d="M18 6.5h2v4h-8v3"/><rect x="10.5" y="13.5" width="3" height="7" rx="1"/>',
  commercial: '<path d="M3 21V9l6-3v15"/><path d="M9 21V4l12 4v13"/><path d="M3 21h18"/><path d="M13 11h4M13 15h4"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
} as const;

export type IconName = keyof typeof ICONS;
