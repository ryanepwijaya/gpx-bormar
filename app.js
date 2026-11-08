/* GPX Bormar — interaktif. Data: window.ROUTE (data.js) */
(() => {
'use strict';
const R = window.ROUTE;
const KM = R.km, ELE = R.ele, LAT = R.lat, LON = R.lon, N = KM.length, TOT = KM[N - 1];
const $ = s => document.querySelector(s);
const root = document.documentElement;
const css = n => getComputedStyle(root).getPropertyValue(n).trim();
let C = {};
function readColors() {
  C = { orange: css('--orange'), orange2: css('--orange-2'), deep: css('--orange-deep'), peach: css('--peach'),
    blue: css('--blue'), blue2: css('--blue-2'), teal: css('--teal'), amber: css('--amber'), red: css('--red'), violet: css('--violet'),
    flat: css('--flat'), ink: css('--ink'), ink2: css('--ink-2'), muted: css('--muted'), line: css('--line'), surface: css('--surface'),
    tint: css('--tint'), dark: css('--dark') };
}
readColors();
const isDark = () => matchMedia('(prefers-color-scheme: dark)').matches && root.dataset.theme !== 'light' || root.dataset.theme === 'dark';

/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt1 = v => (Math.round(v * 10) / 10).toFixed(1);
const pad2 = n => String(n).padStart(2, '0');
const mmss = s => { s = Math.round(s); return `${Math.floor(s / 60)}:${pad2(s % 60)}`; };
const hms = s => { s = Math.round(s); const h = Math.floor(s / 3600); return `${h}:${pad2(Math.floor(s % 3600 / 60))}:${pad2(s % 60)}`; };
const hm = s => { s = Math.round(s / 60) * 60; return `${Math.floor(s / 3600)}:${pad2(Math.floor(s % 3600 / 60))}`; };
const clock = s => { s = Math.round(s / 60) * 60; return `${pad2(Math.floor(s / 3600) % 24)}:${pad2(Math.floor(s % 3600 / 60))}`; };
const tsec = t => { const [h, m] = t.split(':').map(Number); return h * 3600 + m * 60; };
function idx(km) { let lo = 0, hi = N - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; KM[m] <= km ? lo = m : hi = m; } return (km - KM[lo] < KM[hi] - km) ? lo : hi; }
function eleAt(km) { km = clamp(km, 0, TOT); let i = idx(km); if (KM[i] > km && i > 0) i--; const j = Math.min(N - 1, i + 1); const t = KM[j] > KM[i] ? (km - KM[i]) / (KM[j] - KM[i]) : 0; return ELE[i] + t * (ELE[j] - ELE[i]); }
const GR = KM.map((_, k) => { const a = Math.max(0, k - 3), b = Math.min(N - 1, k + 3); return (ELE[b] - ELE[a]) / ((KM[b] - KM[a]) * 1000) * 100; });
const GR200 = KM.map((_, k) => { const b = Math.min(N - 1, k + 4); return b > k ? (ELE[b] - ELE[k]) / ((KM[b] - KM[k]) * 1000) * 100 : 0; });
const CLS = ['up2', 'up1', 'flat', 'dn1', 'dn2'];
const clsOf = g => g > 1.5 ? 'up2' : g > 0.5 ? 'up1' : g >= -0.5 ? 'flat' : g >= -1.5 ? 'dn1' : 'dn2';
const clsColor = c => ({ up2: C.deep, up1: C.orange2, flat: C.flat, dn1: C.blue2, dn2: C.blue })[c];
const CLS_LABEL = { up2: 'naik >1.5%', up1: 'naik 0.5–1.5%', flat: 'datar ±0.5%', dn1: 'turun 0.5–1.5%', dn2: 'turun >1.5%' };
const CLS_SHORT = { up2: 'naik curam', up1: 'naik landai', flat: 'datar', dn1: 'turun landai', dn2: 'turun curam' };

function stats(a, b) {
  const i = idx(Math.min(a, b)), j = idx(Math.max(a, b));
  let gain = 0, loss = 0, hi = -1e9, lo = 1e9, hiK = 0, loK = 0, maxUp = 0, maxDn = 0;
  for (let k = i; k <= j; k++) {
    if (k > i) { const d = ELE[k] - ELE[k - 1]; d > 0 ? gain += d : loss -= d; }
    if (ELE[k] > hi) { hi = ELE[k]; hiK = KM[k]; } if (ELE[k] < lo) { lo = ELE[k]; loK = KM[k]; }
    if (k + 4 <= j) { const g = (ELE[k + 4] - ELE[k]) / ((KM[k + 4] - KM[k]) * 1000) * 100; maxUp = Math.max(maxUp, g); maxDn = Math.min(maxDn, g); }
  }
  const dist = KM[j] - KM[i], net = ELE[j] - ELE[i];
  return { a: KM[i], b: KM[j], dist, gain, loss, net, avg: dist > 0 ? net / (dist * 1000) * 100 : 0, maxUp, maxDn, hi, lo, hiK, loK };
}

/* ---------- route knowledge ---------- */
const CLIMBS = [
  { id: 'T1', a: 10.3, b: 14.3, c: '--orange-deep', note: 'Terpanjang. Mulai tepat sesudah COP1 dan berakhir di titik tertinggi rute (298 m). Makin curam menjelang km 13–14.', tip: 'Pegang effort, bukan pace. Sesudah puncaknya, turunan panjang sampai km 19 sudah menunggu.' },
  { id: 'T2', a: 21.8, b: 24.9, c: '--red', note: 'Didahului turunan pendek yang tajam (±−4.5%, km 21.6–21.8), lalu langsung naik di bagian paling curam se-rute (±3.9% selama ±200 m). Sesudah itu melandai sampai km 25.', tip: 'Pendekkan langkah sebelum km 22. Jangan terpancing semangat “sudah setengah jalan”.' },
  { id: 'T3', a: 29.4, b: 31.2, c: '--amber', note: 'Pendek, tapi datang di sekitar km 30, saat kaki dan cadangan energi mulai menipis.', tip: 'Isi energi sekitar km 28. Sesudah puncaknya, km 31–34 turun lagi.' },
  { id: 'T4', a: 35.9, b: 41.4, c: '--violet', note: 'Hampir tak terasa naik (0.5%), tapi 5.5 km di ujung lomba. Km 40–41 sedikit menanjak sebelum turun ke finish.', tip: 'Pecah jadi target kecil per 1 km. Turunan dari km 41.4 ke finish jadi hadiahnya.' }
];
const DESC = [
  { id: 'D1', a: 14.3, b: 18.7, t: 'Panjang & landai, hadiah sesudah T1. Tempat menabung waktu tanpa ngebut.' },
  { id: 'D2', a: 31.2, b: 33.5, t: 'Km 33 turun rata-rata −2.7% sepanjang 1 km, turunan panjang paling curam. Langkah ringan, jaga paha untuk 9 km terakhir.' }
];
const COPS = [{ n: 'COP 1', km: 10, close: '06:05' }, { n: 'COP 2', km: 20, close: '07:35' }, { n: 'COP 3', km: 34.5, close: '09:50' }, { n: 'FINISH', km: 42.195, close: '11:00' }];
const WAVES = [{ n: 'W1', t: '04:15' }, { n: 'W2', t: '04:20' }, { n: 'W3', t: '04:25' }, { n: 'W4', t: '04:30' }];
const SECTIONS = [
  { a: 0, b: 5, n: 'Start & pemanasan', t: 'flat', d: 'Beberapa gelombang kecil naik-turun. Keramaian start: jangan zig-zag menyalip, biarkan badan panas dulu.' },
  { a: 5, b: 10.3, n: 'Menuju COP 1', t: 'flat', d: 'Hampir datar dengan naik sangat landai. Temukan ritme. Untuk wave terakhir, buffer COP 1 paling tipis, jadi jangan terlalu santai.' },
  { a: 10.3, b: 14.3, n: 'T1: tanjakan terpanjang', t: 'up', d: '4 km menuju titik tertinggi rute. Effort, bukan pace. Gel sekitar km 9.' },
  { a: 14.3, b: 21.8, n: 'Turunan panjang', t: 'down', d: 'Bagian turun terpanjang, diselingi beberapa naik kecil. Tempat menabung waktu, tapi jangan ngebut: separuh lomba belum lewat.' },
  { a: 21.8, b: 24.9, n: 'T2: pembuka paling curam', t: 'up', d: 'Sesudah HALF ada lembah kecil, lalu naik ±3.9% (±200 m) dan landai sampai km 25. Gel sekitar km 20.' },
  { a: 24.9, b: 29.4, n: 'Turunan landai', t: 'down', d: 'Pulihkan napas dan atur ulang ritme sebelum masuk 10 km terakhir.' },
  { a: 29.4, b: 31.2, n: 'T3: pendek di km 30', t: 'up', d: 'Pendek, tapi di sinilah “tembok” sering terasa. Energi sekitar km 28.' },
  { a: 31.2, b: 35.9, n: 'Turunan km 31–36', t: 'down', d: 'Km 33 paling curam turunnya. Langkah cepat dan pendek, jangan mengerem.' },
  { a: 35.9, b: 41.4, n: 'T4: naik landai 5.5 km', t: 'up', d: 'Cuma 0.5%, tapi panjang dan di ujung. Pecah per km, fokus ke papan km berikutnya.' },
  { a: 41.4, b: 42.195, n: 'Turun ke finish', t: 'down', d: 'Sisa tenaga, nikmati. Ini yang kamu latih berbulan-bulan.' }
];
CLIMBS.forEach(c => Object.assign(c, { s: stats(c.a, c.b) }));
DESC.forEach(d => Object.assign(d, { s: stats(d.a, d.b) }));
const ALL = stats(0, TOT);
$('#hsGain').dataset.count = Math.floor(ALL.gain); $('#hsHi').dataset.count = Math.round(ALL.hi); $('#hsRange').dataset.count = Math.round(ALL.hi - ALL.lo);
function segName(km) {
  for (const c of CLIMBS) if (km >= c.a && km <= c.b) return `${c.id} · tanjakan (km ${c.a}–${c.b})`;
  for (const s of SECTIONS) if (km >= s.a && km < s.b) return s.n;
  return 'Finish';
}

/* ---------- state ---------- */
const S = { cur: 0, sel: [10.3, 14.3], hl: null, scale: 'real', playing: false, follow: true };
const listeners = { cur: [], sel: [], hl: [] };
const on = (k, f) => listeners[k].push(f);
function setCur(km, src) { S.cur = clamp(km, 0, TOT); listeners.cur.forEach(f => f(src)); }
function setSel(a, b, src) { if (a > b) [a, b] = [b, a]; S.sel = [clamp(a, 0, TOT), clamp(b, 0, TOT)]; listeners.sel.forEach(f => f(src)); }
function setHl(c) { S.hl = S.hl === c ? null : c; listeners.hl.forEach(f => f()); }

/* ---------- canvas profile ---------- */
function prep(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  return { g, w, h };
}
function drawProfile(cv, o) {
  const { g, w, h } = prep(cv);
  const from = o.from ?? 0, to = o.to ?? TOT, pl = 38, pr = 10, pt = o.labels ? 34 : 14, pb = 24;
  const i0 = idx(from), i1 = idx(to);
  let ymin, ymax;
  if (o.scale === 'real') { ymin = 0; ymax = 450; }
  else { let mn = 1e9, mx = -1e9; for (let k = i0; k <= i1; k++) { mn = Math.min(mn, ELE[k]); mx = Math.max(mx, ELE[k]); } ymin = Math.floor((mn - 6) / 10) * 10; ymax = Math.ceil((mx + (o.labels ? 22 : 8)) / 10) * 10; }
  const X = km => pl + (km - from) / (to - from) * (w - pl - pr);
  const Y = e => pt + (1 - (e - ymin) / (ymax - ymin)) * (h - pt - pb);
  o._X = X; o._Y = Y; o._pl = pl; o._pr = pr; o._from = from; o._to = to;
  // grid
  const span = ymax - ymin, ystep = span > 300 ? 100 : span > 80 ? 20 : span > 40 ? 10 : 5;
  g.font = '500 11px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'; g.textAlign = 'right';
  for (let v = Math.ceil(ymin / ystep) * ystep; v <= ymax; v += ystep) { g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(pl, Y(v)); g.lineTo(w - pr, Y(v)); g.stroke(); g.fillStyle = C.muted; g.fillText(v, pl - 6, Y(v)); }
  // selection band
  if (o.sel) { const xa = X(Math.max(from, o.sel[0])), xb = X(Math.min(to, o.sel[1])); if (xb > xa) { g.fillStyle = hexA(C.violet, .12); g.fillRect(xa, pt - 6, xb - xa, h - pt - pb + 6); g.strokeStyle = hexA(C.violet, .6); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(xa, pt - 6); g.lineTo(xa, h - pb); g.moveTo(xb, pt - 6); g.lineTo(xb, h - pb); g.stroke(); g.setLineDash([]); } }
  // area
  const grd = g.createLinearGradient(0, pt, 0, h - pb); grd.addColorStop(0, hexA(C.orange, .22)); grd.addColorStop(1, hexA(C.orange, .03));
  g.beginPath(); g.moveTo(X(KM[i0]), Y(ymin)); for (let k = i0; k <= i1; k++) g.lineTo(X(KM[k]), Y(ELE[k])); g.lineTo(X(KM[i1]), Y(ymin)); g.closePath(); g.fillStyle = grd; g.fill();
  // colored line
  g.lineWidth = o.thin ? 2.5 : 3.5; g.lineCap = 'round';
  for (let k = Math.max(1, i0 + 1); k <= i1; k++) { const c = clsOf(GR[k]); g.strokeStyle = (S.hl && S.hl !== c) ? hexA(clsColor(c), .18) : clsColor(c); g.beginPath(); g.moveTo(X(KM[k - 1]), Y(ELE[k - 1])); g.lineTo(X(KM[k]), Y(ELE[k])); g.stroke(); }
  // COP markers
  if (o.cops !== false) {
    g.font = '600 10px "IBM Plex Mono", monospace'; g.textAlign = 'center';
    for (const c of COPS.slice(0, 3)) { if (c.km < from || c.km > to) continue; const x = X(c.km); g.strokeStyle = hexA(C.ink, .45); g.setLineDash([3, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(x, pt); g.lineTo(x, h - pb); g.stroke(); g.setLineDash([]);
      const tw = g.measureText(c.n.replace(' ', '')).width + 10; g.fillStyle = C.ink; roundRect(g, x - tw / 2, h - pb - 18, tw, 15, 4); g.fill(); g.fillStyle = C.surface; g.fillText(c.n.replace(' ', ''), x, h - pb - 10); }
  }
  // climb labels
  if (o.labels) {
    g.textAlign = 'center';
    for (const c of CLIMBS) { if (c.b < from || c.a > to) continue; const top = Y(c.s.hi) - 10, xa = X(Math.max(c.a, from)), xb = X(Math.min(c.b, to));
      g.strokeStyle = C.ink; g.lineWidth = 1.4; g.beginPath(); g.moveTo(xa, top + 5); g.lineTo(xa, top); g.lineTo(xb, top); g.lineTo(xb, top + 5); g.stroke();
      g.fillStyle = C.ink; g.font = '800 18px "Big Shoulders Display", sans-serif'; g.fillText(c.id, (xa + xb) / 2, top - 11);
      if (o.scale !== 'real') { g.fillStyle = css(c.c); g.font = '600 10px "IBM Plex Mono", monospace'; g.fillText(`+${Math.round(c.s.gain)}m`, (xa + xb) / 2 + 26, top - 11); } }
  }
  // x ticks
  const rng = to - from, step = rng > 20 ? 5 : rng > 8 ? 2 : rng > 3 ? 1 : 0.5;
  g.fillStyle = C.ink2; g.font = '500 11px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  for (let v = Math.ceil(from / step) * step; v <= to + 1e-6; v += step) g.fillText(step < 1 ? v.toFixed(1) : Math.round(v), X(v), h - 6);
  // cursor
  if (o.cursor && S.cur >= from && S.cur <= to) { const x = X(S.cur), y = Y(eleAt(S.cur)); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, pt - 8); g.lineTo(x, h - pb); g.stroke(); g.fillStyle = C.orange; g.strokeStyle = C.surface; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.fill(); g.stroke(); }
  return o;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function hexA(hex, a) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(x => x + x).join(''); const n = parseInt(hex, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

/* ---------- hero ---------- */
function drawHero(progress = 1) {
  const cv = $('#heroCanvas'); if (!cv) return; const { g, w, h } = prep(cv);
  const X = km => km / TOT * w, Y = e => h - 10 - (e - 215) / 100 * (h - 20);
  const last = Math.floor((N - 1) * progress);
  g.beginPath(); g.moveTo(0, h); for (let k = 0; k <= last; k++) g.lineTo(X(KM[k]), Y(ELE[k])); g.lineTo(X(KM[last]), h); g.closePath(); g.fillStyle = '#22222A'; g.fill();
  g.lineWidth = 3; g.lineJoin = 'round';
  for (let k = 1; k <= last; k++) { const c = clsOf(GR[k]); g.strokeStyle = c.startsWith('up') ? C.orange : c === 'flat' ? '#6A6A74' : '#6F9BC6'; g.beginPath(); g.moveTo(X(KM[k - 1]), Y(ELE[k - 1])); g.lineTo(X(KM[k]), Y(ELE[k])); g.stroke(); }
}
function animateHero() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { drawHero(1); document.querySelectorAll('[data-count]').forEach(e => e.textContent = e.dataset.count); return; }
  const t0 = performance.now(), dur = 1400;
  const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); drawHero(e);
    document.querySelectorAll('[data-count]').forEach(el => el.textContent = Math.round(+el.dataset.count * e));
    if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- map ---------- */
let map, cursorMk, selLine, tiles; const classLines = [];
function initMap() {
  const el = $('#map');
  if (!window.L) { el.innerHTML = '<p style="padding:20px">Peta gagal dimuat. Grafik elevasi tetap bisa dipakai.</p>'; return; }
  map = L.map(el, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
  setTiles();
  const ll = KM.map((_, k) => [LAT[k], LON[k]]);
  L.polyline(ll, { color: '#16161A', weight: 9, opacity: .28, interactive: false }).addTo(map);
  selLine = L.polyline([], { color: C.violet, weight: 16, opacity: .35, lineCap: 'round', interactive: false }).addTo(map);
  let k0 = 1;
  for (let k = 2; k <= N; k++) {
    if (k === N || clsOf(GR[k]) !== clsOf(GR[k0])) {
      const c = clsOf(GR[k0]); const pl = L.polyline(ll.slice(k0 - 1, k), { color: clsColor(c), weight: 5.5, opacity: 1, lineCap: 'round' }).addTo(map);
      pl._cls = c; classLines.push(pl); k0 = k;
    }
  }
  const lab = (lat, lon, txt, cls, anchor = [0, 0]) => L.marker([lat, lon], { icon: L.divIcon({ className: '', html: `<span class="km-label ${cls}">${txt}</span>`, iconSize: null, iconAnchor: anchor }), keyboard: false }).addTo(map);
  lab(LAT[0], LON[0], 'START · FINISH', 'sf', [-8, 26]);
  for (let km = 5; km <= 40; km += 5) { const i = idx(km); lab(LAT[i], LON[i], `${km}K`, '', [12, 10]); }
  for (const c of COPS.slice(0, 3)) { const i = idx(c.km); lab(LAT[i], LON[i], c.n, 'cop', [-10, -6]); }
  for (const c of CLIMBS) { const i = idx(c.s.hiK); lab(LAT[i], LON[i], `${c.id} ▲`, 'climb', [-10, 24]); }
  cursorMk = L.circleMarker(ll[0], { radius: 9, color: '#fff', weight: 3, fillColor: C.orange, fillOpacity: 1, interactive: false }).addTo(map);
  map.fitBounds(L.latLngBounds(ll), { padding: [24, 24] });
  map.on('click', e => { let best = 0, bd = 1e18; for (let k = 0; k < N; k++) { const d = (LAT[k] - e.latlng.lat) ** 2 + ((LON[k] - e.latlng.lng) * Math.cos(LAT[k] * Math.PI / 180)) ** 2; if (d < bd) { bd = d; best = k; } } setCur(KM[best], 'map'); });
  on('cur', src => { const i = idx(S.cur); const p = [LAT[i], LON[i]]; cursorMk.setLatLng(p); if ((S.playing && S.follow) || (src !== 'map' && !map.getBounds().pad(-0.1).contains(p))) map.panTo(p, { animate: !S.playing }); });
  on('sel', () => { const i = idx(S.sel[0]), j = idx(S.sel[1]); selLine.setLatLngs(ll.slice(i, j + 1)); });
  on('hl', () => classLines.forEach(pl => pl.setStyle({ opacity: (!S.hl || S.hl === pl._cls) ? 1 : .15 })));
  setTimeout(() => map.invalidateSize(), 300);
}
function setTiles() {
  if (!map) return; if (tiles) map.removeLayer(tiles);
  const style = isDark() ? 'dark_all' : 'rastertiles/voyager';
  tiles = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`, { maxZoom: 19, subdomains: 'abcd', attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/">CARTO</a>' }).addTo(map);
}

/* ---------- main elevation chart ---------- */
const elev = $('#elev'); let elevO = {};
function drawElev() { elevO = drawProfile(elev, { scale: S.scale, sel: S.sel, cursor: true, labels: true }); }
function kmFromEvent(cv, o, e) { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left; return o._from + (x - o._pl) / (r.width - o._pl - o._pr) * (o._to - o._from); }
let dragging = false;
elev.addEventListener('pointerdown', e => { dragging = true; stopPlay(); setCur(kmFromEvent(elev, elevO, e), 'chart'); });
elev.addEventListener('pointermove', e => { if (dragging || e.pointerType === 'mouse') setCur(kmFromEvent(elev, elevO, e), 'chart'); });
window.addEventListener('pointerup', () => dragging = false);
document.querySelectorAll('[data-scale]').forEach(b => b.addEventListener('click', () => {
  S.scale = b.dataset.scale; document.querySelectorAll('[data-scale]').forEach(x => x.classList.toggle('on', x === b));
  $('#scaleHint').textContent = S.scale === 'real' ? 'Sumbu tinggi mulai 0 m, beda tinggi terlihat apa adanya.' : 'Sumbu tinggi diperbesar supaya lekukan kecil terlihat. Aslinya jauh lebih landai.';
  drawElev();
}));
function buildLegend() { $('#legend').innerHTML = CLS.map(c => `<span><i style="background:${clsColor(c)}"></i>${CLS_LABEL[c]}</span>`).join('') + `<span><i style="background:${hexA(C.violet, .35)}"></i>segmen terpilih</span>`; }
on('cur', () => {
  drawElev();
  const g = GR[idx(S.cur)];
  $('#roKm').textContent = fmt1(S.cur); $('#roEle').textContent = `${Math.round(eleAt(S.cur))} m`;
  const gr = $('#roGr'); gr.textContent = `${g > 0 ? '+' : ''}${fmt1(g)}%`; gr.style.color = g > 0.5 ? C.orange2 : g < -0.5 ? '#9DB8D2' : '#fff';
  const next = COPS.find(c => c.km > S.cur + 0.01);
  $('#roSeg').textContent = `${segName(S.cur)}${next ? ` · ${fmt1(next.km - S.cur)} km lagi ke ${next.n}` : ''}`;
});
on('sel', drawElev); on('hl', drawElev);

/* ---------- play ---------- */
let raf = 0, lastT = 0;
function stopPlay() { if (!S.playing) return; S.playing = false; cancelAnimationFrame(raf); $('#btnPlay').textContent = '▶ Putar'; $('#btnPlay').classList.remove('playing'); }
$('#btnPlay').addEventListener('click', () => {
  if (S.playing) return stopPlay();
  S.playing = true; $('#btnPlay').textContent = '❚❚ Jeda'; $('#btnPlay').classList.add('playing');
  if (S.cur >= TOT - 0.05) setCur(0, 'play'); lastT = performance.now();
  const loop = t => { const dt = t - lastT; lastT = t; const nk = S.cur + dt * TOT / 40000; if (nk >= TOT) { setCur(TOT, 'play'); stopPlay(); toast('Finish! 42.195 km'); return; } setCur(nk, 'play'); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
});
$('#btnFollow').addEventListener('click', e => { S.follow = !S.follow; e.currentTarget.setAttribute('aria-pressed', S.follow); });
$('#btnFit').addEventListener('click', () => map && map.fitBounds(L.latLngBounds(KM.map((_, k) => [LAT[k], LON[k]])), { padding: [24, 24] }));

/* ---------- segment explorer ---------- */
const rA = $('#rA'), rB = $('#rB'); rA.max = rB.max = TOT;
const PRESETS = [['T1', 10.3, 14.3], ['T2', 21.8, 24.9], ['T3', 29.4, 31.2], ['T4', 35.9, 41.4], ['Paruh 1', 0, 21.1], ['Paruh 2', 21.1, TOT], ['10 km terakhir', TOT - 10, TOT], ['Seluruh rute', 0, TOT]];
$('#presets').innerHTML = PRESETS.map((p, i) => `<button data-i="${i}">${p[0]}</button>`).join('');
$('#presets').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const p = PRESETS[+b.dataset.i]; setSel(p[1], p[2], 'preset'); });
const onRange = () => { let a = +rA.value, b = +rB.value; if (a > b - 0.2) { if (document.activeElement === rA) a = b - 0.2; else b = a + 0.2; } setSel(a, b, 'range'); };
rA.addEventListener('input', onRange); rB.addEventListener('input', onRange);
const segCv = $('#segChart');
function renderSeg(src) {
  const [a, b] = S.sel; if (src !== 'range') { rA.value = a; rB.value = b; }
  $('#rangeFill').style.left = `${a / TOT * 100}%`; $('#rangeFill').style.width = `${(b - a) / TOT * 100}%`;
  $('#lblA').textContent = `km ${fmt1(a)}`; $('#lblB').textContent = `km ${fmt1(b)}`;
  document.querySelectorAll('#presets button').forEach(x => { const p = PRESETS[+x.dataset.i]; x.classList.toggle('on', Math.abs(p[1] - a) < .06 && Math.abs(p[2] - b) < .06); });
  const ctx = Math.max(0.5, (b - a) * 0.15);
  drawProfile(segCv, { from: Math.max(0, a - ctx), to: Math.min(TOT, b + ctx), scale: 'detail', sel: [a, b], thin: true });
  const s = stats(a, b), floors = Math.round(s.gain / 3);
  const st = (l, v, c, sm) => `<div class="stat" style="--c:${c}"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ''}</div>`;
  $('#segStats').innerHTML = st('jarak', `${fmt1(s.dist)} km`, C.ink, `km ${fmt1(s.a)}–${fmt1(s.b)}`) + st('total naik', `+${Math.round(s.gain)} m`, C.deep, `≈ ${floors} lantai`) +
    st('total turun', `−${Math.round(s.loss)} m`, C.blue, '') + st('net', `${s.net >= 0 ? '+' : '−'}${Math.abs(Math.round(s.net))} m`, C.ink, `${Math.round(ELE[idx(s.a)])} → ${Math.round(ELE[idx(s.b)])} m`) +
    st('rata-rata', `${s.avg >= 0 ? '+' : ''}${fmt1(s.avg)}%`, C.violet, `≈ treadmill incline ${fmt1(Math.max(0, s.avg))}`) + st('paling curam', `${fmt1(s.maxUp)}%`, C.red, `turun tercuram ${fmt1(s.maxDn)}%`);
}
on('sel', renderSeg); on('hl', () => renderSeg('hl'));

/* ---------- climbs & descents ---------- */
function spark(c) {
  const a = Math.max(0, c.a - 0.3), b = Math.min(TOT, c.b + 0.3), i = idx(a), j = idx(b); let mn = 1e9, mx = -1e9; for (let k = i; k <= j; k++) { mn = Math.min(mn, ELE[k]); mx = Math.max(mx, ELE[k]); }
  const pts = []; for (let k = i; k <= j; k++) pts.push(`${((KM[k] - a) / (b - a) * 140).toFixed(1)},${(48 - (ELE[k] - mn) / Math.max(1, mx - mn) * 42).toFixed(1)}`);
  return `<svg viewBox="0 0 140 52" aria-hidden="true"><polygon points="0,52 ${pts.join(' ')} 140,52" fill="${hexA(css(c.c), .15)}"/><polyline points="${pts.join(' ')}" fill="none" stroke="${css(c.c)}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
}
function climbCmp(g) { const f = Math.round(g / 3); return g >= 30 && g <= 40 ? `≈ setinggi 1 Candi Borobudur (±${f} lantai)` : g > 40 ? `≈ gedung ${f} lantai, sedikit lebih tinggi dari Borobudur` : `≈ gedung ${f} lantai`; }
function renderClimbs() {
  $('#climbs').innerHTML = CLIMBS.map(c => { const s = c.s, mins = Math.round(s.dist * 8 * (1 + 0.033 * Math.max(0, s.avg)));
    return `<button class="climb" data-id="${c.id}" style="--c:${css(c.c)}"><div class="climb-top"><span class="tag">${c.id}</span><span class="rng">km ${c.a}–${c.b}<small>${fmt1(s.dist)} km · ±${mins} menit</small></span>${spark(c)}</div>
    <div class="climb-nums"><div><b>+${Math.round(s.gain)}</b><span>m naik</span></div><div><b>${fmt1(s.avg)}%</b><span>rata-rata</span></div><div><b>${fmt1(s.maxUp)}%</b><span>paling curam</span></div></div>
    <span class="cmp">${climbCmp(s.gain)}</span><p>${c.note}</p><p class="tipline"><b>Tips:</b> ${c.tip}</p></button>`; }).join('');
  $('#descents').innerHTML = DESC.map(d => `<button class="desc" data-id="${d.id}"><span class="k">TURUNAN · KM ${d.a}–${d.b}</span><b>−${Math.round(d.s.loss)} m dalam ${fmt1(d.s.dist)} km</b><span>${d.t}</span></button>`).join('');
}
function focusRange(a, b, el) {
  setSel(a, b, 'card'); setCur((a + b) / 2, 'card');
  document.querySelectorAll('.climb,.desc').forEach(x => x.classList.toggle('on', x === el));
  if (map) { const i = idx(a), j = idx(b); map.fitBounds(L.latLngBounds(KM.slice(i, j + 1).map((_, k) => [LAT[i + k], LON[i + k]])), { padding: [40, 40] }); }
  $('#peta').scrollIntoView({ behavior: 'smooth' });
}
document.addEventListener('click', e => { const c = e.target.closest('.climb,.desc'); if (!c) return; const d = [...CLIMBS, ...DESC].find(x => x.id === c.dataset.id); focusRange(d.a, d.b, c); });

/* ---------- composition ---------- */
const COMP = Object.fromEntries(CLS.map(c => [c, 0]));
for (let k = 1; k < N; k++) COMP[clsOf(GR[k])] += KM[k] - KM[k - 1];
function renderComp() {
  $('#comp').innerHTML = CLS.map(c => `<button data-c="${c}" style="flex:${COMP[c]};background:${clsColor(c)};color:${c === 'flat' || c === 'dn1' || c === 'up1' ? '#16161A' : '#fff'}" class="${S.hl && S.hl !== c ? 'dim' : ''}" aria-label="${CLS_SHORT[c]} ${fmt1(COMP[c])} km">${Math.round(COMP[c])} km</button>`).join('');
  $('#compLegend').innerHTML = CLS.map(c => `<div>${CLS_SHORT[c]}<b>${Math.round(COMP[c] / TOT * 100)}% · ${CLS_LABEL[c].replace(/^(naik|turun|datar) ?/, '')}</b></div>`).join('');
}
$('#comp').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; setHl(b.dataset.c); toast(S.hl ? `Menyorot: ${CLS_SHORT[S.hl]}` : 'Sorotan dimatikan'); });
on('hl', renderComp);

/* ---------- grade slider ---------- */
const REFS = [[0.5, 'rata-rata T4 (naik landai 5.5 km)'], [1.1, 'rata-rata T1, T2, dan T3'], [2.5, 'bagian tercuram T1 (km 13–14)'], [3.9, 'awal T2, bagian tercuram se-rute'], [8.3, 'ramp kursi roda (batas standar)']];
function renderGrade() {
  const g = +$('#gSlider').value, W = 400, H = 44, yb = 44;
  $('#gSvg').setAttribute('viewBox', `0 0 ${W} ${H}`); $('#gSvg').setAttribute('preserveAspectRatio', 'xMidYMax meet');
  $('#gSvg').innerHTML = `<polygon points="0,${yb} ${W},${yb - W * g / 100} ${W},${yb}" fill="${hexA(C.orange, .25)}"/><line x1="0" y1="${yb}" x2="${W}" y2="${yb - W * g / 100}" stroke="${C.orange}" stroke-width="2"/><line x1="0" y1="${yb - .5}" x2="${W}" y2="${yb - .5}" stroke="${C.ink}" stroke-width="1"/>`;
  let d = 0; if (g > 0) for (let k = 1; k < N; k++) if (GR200[k - 1] >= g) d += KM[k] - KM[k - 1];
  const ref = REFS.reduce((p, r) => Math.abs(r[0] - g) < Math.abs(p[0] - g) ? r : p);
  $('#gOut').innerHTML = `<span class="big">${fmt1(g)}%</span><div>Naik <b>${fmt1(g)} m</b> tiap 100 m lari · setara <b>treadmill incline ${fmt1(g)}</b></div>
  <div>Bagian Bormar yang securam ini atau lebih: <b>${g <= 0 ? '—' : d < 0.05 ? 'tidak ada' : `${fmt1(d)} km (${Math.round(d / TOT * 100)}%)`}</b></div><div>Dekat dengan: <b>${ref[1]}</b> (${ref[0]}%)</div>`;
}
$('#gSlider').addEventListener('input', renderGrade);

/* ---------- height comparison ---------- */
function renderHeights() {
  const items = [...CLIMBS].sort((a, b) => a.s.gain - b.s.gain).map(c => ({ n: c.id, v: Math.round(c.s.gain), c: css(c.c), t: `${c.id} naik ${Math.round(c.s.gain)} m ≈ ${Math.round(c.s.gain / 3)} lantai, dicicil ${fmt1(c.s.dist)} km (${fmt1(c.s.avg)}% rata-rata).` }));
  items.splice(3, 0, { n: 'Borobudur', v: 35, c: '#8A7F72', temple: true, t: 'Candi Borobudur setinggi ±35 m (aslinya ±42 m sebelum puncaknya runtuh).' });
  items.push({ n: '15 lantai', v: 45, c: C.dark, bldg: true, t: 'Gedung 15 lantai ≈ 45 m (±3 m per lantai), sama dengan total naik T1.' });
  const svg = $('#hSvg'), W = clamp(svg.clientWidth || 640, 300, 760); svg.setAttribute('viewBox', `0 0 ${W} 300`);
  const base = 250, px = 4.4, bw = Math.min(74, (W - 60) / items.length * .78), gap = (W - 50 - items.length * bw) / (items.length - 1);
  let s = ''; for (const m of [10, 20, 30, 40]) s += `<line x1="40" x2="${W}" y1="${base - m * px}" y2="${base - m * px}" stroke="${C.line}"/><text x="34" y="${base - m * px + 4}" text-anchor="end" font-family="IBM Plex Mono" font-size="11" fill="${C.muted}">${m} m</text>`;
  items.forEach((it, i) => { const x = 50 + i * (bw + gap), hgt = it.v * px; let shape;
    if (it.temple) { const tiers = [[1, .22], [.86, .14], [.74, .14], [.62, .12], [.5, .12], [.36, .1]]; let y = base; shape = ''; for (const [wf, hf] of tiers) { const hh = hgt * hf, w = bw * 1.1 * wf; shape += `<rect x="${x + bw / 2 - w / 2}" y="${y - hh}" width="${w}" height="${hh}" fill="${it.c}" stroke="${C.surface}" stroke-width="1"/>`; y -= hh; } shape += `<polygon points="${x + bw / 2 - 9},${y} ${x + bw / 2 + 9},${y} ${x + bw / 2},${base - hgt}" fill="${it.c}"/>`; }
    else if (it.bldg) { shape = `<rect x="${x}" y="${base - hgt}" width="${bw}" height="${hgt}" fill="${it.c}"/>`; for (let f = 0; f < 15; f++) for (let j = 0; j < 4; j++) shape += `<rect x="${x + 5 + j * (bw - 10) / 4 + 1.5}" y="${base - (f + 1) * 3 * px + 3}" width="${(bw - 10) / 4 - 3}" height="${3 * px - 6}" fill="#5A5A64"/>`; }
    else shape = `<rect x="${x}" y="${base - hgt}" width="${bw}" height="${hgt}" rx="7" fill="${it.c}"/>`;
    s += `<g class="bar" data-t="${it.t}" tabindex="0">${shape}<text x="${x + bw / 2}" y="${base - hgt - 8}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="${W < 480 ? 18 : 22}" fill="${C.ink}">${it.v} m</text><text x="${x + bw / 2}" y="${base + 22}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="${W < 480 ? 10.5 : 13}" fill="${C.ink}">${it.n}</text></g>`; });
  s += `<line x1="40" x2="${W}" y1="${base}" y2="${base}" stroke="${C.ink}" stroke-width="2"/>`;
  svg.innerHTML = s;
}
$('#hSvg').addEventListener('click', e => { const g = e.target.closest('.bar'); if (g) $('#hNote').textContent = g.dataset.t; });

/* ---------- per km ---------- */
const KMS = []; for (let j = 0; j < Math.ceil(TOT); j++) { const s = stats(j, Math.min(TOT, j + 1)); KMS.push(s); }
let kmSel = -1;
function kmTag(j) { const m = j + 0.5; for (const c of CLIMBS) if (m >= c.a && m <= c.b) return c.id; for (const d of DESC) if (m >= d.a && m <= d.b) return 'turunan kunci'; return ''; }
function renderKm() {
  const svg = $('#kmSvg'), W = clamp(svg.clientWidth || 860, 300, 1100), H = W < 520 ? 250 : 300, pl = 38, pr = 8, mid = H / 2 - 4, sc = (H / 2 - 34) / 27, bw = (W - pl - pr) / KMS.length;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  let s = ''; for (const v of [-20, -10, 10, 20]) s += `<line x1="${pl}" x2="${W - pr}" y1="${mid - v * sc}" y2="${mid - v * sc}" stroke="${C.line}"/><text x="${pl - 6}" y="${mid - v * sc + 4}" text-anchor="end" font-family="IBM Plex Mono" font-size="11" fill="${C.muted}">${v > 0 ? '+' : ''}${v}</text>`;
  KMS.forEach((k, j) => { const x = pl + j * bw, sel = j === kmSel, dim = kmSel >= 0 && !sel;
    s += `<g class="kb" data-j="${j}" opacity="${dim ? .45 : 1}"><rect x="${x}" y="20" width="${bw}" height="${H - 50}" fill="${sel ? hexA(C.violet, .12) : 'transparent'}"/>`;
    if (k.gain > .5) s += `<rect x="${x + bw * .14}" y="${mid - k.gain * sc}" width="${bw * .72}" height="${k.gain * sc}" rx="2" fill="${k.gain >= 12 ? C.deep : C.orange2}"/>`;
    if (k.loss > .5) s += `<rect x="${x + bw * .14}" y="${mid}" width="${bw * .72}" height="${k.loss * sc}" rx="2" fill="${k.loss >= 12 ? C.blue : C.blue2}"/>`;
    s += `</g>`; if ((j + 1) % 5 === 0 || j === 0) s += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" fill="${C.ink2}">${j + 1}</text>`; });
  s += `<line x1="${pl}" x2="${W - pr}" y1="${mid}" y2="${mid}" stroke="${C.ink}" stroke-width="1.5"/>`;
  const top = [...KMS.keys()].sort((a, b) => KMS[b].gain - KMS[a].gain).slice(0, 3), bot = [...KMS.keys()].sort((a, b) => KMS[b].loss - KMS[a].loss).slice(0, 2);
  top.forEach(j => s += `<text x="${pl + j * bw + bw / 2}" y="${mid - KMS[j].gain * sc - 5}" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="11" fill="${C.deep}">+${Math.round(KMS[j].gain)}</text>`);
  bot.forEach(j => s += `<text x="${pl + j * bw + bw / 2}" y="${mid + KMS[j].loss * sc + 14}" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="11" fill="${C.blue}">−${Math.round(KMS[j].loss)}</text>`);
  svg.innerHTML = s;
}
function kmDetail(j) {
  const k = KMS[j], tag = kmTag(j);
  $('#kmDetail').innerHTML = `<div><span>KM</span><b>${j + 1}</b></div><div><span>NAIK</span><b style="color:${C.orange2}">+${Math.round(k.gain)} m</b></div><div><span>TURUN</span><b style="color:#9DB8D2">−${Math.round(k.loss)} m</b></div><div><span>RATA-RATA</span><b>${k.avg >= 0 ? '+' : ''}${fmt1(k.avg)}%</b></div><div><span>ELEVASI</span><b>${Math.round(ELE[idx(k.a)])}→${Math.round(ELE[idx(k.b)])}</b></div>
  <div class="wide">${tag ? `Bagian dari ${tag === 'turunan kunci' ? 'turunan kunci' : `tanjakan ${tag}`}` : segName(j + .5)}${k.maxUp > 2 ? ` · ada bagian ±${fmt1(k.maxUp)}%` : ''}</div>`;
}
$('#kmSvg').addEventListener('click', e => { const g = e.target.closest('.kb'); if (!g) return; kmSel = +g.dataset.j; renderKm(); kmDetail(kmSel); setSel(kmSel, Math.min(TOT, kmSel + 1), 'km'); setCur(kmSel + .5, 'km'); });
function renderKmTable() {
  $('#kmTable').innerHTML = `<thead><tr><th>Km</th><th class="num">Elevasi</th><th class="num">Naik</th><th class="num">Turun</th><th class="num">Rata-rata</th><th>Bagian</th></tr></thead><tbody>` +
    KMS.map((k, j) => `<tr><td><b>${j + 1}</b></td><td class="num">${Math.round(ELE[idx(k.a)])} → ${Math.round(ELE[idx(k.b)])} m</td><td class="num up">+${Math.round(k.gain)}</td><td class="num dn">−${Math.round(k.loss)}</td><td class="num">${k.avg >= 0 ? '+' : ''}${fmt1(k.avg)}%</td><td>${kmTag(j) || segName(j + .5)}</td></tr>`).join('') + '</tbody>';
}

/* ---------- COT ---------- */
let wave = 3;
function renderCot() {
  $('#wavePick').innerHTML = WAVES.map((w, i) => `<button data-w="${i}" class="${i === wave ? 'on' : ''}">${w.n} · ${w.t}</button>`).join('');
  const st = tsec(WAVES[wave].t);
  $('#cotTable').innerHTML = `<thead><tr><th>Titik</th><th class="num">KM</th><th class="num">Ditutup (WIB)</th><th class="num">Waktumu dari start ${WAVES[wave].n}</th><th class="num">Pace minimal rata-rata</th></tr></thead><tbody>` +
    COPS.map(c => { const avail = tsec(c.close) - st; return `<tr class="${c.n === 'FINISH' ? 'fin' : ''}"><td><b>${c.n}</b></td><td class="num">${c.km}</td><td class="num"><b>${c.close}</b></td><td class="num">${hm(avail)}</td><td class="num">${mmss(avail / c.km)}/km</td></tr>`; }).join('') + '</tbody>';
}
$('#wavePick').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; wave = +b.dataset.w; renderCot(); $('#tW').value = wave; calc(); });

/* ---------- pacing calculator ---------- */
let mode = 'gap';
const fGap = g => g >= 0 ? 1 + 0.033 * g : 1 + 0.018 * Math.max(g, -6);
function calc() {
  const H = +$('#tH').value || 0, M = +$('#tM').value || 0, tgt = H * 3600 + M * 60, w = +$('#tW').value, delay = +$('#tD').value * 60, stop = +$('#tS').value * 60;
  $('#oD').textContent = `${$('#tD').value} mnt`; $('#oS').textContent = `${$('#tS').value} mnt`;
  const moving = tgt - stop; if (moving < 3600) { $('#calcSum').innerHTML = '<div class="stat"><b>—</b><small>Target terlalu cepat untuk input ini.</small></div>'; return; }
  const f = KM.map((_, k) => mode === 'gap' ? fGap(GR[k]) : 1);
  let wsum = 0; for (let k = 1; k < N; k++) wsum += (KM[k] - KM[k - 1]) * f[k];
  const p0 = moving / wsum; const cum = [0]; for (let k = 1; k < N; k++) cum.push(cum[k - 1] + (KM[k] - KM[k - 1]) * f[k] * p0);
  const movAt = km => { const i = idx(km); return cum[i] + (km - KM[i]) * f[Math.min(N - 1, i + 1)] * p0; };
  const elAt = km => movAt(km) + stop * km / TOT;
  const start = tsec(WAVES[w].t) + delay;
  const finWall = start + elAt(TOT), finBuf = tsec('11:00') - finWall;
  const badge = b => b >= 15 * 60 ? `<span class="badge b-ok">+${Math.round(b / 60)} mnt</span>` : b >= 5 * 60 ? `<span class="badge b-warn">+${Math.round(b / 60)} mnt</span>` : `<span class="badge b-bad">${b >= 0 ? '+' : '−'}${Math.abs(Math.round(b / 60))} mnt</span>`;
  const st = (l, v, c, sm) => `<div class="stat" style="--c:${c}"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ''}</div>`;
  $('#calcSum').innerHTML = st('pace rata-rata bergerak', `${mmss(moving / TOT)}/km`, C.orange, `${mode === 'gap' ? `datar-setara ${mmss(p0)}/km` : 'sama di semua km'}`) +
    st('pace jam tangan*', `${mmss(moving / TOT * TOT / R.meta.gpxLengthKm)}/km`, C.violet, `kalau jam baca ${fmt1(R.meta.gpxLengthKm)} km`) +
    st('finish (jam dinding)', clock(finWall), C.ink, `start ${clock(start)}`) + st('buffer ke COT finish', `${finBuf >= 0 ? '+' : '−'}${Math.abs(Math.round(finBuf / 60))} mnt`, finBuf >= 900 ? C.teal : finBuf >= 300 ? C.amber : C.red, 'COT finish 11:00');
  $('#secTable').innerHTML = `<thead><tr><th>Bagian</th><th>Km</th><th class="num">Pace</th><th class="num">Durasi</th></tr></thead><tbody>` + SECTIONS.map(s => { const t = movAt(s.b) - movAt(s.a);
    return `<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;background:${s.t === 'up' ? C.orange : s.t === 'down' ? C.blue : C.flat}"></span>${s.n}</td><td>${s.a}–${s.b === TOT ? '42.2' : s.b}</td><td class="num"><b>${mmss(t / (s.b - s.a))}</b></td><td class="num">${hm(t).replace(/^0:/, '0:')}</td></tr>`; }).join('') + '</tbody>';
  const marks = [5, 10, 15, 20, 21.1, 25, 30, 34.5, 35, 40, TOT];
  $('#splitTable').innerHTML = `<thead><tr><th>Km</th><th class="num">Elapsed</th><th class="num">Jam dinding</th><th class="num">COT</th><th class="num">Buffer</th></tr></thead><tbody>` + marks.map(m => { const e = elAt(m), wall = start + e, cop = COPS.find(c => Math.abs(c.km - m) < .01);
    return `<tr${cop ? ' style="font-weight:600"' : ''}><td>${m === TOT ? 'FINISH' : m}${cop && cop.n !== 'FINISH' ? ` · ${cop.n}` : ''}</td><td class="num">${hm(e)}</td><td class="num">${clock(wall)}</td><td class="num">${cop ? cop.close : '—'}</td><td class="num">${cop ? badge(tsec(cop.close) - wall) : ''}</td></tr>`; }).join('') + '</tbody>';
  drawPace(f, p0);
}
function drawPace(f, p0) {
  const cv = $('#paceChart'), { g, w, h } = prep(cv), pl = 46, pr = 10, pt = 16, pb = 24;
  const pace = []; for (let k = 0; k < N; k += 2) { let s = 0, d = 0; for (let j = Math.max(1, k - 10); j <= Math.min(N - 1, k + 10); j++) { s += f[j] * (KM[j] - KM[j - 1]); d += KM[j] - KM[j - 1]; } if (d > 0) pace.push([KM[k], p0 * s / d]); }
  const pv = pace.map(p => p[1]), mn = Math.min(...pv) - 15, mx = Math.max(...pv) + 15;
  const pt2 = pt + 10, X = km => pl + km / TOT * (w - pl - pr), Y = v => pt2 + (v - mn) / (mx - mn) * (h - pt2 - pb);
  const Ye = e => h - pb - (e - 220) / 90 * (h - pt - pb) * .55;
  g.beginPath(); g.moveTo(X(0), h - pb); for (let k = 0; k < N; k++) g.lineTo(X(KM[k]), Ye(ELE[k])); g.lineTo(X(TOT), h - pb); g.fillStyle = hexA(C.flat, .35); g.fill();
  g.font = '500 11px "IBM Plex Mono", monospace'; g.textAlign = 'right'; g.textBaseline = 'middle';
  const tstep = (mx - mn) > 90 ? 30 : 15; for (let v = Math.ceil(mn / tstep) * tstep; v <= mx; v += tstep) { g.strokeStyle = C.line; g.beginPath(); g.moveTo(pl, Y(v)); g.lineTo(w - pr, Y(v)); g.stroke(); g.fillStyle = C.muted; g.fillText(mmss(v), pl - 6, Y(v)); }
  g.setLineDash([5, 4]); g.strokeStyle = C.violet; g.lineWidth = 1.5; g.beginPath(); g.moveTo(pl, Y(p0)); g.lineTo(w - pr, Y(p0)); g.stroke(); g.setLineDash([]);
  g.lineWidth = 3; g.lineJoin = 'round'; g.lineCap = 'round';
  for (let i = 1; i < pace.length; i++) { const slow = pace[i][1] > p0 + 3, fast = pace[i][1] < p0 - 3; g.strokeStyle = slow ? C.orange : fast ? C.blue : C.ink2; g.beginPath(); g.moveTo(X(pace[i - 1][0]), Y(pace[i - 1][1])); g.lineTo(X(pace[i][0]), Y(pace[i][1])); g.stroke(); }
  g.fillStyle = C.ink2; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; for (let v = 0; v <= 40; v += 5) g.fillText(v, X(v), h - 6);
  g.textAlign = 'left'; g.fillStyle = C.violet; g.fillText(mode === 'gap' ? `datar-setara ${mmss(p0)}` : `pace rata ${mmss(p0)}`, pl + 6, h - pb - 6);
  g.fillStyle = C.muted; g.textAlign = 'right'; g.fillText(w > 560 ? 'atas = lebih cepat · oranye = melambat di tanjakan · biru = lebih cepat di turunan' : 'atas = lebih cepat', w - pr, pt - 4);
}
['#tH', '#tM', '#tW', '#tD', '#tS'].forEach(s => $(s).addEventListener('input', () => { if (s === '#tW') { wave = +$('#tW').value; renderCot(); } calc(); }));
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); calc(); }));
$('#calc').addEventListener('submit', e => e.preventDefault());

