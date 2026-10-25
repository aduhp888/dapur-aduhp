'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  PlusCircle, 
  Code2, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Database, 
  Trash2, 
  Edit3,
  Flame,
  Zap,
  Gauge,
  Activity,
  Award,
  Filter
} from 'lucide-react';
import { supabase, SEED_PRODUCTS, PRICE_TIERS } from '@/lib/supabase';
import { formatIDR } from '@/lib/utils';

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [selectedTier, selectedBrand]);

  async function fetchProducts() {
    setLoading(true);
    try {
      let query = supabase.from('dapur_products').select('*').order('created_at', { ascending: false });

      if (selectedTier !== 'all') {
        query = query.eq('price_tier', selectedTier);
      }
      if (selectedBrand !== 'all') {
        query = query.ilike('brand', selectedBrand);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        let fallback = [...SEED_PRODUCTS];
        if (selectedTier !== 'all') {
          fallback = fallback.filter(p => p.price_tier === selectedTier);
        }
        if (selectedBrand !== 'all') {
          fallback = fallback.filter(p => p.brand.toLowerCase() === selectedBrand.toLowerCase());
        }
        setProducts(fallback);
        setIsFallback(true);
      } else {
        setProducts(data);
        setIsFallback(false);
      }
    } catch (err) {
      setProducts(SEED_PRODUCTS);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus produk ini dari dapur_products?')) return;

    try {
      if (!isFallback) {
        const { error } = await supabase.from('dapur_products').delete().eq('id', id);
        if (error) {
          alert('Gagal menghapus: ' + error.message);
          return;
        }
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Produk berhasil dihapus!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // Calculate stats
  const totalProducts = products.length;
  const count1jt = products.filter(p => p.price_tier === '1-2-jt').length;
  const count2jt = products.filter(p => p.price_tier === '2-4-jt').length;
  const count4jt = products.filter(p => p.price_tier === '4-8-jt').length;
  const countFlagship = products.filter(p => p.price_tier === 'flagship').length;
  
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.stock || 1)), 0);

  // Average AnTuTu score
  const avgAnTuTu = Math.round(
    products.reduce((acc, p) => acc + (p.antutu?.total || 0), 0) / (products.length || 1)
  );

  // Search filter
  const displayedProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.specs?.chipset?.toLowerCase().includes(q) ||
      p.imei?.toLowerCase().includes(q)
    );
  });

  const BRANDS = ['all', 'Samsung', 'Apple', 'Xiaomi', 'POCO', 'Infinix', 'Realme', 'Vivo', 'itel', 'iQOO'];

  return (
    <div>
      {/* Fallback Banner */}
      {isFallback && (
        <div className="alert-banner">
          <div className="alert-content">
            <AlertTriangle size={18} color="#f59e0b" />
            <div>
              <strong>Mode Sinkronisasi Lokal Aktif:</strong> Menggunakan 24 data HP Baru BNIB resmi lengkap dengan Benchmark AnTuTu v10 & Uji FPS Gaming dari <code>aduhp.com</code>.
            </div>
          </div>
          <Link href="/schema-setup" className="btn btn-secondary btn-sm" style={{ background: '#000' }}>
            <Database size={13} />
            <span>Migrasi Supabase SQL</span>
          </Link>
        </div>
      )}

      {/* Hero Welcome & Quick Links */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', color: '#fff' }}>
              Dashboard Dapur aduHP
            </h1>
            <span className="badge" style={{ background: 'rgba(198, 255, 0, 0.15)', color: '#C6FF00', fontWeight: 800 }}>
              TERINTEGRASI ADUHP.COM
            </span>
          </div>
          <p style={{ color: '#888', fontSize: '13.5px', marginTop: '6px' }}>
            Pusat manajemen 100% Smartphone Baru (BNIB Resmi), Benchmark AnTuTu v10, Uji Gaming FPS, dan Inventaris Multi-Tier Harga.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="https://aduhp.com/adu-hp"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'rgba(198, 255, 0, 0.4)', color: '#C6FF00' }}
          >
            <span>⚔️</span>
            <span>Buka Arena Adu HP (/adu-hp)</span>
            <ExternalLink size={12} />
          </a>
          <a
            href="/api/products"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <Code2 size={14} />
            <span>API Products</span>
            <ExternalLink size={12} color="#666" />
          </a>
          <Link href="/products/new" className="btn btn-primary btn-sm">
            <PlusCircle size={14} />
            <span>Input HP Baru & AnTuTu</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid: Synchronized with aduhp.com 4-tier pricing */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Smartphone Baru (BNIB)</span>
            <div className="stat-icon"><Smartphone size={16} color="#00e5ff" /></div>
          </div>
          <div className="stat-value">{totalProducts} Unit</div>
          <div className="stat-desc">
            <span style={{ color: '#00E5FF' }}>{count1jt} (1-2jt)</span>
            <span>•</span>
            <span style={{ color: '#C6FF00' }}>{count2jt} (2-4jt)</span>
            <span>•</span>
            <span style={{ color: '#FF9100' }}>{count4jt} (4-8jt)</span>
            <span>•</span>
            <span style={{ color: '#E040FB' }}>{countFlagship} (Flagship)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Rata-rata Skor AnTuTu v10</span>
            <div className="stat-icon"><Flame size={16} color="#FF9100" /></div>
          </div>
          <div className="stat-value" style={{ color: '#FF9100', fontFamily: 'var(--font-mono)' }}>
            {avgAnTuTu.toLocaleString('id-ID')}
          </div>
          <div className="stat-desc">
            Benchmark resmi AnTuTu v10 Lab
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Stok Fisik BNIB</span>
            <div className="stat-icon"><Layers size={16} color="#34d399" /></div>
          </div>
          <div className="stat-value">{totalStock} Box</div>
          <div className="stat-desc">
            100% Segel Garansi TAM, SEIN, iBox & Carlcare
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Nilai Inventaris</span>
            <div className="stat-icon"><TrendingUp size={16} color="var(--accent-lime)" /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--accent-lime)' }}>
            {formatIDR(totalInventoryValue)}
          </div>
          <div className="stat-desc">
            Berdasarkan harga jual retail promo
          </div>
        </div>
      </div>

      {/* Main Table: Smartphone Inventory & Benchmark */}
      <div className="table-container">
        {/* Toolbar */}
        <div className="table-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          
          {/* Top row search & tier pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div className="search-input-wrapper" style={{ minWidth: '300px' }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Cari nama HP, chipset, brand, atau IMEI..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Brand Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#777' }}>Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{
                  background: '#161616',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                {BRANDS.map(b => (
                  <option key={b} value={b}>{b === 'all' ? 'Semua Brand' : b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tier Filter Pills Row */}
          <div className="tier-pills-row" style={{ marginBottom: 0 }}>
            {PRICE_TIERS.map(tier => {
              const isSelected = selectedTier === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`tier-pill-btn ${isSelected ? 'active' : ''}`}
                  style={{
                    borderColor: isSelected ? tier.color : undefined,
                    color: isSelected ? tier.color : undefined
                  }}
                >
                  <span>{tier.label}</span>
                  {tier.badge && (
                    <span style={{
                      fontSize: '9.5px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      {tier.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            <div className="status-dot" style={{ margin: '0 auto 12px' }}></div>
            Memuat katalog & benchmark dari dapur_products...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Smartphone size={32} color="#444" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>Tidak ada HP yang cocok</div>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
              Coba ubah filter kategori harga atau kata kunci pencarian.
            </p>
            <Link href="/products/new" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
              <PlusCircle size={14} /> Input Smartphone Baru
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Foto</th>
                  <th>Smartphone & Chipset</th>
                  <th>Kategori Harga</th>
                  <th>Skor AnTuTu v10</th>
                  <th>Estimasi Gaming FPS</th>
                  <th>Garansi Distributor</th>
                  <th>Harga Promo (IDR)</th>
                  <th>Stok</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const imageSrc = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200';
                  
                  // Color coding for tier
                  const tierClass = 
                    p.price_tier === '1-2-jt' ? 'badge-tier-1jt' :
                    p.price_tier === '2-4-jt' ? 'badge-tier-2jt' :
                    p.price_tier === '4-8-jt' ? 'badge-tier-4jt' : 'badge-tier-flagship';

                  const tierLabel = 
                    p.price_tier === '1-2-jt' ? '1 - 2 Juta' :
                    p.price_tier === '2-4-jt' ? '2 - 4 Juta' :
                    p.price_tier === '4-8-jt' ? '4 - 8 Juta' : 'Flagship (8 Jt+)';

                  return (
                    <tr key={p.id}>
                      {/* Image Thumbnail */}
                      <td>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          background: '#161616',
                          border: '1px solid var(--border-subtle)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <img
                            src={imageSrc}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200';
                            }}
                          />
                        </div>
                      </td>

                      {/* Product Name & Chipset */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '13.5px' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          💻 <strong>{p.specs?.chipset || 'Octa-Core'}</strong> • {p.specs?.ram_rom || ''}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          IMEI: {p.imei || '-'}
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td>
                        <span className={`badge ${tierClass}`} style={{ fontWeight: 800, fontSize: '11px' }}>
                          {tierLabel}
                        </span>
                      </td>

                      {/* AnTuTu Score Badge */}
                      <td>
                        {p.antutu?.total ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div className="badge-antutu">
                              <Flame size={12} />
                              <span>{p.antutu.total.toLocaleString('id-ID')} Poin</span>
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#888' }}>
                              CPU: {p.antutu.cpu?.toLocaleString('id-ID')} • GPU: {p.antutu.gpu?.toLocaleString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#666' }}>-</span>
                        )}
                      </td>

                      {/* Gaming FPS Mini Grid */}
                      <td>
                        {p.gaming_fps ? (
                          <div className="fps-grid-mini" style={{ width: '130px' }}>
                            <div className="fps-item">
                              <span>MLBB:</span>
                              <span>{p.gaming_fps.mlbb}</span>
                            </div>
                            <div className="fps-item">
                              <span>PUBG:</span>
                              <span>{p.gaming_fps.pubg}</span>
                            </div>
                            <div className="fps-item">
                              <span>FF:</span>
                              <span>{p.gaming_fps.freefire}</span>
                            </div>
                            <div className="fps-item">
                              <span>Genshin:</span>
                              <span>{p.gaming_fps.genshin}</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#666' }}>-</span>
                        )}
                      </td>

                      {/* Official Distributor */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>
                          <ShieldCheck size={13} />
                          <span>{p.official_distributor || 'Resmi Indonesia'}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>100% Segel BNIB</div>
                      </td>

                      {/* Price */}
                      <td>
                        <div className="price-text" style={{ color: 'var(--accent-lime)', fontWeight: 800 }}>
                          {formatIDR(p.price)}
                        </div>
                        {p.original_price && p.original_price > p.price && (
                          <div className="original-price-text" style={{ fontSize: '10.5px' }}>
                            {formatIDR(p.original_price)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td>
                        <span className="badge badge-stock">
                          {p.stock || 10} Box
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <a
                            href={`https://aduhp.com/adu-hp`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'rgba(198, 255, 0, 0.3)', color: '#C6FF00' }}
                            title="Buka Arena Aduan di aduhp.com"
                          >
                            ⚔️
                          </a>
                          <Link
                            href={`/products/${p.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit Data & Benchmark"
                          >
                            <Edit3 size={13} />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn btn-danger btn-sm"
                            title="Hapus Produk"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration Guidance Box */}
      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Zap size={18} color="var(--accent-lime)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              Sinkronisasi Langsung ke aduhp.com & /adu-hp
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#888', lineHeight: '1.6', marginBottom: '12px' }}>
            Setiap perubahan data harga, stok BNIB, skor AnTuTu v10, dan spesifikasi di dapur ini otomatis menjadi acuan untuk perbandingan di web publik:
          </p>
          <div className="code-preview-box" style={{ color: 'var(--accent-lime)' }}>
            https://aduhp.com/adu-hp
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Code2 size={18} color="#00e5ff" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              Endpoint REST API Terbuka
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#888', lineHeight: '1.6', marginBottom: '12px' }}>
            Konsumsi data produk dengan filter tier harga (<code>?tier=1-2-jt</code>, <code>?tier=2-4-jt</code>, dll) dan format AnTuTu v10 lengkap:
          </p>
          <div className="code-preview-box">
            GET https://dapur.aduhp.com/api/products?tier=flagship
          </div>
        </div>
      </div>
    </div>
  );
}
