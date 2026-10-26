'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '', style = {}, showLabel = true }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        className={`btn btn-secondary btn-sm ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          opacity: 0.6,
          cursor: 'default',
          ...style,
        }}
        aria-label="Toggle theme"
      >
        <span style={{ width: 14, height: 14, display: 'inline-block' }} />
        {showLabel && <span>Tema</span>}
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-secondary btn-sm ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '6px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontWeight: 600,
        fontSize: '12px',
        ...style,
      }}
      title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
      aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
    >
      {isDark ? (
        <>
          <Sun size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
          {showLabel && <span>Mode Terang</span>}
        </>
      ) : (
        <>
          <Moon size={14} color="#6366f1" style={{ flexShrink: 0 }} />
          {showLabel && <span>Mode Gelap</span>}
        </>
      )}
    </button>
  );
}
