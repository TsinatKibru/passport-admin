'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Overlay - only on mobile */}
      {isMobileMenuOpen && (
        <>
          <style>{`
            @media (min-width: 769px) {
              .mobile-overlay { display: none !important; }
            }
          `}</style>
          <div
            className="mobile-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
            onClick={closeMobileMenu}
          />
        </>
      )}

      {/* Sidebar Wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 50,
        }}
      >
        <style>{`
          /* Desktop: always visible, toggles between full/collapsed */
          @media (min-width: 769px) {
            .sidebar-wrapper {
              position: sticky !important;
              top: 0;
              left: 0 !important;
            }
          }
          
          /* Mobile: hidden by default, slides in when menu open */
          @media (max-width: 768px) {
            .sidebar-wrapper {
              position: fixed !important;
              top: 0;
              left: ${isMobileMenuOpen ? '0' : '-100%'} !important;
              transition: left 300ms ease-in-out;
            }
          }
        `}</style>
        <div className="sidebar-wrapper" style={{ height: '100vh' }}>
          <Sidebar isCollapsed={isCollapsed} onToggle={toggleCollapse} onNavigate={closeMobileMenu} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header 
          title={title} 
          subtitle={subtitle} 
          onMenuToggle={toggleMobileMenu}
        />
        <main className="p-4 md:p-6" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
