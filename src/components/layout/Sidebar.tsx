'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Package,
  GitBranch,
  ScrollText,
  Settings,
  LogOut,
  Shield
} from 'lucide-react';

const navSections = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
      { icon: FileText, label: 'Passports', href: '/passports' },
      { icon: Package, label: 'Boxes', href: '/boxes' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { icon: GitBranch, label: 'Structure', href: '/structure' },
      { icon: ScrollText, label: 'Audit Logs', href: '/logs' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { icon: Settings, label: 'Setup', href: '/setup' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          height: '64px',
          padding: '16px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            background: 'var(--brand)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Shield size={18} color="var(--text-inverse)" />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Passport Track
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Admin Portal
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {navSections.map((section) => (
          <div key={section.label}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                margin: '20px 0 6px 8px',
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    width: '100%',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-lg)',
                    background: isActive ? 'var(--brand-light)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon
                    size={16}
                    color={isActive ? 'var(--brand)' : 'var(--text-muted)'}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom User Section */}
      <div
        style={{
          height: '60px',
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
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
          }}
        >
          AD
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Administrator
          </div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: '9999px',
              background: 'var(--brand-light)',
              color: 'var(--brand)',
            }}
          >
            ADMIN
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={14} color="var(--text-muted)" />
        </button>
      </div>
    </aside>
  );
}
