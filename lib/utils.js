import { supabase, SEED_PRODUCTS } from './supabase';

export function formatIDR(amount) {
  if (amount === undefined || amount === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Fetch products from Supabase with graceful fallback
 */
export async function getProducts(filter = {}) {
  try {
    let query = supabase.from('dapur_products').select('*').order('created_at', { ascending: false });

    if (filter.condition && filter.condition !== 'all') {
      query = query.eq('condition', filter.condition);
    }
    if (filter.brand && filter.brand !== 'all') {
      query = query.eq('brand', filter.brand);
    }
    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,imei.ilike.%${filter.search}%,brand.ilike.%${filter.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch products error (using fallback if table not ready):', error.message);
      // Return fallback seed data filtered in-memory
      let result = [...SEED_PRODUCTS];
      if (filter.condition && filter.condition !== 'all') {
        result = result.filter(p => p.condition === filter.condition);
      }
      if (filter.brand && filter.brand !== 'all') {
        result = result.filter(p => p.brand.toLowerCase() === filter.brand.toLowerCase());
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(q) || (p.imei && p.imei.includes(q)));
      }
      return { data: result, isFallback: true, error: error.message };
    }

    // If database returned empty array initially, offer to seed or show empty
    return { data: data || [], isFallback: false, error: null };
  } catch (err) {
    console.error('getProducts error:', err);
    return { data: SEED_PRODUCTS, isFallback: true, error: err.message };
  }
}

/**
 * Fetch single product by ID or slug
 */
export async function getProductById(id) {
  try {
    const { data, error } = await supabase
      .from('dapur_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      const fallback = SEED_PRODUCTS.find(p => p.id === id || p.slug === id);
      return { data: fallback || null, isFallback: true };
    }

    return { data, isFallback: false };
  } catch (err) {
    const fallback = SEED_PRODUCTS.find(p => p.id === id);
    return { data: fallback || null, isFallback: true };
  }
}

/**
 * Upload image to Supabase Storage bucket 'products'
 */
export async function uploadProductImage(file) {
  if (!file) return null;
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Storage upload error, using object URL / base64 fallback:', error.message);
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err.message };
  }
}
