// Database Handphone Baru Resmi Indonesia (Garansi TAM, SEIN, iBox, Carlcare, Realme, Vivo)
// Mencakup 7 tier harga: 1-2 Juta, 2-4 Juta, 4-6 Juta, 6-8 Juta, 8-10 Juta, 10-15 Juta, dan 15 Juta ke Atas

export const PRICE_TIERS = [
  { 
    id: 'all', 
    label: 'Semua Kelas Harga', 
    shortLabel: 'Semua', 
    range: 'Semua Rentang Harga',
    badge: 'Lengkap',
    color: '#FFFFFF'
  },
  { 
    id: '1-2-jt', 
    label: 'Rp 1 - 2 Juta', 
    shortLabel: '1 - 2 Juta', 
    range: 'Rp 1.000.000 - Rp 1.999.999',
    minPrice: 1000000,
    maxPrice: 1999999,
    category: 'Entry Level Budget',
    badge: 'Budget Hemat',
    color: '#00E5FF',
    antutuAvg: '~240.000 - 380.000'
  },
  { 
    id: '2-4-jt', 
    label: 'Rp 2 - 4 Juta', 
    shortLabel: '2 - 4 Juta', 
    range: 'Rp 2.000.000 - Rp 3.999.999',
    minPrice: 2000000,
    maxPrice: 3999999,
    category: 'Mid-Range Value & Gaming',
    badge: 'Sweet Spot',
    color: '#C6FF00',
    antutuAvg: '~400.000 - 850.000'
  },
  { 
    id: '4-6-jt', 
    label: 'Rp 4 - 6 Juta', 
    shortLabel: '4 - 6 Juta', 
    range: 'Rp 4.000.000 - Rp 5.999.999',
    minPrice: 4000000,
    maxPrice: 5999999,
    category: 'Upper Mid-Range',
    badge: 'Upper Mid',
    color: '#FFB300',
    antutuAvg: '~750.000 - 1.250.000'
  },
  { 
    id: '6-8-jt', 
    label: 'Rp 6 - 8 Juta', 
    shortLabel: '6 - 8 Juta', 
    range: 'Rp 6.000.000 - Rp 7.999.999',
    minPrice: 6000000,
    maxPrice: 7999999,
    category: 'Flagship Killer Performance',
    badge: 'Flagship Killer',
    color: '#FF7043',
    antutuAvg: '~1.100.000 - 1.650.000'
  },
  { 
    id: '8-10-jt', 
    label: 'Rp 8 - 10 Juta', 
    shortLabel: '8 - 10 Juta', 
    range: 'Rp 8.000.000 - Rp 9.999.999',
    minPrice: 8000000,
    maxPrice: 9999999,
    category: 'Sub-Flagship & Compact',
    badge: 'Sub-Flagship',
    color: '#AB47BC',
    antutuAvg: '~1.500.000 - 1.950.000'
  },
  { 
    id: '10-15-jt', 
    label: 'Rp 10 - 15 Juta', 
    shortLabel: '10 - 15 Juta', 
    range: 'Rp 10.000.000 - Rp 14.999.999',
    minPrice: 10000000,
    maxPrice: 14999999,
    category: 'High-End Premium Flagship',
    badge: 'Premium Flagship',
    color: '#EC407A',
    antutuAvg: '~1.800.000 - 2.400.000'
  },
  { 
    id: '15-jt-plus', 
    label: 'Rp 15 Juta ke Atas', 
    shortLabel: '15 Juta+', 
    range: 'Rp 15.000.000 ke atas',
    minPrice: 15000000,
    maxPrice: Infinity,
    category: 'Ultra Flagship & Foldable',
    badge: 'Ultra Flagship',
    color: '#E040FB',
    antutuAvg: '> 2.200.000'
  }
];

export function autoDetectPriceTier(price) {
  const p = Number(price) || 0;
  if (p < 2000000) return '1-2-jt';
  if (p < 4000000) return '2-4-jt';
  if (p < 6000000) return '4-6-jt';
  if (p < 8000000) return '6-8-jt';
  if (p < 10000000) return '8-10-jt';
  if (p < 15000000) return '10-15-jt';
  return '15-jt-plus';
}

export function matchPriceTier(product, tierId) {
  if (!tierId || tierId === 'all') return true;
  if (!product) return false;
  if (product.price_tier === tierId) return true;

  const price = Number(product.price) || 0;
  if (tierId === '1-2-jt') return price < 2000000;
  if (tierId === '2-4-jt') return price >= 2000000 && price < 4000000;
  if (tierId === '4-6-jt') return price >= 4000000 && price < 6000000;
  if (tierId === '6-8-jt') return price >= 6000000 && price < 8000000;
  if (tierId === '8-10-jt') return price >= 8000000 && price < 10000000;
  if (tierId === '10-15-jt') return price >= 10000000 && price < 15000000;
  if (tierId === '15-jt-plus') return price >= 15000000;

  // Legacy mappings
  if (tierId === '4-8-jt') return price >= 4000000 && price < 8000000;
  if (tierId === 'flagship') return price >= 8000000;

  return false;
}

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
