# TASKS.md — Claude Code's Finance Queue

## Sprint 1: Revenue Visibility Dashboard

### Task 1.1: Financial Dashboard MVP + Revenue Tracking

**Status:** 🔴 Not Started

**Brief:**
Build a dashboard that shows Hendrik's money: daily revenue by source, monthly forecast, client count, runway.

**Requirements:**
- React + Vite dashboard (similar structure to CTO's energy dashboard)
- Pull revenue data:
  - Energy: Connect to CTO's InfluxDB (daily €/day)
  - Consultancy: Stripe API (completed transactions, pending)
  - Data products: Stripe API (recurring subscribers)
- Display metrics:
  - **Today's revenue** (big number, EUR)
  - **This month total** (vs. last month)
  - **MRR (Monthly Recurring Revenue)**
  - **Runway calculator** (if burn rate = 0, runway = infinite; else months until break-even)
  - **Client count** (total active consultancy clients)
- Responsive design (mobile-friendly)
- Auto-refresh: every 1 hour

**Deliverables:**
- Working React app (can run locally)
- Stripe SDK integration
- InfluxDB client (query energy revenue)
- Commit: `feat: financial dashboard MVP + revenue tracking`

**Acceptance Criteria:**
- App runs: `cd finance && npm install && npm run dev`
- Shows real Stripe transactions
- Shows real energy revenue (from CTO's InfluxDB)
- Dashboard updates hourly
- Error handling (if API down, show cached data)

**Effort:** 10-12 hours

**Notes:**
- Stripe API Key: ask Hendrik for test/live key
- InfluxDB connection: 192.168.1.100:8086 (check with CTO)
- Focus on accuracy over beauty — accountants need this data precise
- No auth yet (assume dashboard runs locally/privately)

---

### Task 1.2: Phantom Wallet Integration

**Status:** 🔴 Not Started

**Brief:**
Connect to user's Phantom wallet. Get USDC balance. Show in dashboard.

**Requirements:**
- Install `@solana/web3.js` + `@solana/wallet-adapter-phantom`
- Create `src/lib/wallet.js` — handle wallet connect/disconnect
- New component: `WalletCard` showing:
  - Wallet address (first 8 chars + last 4)
  - USDC balance (real-time)
  - Last payout date
  - "Connect Wallet" button
- Use Solana mainnet RPC (use free tier: QuickNode or Helius)
- Handle user connect/disconnect via Phantom's standard flow

**Deliverables:**
- Wallet adapter code (clean, documented)
- WalletCard component
- Commit: `feat: Phantom wallet integration + balance display`

**Acceptance Criteria:**
- User can click "Connect Wallet" → Phantom popup
- After auth, shows correct USDC balance
- Balance updates when refreshed
- Handles wallet disconnect gracefully
- No seed phrase or private keys ever shown in UI

**Effort:** 6-8 hours

**Notes:**
- Test on mainnet (real Phantom wallet, but no real transfers yet)
- USDC address (Solana mainnet): `EPjFWaLb3xlqexQpJ5tsVsvvqf3aenZombdtPFscKwq`
- Rate conversion: use CoinGecko API (free, no key)
- Solana RPC node: use Helius free tier (1 req/sec) or QuickNode

---

## Sprint 2: Manual Payouts

### Task 2.1: Payout Button + USDC Transfer

**Status:** ⏳ Backlog

**Brief:**
Add "Send to Wallet" button. User enters amount (EUR) → system converts to USDC → sends via Solana.

**Requirements:**
- Input field: enter amount in EUR
- Button: "Send to Wallet"
- Conversion logic:
  - Fetch EUR/USDC rate (CoinGecko API)
  - Show amount in USDC before confirm
  - Calculate Solana network fee (~0.00025 SOL ≈ €0.01)
- Payout transaction:
  - Sign with Phantom wallet (user approves in wallet app)
  - Send USDC to configured wallet address
  - Record transaction hash + timestamp to database
- Error handling:
  - Insufficient balance → show error
  - Network timeout → show error + retry button
  - Wallet rejected → show error

**Deliverables:**
- PayoutForm component (React)
- Solana transaction signing code
- Database transaction logging
- Commit: `feat: manual USDC payout button`

**Acceptance Criteria:**
- User can enter EUR amount
- Shows USDC equivalent + fee breakdown
- User clicks "Send" → Phantom popup for signature
- After approve: transaction goes to Solana
- Dashboard shows "pending" → "complete"
- Transaction logged in database with hash

**Effort:** 12-14 hours

**Notes:**
- Start in testnet (devnet) — don't send real money yet
- Use SPL token transfer (standard USDC transfer)
- Respect Phantom's built-in security (no custom signing logic)

---

### Task 2.2: Transaction History + Ledger

**Status:** ⏳ Backlog

**Brief:**
Show all USDC payouts (and inbound revenue) in a transaction log. Audit-ready.

**Requirements:**
- Table: date, source (consultancy/energy/data), amount (EUR), → payout amount (USDC), status (pending/complete), tx hash
- Sortable columns
- Filter: by source, by month, by status
- Export as CSV

**Deliverables:**
- TransactionLog component
- Database schema (PostgreSQL)
- CSV export
- Commit: `feat: transaction ledger + CSV export`

**Acceptance Criteria:**
- All revenue streams logged (Stripe + InfluxDB sourced)
- All payouts logged (Solana tx hash)
- User can export full history as CSV
- Data matches Stripe + Solana records

**Effort:** 8-10 hours

---

## Sprint 3: Auto-Payouts & Reporting

### Task 3.1: Auto-Payout Scheduler

**Status:** ⏳ Backlog

**Brief:**
Daily cron job: check Stripe balance. If > €500, auto-trigger payout to wallet.

**Requirements:**
- Daily scheduler (midnight UTC)
- Logic:
  - Query Stripe for pending balance
  - Subtract any pending payouts
  - If balance > threshold (€500): trigger payout
  - Else: log "no action"
- Send notification: email to Richard when auto-payout triggered
- Fallback: can manually approve/cancel from dashboard

**Deliverables:**
- Scheduler script (Node.js cron)
- Database tracking (which payouts auto vs. manual)
- Commit: `feat: auto-payout scheduler`

**Effort:** 6-8 hours

---

### Task 3.2: Monthly Financial Statement + Tax Report

**Status:** ⏳ Backlog

**Brief:**
Generate monthly PDF: revenue summary, expenses, net profit, wallet activity. Ready for accountant.

**Requirements:**
- PDF generator (Puppeteer or similar)
- Monthly statement shows:
  - Revenue by source (table)
  - Consultancy client list + fees
  - USDC transfers in/out
  - Net fiat profit
  - Tax basis (for Dutch accountant)
- Email to Richard on 1st of month

**Deliverables:**
- PDF generation script
- Email automation
- Commit: `feat: monthly financial statements`

**Effort:** 8-10 hours

---

## Metrics to Track

- [ ] Daily revenue (€/day)
- [ ] MRR (monthly recurring)
- [ ] Active clients (consultancy)
- [ ] Wallet balance (USDC)
- [ ] Total payouts (EUR)
- [ ] Runway (months to break-even)

---

## GitHub

Push to: https://github.com/HendrikdeKeyzer/hendrik-cfo

---

**Next:** Read CFO_BRIEFING.md, then start Task 1.1. Hendrik monitors your commits.
