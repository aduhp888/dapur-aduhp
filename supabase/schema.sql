-- ==============================================================================
-- DATABASE SCHEMA RESMI: aduHP & Dapur aduHP (Supabase PostgreSQL 15+)
-- Platform Katalog HP, Aduan Spek AI, dan E-Commerce Resmi Rekening PT
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EKSTENSI & FUNGSI SISTEM
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fungsi Universal untuk Auto-update timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------------------------
-- 2. TABEL: dapur_products (Katalog HP Baru BNIB, HP Second, & HP Aduan)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dapur_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'POCO',
    category TEXT NOT NULL DEFAULT 'Smartphone',
    price_tier TEXT DEFAULT '1-2-jt' CHECK (price_tier IN ('1-2-jt', '2-4-jt', '4-6-jt', '6-8-jt', '8-10-jt', '10-15-jt', '15-jt-plus', '4-8-jt', 'flagship')),
    
    -- Kondisi: 'baru' (BNIB Segel Resmi) atau 'second' (Bekas Lolos QC Lab)
    condition TEXT NOT NULL DEFAULT 'baru' CHECK (condition IN ('baru', 'second')),
    grade TEXT DEFAULT '100% Baru (BNIB Segel)',
    badge TEXT DEFAULT '🟢 Dijual oleh aduHP',
    battery_health INT CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
    
    -- Legalitas & Distributor Resmi (TAM, SEIN, iBox, Digimap, dll)
    official_distributor TEXT DEFAULT 'Resmi Indonesia',
    imei TEXT,
    
    -- Harga, Diskon, & Stok Toko
    price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(14, 2),
    stock INT NOT NULL DEFAULT 1,
    is_for_sale BOOLEAN NOT NULL DEFAULT true,
    sale_status TEXT NOT NULL DEFAULT 'dijual' CHECK (sale_status IN ('dijual', 'compare_only')),
    
    -- Konfigurasi Memori Dasar & Warna
    ram_gb INT,
    storage_gb INT,
    color TEXT DEFAULT 'Black',
    description TEXT,
    
    -- Galeri 5 Foto Fisik Terkompresi & Label Slot Foto
    images JSONB DEFAULT '[]'::jsonb,
    photo_labels JSONB DEFAULT '[]'::jsonb,
    
    -- Spesifikasi Lengkap, Varian Tambahan, AnTuTu v10 & Uji FPS Game
    specs JSONB DEFAULT '{}'::jsonb,
    antutu JSONB DEFAULT '{"total": 0, "cpu": 0, "gpu": 0, "memory": 0, "ux": 0, "tier": ""}'::jsonb,
    gaming_fps JSONB DEFAULT '{"mlbb": "60 FPS", "pubg": "60 FPS", "genshin": "45 FPS"}'::jsonb,
    
    -- Flag Tampilan
    is_featured BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolom pelengkap & Pembaruan 7 Kategori Harga (Aman dijalankan jika tabel sudah ada)
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS photo_labels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS sale_status TEXT NOT NULL DEFAULT 'dijual';
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS battery_health INT;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS antutu JSONB DEFAULT '{"total": 0, "cpu": 0, "gpu": 0, "memory": 0, "ux": 0, "tier": ""}'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS gaming_fps JSONB DEFAULT '{"mlbb": "60 FPS", "pubg": "60 FPS", "genshin": "45 FPS"}'::jsonb;

-- Pembaruan CHECK Constraint 7 Kategori Harga (1-2 Jt, 2-4 Jt, 4-6 Jt, 6-8 Jt, 8-10 Jt, 10-15 Jt, 15 Jt+)
ALTER TABLE public.dapur_products DROP CONSTRAINT IF EXISTS dapur_products_price_tier_check;
ALTER TABLE public.dapur_products ADD CONSTRAINT dapur_products_price_tier_check 
CHECK (price_tier IN ('1-2-jt', '2-4-jt', '4-6-jt', '6-8-jt', '8-10-jt', '10-15-jt', '15-jt-plus', '4-8-jt', 'flagship'));

-- Migrasi otomatis data lama ke 7 kategori baru berdasarkan harga riil produk
UPDATE public.dapur_products
SET price_tier = CASE
    WHEN price < 2000000 THEN '1-2-jt'
    WHEN price < 4000000 THEN '2-4-jt'
    WHEN price < 6000000 THEN '4-6-jt'
    WHEN price < 8000000 THEN '6-8-jt'
    WHEN price < 10000000 THEN '8-10-jt'
    WHEN price < 15000000 THEN '10-15-jt'
    ELSE '15-jt-plus'
END
WHERE price_tier IN ('4-8-jt', 'flagship') OR price_tier IS NULL;

-- Index Pencarian & Filter Cepat Katalog
CREATE INDEX IF NOT EXISTS idx_dapur_products_condition ON public.dapur_products(condition);
CREATE INDEX IF NOT EXISTS idx_dapur_products_brand ON public.dapur_products(brand);
CREATE INDEX IF NOT EXISTS idx_dapur_products_price_tier ON public.dapur_products(price_tier);
CREATE INDEX IF NOT EXISTS idx_dapur_products_is_for_sale ON public.dapur_products(is_for_sale);
CREATE INDEX IF NOT EXISTS idx_dapur_products_is_active ON public.dapur_products(is_active);
CREATE INDEX IF NOT EXISTS idx_dapur_products_created_at ON public.dapur_products(created_at DESC);

