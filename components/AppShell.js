'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { PlusCircle, ExternalLink, Crown, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

function AccessDeniedNotice() {
  const searchParams = useSearchParams();
  const [deniedNotice, setDeniedNotice] = useState(false);

  useEffect(() => {
    if (searchParams?.get('denied') === 'superadmin_only') {
      setDeniedNotice(true);
    }
  }, [searchParams]);

  if (!deniedNotice) return null;

  return (
    <div className="rbac-denied-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldAlert size={18} color="#ef4444" />
        <div>
          <strong style={{ color: '#fff' }}>Akses Terbatas: Khusus Superadmin</strong>
          <span style={{ display: 'block', fontSize: '12px', color: '#fca5a5' }}>
            Halaman tersebut dikunci untuk akun Admin Operasional. Hanya Superadmin yang berhak mengakses pengaturan sistem & database.
          </span>
        </div>
      </div>
      <button
        onClick={() => setDeniedNotice(false)}
        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '4px' }}
        title="Tutup pemberitahuan"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { user, isSuperadmin } = useAuth();

  if (isLoginPage) {
    return <div className="login-shell">{children}</div>;
  }

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-wrapper">
        {/* Sticky Topbar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              HOSTINGER DNS → VERCEL CDN → SUPABASE
            </span>
            <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.08)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              dapur.aduhp.com
            </span>

            {/* Dynamic Role Badge */}
            {isSuperadmin ? (
              <span className="badge-role-superadmin" title="Akun Anda memiliki akses penuh Superadmin">
                <Crown size={12} />
                <span>SUPERADMIN</span>
              </span>
            ) : (
              <span className="badge-role-admin" title="Akun Staff Operasional & Katalog">
                <ShieldCheck size={12} />
                <span>ADMIN OPERASIONAL</span>
              </span>
            )}
          </div>

          <div className="top-bar-right">
            {/* User Account Pill */}
            {user?.email && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '2px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                {user.email}
              </span>
            )}

            {/* 2 Mode: Terang & Dark Mode Toggle */}
            <ThemeToggle showLabel={true} />

            <a 
              href="/api/products" 
              target="_blank" 
              className="btn btn-secondary btn-sm"
              title="Buka JSON output untuk Flutter (Android & iOS)"
            >
              <ExternalLink size={13} />
              <span>JSON Feed</span>
            </a>

            <Link href="/products/new" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              <span>Input HP Baru / Second</span>
            </Link>
          </div>
        </header>

        {/* Access Denied Banner for Non-Superadmin (Wrapped in Suspense) */}
        <Suspense fallback={null}>
          <AccessDeniedNotice />
        </Suspense>

        {/* Dynamic Content */}
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
