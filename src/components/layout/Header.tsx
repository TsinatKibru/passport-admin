'use client';

import { Search, Bell, Moon, Sun, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useRole } from '@/lib/auth/RoleContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

interface SearchResult {
  type: 'passport' | 'box' | 'slot';
  id: string;
  label: string;
  subtitle: string;
  link: string;
}

export default function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { user: userProfile } = useRole();
  const [hasNotification] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved === 'dark' || (!saved && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      try {
        const results: SearchResult[] = [];

        // Search passports
        const passportsRes = await apiClient.get(`/passports?search=${encodeURIComponent(searchQuery)}&limit=3`);
        const passports = passportsRes.data.data || [];
        passports.forEach((p: any) => {
          results.push({
            type: 'passport',
            id: p.id,
            label: p.holderName,
            subtitle: `ID: ${p.holderIdNo} • QR: ${p.qrCode}`,
            link: `/passports`,
          });
        });

        // Search boxes
        const boxesRes = await apiClient.get(`/boxes?search=${encodeURIComponent(searchQuery)}&limit=3`);
        const boxes = boxesRes.data.data || [];
        boxes.forEach((b: any) => {
          results.push({
            type: 'box',
            id: b.id,
            label: b.label,
            subtitle: `QR: ${b.qrCode} • ${b.occupiedCount}/${b.capacity} occupied`,
            link: `/boxes`,
          });
        });

        // Search slots
        const slotsRes = await apiClient.get(`/location/slots?search=${encodeURIComponent(searchQuery)}&limit=3`);
        const slots = slotsRes.data.data || [];
        slots.forEach((s: any) => {
          results.push({
            type: 'slot',
            id: s.id,
            label: s.name,
            subtitle: `QR: ${s.qrCode} • ${s.location || 'Location'}`,
            link: `/structure`,
          });
        });

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.link);
    setSearchQuery('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

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
        <div style={{ position: 'relative' }} className="search-input" ref={searchRef}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                width: '18px',
                height: '18px',
                border: 'none',
                background: 'transparent',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={12} color="var(--text-muted)" />
            </button>
          )}
          <input
            type="text"
            placeholder="Search passports, boxes, slots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '240px',
              height: '34px',
              paddingLeft: '32px',
              paddingRight: searchQuery ? '28px' : '12px',
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
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={(e) => {
              e.target.style.background = 'var(--bg-subtle)';
              e.target.style.borderColor = 'var(--border)';
            }}
          />

          {/* Search Results Dropdown */}
          {showResults && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
              }}
            >
              {isSearching ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {searchQuery.length < 2 ? 'Type at least 2 characters' : 'No results found'}
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        transition: 'background 150ms',
                        marginBottom: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius)',
                            background:
                              result.type === 'passport'
                                ? 'var(--success)'
                                : result.type === 'box'
                                ? 'var(--brand)'
                                : 'var(--warning)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {result.type === 'passport' ? 'P' : result.type === 'box' ? 'B' : 'S'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {result.label}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {result.subtitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
        <button
          onClick={() => router.push('/profile')}
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
            border: 'none',
            padding: 0,
            flexShrink: 0,
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title="View Profile"
        >
          {userProfile?.name
            ? userProfile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            : 'AD'}
        </button>
      </div>
    </header>
  );
}
