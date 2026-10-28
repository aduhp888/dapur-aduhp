'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Crown, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function TeamManagementPage() {
  const { user, isSuperadmin, loading: authLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Form State for new member
  const [newMember, setNewMember] = useState({
    email: '',
    full_name: '',
    role: 'admin', // 'admin' | 'superadmin'
    phone: '',
    notes: 'Staff Operasional & Penginput Spek',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSuperadmin) {
      fetchTeamMembers();
    }
  }, [isSuperadmin]);

  async function fetchTeamMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dapur_users')
        .select('*')
        .order('role', { ascending: false }) // superadmin first
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching team members:', error.message);
        // Fallback initial demo array if table is just created
        setTeamMembers([
          {
            id: 'owner-superadmin',
            email: 'admin@aduhp.com',
            full_name: 'Superadmin Owner',
            role: 'superadmin',
            status: 'aktif',
            notes: 'Pemilik Sistem & Pengelola Rekening PT',
            created_at: new Date().toISOString()
          },
          {
            id: 'co-owner-superadmin',
            email: 'disconnect.idn@gmail.com',
            full_name: 'Superadmin Co-Owner',
            role: 'superadmin',
            status: 'aktif',
            notes: 'Superadmin Sistem & Operasional aduHP',
            created_at: new Date().toISOString()
          }
        ]);
      } else if (data && data.length > 0) {
        setTeamMembers(data);
      } else {
        // Auto-seed default superadmin
        const defaultOwners = [
          {
            email: 'admin@aduhp.com',
            full_name: 'Superadmin Owner',
            role: 'superadmin',
            status: 'aktif',
            notes: 'Pemilik Sistem & Pengelola Rekening PT',
            created_at: new Date().toISOString()
          },
          {
            email: 'disconnect.idn@gmail.com',
            full_name: 'Superadmin Co-Owner',
            role: 'superadmin',
            status: 'aktif',
            notes: 'Superadmin Sistem & Operasional aduHP',
            created_at: new Date().toISOString()
          }
        ];
        setTeamMembers(defaultOwners);
        try {
          await supabase.from('dapur_users').upsert(defaultOwners, { onConflict: 'email' });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRole(member) {
    const isProtectedSuperadmin = member.email === 'admin@aduhp.com' || member.email === 'disconnect.idn@gmail.com';
    if (isProtectedSuperadmin && member.role === 'superadmin') {
      alert(`Akun Superadmin Utama (${member.email}) tidak dapat di-downgrade.`);
      return;
    }

    const nextRole = member.role === 'superadmin' ? 'admin' : 'superadmin';
    const confirmMsg = nextRole === 'superadmin'
      ? `Promosikan ${member.full_name} (${member.email}) menjadi SUPERADMIN?\nAkun ini akan mendapatkan hak akses ke database, pengaturan tim, dan penghapusan produk.`
      : `Turunkan ${member.full_name} (${member.email}) menjadi ADMIN OPERASIONAL?\nAkun ini tidak lagi bisa mengelola tim atau menghapus produk.`;

    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('dapur_users')
        .update({ role: nextRole, updated_at: new Date().toISOString() })
        .eq('id', member.id);

      if (error) throw new Error(error.message);

      setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: nextRole } : m));
      setActionFeedback(`Berhasil mengubah role ${member.full_name} menjadi ${nextRole.toUpperCase()}`);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err) {
      alert('Gagal mengubah role: ' + err.message);
    }
  }

  async function handleToggleStatus(member) {
    if (member.email === user?.email) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }

    const nextStatus = member.status === 'aktif' ? 'nonaktif' : 'aktif';
    if (!confirm(`Ubah status akun ${member.email} menjadi ${nextStatus.toUpperCase()}?`)) return;

    try {
      const { error } = await supabase
        .from('dapur_users')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', member.id);

      if (error) throw new Error(error.message);

      setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: nextStatus } : m));
      setActionFeedback(`Status akun ${member.email} berhasil diubah ke ${nextStatus}`);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  }

  async function handleDeleteMember(member) {
    if (member.email === user?.email) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    if (member.email === 'admin@aduhp.com' || member.email === 'disconnect.idn@gmail.com') {
      alert('Akun Superadmin Utama tidak dapat dihapus.');
      return;
    }

    if (!confirm(`Hapus akun staff ${member.full_name} (${member.email}) secara permanen dari daftar tim?`)) return;

    try {
      const { error } = await supabase
        .from('dapur_users')
        .delete()
        .eq('id', member.id);

      if (error) throw new Error(error.message);

      setTeamMembers(prev => prev.filter(m => m.id !== member.id));
      setActionFeedback(`Akun staff ${member.email} telah dihapus.`);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err) {
      alert('Gagal menghapus anggota tim: ' + err.message);
    }
  }

  async function handleAddMemberSubmit(e) {
    e.preventDefault();
    if (!newMember.email || !newMember.full_name) {
      alert('Nama dan Email wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: newMember.email.trim().toLowerCase(),
        full_name: newMember.full_name.trim(),
        role: newMember.role,
        status: 'aktif',
        phone: newMember.phone || null,
        notes: newMember.notes || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dapur_users')
        .insert([payload])
        .select()
        .single();

      if (error) throw new Error(error.message);

      setTeamMembers(prev => [...prev, data]);
      setShowAddModal(false);
      setNewMember({
        email: '',
        full_name: '',
        role: 'admin',
        phone: '',
        notes: 'Staff Operasional & Penginput Spek',
      });
      setActionFeedback(`Akun ${payload.full_name} (${payload.role.toUpperCase()}) berhasil ditambahkan ke tim.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      alert('Gagal mendaftarkan staff: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Fallback screen for Non-Superadmin
  if (!authLoading && !isSuperadmin) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <ShieldAlert size={32} color="#f87171" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
          Akses Dibatasi: Khusus Superadmin
        </h1>
        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Halaman Manajemen Tim hanya dapat diakses oleh akun bertingkat <strong>Superadmin</strong>. Akun Anda saat ini memiliki peran <strong>Admin Operasional</strong>.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', padding: '10px 24px' }}>
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const superadminCount = teamMembers.filter(m => m.role === 'superadmin').length;
  const adminCount = teamMembers.filter(m => m.role === 'admin').length;
  const activeCount = teamMembers.filter(m => m.status === 'aktif').length;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
              Manajemen Tim & Hak Akses
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))',
              color: '#FBBF24',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Crown size={11} />
              SUPERADMIN ONLY
            </span>
          </div>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Kelola peran tim dapur.aduhp.com: <strong>Superadmin</strong> (akses penuh & hapus) dan <strong>Admin</strong> (operasional katalog & pesanan).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchTeamMembers}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh daftar staff"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F59E0B',
              color: '#000',
              fontWeight: 800,
              border: 'none'
            }}
          >
            <UserPlus size={15} />
            <span>+ Daftarkan Staff Baru</span>
          </button>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div style={{
          background: 'rgba(52, 199, 89, 0.15)',
          border: '1px solid rgba(52, 199, 89, 0.4)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#34c759',
          fontSize: '13px',
          fontWeight: 600,
          animation: 'orderSuccessSlideDown 0.3s ease'
        }}>
          <CheckCircle2 size={16} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 2. Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Total Tim */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Anggota Tim</span>
            <Users size={16} color="var(--accent-lime)" />
          </div>
          <div className="stat-value">{teamMembers.length} Akun</div>
          <div className="stat-desc">{activeCount} berstatus aktif bekerja</div>
        </div>

        {/* Superadmin */}
        <div className="stat-card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: '#FBBF24' }}>👑 Superadmin (Owner)</span>
            <Crown size={16} color="#FBBF24" />
          </div>
          <div className="stat-value" style={{ color: '#FBBF24' }}>{superadminCount} Orang</div>
          <div className="stat-desc">Akses total, tim, rekening & hapus produk</div>
        </div>

        {/* Admin Operasional */}
        <div className="stat-card" style={{ border: '1px solid rgba(0, 229, 255, 0.3)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: '#00E5FF' }}>🛠️ Admin Operasional</span>
            <ShieldCheck size={16} color="#00E5FF" />
          </div>
          <div className="stat-value" style={{ color: '#00E5FF' }}>{adminCount} Orang</div>
          <div className="stat-desc">Katalog HP, skor AnTuTu & proses pesanan</div>
        </div>
      </div>

      {/* 3. Team Members Table */}
      <div style={{
        background: '#121216',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
            Daftar Anggota & Hak Akses Tim
          </h2>
          <span style={{ fontSize: '12px', color: '#888' }}>
            Klik badge role untuk mengubah tingkat akses
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#888' }}>
            Memuat daftar tim...
          </div>
        ) : teamMembers.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#777' }}>
            Belum ada akun tim yang terdaftar.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)', color: '#888' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Profil & Nama Staff</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Email Login</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Tingkat Akses (Role)</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Tanggung Jawab</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(member => {
                  const isCurrent = member.email === user?.email;
                  const isSuper = member.role === 'superadmin';

                  return (
                    <tr
                      key={member.id || member.email}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isCurrent ? 'rgba(245, 158, 11, 0.02)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Profil & Nama */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: isSuper ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                            border: isSuper ? '1px solid #F59E0B' : '1px solid #00E5FF',
                            color: isSuper ? '#FBBF24' : '#00E5FF',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px'
                          }}>
                            {(member.full_name || member.email || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{member.full_name}</span>
                              {isCurrent && (
                                <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.1)', color: '#ccc', padding: '1px 5px', borderRadius: '4px' }}>
                                  Anda
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              Terdaftar: {member.created_at ? new Date(member.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: '#ddd', fontSize: '12px' }}>
                        {member.email}
                      </td>

                      {/* Role Badge & Switcher */}
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleRole(member)}
                          disabled={member.email === 'admin@aduhp.com'}
                          style={{
                            cursor: member.email === 'admin@aduhp.com' ? 'default' : 'pointer',
                            border: 'none',
                            background: 'none',
                            padding: 0
                          }}
                          title={member.email === 'admin@aduhp.com' ? 'Superadmin Utama Permanen' : 'Klik untuk mengubah role'}
                        >
                          {isSuper ? (
                            <span className="badge-role-superadmin">
                              <Crown size={12} />
                              <span>SUPERADMIN</span>
                            </span>
                          ) : (
                            <span className="badge-role-admin">
                              <ShieldCheck size={12} />
                              <span>ADMIN OPERASIONAL</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: member.status === 'aktif' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: member.status === 'aktif' ? '#34c759' : '#f87171',
                          border: member.status === 'aktif' ? '1px solid rgba(52, 199, 89, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.status === 'aktif' ? '#34c759' : '#f87171' }} />
                          {member.status === 'aktif' ? 'Aktif' : 'Dinonaktifkan'}
                        </span>
                      </td>

                      {/* Responsibilities */}
                      <td style={{ padding: '14px 18px', color: '#aaa', fontSize: '12px' }}>
                        {member.notes || (isSuper ? 'Akses Total Sistem' : 'Operasional Katalog')}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Toggle Status Aktif/Nonaktif */}
                          {!isCurrent && member.email !== 'admin@aduhp.com' && (
                            <button
                              onClick={() => handleToggleStatus(member)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                color: member.status === 'aktif' ? '#f87171' : '#34c759'
                              }}
                              title={member.status === 'aktif' ? 'Nonaktifkan akun staff ini' : 'Aktifkan akun staff ini'}
                            >
                              {member.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          )}

                          {/* Delete Member */}
                          {!isCurrent && member.email !== 'admin@aduhp.com' && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '5px 8px' }}
                              title="Hapus akun dari tim"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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

      {/* 4. Modal: Tambah Staff / Admin Baru */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#18181f',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#F59E0B" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Daftarkan Anggota Tim Baru
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap Staff *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso (Admin Katalog)"
                  className="form-input"
                  value={newMember.full_name}
                  onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Login *</label>
                <input
                  type="email"
                  required
                  placeholder="staff@aduhp.com"
                  className="form-input"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tingkat Hak Akses (Role) *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: newMember.role === 'admin' ? '2px solid #00E5FF' : '1px solid rgba(255,255,255,0.1)',
                    background: newMember.role === 'admin' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={newMember.role === 'admin'}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      />
                      <span style={{ fontWeight: 800, color: '#00E5FF', fontSize: '13px' }}>🛠️ Admin</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '20px' }}>
                      Input katalog, foto, skor AnTuTu & proses pesanan.
                    </span>
                  </label>

                  <label style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: newMember.role === 'superadmin' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                    background: newMember.role === 'superadmin' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="role"
                        value="superadmin"
                        checked={newMember.role === 'superadmin'}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      />
                      <span style={{ fontWeight: 800, color: '#FBBF24', fontSize: '13px' }}>👑 Superadmin</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '20px' }}>
                      Akses total, kelola tim staff, hapus produk & database.
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tugas / Catatan Divisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Staff CS & Verifikasi Resi JNE/J&T"
                  className="form-input"
                  value={newMember.notes}
                  onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ background: '#F59E0B', color: '#000', fontWeight: 800 }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
