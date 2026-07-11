export function Card({
  children,
  padding = '20px',
  className = '',
}: {
  children: React.ReactNode;
  padding?: string;
  className?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding,
      }}
      className={className}
    >
      {children}
    </div>
  );
}
