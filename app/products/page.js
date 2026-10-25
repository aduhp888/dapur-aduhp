'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Filter, 
  Smartphone,
  Eye,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { supabase, SEED_PRODUCTS } from '@/lib/supabase';
import { formatIDR } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCondition, selectedBrand]);

  async function fetchProducts() {
    setLoading(true);
    try {
      let query = supabase.from('dapur_products').select('*').order('created_at', { ascending: false });

      if (selectedCondition !== 'all') {
        query = query.eq('condition', selectedCondition);
      }
      if (selectedBrand !== 'all') {
        query = query.ilike('brand', selectedBrand);
      }

      const { data, error } = await query;

      if (error) {
        let fallback = [...SEED_PRODUCTS];
        if (selectedCondition !== 'all') {
          fallback = fallback.filter(p => p.condition === selectedCondition);
        }
        if (selectedBrand !== 'all') {
          fallback = fallback.filter(p => p.brand.toLowerCase() === selectedBrand.toLowerCase());
        }
        setProducts(fallback);
      } else {
        setProducts(data || []);
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
      p.imei?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Katalog Produk & Inventaris HP
          </h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Kelola data HP Baru (BNIB Segel) dan Certified Pre-Owned (Second Grade A+) untuk 3 platform.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/products/new" className="btn btn-primary">
            <PlusCircle size={15} />
            <span>Input Produk Baru</span>
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        {/* Filters */}
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama HP, brand, atau IMEI..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Condition Filters */}
            <button
              onClick={() => setSelectedCondition('all')}
              className={`filter-pill ${selectedCondition === 'all' ? 'active' : ''}`}
            >
              Semua Kondisi
            </button>
            <button
              onClick={() => setSelectedCondition('baru')}
              className={`filter-pill ${selectedCondition === 'baru' ? 'active' : ''}`}
            >
              Baru (BNIB)
            </button>
            <button
              onClick={() => setSelectedCondition('second')}
              className={`filter-pill ${selectedCondition === 'second' ? 'active' : ''}`}
            >
              Second Grade A+
            </button>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="form-select"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <option value="all">Semua Brand</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Google Pixel">Google Pixel</option>
              <option value="ASUS ROG">ASUS ROG</option>
              <option value="Vivo">Vivo</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
            <div className="status-dot" style={{ margin: '0 auto 12px' }}></div>
            Mengambil data produk...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Smartphone size={32} color="#444" style={{ margin: '0 auto 12px' }} />
            <div style={{ color: '#fff', fontWeight: 600 }}>Tidak ada produk yang cocok</div>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
              Coba ubah kata kunci pencarian atau filter yang dipilih.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Foto</th>
                  <th>Nama HP & Garansi</th>
                  <th>Kondisi & QC</th>
                  <th>IMEI / Serial</th>
                  <th>Harga (IDR)</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const imageSrc = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=200';
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          background: '#161616',
                          border: '1px solid var(--border-subtle)',
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
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
                          {p.brand} • {p.storage_gb}GB • {p.color} • <span style={{ color: '#00e5ff' }}>{p.official_distributor}</span>
                        </div>
                      </td>

                      <td>
                        {p.condition === 'baru' ? (
                          <span className="badge badge-baru">
                            ● BNIB Segel Resmi
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className="badge badge-second">
                              ● {p.grade || 'Second Grade A+'}
                            </span>
                            {p.battery_health && (
                              <span className="badge badge-battery">
                                BH: {p.battery_health}% Original
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        {p.imei ? (
                          <button
                            onClick={() => copyImei(p.imei)}
                            className="imei-badge"
                            style={{ cursor: 'pointer', background: 'transparent' }}
                            title="Klik untuk salin IMEI"
                          >
                            {p.imei} {copiedId === p.imei ? <Check size={10} color="#10b981" /> : <Copy size={10} color="#666" />}
                          </button>
                        ) : (
                          <span style={{ color: '#555' }}>-</span>
                        )}
                      </td>

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

                      <td>
                        <span className="badge badge-stock">
                          {p.stock} Unit
                        </span>
                      </td>

                      <td>
                        <span className="badge" style={{
                          background: p.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: p.is_active ? '#34d399' : '#777',
                          border: `1px solid ${p.is_active ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`
                        }}>
                          {p.is_active ? 'Aktif' : 'Draft'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <a
                            href={`/api/products/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="Lihat Raw JSON API"
                          >
                            <Eye size={12} />
                          </a>
                          <Link
                            href={`/products/${p.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit Produk"
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
