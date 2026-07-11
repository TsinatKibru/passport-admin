const variants = {
  success: { bg: 'var(--success-bg)', color: 'var(--success)' },
  danger: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  info: { bg: 'var(--info-bg)', color: 'var(--info)' },
  brand: { bg: 'var(--brand-light)', color: 'var(--brand)' },
  default: { bg: 'var(--bg-subtle)', color: 'var(--text-secondary)' },
};

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  const style = variants[variant];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 500,
        background: style.bg,
        color: style.color,
      }}
    >
      {children}
    </span>
  );
}
