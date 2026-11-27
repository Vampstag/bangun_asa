#!/usr/bin/env node
/**
 * Sinkron profil dan video terbaru TikTok ke situs.
 *
 * Kenapa skrip, bukan "otomatis dari browser pengunjung": TikTok tidak punya API publik gratis untuk daftar video
 * sebuah akun, halaman profilnya hanya terisi di browser sungguhan, dan thumbnail-nya berupa tautan bertanda tangan
 * yang kedaluwarsa. Jadi skrip ini membuka halaman profil di Chrome (tanpa tampilan), membaca data publiknya,
 * mengunduh thumbnail ke repo (supaya tidak bergantung pada tautan yang kedaluwarsa), lalu menulis:
 *   - src/data/content/tiktok.json   profil (nama, pengikut) dan daftar video terbaru
 *   - src/assets/social/tt-<id>.webp thumbnail yang sudah dioptimasi
 * Situs membaca dua hal itu saat build. Dijalankan terjadwal oleh .github/workflows/sync-tiktok.yml, atau manual:
 * npm run sync:tiktok
 *
 * Hanya menulis bila ADA VIDEO BARU (atau data sudah lebih dari 30 hari). Selain itu tidak ada file yang berubah,
 * jadi tidak ada commit dan tidak ada deploy. Bila TikTok memblokir atau halaman kosong, skrip berhenti TANPA
 * mengubah data yang sudah ada. Satu kali buka profil per jalankan; hanya membaca data publik, tanpa kunci atau akun.
 *
 * Opsi: --dry (tampilkan saja, jangan tulis file) · --force (tulis ulang walau tidak ada video baru)
 *       --from-file=data.json (mode uji tanpa browser dan tanpa internet: pakai data dari berkas)
 * Env:  TIKTOK_MAX=8 (jumlah video) · CHROME_PATH=/jalur/chrome · TIKTOK_OUT_JSON / TIKTOK_OUT_DIR (tujuan keluaran, untuk uji)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = process.env.TIKTOK_OUT_JSON || path.join(ROOT, 'src/data/content/tiktok.json');
const OUT_DIR = process.env.TIKTOK_OUT_DIR || path.join(ROOT, 'src/assets/social');
const FROM_FILE = (process.argv.find((a) => a.startsWith('--from-file=')) || '').slice('--from-file='.length);
const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');
const MAX = Number(process.env.TIKTOK_MAX || 8);

const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/content/settings.json'), 'utf8'));
const handle = (String(settings.tiktok || '').match(/@([\w.]+)/) || [])[1];
if (!handle) fail('Akun TikTok belum diisi di src/data/content/settings.json (field "tiktok", mis. https://www.tiktok.com/@nama).');

function fail(msg) {
  console.error(`sync-tiktok: ${msg}`);
  process.exit(1);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

/** Dijalankan DI DALAM halaman TikTok (bukan di Node). Hanya yang dipakai situs: id video dan thumbnail. */
function extractInPage() {
  const text = (sel) => {
    const el = document.querySelector(`[data-e2e="${sel}"]`);
    return el ? el.innerText.trim() : '';
  };
  const items = [...document.querySelectorAll('[data-e2e="user-post-item"]')]
    .map((card) => {
      const a = card.querySelector('a[href*="/video/"]');
      if (!a) return null;
      const id = (a.href.match(/\/video\/(\d+)/) || [])[1];
      const img = card.querySelector('img');
      return { id, cover: img ? img.src : '' };
    })
    .filter((x) => x && x.id);
  return {
    name: text('user-title'),
    handle: text('user-subtitle'),
    followers: text('followers-count'),
    items,
  };
}

/** Membuka profil di Chrome tanpa tampilan dan mengembalikan data profil + video (lihat extractInPage). */
async function scrape() {
  const chromePath = findChrome();
  if (!chromePath) fail('Chrome/Edge tidak ditemukan. Pasang Chrome atau set env CHROME_PATH.');

  const port = 9222 + Math.floor(Math.random() * 600);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-tt-'));
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--lang=en-US',
    '--disable-blink-features=AutomationControlled',
    '--window-size=1280,900',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    ...(process.env.CI ? ['--no-sandbox'] : []),
    'about:blank',
  ];
  const chrome = spawn(chromePath, args, { stdio: 'ignore' });
  const cleanup = () => {
    try {
      chrome.kill();
    } catch { /* diabaikan */ }
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch { /* diabaikan */ }
  };
  process.on('exit', cleanup);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let targets;
  for (let i = 0; i < 60; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      if (targets.length) break;
    } catch { /* diabaikan */ }
    await sleep(250);
  }
  if (!targets) fail('Tidak bisa terhubung ke Chrome.');
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evalValue = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;

  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  // Tampil sebagai Chrome biasa (tanpa tulisan "Headless" di user agent), supaya tidak langsung dianggap bot.
  const version = await send('Browser.getVersion');
  const ua = version.result?.userAgent?.replace('HeadlessChrome', 'Chrome');
  if (ua) await send('Emulation.setUserAgentOverride', { userAgent: ua });
  await send('Page.enable');
  await send('Page.navigate', { url: `https://www.tiktok.com/@${handle}` });

  // Tunggu sampai kartu video muncul (halaman diisi lewat JavaScript).
  const countPosts = async () => (await evalValue(`document.querySelectorAll('[data-e2e="user-post-item"]').length`)) || 0;
  let count = 0;
  for (let attempt = 1; attempt <= 3 && !count; attempt++) {
    for (let i = 0; i < 40 && !count; i++) {
      await sleep(500);
      count = await countPosts();
    }
    if (count) break;
    // TikTok kadang membalas "Something went wrong" sementara (pembatasan akses). Tekan Refresh, tunggu makin lama, coba lagi.
    const clicked = await evalValue(
      `(() => { const b = [...document.querySelectorAll('button')].find((x) => /^refresh$/i.test(x.innerText.trim())); if (b) { b.click(); return true; } return false; })()`,
    );
    console.warn(`  percobaan ${attempt}/3: daftar video belum muncul${clicked ? ', menekan Refresh' : ''}`);
    await sleep(10000 * attempt);
  }
  if (!count) fail('Daftar video tidak muncul (diblokir atau dibatasi sementara oleh TikTok). Data lama tidak diubah.');
  for (let y = 0; y < 1800; y += 450) {
    await evalValue(`window.scrollTo(0, ${y})`);
    await sleep(500);
  }
  await sleep(1200);

  const data = await evalValue(`(${extractInPage.toString()})()`);
  ws.close();
  cleanup();
  return data;
}

