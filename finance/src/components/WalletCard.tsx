/**
 * WalletCard.tsx — Phantom wallet connect + USDC balance display
 *
 * Shows:
 * - Wallet address (truncated)
 * - USDC balance (real-time)
 * - EUR equivalent (CoinGecko rate)
 * - Last payout date
 * - Connect / Disconnect button
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { fetchUSDCBalance, fetchLastPayoutDate, fetchEURtoUSDCRate, formatAddress } from '../lib/wallet';

interface WalletState {
  usdcBalance: number | null;
  eurBalance: number | null;
  lastPayout: string | null;
  loading: boolean;
  error: string | null;
}

export function WalletCard() {
  const { publicKey, connected, disconnect } = useWallet();

  const [state, setState] = useState<WalletState>({
    usdcBalance: null,
    eurBalance: null,
    lastPayout: null,
    loading: false,
    error: null,
  });

  const loadWalletData = useCallback(async () => {
    if (!publicKey) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const address = publicKey.toBase58();
      const [usdcBalance, lastPayout, eurRate] = await Promise.all([
        fetchUSDCBalance(address),
        fetchLastPayoutDate(address),
        fetchEURtoUSDCRate(),
      ]);

      // Convert USDC to EUR: USDC / eurRate
      const eurBalance = eurRate > 0 ? usdcBalance / eurRate : usdcBalance;

      setState({
        usdcBalance,
        eurBalance,
        lastPayout,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: e?.message || 'Failed to load wallet data',
      }));
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      loadWalletData();
    } else {
      setState({ usdcBalance: null, eurBalance: null, lastPayout: null, loading: false, error: null });
    }
  }, [connected, publicKey, loadWalletData]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatUSDC = (n: number | null) => {
    if (n === null) return '—';
    return `${n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
  };

  const formatEUR = (n: number | null) => {
    if (n === null) return '—';
    return `≈ €${n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '20px 24px',
      minWidth: 260,
      flex: 1,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>👻</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Phantom Wallet</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>USDC on Solana</div>
          </div>
        </div>
        {/* Status dot */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: connected ? '#10b981' : '#e5e7eb',
          boxShadow: connected ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
        }} />
      </div>

      {/* Wallet address */}
      {connected && publicKey && (
        <div style={{
          background: '#f3f4f6',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 13,
          fontFamily: 'monospace',
          color: '#374151',
          wordBreak: 'break-all',
        }}>
          {formatAddress(publicKey.toBase58())}
        </div>
      )}

      {/* Balance */}
      {connected ? (
        <div>
          {state.loading ? (
            <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 12 }}>⏳ Loading balance…</div>
          ) : state.error ? (
            <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠️ {state.error}</div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', lineHeight: 1.1 }}>
                {formatUSDC(state.usdcBalance)}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                {formatEUR(state.eurBalance)}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                Last payout: {formatDate(state.lastPayout)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={loadWalletData}
              disabled={state.loading}
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 13,
                cursor: state.loading ? 'not-allowed' : 'pointer',
                color: '#374151',
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => disconnect()}
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 13,
                cursor: 'pointer',
                color: '#991b1b',
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
            Connect your Phantom wallet to view your USDC balance and payout history.
          </p>
          {/* Phantom connect button via wallet adapter */}
          <WalletMultiButton style={{
            background: 'linear-gradient(135deg, #512da8 0%, #7b1fa2 100%)',
            borderRadius: 8,
            fontSize: 14,
            padding: '8px 16px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }} />
        </div>
      )}
    </div>
  );
}
