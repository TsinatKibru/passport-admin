import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  iconColor = 'var(--brand)',
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: { value: string; positive: boolean };
  iconColor?: string;
}) {
  return (
    <Card padding="16px">
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Icon top-right */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={iconColor} />
        </div>

        {/* Value */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginTop: '8px',
          }}
        >
          {value}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          {label}
        </div>

        {/* Optional Trend */}
        {trend && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: trend.positive ? 'var(--success)' : 'var(--danger)',
              marginTop: '8px',
            }}
          >
            {trend.value}
          </div>
        )}
      </div>
    </Card>
  );
}
