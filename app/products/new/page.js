'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  UploadCloud, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { slugify, uploadProductImage } from '@/lib/utils';

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Apple',
    category: 'Flagship Smartphone',
    condition: 'baru',
    grade: 'Baru (BNIB)',
    battery_health: '',
    official_distributor: 'iBox / Digimap (Garansi Resmi 1 Tahun)',
    imei: '',
    price: '',
    original_price: '',
    stock: '1',
    ram_gb: '8',
    storage_gb: '256',
    color: 'Titanium Black',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop',
    chipset: '',
    display: '',
    is_featured: false,
    is_active: true,
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleConditionChange(cond) {
    setFormData(prev => ({
      ...prev,
      condition: cond,
      grade: cond === 'baru' ? 'Baru (BNIB)' : 'Second Grade A+ (Mulus 99%)',
      official_distributor: cond === 'baru' 
        ? 'iBox / Digimap (Garansi Resmi 1 Tahun)' 
        : 'Eks Resmi iBox • Garansi Toko 30 Hari',
      battery_health: cond === 'baru' ? '' : '92',
    }));
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadProductImage(file);
      if (res?.url) {
        setFormData(prev => ({ ...prev, image_url: res.url }));
      } else {
        // Create local object URL for preview if bucket is not yet active
        const localPreview = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, image_url: localPreview }));
        console.warn('Using local preview URL:', res?.error);
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Nama produk dan Harga jual wajib diisi!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: formData.name,
      slug: slugify(formData.name),
      brand: formData.brand,
      category: formData.category,
      condition: formData.condition,
      grade: formData.grade,
      battery_health: formData.battery_health ? parseInt(formData.battery_health, 10) : null,
      official_distributor: formData.official_distributor,
      imei: formData.imei || null,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      stock: parseInt(formData.stock || '1', 10),
      ram_gb: parseInt(formData.ram_gb || '8', 10),
      storage_gb: parseInt(formData.storage_gb || '256', 10),
      color: formData.color,
      description: formData.description,
      images: [formData.image_url],
      specs: {
        chipset: formData.chipset || '-',
        display: formData.display || '-',
      },
      is_featured: formData.is_featured,
      is_active: formData.is_active,
    };

    try {
      const { data, error } = await supabase
        .from('dapur_products')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert error:', error.message);
        // If table doesn't exist yet, warn user
        setErrorMsg('Tabel Supabase belum dibuat atau RLS belum dibuka: ' + error.message + '. Silakan buka menu Setup Supabase SQL.');
        setSubmitting(false);
        return;
      }

      alert('Berhasil! Produk baru berhasil disimpan ke Supabase dapur_products.');
      router.push('/products');
    } catch (err) {
      setErrorMsg(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href="/products" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Kembali ke Katalog
        </Link>
        <span style={{ fontSize: '12px', color: '#666', fontFamily: 'var(--font-mono)' }}>
          POST /api/products → Supabase
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Input Handphone / Elektronik Baru
        </h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Produk yang diinput di sini akan otomatis langsung tampil di Android, iPhone, dan Web aduHP.
        </p>
      </div>

      {errorMsg && (
        <div className="alert-banner" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.08)', marginBottom: '20px' }}>
          <div className="alert-content" style={{ color: '#fda4af' }}>
            <AlertCircle size={18} color="#f43f5e" />
            <div>{errorMsg}</div>
          </div>
          <Link href="/schema-setup" className="btn btn-secondary btn-sm" style={{ background: '#000' }}>
            Buka SQL
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        {/* Step 1: Condition Selector (Paling Penting untuk HP) */}
        <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
            Pilih Kondisi Perangkat *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div
              onClick={() => handleConditionChange('baru')}
              style={{
                padding: '16px',
                borderRadius: '10px',
                cursor: 'pointer',
                border: formData.condition === 'baru' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                background: formData.condition === 'baru' ? 'rgba(59, 130, 246, 0.08)' : '#000',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>
                  Baru (BNIB Segel)
                </span>
                {formData.condition === 'baru' && <CheckCircle2 size={18} color="#3b82f6" />}
              </div>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                Unit 100% Brand New in Box bergaransi resmi distributor (iBox, SEIN, TAM).
              </p>
            </div>

            <div
              onClick={() => handleConditionChange('second')}
              style={{
                padding: '16px',
                borderRadius: '10px',
                cursor: 'pointer',
                border: formData.condition === 'second' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                background: formData.condition === 'second' ? 'rgba(16, 185, 129, 0.08)' : '#000',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>
                  Second Certified Pre-Owned
                </span>
                {formData.condition === 'second' && <CheckCircle2 size={18} color="#10b981" />}
              </div>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                Unit bekas berkualitas lolos 35 titik pengecekan, garansi toko + IMEI selamanya.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Form Inputs */}
        <div className="form-grid">
          {/* Product Name */}
          <div className="form-group col-8">
            <label className="form-label">Nama Lengkap Produk *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: iPhone 16 Pro Max 256GB Desert Titanium"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Brand */}
          <div className="form-group col-4">
            <label className="form-label">Brand *</label>
            <select
              name="brand"
              className="form-select"
              value={formData.brand}
              onChange={handleChange}
            >
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Google Pixel">Google Pixel</option>
              <option value="ASUS ROG">ASUS ROG</option>
              <option value="Vivo">Vivo</option>
              <option value="Oppo">Oppo</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Second Hand Specific Fields */}
          {formData.condition === 'second' && (
            <>
              <div className="form-group col-6">
                <label className="form-label">Grade Kondisi Fisik</label>
                <select
                  name="grade"
                  className="form-select"
                  value={formData.grade}
                  onChange={handleChange}
                >
                  <option value="Second Grade A+ (Mulus 99%)">Second Grade A+ (Mulus 99% Like New)</option>
                  <option value="Second Grade A (Mulus 95%)">Second Grade A (Mulus 95%)</option>
                  <option value="Second Grade B (Mulus 90%)">Second Grade B (Lecet Halus Pemakaian)</option>
                </select>
              </div>

              <div className="form-group col-6">
                <label className="form-label">Battery Health (BH %)</label>
                <input
                  type="number"
                  name="battery_health"
                  placeholder="Contoh: 92 (Kosongkan bila BNIB)"
                  className="form-input"
                  min="50"
                  max="100"
                  value={formData.battery_health}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Distributor / Warranty */}
          <div className="form-group col-6">
            <label className="form-label">Garansi & Distributor Resmi</label>
            <input
              type="text"
              name="official_distributor"
              placeholder="Contoh: iBox Resmi 1 Tahun / Garansi Toko 30 Hari"
              className="form-input"
              value={formData.official_distributor}
              onChange={handleChange}
            />
          </div>

          {/* IMEI / Serial */}
          <div className="form-group col-6">
            <label className="form-label">Nomor IMEI / Serial (Penting untuk HP)</label>
            <input
              type="text"
              name="imei"
              placeholder="Contoh: 352981120938491 (15 digit)"
              className="form-input"
              value={formData.imei}
              onChange={handleChange}
            />
          </div>

          {/* Price IDR */}
          <div className="form-group col-6">
            <label className="form-label">Harga Jual (IDR) *</label>
            <input
              type="number"
              name="price"
              required
              placeholder="Contoh: 24999000"
              className="form-input"
              value={formData.price}
              onChange={handleChange}
            />
          </div>

          {/* Original Price (Coret) */}
          <div className="form-group col-6">
            <label className="form-label">Harga Coret / MSRP (IDR)</label>
            <input
              type="number"
              name="original_price"
              placeholder="Contoh: 26999000 (Opsional diskon)"
              className="form-input"
              value={formData.original_price}
              onChange={handleChange}
            />
          </div>

          {/* Variant: Storage & RAM */}
          <div className="form-group col-4">
            <label className="form-label">Storage (GB)</label>
            <select
              name="storage_gb"
              className="form-select"
              value={formData.storage_gb}
              onChange={handleChange}
            >
              <option value="64">64 GB</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
              <option value="512">512 GB</option>
              <option value="1024">1 TB (1024 GB)</option>
            </select>
          </div>

          <div className="form-group col-4">
            <label className="form-label">RAM (GB)</label>
            <select
              name="ram_gb"
              className="form-select"
              value={formData.ram_gb}
              onChange={handleChange}
            >
              <option value="4">4 GB</option>
              <option value="6">6 GB</option>
              <option value="8">8 GB</option>
              <option value="12">12 GB</option>
              <option value="16">16 GB</option>
            </select>
          </div>

          <div className="form-group col-4">
            <label className="form-label">Warna Bodi</label>
            <input
              type="text"
              name="color"
              placeholder="Contoh: Desert Titanium"
              className="form-input"
              value={formData.color}
              onChange={handleChange}
            />
          </div>

          {/* Stock */}
          <div className="form-group col-4">
            <label className="form-label">Jumlah Stok Fisik</label>
            <input
              type="number"
              name="stock"
              min="0"
              className="form-input"
              value={formData.stock}
              onChange={handleChange}
            />
          </div>

          {/* Chipset & Display */}
          <div className="form-group col-4">
            <label className="form-label">Chipset (Spek)</label>
            <input
              type="text"
              name="chipset"
              placeholder="Contoh: Apple A18 Pro / Snapdragon 8 Gen 3"
              className="form-input"
              value={formData.chipset}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Layar (Display)</label>
            <input
              type="text"
              name="display"
              placeholder="Contoh: 6.9 Super Retina XDR 120Hz"
              className="form-input"
              value={formData.display}
              onChange={handleChange}
            />
          </div>

          {/* Image Upload & Preview */}
          <div className="form-group col-12" style={{ marginTop: '10px' }}>
            <label className="form-label">Foto Produk (Supabase Storage 'products' bucket)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '10px',
                background: '#161616',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={formData.image_url}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200';
                  }}
                />
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="product-file-upload"
                />
                <label
                  htmlFor="product-file-upload"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', cursor: 'pointer', marginBottom: '8px' }}
                >
                  <UploadCloud size={14} />
                  <span>{uploadingImage ? 'Mengupload ke Supabase...' : 'Upload Gambar Baru'}</span>
                </label>
                <input
                  type="text"
                  name="image_url"
                  placeholder="Atau masukkan direct Image URL..."
                  className="form-input"
                  style={{ fontSize: '12px' }}
                  value={formData.image_url}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group col-12">
            <label className="form-label">Deskripsi Lengkap Unit</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Jelaskan kondisi fisik, kelengkapan kotak, dan fitur unggulan..."
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Toggles */}
          <div className="form-group col-6">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
              />
              <span style={{ fontSize: '13px', color: '#fff' }}>Jadikan Produk Unggulan (Featured)</span>
            </label>
          </div>

          <div className="form-group col-6">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span style={{ fontSize: '13px', color: '#fff' }}>Langsung Publikasikan (Live di Android/iPhone)</span>
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link href="/products" className="btn btn-secondary">
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ minWidth: '160px' }}
          >
            <Save size={15} />
            <span>{submitting ? 'Menyimpan...' : 'Simpan ke Supabase'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
