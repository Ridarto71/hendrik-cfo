# Hendrik CFO — Financial Operations & Wallet Management

AI-driven finance engine for Hendrik. Tracks revenue, manages USDC wallet via Phantom, and automates payouts.

## Quick Start

```bash
cd hendrik-cfo
npm install
npm run dev
```

## Project Structure

```
/
├── finance/         # Financial dashboard (React)
├── wallet/          # Phantom wallet integration (Solana RPC + wallet adapter)
├── revenue/         # Revenue tracking (energy sales, consultancy, data)
├── integrations/    # APIs (Stripe, payment providers, Solana RPC)
├── scripts/         # Automation (payouts, reconciliation)
└── utils/           # Shared utilities (crypto, accounting)
```

## Current Sprints

- [ ] Sprint 1: Financial dashboard + revenue tracking
- [ ] Sprint 2: Phantom wallet integration (USDC transfers)
- [ ] Sprint 3: Auto-payouts + reconciliation

## How We Work

**Same workflow as hendrik-cto:**
1. Hendrik briefs via git commits/issues
2. Claude Code reads, builds, commits back
3. Hendrik reviews, auto-deploys or sends feedback

## Tech Stack

- **Dashboard:** Node.js + React + InfluxDB
- **Wallet:** Solana SDK + Phantom wallet adapter
- **Payments:** Stripe API (in) + Solana RPC (out)
- **Database:** PostgreSQL (financial records)
- **Deployment:** GitHub Actions → Vercel / Docker

## Team

- **Richard** — Owner, approvals
- **Hendrik** — Operations, task briefs
- **Claude Code** — Engineering (CTO + CFO)

---

**Status:** Pre-MVP. Building Sprint 1.