/* ---------- strategy timeline ---------- */
function renderTimeline() {
  $('#timeline').innerHTML = SECTIONS.map(s => { const st = stats(s.a, s.b), col = s.t === 'up' ? C.orange : s.t === 'down' ? C.blue : C.teal;
    return `<li style="--c:${col}"><div class="km">km ${s.a}–${s.b === TOT ? '42.2' : s.b}<small>+${Math.round(st.gain)} / −${Math.round(st.loss)} m</small></div><div><h4>${s.n}</h4><p>${s.d}</p></div></li>`; }).join('');
}

/* ---------- misc ---------- */
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1600); }
$('#mRaw').textContent = R.meta.rawPoints.toLocaleString('id-ID'); $('#mLen').textContent = R.meta.gpxLengthKm.toFixed(2).replace('.', ','); $('#mRawGain').textContent = Math.round(R.meta.rawGain);
// nav highlight
const secs = [...document.querySelectorAll('main section[id]')]; const links = [...document.querySelectorAll('.chips a')];
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`)); const a = links.find(a => a.classList.contains('on')); a && a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } }), { rootMargin: '-45% 0px -50% 0px' });
secs.forEach(s => io.observe(s));

function renderAllStatic() { buildLegend(); renderClimbs(); renderComp(); renderGrade(); renderHeights(); renderKm(); renderTimeline(); drawHero(1); drawElev(); renderSeg('init'); calc(); }
let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawHero(1); drawElev(); renderSeg('resize'); calc(); renderKm(); renderHeights(); }, 120); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); setTiles(); classLines.forEach(pl => pl.setStyle({ color: clsColor(pl._cls) })); renderAllStatic(); });

// init
renderKmTable(); renderCot(); initMap();
document.fonts && document.fonts.ready.then(() => { renderAllStatic(); });
renderAllStatic(); animateHero();
kmSel = 13; renderKm(); kmDetail(13); kmSel = -1; renderKm();
setSel(10.3, 14.3, 'init'); setCur(0, 'init');
})();
