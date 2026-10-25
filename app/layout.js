import './globals.css';
import Sidebar from '../components/Sidebar';
import Link from 'next/link';
import { PlusCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'dapur.aduhp.com — 1 Admin 3 Platform (Web, Android, iPhone)',
  description: 'Admin Panel Rahasia aduHP: Kelola HP Baru (BNIB), HP Second Grade A+, IMEI, dan Quality Control 35 Titik Inspeksi terintegrasi ke Supabase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="app-container">
          <Sidebar />

          <div className="main-wrapper">
            {/* Sticky Topbar */}
            <header className="top-bar">
              <div className="top-bar-left">
                <span style={{ fontSize: '12px', color: '#666', fontFamily: 'var(--font-mono)' }}>
                  HOSTINGER DNS → VERCEL CDN → SUPABASE
                </span>
                <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.08)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                  dapur.aduhp.com
                </span>
              </div>

              <div className="top-bar-right">
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

            {/* Dynamic Content */}
            <main className="content-body">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
