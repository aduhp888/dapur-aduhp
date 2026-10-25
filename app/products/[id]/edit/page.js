'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, UploadCloud, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { supabase, SEED_PRODUCTS } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/utils';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: 'Apple',
    category: 'Flagship Smartphone',
    condition: 'baru',
    grade: 'Baru (BNIB)',
    battery_health: '',
    official_distributor: '',
    imei: '',
    price: '',
    original_price: '',
    stock: '1',
    ram_gb: '8',
    storage_gb: '256',
    color: '',
    description: '',
    image_url: '',
    chipset: '',
    display: '',
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  async function loadProduct() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dapur_products')
        .select('*')
        .eq('id', id)
        .single();

      let p = data;
      if (error || !data) {
        p = SEED_PRODUCTS.find(item => item.id === id);
      }

      if (p) {
        setFormData({
          name: p.name || '',
          brand: p.brand || 'Apple',
          category: p.category || 'Flagship Smartphone',
          condition: p.condition || 'baru',
          grade: p.grade || '',
          battery_health: p.battery_health !== null && p.battery_health !== undefined ? String(p.battery_health) : '',
          official_distributor: p.official_distributor || '',
          imei: p.imei || '',
          price: p.price ? String(p.price) : '',
          original_price: p.original_price ? String(p.original_price) : '',
          stock: p.stock !== undefined ? String(p.stock) : '1',
          ram_gb: p.ram_gb ? String(p.ram_gb) : '8',
          storage_gb: p.storage_gb ? String(p.storage_gb) : '256',
          color: p.color || '',
          description: p.description || '',
          image_url: (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000',
          chipset: p.specs?.chipset || '',
          display: p.specs?.display || '',
          is_featured: Boolean(p.is_featured),
          is_active: p.is_active !== undefined ? Boolean(p.is_active) : true,
        });
      }
    } catch (err) {
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
        const localPreview = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, image_url: localPreview }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: formData.name,
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
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('dapur_products')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        setErrorMsg('Update gagal: ' + error.message);
        setSubmitting(false);
        return;
      }

      alert('Produk berhasil diupdate!');
      router.push('/products');
    } catch (err) {
      setErrorMsg(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#666' }}>
        <div className="status-dot" style={{ margin: '0 auto 12px' }}></div>
        Memuat detail produk...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href="/products" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Kembali
        </Link>
        <span style={{ fontSize: '11px', color: '#666', fontFamily: 'var(--font-mono)' }}>
          ID: {id}
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Edit Data Handphone
        </h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Perbarui harga, stok, atau kelengkapan QC unit ini.
        </p>
      </div>

      {errorMsg && (
        <div className="alert-banner" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.08)', marginBottom: '20px' }}>
          <div className="alert-content" style={{ color: '#fda4af' }}>
            <AlertCircle size={18} color="#f43f5e" />
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="form-group col-8">
            <label className="form-label">Nama Lengkap Produk *</label>
            <input
              type="text"
              name="name"
              required
              className="form-input"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Brand</label>
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
            </select>
          </div>

          <div className="form-group col-6">
            <label className="form-label">Kondisi</label>
            <select
              name="condition"
              className="form-select"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="baru">Baru (BNIB Segel)</option>
              <option value="second">Second Certified Pre-Owned</option>
            </select>
          </div>

          <div className="form-group col-6">
            <label className="form-label">Grade / Battery Health</label>
            <input
              type="text"
              name="grade"
              placeholder="e.g. Second Grade A+ / BH 92%"
              className="form-input"
              value={formData.grade}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-6">
            <label className="form-label">Harga Jual IDR *</label>
            <input
              type="number"
              name="price"
              required
              className="form-input"
              value={formData.price}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-6">
            <label className="form-label">Harga Coret / Asli (IDR)</label>
            <input
              type="number"
              name="original_price"
              className="form-input"
              value={formData.original_price}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Stok Fisik</label>
            <input
              type="number"
              name="stock"
              className="form-input"
              value={formData.stock}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Storage (GB)</label>
            <input
              type="number"
              name="storage_gb"
              className="form-input"
              value={formData.storage_gb}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">IMEI / Serial</label>
            <input
              type="text"
              name="imei"
              className="form-input"
              value={formData.imei}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-12">
            <label className="form-label">Foto Produk</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img
                src={formData.image_url}
                alt="Preview"
                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', background: '#161616', border: '1px solid var(--border-subtle)' }}
              />
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="image_url"
                  className="form-input"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="Image URL"
                />
              </div>
            </div>
          </div>

          <div className="form-group col-12">
            <label className="form-label">Deskripsi</label>
            <textarea
              name="description"
              rows={3}
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-6">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span style={{ fontSize: '13px', color: '#fff' }}>Status Aktif (Tampil di Aplikasi)</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link href="/products" className="btn btn-secondary">
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ minWidth: '150px' }}
          >
            <Save size={15} />
            <span>{submitting ? 'Menyimpan...' : 'Update Produk'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
