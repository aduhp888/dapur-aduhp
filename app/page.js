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
  Edit3
} from 'lucide-react';
import { supabase, SEED_PRODUCTS } from '@/lib/supabase';
import { formatIDR } from '@/lib/utils';

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [filterCondition, setFilterCondition] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [filterCondition]);

  async function fetchProducts() {
    setLoading(true);
    try {
      let query = supabase.from('dapur_products').select('*').order('created_at', { ascending: false });

      if (filterCondition !== 'all') {
        query = query.eq('condition', filterCondition);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase fetch returned error, using fallback seed data:', error.message);
        let fallback = [...SEED_PRODUCTS];
        if (filterCondition !== 'all') {
          fallback = fallback.filter(p => p.condition === filterCondition);
        }
        setProducts(fallback);
        setIsFallback(true);
      } else {
        setProducts(data || []);
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
  const baruCount = products.filter(p => p.condition === 'baru').length;
  const secondCount = products.filter(p => p.condition === 'second').length;
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.stock || 1)), 0);

  // Search filter
  const displayedProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.imei?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Vercel-style Notification if Database Table needs migration */}
      {isFallback && (
        <div className="alert-banner">
          <div className="alert-content">
            <AlertTriangle size={18} color="#f59e0b" />
            <div>
              <strong>Mode Preview Aktif:</strong> Tabel <code>dapur_products</code> belum dibuat di Supabase Anda. Data di bawah menggunakan seed demo.
            </div>
          </div>
          <Link href="/schema-setup" className="btn btn-secondary btn-sm" style={{ background: '#000' }}>
            <Database size={13} />
            <span>Lihat Script SQL (Tinggal Copy)</span>
          </Link>
        </div>
      )}

      {/* Hero Welcome */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.8px', color: '#fff' }}>
              Dashboard Dapur aduHP
            </h1>
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
              v1.0 MVP
            </span>
          </div>
          <p style={{ color: '#888', fontSize: '13.5px', marginTop: '6px' }}>
            Satu pusat kendali untuk 3 platform: Web e-Commerce, Aplikasi Android, dan iPhone iOS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/api/products"
            target="_blank"
            className="btn btn-secondary btn-sm"
          >
            <Code2 size={14} />
            <span>Endpoint /api/products</span>
            <ExternalLink size={12} color="#666" />
          </a>
          <Link href="/products/new" className="btn btn-primary btn-sm">
            <PlusCircle size={14} />
            <span>Tambah Handphone</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Unit Aktif</span>
            <div className="stat-icon"><Smartphone size={16} /></div>
          </div>
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-desc">
            <span style={{ color: '#60a5fa' }}>{baruCount} Baru BNIB</span>
            <span>•</span>
            <span style={{ color: '#34d399' }}>{secondCount} Second Hand</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">QC Teruji (35 Titik)</span>
            <div className="stat-icon"><ShieldCheck size={16} color="#10b981" /></div>
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {secondCount} Unit
          </div>
          <div className="stat-desc">
            Unit second lolos uji TrueTone & FaceID
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Stok Fisik Tersedia</span>
            <div className="stat-icon"><Layers size={16} /></div>
          </div>
          <div className="stat-value">{totalStock}</div>
          <div className="stat-desc">
            Siap kirim ke pembeli
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Estimasi Nilai Stok</span>
            <div className="stat-icon"><TrendingUp size={16} color="#00e5ff" /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '20px' }}>
            {formatIDR(totalInventoryValue)}
          </div>
          <div className="stat-desc">
            Perhitungan harga jual IDR
          </div>
        </div>
      </div>

      {/* Main Table: Phone Inventory */}
      <div className="table-container">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama HP, brand, atau IMEI..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <button
              onClick={() => setFilterCondition('all')}
              className={`filter-pill ${filterCondition === 'all' ? 'active' : ''}`}
            >
              Semua ({totalProducts})
            </button>
            <button
              onClick={() => setFilterCondition('baru')}
              className={`filter-pill ${filterCondition === 'baru' ? 'active' : ''}`}
            >
              Baru BNIB ({baruCount})
            </button>
            <button
              onClick={() => setFilterCondition('second')}
              className={`filter-pill ${filterCondition === 'second' ? 'active' : ''}`}
            >
              Second Grade A+ ({secondCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            <div className="status-dot" style={{ margin: '0 auto 12px' }}></div>
            Memuat katalog dari Supabase...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Smartphone size={32} color="#444" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>Belum ada produk</div>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
              Mulai dengan menginput produk pertama atau jalankan script SQL seed.
            </p>
            <Link href="/products/new" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
              <PlusCircle size={14} /> Tambah Produk Sekarang
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Foto</th>
                  <th>Produk & Spesifikasi</th>
                  <th>Kondisi & Grade</th>
                  <th>IMEI / Serial</th>
                  <th>Harga Jual (IDR)</th>
                  <th>Stok</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const imageSrc = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=200';
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

                      {/* Product Name & Specs */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#888', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{p.brand}</span>
                          <span>•</span>
                          <span>{p.storage_gb ? `${p.storage_gb}GB` : ''} {p.color ? `(${p.color})` : ''}</span>
                          <span>•</span>
                          <span style={{ color: '#aaa' }}>{p.official_distributor || 'Resmi'}</span>
                        </div>
                      </td>

                      {/* Condition & Grade */}
                      <td>
                        {p.condition === 'baru' ? (
                          <span className="badge badge-baru">
                            ● BNIB Segel Resmi
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="badge badge-second">
                              ● {p.grade || 'Second Grade A+'}
                            </span>
                            {p.battery_health && (
                              <span className="badge badge-battery">
                                BH: {p.battery_health}%
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* IMEI */}
                      <td>
                        {p.imei ? (
                          <span className="imei-badge">
                            {p.imei}
                          </span>
                        ) : (
                          <span style={{ color: '#555', fontSize: '11px' }}>-</span>
                        )}
                      </td>

                      {/* Price */}
                      <td>
                        <div className="price-text">
                          {formatIDR(p.price)}
                        </div>
                        {p.original_price && p.original_price > p.price && (
                          <div className="original-price-text">
                            {formatIDR(p.original_price)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td>
                        <span className="badge badge-stock">
                          {p.stock} Unit
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            href={`/products/${p.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit Produk"
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
            <Code2 size={18} color="#00e5ff" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              Konsumsi API di Flutter (Android & iOS)
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#888', lineHeight: '1.6', marginBottom: '12px' }}>
            Aplikasi Flutter Android & iPhone Anda dapat langsung melakukan HTTP GET ke endpoint ini untuk mendapatkan katalog terkini beserta status checklist QC:
          </p>
          <div className="code-preview-box">
            GET https://dapur.aduhp.com/api/products
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              35 Titik QC Terintegrasi
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#888', lineHeight: '1.6', marginBottom: '12px' }}>
            Setiap unit second otomatis dilengkapi hasil pengujian komponen di tabel <code>dapur_checklist</code> (TrueTone, FaceID, Battery Health, Sinyal 5G).
          </p>
          <Link href="/checklist" className="btn btn-secondary btn-sm" style={{ marginTop: '6px' }}>
            Buka Panel Inspeksi QC <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
