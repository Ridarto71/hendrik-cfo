# Hendrik CFO — Financial Dashboard

React + Vite dashboard showing daily revenue by source, MRR, runway, and consultancy ticket booking.

## Quick Start

```bash
cd finance
npm install
npm run dev        # dashboard at http://localhost:5173
```

## With Real Data

1. Copy `.env.example` → `.env.local` and fill in your keys:
   ```
   VITE_STRIPE_SECRET_KEY=sk_live_...
   VITE_INFLUXDB_TOKEN=your_token
   ```

2. Start the Stripe proxy (avoids CORS):
   ```bash
   STRIPE_SECRET_KEY=sk_live_... node server/stripe-proxy.mjs
   ```

3. Start the dashboard:
   ```bash
   npm run dev
   ```

## Architecture

- **`src/lib/stripe.ts`** — Stripe transaction fetch + revenue categorization
- **`src/lib/influxdb.ts`** — InfluxDB energy revenue query (CTO's dashboard)
- **`src/lib/metrics.ts`** — Aggregates metrics: today, monthly, MRR, runway
- **`src/lib/slots.ts`** — Consultancy slot management (localStorage + future Calendar sync)
- **`server/stripe-proxy.mjs`** — Local proxy for Stripe API (keeps secret key out of browser)

## Mock Mode

All data sources fall back to realistic mock data when API keys aren't configured. Run `npm run dev` without any keys to see the full UI with demo data.

## Revenue Sources

| Source | Data From | Notes |
|--------|-----------|-------|
| Energy Trading | InfluxDB @ 192.168.1.100:8086 | CTO's dashboard |
| Consultancy | Stripe charges API | Categorized by metadata |
| Data Products | Stripe subscriptions | Recurring revenue → MRR |

## Ticket Booking

- Available / Booked tabs
- Book slots by client name
- Add custom slots (date + time + price)
- Persisted in localStorage (future: sync to Google Calendar)

## TODO (Sprint 1 remaining)

- [ ] Stripe webhook for real-time updates
- [ ] Google Calendar sync for slots
- [ ] Historical revenue chart (last 30 days)
- [ ] Phantom wallet card (Task 1.2)
