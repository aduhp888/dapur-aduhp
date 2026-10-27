import { supabase } from './supabase';

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
 * Fetch products from Supabase
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
      console.warn('Supabase fetch products error:', error.message);
      return { data: [], isFallback: false, error: error.message };
    }

    return { data: data || [], isFallback: false, error: null };
  } catch (err) {
    console.error('getProducts error:', err);
    return { data: [], isFallback: false, error: err.message };
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
      return { data: null, isFallback: false, error: error?.message || 'Produk tidak ditemukan' };
    }

    return { data, isFallback: false, error: null };
  } catch (err) {
    return { data: null, isFallback: false, error: err.message };
  }
}

/**
 * Upload image to Supabase Storage bucket 'products'
 * Format terstruktur: uploads/${slug-produk}/${warna}-${kondisi}-${index}.jpg
 */
export async function uploadProductImage(file, metadata = {}) {
  if (!file) return null;

  const toSlug = (text, fallback = '') => {
    if (!text || typeof text !== 'string') return fallback;
    const cleaned = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return cleaned || fallback;
  };

  const productSlug = toSlug(metadata.productName || metadata.slug || metadata.name || '', 'produk');
  const colorSlug = toSlug(metadata.color || metadata.warna || '', 'default');
  const conditionSlug = toSlug(metadata.condition || metadata.kondisi || '', 'mulus');
  const rawIndex = parseInt(metadata.index, 10);
  const indexStr = !isNaN(rawIndex) && rawIndex > 0 ? String(rawIndex).padStart(2, '0') : '01';

  const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
  const cleanExt = fileExt === 'jpeg' ? 'jpg' : (fileExt || 'jpg');

  const fileName = `${colorSlug}-${conditionSlug}-${indexStr}.${cleanExt}`;
  const filePath = `uploads/${productSlug}/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
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
