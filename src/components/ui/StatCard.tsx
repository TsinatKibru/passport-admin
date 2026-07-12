import { Card } from './Card';
import { LucideIcon, MoreHorizontal } from 'lucide-react';

export function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  trend,
  iconColor = 'var(--brand)',
  waveColor = 'var(--brand)',
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  trend?: { value: string; positive: boolean };
  iconColor?: string;
  waveColor?: string;
}) {
  const gradientId = `grad-${waveColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
      <Card padding="16px">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative', 
          zIndex: 1,
          minHeight: '140px',
        }}>
          {/* Top row: Icon left, overflow menu right */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}>
            {/* Icon in soft rounded square - top left */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon size={20} color={iconColor} />
            </div>

            {/* Overflow menu - top right */}
            <button style={{
              width: '24px',
              height: '24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius)',
              padding: 0,
            }}>
              <MoreHorizontal size={14} color="var(--text-muted)" />
            </button>
          </div>

          {/* Value */}
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '4px',
            position: 'relative',
            zIndex: 1,
            lineHeight: 1,
          }}>
            {value}
          </div>

          {/* Label */}
          <div style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: '2px',
            position: 'relative',
            zIndex: 1,
            lineHeight: 1.3,
          }}>
            {label}
          </div>

          {/* Sublabel */}
          {sublabel && (
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              position: 'relative',
              zIndex: 1,
              lineHeight: 1.3,
            }}>
              {sublabel}
            </div>
          )}

          {/* Optional Trend */}
          {trend && (
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: trend.positive ? 'var(--success)' : 'var(--danger)',
              marginTop: '6px',
              position: 'relative',
              zIndex: 1,
            }}>
              {trend.value}
            </div>
          )}
        </div>
      </Card>

      {/* Filled wave sparkline at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '45px',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}>
        <svg
          viewBox="0 0 200 40"
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={waveColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={waveColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Filled background shape with wave top */}
          <path
            d="M0 20 C50 5, 50 35, 100 20 C150 5, 150 35, 200 20 L200 40 L0 40 Z"
            fill={`url(#${gradientId})`}
          />
          {/* Wave outline line */}
          <path
            d="M0 20 C50 5, 50 35, 100 20 C150 5, 150 35, 200 20"
            fill="none"
            stroke={waveColor}
            strokeWidth="1.5"
            opacity="0.25"
          />
        </svg>
      </div>
    </div>
  );
}
