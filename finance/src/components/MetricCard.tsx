
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  delta?: number; // % change vs last period
  icon: string;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'red';
  loading?: boolean;
}

export function MetricCard({ title, value, subtitle, delta, icon, color = 'blue', loading }: MetricCardProps) {
  const colorMap = {
    green: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', icon: '#10b981' },
    blue: { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a', icon: '#3b82f6' },
    amber: { bg: '#fef3c7', border: '#fcd34d', text: '#78350f', icon: '#f59e0b' },
    purple: { bg: '#ede9fe', border: '#c4b5fd', text: '#4c1d95', icon: '#8b5cf6' },
    red: { bg: '#fee2e2', border: '#fca5a5', text: '#7f1d1d', icon: '#ef4444' },
  };
  const c = colorMap[color];

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '20px 24px',
      minWidth: 200,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: c.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      {loading ? (
        <div style={{ height: 36, background: `${c.border}88`, borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
      ) : (
        <div style={{ fontSize: 32, fontWeight: 700, color: c.text, lineHeight: 1 }}>{value}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: c.text }}>
        {subtitle && <span>{subtitle}</span>}
        {delta !== undefined && (
          <span style={{ color: delta >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
