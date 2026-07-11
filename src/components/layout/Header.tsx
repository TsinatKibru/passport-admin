'use client';

import { Search, Bell, Moon, Sun, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const [hasNotification] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved === 'dark' || (!saved && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header
      style={{
        height: '60px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      {/* Left: Mobile Menu + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        {/* Mobile Menu Button - ONLY on mobile */}
        <style>{`
          .mobile-menu-btn {
            display: flex;
          }
          @media (min-width: 769px) {
            .mobile-menu-btn {
              display: none !important;
            }
          }
        `}</style>
        <button
          onClick={onMenuToggle}
          className="mobile-menu-btn"
          style={{
            width: '36px',
            height: '36px',
            border: 'none',
            background: 'transparent',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Menu size={20} color="var(--text-secondary)" />
        </button>

        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: 'var(--text-primary)', 
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>
          {subtitle && (
            <div style={{ 
              fontSize: '13px', 
              color: 'var(--text-muted)', 
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right: Search + Theme + Bell + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Search - Hidden on small screens */}
        <style>{`
          .search-input {
            display: block;
          }
          @media (max-width: 640px) {
            .search-input {
              display: none !important;
            }
          }
        `}</style>
        <div style={{ position: 'relative' }} className="search-input">
          <Search
            size={14}
            color="var(--text-muted)"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            style={{
              width: '180px',
              height: '34px',
              paddingLeft: '32px',
              paddingRight: '12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 150ms',
            }}
            onFocus={(e) => {
              e.target.style.background = 'var(--bg-surface)';
              e.target.style.borderColor = 'var(--brand)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'var(--bg-subtle)';
              e.target.style.borderColor = 'var(--border)';
            }}
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '34px',
            height: '34px',
            border: 'none',
            background: 'transparent',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={16} color="var(--text-secondary)" /> : <Moon size={16} color="var(--text-secondary)" />}
        </button>

        {/* Bell - Hidden on very small screens */}
        <style>{`
          .bell-btn {
            display: flex;
          }
          @media (max-width: 480px) {
            .bell-btn {
              display: none !important;
            }
          }
        `}</style>
        <button
          className="bell-btn"
          style={{
            width: '34px',
            height: '34px',
            border: 'none',
            background: 'transparent',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'background 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Bell size={16} color="var(--text-secondary)" />
          {hasNotification && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                background: 'var(--danger)',
                borderRadius: '50%',
                border: '2px solid var(--bg-surface)',
              }}
            />
          )}
        </button>

        {/* Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--brand)',
            color: 'var(--text-inverse)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
