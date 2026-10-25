import { NextResponse } from 'next/server';
import { supabase, SEED_PRODUCTS } from '@/lib/supabase';
import { formatIDR, slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * Endpoint JSON resmi untuk konsumsi Flutter Android & iPhone
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const isFeatured = searchParams.get('featured');

    let query = supabase
      .from('dapur_products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (condition && condition !== 'all') {
      query = query.eq('condition', condition);
    }
    if (brand && brand !== 'all') {
      query = query.ilike('brand', brand);
    }
    if (isFeatured === 'true') {
      query = query.eq('is_featured', true);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,imei.ilike.%${search}%,brand.ilike.%${search}%`);
    }

    const { data, error } = await query;

    let products = data;
    let source = 'supabase_live';

    // Graceful fallback to rich seed items if table is not yet migrated in Supabase
    if (error || !data || data.length === 0) {
      source = error ? 'fallback_seed_table_missing' : 'supabase_live_empty';
      let fallback = [...SEED_PRODUCTS];
      if (condition && condition !== 'all') {
        fallback = fallback.filter(p => p.condition === condition);
      }
      if (brand && brand !== 'all') {
        fallback = fallback.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
      }
      if (isFeatured === 'true') {
        fallback = fallback.filter(p => p.is_featured);
      }
      if (search) {
        const q = search.toLowerCase();
        fallback = fallback.filter(p => p.name.toLowerCase().includes(q) || (p.imei && p.imei.includes(q)));
      }
      products = error ? fallback : (data || []);
    }

    // Enhance each item with formatted mobile fields
    const formattedProducts = (products || []).map((item) => ({
      ...item,
      formatted_price: formatIDR(item.price),
      formatted_original_price: item.original_price ? formatIDR(item.original_price) : null,
      discount_percentage: item.original_price && item.original_price > item.price
        ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
        : 0,
      badge_text: item.condition === 'baru' 
        ? 'BNIB Segel Resmi' 
        : (item.grade || 'Second Grade A+'),
      is_ready_stock: (item.stock || 0) > 0,
    }));

    return NextResponse.json({
      status: 'success',
      endpoint: '/api/products',
      target_clients: ['Flutter Android', 'Flutter iOS', 'Web Client'],
      total: formattedProducts.length,
      data_source: source,
      data: formattedProducts,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: err.message,
      data: SEED_PRODUCTS,
    }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Tambah produk baru dari Admin atau Mobile App
 */
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.price) {
      return NextResponse.json({
        status: 'error',
        message: 'Field name dan price wajib diisi',
      }, { status: 400 });
    }

    const newProduct = {
      name: body.name,
      slug: slugify(body.name),
      brand: body.brand || 'Apple',
      category: body.category || 'Smartphone',
      condition: body.condition || 'baru',
      grade: body.grade || (body.condition === 'baru' ? 'Baru (BNIB)' : 'Second Grade A+ (Mulus 99%)'),
      battery_health: body.battery_health ? parseInt(body.battery_health, 10) : null,
      official_distributor: body.official_distributor || (body.condition === 'baru' ? 'iBox / Digimap Resmi 1 Tahun' : 'Garansi Toko 30 Hari'),
      imei: body.imei || null,
      price: parseFloat(body.price),
      original_price: body.original_price ? parseFloat(body.original_price) : null,
      stock: body.stock !== undefined ? parseInt(body.stock, 10) : 1,
      ram_gb: body.ram_gb ? parseInt(body.ram_gb, 10) : 8,
      storage_gb: body.storage_gb ? parseInt(body.storage_gb, 10) : 256,
      color: body.color || 'Black',
      description: body.description || '',
      images: Array.isArray(body.images) ? body.images : [body.image_url || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000'],
      specs: body.specs || {},
      is_featured: Boolean(body.is_featured),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    };

    const { data, error } = await supabase
      .from('dapur_products')
      .insert([newProduct])
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Gagal insert ke Supabase: ' + error.message,
        hint: 'Pastikan tabel dapur_products sudah dibuat via SQL editor.',
      }, { status: 400 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Produk berhasil ditambahkan ke dapur_products!',
      data,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
