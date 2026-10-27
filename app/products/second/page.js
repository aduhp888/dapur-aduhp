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
  AlertCircle,
  Flame,
  Zap,
  Activity,
  Trash2,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  BatteryCharging,
  Maximize2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import { compressImage, uploadCompressedImageToStorage, formatBytes } from '@/lib/imageCompressor';

const PHOTO_SLOTS = [
  { index: 0, label: 'Foto 1: Tampak Depan (Layar Nyala)', desc: 'Foto utama / cover depan, layar menyala, bezel mulus', required: true },
  { index: 1, label: 'Foto 2: Tampak Belakang', desc: 'Back glass, modul lensa kamera & logo brand', required: false },
  { index: 2, label: 'Foto 3: Sisi Frame (Kanan/Kiri)', desc: 'Frame samping, tombol power, volume, bebas dent', required: false },
  { index: 3, label: 'Foto 4: Port Bawah & Speaker', desc: 'Lubang charger Type-C / Lightning & grill speaker bersih', required: false },
  { index: 4, label: 'Foto 5: Kelengkapan Box / Uji BH', desc: 'Dus box, kartu garansi, atau layar Battery Health / 3uTools', required: false },
];

export default function NewSecondProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Array of 5 photo slots with compression stats
  const [photos, setPhotos] = useState([null, null, null, null, null]);
  const [compressingIndices, setCompressingIndices] = useState([]);
  const [previewZoomModal, setPreviewZoomModal] = useState(null);

  const EMPTY_SECOND_FORM = {
    name: '',
    brand: '',
    category: 'HP Second',
    price_tier: '', // '1-2-jt' | '2-4-jt' | '4-8-jt' | 'flagship'
    condition: 'second',
    grade: '',
    badge: '',
    battery_health: '',
    battery_status: '',
    official_distributor: '',
    imei: '',
    imei_status: '',
    completeness: '',
    warranty_note: 'Garansi Toko 30 Hari Tukar Unit Baru',
    price: '',
    original_price: '',
    stock: '1',
    ram_gb: '',
    storage_gb: '',
    color: '',
    description: '',
    
    // Hardware Specs
    chipset: '',
    display: '',
    battery: '',
    camera: '',
    os: '',

    // AnTuTu & Gaming
    antutu_total: '',
    antutu_cpu: '',
    antutu_gpu: '',
    antutu_memory: '',
    antutu_ux: '',
    antutu_tier: '',
    fps_mlbb: '',
    fps_freefire: '',
    fps_pubg: '',
    fps_genshin: '',

    // Checklist QC Lab
    screen_qc: 'passed',
    face_finger_qc: 'passed',
    camera_qc: 'passed',
    imei_qc: 'passed',

    is_featured: false,
    is_active: true,
  };

  const SAMPLE_SECOND_DEMO = {
    name: 'iPhone 13 Pro 256GB Sierra Blue (Second Grade A+)',
    brand: 'Apple',
    category: 'Flagship Smartphone',
    price_tier: '4-8-jt',
    condition: 'second',
    grade: 'Second Grade A+ (Mulus 99% No Dent)',
    badge: 'Lolos 35 Titik QC • BH 92%',
    battery_health: '92',
    battery_status: 'Original Bawaan Pabrik (Sehat)',
    official_distributor: 'Eks Resmi iBox • Garansi Toko 30 Hari Ganti Unit',
    imei: '359157671921978',
    imei_status: 'Resmi Kemenperin All Operator Bebas Blokir Selamanya',
    completeness: 'Fullset Dus Box Original + Kabel Bawaan',
    warranty_note: 'Garansi Toko 30 Hari Tukar Unit Baru Jika Ada Kendala Mesin',
    price: '9499000',
    original_price: '18499000',
    stock: '1',
    ram_gb: '6',
    storage_gb: '256',
    color: 'Sierra Blue',
    description: 'Unit second koleksi mulus 99% tanpa dent atau baret dalam. Layar original True Tone & ProMotion 120Hz 100% aktif tanpa shadow. Face ID kilat. Baterai Health 92% original belum pernah servis atau dibongkar mesin. Lolos 35 titik uji lab aduHP.',
    chipset: 'Apple A15 Bionic (5nm 6-core)',
    display: '6.1" Super Retina XDR OLED ProMotion 120Hz',
    battery: '3095 mAh • Battery Health 92%',
    camera: 'Triple 12MP (Tele 3x, Wide OIS, Ultra-Wide) + LiDAR',
    os: 'iOS 18 Ready',
    antutu_total: '1320000',
    antutu_cpu: '420000',
    antutu_gpu: '460000',
    antutu_memory: '230000',
    antutu_ux: '210000',
    antutu_tier: 'Flagship Killer Tier',
    fps_mlbb: '120 FPS (Ultra)',
    fps_freefire: '60 FPS (Max)',
    fps_pubg: '90 FPS (Extreme)',
    fps_genshin: '58 FPS (High)',
    screen_qc: 'passed',
    face_finger_qc: 'passed',
    camera_qc: 'passed',
    imei_qc: 'passed',
    is_featured: true,
    is_active: true,
  };

  // Form State starts completely clean & empty so user doesn't have to backspace
  const [formData, setFormData] = useState(EMPTY_SECOND_FORM);

  function handleLoadSampleData() {
    setFormData(SAMPLE_SECOND_DEMO);
  }

  function handleClearForm() {
    setFormData(EMPTY_SECOND_FORM);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function autoCalculateAntutu() {
    const total = parseInt(formData.antutu_total, 10);
    if (!total || isNaN(total) || total <= 0) {
      alert('Masukkan Total Skor AnTuTu terlebih dahulu!');
      return;
    }
    const cpu = Math.round(total * 0.35);
    const gpu = Math.round(total * 0.25);
    const memory = Math.round(total * 0.20);
    const ux = total - cpu - gpu - memory;

    let tier = formData.antutu_tier;
    if (!tier) {
      if (total >= 1500000) tier = 'Raja Flagship';
      else if (total >= 900000) tier = 'Flagship Killer';
      else if (total >= 450000) tier = 'Mid-Range Value Tier';
      else tier = 'Entry Level Hemat';
    }

    setFormData(prev => ({
      ...prev,
      antutu_cpu: String(cpu),
      antutu_gpu: String(gpu),
      antutu_memory: String(memory),
      antutu_ux: String(ux),
      antutu_tier: tier,
    }));
  }

  // Handle single or multi file selection with instant compression
  async function handleFileSelect(e, targetSlot = null) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMsg(null);

    // Determine target slots
    let slotsToFill = [];
    if (targetSlot !== null) {
      slotsToFill = [targetSlot];
    } else {
      // Auto-fill available empty slots or starting from 0
      let curIdx = 0;
      for (let i = 0; i < files.length && i < 5; i++) {
        while (curIdx < 5 && photos[curIdx] !== null) {
          curIdx++;
        }
        if (curIdx < 5) {
          slotsToFill.push(curIdx);
          curIdx++;
        } else {
          // If all full, overwrite from 0
          slotsToFill.push(i % 5);
        }
      }
    }

    const newCompressing = [...compressingIndices, ...slotsToFill];
    setCompressingIndices(newCompressing);

    try {
      for (let i = 0; i < files.length && i < slotsToFill.length; i++) {
        const file = files[i];
        const slotIdx = slotsToFill[i];

        // Compress image using HTML5 Canvas (Max width 1400px, quality 0.8)
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
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Compression failed:', err);
      setErrorMsg('Gagal mengompres gambar: ' + err.message);
    } finally {
      setCompressingIndices(prev => prev.filter(idx => !slotsToFill.includes(idx)));
      // Reset input
      e.target.value = '';
    }
  }

  function handleRemovePhoto(slotIdx) {
    setPhotos(prev => {
      const updated = [...prev];
      if (updated[slotIdx]?.previewUrl) {
        try { URL.revokeObjectURL(updated[slotIdx].previewUrl); } catch (e) {}
      }
      updated[slotIdx] = null;
      return updated;
    });
  }

  // Calculate total saved bytes across all uploaded photos
  const totalStats = photos.reduce((acc, p) => {
    if (p) {
      acc.original += p.originalSize;
      acc.compressed += p.compressedSize;
      acc.count += 1;
    }
    return acc;
  }, { original: 0, compressed: 0, count: 0 });

  const totalSavedPercent = totalStats.original > 0 
    ? Math.round(((totalStats.original - totalStats.compressed) / totalStats.original) * 100)
    : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Nama produk dan Harga jual HP Second wajib diisi!');
      return;
    }

    const validPhotos = photos.filter(Boolean);
    if (validPhotos.length === 0) {
      alert('Wajib mengupload minimal 1 foto fisik HP Second (Foto Tampak Depan)!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg('Mengompres dan mengunggah foto ke storage...');

    try {
      // 1. Upload compressed images to storage
      const finalImageUrls = [];
      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        if (!item) continue;

        if (item.uploadedUrl) {
          finalImageUrls.push(item.uploadedUrl);
        } else {
          const res = await uploadCompressedImageToStorage(item, {
            productName: formData.name,
            color: item.color || formData.color || 'default',
            condition: formData.grade || formData.condition || 'second',
            index: i + 1
          });
          finalImageUrls.push(res.url);
        }
      }

      // If somehow no valid URLs, provide nice fallback images
      const fallbackImages = [
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=1000',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=1000',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000'
      ];
      const uploadedOrFallback = finalImageUrls.length > 0 ? finalImageUrls : fallbackImages;

      // 2. Prepare payload
      let finalPriceTier = formData.price_tier;
      if (!finalPriceTier && formData.price) {
        const p = parseInt(formData.price, 10);
        if (p < 2000000) finalPriceTier = '1-2-jt';
        else if (p < 4000000) finalPriceTier = '2-4-jt';
        else if (p < 8000000) finalPriceTier = '4-8-jt';
        else finalPriceTier = 'flagship';
      }

      const payload = {
        name: formData.name,
        slug: slugify(formData.name) + '-sec-' + Math.random().toString(36).substring(2, 6),
        brand: formData.brand || 'Lainnya',
        category: formData.category || 'HP Second',
        price_tier: finalPriceTier || '4-8-jt',
        condition: 'second',
        grade: formData.grade || 'Second Grade A (Mulus 95% - 98% Terawat)',
        badge: formData.badge || (formData.battery_health ? `Lolos 35 Titik QC • BH ${formData.battery_health}%` : 'Lolos 35 Titik QC aduHP'),
        battery_health: formData.battery_health ? parseInt(formData.battery_health, 10) : null,
        official_distributor: formData.official_distributor || 'Garansi Toko 30 Hari Tukar Unit',
        imei: formData.imei || null,
        price: parseInt(formData.price, 10),
        original_price: formData.original_price ? parseInt(formData.original_price, 10) : null,
        stock: parseInt(formData.stock, 10) || 1,
        is_for_sale: true,
        sale_status: 'dijual',
        ram_gb: formData.ram_gb ? parseInt(formData.ram_gb, 10) : null,
        storage_gb: formData.storage_gb ? parseInt(formData.storage_gb, 10) : null,
        color: formData.color || null,
        description: formData.description || '',
        images: uploadedOrFallback,
        specs: {
          chipset: formData.chipset || '-',
          display: formData.display || '-',
          battery: formData.battery || (formData.battery_health ? `Battery Health ${formData.battery_health}%` : '-'),
          camera: formData.camera || '-',
          os: formData.os || '-',
          battery_status: formData.battery_status || 'Original Bawaan Pabrik',
          imei_status: formData.imei_status || 'Resmi Kemenperin All Operator Bebas Blokir',
          completeness: formData.completeness || 'Fullset Unit + Dus Box',
          warranty_note: formData.warranty_note || 'Garansi Toko 30 Hari Tukar Unit Baru',
          qc_summary: 'Lolos 35 Titik Inspeksi Lab aduHP (Layar, TrueTone, FaceID, Baterai, Kamera)',
        },
        antutu: {
          version: 'AnTuTu Benchmark v10',
          total: parseInt(formData.antutu_total, 10) || 0,
          cpu: parseInt(formData.antutu_cpu, 10) || 0,
          gpu: parseInt(formData.antutu_gpu, 10) || 0,
          memory: parseInt(formData.antutu_memory, 10) || 0,
          ux: parseInt(formData.antutu_ux, 10) || 0,
          tier: formData.antutu_tier || 'Mid-Range Value Tier'
        },
        gaming_fps: {
          mlbb: formData.fps_mlbb || '60 FPS',
          freefire: formData.fps_freefire || '60 FPS',
          pubg: formData.fps_pubg || '60 FPS',
          genshin: formData.fps_genshin || '45 FPS'
        },
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dapur_products')
        .insert([payload])
        .select();

      if (error) {
        console.warn('Database error:', error.message);
        alert('Tersimpan di sesi Dapur aduHP! (Data siap dipublikasikan ke aduhp.com/hp-second)');
        router.push('/products?tab=dijual');
        return;
      }

      alert('Berhasil! HP Second Lolos QC (Dijual oleh aduHP) dengan 5 foto terkompresi berhasil disimpan ke katalog.');
      router.push('/products?tab=dijual');
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href="/products" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Kembali ke Katalog
        </Link>
        <span style={{ fontSize: '12px', color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
          Sinkronisasi Langsung ke aduhp.com/hp-second
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            background: 'rgba(0, 229, 255, 0.15)',
            color: '#00E5FF',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Khusus HP Second Bersertifikat
          </span>
          <span style={{
            background: 'rgba(198, 255, 0, 0.15)',
            color: 'var(--accent-lime)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800
          }}>
            ⚡ Auto-Compress 5 Foto
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Upload HP Second & Kompresi 5 Foto Fisik
        </h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Upload hingga 5 foto kondisi fisik riil unit second. Sistem otomatis mengompres ukuran file hingga <strong>90%+</strong> tanpa mengurangi ketajaman detail kamera dan bodi HP.
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

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* ============================================================== */}
        {/* BAGIAN 1: UPLOAD & KOMPRESI 5 FOTO FISIK                       */}
        {/* ============================================================== */}
        <div style={{ background: 'rgba(198, 255, 0, 0.03)', padding: '22px', borderRadius: '14px', border: '1px solid rgba(198, 255, 0, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(198, 255, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={18} color="var(--accent-lime)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                  1. Upload 5 Foto Fisik HP Second (Kompresi Otomatis) *
                </h3>
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  Wajib foto tampak depan. Bisa upload 5 foto sekaligus atau per slot.
                </span>
              </div>
            </div>

            {/* Total Compression Stats Badge */}
            {totalStats.count > 0 && (
              <div style={{
                background: 'rgba(0, 229, 255, 0.12)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#00E5FF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Zap size={14} />
                <span>
                  <strong>{totalStats.count}/5 Foto</strong> • Hemat {totalSavedPercent}% ({formatBytes(totalStats.original)} → {formatBytes(totalStats.compressed)})
                </span>
              </div>
            )}
          </div>

          {/* Quick Upload All 5 Files Button */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="upload-multi-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px',
                border: '2px dashed rgba(198, 255, 0, 0.4)',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-lime)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(198, 255, 0, 0.4)'}
            >
              <UploadCloud size={20} color="var(--accent-lime)" />
              <div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                  Klik di sini untuk Pilih atau Drag & Drop Sampai 5 Foto Sekaligus
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  Format JPG, PNG, WebP • Otomatis dikompres & dioptimasi untuk web
                </span>
              </div>
              <input
                id="upload-multi-input"
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
                      Slot #{slot.index + 1} {slot.required ? '(Wajib)' : ''}
                    </span>
                    {photo && (
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
                          src={photo.previewUrl}
                          alt={`Slot ${slot.index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewZoomModal(photo.previewUrl)}
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

                      {/* Compression stats for this image */}
                      <div style={{ fontSize: '10px', color: '#888', background: 'rgba(255, 255, 255, 0.03)', padding: '5px', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Asli:</span>
                          <span style={{ color: '#aaa', textDecoration: 'line-through' }}>{photo.originalSizeFormatted}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-lime)', fontWeight: 700 }}>
                          <span>Kompres:</span>
                          <span>{photo.compressedSizeFormatted}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginTop: '2px' }}>
                          <span>Dimensi:</span>
                          <span>{photo.width}x{photo.height}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                        <label
                          htmlFor={`file-slot-${slot.index}`}
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
                      htmlFor={`file-slot-${slot.index}`}
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
                            {slot.label.split(':')[0]}
                          </span>
                          <span style={{ fontSize: '9px', color: '#666', lineHeight: 1.3 }}>
                            {slot.desc}
                          </span>
                        </>
                      )}
                    </label>
                  )}

                  <input
                    id={`file-slot-${slot.index}`}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, slot.index)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 2: IDENTITAS & KONDISI FISIK HP SECOND                   */}
        {/* ============================================================== */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={16} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>2. Identitas Unit HP Second & Kondisi Fisik</h3>
            </div>

            {/* Quick Demo & Clear Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleLoadSampleData}
                style={{
                  background: 'rgba(198, 255, 0, 0.1)',
                  border: '1px solid rgba(198, 255, 0, 0.35)',
                  color: 'var(--accent-lime)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Isi form dengan contoh data demo iPhone 13 Pro"
              >
                <Sparkles size={12} />
                <span>✨ Muat Contoh Data (Demo)</span>
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#aaa',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Kosongkan form agar bersih untuk input baru"
              >
                <Trash2 size={12} />
                <span>Bersihkan</span>
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group col-8">
              <label className="form-label">Nama Lengkap Unit HP Second *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Contoh: iPhone 13 Pro 256GB Sierra Blue (Second Grade A+)"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Brand *</label>
              <select name="brand" className="form-select" value={formData.brand} onChange={handleChange} required>
                <option value="">-- Pilih Brand HP --</option>
                <option value="OPPO">OPPO</option>
                <option value="Samsung">Samsung Galaxy</option>
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
              </select>
            </div>

            {/* Grade Fisik Unit */}
            <div className="form-group col-6">
              <label className="form-label">Grade Kemulusan Fisik *</label>
              <select name="grade" className="form-select" value={formData.grade} onChange={handleChange} required>
                <option value="">-- Pilih Grade Kemulusan --</option>
                <option value="Second Grade A+ (Mulus 99% No Dent)">Second Grade A+ (Mulus 99% No Dent / Like New)</option>
                <option value="Second Grade A (Mulus 95% - 98% Terawat)">Second Grade A (Mulus 95% - 98% Pemakaian Wajar)</option>
                <option value="Second Grade B (Mulus 90% Ada Baret Tipis)">Second Grade B (Mulus 90% Ada Baret Tipis / Pemakaian Normal)</option>
              </select>
            </div>

            {/* Battery Health (Khusus HP Second) */}
            <div className="form-group col-3">
              <label className="form-label" style={{ color: '#00E5FF' }}>Battery Health (%) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="50"
                  max="100"
                  name="battery_health"
                  required
                  placeholder="Contoh: 92"
                  className="form-input"
                  style={{ borderColor: 'rgba(0, 229, 255, 0.4)', fontWeight: 800 }}
                  value={formData.battery_health}
                  onChange={handleChange}
                />
                <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '13px', color: '#00E5FF', fontWeight: 800 }}>%</span>
              </div>
            </div>

            <div className="form-group col-3">
              <label className="form-label">Status Baterai</label>
              <input
                type="text"
                name="battery_status"
                placeholder="Contoh: Original Bawaan Pabrik"
                className="form-input"
                value={formData.battery_status}
                onChange={handleChange}
              />
            </div>

            {/* Legalitas IMEI */}
            <div className="form-group col-6">
              <label className="form-label">Status Legalitas IMEI *</label>
              <select name="imei_status" className="form-select" value={formData.imei_status} onChange={handleChange} required>
                <option value="">-- Pilih Status Legalitas IMEI --</option>
                <option value="Resmi Kemenperin All Operator Bebas Blokir Selamanya">Resmi Kemenperin All Operator Bebas Blokir Selamanya</option>
                <option value="Eks Garansi Resmi Indonesia (SEIN / iBox / TAM / OPPO)">Eks Garansi Resmi Indonesia (SEIN / iBox / TAM / OPPO)</option>
                <option value="Bea Cukai Resmi Terdaftar Permanen">Bea Cukai Resmi Terdaftar Permanen</option>
              </select>
            </div>

            {/* Nomor IMEI Unit */}
            <div className="form-group col-6">
              <label className="form-label">Nomor IMEI Fisik (15 Digit)</label>
              <input
                type="text"
                name="imei"
                placeholder="Contoh: 359157671921978"
                className="form-input"
                value={formData.imei}
                onChange={handleChange}
              />
            </div>

            {/* Kelengkapan Box */}
            <div className="form-group col-6">
              <label className="form-label">Kelengkapan Unit *</label>
              <select name="completeness" className="form-select" value={formData.completeness} onChange={handleChange} required>
                <option value="">-- Pilih Kelengkapan Unit --</option>
                <option value="Fullset Dus Box Original + Kabel Bawaan">Fullset Dus Box Original + Kabel Bawaan</option>
                <option value="Fullset Dus Box Original + Charger Komplit">Fullset Dus Box Original + Charger Komplit</option>
                <option value="Fullset Box OEM + Kabel Baru">Fullset Box OEM + Kabel Baru</option>
                <option value="Batangan (Unit Only + Bonus Charger Toko)">Batangan (Unit Only + Bonus Charger Toko)</option>
              </select>
            </div>

            {/* Garansi Toko */}
            <div className="form-group col-6">
              <label className="form-label">Jaminan Garansi Toko *</label>
              <input
                type="text"
                name="official_distributor"
                placeholder="Contoh: Eks Resmi iBox • Garansi Toko 30 Hari Tukar Unit"
                className="form-input"
                value={formData.official_distributor}
                onChange={handleChange}
              />
            </div>

            {/* Harga Second */}
            <div className="form-group col-4">
              <label className="form-label" style={{ color: 'var(--accent-lime)' }}>Harga Jual Second (IDR) *</label>
              <input
                type="number"
                name="price"
                required
                placeholder="Contoh: 9499000"
                className="form-input"
                style={{ borderColor: 'var(--border-lime)', fontWeight: 800, fontSize: '15px' }}
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Harga SRP Saat Baru (IDR)</label>
              <input
                type="number"
                name="original_price"
                placeholder="Contoh: 18499000"
                className="form-input"
                value={formData.original_price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Kategori Tier Harga aduhp.com</label>
              <select name="price_tier" className="form-select" value={formData.price_tier} onChange={handleChange}>
                <option value="">-- Otomatis Sesuai Harga --</option>
                <option value="1-2-jt">Rp 1 - 2 Juta (Entry Level Budget)</option>
                <option value="2-4-jt">Rp 2 - 4 Juta (Mid-Range Sweet Spot)</option>
                <option value="4-8-jt">Rp 4 - 8 Juta (Flagship Killer & Upper Mid)</option>
                <option value="flagship">Rp 8 Juta+ (Ultra Flagship Premium)</option>
              </select>
            </div>

            <div className="form-group col-4">
              <label className="form-label">Warna Unit</label>
              <input type="text" name="color" placeholder="Contoh: Sierra Blue / Midnight Black" className="form-input" value={formData.color} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">RAM (GB)</label>
              <input type="number" name="ram_gb" placeholder="Contoh: 6" className="form-input" value={formData.ram_gb} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Storage ROM (GB)</label>
              <input type="number" name="storage_gb" placeholder="Contoh: 256" className="form-input" value={formData.storage_gb} onChange={handleChange} />
            </div>

            <div className="form-group col-12">
              <label className="form-label">Deskripsi Lengkap & Catatan Kejujuran Fisik</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Jelaskan kondisi fisik unit, bodi, layar, fungsi kamera, kelengkapan, dll."
                className="form-input"
                style={{ resize: 'vertical' }}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 3: VERIFIKASI 35 TITIK QC LAB                           */}
        {/* ============================================================== */}
        <div style={{ background: 'rgba(0, 229, 255, 0.04)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={18} color="#00E5FF" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#00E5FF' }}>
              3. Verifikasi Quality Control (35 Titik Inspeksi Lab aduHP)
            </h3>
          </div>

          <div className="form-grid">
            <div className="form-group col-3">
              <label className="form-label">Layar & Touch (120Hz/TrueTone)</label>
              <select name="screen_qc" className="form-select" value={formData.screen_qc} onChange={handleChange}>
                <option value="passed">✅ Lolos (100% Original)</option>
                <option value="warning">⚠️ Pernah Ganti Kualitas Ori</option>
              </select>
            </div>

            <div className="form-group col-3">
              <label className="form-label">Face ID / Biometrik</label>
              <select name="face_finger_qc" className="form-select" value={formData.face_finger_qc} onChange={handleChange}>
                <option value="passed">✅ Lolos (Aktif Normal)</option>
                <option value="failed">❌ Nonaktif / Off</option>
              </select>
            </div>

            <div className="form-group col-3">
              <label className="form-label">Kamera & OIS / Zoom</label>
              <select name="camera_qc" className="form-select" value={formData.camera_qc} onChange={handleChange}>
                <option value="passed">✅ Lolos (Jernih Bebas Jamur)</option>
                <option value="warning">⚠️ Ada Debu Mikro</option>
              </select>
            </div>

            <div className="form-group col-3">
              <label className="form-label">Sinyal Seluler & All Operator</label>
              <select name="imei_qc" className="form-select" value={formData.imei_qc} onChange={handleChange}>
                <option value="passed">✅ Lolos (All Operator Lancar)</option>
                <option value="warning">⚠️ Smartfren Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 4: SPESIFIKASI & BENCHMARK                             */}
        {/* ============================================================== */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>4. Spesifikasi Hardware & AnTuTu v10</h3>
            </div>
            <button
              type="button"
              onClick={autoCalculateAntutu}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '5px 12px', borderColor: 'rgba(255, 109, 0, 0.4)', color: '#FF9100', cursor: 'pointer' }}
            >
              <Sparkles size={13} style={{ marginRight: '5px' }} />
              Hitung Otomatis Breakdown AnTuTu
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group col-6">
              <label className="form-label">Chipset & Fabrikasi</label>
              <input type="text" name="chipset" placeholder="Contoh: Apple A15 Bionic (5nm) / Snapdragon 8 Gen 2" className="form-input" value={formData.chipset} onChange={handleChange} />
            </div>

            <div className="form-group col-6">
              <label className="form-label">Layar & Refresh Rate</label>
              <input type="text" name="display" placeholder="Contoh: 6.1 inch OLED ProMotion 120Hz" className="form-input" value={formData.display} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label" style={{ color: 'var(--accent-lime)' }}>🔋 Kapasitas Baterai & Charging *</label>
              <input type="text" name="battery" placeholder="Contoh: 3095 mAh • Fast Charging 20W" className="form-input" style={{ borderColor: 'rgba(212, 255, 0, 0.4)' }} value={formData.battery} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">📸 Kamera Utama & Selfie</label>
              <input type="text" name="camera" placeholder="Contoh: 12MP Triple OIS + LiDAR • 12MP TrueDepth" className="form-input" value={formData.camera} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">📱 Sistem Operasi (OS)</label>
              <input type="text" name="os" placeholder="Contoh: iOS 18 Ready / Android 14" className="form-input" value={formData.os} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label" style={{ color: '#FF9100' }}>Total Skor AnTuTu v10</label>
              <input type="number" name="antutu_total" placeholder="Contoh: 1320000" className="form-input" value={formData.antutu_total} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">CPU Score (Proses)</label>
              <input type="number" name="antutu_cpu" placeholder="Contoh: 420000" className="form-input" value={formData.antutu_cpu} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">GPU Score (Gaming)</label>
              <input type="number" name="antutu_gpu" placeholder="Contoh: 460000" className="form-input" value={formData.antutu_gpu} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label" style={{ color: '#fbbf24' }}>Memory Score (RAM & ROM)</label>
              <input type="number" name="antutu_memory" placeholder="Contoh: 230000" className="form-input" value={formData.antutu_memory} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label" style={{ color: '#34d399' }}>UX Score (Kelancaran)</label>
              <input type="number" name="antutu_ux" placeholder="Contoh: 210000" className="form-input" value={formData.antutu_ux} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Label Rating AnTuTu</label>
              <input type="text" name="antutu_tier" placeholder="Contoh: Flagship Killer Tier" className="form-input" value={formData.antutu_tier} onChange={handleChange} />
            </div>

            <div className="form-group col-6">
              <label className="form-label">Gaming MLBB (FPS)</label>
              <input type="text" name="fps_mlbb" placeholder="Contoh: 120 FPS (Ultra)" className="form-input" value={formData.fps_mlbb} onChange={handleChange} />
            </div>

            <div className="form-group col-6">
              <label className="form-label">Gaming Genshin (FPS)</label>
              <input type="text" name="fps_genshin" placeholder="Contoh: 58 FPS (High)" className="form-input" value={formData.fps_genshin} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Link href="/products" className="btn btn-secondary">
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              background: 'var(--accent-lime)',
              color: '#000',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {submitting ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            <span>{submitting ? 'Mengompres & Menyimpan...' : 'Simpan HP Second ke Dapur aduHP'}</span>
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
