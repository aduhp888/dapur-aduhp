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
  Activity
} from 'lucide-react';
import { supabase, SEED_PRODUCTS, PRICE_TIERS } from '@/lib/supabase';
import { formatIDR } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all'); // 'all' | 'baru' | 'second'
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

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

      if (error || !data || data.length === 0) {
        let fallback = [...SEED_PRODUCTS];
        if (selectedCondition !== 'all') {
          fallback = fallback.filter(p => p.condition === selectedCondition);
        }
        if (selectedTier !== 'all') {
          fallback = fallback.filter(p => p.price_tier === selectedTier);
        }
        if (selectedBrand !== 'all') {
          fallback = fallback.filter(p => p.brand.toLowerCase() === selectedBrand.toLowerCase());
        }
        setProducts(fallback);
      } else {
        setProducts(data);
      }
    } catch (err) {
      setProducts(SEED_PRODUCTS);
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

  const displayedProducts = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.specs?.chipset?.toLowerCase().includes(q) ||
      p.imei?.toLowerCase().includes(q)
    );
  });

  const BRANDS = ['all', 'Samsung', 'Apple', 'OPPO', 'Xiaomi', 'POCO', 'Vivo', 'Realme', 'Infinix', 'iQOO', 'Tecno', 'itel', 'Asus', 'Google'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Katalog Smartphone & Benchmark Lab
          </h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
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
          
          {/* Condition Filter Tabs: Semua / HP Baru / HP Second */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCondition('all')}
              className={`btn btn-sm ${selectedCondition === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px' }}
            >
              Semua Katalog ({products.length})
            </button>
            <button
              onClick={() => setSelectedCondition('baru')}
              className={`btn btn-sm ${selectedCondition === 'baru' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px' }}
            >
              📱 100% Baru BNIB
            </button>
            <button
              onClick={() => setSelectedCondition('second')}
              className={`btn btn-sm ${selectedCondition === 'second' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '8px',
                borderColor: selectedCondition === 'second' ? '#00E5FF' : undefined,
                color: selectedCondition === 'second' ? '#00E5FF' : undefined
              }}
            >
              🔄 HP Second Lolos QC (5 Foto Terkompresi)
            </button>
          </div>

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
            <div style={{ color: '#fff', fontWeight: 600 }}>Tidak ada HP yang cocok</div>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
              Coba ubah kata kunci pencarian atau filter tier harga yang dipilih.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Foto</th>
                  <th>Nama HP & Chipset</th>
                  <th>Kategori Harga</th>
                  <th>Skor AnTuTu v10</th>
                  <th>Gaming FPS</th>
                  <th>IMEI & Garansi</th>
                  <th>Harga (IDR)</th>
                  <th>Stok</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
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
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '13.5px' }}>
                            {p.name}
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

                      <td>
                        <span className={`badge ${tierClass}`} style={{ fontWeight: 800 }}>
                          {tierLabel}
                        </span>
                      </td>

                      <td>
                        {p.antutu?.total ? (
                          <div className="badge-antutu">
                            <Flame size={12} />
                            <span>{p.antutu.total.toLocaleString('id-ID')}</span>
                          </div>
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
                          <span style={{ color: '#34d399', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={11} /> {p.official_distributor || 'Resmi'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="price-text" style={{ color: 'var(--accent-lime)', fontWeight: 800 }}>
                          {formatIDR(p.price)}
                        </div>
                        {p.original_price && p.original_price > p.price && (
                          <div className="original-price-text" style={{ fontSize: '10px' }}>
                            {formatIDR(p.original_price)}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="badge badge-stock">
                          {p.stock || 10} Box
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
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
        )}
      </div>
    </div>
  );
}
