'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SchemaSetupPage() {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tableStatus, setTableStatus] = useState(null);

  const sqlScript = `-- ==============================================================================
-- DATABASE SCHEMA RESMI: aduHP & Dapur aduHP (Supabase PostgreSQL 15+)
-- Platform Katalog HP, Aduan Spek AI, dan E-Commerce Resmi Rekening PT
-- ==============================================================================

-- 1. EKSTENSI & FUNGSI SISTEM
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABEL: dapur_products (Katalog HP Baru, HP Second, & HP Aduan)
CREATE TABLE IF NOT EXISTS public.dapur_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'POCO',
    category TEXT NOT NULL DEFAULT 'Smartphone',
    price_tier TEXT DEFAULT '1-2-jt' CHECK (price_tier IN ('1-2-jt', '2-4-jt', '4-6-jt', '6-8-jt', '8-10-jt', '10-15-jt', '15-jt-plus', '4-8-jt', 'flagship')),
    condition TEXT NOT NULL DEFAULT 'baru' CHECK (condition IN ('baru', 'second')),
    grade TEXT DEFAULT '100% Baru (BNIB Segel)',
    badge TEXT DEFAULT '🟢 Dijual oleh aduHP',
    battery_health INT CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
    official_distributor TEXT DEFAULT 'Resmi Indonesia',
    imei TEXT,
    price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(14, 2),
    stock INT NOT NULL DEFAULT 1,
    is_for_sale BOOLEAN NOT NULL DEFAULT true,
    sale_status TEXT NOT NULL DEFAULT 'dijual' CHECK (sale_status IN ('dijual', 'compare_only')),
    ram_gb INT,
    storage_gb INT,
    color TEXT DEFAULT 'Black',
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    photo_labels JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    antutu JSONB DEFAULT '{"total": 0, "cpu": 0, "gpu": 0, "memory": 0, "ux": 0, "tier": ""}'::jsonb,
    gaming_fps JSONB DEFAULT '{"mlbb": "60 FPS", "pubg": "60 FPS", "genshin": "45 FPS"}'::jsonb,
    is_featured BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS photo_labels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS sale_status TEXT NOT NULL DEFAULT 'dijual';
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS battery_health INT;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS antutu JSONB DEFAULT '{"total": 0, "cpu": 0, "gpu": 0, "memory": 0, "ux": 0, "tier": ""}'::jsonb;
ALTER TABLE public.dapur_products ADD COLUMN IF NOT EXISTS gaming_fps JSONB DEFAULT '{"mlbb": "60 FPS", "pubg": "60 FPS", "genshin": "45 FPS"}'::jsonb;

-- Pembaruan CHECK Constraint 7 Kategori Harga
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

CREATE INDEX IF NOT EXISTS idx_dapur_products_condition ON public.dapur_products(condition);
CREATE INDEX IF NOT EXISTS idx_dapur_products_brand ON public.dapur_products(brand);
CREATE INDEX IF NOT EXISTS idx_dapur_products_price_tier ON public.dapur_products(price_tier);
CREATE INDEX IF NOT EXISTS idx_dapur_products_is_for_sale ON public.dapur_products(is_for_sale);
CREATE INDEX IF NOT EXISTS idx_dapur_products_is_active ON public.dapur_products(is_active);
CREATE INDEX IF NOT EXISTS idx_dapur_products_created_at ON public.dapur_products(created_at DESC);

DROP TRIGGER IF EXISTS trigger_dapur_products_updated_at ON public.dapur_products;
CREATE TRIGGER trigger_dapur_products_updated_at
BEFORE UPDATE ON public.dapur_products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. TABEL: dapur_checklist (35 Titik Inspeksi QC Lab HP Second)
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

-- 4. TABEL: dapur_orders (Pesanan Pembelian HP, Ongkir & Rekening Resmi PT)
CREATE TABLE IF NOT EXISTS public.dapur_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    product_id UUID REFERENCES public.dapur_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_condition TEXT NOT NULL DEFAULT 'baru' CHECK (product_condition IN ('baru', 'second')),
    product_image TEXT,
    variant_ram INT,
    variant_storage INT,
    variant_color TEXT,
    unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 1,
    shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    insurance_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unique_code INT DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_province TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_district TEXT,
    shipping_postal_code TEXT,
    shipping_address TEXT NOT NULL,
    courier_code TEXT NOT NULL,
    courier_service TEXT NOT NULL,
    tracking_number TEXT,
    payment_method TEXT DEFAULT 'bank_transfer_pt',
    bank_name TEXT DEFAULT 'BCA (Bank Central Asia)',
    bank_account_name TEXT DEFAULT 'PT. SECOND CIRCLE TEKNOLOGI',
    bank_account_number TEXT DEFAULT '8830 9291 88',
    payment_status TEXT NOT NULL DEFAULT 'menunggu_pembayaran' 
        CHECK (payment_status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'pembayaran_diverifikasi', 'dikemas', 'dikirim', 'selesai', 'dibatalkan')),
    payment_proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dapur_orders_order_number ON public.dapur_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_dapur_orders_customer_phone ON public.dapur_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_dapur_orders_payment_status ON public.dapur_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_dapur_orders_created_at ON public.dapur_orders(created_at DESC);

DROP TRIGGER IF EXISTS trigger_dapur_orders_updated_at ON public.dapur_orders;
CREATE TRIGGER trigger_dapur_orders_updated_at
BEFORE UPDATE ON public.dapur_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. STORAGE BUCKET: products
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.dapur_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Operations dapur_products" ON public.dapur_products;
CREATE POLICY "Allow All Operations dapur_products" ON public.dapur_products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Operations dapur_checklist" ON public.dapur_checklist;
CREATE POLICY "Allow All Operations dapur_checklist" ON public.dapur_checklist FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read and Insert dapur_orders" ON public.dapur_orders;
CREATE POLICY "Public Read and Insert dapur_orders" ON public.dapur_orders FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow Upload products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow Update products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow Delete products bucket" ON storage.objects;
END $$;

CREATE POLICY "Public Read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Allow Upload products bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Allow Update products bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'products');
CREATE POLICY "Allow Delete products bucket" ON storage.objects FOR DELETE USING (bucket_id = 'products');

-- 7. TABEL: dapur_users (Superadmin & Admin Operasional)
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
CREATE POLICY "Allow All Operations dapur_users" ON public.dapur_users FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.dapur_users (email, full_name, role, status, notes)
VALUES ('admin@aduhp.com', 'Superadmin Owner', 'superadmin', 'aktif', 'Pemilik Sistem & Pengelola Rekening PT')
ON CONFLICT (email) DO UPDATE SET role = 'superadmin', status = 'aktif';`;

  function copySql() {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function checkConnection() {
    setChecking(true);
    try {
      const { data, error } = await supabase.from('dapur_products').select('count', { count: 'exact', head: true });
      if (error) {
        setTableStatus({ ready: false, message: error.message });
      } else {
        setTableStatus({ ready: true, message: 'Tabel dapur_products ditemukan dan siap digunakan!' });
      }
    } catch (err) {
      setTableStatus({ ready: false, message: err.message });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={24} color="#00e5ff" />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Setup Database Supabase (2 Table MVP)
          </h1>
        </div>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Tabel <code>dapur_products</code>, <code>dapur_checklist</code>, serta bucket storage <code>products</code>.
        </p>
      </div>

      {/* Step Guide */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          3 Langkah Mudah Mengaktifkan Tabel di Supabase Anda:
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
              1
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '13.5px' }}>
                Buka SQL Editor di Dashboard Supabase
              </div>
              <p style={{ color: '#888', fontSize: '12.5px', marginTop: '2px' }}>
                Buka tab <strong>SQL Editor</strong> di dashboard Supabase project <code>beajiozqffgbczkhmwan</code>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
              2
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '13.5px' }}>
                Paste & Klik "Run"
              </div>
              <p style={{ color: '#888', fontSize: '12.5px', marginTop: '2px' }}>
                Salin kode SQL di bawah ini, paste ke SQL Editor, lalu klik tombol hijau <strong>Run</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
              3
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '13.5px' }}>
                Cek Koneksi
              </div>
              <p style={{ color: '#888', fontSize: '12.5px', marginTop: '2px' }}>
                Klik tombol "Tes Status Tabel Supabase" di bawah untuk memverifikasi.
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={checkConnection} disabled={checking} className="btn btn-primary btn-sm">
            <RefreshCw size={13} className={checking ? 'spin' : ''} />
            <span>{checking ? 'Memeriksa...' : 'Tes Status Tabel Supabase'}</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/beajiozqffgbczkhmwan/sql"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={13} />
            <span>Buka Supabase SQL Editor</span>
          </a>

          {tableStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              color: tableStatus.ready ? '#34d399' : '#f87171',
              fontWeight: 600,
            }}>
              {tableStatus.ready ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{tableStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* SQL Script Box */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
            supabase/schema.sql (2 Table MVP + Storage + Seed)
          </span>
          <button onClick={copySql} className="btn btn-secondary btn-sm">
            {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Semua SQL'}</span>
          </button>
        </div>

        <pre className="code-preview-box" style={{ maxHeight: '450px' }}>
          {sqlScript}
        </pre>
      </div>
    </div>
  );
}
