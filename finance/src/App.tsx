import { useEffect, useState, useCallback } from 'react';
import { MetricCard } from './components/MetricCard';
import { RevenueBreakdown } from './components/RevenueBreakdown';
import { TicketBooking } from './components/TicketBooking';
import { RunwayCard } from './components/RunwayCard';
import { WalletCard } from './components/WalletCard';
import { loadMetrics } from './lib/metrics';
import { getSlots } from './lib/slots';
import type { FinancialMetrics, ConsultancySlot } from './types/revenue';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function fmt(n: number) {
  return `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function App() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [slots, setSlots] = useState<ConsultancySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await loadMetrics();
      setMetrics(m);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSlots(getSlots());
    refresh();
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const deltaMonth =
    metrics && metrics.lastMonthTotal > 0
      ? ((metrics.monthTotal - metrics.lastMonthTotal) / metrics.lastMonthTotal) * 100
      : undefined;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%)',
        color: '#fff',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>⚡ Hendrik CFO Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>Financial Command Center</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 13 }}>
          <div style={{ opacity: 0.7 }}>
            {lastUpdated
              ? `Updated: ${lastUpdated.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading...'}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              marginTop: 6,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Refreshing…' : '🔄 Refresh'}
          </button>
        </div>
      </header>

      <main style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
            padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14,
          }}>
            ⚠️ {error} — showing cached/mock data
          </div>
        )}

        {/* Key Metrics Row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <MetricCard
            title="Today's Revenue"
            value={metrics ? fmt(metrics.todayTotal) : '—'}
            subtitle="All sources"
            icon="💶"
            color="green"
            loading={loading && !metrics}
          />
          <MetricCard
            title="This Month"
            value={metrics ? fmt(metrics.monthTotal) : '—'}
            subtitle={`vs €${metrics?.lastMonthTotal?.toFixed(0) ?? '—'} last month`}
            delta={deltaMonth}
            icon="📅"
            color="blue"
            loading={loading && !metrics}
          />
          <MetricCard
            title="MRR"
            value={metrics ? fmt(metrics.mrr) : '—'}
            subtitle="Monthly recurring revenue"
            icon="🔁"
            color="purple"
            loading={loading && !metrics}
          />
          <MetricCard
            title="Active Clients"
            value={metrics ? String(metrics.activeClients) : '—'}
            subtitle="Consultancy this month"
            icon="👥"
            color="amber"
            loading={loading && !metrics}
          />
        </div>

        {/* Wallet + Runway row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <WalletCard />
        </div>

        {/* Revenue Breakdown + Runway */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ flex: 2, minWidth: 280 }}>
            {metrics ? (
              <RevenueBreakdown
                sources={metrics.todayRevenue}
                total={metrics.todayTotal}
                title="Today's Revenue by Source"
              />
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading…</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            {metrics ? (
              <RunwayCard mrr={metrics.mrr} burnRate={metrics.burnRate} runway={metrics.runway} />
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading…</div>
            )}
          </div>
        </div>

        {/* Monthly breakdown */}
        {metrics && (
          <div style={{ marginBottom: 24 }}>
            <RevenueBreakdown
              sources={metrics.todayRevenue} // reuse today's sources as monthly split proxy
              total={metrics.monthTotal}
              title={`This Month Total — ${new Date().toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}`}
            />
          </div>
        )}

        {/* Ticket Booking */}
        <TicketBooking slots={slots} onSlotsChange={setSlots} />

        {/* Footer */}
        <footer style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
          Auto-refreshes every hour · Data: Stripe + InfluxDB (CTO) · Mock mode active when APIs offline
        </footer>
      </main>
    </div>
  );
}

export default App;
