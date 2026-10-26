// Database Handphone Baru Resmi Indonesia (Garansi TAM, SEIN, iBox, Carlcare, Realme, Vivo)
// Mencakup semua tier harga: 1-2 Jutaan, 2-4 Jutaan, 4-8 Jutaan, hingga Ultra Flagship (> 8 Juta)

export const PRICE_TIERS = [
  { 
    id: 'all', 
    label: 'Semua Kelas Harga', 
    shortLabel: 'Semua', 
    range: 'Rp 1 Juta s/d Flagship',
    badge: 'Lengkap',
    color: '#FFFFFF'
  },
  { 
    id: '1-2-jt', 
    label: 'Rp 1 - 2 Jutaan', 
    shortLabel: '1 - 2 Juta', 
    range: 'Rp 1.000.000 - Rp 1.999.000',
    category: 'Entry Level Budget',
    badge: 'Budget Hemat',
    color: '#00E5FF',
    antutuAvg: '~240.000 - 280.000'
  },
  { 
    id: '2-4-jt', 
    label: 'Rp 2 - 4 Jutaan', 
    shortLabel: '2 - 4 Juta', 
    range: 'Rp 2.000.000 - Rp 3.999.000',
    category: 'Mid-Range Value & Gaming',
    badge: 'Sweet Spot',
    color: '#C6FF00',
    antutuAvg: '~350.000 - 950.000'
  },
  { 
    id: '4-8-jt', 
    label: 'Rp 4 - 8 Jutaan', 
    shortLabel: '4 - 8 Juta', 
    range: 'Rp 4.000.000 - Rp 7.999.000',
    category: 'Upper Mid-Range & Flagship Killer',
    badge: 'Flagship Killer',
    color: '#FF9100',
    antutuAvg: '~700.000 - 1.500.000'
  },
  { 
    id: 'flagship', 
    label: 'Rp 8 Juta+ (Ultra Flagship)', 
    shortLabel: '8 Juta+ Flagship', 
    range: 'Rp 8.000.000 ke atas',
    category: 'Ultra Flagship & Premium',
    badge: 'Ultra Flagship',
    color: '#E040FB',
    antutuAvg: '~1.800.000 - 2.200.000'
  }
];

export const ALL_PHONES = [];

// Backwards compatibility alias for components importing ENTRY_LEVEL_PHONES
export const ENTRY_LEVEL_PHONES = ALL_PHONES;

export const BRAND_OPTIONS = [
  'Semua Brand',
  'Xiaomi',
  'Samsung',
  'Infinix',
  'Tecno',
  'iQOO',
  'Vivo',
  'Realme',
  'Apple'
];
