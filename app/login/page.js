'use client';

import { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  KeyRound, 
  Copy, 
  Check,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@aduhp.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotConfirmed, setIsNotConfirmed] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  function copySql(text) {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsNotConfirmed(false);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const msg = authError.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed') || authError.code === 'email_not_confirmed') {
          setIsNotConfirmed(true);
          setError('Email admin belum terkonfirmasi di database Supabase.');
        } else if (msg.includes('invalid login credentials')) {
          setError('Email atau password salah. Pastikan password yang dimasukkan benar.');
        } else {
          setError(authError.message || 'Gagal login ke sistem.');
        }
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Simpan session cookie via API route
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });

        if (!res.ok) {
          throw new Error('Gagal membuat sesi login di server.');
        }

        // Redirect ke route tujuan atau dashboard
        const params = new URLSearchParams(window.location.search);
        const destination = params.get('redirect') || '/';
        window.location.href = destination;
      } else {
        setError('Sesi autentikasi tidak ditemukan. Coba lagi.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Terjadi kesalahan sistem saat proses login.');
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-logo-badge">
            ⚡
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{
              background: 'rgba(0, 255, 136, 0.1)',
              color: '#00ff88',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px',
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <ShieldCheck size={12} />
              PORTAL ADMIN TERPROTEKSI
            </span>
          </div>

          <h1 className="login-title">DAPUR ADUHP</h1>
          <p className="login-subtitle">
            Admin Panel & Manajemen Stok Gadget (<span style={{ color: '#00ff88', fontWeight: 600 }}>Rp 921jt</span>)
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error-box">
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#fca5a5' }}>Login Ditolak</div>
              <div style={{ fontSize: '12px', marginTop: '2px' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Supabase Email Not Confirmed Helper */}
        {isNotConfirmed && (
          <div className="login-warning-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700, color: '#fbbf24' }}>
              <KeyRound size={15} />
              <span>Aktivasi Akun di Supabase</span>
            </div>
            <p style={{ fontSize: '12px', color: '#fef3c7', marginBottom: '8px' }}>
              Jalankan SQL 1 baris ini di Supabase SQL Editor untuk langsung mengaktifkan akun tanpa klik email:
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#000',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <code style={{ fontSize: '11px', color: '#00ff88', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '${email}';`}
              </code>
              <button
                type="button"
                onClick={() => copySql(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '${email}';`)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                title="Salin query SQL"
              >
                {copiedSql ? <Check size={12} color="#00ff88" /> : <Copy size={12} />}
              </button>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <a
                href="https://supabase.com/dashboard/project/beajiozqffgbczkhmwan/sql"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#00e5ff', textDecoration: 'underline', fontSize: '11.5px' }}
              >
                Buka SQL Editor ↗
              </a>
              <span style={{ fontSize: '11px', color: '#999' }}>Project: beajiozqffgbcz...</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11.5px' }}>
              Email Admin
            </label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aduhp.com"
                className="login-input-field"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '11.5px' }}>
                Password
              </label>
            </div>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="login-input-field"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="login-neon-btn"
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <span>Memverifikasi Sesi...</span>
            ) : (
              <>
                <span>Masuk ke Dapur aduHP</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }}></span>
            <span>Autentikasi Supabase Email/Password</span>
          </div>
          <div style={{ fontSize: '11px', color: '#555', fontFamily: 'var(--font-mono)' }}>
            dapur.aduhp.com • 1 Admin 3 Platform
          </div>
        </div>
      </div>
    </div>
  );
}
