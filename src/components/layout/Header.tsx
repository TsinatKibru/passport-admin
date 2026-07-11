'use client';

import { Search, Bell } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [hasNotification] = useState(true);

  return (
    <header
      style={{
        height: '60px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: Title */}
      <div>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Right: Search + Bell + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
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
              width: '220px',
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

        {/* Notification Bell */}
        <button
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
            position: 'relative',
            transition: 'background 150ms',
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
          }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
