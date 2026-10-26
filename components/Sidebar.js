'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Smartphone, 
  PlusCircle, 
  CheckSquare, 
  Code2, 
  Database,
  ExternalLink,
  LogOut,
  UploadCloud,
  ShoppingBag,
  Scale,
  Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (confirm('Yakin ingin logout dari dapur.aduhp.com?')) {
      setLoggingOut(true);
      try {
        await supabase.auth.signOut();
        await fetch('/api/auth/session', { method: 'DELETE' });
        window.location.href = '/login';
      } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/login';
      }
    }
  }



  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-header">
        <div className="brand-logo-icon" style={{ padding: 0, overflow: 'hidden', background: '#000', border: '1px solid var(--border-lime)', boxShadow: '0 0 10px rgba(198, 255, 0, 0.35)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Dapur AduHP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>DAPUR ADUHP</span>
            <span style={{ fontSize: '9px', background: 'rgba(198, 255, 0, 0.15)', color: '#C6FF00', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>PRO</span>
          </div>
          <div className="brand-subdomain">dapur.aduhp.com</div>
        </div>
      </div>

      {/* 1. Dashboard Utama */}
      <div className="nav-group">
        <div className="nav-label">Manajemen Dapur</div>
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={17} />
          <span>Dashboard AduHP</span>
        </Link>
        <Link href="/products" className={`nav-item ${pathname === '/products' ? 'active' : ''}`}>
          <Smartphone size={17} />
          <span>Semua Katalog HP</span>
        </Link>
      </div>

      {/* 2. UNIT DIJUAL OLEH ADUHP */}
      <div className="nav-group">
        <div className="nav-label" style={{ color: 'var(--accent-lime)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🛍️ UNIT DIJUAL ADUHP</span>
        </div>
        <Link 
          href="/products?tab=dijual" 
          className="nav-item"
          style={{ borderLeft: '2px solid var(--accent-lime)' }}
        >
          <ShoppingBag size={16} color="var(--accent-lime)" />
          <span style={{ fontWeight: 700 }}>HP Dijual (Ready Stock)</span>
          <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(198, 255, 0, 0.2)', color: 'var(--accent-lime)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
            TOKO
          </span>
        </Link>
        <Link href="/products/new?for_sale=true" className="nav-item">
          <PlusCircle size={16} />
          <span>Input HP Baru Dijual</span>
        </Link>
        <Link href="/products/second" className="nav-item" style={{ color: '#00E5FF' }}>
          <UploadCloud size={16} color="#00E5FF" />
          <span>Upload HP Second (5 Foto)</span>
          <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(0, 229, 255, 0.15)', color: '#00E5FF', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
            5 FOTO
          </span>
        </Link>
      </div>

      {/* 3. DATABASE ADUAN / COMPARE ONLY (TIDAK DIJUAL) */}
      <div className="nav-group">
        <div className="nav-label" style={{ color: '#FF9100', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚖️ DATA ADUAN (TIDAK DIJUAL)</span>
        </div>
        <Link 
          href="/products?tab=compare" 
          className="nav-item"
          style={{ borderLeft: '2px solid #FF9100' }}
        >
          <Scale size={16} color="#FF9100" />
          <span style={{ fontWeight: 700 }}>Database HP Pembanding</span>
          <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(255, 145, 0, 0.2)', color: '#FF9100', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
            ADUAN
          </span>
        </Link>
        <Link href="/products/new?for_sale=false" className="nav-item">
          <Layers size={16} />
          <span>Tambah HP Pembanding</span>
        </Link>
      </div>

      {/* 4. Sistem & Tools */}
      <div className="nav-group">
        <div className="nav-label">Sistem & Tools</div>
        <Link href="/checklist" className={`nav-item ${pathname === '/checklist' ? 'active' : ''}`}>
          <CheckSquare size={16} />
          <span>Verifikasi Segel BNIB (QC)</span>
        </Link>
        <Link href="/api-docs" className={`nav-item ${pathname === '/api-docs' ? 'active' : ''}`}>
          <Code2 size={16} />
          <span>API Mobile (iOS/Android)</span>
        </Link>
        <Link href="/schema-setup" className={`nav-item ${pathname === '/schema-setup' ? 'active' : ''}`}>
          <Database size={16} />
          <span>Setup Supabase SQL</span>
        </Link>
      </div>

      {/* Tautan Langsung ke Web Utama aduhp.com */}
      <div className="nav-group" style={{ marginTop: 'auto', paddingTop: '10px' }}>
        <div className="nav-label" style={{ color: 'var(--accent-lime)' }}>Kunjungi Website Utama</div>
        <a
          href="https://aduhp.com"
          target="_blank"
          rel="noreferrer"
          className="nav-item"
          style={{ border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}
        >
          <span>🌐</span>
          <span style={{ flex: 1 }}>aduhp.com (Home)</span>
          <ExternalLink size={12} color="#666" />
        </a>
        <a
          href="https://aduhp.com/adu-hp"
          target="_blank"
          rel="noreferrer"
          className="nav-item"
          style={{ border: '1px solid rgba(198, 255, 0, 0.2)', background: 'rgba(198, 255, 0, 0.05)', color: '#C6FF00' }}
        >
          <span>⚔️</span>
          <span style={{ flex: 1, fontWeight: 700 }}>Arena Adu HP (/adu-hp)</span>
          <ExternalLink size={12} color="#C6FF00" />
        </a>
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        {/* Theme Mode Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Tema
          </span>
          <ThemeToggle showLabel={true} style={{ padding: '4px 8px', fontSize: '11px' }} />
        </div>

        <div className="connection-status">
          <div className="status-dot"></div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Supabase: aduhp</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>beajiozqffgbcz...</div>
          </div>
        </div>

        <a 
          href="/api/products" 
          target="_blank" 
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={14} /> /api/products
          </span>
          <ExternalLink size={12} color="#888" />
        </a>

        {/* Tombol Logout */}
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-secondary btn-sm"
          style={{
            width: '100%',
            justifyContent: 'center',
            gap: '8px',
            color: '#f87171',
            borderColor: 'rgba(244, 63, 94, 0.25)',
            background: 'rgba(244, 63, 94, 0.05)',
            marginTop: '4px',
            cursor: loggingOut ? 'not-allowed' : 'pointer'
          }}
          title="Keluar dari sesi admin"
        >
          <LogOut size={14} />
          <span>{loggingOut ? 'Logging out...' : 'Logout Admin'}</span>
        </button>
      </div>
    </aside>
  );
}
