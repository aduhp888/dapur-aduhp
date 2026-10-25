-- ==============================================================================
-- DAPUR.ADUHP.COM - Minimalist MVP Schema (2 Tables + Storage)
-- Platform: Supabase PostgreSQL 15+
-- Currency: Indonesian Rupiah (IDR)
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing MVP tables if recreation is needed
DROP TABLE IF EXISTS public.dapur_checklist CASCADE;
DROP TABLE IF EXISTS public.dapur_products CASCADE;

-- ------------------------------------------------------------------------------
-- 2. TABLE: dapur_products (Katalog HP & Elektronik: Baru BNIB & Second Grade A+)
-- ------------------------------------------------------------------------------
CREATE TABLE public.dapur_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'Apple',
    category TEXT NOT NULL DEFAULT 'Smartphone',
    condition TEXT NOT NULL DEFAULT 'baru' CHECK (condition IN ('baru', 'second')),
    grade TEXT DEFAULT 'Baru (BNIB)',
    battery_health INT,
    official_distributor TEXT DEFAULT 'iBox / Digimap',
    imei TEXT,
    price NUMERIC(14, 2) NOT NULL,
    original_price NUMERIC(14, 2),
    stock INT NOT NULL DEFAULT 1,
    ram_gb INT DEFAULT 8,
    storage_gb INT DEFAULT 256,
    color TEXT DEFAULT 'Black',
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. TABLE: dapur_checklist (35 Titik Inspeksi QC & Pengujian Fungsi HP)
-- ------------------------------------------------------------------------------
CREATE TABLE public.dapur_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.dapur_products(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g. 'Fisik & Body', 'Layar & Display', 'Kamera & Lensa', 'Baterai & Charging', 'Konektivitas & Audio', 'Keamanan Biometrik'
    item_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'passed' CHECK (status IN ('passed', 'warning', 'failed', 'not_applicable')),
    notes TEXT,
    checked_by TEXT DEFAULT 'Teknisi aduHP',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy queries
CREATE INDEX IF NOT EXISTS idx_dapur_products_condition ON public.dapur_products(condition);
CREATE INDEX IF NOT EXISTS idx_dapur_products_brand ON public.dapur_products(brand);
CREATE INDEX IF NOT EXISTS idx_dapur_products_is_active ON public.dapur_products(is_active);
CREATE INDEX IF NOT EXISTS idx_dapur_checklist_product_id ON public.dapur_checklist(product_id);

-- ------------------------------------------------------------------------------
-- 4. STORAGE BUCKET: products (Upload Foto HP & Unit Fisik)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.dapur_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_checklist ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for Android, iPhone & Public Web)
CREATE POLICY "Public Read dapur_products" ON public.dapur_products FOR SELECT USING (true);
CREATE POLICY "Public Read dapur_checklist" ON public.dapur_checklist FOR SELECT USING (true);

-- Allow full access for MVP operations (Create, Update, Delete)
CREATE POLICY "Anon Full Access dapur_products" ON public.dapur_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access dapur_checklist" ON public.dapur_checklist FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket access policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Anon Upload products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Anon Update products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Anon Delete products bucket" ON storage.objects;
END $$;

CREATE POLICY "Public Read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Anon Upload products bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Anon Update products bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'products');
CREATE POLICY "Anon Delete products bucket" ON storage.objects FOR DELETE USING (bucket_id = 'products');

