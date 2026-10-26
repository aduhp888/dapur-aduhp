import { createClient } from '@supabase/supabase-js';
import { ALL_PHONES, PRICE_TIERS } from './phonesData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://beajiozqffgbczkhmwan.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYWppb3pxZmZnYmN6a2htd2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjU2NzQsImV4cCI6MjEwODQ0MTY3NH0.2lxXwyIl4tQY1lhK52lVhwzLgmpzvRYNkQ9MTHQs-lg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

// Curated Seed Handphone Second Bersertifikat aduHP Lab (dengan 5 Foto Fisik Lolos QC)
export const SEED_SECOND_PHONES = [
  {
    id: 'second-iphone-13-pro-256gb',
    slug: 'iphone-13-pro-256gb-second-grade-a',
    name: 'iPhone 13 Pro 256GB Sierra Blue (Second Grade A+)',
    brand: 'Apple',
    category: 'Flagship Smartphone',
    condition: 'second',
    grade: 'Second Grade A+ (Mulus 99% No Dent)',
    badge: '35 QC Passed • BH 92%',
    battery_health: 92,
    official_distributor: 'Eks Resmi iBox • Garansi Toko 30 Hari Ganti Unit',
    imei: '351982039182390',
    imei_status: 'Resmi Kemenperin All Operator Bebas Blokir Selamanya',
    completeness: 'Fullset Dus Box + Kabel Lightning Original Bawaan',
    price_tier: '4-8-jt',
    price: 9499000,
    original_price: 18499000,
    stock: 3,
    ram_gb: 6,
    storage_gb: 256,
    color: 'Sierra Blue',
    description: 'Unit second mulus 99% seperti baru, tanpa dent atau baret dalam. Layar original True Tone & ProMotion 120Hz 100% aktif. Face ID kilat. Baterai Health 92% original belum pernah servis atau dibongkar. Lolos 35 titik uji lab aduHP.',
    images: [
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop'
    ],
    specs: {
      chipset: 'Apple A15 Bionic (5nm 6-core)',
      display: '6.1" Super Retina XDR OLED ProMotion 120Hz',
      battery: '3095 mAh • Battery Health 92% Original',
      camera: 'Triple 12MP (Tele 3x, Wide OIS, Ultra-Wide) + LiDAR',
      os: 'iOS 18 Supported'
    },
    antutu: {
      version: 'AnTuTu Benchmark v10',
      total: 1320000,
      cpu: 345000,
      gpu: 480000,
      memory: 235000,
      ux: 260000,
      tier: 'Flagship Tier'
    },
    gaming_fps: {
      mlbb: '120 FPS Ultra',
      freefire: '60 FPS Max',
      pubg: '90 FPS Extreme',
      genshin: '58 FPS High'
    },
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
  },
  {
    id: 'second-s23-ultra-256gb',
    slug: 'samsung-galaxy-s23-ultra-256gb-second-sein',
    name: 'Samsung Galaxy S23 Ultra 256GB Phantom Black (Second Eks SEIN)',
    brand: 'Samsung',
    category: 'Ultra Flagship',
    condition: 'second',
    grade: 'Second Grade A+ (Mulus 98% Terawat)',
    badge: 'Eks SEIN • BH 95% • S-Pen Aktif',
    battery_health: 95,
    official_distributor: 'Eks SEIN Resmi Indonesia • Garansi Toko 30 Hari',
    imei: '352091823901923',
    imei_status: 'Resmi SEIN Indonesia Sinyal Permanen Selamanya',
    completeness: 'Fullset Dus Box + S-Pen Original + Kabel Type-C',
    price_tier: 'flagship',
    price: 11499000,
    original_price: 19999000,
    stock: 2,
    ram_gb: 8,
    storage_gb: 256,
    color: 'Phantom Black',
    description: 'Unit eks garansi resmi SEIN Indonesia. Bebas blokir IMEI selamanya. Bodi terawat mulus 98%, layar Dynamic AMOLED 2X bebas shadow/burn-in. S-Pen Bluetooth normal responsif. Kamera 200MP Space Zoom 100x jernih tajam.',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop'
    ],
    specs: {
      chipset: 'Snapdragon 8 Gen 2 for Galaxy (4nm)',
      display: '6.8" Edge QHD+ Dynamic AMOLED 2X 120Hz',
      battery: '5000 mAh 45W Fast Charge • BH 95%',
      camera: 'Quad 200MP OIS + 10MP Periskop 10x + 10MP 3x + 12MP UW',
      os: 'Android 14 One UI 6.1 (Galaxy AI)'
    },
    antutu: {
      version: 'AnTuTu Benchmark v10',
      total: 1540000,
      cpu: 390000,
      gpu: 590000,
      memory: 280000,
      ux: 280000,
      tier: 'Flagship Supreme Tier'
    },
    gaming_fps: {
      mlbb: '120 FPS Ultra',
      freefire: '60 FPS Max',
      pubg: '90 FPS Extreme',
      genshin: '60 FPS Highest'
    },
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 3600 * 4).toISOString()
  },
  {
    id: 'second-iphone-14-pro-max-256gb',
    slug: 'iphone-14-pro-max-256gb-second-grade-a',
    name: 'iPhone 14 Pro Max 256GB Deep Purple (Second Grade A+ iBox)',
    brand: 'Apple',
    category: 'Flagship Smartphone',
    condition: 'second',
    grade: 'Second Grade A+ (Mulus 99% Like New)',
    badge: 'Eks iBox • BH 94% • Dynamic Island',
    battery_health: 94,
    official_distributor: 'Eks Resmi Digimap / iBox • Garansi Toko 45 Hari',
    imei: '353901829018231',
    imei_status: 'Resmi Kemenperin iBox Tembus All Operator Bebas Blokir',
    completeness: 'Fullset Box Original + Manual Book + Sim Tray Match',
    price_tier: 'flagship',
    price: 13999000,
    original_price: 22999000,
    stock: 2,
    ram_gb: 6,
    storage_gb: 256,
    color: 'Deep Purple',
    description: 'Unit eks resmi iBox model ID/A. Warna favorit Deep Purple mulus no lecet. Dynamic Island mulus responsif, Always-On Display jernih, Kamera 48MP ProRAW tajam luar biasa. Baterai Health 94% awet seharian.',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop'
    ],
    specs: {
      chipset: 'Apple A16 Bionic (4nm)',
      display: '6.7" Super Retina XDR OLED 120Hz ProMotion',
      battery: '4323 mAh • BH 94% Awet Seharian',
      camera: 'Triple 48MP Main + 12MP Ultra-wide + 12MP Tele 3x',
      os: 'iOS 18 Ready'
    },
    antutu: {
      version: 'AnTuTu Benchmark v10',
      total: 1470000,
      cpu: 370000,
      gpu: 520000,
      memory: 270000,
      ux: 310000,
      tier: 'Flagship Tier'
    },
    gaming_fps: {
      mlbb: '120 FPS Ultra',
      freefire: '60 FPS Max',
      pubg: '90 FPS Extreme',
      genshin: '60 FPS Highest'
    },
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 3600 * 6).toISOString()
  },
  {
    id: 'second-poco-f5-256gb',
    slug: 'poco-f5-256gb-second-grade-a',
    name: 'POCO F5 12/256GB Carbon Black (Second Grade A Mulus)',
    brand: 'POCO',
    category: 'Gaming Beast',
    condition: 'second',
    grade: 'Second Grade A (Mulus 97% Bekas Pemakaian Wajar)',
    badge: 'Monster Gaming • AnTuTu 1.1 Juta',
    battery_health: 93,
    official_distributor: 'Eks TAM Resmi Indonesia • Garansi Toko 30 Hari',
    imei: '861928301928312',
    imei_status: 'Resmi Kemenperin TAM Bebas Blokir',
    completeness: 'Fullset Kotak Kuning POCO + Charger 67W Bawaan + Case',
    price_tier: '2-4-jt',
    price: 3699000,
    original_price: 5299000,
    stock: 4,
    ram_gb: 12,
    storage_gb: 256,
    color: 'Carbon Black',
    description: 'Unit eks resmi TAM. Performa monster Snapdragon 7+ Gen 2 setara flagship. Layar Flow AMOLED 120Hz mulus tanpa gores. Charger bawaan 67W Turbo Charge masih ngebut mengisi 0-100% dalam 45 menit.',
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop'
    ],
    specs: {
      chipset: 'Snapdragon 7+ Gen 2 (4nm TSMC)',
      display: '6.67" Flow AMOLED 120Hz 1000 nits',
      battery: '5000 mAh • 67W Turbo Charge (BH 93%)',
      camera: '64MP OIS + 8MP Ultra-wide + 2MP Makro',
      os: 'Xiaomi HyperOS (Android 14)'
    },
    antutu: {
      version: 'AnTuTu Benchmark v10',
      total: 1120000,
      cpu: 310000,
      gpu: 420000,
      memory: 195000,
      ux: 195000,
      tier: 'Flagship Killer Tier'
    },
    gaming_fps: {
      mlbb: '120 FPS Ultra',
      freefire: '60 FPS Max',
      pubg: '90 FPS Extreme',
      genshin: '57 FPS High'
    },
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 3600 * 8).toISOString()
  },
  {
    id: 'second-xiaomi-13t-256gb',
    slug: 'xiaomi-13t-256gb-second-grade-a',
    name: 'Xiaomi 13T 12/256GB Leica Meadow Green (Second Grade A+)',
    brand: 'Xiaomi',
    category: 'Pro Camera Phone',
    condition: 'second',
    grade: 'Second Grade A+ (Mulus 99% Fullset)',
    badge: 'Kamera Leica 50MP • IP68 Tahan Air',
    battery_health: 96,
    official_distributor: 'Eks TAM Resmi Indonesia • Garansi Toko 30 Hari',
    imei: '862093182903123',
    imei_status: 'Resmi Kemenperin All Operator Aman Selamanya',
    completeness: 'Fullset Dus Box Lengkap + Charger 67W + Case Transparan',
    price_tier: '4-8-jt',
    price: 4999000,
    original_price: 6499000,
    stock: 2,
    ram_gb: 12,
    storage_gb: 256,
    color: 'Meadow Green',
    description: 'Unit second mulus 99% seperti baru. Lensa kamera Leica Authentic & Vibrant tajam dengan warna khas Leica. Sertifikasi tahan air IP68 utuh. Layar CrystalRes AMOLED 144Hz sangat responsif.',
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop'
    ],
    specs: {
      chipset: 'MediaTek Dimensity 8200-Ultra (4nm)',
      display: '6.67" CrystalRes AMOLED 144Hz 2600 nits Dolby Vision',
      battery: '5000 mAh • 67W Turbo Charge (BH 96%)',
      camera: 'Triple Leica 50MP OIS + 50MP Telephoto 2x + 12MP Ultra-wide',
      os: 'Xiaomi HyperOS (Android 14)'
    },
    antutu: {
      version: 'AnTuTu Benchmark v10',
      total: 890000,
      cpu: 240000,
      gpu: 310000,
      memory: 170000,
      ux: 170000,
      tier: 'Upper Mid-Range Tier'
    },
    gaming_fps: {
      mlbb: '120 FPS Ultra',
      freefire: '60 FPS Max',
      pubg: '90 FPS Extreme',
      genshin: '52 FPS Medium'
    },
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 3600 * 12).toISOString()
  }
];

