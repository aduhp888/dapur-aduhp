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
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  const navLinks = [
    { href: '/', label: 'Dashboard AduHP', icon: LayoutDashboard },
    { href: '/products', label: 'Katalog HP & Benchmark', icon: Smartphone },
    { href: '/products/new', label: 'Input HP Baru & AnTuTu', icon: PlusCircle },
    { href: '/checklist', label: 'Verifikasi Segel BNIB (QC)', icon: CheckSquare },
    { href: '/api-docs', label: 'API Mobile (iOS/Android)', icon: Code2 },
    { href: '/schema-setup', label: 'Setup Supabase SQL', icon: Database },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-header">
        <div className="brand-logo-icon" style={{ background: 'linear-gradient(135deg, #FF6D00, #C6FF00)', color: '#000', fontWeight: 900 }}>
          VS
        </div>
        <div>
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>DAPUR ADUHP</span>
            <span style={{ fontSize: '9px', background: 'rgba(198, 255, 0, 0.15)', color: '#C6FF00', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>PRO</span>
          </div>
          <div className="brand-subdomain">dapur.aduhp.com</div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="nav-group">
        <div className="nav-label">Manajemen Dapur</div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/products/new');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
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
        <div className="connection-status">
          <div className="status-dot"></div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600 }}>Supabase: aduhp</div>
            <div style={{ fontSize: '10.5px', color: '#666', fontFamily: 'var(--font-mono)' }}>beajiozqffgbcz...</div>
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
