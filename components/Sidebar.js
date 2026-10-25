'use client';

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
  ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products', label: 'Katalog Produk', icon: Smartphone },
    { href: '/products/new', label: 'Input HP / Gadget', icon: PlusCircle },
    { href: '/checklist', label: '35 Titik Inspeksi QC', icon: CheckSquare },
    { href: '/api-docs', label: 'API Mobile (iOS/Android)', icon: Code2 },
    { href: '/schema-setup', label: 'Setup Supabase SQL', icon: Database },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-header">
        <div className="brand-logo-icon">
          ⚡
        </div>
        <div>
          <div className="brand-title">DAPUR ADUHP</div>
          <div className="brand-subdomain">dapur.aduhp.com</div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="nav-group">
        <div className="nav-label">Menu Admin</div>
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
      </div>
    </aside>
  );
}
