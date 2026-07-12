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
  Shield,
  User,
  PanelLeftClose,
  PanelLeftOpen,
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
      { icon: User, label: 'Profile', href: '/profile' },
      { icon: Shield, label: 'Security', href: '/security' },
      { icon: Settings, label: 'Setup', href: '/setup' },
    ],
  },
];

export default function Sidebar({
  isCollapsed,
  onToggle,
  onNavigate,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  return (
    <aside
      style={{
        width: isCollapsed ? '64px' : 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        left: 0,
        transition: 'width 200ms ease-in-out',
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          height: '64px',
          padding: isCollapsed ? '16px 0' : '16px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: isCollapsed ? '0' : '10px',
        }}
      >
        {isCollapsed ? (
          <button
            onClick={onToggle}
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--brand)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Shield size={18} color="var(--text-inverse)" />
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin Portal</div>
              </div>
            </div>
            <button
              onClick={onToggle}
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius)',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <PanelLeftClose size={16} color="var(--text-muted)" />
            </button>
          </>
        )}
      </div>

      {/* Nav Section */}
      <nav style={{ flex: 1, padding: isCollapsed ? '16px 8px' : '16px 12px', overflowY: 'auto' }}>
        {navSections.map((section, sectionIndex) => (
          <div key={section.label}>
            {isCollapsed ? (
              // Divider line when collapsed
              sectionIndex > 0 && (
                <div
                  style={{
                    margin: '12px 8px',
                    borderTop: '1px solid var(--border)',
                  }}
                />
              )
            ) : (
              // Section label when expanded
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
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    onNavigate?.();
                  }}
                  style={{
                    width: '100%',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? '0' : '10px',
                    padding: isCollapsed ? '8px 0' : '8px 10px',
                    borderRadius: 'var(--radius-lg)',
                    background: isActive ? 'var(--brand-light)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    marginBottom: '2px',
                    position: 'relative',
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
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={16} color={isActive ? 'var(--brand)' : 'var(--text-muted)'} />
                  {!isCollapsed && (
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom User Section */}
      <div
        style={{
          minHeight: '60px',
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: isCollapsed ? '8px' : '10px',
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
            flexShrink: 0,
          }}
        >
          AD
        </div>
        {!isCollapsed && (
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
        )}
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
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={14} color="var(--text-muted)" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            right: '-12px',
            top: '72px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--brand-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface)';
          }}
        >
          <PanelLeftOpen size={14} color="var(--text-muted)" />
        </button>
      )}
    </aside>
  );
}
