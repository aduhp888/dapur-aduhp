'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Save, 
  Smartphone,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { supabase, SEED_PRODUCTS, STANDARD_CHECKLIST_ITEMS } from '@/lib/supabase';

export default function ChecklistPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadChecklistForProduct(selectedProductId);
    }
  }, [selectedProductId]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dapur_products')
        .select('id, name, brand, condition, grade, imei')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setProducts(SEED_PRODUCTS);
        if (SEED_PRODUCTS.length > 0) {
          setSelectedProductId(SEED_PRODUCTS[2].id); // Default to second hand iPhone 13 Pro
        }
      } else {
        setProducts(data);
        if (data.length > 0) {
          const secondHand = data.find(p => p.condition === 'second') || data[0];
          setSelectedProductId(secondHand.id);
        }
      }
    } catch (err) {
      setProducts(SEED_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  async function loadChecklistForProduct(productId) {
    try {
      const { data, error } = await supabase
        .from('dapur_checklist')
        .select('*')
        .eq('product_id', productId);

      if (!error && data && data.length > 0) {
        setChecklist(data);
      } else {
        // Initialize with default standard checklist items
        const defaultItems = STANDARD_CHECKLIST_ITEMS.map((item, idx) => ({
          product_id: productId,
          category: item.category,
          item_name: item.item_name,
          status: 'passed',
          notes: 'Normal teruji fungsi teknisi',
          checked_by: 'Teknisi aduHP',
        }));
        setChecklist(defaultItems);
      }
    } catch (err) {
      console.warn('Checklist fetch error:', err);
    }
  }

  function handleStatusChange(index, newStatus) {
    setChecklist(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: newStatus };
      return updated;
    });
  }

  function handleNotesChange(index, newNotes) {
    setChecklist(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], notes: newNotes };
      return updated;
    });
  }

  function passAllItems() {
    setChecklist(prev => prev.map(item => ({ ...item, status: 'passed' })));
  }

  async function saveChecklist() {
    if (!selectedProductId) return;
    setSaving(true);

    try {
      // 1. Delete previous records for this product
      await supabase.from('dapur_checklist').delete().eq('product_id', selectedProductId);

      // 2. Insert new records
      const { error } = await supabase.from('dapur_checklist').insert(checklist);

      if (error) {
        alert('Info: ' + error.message + ' (Pastikan tabel dapur_checklist sudah dibuat di Supabase)');
      } else {
        alert('Berhasil menyimpan 35 Titik Inspeksi QC untuk perangkat ini!');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const passedCount = checklist.filter(c => c.status === 'passed').length;
  const warningCount = checklist.filter(c => c.status === 'warning').length;
  const failedCount = checklist.filter(c => c.status === 'failed').length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="#10b981" />
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              35 Titik Inspeksi QC Handphone
            </h1>
          </div>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Tabel <code>dapur_checklist</code>: Menjamin unit second lolos uji fungsi hardware & software sebelum dijual.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={passAllItems} className="btn btn-secondary btn-sm">
            <Sparkles size={14} color="#00e5ff" />
            <span>Set Semua Passed</span>
          </button>
          <button onClick={saveChecklist} disabled={saving} className="btn btn-primary btn-sm">
            <Save size={14} />
            <span>{saving ? 'Menyimpan...' : 'Simpan Checklist'}</span>
          </button>
        </div>
      </div>

      {/* Select Phone Selector */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 24px' }}>
        <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
          Pilih Perangkat untuk Diinspeksi
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="form-select"
          style={{ width: '100%', fontSize: '14px', fontWeight: 600 }}
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} [{p.condition === 'baru' ? 'BNIB Segel' : p.grade || 'Second'}] — IMEI: {p.imei || 'Tanpa IMEI'}
            </option>
          ))}
        </select>

        {selectedProduct && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-stock">
              Brand: {selectedProduct.brand}
            </span>
            <span className={`badge ${selectedProduct.condition === 'baru' ? 'badge-baru' : 'badge-second'}`}>
              ● {selectedProduct.condition === 'baru' ? 'BNIB Segel Resmi' : (selectedProduct.grade || 'Second Hand')}
            </span>
            {selectedProduct.imei && (
              <span className="imei-badge">
                IMEI: {selectedProduct.imei}
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '12.5px' }}>
              <span style={{ color: '#10b981' }}>● Passed: <strong>{passedCount}</strong></span>
              <span style={{ color: '#f59e0b' }}>● Warning: <strong>{warningCount}</strong></span>
              <span style={{ color: '#f43f5e' }}>● Failed: <strong>{failedCount}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Kategori</th>
              <th>Komponen / Fungsi Yang Diuji</th>
              <th style={{ width: '220px' }}>Hasil Uji QC</th>
              <th>Catatan Teknisi</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>
                    {item.category}
                  </span>
                </td>

                <td>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '13.5px' }}>
                    {item.item_name}
                  </div>
                </td>

                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, 'passed')}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: item.status === 'passed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: item.status === 'passed' ? '#6ee7b7' : '#777',
                        border: `1px solid ${item.status === 'passed' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <CheckCircle2 size={12} /> Passed
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, 'warning')}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: item.status === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: item.status === 'warning' ? '#fcd34d' : '#777',
                        border: `1px solid ${item.status === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <AlertTriangle size={12} /> Warning
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, 'failed')}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: item.status === 'failed' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: item.status === 'failed' ? '#fda4af' : '#777',
                        border: `1px solid ${item.status === 'failed' ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <XCircle size={12} /> Failed
                    </button>
                  </div>
                </td>

                <td>
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => handleNotesChange(idx, e.target.value)}
                    placeholder="Catatan inspeksi..."
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
