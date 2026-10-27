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
  AlertCircle,
  AlertTriangle,
  Ban,
  Check,
  Sparkles
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
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);

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
            bank_account_name: 'PT. SECOND CIRCLE TEKNOLOGI',
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

  async function updateOrderStatus(orderId, newStatus, reason = null) {
    setUpdatingId(orderId);
    try {
      const updatePayload = { payment_status: newStatus };
      if (reason) {
        updatePayload.notes = reason;
      }

      await supabase
        .from('dapur_orders')
        .update(updatePayload)
        .eq('id', orderId);

      // If order is cancelled and not previously cancelled, attempt stock restore in dapur_products
      if (newStatus === 'dibatalkan' && selectedOrder && selectedOrder.payment_status !== 'dibatalkan' && selectedOrder.product_id) {
        try {
          const { data: prodData } = await supabase
            .from('dapur_products')
            .select('stock, variants_json')
            .eq('id', selectedOrder.product_id)
            .single();

          if (prodData) {
            const qtyToRestore = selectedOrder.quantity || 1;
            const updatedStock = (prodData.stock || 0) + qtyToRestore;
            let updatedVariantsJson = prodData.variants_json;

            if (Array.isArray(updatedVariantsJson) && selectedOrder.variant_ram) {
              updatedVariantsJson = updatedVariantsJson.map(v => {
                if (v.ram === selectedOrder.variant_ram && v.storage === selectedOrder.variant_storage) {
                  const newVariantStock = (v.stock || 0) + qtyToRestore;
                  let newColorStocks = { ...(v.color_stocks || {}) };
                  if (selectedOrder.variant_color && newColorStocks[selectedOrder.variant_color] !== undefined) {
                    newColorStocks[selectedOrder.variant_color] = (newColorStocks[selectedOrder.variant_color] || 0) + qtyToRestore;
                  }
                  return { ...v, stock: newVariantStock, color_stocks: newColorStocks };
                }
                return v;
              });
            }

            await supabase
              .from('dapur_products')
              .update({ stock: updatedStock, variants_json: updatedVariantsJson })
              .eq('id', selectedOrder.product_id);
          }
        } catch (stockErr) {
          console.warn('Stock restore warning:', stockErr);
        }
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus, notes: reason || o.notes } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, payment_status: newStatus, notes: reason || prev.notes }));
      }

      const statusLabels = {
        'pembayaran_diverifikasi': '✓ Pembayaran Lunas (Diverifikasi)',
        'dikemas': '📦 Sedang Dikemas Kayu Logistik',
        'dikirim': '🚀 Pesanan Sudah Dikirim',
        'dibatalkan': reason ? `🚫 ${reason}` : '🚫 Pesanan Dibatalkan'
      };

      setStatusFeedback({
        message: `Status berhasil diubah: ${statusLabels[newStatus] || newStatus}`,
        type: newStatus === 'dibatalkan' ? 'warning' : 'success'
      });

      setTimeout(() => {
        setStatusFeedback(null);
      }, 5000);
    } catch (err) {
      console.warn('Error updating status:', err);
      alert('Gagal update status: ' + (err.message || 'Error'));
    } finally {
      setUpdatingId(null);
      setConfirmCancel(null);
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
            { id: 'menunggu_verifikasi', label: 'Perlu Verifikasi' },
            { id: 'pembayaran_diverifikasi', label: 'Siap Packing' },
            { id: 'dikemas', label: 'Sedang Dikemas' },
            { id: 'dikirim', label: 'Dalam Pengiriman' },
            { id: 'menunggu_pembayaran', label: 'Belum Bayar' },
            { id: 'dibatalkan', label: 'Dibatalkan / Kadaluarsa' }
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
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
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
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
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
                        <div style={{ fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                          {formatIDR(order.total_amount)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#888' }}>
                          Ke: {order.bank_name || 'BCA PT. SECOND CIRCLE TEKNOLOGI'}
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
                          background: isVerified ? 'rgba(52, 199, 89, 0.15)' : 
                                      order.payment_status === 'dikemas' ? 'rgba(179, 136, 255, 0.15)' : 
                                      order.payment_status === 'dikirim' ? 'rgba(198, 255, 0, 0.15)' : 
                                      order.payment_status === 'dibatalkan' ? 'rgba(255, 69, 58, 0.15)' : 
                                      isWaitingProof ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isVerified ? '#34C759' : 
                                 order.payment_status === 'dikemas' ? '#B388FF' : 
                                 order.payment_status === 'dikirim' ? 'var(--accent-lime)' : 
                                 order.payment_status === 'dibatalkan' ? '#FF453A' : 
                                 isWaitingProof ? '#FFB300' : '#888',
                          border: isVerified ? '1px solid rgba(52, 199, 89, 0.3)' : 
                                  order.payment_status === 'dikemas' ? '1px solid rgba(179, 136, 255, 0.3)' : 
                                  order.payment_status === 'dikirim' ? '1px solid rgba(198, 255, 0, 0.3)' : 
                                  order.payment_status === 'dibatalkan' ? '1px solid rgba(255, 69, 58, 0.3)' : 
                                  isWaitingProof ? '1px solid rgba(255, 179, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span>●</span>
                          <span>
                            {order.payment_status === 'menunggu_pembayaran' && 'Menunggu Bayar'}
                            {order.payment_status === 'menunggu_verifikasi' && 'Bukti Masuk (Verifikasi)'}
                            {order.payment_status === 'pembayaran_diverifikasi' && 'Lunas (Siap Packing)'}
                            {order.payment_status === 'dikemas' && 'Sedang Dikemas Kayu'}
                            {order.payment_status === 'dikirim' && 'Sudah Dikirim'}
                            {order.payment_status === 'dibatalkan' && (order.notes?.includes('30 Menit') ? '⏰ Kadaluarsa 30m' : '🚫 Dibatalkan')}
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
                {selectedOrder.bank_name} a.n. {selectedOrder.bank_account_name || 'PT. SECOND CIRCLE TEKNOLOGI'}
              </div>
              <div style={{ color: 'var(--accent-lime)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '16px', marginTop: '4px' }}>
                Total: {formatIDR(selectedOrder.total_amount)}
              </div>
            </div>

            {/* Feedback Alert Banner */}
            {statusFeedback && (
              <div style={{
                background: statusFeedback.type === 'warning' ? 'rgba(255, 69, 58, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                border: `1.5px solid ${statusFeedback.type === 'warning' ? 'rgba(255, 69, 58, 0.45)' : 'rgba(52, 199, 89, 0.45)'}`,
                color: statusFeedback.type === 'warning' ? '#FF6B6B' : '#34C759',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'orderSuccessSlideDown 0.3s ease',
                fontSize: '12.5px',
                fontWeight: 800
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} />
                  <span>{statusFeedback.message}</span>
                </div>
                <button
                  onClick={() => setStatusFeedback(null)}
                  style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Stepper Progress / Cancelled State */}
            {selectedOrder.payment_status === 'dibatalkan' ? (
              <div style={{
                background: 'rgba(255, 69, 58, 0.12)',
                border: '1px solid rgba(255, 69, 58, 0.35)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'orderSuccessSlideDown 0.3s ease'
              }}>
                <AlertTriangle size={24} color="#FF453A" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FF453A' }}>
                    STATUS: PESANAN DIBATALKAN
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc', marginTop: '2px' }}>
                    Keterangan: {selectedOrder.notes || 'Dibatalkan oleh Pengguna / Batas Waktu Habis'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#0c0c10',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  {[
                    { label: 'Menunggu', icon: Clock, active: selectedOrder.payment_status === 'menunggu_verifikasi' || selectedOrder.payment_status === 'menunggu_pembayaran', done: selectedOrder.payment_status === 'pembayaran_diverifikasi' || selectedOrder.payment_status === 'dikemas' || selectedOrder.payment_status === 'dikirim' },
                    { label: 'Verifikasi Lunas', icon: CheckCircle2, active: selectedOrder.payment_status === 'pembayaran_diverifikasi', done: selectedOrder.payment_status === 'dikemas' || selectedOrder.payment_status === 'dikirim' },
                    { label: 'Dikemas Kayu', icon: Package, active: selectedOrder.payment_status === 'dikemas', done: selectedOrder.payment_status === 'dikirim' },
                    { label: 'Sudah Dikirim', icon: Truck, active: selectedOrder.payment_status === 'dikirim', done: false }
                  ].map((step, idx) => {
                    const IconComp = step.icon;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: step.active 
                            ? (idx === 1 ? '#34C759' : idx === 2 ? '#B388FF' : idx === 3 ? 'var(--accent-lime)' : '#FFB300')
                            : step.done 
                              ? '#34C759' 
                              : '#1c1c24',
                          color: step.active 
                            ? (idx === 2 ? '#fff' : '#000') 
                            : step.done 
                              ? '#000' 
                              : '#666',
                          border: step.active ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: step.active ? '0 0 14px rgba(255, 255, 255, 0.4)' : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          <IconComp size={15} />
                        </div>
                        <span style={{
                          fontSize: '10.5px',
                          marginTop: '6px',
                          fontWeight: step.active ? 800 : 600,
                          color: step.active ? '#fff' : step.done ? '#34C759' : '#777',
                          textAlign: 'center'
                        }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '8px', fontWeight: 700 }}>
                Ubah Status Transaksi (Jalur Pemrosesan):
              </label>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* 1. Verifikasi Lunas */}
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'pembayaran_diverifikasi')}
                  className={selectedOrder.payment_status === 'pembayaran_diverifikasi' ? 'order-btn-active-green' : ''}
                  disabled={updatingId === selectedOrder.id}
                  style={{
                    position: 'relative',
                    background: selectedOrder.payment_status === 'pembayaran_diverifikasi' 
                      ? 'linear-gradient(135deg, #34C759 0%, #28a745 100%)' 
                      : 'rgba(52, 199, 89, 0.12)',
                    color: selectedOrder.payment_status === 'pembayaran_diverifikasi' ? '#000000' : '#34C759',
                    border: selectedOrder.payment_status === 'pembayaran_diverifikasi' 
                      ? '2px solid #ffffff' 
                      : '1.5px solid rgba(52, 199, 89, 0.45)',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: updatingId === selectedOrder.id ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: selectedOrder.payment_status === 'pembayaran_diverifikasi' 
                      ? '0 0 18px rgba(52, 199, 89, 0.55)' 
                      : 'none',
                    transform: selectedOrder.payment_status === 'pembayaran_diverifikasi' ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  title="Verifikasi dana pembayaran resmi telah masuk rekening PT"
                >
                  <span>✓ Verifikasi Lunas</span>
                  {selectedOrder.payment_status === 'pembayaran_diverifikasi' && (
                    <span style={{ fontSize: '9px', background: '#000', color: '#34C759', padding: '1px 5px', borderRadius: '100px', fontWeight: 900 }}>
                      ● AKTIF
                    </span>
                  )}
                </button>

                {/* 2. Sedang Dikemas Kayu */}
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'dikemas')}
                  className={selectedOrder.payment_status === 'dikemas' ? 'order-btn-active-purple' : ''}
                  disabled={updatingId === selectedOrder.id}
                  style={{
                    position: 'relative',
                    background: selectedOrder.payment_status === 'dikemas' 
                      ? 'linear-gradient(135deg, #B388FF 0%, #7C4DFF 100%)' 
                      : 'rgba(179, 136, 255, 0.12)',
                    color: selectedOrder.payment_status === 'dikemas' ? '#ffffff' : '#B388FF',
                    border: selectedOrder.payment_status === 'dikemas' 
                      ? '2px solid #ffffff' 
                      : '1.5px solid rgba(179, 136, 255, 0.45)',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: updatingId === selectedOrder.id ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: selectedOrder.payment_status === 'dikemas' 
                      ? '0 0 18px rgba(179, 136, 255, 0.55)' 
                      : 'none',
                    transform: selectedOrder.payment_status === 'dikemas' ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  title="Tandai unit sedang dipacking kayu dan bubble wrap di gudang"
                >
                  <span>📦 Sedang Dikemas Kayu</span>
                  {selectedOrder.payment_status === 'dikemas' && (
                    <span style={{ fontSize: '9px', background: '#000', color: '#B388FF', padding: '1px 5px', borderRadius: '100px', fontWeight: 900 }}>
                      ● AKTIF
                    </span>
                  )}
                </button>

                {/* 3. Tandai Sudah Dikirim */}
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'dikirim')}
                  className={selectedOrder.payment_status === 'dikirim' ? 'order-btn-active-lime' : ''}
                  disabled={updatingId === selectedOrder.id}
                  style={{
                    position: 'relative',
                    background: selectedOrder.payment_status === 'dikirim' 
                      ? 'linear-gradient(135deg, #C6FF00 0%, #AEEA00 100%)' 
                      : 'rgba(198, 255, 0, 0.12)',
                    color: selectedOrder.payment_status === 'dikirim' ? '#000000' : 'var(--accent-lime)',
                    border: selectedOrder.payment_status === 'dikirim' 
                      ? '2px solid #ffffff' 
                      : '1.5px solid rgba(198, 255, 0, 0.45)',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: updatingId === selectedOrder.id ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: selectedOrder.payment_status === 'dikirim' 
                      ? '0 0 20px rgba(198, 255, 0, 0.65)' 
                      : 'none',
                    transform: selectedOrder.payment_status === 'dikirim' ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  title="Tandai paket telah diserahkan ke kurir ekspedisi"
                >
                  <span>🚀 Tandai Sudah Dikirim</span>
                  {selectedOrder.payment_status === 'dikirim' && (
                    <span style={{ fontSize: '9px', background: '#000', color: '#C6FF00', padding: '1px 5px', borderRadius: '100px', fontWeight: 900 }}>
                      ● AKTIF
                    </span>
                  )}
                </button>
              </div>

              {/* Sub-Section: Pembatalan & Timeout 30 Menit */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#FF6B6B', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚠️ Pembatalan & Batas Waktu Transaksi:
                </label>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Tombol Cancel: Dibatalkan Pengguna */}
                  <button
                    type="button"
                    onClick={() => setConfirmCancel({ reason: 'Dibatalkan oleh Pengguna (Permintaan Pembeli)', type: 'user_cancel' })}
                    className={selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('Pengguna') ? 'order-btn-active-red' : ''}
                    disabled={updatingId === selectedOrder.id}
                    style={{
                      background: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('Pengguna') 
                        ? '#FF453A' 
                        : 'rgba(255, 69, 58, 0.1)',
                      color: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('Pengguna') 
                        ? '#ffffff' 
                        : '#FF6B6B',
                      border: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('Pengguna') 
                        ? '2px solid #ffffff' 
                        : '1.5px solid rgba(255, 69, 58, 0.35)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('Pengguna') 
                        ? '0 0 16px rgba(255, 69, 58, 0.5)' 
                        : 'none'
                    }}
                    title="Batalkan pesanan berdasarkan permintaan pembeli/pengguna"
                  >
                    <Ban size={13} />
                    <span>Dibatalkan Pengguna</span>
                    {selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('Pengguna') && (
                      <span style={{ fontSize: '9px', background: '#000', color: '#FF453A', padding: '1px 5px', borderRadius: '100px', fontWeight: 900 }}>
                        AKTIF
                      </span>
                    )}
                  </button>

                  {/* Tombol Cancel: Waktu 30 Menit Habis (Kadaluarsa) */}
                  <button
                    type="button"
                    onClick={() => setConfirmCancel({ reason: 'Kadaluarsa: Batas Waktu Pembayaran 30 Menit Telah Habis', type: 'timeout_30m' })}
                    className={selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('30 Menit') ? 'order-btn-active-amber' : ''}
                    disabled={updatingId === selectedOrder.id}
                    style={{
                      background: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('30 Menit') 
                        ? '#FF9F0A' 
                        : 'rgba(255, 159, 10, 0.1)',
                      color: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('30 Menit') 
                        ? '#000000' 
                        : '#FFA726',
                      border: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('30 Menit') 
                        ? '2px solid #ffffff' 
                        : '1.5px solid rgba(255, 159, 10, 0.35)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('30 Menit') 
                        ? '0 0 16px rgba(255, 159, 10, 0.5)' 
                        : 'none'
                    }}
                    title="Batalkan pesanan karena batas waktu pembayaran 30 menit telah berakhir"
                  >
                    <Clock size={13} />
                    <span>Waktu 30 Menit Habis</span>
                    {selectedOrder.payment_status === 'dibatalkan' && selectedOrder.notes?.includes('30 Menit') && (
                      <span style={{ fontSize: '9px', background: '#000', color: '#FFA726', padding: '1px 5px', borderRadius: '100px', fontWeight: 900 }}>
                        AKTIF
                      </span>
                    )}
                  </button>
                </div>

                {/* Konfirmasi Pembatalan Interaktif */}
                {confirmCancel && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    background: 'rgba(255, 69, 58, 0.14)',
                    border: '1.5px solid rgba(255, 69, 58, 0.5)',
                    borderRadius: '10px',
                    animation: 'orderSuccessSlideDown 0.25s ease'
                  }}>
                    <div style={{ fontSize: '12.5px', color: '#fff', fontWeight: 700, marginBottom: '4px' }}>
                      ⚠️ Konfirmasi Pembatalan Transaksi #{selectedOrder.order_number}:
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#ddd', marginBottom: '10px', lineHeight: 1.4 }}>
                      Alasan: <strong>{confirmCancel.reason}</strong>
                      <br />
                      <span style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                        ℹ️ Stok fisik unit HP akan otomatis dikembalikan ke inventaris gudang Dapur aduHP.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'dibatalkan', confirmCancel.reason)}
                        style={{
                          background: '#FF453A',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          boxShadow: '0 0 12px rgba(255, 69, 58, 0.45)'
                        }}
                      >
                        Ya, Batalkan Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(null)}
                        style={{
                          background: 'transparent',
                          color: '#aaa',
                          border: '1px solid #555',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
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
