# DAPUR.ADUHP.COM (Admin Panel & Mobile API MVP)

Aplikasi Admin Panel berpenampilan modern (Vercel Pitch-Black Dark Mode) untuk e-Commerce Handphone & Elektronik **aduHP**, terintegrasi sebagai **1 Admin untuk 3 Platform (Web + Android + iPhone)** melalui database terpusat Supabase.

---

## ⚡ Fitur Utama

1. **Dashboard Hitam Vercel-Style (`/`)**:
   - Ringkasan KPI: Total Unit HP, Unit Second Lolos Uji QC, Total Stok Fisik, dan Estimasi Nilai Inventaris (IDR).
   - Indikator status koneksi Supabase & filter cepat kondisi unit.
   - Tabel katalog perangkat dengan thumbnail, spesifikasi, dan quick action.

2. **Katalog & Inventaris HP (`/products`)**:
   - Filter instan: **Semua**, **Baru (BNIB Segel)**, dan **Second Certified Pre-Owned (Grade A+)**.
   - Filter brand: Apple, Samsung, Xiaomi, ROG, Google Pixel, Vivo.
   - Kolom khusus handphone: Nomor IMEI (dengan tombol 1-klik salin), Garansi Distributor (iBox/SEIN/TAM), Battery Health (BH %), dan status aktif.

3. **Input Handphone Baru / Second (`/products/new`)**:
   - Toggle kondisi dinamis: Menyesuaikan form secara otomatis antara unit BNIB segel resmi vs unit second pre-owned.
   - Upload foto langsung ke Supabase Storage bucket `products` atau direct URL preview.
   - Input varian RAM, Storage (GB), warna bodi, dan spesifikasi hardware.

4. **35 Titik Inspeksi QC (`/checklist`)**:
   - Manajemen pengujian kualitas unit second: True Tone, 120Hz ProMotion, Face ID/Fingerprint, Baterai & Suhu, Lensa Kamera 0.5x/1x/Tele, Speaker Stereo, Sinyal 5G Kemenperin, dan status iCloud/Google Account.
   - Tombol 1-klik *Auto Pass All*.

5. **JSON API Mobile untuk Android & iPhone (`/api/products`)**:
   - Endpoint REST API otomatis:
     - `GET /api/products` (Semua katalog HP aktif)
     - `GET /api/products?condition=second` (Khusus HP second pre-owned)
     - `GET /api/products?condition=baru` (Khusus HP baru BNIB)
     - `GET /api/products?brand=Apple` (Filter brand)
     - `POST /api/products` (Tambah produk via API)
     - `GET /api/products/[id]` & `PUT /api/products/[id]` & `DELETE /api/products/[id]`

---

## 🛠️ Langkah Menghubungkan ke Supabase (2 Tabel MVP)

Script SQL lengkap sudah disediakan di file: [`supabase/schema.sql`](file:///c:/Users/ANDI/.gemini/antigravity-ide/dapur-aduhp/supabase/schema.sql) atau bisa langsung disalin dari halaman admin:
👉 Buka menu **Setup Supabase SQL** di `http://localhost:3000/schema-setup`.

1. Buka dashboard Supabase: [https://supabase.com/dashboard/project/beajiozqffgbczkhmwan/sql](https://supabase.com/dashboard/project/beajiozqffgbczkhmwan/sql)
2. Buka tab **SQL Editor** -> Buat Query Baru.
3. Paste isi `supabase/schema.sql`, lalu klik tombol hijau **Run**.
4. Selesai! Tabel `dapur_products`, `dapur_checklist`, Storage Bucket `products`, dan initial data HP flagship akan langsung aktif.

---

## 🚀 Step Deploy ke Vercel (dapur.aduhp.com)

1. Push folder `dapur-aduhp` ke repository GitHub Anda (atau deploy via Vercel CLI: `npx vercel`).
2. Di dashboard Vercel, pilih **Add New Project** -> Import repository `dapur-aduhp`.
3. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://beajiozqffgbczkhmwan.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYWppb3pxZmZnYmN6a2htd2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjU2NzQsImV4cCI6MjEwODQ0MTY3NH0.2lxXwyIl4tQY1lhK52lVhwzLgmpzvRYNkQ9MTHQs-lg`
4. Klik **Deploy**.
5. Setelah build selesai, masuk ke **Project Settings -> Domains**, tambahkan: `dapur.aduhp.com`.
6. Karena DNS Hostinger Anda sudah memiliki record `CNAME dapur -> cname.vercel-dns.com`, Vercel akan otomatis memverifikasi dan menerbitkan SSL. Subdomain `https://dapur.aduhp.com` langsung LIVE!
