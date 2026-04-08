/**
 * InfluxDB client — pulls energy revenue from CTO's dashboard.
 * Connection: 192.168.1.100:8086 (LAN)
 * Falls back to mock data if InfluxDB is unreachable.
 */

import axios from 'axios';

const INFLUX_URL = import.meta.env.VITE_INFLUXDB_URL || 'http://192.168.1.100:8086';
const INFLUX_TOKEN = import.meta.env.VITE_INFLUXDB_TOKEN || '';
const INFLUX_ORG = import.meta.env.VITE_INFLUXDB_ORG || 'hendrik';
const INFLUX_BUCKET = import.meta.env.VITE_INFLUXDB_BUCKET || 'energy';

export interface EnergyRevenuePoint {
  date: string; // YYYY-MM-DD
  euroPerDay: number;
  source: 'dayahead' | 'balancing' | 'netmetering' | 'total';
}

/**
 * Query energy revenue from InfluxDB via Flux query language.
 * Returns daily totals in EUR.
 */
export async function fetchEnergyRevenue(
  from: Date,
  to: Date
): Promise<EnergyRevenuePoint[]> {
  if (!INFLUX_TOKEN) {
    console.warn('No InfluxDB token. Using mock energy data.');
    return getMockEnergyRevenue(from, to);
  }

  const fluxQuery = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: ${from.toISOString()}, stop: ${to.toISOString()})
      |> filter(fn: (r) => r._measurement == "energy_revenue")
      |> filter(fn: (r) => r._field == "eur_per_day")
      |> aggregateWindow(every: 1d, fn: sum, createEmpty: false)
      |> yield(name: "daily_revenue")
  `;

  try {
    const res = await axios.post(
      `${INFLUX_URL}/api/v2/query?org=${INFLUX_ORG}`,
      fluxQuery,
      {
        headers: {
          Authorization: `Token ${INFLUX_TOKEN}`,
          'Content-Type': 'application/vnd.flux',
          Accept: 'application/csv',
        },
        timeout: 8000,
      }
    );

    return parseInfluxCSV(res.data);
  } catch (err) {
    console.error('InfluxDB unreachable, using mock data:', err);
    return getMockEnergyRevenue(from, to);
  }
}

function parseInfluxCSV(csv: string): EnergyRevenuePoint[] {
  const lines = csv.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const timeIdx = headers.indexOf('_time');
  const valueIdx = headers.indexOf('_value');
  const sourceIdx = headers.indexOf('source');

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const date = cols[timeIdx]?.substring(0, 10) || '';
    const euroPerDay = parseFloat(cols[valueIdx] || '0');
    const source = (cols[sourceIdx] || 'total') as EnergyRevenuePoint['source'];
    return { date, euroPerDay, source };
  });
}

// ── Mock data ──────────────────────────────────────────────────────────────

function getMockEnergyRevenue(from: Date, to: Date): EnergyRevenuePoint[] {
  const points: EnergyRevenuePoint[] = [];
  const current = new Date(from);

  while (current <= to) {
    const dateStr = current.toISOString().substring(0, 10);
    // Simulate ~€5-15/day energy revenue with some variance
    const base = 8;
    const variance = Math.sin(current.getTime() / 86400000) * 4;
    points.push({
      date: dateStr,
      euroPerDay: Math.max(0, base + variance + (Math.random() - 0.5) * 3),
      source: 'total',
    });
    current.setDate(current.getDate() + 1);
  }

  return points;
}
