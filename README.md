# GPX Bormar

Ulasan interaktif A–Z rute **Borobudur Marathon – Full Marathon (42.195 km)** dari file GPX.

Isi situs:

- Peta rute + profil elevasi yang tersinkron (geser grafik, titik di peta ikut bergerak; ada simulasi "lari" virtual)
- Pemilih segmen bebas (naik/turun/kemiringan untuk km berapa pun)
- 4 tanjakan utama (T1–T4) dan turunan kunci
- Komposisi medan, slider kemiringan skala asli, perbandingan tinggi (Candi Borobudur, gedung)
- Naik–turun per km + tabel lengkap
- Cut-off time per wave
- Kalkulator pacing (effort rata vs pace rata) lengkap dengan buffer COT
- Strategi per bagian dan FAQ metodologi

## Struktur

Situs statis tanpa build step:

```
index.html      halaman
styles.css      gaya (tema terang/gelap otomatis)
app.js          semua interaksi
data.js         rute hasil olahan GPX (titik tiap 50 m, elevasi dihaluskan)
bormar-fm.gpx   file GPX asli
vendor/leaflet  Leaflet 1.9.4 (peta)
fonts/          Big Shoulders Display, Inter, IBM Plex Mono (self-hosted)
vercel.json     header cache & unduhan GPX
```

Jalankan lokal: `python3 -m http.server` lalu buka `http://localhost:8000`.

## Data & catatan

- Sumber: GPX rute Bormar dari Garmin Connect (course, Oktober 2025), 2.066 titik, panjang 42.55 km → diskalakan ke 42.195 km.
- Elevasi dihaluskan (rata-rata bergerak ±250 m). Total naik ±243 m (data mentah 260 m).
- Kemiringan warna: rata-rata per 300 m. "Paling curam": jendela 200 m.
- COT dari unggahan resmi @borobudur.marathon.
- Cek peta resmi terbaru bila rute 2026 berubah.

Situs komunitas tidak resmi, tidak berafiliasi dengan penyelenggara. Peta © OpenStreetMap contributors, © CARTO.

Data GPX diolah dan situs dibuat oleh Claude, digagas oleh Ryan.
