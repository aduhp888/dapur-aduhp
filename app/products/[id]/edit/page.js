'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Flame,
  Activity,
  Layers,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { supabase, PRICE_TIERS } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/utils';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: 'POCO',
    category: 'Smartphone',
    price_tier: '1-2-jt',
    condition: 'baru',
    grade: '100% Baru (BNIB Segel)',
    badge: 'Baru BNIB',
    official_distributor: 'TAM Resmi Indonesia',
    imei: '',
    price: '',
    original_price: '',
    stock: '10',
    ram_gb: '8',
    storage_gb: '256',
    color: 'Black',
    description: '',
    image_url: '',
    chipset: '',
    display: '',
    battery: '',
    camera: '',
    os: '',

    // AnTuTu v10
    antutu_total: '',
    antutu_cpu: '',
    antutu_gpu: '',
    antutu_memory: '',
    antutu_ux: '',
    antutu_tier: '',

    // Gaming FPS
    fps_mlbb: '',
    fps_freefire: '',
    fps_pubg: '',
    fps_genshin: '',

    is_featured: true,
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
        p = null;
      }

      if (p) {
        setFormData({
          name: p.name || '',
          brand: p.brand || 'POCO',
          category: p.category || 'Smartphone',
          price_tier: p.price_tier || '1-2-jt',
          condition: p.condition || 'baru',
          grade: p.grade || '100% Baru (BNIB Segel)',
          badge: p.badge || '',
          official_distributor: p.official_distributor || 'TAM Resmi Indonesia',
          imei: p.imei || '',
          price: p.price ? String(p.price) : '',
          original_price: p.original_price ? String(p.original_price) : '',
          stock: p.stock !== undefined ? String(p.stock) : '10',
          ram_gb: p.ram_gb ? String(p.ram_gb) : '8',
          storage_gb: p.storage_gb ? String(p.storage_gb) : '256',
          color: p.color || '',
          description: p.description || '',
          image_url: (p.images && p.images[0]) || '',
          chipset: p.specs?.chipset || '',
          display: p.specs?.display || '',
          battery: p.specs?.battery || '',
          camera: p.specs?.camera_main || p.specs?.camera || '',
          os: p.specs?.os || '',

          // AnTuTu
          antutu_total: p.antutu?.total ? String(p.antutu.total) : '',
          antutu_cpu: p.antutu?.cpu ? String(p.antutu.cpu) : '',
          antutu_gpu: p.antutu?.gpu ? String(p.antutu.gpu) : '',
          antutu_memory: p.antutu?.memory ? String(p.antutu.memory) : '',
          antutu_ux: p.antutu?.ux ? String(p.antutu.ux) : '',
          antutu_tier: p.antutu?.tier || '',

          // Gaming FPS
          fps_mlbb: p.gaming_fps?.mlbb || '',
          fps_freefire: p.gaming_fps?.freefire || '',
          fps_pubg: p.gaming_fps?.pubg || '',
          fps_genshin: p.gaming_fps?.genshin || '',

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

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      price_tier: formData.price_tier,
      condition: formData.condition,
      grade: formData.grade,
      badge: formData.badge,
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
        chipset: formData.chipset,
        display: formData.display,
        battery: formData.battery,
        camera: formData.camera,
        os: formData.os,
        ram_rom: `${formData.ram_gb}GB / ${formData.storage_gb}GB`
      },
      antutu: {
        version: 'AnTuTu Benchmark v10',
        total: parseInt(formData.antutu_total, 10) || 0,
        cpu: parseInt(formData.antutu_cpu, 10) || 0,
        gpu: parseInt(formData.antutu_gpu, 10) || 0,
        memory: parseInt(formData.antutu_memory, 10) || 0,
        ux: parseInt(formData.antutu_ux, 10) || 0,
        tier: formData.antutu_tier
      },
      gaming_fps: {
        mlbb: formData.fps_mlbb,
        freefire: formData.fps_freefire,
        pubg: formData.fps_pubg,
        genshin: formData.fps_genshin
      },
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('dapur_products')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.warn('Update error:', error.message);
      }

      alert('Berhasil! Data smartphone & benchmark AnTuTu telah diperbarui.');
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
        Memuat detail smartphone...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href="/products" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Kembali ke Katalog
        </Link>
        <span style={{ fontSize: '12px', color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
          ID: {id}
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Edit Smartphone & Benchmark AnTuTu v10
        </h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Perbarui harga promo, stok BNIB, skor AnTuTu v10, dan uji gaming FPS.
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

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* IDENTITAS */}
        <div className="form-grid">
          <div className="form-group col-8">
            <label className="form-label">Nama Lengkap Smartphone *</label>
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
            <select name="brand" className="form-select" value={formData.brand} onChange={handleChange}>
              <option value="POCO">POCO</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Infinix">Infinix</option>
              <option value="Realme">Realme</option>
              <option value="Apple">Apple</option>
              <option value="Vivo">Vivo</option>
              <option value="itel">itel</option>
              <option value="iQOO">iQOO</option>
            </select>
          </div>

          <div className="form-group col-6">
            <label className="form-label">Kategori / Tier Harga *</label>
            <select name="price_tier" className="form-select" value={formData.price_tier} onChange={handleChange}>
              <option value="1-2-jt">Rp 1 - 2 Jutaan (Entry-Level Value)</option>
              <option value="2-4-jt">Rp 2 - 4 Jutaan (Mid-Range Sweet Spot)</option>
              <option value="4-8-jt">Rp 4 - 8 Jutaan (Flagship Killer & Upper Mid)</option>
              <option value="flagship">Rp 8 Juta+ (Ultra Flagship & Premium)</option>
            </select>
          </div>

          <div className="form-group col-6">
            <label className="form-label">Garansi Distributor Resmi</label>
            <input
              type="text"
              name="official_distributor"
              className="form-input"
              value={formData.official_distributor}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Harga Promo (IDR) *</label>
            <input
              type="number"
              name="price"
              required
              className="form-input"
              value={formData.price}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Harga Coret (IDR)</label>
            <input
              type="number"
              name="original_price"
              className="form-input"
              value={formData.original_price}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-4">
            <label className="form-label">Stok Box BNIB</label>
            <input
              type="number"
              name="stock"
              className="form-input"
              value={formData.stock}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ANTUTU BENCHMARK V10 */}
        <div style={{ background: 'rgba(255, 109, 0, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 109, 0, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Flame size={18} color="#FF9100" />
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#FF9100' }}>Skor AnTuTu Benchmark v10</h3>
          </div>
          <div className="form-grid">
            <div className="form-group col-4">
              <label className="form-label" style={{ color: '#FF9100' }}>Total Skor AnTuTu v10</label>
              <input
                type="number"
                name="antutu_total"
                className="form-input"
                style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                value={formData.antutu_total}
                onChange={handleChange}
              />
            </div>
            <div className="form-group col-4">
              <label className="form-label">CPU Score</label>
              <input type="number" name="antutu_cpu" className="form-input" value={formData.antutu_cpu} onChange={handleChange} />
            </div>
            <div className="form-group col-4">
              <label className="form-label">GPU Score</label>
              <input type="number" name="antutu_gpu" className="form-input" value={formData.antutu_gpu} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* GAMING FPS */}
        <div style={{ background: 'rgba(0, 229, 255, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={18} color="#00E5FF" />
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#00E5FF' }}>Estimasi Gaming FPS</h3>
          </div>
          <div className="form-grid">
            <div className="form-group col-3">
              <label className="form-label">MLBB (FPS)</label>
              <input type="text" name="fps_mlbb" className="form-input" value={formData.fps_mlbb} onChange={handleChange} />
            </div>
            <div className="form-group col-3">
              <label className="form-label">Free Fire (FPS)</label>
              <input type="text" name="fps_freefire" className="form-input" value={formData.fps_freefire} onChange={handleChange} />
            </div>
            <div className="form-group col-3">
              <label className="form-label">PUBG Mobile (FPS)</label>
              <input type="text" name="fps_pubg" className="form-input" value={formData.fps_pubg} onChange={handleChange} />
            </div>
            <div className="form-group col-3">
              <label className="form-label">Genshin (FPS)</label>
              <input type="text" name="fps_genshin" className="form-input" value={formData.fps_genshin} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* HARDWARE */}
        <div className="form-grid">
          <div className="form-group col-6">
            <label className="form-label">Chipset & Fabrikasi</label>
            <input type="text" name="chipset" className="form-input" value={formData.chipset} onChange={handleChange} />
          </div>
          <div className="form-group col-6">
            <label className="form-label">Layar & Refresh Rate</label>
            <input type="text" name="display" className="form-input" value={formData.display} onChange={handleChange} />
          </div>
          <div className="form-group col-12">
            <label className="form-label">URL Foto Produk</label>
            <input type="text" name="image_url" className="form-input" value={formData.image_url} onChange={handleChange} />
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <Link href="/products" className="btn btn-secondary">
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: '12px 28px', background: 'var(--accent-lime)', color: '#000', fontWeight: 800 }}
          >
            <Save size={16} />
            <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
