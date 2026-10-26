-- ==============================================================================
-- DATABASE SCHEMA: aduHP & Dapur aduHP (Supabase PostgreSQL 15+)
-- Tabel Jualan HP Baru BNIB Resmi & HP Second Lolos QC Lab
-- ==============================================================================

-- 1. Enable UUID & Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 2. TABLE: dapur_products (Katalog HP Baru & HP Second)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dapur_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'POCO',
    category TEXT NOT NULL DEFAULT 'Smartphone',
    price_tier TEXT DEFAULT '1-2-jt' CHECK (price_tier IN ('1-2-jt', '2-4-jt', '4-8-jt', 'flagship')),
    
    -- Kondisi: 'baru' (BNIB Segel) atau 'second' (Bekas Lolos QC)
    condition TEXT NOT NULL DEFAULT 'baru' CHECK (condition IN ('baru', 'second')),
    grade TEXT DEFAULT '100% Baru (BNIB Segel)',
    badge TEXT DEFAULT '🟢 Dijual oleh aduHP',
    
    -- Khusus HP Second (Kesehatan Baterai & Grade Fisik)
    battery_health INT CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
    
    -- Legalitas & Distributor Resmi (TAM, SEIN, iBox, Digimap, dll)
    official_distributor TEXT DEFAULT 'Resmi Indonesia',
    imei TEXT,
    
    -- Harga & Inventori Toko
    price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(14, 2),
    stock INT NOT NULL DEFAULT 1,
    is_for_sale BOOLEAN NOT NULL DEFAULT true,
    sale_status TEXT NOT NULL DEFAULT 'dijual' CHECK (sale_status IN ('dijual', 'compare_only')),
    
    -- Spesifikasi Utama & Varian
    ram_gb INT,
    storage_gb INT,
    color TEXT DEFAULT 'Black',
    description TEXT,
    
    -- Foto Produk (Mendukung hingga 5 foto terkompresi: format JSON Array URL)
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Spesifikasi Lengkap, Skor AnTuTu v10 & Uji FPS Gaming
    specs JSONB DEFAULT '{}'::jsonb,
    antutu JSONB DEFAULT '{"total": 0, "cpu": 0, "gpu": 0, "memory": 0, "ux": 0, "tier": ""}'::jsonb,
    gaming_fps JSONB DEFAULT '{"mlbb": "60 FPS", "pubg": "60 FPS", "genshin": "45 FPS"}'::jsonb,
    
    -- Flag Status
    is_featured BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jaga-jaga jika tabel dapur_products sudah ada sebelumnya, tambahkan kolom yang belum ada:
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS sale_status TEXT NOT NULL DEFAULT 'dijual';
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS battery_health INT;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS antutu JSONB DEFAULT '{"total": 0, "cpu": 0, "gpu": 0, "memory": 0, "ux": 0, "tier": ""}'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS gaming_fps JSONB DEFAULT '{"mlbb": "60 FPS", "pubg": "60 FPS", "genshin": "45 FPS"}'::jsonb;

-- ------------------------------------------------------------------------------
-- 3. TABLE: dapur_checklist (Verifikasi Fisik & 35 Titik Inspeksi QC HP Second)
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

-- ------------------------------------------------------------------------------
-- 4. INDEXES (Performa Query Katalog Cepat)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dapur_products_condition ON public.dapur_products(condition);
CREATE INDEX IF NOT EXISTS idx_dapur_products_brand ON public.dapur_products(brand);
CREATE INDEX IF NOT EXISTS idx_dapur_products_price_tier ON public.dapur_products(price_tier);
CREATE INDEX IF NOT EXISTS idx_dapur_products_is_for_sale ON public.dapur_products(is_for_sale);
CREATE INDEX IF NOT EXISTS idx_dapur_products_is_active ON public.dapur_products(is_active);
CREATE INDEX IF NOT EXISTS idx_dapur_products_created_at ON public.dapur_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dapur_checklist_product_id ON public.dapur_checklist(product_id);

-- ------------------------------------------------------------------------------
-- 5. VIEWS (Mempermudah Query Spesifik HP Baru & HP Second)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_hp_baru AS
SELECT * FROM public.dapur_products
WHERE condition = 'baru' AND is_active = true;

CREATE OR REPLACE VIEW public.view_hp_second AS
SELECT * FROM public.dapur_products
WHERE condition = 'second' AND is_active = true;

-- ------------------------------------------------------------------------------
-- 6. AUTO-UPDATE TRIGGER (updated_at)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dapur_products_updated_at ON public.dapur_products;
CREATE TRIGGER trigger_dapur_products_updated_at
BEFORE UPDATE ON public.dapur_products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. STORAGE BUCKET: products (Upload Hingga 5 Foto HP Terkompresi)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) & POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.dapur_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_checklist ENABLE ROW LEVEL SECURITY;

-- Policy Tabel: Pembacaan Publik (Website aduhp.com & Android/iOS)
DROP POLICY IF EXISTS "Public Read dapur_products" ON public.dapur_products;
CREATE POLICY "Public Read dapur_products" ON public.dapur_products 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read dapur_checklist" ON public.dapur_checklist;
CREATE POLICY "Public Read dapur_checklist" ON public.dapur_checklist 
FOR SELECT USING (true);

-- Policy Tabel: Akses Penuh Kelola Produk (Admin Dapur aduHP)
DROP POLICY IF EXISTS "Allow All Operations dapur_products" ON public.dapur_products;
CREATE POLICY "Allow All Operations dapur_products" ON public.dapur_products 
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Operations dapur_checklist" ON public.dapur_checklist;
CREATE POLICY "Allow All Operations dapur_checklist" ON public.dapur_checklist 
FOR ALL USING (true) WITH CHECK (true);

-- Policy Storage: Baca Foto Publik & Upload/Hapus dari Dapur
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
