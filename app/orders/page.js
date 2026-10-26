'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Eye, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  RefreshCw,
  Phone,
  MapPin,
  Package,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatIDR } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      let query = supabase
        .from('dapur_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }

      const { data, error } = await query;
      if (data && data.length > 0) {
        setOrders(data);
      } else {
        // Fallback demo orders for testing
        setOrders([
          {
            id: 'ord-demo-1',
            order_number: 'ADU-20261027-4821',
            customer_name: 'Budi Santoso',
            customer_phone: '081234567890',
            product_name: 'POCO F6 5G (Flagship Killer)',
            variant_ram: 12,
            variant_storage: 512,
            variant_color: 'Titanium Black',
            product_condition: 'baru',
            unit_price: 5499000,
            shipping_cost: 18000,
            insurance_cost: 16000,
            unique_code: 0,
            total_amount: 5533000,
            courier_code: 'jne',
            courier_service: 'YES',
            shipping_province: 'DKI Jakarta',
            shipping_city: 'Jakarta Selatan',
            shipping_address: 'Jl. TB Simatupang No. 88, Cilandak',
            payment_status: 'menunggu_verifikasi',
            bank_name: 'BCA (Bank Central Asia)',
            bank_account_name: 'PT ADU HP INDONESIA',
            bank_account_number: '8830 9291 88',
            tracking_number: '',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    setUpdatingId(orderId);
    try {
      await supabase
        .from('dapur_orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, payment_status: newStatus }));
      }
    } catch (err) {
      console.warn('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateTrackingNumber(orderId, trackingNumber) {
    try {
      await supabase
        .from('dapur_orders')
        .update({ tracking_number: trackingNumber, payment_status: 'dikirim' })
        .eq('id', orderId);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_number: trackingNumber, payment_status: 'dikirim' } : o));
      alert('Nomor resi berhasil diupdate!');
    } catch (err) {
      console.warn('Resi error:', err);
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchSearch = !search || 
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.product_name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
              Pesanan Masuk (aduhp.com)
            </h1>
            <span style={{ background: 'rgba(198, 255, 0, 0.15)', color: 'var(--accent-lime)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
              REKENING PT
            </span>
          </div>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Kelola transaksi masuk dari storefront aduhp.com, verifikasi mutasi rekening PT, dan update resi ekspedisi.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <RefreshCw size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 2. Filters & Search */}
      <div style={{
        background: '#121216',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
          <input
            type="text"
            placeholder="Cari No. Invoice, Nama Pembeli, No. WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'menunggu_verifikasi', label: 'Perlu Verifikasi Transfer' },
            { id: 'pembayaran_diverifikasi', label: 'Siap Packing' },
            { id: 'dikirim', label: 'Dalam Pengiriman' },
            { id: 'menunggu_pembayaran', label: 'Belum Bayar' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: statusFilter === tab.id ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.04)',
                color: statusFilter === tab.id ? '#000' : '#aaa',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Orders Table */}
      <div style={{
        background: '#121216',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
            Memuat daftar pesanan...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#777' }}>
            Tidak ada pesanan yang sesuai filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)', color: '#888' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>No. Invoice & Tanggal</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>Pembeli & Kontak</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>Unit HP & Varian</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>Total Transfer PT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>Status Pembayaran</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const isVerified = order.payment_status === 'pembayaran_diverifikasi' || order.payment_status === 'dikemas' || order.payment_status === 'dikirim';
                  const isWaitingProof = order.payment_status === 'menunggu_verifikasi';
                  
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                          {order.order_number}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          {new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>
                          {order.customer_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="var(--accent-lime)" />
                          <span>{order.customer_phone}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          {order.shipping_city}, {order.shipping_province}
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#eee' }}>
                          {order.product_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--accent-lime)', marginTop: '2px' }}>
                          {order.variant_ram || 8}GB / {order.variant_storage || 256}GB • {order.variant_color || 'Black'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>
                          Kurir: {order.courier_code?.toUpperCase()} ({order.courier_service}) + Asuransi
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                          {formatIDR(order.total_amount)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#888' }}>
                          Ke: {order.bank_name || 'BCA PT ADU HP'}
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '100px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isVerified ? 'rgba(52, 199, 89, 0.15)' : isWaitingProof ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isVerified ? '#34C759' : isWaitingProof ? '#FFB300' : '#888',
                          border: isVerified ? '1px solid rgba(52, 199, 89, 0.3)' : isWaitingProof ? '1px solid rgba(255, 179, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span>●</span>
                          <span>
                            {order.payment_status === 'menunggu_pembayaran' && 'Menunggu Bayar'}
                            {order.payment_status === 'menunggu_verifikasi' && 'Bukti Masuk (Verifikasi)'}
                            {order.payment_status === 'pembayaran_diverifikasi' && 'Lunas (Siap Packing)'}
                            {order.payment_status === 'dikemas' && 'Sedang Dikemas Kayu'}
                            {order.payment_status === 'dikirim' && 'Sudah Dikirim'}
                          </span>
                        </span>
                      </td>

                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            background: 'rgba(198, 255, 0, 0.1)',
                            border: '1px solid rgba(198, 255, 0, 0.3)',
                            color: 'var(--accent-lime)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={13} />
                          <span>Rincian & Aksi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Order Detail & Verification Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#16161e',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>
                  Invoice {selectedOrder.order_number}
                </h3>
                <span style={{ fontSize: '12px', color: '#888' }}>
                  Verifikasi Pembayaran Rekening PT
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#101014', padding: '16px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ color: '#aaa' }}>Tujuan Transfer PT:</div>
              <div style={{ fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                {selectedOrder.bank_name} a.n. {selectedOrder.bank_account_name || 'PT ADU HP INDONESIA'}
              </div>
              <div style={{ color: 'var(--accent-lime)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '16px', marginTop: '4px' }}>
                Total: {formatIDR(selectedOrder.total_amount)}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '8px', fontWeight: 700 }}>
                Ubah Status Transaksi:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'pembayaran_diverifikasi')}
                  style={{
                    background: '#34C759',
                    color: '#000',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Verifikasi Lunas
                </button>

                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'dikemas')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: '1px solid #444',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  📦 Sedang Dikemas Kayu
                </button>

                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'dikirim')}
                  style={{
                    background: 'var(--accent-lime)',
                    color: '#000',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Tandai Sudah Dikirim
                </button>
              </div>
            </div>

            {/* Input Resi */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 700 }}>
                Input No. Resi Pelacakan ({selectedOrder.courier_code?.toUpperCase()}):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Contoh: JNE01928100291"
                  defaultValue={selectedOrder.tracking_number || ''}
                  id="modal-tracking-input"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#101014',
                    border: '1px solid #333',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
                <button
                  onClick={() => {
                    const val = document.getElementById('modal-tracking-input')?.value;
                    if (val) updateTrackingNumber(selectedOrder.id, val);
                  }}
                  style={{
                    background: 'var(--accent-lime)',
                    color: '#000',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Simpan Resi
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none',
                  border: '1px solid #444',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
