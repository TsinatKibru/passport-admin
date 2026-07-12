export function Table({ children }: { children: React.ReactNode }) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
      }}
    >
      {children}
    </table>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  isHeader,
}: {
  children: React.ReactNode;
  isHeader?: boolean;
}) {
  return (
    <tr
      style={{
        borderBottom: isHeader ? '2px solid var(--border)' : '1px solid var(--border)',
        transition: isHeader ? 'none' : 'background 150ms',
      }}
      {...(!isHeader && {
        onMouseEnter: (e) => {
          e.currentTarget.style.background = 'var(--bg-subtle)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = 'transparent';
        },
      })}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  align = 'left',
  style,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        padding: '10px 12px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  style,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: '12px',
        fontSize: '13px',
        color: 'var(--text-primary)',
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </td>
  );
}
