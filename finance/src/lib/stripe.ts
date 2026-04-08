/**
 * Stripe integration — pulls consultancy + data product revenue.
 * API key is read from VITE_STRIPE_SECRET_KEY env variable.
 * In production, this should be a backend proxy — never expose secret key to browser.
 * For MVP (local/private use), we call a lightweight proxy server or use VITE env.
 */

import axios from 'axios';
import type { RevenueSource } from '../types/revenue';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || '';

// We use a local proxy server (see server/stripe-proxy.ts) in dev mode.
// For browser-safe MVP, we call the proxy on port 3001.
const PROXY_BASE = import.meta.env.VITE_STRIPE_PROXY || 'http://localhost:3001';

export interface StripeTransaction {
  id: string;
  amount: number; // cents
  currency: string;
  description: string | null;
  created: number; // unix timestamp
  status: string;
  metadata: Record<string, string>;
}

export async function fetchStripeTransactions(
  from: Date,
  to: Date
): Promise<StripeTransaction[]> {
  if (!STRIPE_KEY && PROXY_BASE === 'http://localhost:3001') {
    console.warn('No Stripe key configured. Using mock data.');
    return getMockTransactions(from, to);
  }

  try {
    const res = await axios.get(`${PROXY_BASE}/stripe/charges`, {
      params: {
        from: Math.floor(from.getTime() / 1000),
        to: Math.floor(to.getTime() / 1000),
      },
      timeout: 10000,
    });
    return res.data;
  } catch (err) {
    console.error('Stripe fetch failed, using cached/mock data', err);
    return getMockTransactions(from, to);
  }
}

/**
 * Categorize transactions by source based on metadata or description.
 */
export function categorizeRevenue(transactions: StripeTransaction[]): RevenueSource {
  const result: RevenueSource = { energy: 0, consultancy: 0, data: 0 };

  for (const tx of transactions) {
    if (tx.status !== 'succeeded') continue;
    const amountEUR = tx.amount / 100; // assume EUR
    const category = tx.metadata?.category || detectCategory(tx.description || '');

    if (category === 'energy') result.energy += amountEUR;
    else if (category === 'data') result.data += amountEUR;
    else result.consultancy += amountEUR; // default
  }

  return result;
}

function detectCategory(description: string): keyof RevenueSource {
  const lower = description.toLowerCase();
  if (lower.includes('energy') || lower.includes('solar') || lower.includes('grid')) return 'energy';
  if (lower.includes('data') || lower.includes('subscription') || lower.includes('template')) return 'data';
  return 'consultancy';
}

// ── Mock data for development without API key ──────────────────────────────

function getMockTransactions(from: Date, to: Date): StripeTransaction[] {
  const txs: StripeTransaction[] = [];

  const start = from.getTime();
  const end = to.getTime();

  // Generate realistic mock data across the date range
  const mockEntries = [
    { amount: 150000, description: 'Smart Home Consultancy — Initial Assessment', category: 'consultancy' },
    { amount: 35000, description: 'Smart Home Consultancy — Follow-up', category: 'consultancy' },
    { amount: 9900, description: 'Data Dashboard Template', category: 'data' },
    { amount: 4900, description: 'Data Subscription Monthly', category: 'data' },
    { amount: 7500, description: 'Energy Optimization Report', category: 'energy' },
    { amount: 250000, description: 'Smart Home Full Package', category: 'consultancy' },
    { amount: 4900, description: 'Data Subscription Monthly', category: 'data' },
  ];

  let t = start;
  let i = 0;
  while (t < end) {
    const entry = mockEntries[i % mockEntries.length];
    txs.push({
      id: `ch_mock_${i}`,
      amount: entry.amount,
      currency: 'eur',
      description: entry.description,
      created: Math.floor(t / 1000),
      status: 'succeeded',
      metadata: { category: entry.category },
    });
    t += (2 + Math.random() * 5) * 24 * 3600 * 1000; // every 2-7 days
    i++;
  }

  return txs;
}
