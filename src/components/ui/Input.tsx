export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required,
  style,
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  required?: boolean;
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
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--brand)';
        e.target.style.boxShadow = '0 0 0 3px rgb(37 99 235 / 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border)';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}
