'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Smartphone,
  Eye,
  CheckCircle,
  Copy,
  Check,
  Flame,
  ShieldCheck,
  Zap,
  Activity,
  ShoppingBag,
  Scale,
  Layers,
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saleFilter, setSaleFilter] = useState('all'); // 'all' | 'dijual' | 'compare_only'
  const [selectedCondition, setSelectedCondition] = useState('all'); // 'all' | 'baru' | 'second'
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Pagination state (10 products per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, saleFilter, selectedCondition, selectedTier, selectedBrand]);

  // Sync tab filter from URL query param (?tab=dijual or ?tab=compare)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'dijual') {
        setSaleFilter('dijual');
      } else if (tab === 'compare') {
        setSaleFilter('compare_only');
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedTier, selectedBrand, selectedCondition]);

  async function fetchProducts() {
    setLoading(true);
    try {
      let query = supabase.from('dapur_products').select('*').order('created_at', { ascending: false });

      if (selectedCondition !== 'all') {
        query = query.eq('condition', selectedCondition);
      }
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
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus produk ini secara permanen dari dapur_products?')) return;

    try {
      const { error } = await supabase.from('dapur_products').delete().eq('id', id);
      if (error) {
        console.warn('Delete error:', error.message);
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Produk berhasil dihapus!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  function copyImei(imei) {
    if (!imei) return;
    navigator.clipboard.writeText(imei);
    setCopiedId(imei);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleToggleForSale(product) {
    const newStatus = product.is_for_sale === false ? true : false;
    const confirmText = newStatus 
      ? `Ubah "${product.name}" menjadi DIJUAL OLEH ADUHP (akan tampil di katalog jualan toko & bisa dibeli)?`
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

      if (error) {
        console.warn('Supabase update error:', error.message);
      }

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

  // Count stats
  const countDijual = products.filter(p => p.is_for_sale === true).length;
  const countCompare = products.filter(p => p.is_for_sale === false).length;
  const countBaruDijual = products.filter(p => p.is_for_sale === true && p.condition !== 'second').length;
  const countSecondDijual = products.filter(p => p.is_for_sale === true && p.condition === 'second').length;

  const displayedProducts = products.filter(p => {
    // 1. Sale status filter
    if (saleFilter === 'dijual' && p.is_for_sale !== true) return false;
    if (saleFilter === 'compare_only' && p.is_for_sale === true) return false;

    // 2. Condition filter (baru vs second)
    if (selectedCondition !== 'all' && p.condition !== selectedCondition) return false;

    // 3. Search query
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch = 
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.specs?.chipset?.toLowerCase().includes(q) ||
        p.imei?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Pagination calculation: 10 products per page
  const totalItems = displayedProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedProducts = displayedProducts.slice(startIndex, endIndex);

  const BRANDS = ['all', 'Samsung', 'Apple', 'OPPO', 'Xiaomi', 'POCO', 'Vivo', 'Realme', 'Infinix', 'iQOO', 'Tecno', 'itel', 'Asus', 'Google'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Katalog Smartphone & Benchmark Lab
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Kelola data HP 100% Baru (BNIB Segel), skor AnTuTu v10, dan uji FPS gaming untuk ekosistem <strong>aduhp.com</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="https://aduhp.com/adu-hp"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ borderColor: 'rgba(198, 255, 0, 0.4)', color: '#C6FF00' }}
          >
            <span>⚔️ Arena Adu HP</span>
            <ExternalLink size={13} />
          </a>
          <Link 
            href="/products/second" 
            className="btn"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(198, 255, 0, 0.15))', 
              border: '1px solid #00E5FF', 
              color: '#00E5FF',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔄</span>
            <span>Upload HP Second (5 Foto)</span>
          </Link>
          <Link href="/products/new" className="btn btn-primary">
            <PlusCircle size={15} />
            <span>Input HP Baru</span>
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        {/* Filters */}
        <div className="table-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          
          {/* Level 1 Tabs: Klasifikasi Unit Dijual vs Data Pembanding Aduan */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSaleFilter('all'); setSelectedCondition('all'); }}
              className={`btn btn-sm ${saleFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px' }}
            >
              Semua Katalog ({products.length})
            </button>
            <button
              onClick={() => { setSaleFilter('dijual'); }}
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
              onClick={() => { setSaleFilter('compare_only'); setSelectedCondition('all'); }}
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

          {/* Level 2 Sub-Tabs: Kondisi BNIB vs Second (khusus jika tab Dijual atau Semua aktif) */}
          {saleFilter !== 'compare_only' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '2px' }}>
              <span style={{ fontSize: '11px', color: '#777', fontWeight: 600 }}>Tipe Kondisi Jualan:</span>
              <button
                onClick={() => setSelectedCondition('all')}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: selectedCondition === 'all' ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                  background: selectedCondition === 'all' ? 'var(--bg-card-hover)' : 'transparent',
                  color: selectedCondition === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Semua Jualan ({countDijual})
              </button>
              <button
                onClick={() => setSelectedCondition('baru')}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: selectedCondition === 'baru' ? '1px solid var(--border-lime)' : '1px solid var(--border-subtle)',
                  background: selectedCondition === 'baru' ? 'rgba(198, 255, 0, 0.12)' : 'transparent',
                  color: selectedCondition === 'baru' ? 'var(--accent-lime)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                📱 100% Baru BNIB ({countBaruDijual})
              </button>
              <button
                onClick={() => setSelectedCondition('second')}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: selectedCondition === 'second' ? '1px solid #00E5FF' : '1px solid var(--border-subtle)',
                  background: selectedCondition === 'second' ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
                  color: selectedCondition === 'second' ? '#00E5FF' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                🔄 HP Second Lolos QC ({countSecondDijual})
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div className="search-input-wrapper" style={{ minWidth: '300px' }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama HP, chipset, brand, atau IMEI..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Brand Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#777' }}>Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '12px' }}
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

        {/* Table List */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            <div className="status-dot" style={{ margin: '0 auto 12px' }}></div>
            Mengambil data katalog smartphone...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Smartphone size={32} color="#444" style={{ margin: '0 auto 12px' }} />
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Tidak ada HP yang cocok</div>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
              Coba ubah kata kunci pencarian atau filter tier harga yang dipilih.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Foto</th>
                  <th>Nama Smartphone & Chipset</th>
                  <th>Status di aduHP</th>
                  <th>Kategori Harga</th>
                  <th>Skor AnTuTu (v10 / v11)</th>
                  <th>Gaming FPS</th>
                  <th>IMEI & Garansi</th>
                  <th>Harga (IDR)</th>
                  <th>Stok</th>
                  <th style={{ textAlign: 'right' }}>Aksi & Toggle</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const imageSrc = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200';
                  
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
                      <td>
                        <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            background: '#161616',
                            border: p.condition === 'second' ? '1px solid #00E5FF' : '1px solid var(--border-subtle)',
                            overflow: 'hidden',
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
                          {Array.isArray(p.images) && p.images.length > 1 && (
                            <span 
                              title={`${p.images.length} foto fisik diupload`}
                              style={{
                                position: 'absolute',
                                bottom: '-3px',
                                right: '-3px',
                                background: '#00E5FF',
                                color: '#000',
                                fontSize: '8.5px',
                                fontWeight: 900,
                                padding: '1px 4px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                              }}
                            >
                              {p.images.length}P
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                            {p.name || `${p.brand || 'Smartphone'} (Tanpa Nama)`}
                          </span>
                          {p.condition === 'second' ? (
                            <span style={{
                              fontSize: '9px',
                              background: 'rgba(0, 229, 255, 0.15)',
                              color: '#00E5FF',
                              border: '1px solid rgba(0, 229, 255, 0.35)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 800
                            }}>
                              SECOND {p.battery_health ? `• BH ${p.battery_health}%` : ''}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '9px',
                              background: 'rgba(198, 255, 0, 0.12)',
                              color: 'var(--accent-lime)',
                              border: '1px solid var(--border-lime)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 800
                            }}>
                              BNIB BARU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          💻 {p.specs?.chipset || 'Octa-Core'} • {p.specs?.display || ''}
                        </div>
                      </td>

                      {/* Kolom Status di aduHP */}
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

                      <td>
                        <span className={`badge ${tierClass}`} style={{ fontWeight: 800 }}>
                          {tierLabel}
                        </span>
                      </td>

                      <td>
                        {p.antutu?.total ? (
                          (() => {
                            const isV11 = String(p.antutu?.version || '').toLowerCase().includes('11');
                            return (
                              <div className={`badge-antutu ${isV11 ? 'v11' : ''}`}>
                                <Flame size={12} color={isV11 ? '#C084FC' : '#FF9100'} />
                                <span style={{ fontSize: '9px', opacity: 0.9, fontWeight: 900 }}>
                                  {isV11 ? 'V11' : 'V10'}
                                </span>
                                <span>{Number(p.antutu.total).toLocaleString('id-ID')}</span>
                              </div>
                            );
                          })()
                        ) : (
                          <span style={{ fontSize: '11px', color: '#666' }}>-</span>
                        )}
                      </td>

                      <td>
                        {p.gaming_fps ? (
                          <div className="fps-grid-mini" style={{ width: '120px' }}>
                            <div className="fps-item">
                              <span>MLBB:</span>
                              <span>{p.gaming_fps.mlbb}</span>
                            </div>
                            <div className="fps-item">
                              <span>PUBG:</span>
                              <span>{p.gaming_fps.pubg}</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#666' }}>-</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button
                            onClick={() => copyImei(p.imei)}
                            className="imei-badge"
                            style={{ cursor: 'pointer', background: 'transparent', width: 'fit-content' }}
                            title="Klik untuk salin IMEI"
                          >
                            {p.imei || '-'} {copiedId === p.imei ? <Check size={10} color="#10b981" /> : <Copy size={10} color="#666" />}
                          </button>
                          <span style={{ color: p.is_for_sale !== false ? '#34d399' : '#888', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={11} /> {p.is_for_sale !== false ? (p.official_distributor || 'Resmi') : 'Data Spesifikasi'}
                          </span>
                        </div>
                      </td>

                      {/* Harga Promo */}
                      <td>
                        {p.is_for_sale !== false ? (
                          <div>
                            <div className="price-text" style={{ color: 'var(--accent-lime)', fontWeight: 800 }}>
                              {formatIDR(p.price)}
                            </div>
                            {p.original_price && p.original_price > p.price && (
                              <div className="original-price-text" style={{ fontSize: '10px' }}>
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

                      {/* Stok Box */}
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
                            title="Adu di Arena aduhp.com"
                          >
                            ⚔️
                          </a>
                          <Link
                            href={`/products/${p.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit Data"
                          >
                            <Edit3 size={12} />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn btn-danger btn-sm"
                            title="Hapus Produk"
                          >
                            <Trash2 size={12} />
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
    </div>
  );
}
