/**
 * Aggregate raw data into financial metrics for the dashboard.
 */

import { startOfDay, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { fetchStripeTransactions, categorizeRevenue } from './stripe';
import { fetchEnergyRevenue } from './influxdb';
import type { FinancialMetrics, RevenueSource } from '../types/revenue';

const MONTHLY_BURN_RATE = parseFloat(import.meta.env.VITE_BURN_RATE || '2500'); // EUR/month opex

export async function loadMetrics(): Promise<FinancialMetrics> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Fetch in parallel
  const [
    todayStripe,
    monthStripe,
    lastMonthStripe,
    todayEnergy,
    monthEnergy,
    lastMonthEnergy,
  ] = await Promise.all([
    fetchStripeTransactions(todayStart, now),
    fetchStripeTransactions(monthStart, now),
    fetchStripeTransactions(lastMonthStart, lastMonthEnd),
    fetchEnergyRevenue(todayStart, now),
    fetchEnergyRevenue(monthStart, now),
    fetchEnergyRevenue(lastMonthStart, lastMonthEnd),
  ]);

  // Today revenue
  const todayStripeRevenue = categorizeRevenue(todayStripe);
  const todayEnergyEUR = todayEnergy.reduce((s, p) => s + p.euroPerDay, 0);
  const todayRevenue: RevenueSource = {
    energy: todayEnergyEUR,
    consultancy: todayStripeRevenue.consultancy,
    data: todayStripeRevenue.data,
  };

  // Month totals
  const monthStripeRevenue = categorizeRevenue(monthStripe);
  const monthEnergyEUR = monthEnergy.reduce((s, p) => s + p.euroPerDay, 0);
  const monthTotal =
    monthEnergyEUR + monthStripeRevenue.consultancy + monthStripeRevenue.data;

  const lastMonthStripeRevenue = categorizeRevenue(lastMonthStripe);
  const lastMonthEnergyEUR = lastMonthEnergy.reduce((s, p) => s + p.euroPerDay, 0);
  const lastMonthTotal =
    lastMonthEnergyEUR + lastMonthStripeRevenue.consultancy + lastMonthStripeRevenue.data;

  // MRR = recurring subscriptions (data) + estimated monthly energy
  const mrr = monthStripeRevenue.data + monthEnergyEUR;

  // Active clients = unique consultancy transactions this month
  const activeClients = monthStripe.filter(
    (tx) => (tx.metadata?.category || 'consultancy') === 'consultancy' && tx.status === 'succeeded'
  ).length;

  // Runway calculation
  const burnRate = MONTHLY_BURN_RATE;
  const runway = burnRate <= 0 ? null : mrr >= burnRate ? null : null; // positive MRR = no runway issue for MVP

  return {
    todayRevenue,
    todayTotal: todayEnergyEUR + todayStripeRevenue.consultancy + todayStripeRevenue.data,
    monthTotal,
    lastMonthTotal,
    mrr,
    runway,
    activeClients,
    burnRate,
  };
}
