'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRole } from '@/lib/auth/RoleContext';
import { useState, useEffect } from 'react';
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
  ChevronDown,
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
  const { user: userProfile } = useRole();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    
    return () => observer.disconnect();
  }, []);

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
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-inverse)', letterSpacing: '0.04em' }}>
              PSM
            </span>
          </button>
        ) : (
          <>
            <Image
              src="/ics-logo-horizontal-v2.png"
              alt="PSM Logo"
              width={190}
              height={36}
              style={{ objectFit: 'contain' }}
              priority
            />
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
                    paddingLeft: isCollapsed ? '0' : (isActive ? '7px' : '10px'),
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
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

      {/* Sidebar Decorative Image */}
      {!isCollapsed && (
        <div style={{ 
          padding: '2px 6px', 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: 'auto', 
          marginBottom: '8px' 
        }}>
          <Image
            src="/sidebar-decoration-v2.png"
            alt="Branding decoration"
            width={200}
            height={180}
            style={{ 
              objectFit: 'contain', 
              opacity: isDark ? 0.35 : 0.8,
              mixBlendMode: isDark ? 'luminosity' : 'normal',
              filter: isDark ? 'brightness(0.9) contrast(1.1)' : 'none',
            }}
          />
        </div>
      )}

      {/* Bottom User Section */}
      {isCollapsed ? (
        <div style={{
          minHeight: '60px',
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <button
            onClick={() => {
              router.push('/profile');
              onNavigate?.();
            }}
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
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="View Profile"
          >
            {userProfile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
          </button>
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
            title="Logout"
          >
            <LogOut size={14} color="var(--text-muted)" />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => {
            router.push('/profile');
            onNavigate?.();
          }}
          style={{
            margin: '8px 12px 16px 12px',
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface)';
          }}
          title="View Profile"
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--brand)',
            color: 'var(--text-inverse)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {userProfile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {userProfile?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {userProfile?.role || 'ADMIN'}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
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
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Logout"
          >
            <LogOut size={16} color="var(--text-muted)" />
          </button>
        </div>
      )}

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
