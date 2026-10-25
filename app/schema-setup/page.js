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
-- DAPUR.ADUHP.COM - Minimalist MVP Schema (2 Tables + Storage)
-- Jalankan script ini di: https://supabase.com/dashboard/project/beajiozqffgbczkhmwan/sql
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: dapur_products
CREATE TABLE IF NOT EXISTS public.dapur_products (
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

-- 3. TABLE: dapur_checklist (35 Titik QC Inspeksi HP Second)
CREATE TABLE IF NOT EXISTS public.dapur_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.dapur_products(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'passed' CHECK (status IN ('passed', 'warning', 'failed', 'not_applicable')),
    notes TEXT,
    checked_by TEXT DEFAULT 'Teknisi aduHP',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Row Level Security (RLS)
ALTER TABLE public.dapur_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read dapur_products" ON public.dapur_products FOR SELECT USING (true);
CREATE POLICY "Public Read dapur_checklist" ON public.dapur_checklist FOR SELECT USING (true);
CREATE POLICY "Anon Full Access dapur_products" ON public.dapur_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access dapur_checklist" ON public.dapur_checklist FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket access
CREATE POLICY "Public Read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Anon Upload products bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Anon Update products bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'products');
CREATE POLICY "Anon Delete products bucket" ON storage.objects FOR DELETE USING (bucket_id = 'products');

-- 6. Initial Seed Data
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
    'Titanium Grade 5 dengan Apple A18 Pro, 48MP Fusion Camera, dan Apple Intelligence. Segel Green Peel Resmi iBox.',
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
    'Flagship Titanium murni dengan Gorilla Armor, kamera 200MP Quad-Tele, S-Pen, dan Galaxy AI.',
    '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '{"chipset": "Snapdragon 8 Gen 3 for Galaxy", "display": "6.8 Dynamic AMOLED 2X 120Hz", "battery": "5000 mAh 45W", "os": "Android 14"}'::jsonb,
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
    'Unit second mulus 99% tanpa dent. TrueTone & FaceID 100% normal. Baterai Health 92% original. Lolos 35 titik inspeksi teknisi aduHP.',
    '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '{"chipset": "Apple A15 Bionic", "display": "6.1 Super Retina XDR ProMotion 120Hz", "battery": "BH 92% Original", "os": "iOS 18 Supported"}'::jsonb,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;`;

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
