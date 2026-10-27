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
  Filter,
  ShoppingBag,
  Scale,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { supabase, PRICE_TIERS } from '@/lib/supabase';
import { formatIDR } from '@/lib/utils';

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [saleFilter, setSaleFilter] = useState('all'); // 'all' | 'dijual' | 'compare_only'
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state (10 products per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, saleFilter, selectedTier, selectedBrand]);

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

      if (error) {
        console.error('Gagal mengambil data dari Supabase:', error.message);
        setProducts([]);
        setIsFallback(false);
      } else {
        setProducts(data || []);
        setIsFallback(false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setProducts([]);
      setIsFallback(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus produk ini dari dapur_products?')) return;

    try {
      const { error } = await supabase.from('dapur_products').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
        return;
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Produk berhasil dihapus!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function handleToggleForSale(product) {
    const newStatus = product.is_for_sale === false ? true : false;
    const confirmText = newStatus 
      ? `Ubah "${product.name}" menjadi DIJUAL OLEH ADUHP (akan tampil di katalog toko & bisa dibeli)?`
      : `Ubah "${product.name}" menjadi HANYA DATA PEMBANDING ADUAN (TIDAK DIJUAL oleh aduHP, hanya untuk adu spesifikasi)?`;

    if (!confirm(confirmText)) return;

    try {
      const { error } = await supabase
        .from('dapur_products')
        .update({
          is_for_sale: newStatus,
          sale_status: newStatus ? 'dijual' : 'compare_only',
          stock: newStatus ? (product.stock || 5) : 0
        })
        .eq('id', product.id);

      if (error) console.warn('Supabase update error:', error.message);

      setProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            is_for_sale: newStatus,
            sale_status: newStatus ? 'dijual' : 'compare_only',
            stock: newStatus ? (p.stock || 5) : 0,
            badge: newStatus ? '🟢 Dijual oleh aduHP (Ready Stock)' : '⚖️ Hanya Pembanding Aduan (Tidak Dijual)'
          };
        }
        return p;
      }));
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    }
  }

  // Calculate separated stats
  const totalProducts = products.length;
  const countDijual = products.filter(p => p.is_for_sale === true).length;
  const countCompare = products.filter(p => p.is_for_sale === false).length;
  const countBaruDijual = products.filter(p => p.is_for_sale === true && p.condition !== 'second').length;
  const countSecondDijual = products.filter(p => p.is_for_sale === true && p.condition === 'second').length;

  const totalStockDijual = products.filter(p => p.is_for_sale === true).reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValueDijual = products.filter(p => p.is_for_sale === true).reduce((acc, p) => acc + ((p.price || 0) * (p.stock || 1)), 0);

  // Average AnTuTu score across all phones
  const avgAnTuTu = Math.round(
    products.reduce((acc, p) => acc + (p.antutu?.total || 0), 0) / (products.length || 1)
  );

  // Filter products by saleFilter, tier, brand, search
  const displayedProducts = products.filter(p => {
    if (saleFilter === 'dijual' && p.is_for_sale !== true) return false;
    if (saleFilter === 'compare_only' && p.is_for_sale === true) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.specs?.chipset?.toLowerCase().includes(q) ||
      p.imei?.toLowerCase().includes(q)
    );
  });

  // Pagination calculation: 10 products per page
  const totalItems = displayedProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedProducts = displayedProducts.slice(startIndex, endIndex);

  const BRANDS = ['all', 'Samsung', 'Apple', 'OPPO', 'Xiaomi', 'POCO', 'Infinix', 'Realme', 'Vivo', 'Tecno', 'itel', 'iQOO', 'Asus', 'Google'];

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
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text-primary)' }}>
              Dashboard Dapur aduHP
            </h1>
            <span className="badge" style={{ background: 'rgba(198, 255, 0, 0.15)', color: 'var(--accent-lime)', fontWeight: 800 }}>
              TERINTEGRASI ADUHP.COM
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>
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

      {/* Stats Grid: Synchronized with Unit Dijual vs Pembanding Aduan */}
      <div className="stats-grid">
        {/* Card 1: HP Dijual oleh aduHP */}
        <div className="stat-card" style={{ border: '1px solid rgba(198, 255, 0, 0.35)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--accent-lime)' }}>🛍️ HP Dijual oleh aduHP</span>
            <div className="stat-icon"><ShoppingBag size={16} color="var(--accent-lime)" /></div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-lime)' }}>{countDijual} Unit</div>
          <div className="stat-desc">
            <span style={{ color: '#fff' }}>{countBaruDijual} Baru BNIB</span>
            <span>•</span>
            <span style={{ color: '#00E5FF' }}>{countSecondDijual} Second QC</span>
          </div>
        </div>

        {/* Card 2: Database Aduan Compare Only */}
        <div className="stat-card" style={{ border: '1px solid rgba(255, 145, 0, 0.35)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: '#FF9100' }}>⚖️ Database Aduan (Tidak Dijual)</span>
            <div className="stat-icon"><Scale size={16} color="#FF9100" /></div>
          </div>
          <div className="stat-value" style={{ color: '#FF9100' }}>{countCompare} Tipe</div>
          <div className="stat-desc">
            Data Spek & Skor AnTuTu ({Number(avgAnTuTu || 0).toLocaleString('id-ID')} Avg)
          </div>
        </div>

        {/* Card 3: Total Stok Jualan */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Stok Fisik Jualan</span>
            <div className="stat-icon"><Layers size={16} color="#34d399" /></div>
          </div>
          <div className="stat-value">{totalStockDijual} Box</div>
          <div className="stat-desc">
            100% Ready di Gudang aduHP
          </div>
        </div>

        {/* Card 4: Nilai Inventaris Jualan */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Nilai Inventaris Jualan</span>
            <div className="stat-icon"><TrendingUp size={16} color="var(--accent-lime)" /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--accent-lime)' }}>
            {formatIDR(totalInventoryValueDijual)}
          </div>
          <div className="stat-desc">
            Berdasarkan unit yang aktif dijual
          </div>
        </div>
      </div>

      {/* Main Table: Smartphone Inventory & Benchmark */}
      <div className="table-container">
        {/* Toolbar */}
        <div className="table-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          
          {/* Level 1 Tabs: Klasifikasi Unit Dijual vs Data Pembanding Aduan */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSaleFilter('all')}
              className={`btn btn-sm ${saleFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px' }}
            >
              Semua Katalog ({products.length})
            </button>
            <button
              onClick={() => setSaleFilter('dijual')}
              className={`btn btn-sm ${saleFilter === 'dijual' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '8px',
                borderColor: saleFilter === 'dijual' ? 'var(--accent-lime)' : 'rgba(198, 255, 0, 0.3)',
                color: saleFilter === 'dijual' ? '#000' : 'var(--accent-lime)',
                fontWeight: 800
              }}
            >
              <ShoppingBag size={14} />
              <span>🛍️ HP Dijual oleh aduHP ({countDijual})</span>
            </button>
            <button
              onClick={() => setSaleFilter('compare_only')}
              className={`btn btn-sm ${saleFilter === 'compare_only' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '8px',
                borderColor: saleFilter === 'compare_only' ? '#FF9100' : 'rgba(255, 145, 0, 0.3)',
                color: saleFilter === 'compare_only' ? '#000' : '#FF9100',
                background: saleFilter === 'compare_only' ? '#FF9100' : undefined,
                fontWeight: 800
              }}
            >
              <Scale size={14} />
              <span>⚖️ Hanya Pembanding Aduan (Tidak Dijual) ({countCompare})</span>
            </button>
          </div>

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
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '56px' }}>Foto</th>
                    <th>Smartphone & Chipset</th>
                    <th>Status di aduHP</th>
                    <th>Kategori Harga</th>
                    <th>Skor AnTuTu v10</th>
                    <th>Estimasi Gaming FPS</th>
                    <th>Garansi Distributor</th>
                    <th>Harga Promo (IDR)</th>
                    <th>Stok</th>
                    <th style={{ textAlign: 'right' }}>Aksi & Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => {
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

                      {/* Status di aduHP */}
                      <td>
                        {p.is_for_sale !== false ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(198, 255, 0, 0.1)',
                            border: '1px solid rgba(198, 255, 0, 0.3)',
                            color: 'var(--accent-lime)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800
                          }}>
                            <ShoppingBag size={11} />
                            <span>Dijual aduHP</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255, 145, 0, 0.1)',
                            border: '1px solid rgba(255, 145, 0, 0.3)',
                            color: '#FF9100',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800
                          }}>
                            <Scale size={11} />
                            <span>Hanya Pembanding</span>
                          </div>
                        )}
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
                              <span>{Number(p.antutu.total).toLocaleString('id-ID')} Poin</span>
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
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          {p.condition === 'second' ? 'Second QC Passed' : '100% Segel BNIB'}
                        </div>
                      </td>

                      {/* Price */}
                      <td>
                        {p.is_for_sale !== false ? (
                          <div>
                            <div className="price-text" style={{ color: 'var(--accent-lime)', fontWeight: 800 }}>
                              {formatIDR(p.price)}
                            </div>
                            {p.original_price && p.original_price > p.price && (
                              <div className="original-price-text" style={{ fontSize: '10.5px' }}>
                                {formatIDR(p.original_price)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>Tidak Dijual</span>
                            <div style={{ fontSize: '10px', color: '#555' }}>
                              SRP: {formatIDR(p.original_price || p.price)}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td>
                        {p.is_for_sale !== false ? (
                          <span className="badge badge-stock">
                            {p.stock || 5} Box
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#555' }}>
                            - (Data Only)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* 1-Click Quick Toggle Status */}
                          <button
                            onClick={() => handleToggleForSale(p)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: p.is_for_sale !== false ? 'rgba(255, 145, 0, 0.1)' : 'rgba(198, 255, 0, 0.1)',
                              border: p.is_for_sale !== false ? '1px solid rgba(255, 145, 0, 0.35)' : '1px solid var(--border-lime)',
                              color: p.is_for_sale !== false ? '#FF9100' : 'var(--accent-lime)',
                            }}
                            title={p.is_for_sale !== false ? "Ubah ke: Hanya Pembanding Aduan (Tidak Dijual)" : "Ubah ke: Dijual oleh aduHP (Ready Stock)"}
                          >
                            {p.is_for_sale !== false ? <Scale size={10} /> : <ShoppingBag size={10} />}
                            <span>{p.is_for_sale !== false ? 'Set Pembanding' : 'Set Dijual'}</span>
                          </button>

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

          {/* Pagination Controls (1 Page 10 Produk) */}
          {totalItems > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> dari <strong>{totalItems}</strong> smartphone
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  10 produk per halaman
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* First page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 8px', opacity: safeCurrentPage === 1 ? 0.35 : 1, cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                  title="Halaman Pertama"
                >
                  <ChevronsLeft size={14} />
                </button>

                {/* Previous page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px', gap: '4px', opacity: safeCurrentPage === 1 ? 0.35 : 1, cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={14} />
                  <span>Sebelumnya</span>
                </button>

                {/* Page number buttons */}
                <div style={{ display: 'flex', gap: '4px', margin: '0 4px' }}>
                  {getPageNumbers(safeCurrentPage, totalPages).map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`dots-${idx}`} style={{ padding: '6px 6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                          ...
                        </span>
                      );
                    }
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          minWidth: '32px',
                          height: '32px',
                          padding: '0 6px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: isActive ? 800 : 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isActive ? '1px solid var(--border-lime)' : '1px solid var(--border-subtle)',
                          background: isActive ? 'var(--accent-lime)' : 'var(--bg-card-hover)',
                          color: isActive ? '#000000' : 'var(--text-primary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safeCurrentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px', gap: '4px', opacity: safeCurrentPage === totalPages ? 0.35 : 1, cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  title="Halaman Selanjutnya"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight size={14} />
                </button>

                {/* Last page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 8px', opacity: safeCurrentPage === totalPages ? 0.35 : 1, cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  title="Halaman Terakhir"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
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
