'use client';

import { useState, Suspense, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Gauge,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Maximize2,
  Plus,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import { compressImage, uploadCompressedImageToStorage, formatBytes } from '@/lib/imageCompressor';

const PHOTO_SLOTS = [
  { index: 0, label: 'Foto 1: Tampak Depan (Layar & Bodi)', desc: 'Foto utama cover depan, layar menyala / render resmi', required: true },
  { index: 1, label: 'Foto 2: Tampak Belakang & Kamera', desc: 'Back cover bodi, modul lensa kamera & logo brand', required: false },
  { index: 2, label: 'Foto 3: Box BNIB Segel Resmi', desc: 'Foto segel box pabrik / Green Peel utuh belum terbuka', required: false },
  { index: 3, label: 'Foto 4: Kartu Garansi & Label IMEI', desc: 'Label distributor resmi (TAM/SEIN/iBox) & barcode IMEI', required: false },
  { index: 4, label: 'Foto 5: Sisi Frame & Aksesoris', desc: 'Sisi samping, kabel Type-C / kelengkapan kotak', required: false },
];

function NewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramForSale = searchParams.get('for_sale');
  const [isForSale, setIsForSale] = useState(paramForSale !== 'false');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Array of 5 photo slots with compression stats
  const [photos, setPhotos] = useState([null, null, null, null, null]);
  const [compressingIndices, setCompressingIndices] = useState([]);
  const [previewZoomModal, setPreviewZoomModal] = useState(null);

  const EMPTY_NEW_FORM = {
    name: '',
    brand: '',
    category: 'HP Baru',
    price_tier: '', // '1-2-jt' | '2-4-jt' | '4-8-jt' | 'flagship'
    condition: 'baru',
    grade: '100% Baru (BNIB Segel)',
    badge: '100% Baru BNIB Segel Resmi',
    official_distributor: '',
    imei: '',
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

    // AnTuTu Benchmark v10 (Core Feature aduhp.com)
    antutu_total: '',
    antutu_cpu: '',
    antutu_gpu: '',
    antutu_memory: '',
    antutu_ux: '',
    antutu_tier: '',

    // Gaming FPS Performance
    fps_mlbb: '',
    fps_freefire: '',
    fps_pubg: '',
    fps_genshin: '',

    is_featured: true,
    is_active: true,
  };

  const SAMPLE_NEW_DEMO = {
    name: 'POCO F6 (12/512GB) Black Titanium',
    brand: 'POCO',
    category: 'Flagship Killer',
    price_tier: '4-8-jt',
    condition: 'baru',
    grade: '100% Baru (BNIB Segel)',
    badge: '100% Baru BNIB Segel Resmi',
    official_distributor: 'TAM Resmi Indonesia 15 Bulan',
    imei: '358291039102931',
    price: '5499000',
    original_price: '5999000',
    stock: '15',
    ram_gb: '12',
    storage_gb: '512',
    color: 'Black Titanium',
    description: 'Smartphone 100% Baru BNIB Segel Resmi Indonesia. Dilengkapi jaminan IMEI Kemenperin & garansi distributor resmi.',
    chipset: 'Snapdragon 8s Gen 3 (4nm TSMC)',
    display: '6.67" Flow AMOLED 1.5K 120Hz CrystalRes',
    battery: '5000 mAh + 90W Turbo Charge',
    camera: '50 MP Sony IMX882 OIS + 8 MP Ultra-Wide',
    os: 'Xiaomi HyperOS (Android 14)',
    antutu_total: '1520000',
    antutu_cpu: '395000',
    antutu_gpu: '520000',
    antutu_memory: '290000',
    antutu_ux: '315000',
    antutu_tier: 'Flagship Killer Tier',
    fps_mlbb: '120 FPS (Ultra)',
    fps_freefire: '60 FPS (Max)',
    fps_pubg: '90 FPS (Smooth Extreme)',
    fps_genshin: '58.5 FPS (Highest)',
    is_featured: true,
    is_active: true,
  };

  // Form State starts empty so the user doesn't have to backspace
  const [formData, setFormData] = useState(EMPTY_NEW_FORM);

  // Dynamic RAM & Storage Variants State
  const [variants, setVariants] = useState([]);

  // Dynamic Color Variants State
  const [colors, setColors] = useState([]);

  const COLOR_PRESETS = [
    { name: 'Midnight Black', hex: '#1C1C1E' },
    { name: 'Titanium Silver', hex: '#B0B0B5' },
    { name: 'Plum Purple', hex: '#7B2CBF' },
    { name: 'Ocean Blue', hex: '#1E40AF' },
    { name: 'Forest Green', hex: '#15803D' },
    { name: 'Pure White', hex: '#FFFFFF' },
    { name: 'Champagne Gold', hex: '#D97706' },
  ];

  function handleAddColor(customName = '', customHex = '#1C1C1E') {
    setColors(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: customName,
        hex: customHex,
        is_default: prev.length === 0
      }
    ]);
  }

  function handleRemoveColor(id) {
    setColors(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length > 0 && !filtered.some(c => c.is_default)) {
        filtered[0].is_default = true;
      }
      return filtered;
    });
  }

  function handleColorChange(id, field, value) {
    setColors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  function handleSetDefaultColor(id) {
    setColors(prev => prev.map(c => ({ ...c, is_default: c.id === id })));
  }

  function handleAddPresetColor(presetName, presetHex) {
    if (colors.some(c => c.name.toLowerCase() === presetName.toLowerCase())) {
      return;
    }
    handleAddColor(presetName, presetHex);
  }

  function handleVariantColorStockChange(variantId, colorId, stockValue) {
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      const currentStocks = { ...(v.color_stocks || {}) };
      currentStocks[colorId] = stockValue;
      const total = Object.values(currentStocks).reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
      return {
        ...v,
        color_stocks: currentStocks,
        stock: String(total)
      };
    }));
  }

  function handleQuickFillVariantStock(variantId, defaultVal = 5) {
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      const currentStocks = { ...(v.color_stocks || {}) };
      colors.forEach(c => {
        currentStocks[c.id] = String(defaultVal);
      });
      const total = Object.values(currentStocks).reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
      return {
        ...v,
        color_stocks: currentStocks,
        stock: String(total)
      };
    }));
  }

  function handleAddVariant() {
    const initialColorStocks = {};
    colors.forEach(c => {
      initialColorStocks[c.id] = '0';
    });
    setVariants(prev => [
      ...prev,
      {
        id: Date.now(),
        ram: formData.ram_gb || '8',
        storage: formData.storage_gb || '256',
        price: formData.price || '',
        stock: '0',
        color_stocks: initialColorStocks,
        is_default: prev.length === 0
      }
    ]);
  }

  function handleRemoveVariant(id) {
    setVariants(prev => {
      const filtered = prev.filter(v => v.id !== id);
      if (filtered.length > 0 && !filtered.some(v => v.is_default)) {
        filtered[0].is_default = true;
      }
      return filtered;
    });
  }

  function handleVariantChange(id, field, value) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  function handleSetDefaultVariant(id) {
    setVariants(prev => prev.map(v => ({ ...v, is_default: v.id === id })));
  }

  function handleSyncVariantsFromForm() {
    if (!formData.ram_gb && !formData.storage_gb) {
      alert('Silakan isi kolom RAM & Storage pada form terlebih dahulu.');
      return;
    }
    const baseStock = formData.stock || '5';
    const initialColorStocks = {};
    if (colors.length > 0) {
      colors.forEach(c => {
        initialColorStocks[c.id] = baseStock;
      });
    }
    const totalStock = colors.length > 0
      ? String(colors.length * (parseInt(baseStock, 10) || 0))
      : baseStock;

    setVariants([
      {
        id: Date.now(),
        ram: formData.ram_gb || '8',
        storage: formData.storage_gb || '256',
        price: formData.price || '',
        stock: totalStock,
        color_stocks: initialColorStocks,
        is_default: true
      }
    ]);
  }

  function handleLoadSampleData() {
    setFormData(SAMPLE_NEW_DEMO);
    setColors([
      { id: 1, name: 'Black Titanium', hex: '#1C1C1E', is_default: true },
      { id: 2, name: 'White Titanium', hex: '#E5E7EB', is_default: false },
      { id: 3, name: 'Titanium Silver', hex: '#B0B0B5', is_default: false },
    ]);
    setVariants([
      { id: 1, ram: '8', storage: '256', price: '4899000', stock: '0', color_stocks: { 1: '0', 2: '0', 3: '0' }, is_default: false },
      { id: 2, ram: '12', storage: '512', price: '5499000', stock: '15', color_stocks: { 1: '5', 2: '5', 3: '5' }, is_default: true },
      { id: 3, ram: '16', storage: '1024', price: '6499000', stock: '0', color_stocks: { 1: '0', 2: '0', 3: '0' }, is_default: false },
    ]);
  }

  function handleClearForm() {
    setFormData(EMPTY_NEW_FORM);
    setVariants([]);
    setColors([]);
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

  // Handle file selection with instant canvas compression
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
    if (!formData.name) {
      alert('Nama smartphone wajib diisi!');
      return;
    }
    if (isForSale && !formData.price) {
      alert('Harga jual produk wajib diisi untuk smartphone yang dijual oleh aduHP!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Upload compressed images to storage
      const finalImageUrls = [];
      const primaryColor = (colors && colors.length > 0)
        ? (colors.find(c => c.is_default)?.name || colors[0]?.name)
        : (formData.color || 'default');

      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        if (!item) continue;

        if (item.uploadedUrl) {
          finalImageUrls.push(item.uploadedUrl);
        } else {
          const res = await uploadCompressedImageToStorage(item, {
            productName: formData.name,
            color: item.color || primaryColor,
            condition: formData.condition || 'baru',
            index: i + 1
          });
          finalImageUrls.push(res.url);
        }
      }

      // Default photo fallback if user didn't upload any photos
      const fallbackImages = [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=1000&auto=format&fit=crop'
      ];
      const uploadedImages = finalImageUrls.length > 0 ? finalImageUrls : fallbackImages;

      let finalPriceTier = formData.price_tier;
      if (!finalPriceTier && formData.price) {
        const p = parseInt(formData.price, 10);
        if (p < 2000000) finalPriceTier = '1-2-jt';
        else if (p < 4000000) finalPriceTier = '2-4-jt';
        else if (p < 8000000) finalPriceTier = '4-8-jt';
        else finalPriceTier = 'flagship';
      }

      // Format custom colors first
      let rawColors = [];
      if (colors.length > 0) {
        rawColors = colors.filter(c => c.name && c.name.trim()).map(c => ({
          _origId: c.id,
          name: c.name.trim(),
          hex: c.hex || '#1C1C1E',
          isDefault: !!c.is_default
        }));
      } else if (formData.color) {
        rawColors = [{
          _origId: 'default',
          name: formData.color.trim(),
          hex: '#1C1C1E',
          isDefault: true
        }];
      }

      // Format custom variants with color_stocks
      let finalVariants = [];
      if (variants.length > 0) {
        finalVariants = variants.map(v => {
          const colorStocks = rawColors.map(c => {
            const stockVal = v.color_stocks?.[c._origId] !== undefined
              ? (parseInt(v.color_stocks[c._origId], 10) || 0)
              : (v.color_stocks?.[c.name] !== undefined ? (parseInt(v.color_stocks[c.name], 10) || 0) : 0);
            return {
              name: c.name,
              hex: c.hex,
              stock: stockVal
            };
          });

          const totalCalculatedStock = colorStocks.length > 0
            ? colorStocks.reduce((sum, cs) => sum + cs.stock, 0)
            : (parseInt(v.stock, 10) || 0);

          return {
            ram: parseInt(v.ram, 10) || 0,
            storage: parseInt(v.storage, 10) || 0,
            label: `${v.ram}GB / ${v.storage}GB`,
            price: parseInt(v.price, 10) || 0,
            stock: totalCalculatedStock,
            color_stocks: colorStocks,
            isDefault: !!v.is_default
          };
        });
      } else if (formData.ram_gb && formData.storage_gb) {
        const defaultColorStocks = rawColors.map(c => ({
          name: c.name,
          hex: c.hex,
          stock: isForSale ? (parseInt(formData.stock, 10) || 0) : 0
        }));
        const totalCalculatedStock = defaultColorStocks.length > 0
          ? defaultColorStocks.reduce((sum, cs) => sum + cs.stock, 0)
          : (isForSale ? (parseInt(formData.stock, 10) || 0) : 0);

        finalVariants = [{
          ram: parseInt(formData.ram_gb, 10) || 8,
          storage: parseInt(formData.storage_gb, 10) || 256,
          label: `${formData.ram_gb}GB / ${formData.storage_gb}GB`,
          price: formData.price ? parseInt(formData.price, 10) : 0,
          stock: totalCalculatedStock,
          color_stocks: defaultColorStocks,
          isDefault: true
        }];
      }

      const finalColors = rawColors.map(({ _origId, ...rest }) => rest);

      const defaultVariant = finalVariants.find(v => v.isDefault) || finalVariants[0];
      const defaultColor = finalColors.find(c => c.isDefault) || finalColors[0];
      const totalStock = finalVariants.length > 0 
        ? finalVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : (isForSale ? (parseInt(formData.stock, 10) || 1) : 0);

      const payload = {
        name: formData.name,
        slug: slugify(formData.name) + '-' + Math.random().toString(36).substring(2, 6),
        brand: formData.brand || 'Lainnya',
        category: formData.category || 'HP Baru',
        price_tier: finalPriceTier || '2-4-jt',
        condition: 'baru',
        grade: '100% Baru (BNIB Segel)',
        badge: formData.badge || '100% Baru BNIB Segel Resmi',
        official_distributor: formData.official_distributor || 'Garansi Resmi Distributor Indonesia',
        imei: formData.imei || null,
        price: defaultVariant?.price || (formData.price ? parseInt(formData.price, 10) : 0),
        original_price: formData.original_price ? parseInt(formData.original_price, 10) : null,
        stock: totalStock,
        is_for_sale: isForSale,
        sale_status: isForSale ? 'dijual' : 'compare_only',
        ram_gb: defaultVariant?.ram || (formData.ram_gb ? parseInt(formData.ram_gb, 10) : null),
        storage_gb: defaultVariant?.storage || (formData.storage_gb ? parseInt(formData.storage_gb, 10) : null),
        color: defaultColor?.name || formData.color || null,
        description: formData.description || '',
        images: uploadedImages,
        specs: {
          chipset: formData.chipset || '-',
          display: formData.display || '-',
          battery: formData.battery || '-',
          camera: formData.camera || '-',
          os: formData.os || '-',
          ram_rom: defaultVariant ? `${defaultVariant.ram}GB / ${defaultVariant.storage}GB` : (formData.ram_gb && formData.storage_gb ? `${formData.ram_gb}GB / ${formData.storage_gb}GB` : '-'),
          variants: finalVariants,
          colors: finalColors
        },
        antutu: {
          version: 'AnTuTu Benchmark v10',
          total: parseInt(formData.antutu_total, 10) || 0,
          cpu: parseInt(formData.antutu_cpu, 10) || 0,
          gpu: parseInt(formData.antutu_gpu, 10) || 0,
          memory: parseInt(formData.antutu_memory, 10) || 0,
          ux: parseInt(formData.antutu_ux, 10) || 0,
          tier: formData.antutu_tier || 'Entry/Mid Tier'
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
        alert('Tersimpan di sesi lokal Dapur AduHP! (Data siap dipublikasikan ke aduhp.com/hp-baru)');
        router.push(isForSale ? '/products?tab=dijual' : '/products?tab=compare');
        return;
      }

      alert(
        isForSale 
          ? 'Berhasil! Smartphone Baru BNIB (Dijual oleh aduHP) beserta foto terkompresi berhasil disimpan ke katalog.'
          : 'Berhasil! Data Spesifikasi & Benchmark Smartphone (Hanya Pembanding Aduan) berhasil disimpan ke katalog.'
      );
      router.push(isForSale ? '/products?tab=dijual' : '/products?tab=compare');
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
          Sinkronisasi Otomatis ke aduhp.com/hp-baru & /adu-hp
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            background: 'rgba(198, 255, 0, 0.15)',
            color: 'var(--accent-lime)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            100% Baru BNIB Segel Resmi
          </span>
          <span style={{
            background: 'rgba(0, 229, 255, 0.15)',
            color: '#00E5FF',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800
          }}>
            ⚡ Auto-Compress 5 Foto
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Input Smartphone Baru & Kompresi 5 Foto
        </h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Format standar <strong>aduhp.com</strong>: 100% Baru BNIB Segel Resmi, Garansi Distributor, Skor AnTuTu v10, dan <strong>5 foto produk terkompresi otomatis</strong>.
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
        {/* BAGIAN 1: UPLOAD & KOMPRESI 5 FOTO HP BARU                     */}
        {/* ============================================================== */}
        <div style={{ background: 'rgba(198, 255, 0, 0.03)', padding: '22px', borderRadius: '14px', border: '1px solid rgba(198, 255, 0, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(198, 255, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={18} color="var(--accent-lime)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                  1. Upload 5 Foto HP Baru (Kompresi Otomatis)
                </h3>
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  Upload unit depan, belakang, box BNIB segel resmi, kartu garansi, dan kelengkapan.
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

          {/* Quick Multi-Upload Button */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="upload-multi-input-new"
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
                  Pilih atau Drag & Drop Sampai 5 Foto HP Baru Sekaligus
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  JPG, PNG, WebP • Otomatis dikompresi beresolusi tinggi tanpa lag
                </span>
              </div>
              <input
                id="upload-multi-input-new"
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
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                          htmlFor={`file-slot-new-${slot.index}`}
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
                      htmlFor={`file-slot-new-${slot.index}`}
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
                    id={`file-slot-new-${slot.index}`}
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
        {/* BAGIAN 2: IDENTITAS & HARGA                                    */}
        {/* ============================================================== */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={16} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>2. Identitas Smartphone & Status Penjualan di aduHP</h3>
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
                title="Isi form dengan contoh data demo POCO F6"
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

          {/* SELEKTOR UTAMA: STATUS PRODUK DI ADUHP */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Pilih Status Smartphone di Platform aduHP <span style={{ color: 'var(--accent-lime)' }}>*</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Option 1: Dijual oleh aduHP */}
              <div
                onClick={() => setIsForSale(true)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: isForSale ? '2px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isForSale ? 'rgba(198, 255, 0, 0.08)' : '#121216',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <input
                  type="radio"
                  name="status_aduhp_toggle"
                  checked={isForSale}
                  onChange={() => setIsForSale(true)}
                  style={{ marginTop: '3px', accentColor: 'var(--accent-lime)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: isForSale ? 'var(--accent-lime)' : '#fff' }}>
                      🛍️ DIJUAL OLEH ADUHP (READY STOCK)
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(198, 255, 0, 0.2)', color: 'var(--accent-lime)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      Unit Jualan
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Unit ready stock toko aduHP: punya harga promo, stok fisik di gudang, jaminan garansi distributor resmi, dan tombol ORDER / BELI aktif.
                  </p>
                </div>
              </div>

              {/* Option 2: Hanya Database Pembanding */}
              <div
                onClick={() => setIsForSale(false)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: !isForSale ? '2px solid #00E5FF' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: !isForSale ? 'rgba(0, 229, 255, 0.08)' : '#121216',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <input
                  type="radio"
                  name="status_aduhp_toggle"
                  checked={!isForSale}
                  onChange={() => setIsForSale(false)}
                  style={{ marginTop: '3px', accentColor: '#00E5FF', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: !isForSale ? '#00E5FF' : '#fff' }}>
                      ⚖️ HANYA DATABASE PEMBANDING (TIDAK DIJUAL)
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(0, 229, 255, 0.2)', color: '#00E5FF', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      Data Only
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Murni untuk data spesifikasi lengkap & skor AnTuTu v10 di arena Meja Aduan. aduHP TIDAK menjual unit ini (stok 0 & tanpa tombol beli).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group col-8">
              <label className="form-label">Nama Lengkap Smartphone *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Contoh: POCO F6 (12/512GB) Black Titanium"
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
              </select>
            </div>

            {/* Pilihan Tier Harga */}
            <div className="form-group col-6">
              <label className="form-label">Pilihan Kategori / Tier Harga</label>
              <select name="price_tier" className="form-select" value={formData.price_tier} onChange={handleChange}>
                <option value="">-- Otomatis Sesuai Harga --</option>
                <option value="1-2-jt">Rp 1 - 2 Jutaan (Entry-Level Budget Value)</option>
                <option value="2-4-jt">Rp 2 - 4 Jutaan (Mid-Range Sweet Spot)</option>
                <option value="4-8-jt">Rp 4 - 8 Jutaan (Flagship Killer & Upper Mid)</option>
                <option value="flagship">Rp 8 Juta+ (Ultra Flagship & Premium)</option>
              </select>
            </div>

            <div className="form-group col-6">
              <label className="form-label">Garansi Distributor Resmi Indonesia</label>
              <select name="official_distributor" className="form-select" value={formData.official_distributor} onChange={handleChange}>
                <option value="">-- Pilih Garansi Distributor --</option>
                <option value="OPPO Official Indonesia 1 Tahun">OPPO Official Indonesia</option>
                <option value="SEIN Resmi Indonesia 1 Tahun">SEIN Resmi Indonesia (Samsung)</option>
                <option value="iBox / Digimap Resmi 1 Tahun">iBox / Digimap Resmi Indonesia (Apple)</option>
                <option value="TAM Resmi Indonesia 15 Bulan">TAM Resmi Indonesia (Xiaomi/POCO)</option>
                <option value="Carlcare Resmi Indonesia 12 Bulan">Carlcare Resmi Indonesia (Infinix/itel/Tecno)</option>
                <option value="Realme Official Indonesia 1 Tahun">Realme Official Indonesia</option>
                <option value="Vivo Official Indonesia 1 Tahun">Vivo Official Indonesia</option>
                <option value="Asus Official Indonesia 1 Tahun">Asus Official Indonesia</option>
              </select>
            </div>

            <div className="form-group col-4">
              <label className="form-label" style={{ color: isForSale ? 'var(--accent-lime)' : '#00E5FF' }}>
                {isForSale ? 'Harga Promo Toko aduHP (IDR) *' : 'Estimasi Harga Acuan / SRP (IDR)'}
              </label>
              <input
                type="number"
                name="price"
                required={isForSale}
                placeholder={isForSale ? "Contoh: 5499000" : "Contoh: 21999000 (Harga Rilis)"}
                className="form-input"
                style={{ borderColor: isForSale ? 'var(--border-lime)' : 'rgba(0, 229, 255, 0.4)', fontWeight: 800 }}
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Harga Coret / SRP Normal (IDR)</label>
              <input
                type="number"
                name="original_price"
                placeholder="Contoh: 5999000"
                className="form-input"
                value={formData.original_price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">
                {isForSale ? 'Stok Fisik BNIB di Toko (Box) *' : 'Stok Fisik Toko aduHP (Hanya Pembanding)'}
              </label>
              <input
                type="number"
                name="stock"
                disabled={!isForSale}
                placeholder={isForSale ? "Contoh: 10" : "0 (Tidak Ada Stok Jualan)"}
                className="form-input"
                style={!isForSale ? { opacity: 0.6, cursor: 'not-allowed', background: 'rgba(255,255,255,0.03)' } : {}}
                value={isForSale ? formData.stock : '0'}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* MANAJEMEN VARIAN WARNA UNIT                                    */}
          {/* ============================================================== */}
          <div style={{
            marginTop: '20px',
            background: 'rgba(0, 229, 255, 0.03)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '12px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#00E5FF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎨 Manajemen Varian Warna Unit</span>
                </h4>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', maxWidth: '650px', lineHeight: 1.4 }}>
                  Tambahkan pilihan warna resmi smartphone. Tiap warna akan muncul sebagai tombol pilihan warna di halaman pembelian pembeli.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleAddColor(formData.color || 'Plum Purple', '#7B2CBF')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ccc',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Ambil dari input warna bodi utama"
                >
                  ⚡ Ambil dari Warna Bodi
                </button>
                <button
                  type="button"
                  onClick={() => handleAddColor()}
                  style={{
                    background: '#00E5FF',
                    border: 'none',
                    color: '#000',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  <span>+ Tambah Warna</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#777', fontWeight: 600 }}>Pilihan Cepat:</span>
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPresetColor(preset.name, preset.hex)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    color: '#ddd',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title={`Tambah ${preset.name}`}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: preset.hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                  <span>+ {preset.name}</span>
                </button>
              ))}
            </div>

            {/* List / Table of Colors */}
            {colors.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '8px',
                border: '1px dashed rgba(255,255,255,0.1)',
                fontSize: '12px',
                color: '#777'
              }}>
                Belum ada varian warna khusus. Produk ini akan otomatis menggunakan warna bodi: <strong>{formData.color || 'Standard'}</strong>.
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddColor(formData.color || 'Plum Purple', '#7B2CBF')}
                    style={{ background: 'none', border: '1px solid #00E5FF', color: '#00E5FF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    + Tambah Warna Sekarang
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#888' }}>
                      <th style={{ padding: '8px', width: '90px' }}>Palet / Visual</th>
                      <th style={{ padding: '8px' }}>Nama Varian Warna</th>
                      <th style={{ padding: '8px', width: '110px' }}>Kode HEX</th>
                      <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>Warna Standar</th>
                      <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colors.map((c, idx) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="color"
                              value={c.hex}
                              onChange={(e) => handleColorChange(c.id, 'hex', e.target.value)}
                              style={{
                                width: '30px',
                                height: '30px',
                                padding: 0,
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: 'transparent'
                              }}
                              title="Klik untuk memilih palet warna"
                            />
                            <span style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: c.hex,
                              border: '1px solid rgba(255,255,255,0.3)',
                              display: 'inline-block'
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => handleColorChange(c.id, 'name', e.target.value)}
                            placeholder="Contoh: Plum Purple / Violet Purple"
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input
                            type="text"
                            value={c.hex}
                            onChange={(e) => handleColorChange(c.id, 'hex', e.target.value)}
                            placeholder="#7B2CBF"
                            className="form-input"
                            style={{ padding: '6px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                          />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleSetDefaultColor(c.id)}
                            style={{
                              background: c.is_default ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                              border: c.is_default ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.1)',
                              color: c.is_default ? '#00E5FF' : '#777',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {c.is_default ? '✓ Standar' : 'Pilih'}
                          </button>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(c.id)}
                            style={{
                              background: 'rgba(244, 63, 94, 0.15)',
                              border: 'none',
                              color: '#f43f5e',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Hapus warna ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* MANAJEMEN VARIAN RAM, STORAGE, HARGA & STOK (OPSI B)           */}
          {/* ============================================================== */}
          <div style={{
            marginTop: '20px',
            background: 'rgba(198, 255, 0, 0.03)',
            border: '1px solid rgba(198, 255, 0, 0.25)',
            borderRadius: '12px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-lime)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💾 Manajemen Varian RAM & Storage (Kapasitas, Harga & Stok)</span>
                </h4>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', maxWidth: '650px', lineHeight: 1.4 }}>
                  Tentukan varian kapasitas unit. Jika sebuah varian diisi <strong>Stok = 0</strong>, harganya tetap muncul di web sebagai katalog/referensi, tetapi tombol pembelian terkunci (Status: <strong>Stok Habis</strong>).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSyncVariantsFromForm}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ccc',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Sinkronkan dari data RAM, ROM, Harga & Stok form atas"
                >
                  ⚡ Buat 1 Varian dari Form
                </button>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  style={{
                    background: 'var(--accent-lime)',
                    border: 'none',
                    color: '#000',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  <span>+ Tambah Varian</span>
                </button>
              </div>
            </div>

            {/* List / Table of Variants */}
            {variants.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '8px',
                border: '1px dashed rgba(255,255,255,0.1)',
                fontSize: '12px',
                color: '#777'
              }}>
                Belum ada varian kustom. Produk ini akan otomatis memiliki 1 varian standar sesuai data RAM ({formData.ram_gb || '-'}GB), Storage ({formData.storage_gb || '-'}GB), Harga, dan Stok di atas.
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    style={{ background: 'none', border: '1px solid var(--accent-lime)', color: 'var(--accent-lime)', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    + Klik untuk Tambah Varian Manual
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#888' }}>
                      <th style={{ padding: '8px' }}>RAM (GB)</th>
                      <th style={{ padding: '8px' }}>Storage (GB)</th>
                      <th style={{ padding: '8px' }}>Harga Jual (IDR)</th>
                      <th style={{ padding: '8px' }}>Stok Fisik (Unit)</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Varian Standar</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => {
                      const totalFromColors = colors.length > 0
                        ? colors.reduce((sum, c) => {
                            const val = v.color_stocks?.[c.id] ?? (v.color_stocks?.[c.name] ?? 0);
                            return sum + (parseInt(val, 10) || 0);
                          }, 0)
                        : (parseInt(v.stock, 10) || 0);
                      const isZeroStock = totalFromColors <= 0;

                      return (
                        <Fragment key={v.id}>
                          <tr style={{ borderBottom: colors.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                            <td style={{ padding: '8px' }}>
                              <input
                                type="number"
                                value={v.ram}
                                onChange={(e) => handleVariantChange(v.id, 'ram', e.target.value)}
                                placeholder="8"
                                className="form-input"
                                style={{ width: '85px', padding: '6px 8px', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input
                                type="number"
                                value={v.storage}
                                onChange={(e) => handleVariantChange(v.id, 'storage', e.target.value)}
                                placeholder="256"
                                className="form-input"
                                style={{ width: '95px', padding: '6px 8px', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => handleVariantChange(v.id, 'price', e.target.value)}
                                placeholder="3499000"
                                className="form-input"
                                style={{ width: '140px', padding: '6px 8px', fontSize: '12px', fontWeight: 700 }}
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {colors.length === 0 ? (
                                  <input
                                    type="number"
                                    value={v.stock}
                                    onChange={(e) => handleVariantChange(v.id, 'stock', e.target.value)}
                                    placeholder="0"
                                    className="form-input"
                                    style={{ width: '70px', padding: '6px 8px', fontSize: '12px' }}
                                  />
                                ) : (
                                  <div style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    minWidth: '50px',
                                    textAlign: 'center'
                                  }}>
                                    {totalFromColors}
                                  </div>
                                )}
                                {isZeroStock ? (
                                  <span style={{ fontSize: '10px', background: 'rgba(255,69,58,0.2)', color: '#FF6B6B', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                    Habis (0)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10px', background: 'rgba(52,199,89,0.15)', color: '#34C759', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    Ready ({totalFromColors})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleSetDefaultVariant(v.id)}
                                style={{
                                  background: v.is_default ? 'rgba(198, 255, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                                  border: v.is_default ? '1px solid var(--accent-lime)' : '1px solid rgba(255,255,255,0.1)',
                                  color: v.is_default ? 'var(--accent-lime)' : '#777',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {v.is_default ? '✓ Standar' : 'Pilih'}
                              </button>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(v.id)}
                                style={{
                                  background: 'rgba(244, 63, 94, 0.15)',
                                  border: 'none',
                                  color: '#f43f5e',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="Hapus varian ini"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>

                          {/* Sub-row for Color Stock Matrix if colors exist */}
                          {colors.length > 0 && (
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0, 229, 255, 0.02)' }}>
                              <td colSpan={6} style={{ padding: '6px 12px 14px 12px' }}>
                                <div style={{
                                  background: 'rgba(0, 0, 0, 0.35)',
                                  border: '1px solid rgba(0, 229, 255, 0.25)',
                                  borderRadius: '8px',
                                  padding: '10px 14px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '11px', color: '#00E5FF', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>🎨 Alokasi Stok Warna ({v.ram || '0'}GB / {v.storage || '0'}GB):</span>
                                      <span style={{ color: '#aaa', fontWeight: 500 }}>(Total: <strong>{totalFromColors} Unit</strong>)</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickFillVariantStock(v.id, 5)}
                                        style={{
                                          background: 'rgba(255,255,255,0.06)',
                                          border: '1px solid rgba(255,255,255,0.15)',
                                          borderRadius: '4px',
                                          color: '#ddd',
                                          padding: '2px 8px',
                                          fontSize: '10px',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                        title="Set semua warna menjadi 5 unit"
                                      >
                                        ⚡ Set Semua = 5
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickFillVariantStock(v.id, 0)}
                                        style={{
                                          background: 'rgba(255,69,58,0.1)',
                                          border: '1px solid rgba(255,69,58,0.25)',
                                          borderRadius: '4px',
                                          color: '#FF6B6B',
                                          padding: '2px 8px',
                                          fontSize: '10px',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                        title="Kosongkan stok semua warna"
                                      >
                                        Kosongkan (0)
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {colors.map(c => {
                                      const colorStockVal = v.color_stocks?.[c.id] ?? (v.color_stocks?.[c.name] ?? '');
                                      const numStock = parseInt(colorStockVal, 10) || 0;
                                      return (
                                        <div
                                          key={c.id}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                          }}
                                        >
                                          <span style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: c.hex,
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            flexShrink: 0
                                          }} />
                                          <span style={{ fontSize: '11px', color: '#eee', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.name || 'Warna'}
                                          </span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={colorStockVal}
                                            onChange={(e) => handleVariantColorStockChange(v.id, c.id, e.target.value)}
                                            placeholder="0"
                                            className="form-input"
                                            style={{
                                              width: '55px',
                                              padding: '3px 6px',
                                              fontSize: '12px',
                                              textAlign: 'center',
                                              fontWeight: 700
                                            }}
                                          />
                                          {numStock <= 0 ? (
                                            <span style={{ fontSize: '9px', background: 'rgba(255,69,58,0.2)', color: '#FF6B6B', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                                              Habis
                                            </span>
                                          ) : (
                                            <span style={{ fontSize: '9px', background: 'rgba(52,199,89,0.15)', color: '#34C759', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                                              Ready ({numStock})
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 3: BENCHMARK ANTUTU v10                                */}
        {/* ============================================================== */}
        <div style={{ background: 'rgba(255, 109, 0, 0.04)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 109, 0, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#FF9100" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FF9100' }}>
                3. Skor AnTuTu Benchmark v10 (Fitur Inti aduhp.com)
              </h3>
            </div>
            <button
              type="button"
              onClick={autoCalculateAntutu}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '5px 12px', borderColor: 'rgba(255, 109, 0, 0.4)', color: '#FF9100', cursor: 'pointer' }}
            >
              <Sparkles size={13} style={{ marginRight: '5px' }} />
              Hitung Otomatis Breakdown (35% CPU, 25% GPU, 20% MEM, 20% UX)
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group col-4">
              <label className="form-label" style={{ color: '#FF9100' }}>Total Skor AnTuTu v10 *</label>
              <input
                type="number"
                name="antutu_total"
                required
                className="form-input"
                style={{ borderColor: 'rgba(255, 109, 0, 0.4)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                value={formData.antutu_total}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">CPU Score (Kecepatan Proses)</label>
              <input
                type="number"
                name="antutu_cpu"
                className="form-input"
                value={formData.antutu_cpu}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">GPU Score (Render 3D Game)</label>
              <input
                type="number"
                name="antutu_gpu"
                className="form-input"
                value={formData.antutu_gpu}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Memory Score (RAM & ROM)</label>
              <input
                type="number"
                name="antutu_memory"
                className="form-input"
                value={formData.antutu_memory}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">UX Score (Kelancaran UI)</label>
              <input
                type="number"
                name="antutu_ux"
                className="form-input"
                value={formData.antutu_ux}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Label Rating AnTuTu</label>
              <input
                type="text"
                name="antutu_tier"
                placeholder="Contoh: Flagship Killer Tier"
                className="form-input"
                value={formData.antutu_tier}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 4: PENGUJIAN GAMING FPS                                */}
        {/* ============================================================== */}
        <div style={{ background: 'rgba(0, 229, 255, 0.04)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Activity size={18} color="#00E5FF" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#00E5FF' }}>
              4. Matriks Pengujian Gaming FPS Riil
            </h3>
          </div>

          <div className="form-grid">
            <div className="form-group col-3">
              <label className="form-label">Mobile Legends (FPS)</label>
              <input
                type="text"
                name="fps_mlbb"
                className="form-input"
                value={formData.fps_mlbb}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-3">
              <label className="form-label">Free Fire (FPS)</label>
              <input
                type="text"
                name="fps_freefire"
                className="form-input"
                value={formData.fps_freefire}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-3">
              <label className="form-label">PUBG Mobile (FPS)</label>
              <input
                type="text"
                name="fps_pubg"
                className="form-input"
                value={formData.fps_pubg}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-3">
              <label className="form-label">Genshin Impact (FPS)</label>
              <input
                type="text"
                name="fps_genshin"
                className="form-input"
                value={formData.fps_genshin}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN 5: SPESIFIKASI HARDWARE                                */}
        {/* ============================================================== */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <Layers size={16} color="var(--accent-lime)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>5. Spesifikasi Hardware</h3>
          </div>

          <div className="form-grid">
            <div className="form-group col-6">
              <label className="form-label">Chipset & Fabrikasi</label>
              <input
                type="text"
                name="chipset"
                placeholder="Contoh: Snapdragon 8s Gen 3 (4nm) / Dimensity 8300"
                className="form-input"
                value={formData.chipset}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-6">
              <label className="form-label">Layar & Refresh Rate</label>
              <input
                type="text"
                name="display"
                placeholder="Contoh: 6.67 inch AMOLED 1.5K 120Hz"
                className="form-input"
                value={formData.display}
                onChange={handleChange}
              />
            </div>

            <div className="form-group col-4">
              <label className="form-label">RAM (GB)</label>
              <input type="number" name="ram_gb" placeholder="Contoh: 12" className="form-input" value={formData.ram_gb} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">Storage ROM (GB)</label>
              <input type="number" name="storage_gb" placeholder="Contoh: 512" className="form-input" value={formData.storage_gb} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label" style={{ color: 'var(--accent-lime)' }}>🔋 Baterai & Charging *</label>
              <input type="text" name="battery" placeholder="Contoh: 5000 mAh + 90W Fast Charge" className="form-input" style={{ borderColor: 'rgba(212, 255, 0, 0.4)' }} value={formData.battery} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">📸 Kamera Utama & Selfie</label>
              <input type="text" name="camera" placeholder="Contoh: 50MP Sony LYT-600 OIS • 20MP Selfie" className="form-input" value={formData.camera} onChange={handleChange} />
            </div>

            <div className="form-group col-4">
              <label className="form-label">📱 Sistem Operasi (OS)</label>
              <input type="text" name="os" placeholder="Contoh: HyperOS (Android 14)" className="form-input" value={formData.os} onChange={handleChange} />
            </div>

            <div className="form-group col-6">
              <label className="form-label">Warna Bodi</label>
              <input type="text" name="color" placeholder="Contoh: Black Titanium" className="form-input" value={formData.color} onChange={handleChange} />
            </div>

            <div className="form-group col-6">
              <label className="form-label">Nomor IMEI Fisik</label>
              <input type="text" name="imei" placeholder="Contoh: 358291039102931" className="form-input" value={formData.imei} onChange={handleChange} />
            </div>

            <div className="form-group col-12">
              <label className="form-label">Deskripsi Lengkap Smartphone</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Jelaskan spesifikasi unggulan, fitur kamera, kelengkapan isi box, dll."
                className="form-input"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
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
              background: isForSale ? 'var(--accent-lime)' : '#00E5FF', 
              color: '#000', 
              fontWeight: 800, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            <span>
              {submitting 
                ? 'Mengompres & Menyimpan...' 
                : (isForSale ? 'Simpan HP Baru (Dijual aduHP)' : 'Simpan ke Database Pembanding')}
            </span>
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

export default function NewProductPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: '#888' }}>Memuat form produk...</div>}>
      <NewProductContent />
    </Suspense>
  );
}
