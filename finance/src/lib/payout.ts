/**
 * payout.ts — USDC payout logic for Hendrik CFO Dashboard
 *
 * Handles SPL token transfers on Solana DEVNET:
 * - Build + send USDC transfer via Phantom wallet
 * - Network fee estimation
 * - Transaction log (localStorage)
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { WalletContextState } from '@solana/wallet-adapter-react';

// Solana DEVNET
export const DEVNET_RPC = 'https://api.devnet.solana.com';

// Circle USDC on devnet
export const DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

// USDC has 6 decimal places
const USDC_DECIMALS = 6;

const LOG_KEY = 'payout_log';

export interface TransactionLogEntry {
  id: string;
  timestamp: string;
  eurAmount: number;
  usdcAmount: number;
  solFee: number;
  signature: string;
  status: 'pending' | 'complete' | 'failed';
  recipient: string;
}

/**
 * Send USDC from the connected wallet to a recipient on devnet.
 * Returns { signature }.
 */
export async function sendUSDCPayout(
  connection: Connection,
  wallet: WalletContextState,
  recipientAddress: string,
  usdcAmount: number
): Promise<{ signature: string }> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error('Wallet not connected');
  }

  const senderPubkey = wallet.publicKey;
  const recipientPubkey = new PublicKey(recipientAddress);
  const mintPubkey = new PublicKey(DEVNET_USDC_MINT);

  // Derive associated token accounts
  const senderTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    senderPubkey
  );
  const recipientTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    recipientPubkey
  );

  // Amount in raw units (USDC has 6 decimals)
  const rawAmount = Math.round(usdcAmount * Math.pow(10, USDC_DECIMALS));

  const instruction = createTransferInstruction(
    senderTokenAccount,
    recipientTokenAccount,
    senderPubkey,
    rawAmount,
    [],
    TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction().add(instruction);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = senderPubkey;

  const signature = await wallet.sendTransaction(transaction, connection);

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed'
  );

  return { signature };
}

/**
 * Estimate network fee in SOL. Returns ~0.00025 based on typical SPL transfer cost.
 */
export async function fetchNetworkFee(_connection: Connection): Promise<number> {
  // SPL token transfer typically costs ~5000 lamports = 0.000005 SOL base fee
  // Plus ~0.00025 SOL for rent-exempt ATA creation if needed
  return 0.00025;
}

/**
 * Save a transaction log entry to localStorage.
 */
export function logTransaction(entry: TransactionLogEntry): void {
  const existing = getTransactionLog();
  existing.unshift(entry);
  localStorage.setItem(LOG_KEY, JSON.stringify(existing));
}

/**
 * Update an existing log entry by id.
 */
export function updateTransactionLog(
  id: string,
  updates: Partial<TransactionLogEntry>
): void {
  const existing = getTransactionLog();
  const idx = existing.findIndex(e => e.id === id);
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], ...updates };
    localStorage.setItem(LOG_KEY, JSON.stringify(existing));
  }
}

/**
 * Read transaction log from localStorage.
 */
export function getTransactionLog(): TransactionLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TransactionLogEntry[];
  } catch {
    return [];
  }
}

/**
 * Clear all transaction log entries.
 */
export function clearTransactionLog(): void {
  localStorage.removeItem(LOG_KEY);
}

/**
 * Generate a simple unique id.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
