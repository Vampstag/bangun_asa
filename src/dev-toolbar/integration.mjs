/**
 * Integrasi lokal: menambah aplikasi kustom ke Astro Dev Toolbar.
 * Hanya aktif saat `npm run dev`; tidak pernah masuk ke hasil build.
 */
const icon = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export default function devToolbarApps() {
  return {
    name: 'bangun-asa-dev-toolbar',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: 'ba-grid',
          name: 'Grid (G)',
          icon: icon('<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18"/>'),
          entrypoint: new URL('./grid-app.ts', import.meta.url),
        });
        addDevToolbarApp({
          id: 'ba-responsive',
          name: 'Responsive',
          icon: icon(
            '<rect x="2.5" y="5" width="13" height="10" rx="1"/><rect x="14" y="9" width="7.5" height="10.5" rx="1"/>',
          ),
          entrypoint: new URL('./responsive-app.ts', import.meta.url),
        });
      },
    },
  };
}
