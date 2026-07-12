export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required,
  disabled,
  style,
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      disabled={disabled}
      style={{
        width: '100%',
        height: '36px',
        padding: '0 12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: '13px',
        color: 'var(--text-primary)',
        outline: 'none',
        transition: 'all 150ms',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
        ...style,
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.target.style.borderColor = 'var(--brand)';
          e.target.style.boxShadow = '0 0 0 3px rgb(37 99 235 / 0.1)';
        }
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border)';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}
