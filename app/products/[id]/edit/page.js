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
  ShieldCheck,
  Maximize2,
  X,
  Plus,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { supabase, PRICE_TIERS } from '@/lib/supabase';
import { compressImage, uploadCompressedImageToStorage } from '@/lib/imageCompressor';

const PHOTO_SLOTS = [
  { index: 0, label: 'Foto Utama (Depan)', desc: 'Tampak depan layar & bodi keseluruhan', required: true },
  { index: 1, label: 'Foto Belakang (Kamera)', desc: 'Modul kamera, finishing warna bodi', required: false },
  { index: 2, label: 'Foto Sisi Samping', desc: 'Frame samping, tombol volume & power', required: false },
  { index: 3, label: 'Foto Bawah / Port', desc: 'Port USB-C, mic & lubang speaker', required: false },
  { index: 4, label: 'Foto Box / Kelengkapan', desc: 'Kotak segel BNIB / kartu garansi', required: false },
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // 5 Photo Slots State
  const [photos, setPhotos] = useState([null, null, null, null, null]);
  const [compressingIndices, setCompressingIndices] = useState([]);
  const [previewZoomModal, setPreviewZoomModal] = useState(null);

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

        // Load existing photos into 5 slots
        const loadedPhotos = [null, null, null, null, null];
        const rawImages = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
        const validImages = rawImages.filter(img => typeof img === 'string' && img.trim().length > 0);
        if (validImages.length === 0 && p.image_url) {
          validImages.push(p.image_url);
        }

        validImages.slice(0, 5).forEach((url, idx) => {
          loadedPhotos[idx] = {
            uploadedUrl: url,
            previewUrl: url,
            isExisting: true,
            compressedSizeFormatted: 'Tersimpan di Cloud',
            savedPercent: 0,
          };
        });
        setPhotos(loadedPhotos);
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

  async function handleFileSelect(e, targetSlot = null) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMsg(null);

    let slotsToFill = [];
    if (targetSlot !== null) {
      slotsToFill = [targetSlot];
    } else {
      let curIdx = 0;
      for (let i = 0; i < files.length && i < 5; i++) {
        while (curIdx < 5 && photos[curIdx] !== null) {
          curIdx++;
        }
        if (curIdx < 5) {
          slotsToFill.push(curIdx);
          curIdx++;
        } else {
          slotsToFill.push(i % 5);
        }
      }
    }

    setCompressingIndices(prev => [...prev, ...slotsToFill]);

    try {
      for (let i = 0; i < files.length && i < slotsToFill.length; i++) {
        const file = files[i];
        const slotIdx = slotsToFill[i];

        const compressed = await compressImage(file, {
          maxWidth: 1400,
          maxHeight: 1400,
          quality: 0.8,
          outputType: 'image/jpeg',
        });

        setPhotos(prev => {
          const updated = [...prev];
          updated[slotIdx] = {
            ...compressed,
            uploading: false,
            uploadedUrl: null,
            isExisting: false,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Compression failed:', err);
      setErrorMsg('Gagal mengompres gambar: ' + err.message);
    } finally {
      setCompressingIndices(prev => prev.filter(idx => !slotsToFill.includes(idx)));
      e.target.value = '';
    }
  }

  function handleRemovePhoto(slotIdx) {
    setPhotos(prev => {
      const updated = [...prev];
      if (updated[slotIdx]?.previewUrl && !updated[slotIdx]?.isExisting) {
        try { URL.revokeObjectURL(updated[slotIdx].previewUrl); } catch (e) {}
      }
      updated[slotIdx] = null;
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Upload new compressed photos to storage
      const finalImageUrls = [];
      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        if (!item) continue;

        if (item.uploadedUrl) {
          finalImageUrls.push(item.uploadedUrl);
        } else if (item.file) {
          const res = await uploadCompressedImageToStorage(item);
          finalImageUrls.push(res.url);
        }
      }

      // Fallback if no slot has image but manual image_url exists
      if (finalImageUrls.length === 0 && formData.image_url) {
        finalImageUrls.push(formData.image_url);
      }

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
        images: finalImageUrls,
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

      const { error } = await supabase
        .from('dapur_products')
        .update(payload)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      alert('Berhasil! Data smartphone & foto telah diperbarui.');
      router.push('/products');
    } catch (err) {
      console.error('Update error:', err);
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
              <option value="OPPO">OPPO</option>
              <option value="Samsung">Samsung</option>
              <option value="Apple">Apple (iPhone)</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="POCO">POCO</option>
              <option value="Vivo">Vivo</option>
              <option value="Realme">Realme</option>
              <option value="Infinix">Infinix</option>
              <option value="iQOO">iQOO</option>
              <option value="Tecno">Tecno</option>
              <option value="itel">itel</option>
              <option value="Asus">Asus (ROG/Zenfone)</option>
              <option value="Google">Google Pixel</option>
              {formData.brand && !['OPPO', 'Samsung', 'Apple', 'Apple (iPhone)', 'Xiaomi', 'POCO', 'Vivo', 'Realme', 'Infinix', 'iQOO', 'Tecno', 'itel', 'Asus', 'Asus (ROG/Zenfone)', 'Google', 'Google Pixel'].includes(formData.brand) && (
                <option value={formData.brand}>{formData.brand}</option>
              )}
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
        </div>

        {/* FOTO PRODUK (MAKSIMAL 5 FOTO) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={18} color="var(--accent-lime)" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Foto Smartphone (Maksimal 5 Foto)
                </h3>
                <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0 0' }}>
                  Slot 1 adalah foto utama. Foto otomatis dikompres sebelum diunggah ke Supabase Storage.
                </p>
              </div>
            </div>
            {photos.filter(Boolean).length > 0 && (
              <span style={{
                background: 'rgba(198, 255, 0, 0.1)',
                border: '1px solid rgba(198, 255, 0, 0.3)',
                color: 'var(--accent-lime)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
              }}>
                {photos.filter(Boolean).length} / 5 Foto Terpasang
              </span>
            )}
          </div>

          {/* Quick Multi-Upload Button */}
          <div>
            <label
              htmlFor="upload-multi-input-edit"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px',
                border: '2px dashed rgba(198, 255, 0, 0.35)',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-lime)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(198, 255, 0, 0.35)'}
            >
              <UploadCloud size={20} color="var(--accent-lime)" />
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                  Pilih atau Drag & Drop Sampai 5 Foto Sekaligus
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  JPG, PNG, WebP • Otomatis dikompres & disimpan ke Supabase Storage
                </span>
              </div>
              <input
                id="upload-multi-input-edit"
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, null)}
              />
            </label>
          </div>

          {/* 5 Photo Slots Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
            {PHOTO_SLOTS.map((slot) => {
              const photo = photos[slot.index];
              const isCompressing = compressingIndices.includes(slot.index);

              return (
                <div
                  key={slot.index}
                  style={{
                    background: '#121216',
                    border: photo ? '1px solid var(--border-lime)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    minHeight: '230px',
                  }}
                >
                  {/* Slot Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: slot.required ? 'var(--accent-lime)' : '#aaa' }}>
                      Slot #{slot.index + 1} {slot.required ? '(Utama)' : ''}
                    </span>
                    {photo?.savedPercent > 0 && (
                      <span style={{
                        fontSize: '9px',
                        background: 'rgba(0, 229, 255, 0.2)',
                        color: '#00E5FF',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 800
                      }}>
                        -{photo.savedPercent}%
                      </span>
                    )}
                    {photo?.isExisting && (
                      <span style={{
                        fontSize: '9px',
                        background: 'rgba(198, 255, 0, 0.15)',
                        color: 'var(--accent-lime)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        Cloud
                      </span>
                    )}
                  </div>

                  {/* Thumbnail / Upload Box */}
                  {photo ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{
                        position: 'relative',
                        height: '110px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.previewUrl || photo.uploadedUrl}
                          alt={`Slot ${slot.index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewZoomModal(photo.previewUrl || photo.uploadedUrl)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#fff'
                          }}
                          title="Lihat ukuran penuh"
                        >
                          <Maximize2 size={12} />
                        </button>
                      </div>

                      {/* Info / Compression stats */}
                      <div style={{ fontSize: '10px', color: '#888', background: 'rgba(255, 255, 255, 0.03)', padding: '5px', borderRadius: '6px' }}>
                        {photo.originalSizeFormatted && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Asli:</span>
                            <span style={{ color: '#aaa', textDecoration: 'line-through' }}>{photo.originalSizeFormatted}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-lime)', fontWeight: 700 }}>
                          <span>Ukuran:</span>
                          <span>{photo.compressedSizeFormatted || 'Siap simpan'}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                        <label
                          htmlFor={`file-slot-edit-${slot.index}`}
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '10px',
                            padding: '5px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#ccc',
                          }}
                        >
                          Ganti
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(slot.index)}
                          style={{
                            padding: '5px 8px',
                            background: 'rgba(244, 63, 94, 0.15)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#f43f5e',
                            cursor: 'pointer'
                          }}
                          title="Hapus foto ini"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor={`file-slot-edit-${slot.index}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '12px 6px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: 'rgba(255, 255, 255, 0.01)',
                      }}
                    >
                      {isCompressing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <RefreshCw size={20} className="spin" color="var(--accent-lime)" />
                          <span style={{ fontSize: '10px', color: 'var(--accent-lime)' }}>Mengompres...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={20} color="#777" style={{ marginBottom: '6px' }} />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ccc', marginBottom: '4px' }}>
                            {slot.label}
                          </span>
                          <span style={{ fontSize: '9px', color: '#666', lineHeight: 1.3 }}>
                            {slot.desc}
                          </span>
                        </>
                      )}
                    </label>
                  )}

                  <input
                    id={`file-slot-edit-${slot.index}`}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, slot.index)}
                  />
                </div>
              );
            })}
          </div>

          {/* Optional Direct Image URL fallback */}
          <div style={{ paddingTop: '8px', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
            <label className="form-label" style={{ fontSize: '11px', color: '#777' }}>
              Atau Manual URL Foto (Opsional jika tidak upload file):
            </label>
            <input
              type="text"
              name="image_url"
              className="form-input"
              style={{ fontSize: '12px' }}
              placeholder="https://images.unsplash.com/... atau Supabase Storage URL"
              value={formData.image_url}
              onChange={handleChange}
            />
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

      {/* Zoom Modal Preview */}
      {previewZoomModal && (
        <div 
          onClick={() => setPreviewZoomModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewZoomModal} 
            alt="Preview Zoom" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} 
          />
        </div>
      )}
    </div>
  );
}
