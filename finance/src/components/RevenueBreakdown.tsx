import type { RevenueSource } from '../types/revenue';

interface Props {
  sources: RevenueSource;
  total: number;
  title: string;
}

const SOURCE_CONFIG = {
  energy: { label: 'Energy Trading', icon: '⚡', color: '#f59e0b' },
  consultancy: { label: 'Consultancy', icon: '🏠', color: '#3b82f6' },
  data: { label: 'Data Products', icon: '📊', color: '#8b5cf6' },
};

function fmt(n: number) {
  return `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function RevenueBreakdown({ sources, total, title }: Props) {
  const entries = (Object.entries(sources) as [keyof RevenueSource, number][]).map(([key, val]) => ({
    key,
    val,
    pct: total > 0 ? (val / total) * 100 : 0,
    ...SOURCE_CONFIG[key],
  }));

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map(({ key, val, pct, label, icon, color }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
              <span>{icon} {label}</span>
              <span style={{ fontWeight: 600 }}>{fmt(val)} <span style={{ color: '#6b7280', fontWeight: 400 }}>({pct.toFixed(1)}%)</span></span>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                background: color,
                width: `${pct}%`,
                height: '100%',
                borderRadius: 4,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>Total</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}