-- ------------------------------------------------------------------------------
-- 6. INITIAL SEED DATA (Curated Official Gadgets & Certified Pre-Owned)
-- ------------------------------------------------------------------------------
INSERT INTO public.dapur_products (
    id, name, slug, brand, category, condition, grade, battery_health,
    official_distributor, imei, price, original_price, stock, ram_gb, storage_gb,
    color, description, images, specs, is_featured, is_active
) VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    'iPhone 16 Pro Max 256GB',
    'iphone-16-pro-max-256gb',
    'Apple',
    'Flagship Smartphone',
    'baru',
    'Baru (BNIB Segel)',
    NULL,
    'iBox / Digimap Resmi 1 Tahun',
    '352981120938491',
    24999000,
    26999000,
    15,
    8,
    256,
    'Desert Titanium',
    'Titanium Grade 5 dengan Apple A18 Pro, 48MP Fusion Camera, Camera Control kapasitif, dan Apple Intelligence. Segel Green Peel Resmi iBox.',
    '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '{"chipset": "Apple A18 Pro (3nm)", "display": "6.9 Super Retina XDR OLED 120Hz", "battery": "4685 mAh", "os": "iOS 18"}'::jsonb,
    true,
    true
),
(
    'a1000000-0000-0000-0000-000000000002',
    'Samsung Galaxy S24 Ultra 512GB',
    'samsung-galaxy-s24-ultra-512gb',
    'Samsung',
    'Flagship Smartphone',
    'baru',
    'Baru (BNIB Segel)',
    NULL,
    'SEIN Resmi Indonesia 1 Tahun',
    '359871120349812',
    23999000,
    25999000,
    12,
    12,
    512,
    'Titanium Black',
    'Flagship Titanium murni dengan Corning Gorilla Armor anti-reflektif, kamera 200MP Quad-Tele, S-Pen terintegrasi, dan Galaxy AI.',
    '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '{"chipset": "Snapdragon 8 Gen 3 for Galaxy", "display": "6.8 Dynamic AMOLED 2X 120Hz", "battery": "5000 mAh 45W", "os": "Android 14 One UI 6.1"}'::jsonb,
    true,
    true
),
(
    'a1000000-0000-0000-0000-000000000003',
    'iPhone 13 Pro 256GB (Second Grade A+)',
    'iphone-13-pro-256gb-second-grade-a',
    'Apple',
    'Flagship Smartphone',
    'second',
    'Second Grade A+ (Mulus 99%)',
    92,
    'Eks Resmi iBox • Garansi Toko 30 Hari',
    '351982039182390',
    9499000,
    18499000,
    6,
    6,
    256,
    'Sierra Blue',
    'Unit second mulus 99% tanpa dent. TrueTone & FaceID 100% normal. Baterai Health 92% sehat dan original belum pernah ganti. Lolos 35 titik inspeksi teknisi aduHP.',
    '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '{"chipset": "Apple A15 Bionic", "display": "6.1 Super Retina XDR ProMotion 120Hz", "battery": "BH 92% Original", "os": "iOS 18 Supported"}'::jsonb,
    true,
    true
),
(
    'a1000000-0000-0000-0000-000000000004',
    'Xiaomi 14 Ultra 512GB (Leica Quad-Cam)',
    'xiaomi-14-ultra-512gb',
    'Xiaomi',
    'Pro Camera Phone',
    'baru',
    'Baru (BNIB Segel)',
    NULL,
    'TAM Resmi Indonesia 15 Bulan',
    '860982391829031',
    17999000,
    19999000,
    8,
    16,
    512,
    'Obsidian Black',
    'Sensor kamera utama 1-inci Sony LYT-900 dengan lensa Leica Summilux bukaan variabel f/1.63 - f/4.0 mekanis.',
    '["https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '{"chipset": "Snapdragon 8 Gen 3", "display": "6.73 WQHD+ LTPO 120Hz", "battery": "5000 mAh 90W HyperCharge", "os": "HyperOS"}'::jsonb,
    false,
    true
),
(
    'a1000000-0000-0000-0000-000000000005',
    'Samsung Galaxy S23 Ultra 256GB (Second Eks SEIN)',
    'samsung-galaxy-s23-ultra-second-sein',
    'Samsung',
    'Flagship Smartphone',
    'second',
    'Second Grade A+ (Mulus 98%)',
    95,
    'Eks SEIN Resmi • Bebas Blokir IMEI',
    '352091823901923',
    11499000,
    19999000,
    5,
    8,
    256,
    'Phantom Black',
    'Unit eks SEIN resmi Indonesia. S-Pen lancar, kamera 200MP Space Zoom jernih, body terawat, layar bebas shadow/burn-in.',
    '["https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '{"chipset": "Snapdragon 8 Gen 2 for Galaxy", "display": "6.8 Dynamic AMOLED 2X 120Hz", "battery": "BH 95% 5000 mAh", "os": "Android 14 One UI 6.1"}'::jsonb,
    true,
    true
);

-- Seed inspection checklist for iPhone 13 Pro Second
INSERT INTO public.dapur_checklist (product_id, category, item_name, status, notes) VALUES
('a1000000-0000-0000-0000-000000000003', 'Layar & Display', 'True Tone Aktif', 'passed', 'Layar original bawaan Apple'),
('a1000000-0000-0000-0000-000000000003', 'Layar & Display', 'ProMotion 120Hz Responsif', 'passed', 'Touch sampling smooth tanpa ghost touch'),
('a1000000-0000-0000-0000-000000000003', 'Keamanan Biometrik', 'Face ID Sensor', 'passed', 'Buka kunci instan dalam kondisi gelap maupun terang'),
('a1000000-0000-0000-0000-000000000003', 'Baterai & Charging', 'Kondisi Baterai (BH)', 'passed', 'BH 92% Sehat Original bawaan pabrik'),
('a1000000-0000-0000-0000-000000000003', 'Kamera & Lensa', 'Kamera 0.5x, 1x, 3x Tele', 'passed', 'Hasil foto tajam dan fokus sensor OIS lancar'),
('a1000000-0000-0000-0000-000000000003', 'Konektivitas & Audio', 'Sinyal 5G & All Operator IMEI', 'passed', 'IMEI resmi Kemenperin tembus all operator');

-- ------------------------------------------------------------------------------
-- 7. SUPABASE AUTH: Konfirmasi User Admin
-- ------------------------------------------------------------------------------
-- Jalankan baris ini untuk auto-confirm user admin@aduhp.com:
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'admin@aduhp.com';