-- Trigger auto-update timestamp dapur_products
DROP TRIGGER IF EXISTS trigger_dapur_products_updated_at ON public.dapur_products;
CREATE TRIGGER trigger_dapur_products_updated_at
BEFORE UPDATE ON public.dapur_products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ------------------------------------------------------------------------------
-- 3. TABEL: dapur_checklist (35 Titik Inspeksi QC Lab HP Second)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dapur_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.dapur_products(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'passed' CHECK (status IN ('passed', 'warning', 'failed', 'not_applicable')),
    notes TEXT,
    checked_by TEXT DEFAULT 'Teknisi aduHP Lab',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dapur_checklist_product_id ON public.dapur_checklist(product_id);


-- ------------------------------------------------------------------------------
-- 4. TABEL: dapur_orders (Pesanan Pembelian HP, Ongkir & Rekening Resmi PT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dapur_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    product_id UUID REFERENCES public.dapur_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_condition TEXT NOT NULL DEFAULT 'baru' CHECK (product_condition IN ('baru', 'second')),
    product_image TEXT,
    
    -- Varian RAM, Storage, dan Warna yang Dipilih Pembeli
    variant_ram INT,
    variant_storage INT,
    variant_color TEXT,
    
    -- Rincian Biaya Transaksi
    unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1,
    shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    insurance_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unique_code INT DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Data Pembeli & Kontak
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- Alamat Pengiriman
    shipping_province TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_district TEXT,
    shipping_postal_code TEXT,
    shipping_address TEXT NOT NULL,
    
    -- Logistik & Ekspedisi
    courier_code TEXT NOT NULL,
    courier_service TEXT NOT NULL,
    tracking_number TEXT,
    
    -- Pembayaran Resmi ke PT
    payment_method TEXT DEFAULT 'bank_transfer_pt',
    bank_name TEXT DEFAULT 'BCA (Bank Central Asia)',
    bank_account_name TEXT DEFAULT 'PT. SECOND CIRCLE TEKNOLOGI',
    bank_account_number TEXT DEFAULT '8830 9291 88',
    payment_status TEXT NOT NULL DEFAULT 'menunggu_pembayaran' 
        CHECK (payment_status IN (
            'menunggu_pembayaran', 
            'menunggu_verifikasi', 
            'pembayaran_diverifikasi', 
            'dikemas', 
            'dikirim', 
            'selesai', 
            'dibatalkan'
        )),
    payment_proof_url TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index Pencarian Pesanan Cepat
CREATE INDEX IF NOT EXISTS idx_dapur_orders_order_number ON public.dapur_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_dapur_orders_customer_phone ON public.dapur_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_dapur_orders_payment_status ON public.dapur_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_dapur_orders_created_at ON public.dapur_orders(created_at DESC);

-- Trigger auto-update timestamp dapur_orders
DROP TRIGGER IF EXISTS trigger_dapur_orders_updated_at ON public.dapur_orders;
CREATE TRIGGER trigger_dapur_orders_updated_at
BEFORE UPDATE ON public.dapur_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ------------------------------------------------------------------------------
-- 5. STORAGE BUCKET: products (Upload 5 Foto Fisik HP Terkompresi)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.dapur_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_orders ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses dapur_products (Baca Publik, Tulis/Edit dari Dapur)
DROP POLICY IF EXISTS "Public Read dapur_products" ON public.dapur_products;
DROP POLICY IF EXISTS "Allow All Operations dapur_products" ON public.dapur_products;
CREATE POLICY "Allow All Operations dapur_products" ON public.dapur_products 
FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan Akses dapur_checklist
DROP POLICY IF EXISTS "Public Read dapur_checklist" ON public.dapur_checklist;
DROP POLICY IF EXISTS "Allow All Operations dapur_checklist" ON public.dapur_checklist;
CREATE POLICY "Allow All Operations dapur_checklist" ON public.dapur_checklist 
FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan Akses dapur_orders (Insert Checkout dari Web, Kelola dari Dapur)
DROP POLICY IF EXISTS "Public Read and Insert dapur_orders" ON public.dapur_orders;
CREATE POLICY "Public Read and Insert dapur_orders" ON public.dapur_orders 
FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan Akses Storage Bucket 'products'
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow Upload products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow Update products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow Delete products bucket" ON storage.objects;
END $$;

CREATE POLICY "Public Read products bucket" ON storage.objects 
FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Allow Upload products bucket" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow Update products bucket" ON storage.objects 
FOR UPDATE USING (bucket_id = 'products');

CREATE POLICY "Allow Delete products bucket" ON storage.objects 
FOR DELETE USING (bucket_id = 'products');


-- ------------------------------------------------------------------------------
-- 7. TABEL: dapur_users (Manajemen Akun Superadmin & Admin Operasional)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dapur_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Admin Staff',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    avatar_url TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dapur_users_email ON public.dapur_users(email);
CREATE INDEX IF NOT EXISTS idx_dapur_users_role ON public.dapur_users(role);

ALTER TABLE public.dapur_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Operations dapur_users" ON public.dapur_users;
CREATE POLICY "Allow All Operations dapur_users" ON public.dapur_users
FOR ALL USING (true) WITH CHECK (true);

-- Trigger auto-update timestamp dapur_users
DROP TRIGGER IF EXISTS trigger_dapur_users_updated_at ON public.dapur_users;
CREATE TRIGGER trigger_dapur_users_updated_at
BEFORE UPDATE ON public.dapur_users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed akun Superadmin utama
INSERT INTO public.dapur_users (email, full_name, role, status, notes)
VALUES ('admin@aduhp.com', 'Superadmin Owner', 'superadmin', 'aktif', 'Pemilik Sistem & Pengelola Rekening PT')
ON CONFLICT (email) DO UPDATE SET role = 'superadmin', status = 'aktif';
