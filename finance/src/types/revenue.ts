export interface RevenueSource {
  energy: number;
  consultancy: number;
  data: number;
}

export interface DailyRevenue {
  date: string;
  sources: RevenueSource;
  total: number;
}

export interface FinancialMetrics {
  todayRevenue: RevenueSource;
  todayTotal: number;
  monthTotal: number;
  lastMonthTotal: number;
  mrr: number;
  runway: number | null; // months, null = infinite
  activeClients: number;
  burnRate: number;
}

export interface ConsultancySlot {
  id: string;
  date: string;
  time: string;
  duration: number; // minutes
  clientName?: string;
  booked: boolean;
  price: number;
}

export interface StripeBalance {
  available: number;
  pending: number;
  currency: string;
}
