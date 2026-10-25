import { createClient } from '@supabase/supabase-js';
import { ALL_PHONES, PRICE_TIERS } from './phonesData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://beajiozqffgbczkhmwan.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYWppb3pxZmZnYmN6a2htd2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjU2NzQsImV4cCI6MjEwODQ0MTY3NH0.2lxXwyIl4tQY1lhK52lVhwzLgmpzvRYNkQ9MTHQs-lg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

// 24 Handphone 100% Baru BNIB Segel Resmi Indonesia dengan Benchmark AnTuTu v10 & Uji Gaming FPS
export const SEED_PRODUCTS = ALL_PHONES.map((phone, idx) => ({
  ...phone,
  slug: phone.slug || phone.id,
  category: phone.category || (
    phone.price_tier === '1-2-jt' ? 'Entry Level Budget' :
    phone.price_tier === '2-4-jt' ? 'Mid-Range Sweet Spot' :
    phone.price_tier === '4-8-jt' ? 'Flagship Killer' : 'Ultra Flagship'
  ),
  stock: phone.stock || (12 + (idx % 10)),
  imei: phone.imei || `3589${String(10000000000 + idx * 7919).slice(0, 11)}`,
  condition: 'baru',
  grade: '100% Baru (BNIB Segel)',
  battery_health: null,
  is_active: true,
  is_featured: phone.is_featured ?? true,
  created_at: new Date(Date.now() - idx * 3600000).toISOString()
}));

export const STANDARD_CHECKLIST_ITEMS = [
  { category: 'Keaslian & Segel', item_name: 'Segel Pabrik / Green Peel Utuh & Belum Terbuka' },
  { category: 'Legalitas & IMEI', item_name: 'IMEI Terdaftar Resmi di Database Kemenperin / Bea Cukai' },
  { category: 'Garansi Distributor', item_name: 'Kartu Garansi Resmi Distributor (TAM, SEIN, iBox, Carlcare, Realme, Vivo)' },
  { category: 'Kelengkapan Kotak', item_name: 'Aksesoris Original Bawaan (Kabel Type-C, Adaptor, SIM Ejector, Buku Panduan)' },
  { category: 'Layar & Display', item_name: 'Layar Bebas Dead Pixel, Garis Vertikal & Touch 120Hz Mulus' },
  { category: 'Benchmark AnTuTu v10', item_name: 'Lolos Stress Test AnTuTu v10 Tanpa Overheating / Throttling' },
  { category: 'Uji Gaming FPS', item_name: 'Uji Frame Rate Gaming (MLBB 120FPS, PUBG 90FPS, Genshin) Stabil' },
  { category: 'Baterai & Pengisian', item_name: 'Kapasitas Baterai 100% Pabrik & Fast Charging Berfungsi Maksimal' },
  { category: 'Kamera & Sensor', item_name: 'Kamera Utama OIS, Ultra-wide & Selfie Jernih Bebas Jamur' },
  { category: 'Konektivitas', item_name: 'Sinyal 5G/4G Dual SIM All Operator, Wi-Fi 6 & NFC Aktif' },
  { category: 'Keamanan Biometrik', item_name: 'Under-Display Fingerprint & Face Unlock Responsif' },
  { category: 'Audio & Speaker', item_name: 'Dual Stereo Speakers Jernih & Mikrofon Sensitif' }
];

export { PRICE_TIERS, ALL_PHONES };
