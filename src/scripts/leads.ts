/**
 * Prospek dari situs: (1) sistem giliran nomor CS dan (2) pelacakan klik.
 *
 * Giliran (mode "giliran" di dashboard): situs ini statis (tanpa server), jadi pembagiannya acak merata, bukan 1-2-1-2 ketat.
 * Tiap pengunjung baru mendapat satu CS dan tetap ke CS yang sama selama 30 hari, supaya satu calon klien tidak pindah-pindah
 * admin. Tautan yang memang menuju orang tertentu (daftar CS di menu dan footer) ditandai data-wa-fixed dan tidak diubah.
 *
 * Pelacakan: setiap klik WhatsApp, telepon, kirim form, kalkulator, sosial, dan peta dikirim ke GA4, TikTok Pixel, dan
 * Meta Pixel bila ID-nya diisi (dashboard, "Pelacakan iklan dan statistik"). Isian pribadi (nama, lokasi) tidak dikirim.
 */
interface Cs {
  name: string;
  tel: string;
}
interface Contact {
  mode: 'giliran' | 'pilih';
  cs: Cs[];
}
type Fn = (...args: unknown[]) => void;
type Tags = Window & {
  gtag?: Fn;
  ttq?: { track: Fn; page: Fn };
  fbq?: Fn;
  __baEvents?: { name: string; params: Record<string, string> }[];
};

const KEY = 'ba-cs';
const KEEP = 30 * 24 * 3600 * 1000;
const digits = (tel: string) => tel.replace(/\D/g, '');

function contact(): Contact | null {
  try {
    return JSON.parse(document.getElementById('ba-contact')?.textContent ?? 'null') as Contact | null;
  } catch {
    return null;
  }
}

let memo: Cs | null = null;

/** CS untuk pengunjung ini. */
export function assignedCs(): Cs | null {
  const c = contact();
  if (!c?.cs.length) return null;
  if (c.mode !== 'giliran') return c.cs[0];
  if (memo && c.cs.some((p) => p.tel === memo?.tel)) return memo;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { tel: string; at: number } | null;
    const hit = saved && Date.now() - saved.at < KEEP ? c.cs.find((p) => p.tel === saved.tel) : undefined;
    if (hit) return (memo = hit);
  } catch {
    /* penyimpanan diblokir: tetap diacak, diingat selama halaman terbuka */
  }
  const pick = c.cs[crypto.getRandomValues(new Uint32Array(1))[0] % c.cs.length];
  try {
    localStorage.setItem(KEY, JSON.stringify({ tel: pick.tel, at: Date.now() }));
  } catch {
    /* diabaikan */
  }
  return (memo = pick);
}

/** Arahkan tautan WhatsApp/telepon umum ke CS giliran. */
function route(a: HTMLAnchorElement) {
  if (contact()?.mode !== 'giliran' || a.closest('[data-wa-fixed]')) return;
  const href = a.getAttribute('href') ?? '';
  const cs = assignedCs();
  if (!cs) return;
  if (href.startsWith('https://wa.me/')) a.setAttribute('href', href.replace(/wa\.me\/\d+/, `wa.me/${digits(cs.tel)}`));
  else if (href.startsWith('tel:')) a.setAttribute('href', `tel:${cs.tel}`);
}

/** Dari bagian mana klik terjadi (dipakai untuk melihat tombol mana yang menghasilkan chat). */
function placement(el: Element): string {
  const places: [string, string][] = [
    ['.mbar', 'bilah_bawah_hp'],
    ['.wa-pop', 'pilih_cs'],
    ['[data-wa-pill]', 'tombol_melayang'],
    ['.menu', 'menu'],
    ['.hdr', 'header'],
    ['.ftr', 'footer'],
    ['.hero', 'hero'],
    ['.cph', 'ajakan_foto'],
  ];
  for (const [sel, name] of places) if (el.closest(sel)) return name;
  return el.closest('section[id]')?.id || 'lainnya';
}

const TIKTOK: Record<string, string> = { whatsapp_click: 'Contact', phone_click: 'Contact', form_submit: 'SubmitForm' };
const META: Record<string, string> = { whatsapp_click: 'Contact', phone_click: 'Contact', form_submit: 'Lead' };

export function track(name: string, params: Record<string, string> = {}) {
  const w = window as Tags;
  const data = { page: location.pathname, ...params };
  (w.__baEvents ??= []).push({ name, params: data });
  if (import.meta.env.DEV) console.debug('[lacak]', name, data);
  w.gtag?.('event', name, data);
  if (name in TIKTOK) {
    w.gtag?.('event', 'generate_lead', { method: name, ...data });
    w.ttq?.track(TIKTOK[name], { content_name: params.placement ?? name });
    w.fbq?.('track', META[name], { content_name: params.placement ?? name });
  }
}

document.addEventListener(
  'click',
  (e) => {
    const a = (e.target as Element).closest?.('a');
    if (!a) return;
    route(a);
    const href = a.getAttribute('href') ?? '';
    const where = placement(a);
    if (href.startsWith('https://wa.me/')) {
      const num = href.slice('https://wa.me/'.length).split('?')[0];
      const cs = contact()?.cs.find((p) => digits(p.tel) === num);
      track('whatsapp_click', { placement: where, cs: cs?.name ?? 'lainnya' });
    } else if (href.startsWith('tel:')) track('phone_click', { placement: where });
    else if (/tiktok\.com|instagram\.com/.test(href))
      track('social_click', { placement: where, network: href.includes('tiktok') ? 'tiktok' : 'instagram' });
    else if (/maps\.app\.goo\.gl|google\.com\/maps/.test(href)) track('directions_click', { placement: where });
  },
  { capture: true },
);

// kalkulator: cukup dicatat sekali per kunjungan halaman, saat pertama kali diubah
let calcSeen = false;
document.addEventListener('change', (e) => {
  if (calcSeen || !(e.target as Element).closest?.('[data-calc]')) return;
  calcSeen = true;
  track('calculator_use');
});

document.addEventListener('astro:page-load', () => {
  calcSeen = false;
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"], a[href^="tel:"]')) route(a);
  const w = window as Tags;
  w.gtag?.('event', 'page_view', { page_location: location.href, page_title: document.title });
  w.ttq?.page();
  w.fbq?.('track', 'PageView');
});
