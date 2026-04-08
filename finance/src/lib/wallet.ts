/**
 * wallet.ts — Phantom wallet integration for Hendrik CFO Dashboard
 *
 * Handles:
 * - Wallet connect / disconnect via Phantom adapter
 * - USDC balance fetch (Solana mainnet)
 * - EUR conversion via CoinGecko free API
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Solana mainnet-beta RPC (Helius free tier recommended; fallback to public)
export const RPC_ENDPOINT =
  import.meta.env.VITE_HELIUS_RPC_URL ||
  'https://api.mainnet-beta.solana.com';

// USDC SPL token mint address (Solana mainnet)
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Solana connection (singleton)
export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

/**
 * Formats a wallet public key: first 8 chars + "…" + last 4 chars
 */
export function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

/**
 * Fetch USDC balance for a given wallet address.
 * Returns balance in USDC (floating point).
 */
export async function fetchUSDCBalance(walletAddress: string): Promise<number> {
  const owner = new PublicKey(walletAddress);
  const mint = new PublicKey(USDC_MINT);

  // Find associated token account(s)
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });

  if (tokenAccounts.value.length === 0) return 0;

  // Sum all token accounts (usually just one)
  let total = 0;
  for (const account of tokenAccounts.value) {
    const amount = account.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    total += amount;
  }

  return total;
}

/**
 * Fetch last USDC received transaction date.
 * Returns ISO date string or null if no transactions found.
 */
export async function fetchLastPayoutDate(walletAddress: string): Promise<string | null> {
  try {
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(USDC_MINT);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });

    if (tokenAccounts.value.length === 0) return null;

    const tokenAccountAddress = tokenAccounts.value[0].pubkey;
    const signatures = await connection.getSignaturesForAddress(tokenAccountAddress, { limit: 1 });

    if (signatures.length === 0) return null;

    const blockTime = signatures[0].blockTime;
    if (!blockTime) return null;

    return new Date(blockTime * 1000).toISOString();
  } catch {
    return null;
  }
}

/**
 * Fetch EUR/USDC conversion rate from CoinGecko (free, no API key).
 * Returns how many USDC = 1 EUR (approximately 1:1 since USDC ≈ $1).
 */
export async function fetchEURtoUSDCRate(): Promise<number> {
  try {
    const resp = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur'
    );
    if (!resp.ok) return 1.0;
    const data = await resp.json();
    const usdcInEur: number = data?.['usd-coin']?.eur ?? 0;
    if (!usdcInEur || usdcInEur <= 0) return 1.0;
    // EUR → USDC rate = 1 / (EUR value of 1 USDC)
    return 1 / usdcInEur;
  } catch {
    return 1.0; // fallback: 1 EUR ≈ 1 USDC
  }
}
