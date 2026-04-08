
interface Props {
  mrr: number;
  burnRate: number;
  runway: number | null;
}

export function RunwayCard({ mrr, burnRate, runway }: Props) {
  const netMonthly = mrr - burnRate;
  const isPositive = netMonthly >= 0;

  return (
    <div style={{
      background: isPositive ? '#d1fae5' : '#fee2e2',
      border: `1px solid ${isPositive ? '#6ee7b7' : '#fca5a5'}`,
      borderRadius: 12,
      padding: '20px 24px',
      flex: 1,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: isPositive ? '#065f46' : '#7f1d1d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        🛫 Runway
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: isPositive ? '#065f46' : '#991b1b', lineHeight: 1, marginBottom: 8 }}>
        {isPositive ? '∞' : runway !== null ? `${runway.toFixed(1)} mo` : '∞'}
      </div>
      <div style={{ fontSize: 13, color: isPositive ? '#065f46' : '#7f1d1d', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>MRR: <strong>€{mrr.toFixed(0)}</strong></span>
        <span>Burn: <strong>€{burnRate.toFixed(0)}/mo</strong></span>
        <span style={{ fontWeight: 700, marginTop: 4 }}>
          Net: {isPositive ? '+' : ''}€{netMonthly.toFixed(0)}/mo
        </span>
      </div>
    </div>
  );
}
