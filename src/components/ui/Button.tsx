const variantStyles = {
  primary: {
    background: 'var(--brand)',
    color: 'var(--text-inverse)',
    border: 'none',
    hoverBg: 'var(--brand-hover)',
  },
  secondary: {
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    hoverBg: 'var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: 'none',
    hoverBg: 'var(--bg-subtle)',
  },
  danger: {
    background: 'var(--danger)',
    color: 'var(--text-inverse)',
    border: 'none',
    hoverBg: '#B91C1C',
  },
};

const sizeStyles = {
  sm: { height: '30px', padding: '0 10px' },
  md: { height: '36px', padding: '0 14px' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  type = 'button',
  style,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizeStyle,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: variantStyle.background,
        color: variantStyle.color,
        border: variantStyle.border,
        borderRadius: 'var(--radius)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 150ms',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variantStyle.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variantStyle.background;
        }
      }}
    >
      {children}
    </button>
  );
}
