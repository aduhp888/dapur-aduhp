import { createClient } from '@supabase/supabase-js';
import { ALL_PHONES, PRICE_TIERS } from './phonesData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://beajiozqffgbczkhmwan.supabase.co';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
  },
});

export const SEED_SECOND_PHONES = [];

export const SEED_PRODUCTS = [];

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