async function main() {
  const data = FROM_FILE ? JSON.parse(fs.readFileSync(FROM_FILE, 'utf8')) : await scrape();

  if (!data || !data.items || !data.items.length) fail('Data video kosong. Data lama tidak diubah.');
  // Urutan: video TERBARU lebih dulu. ID video TikTok berurutan menurut waktu unggah (makin besar makin baru), jadi video
  // yang disematkan di profil tidak mendapat tempat khusus dan video baru langsung tampil di depan.
  const newestFirst = (a, b) => (BigInt(b.id) > BigInt(a.id) ? 1 : BigInt(b.id) < BigInt(a.id) ? -1 : 0);
  const videos = data.items.filter((v) => v.cover).sort(newestFirst).slice(0, MAX);
  if (!videos.length) fail('Thumbnail tidak ditemukan. Data lama tidak diubah.');

  if (DRY) {
    console.log(JSON.stringify({ ...data, items: videos.map((v) => ({ ...v, cover: v.cover.slice(0, 70) + '…' })) }, null, 2));
    return;
  }

  // Tidak ada video baru? Biarkan semuanya apa adanya: tidak ada perubahan file, jadi tidak ada commit dan tidak ada deploy.
  // Jumlah pengikut ikut diperbarui hanya bila ada video baru, atau data sudah lebih dari 30 hari (supaya tidak ada
  // commit setiap hari hanya karena angka pengikut bergeser).
  const signature = (list) => list.map((v) => v.id).join(',');
  let prev = null;
  try {
    prev = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
  } catch { /* belum ada data sebelumnya */ }
  const ageDays = prev ? (Date.now() - new Date(prev.fetchedAt).getTime()) / 864e5 : Infinity;
  if (!FORCE && prev && signature(prev.videos) === signature(videos) && ageDays < 30) {
    console.log('sync-tiktok: tidak ada video baru, data tidak diubah.');
    return;
  }

  // Unduh dan optimasi thumbnail ke repo (tautan aslinya bertanda tangan dan kedaluwarsa). Yang sudah ada dipakai ulang.
  const sharp = require(path.join(ROOT, 'node_modules/sharp'));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const saved = [];
  let added = 0;
  for (const v of videos) {
    try {
      const file = `tt-${v.id}.webp`;
      const dest = path.join(OUT_DIR, file);
      if (!fs.existsSync(dest)) {
        let bytes;
        if (FROM_FILE && fs.existsSync(v.cover)) {
          bytes = fs.readFileSync(v.cover); // mode uji: cover berupa berkas lokal
        } else {
          const res = await fetch(v.cover, { headers: { referer: 'https://www.tiktok.com/' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          bytes = Buffer.from(await res.arrayBuffer());
        }
        await sharp(bytes)
          .resize({ width: 720, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(dest);
        added++;
      }
      saved.push({
        id: v.id,
        url: `https://www.tiktok.com/@${handle}/video/${v.id}`,
        cover: file,
      });
    } catch (e) {
      console.warn(`  lewati video ${v.id}: ${e.message}`);
    }
  }
  if (!saved.length) fail('Semua thumbnail gagal diunduh. Data lama tidak diubah.');

  // Hapus thumbnail lama yang sudah tidak dipakai.
  const keep = new Set(saved.map((v) => v.cover));
  for (const f of fs.readdirSync(OUT_DIR)) if (f.startsWith('tt-') && !keep.has(f)) fs.rmSync(path.join(OUT_DIR, f));

  const out = {
    _info: 'Dihasilkan oleh tools/sync-tiktok.cjs (npm run sync:tiktok). Jangan diedit manual; jalankan ulang skrip untuk memperbarui.',
    fetchedAt: new Date().toISOString().slice(0, 10),
    profile: {
      handle: data.handle || handle,
      name: data.name || handle,
      followers: data.followers,
      url: `https://www.tiktok.com/@${handle}`,
    },
    videos: saved,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n');
  console.log(`sync-tiktok: ${saved.length} video (${added} thumbnail baru), ${data.followers} pengikut -> src/data/content/tiktok.json`);
}

main().catch((e) => fail(e.message));