// 24 Handphone Baru Database aduHP: Terbagi antara UNIT DIJUAL vs DATA PEMBANDING ADUAN (TIDAK DIJUAL)
// Model-model HP Baru yang resmi ready stock & dijual oleh toko aduHP:
const SOLD_BY_ADUHP_IDS = [
  'poco-f6-5g', 
  'redmi-note-13-pro-5g', 
  'samsung-galaxy-a55-5g', 
  'infinix-gt-20-pro-5g', 
  'iphone-15-128gb',
  'realme-12-pro-plus-5g',
  'vivo-v30-5g',
  'poco-x6-pro-5g',
  'infinix-note-40-pro',
  'redmi-13c-6gb'
];

const SEED_NEW_PHONES = ALL_PHONES.map((phone, idx) => {
  const isForSale = SOLD_BY_ADUHP_IDS.includes(phone.id) || phone.is_for_sale === true;

  return {
    ...phone,
    slug: phone.slug || phone.id,
    category: phone.category || (
      phone.price_tier === '1-2-jt' ? 'Entry Level Budget' :
      phone.price_tier === '2-4-jt' ? 'Mid-Range Sweet Spot' :
      phone.price_tier === '4-8-jt' ? 'Flagship Killer' : 'Ultra Flagship'
    ),
    is_for_sale: isForSale,
    sale_status: isForSale ? 'dijual' : 'compare_only',
    stock: isForSale ? (phone.stock || (12 + (idx % 8))) : 0,
    imei: isForSale ? (phone.imei || `3589${String(10000000000 + idx * 7919).slice(0, 11)}`) : null,
    condition: 'baru',
    grade: '100% Baru (BNIB Segel)',
    badge: isForSale ? '🟢 Dijual oleh aduHP (Ready Stock)' : '⚖️ Hanya Pembanding Aduan (Tidak Dijual)',
    battery_health: null,
    is_active: true,
    is_featured: phone.is_featured ?? true,
    created_at: new Date(Date.now() - idx * 3600000).toISOString()
  };
});

// Update SEED_SECOND_PHONES agar semuanya berstatus is_for_sale: true (HP Second Lolos QC Dijual)
const ENRICHED_SECOND_PHONES = SEED_SECOND_PHONES.map(phone => ({
  ...phone,
  is_for_sale: true,
  sale_status: 'dijual',
  badge: phone.badge || '🟢 HP Second Lolos QC Dijual'
}));

// Gabungan Semua Produk (Baru Dijual + Baru Pembanding + Second Dijual)
export const SEED_PRODUCTS = [...ENRICHED_SECOND_PHONES, ...SEED_NEW_PHONES];

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
