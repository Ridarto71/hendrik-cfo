/**
 * PayoutForm.tsx — Manual USDC payout form for Hendrik CFO Dashboard
 *
 * Features:
 * - EUR amount input with real-time USDC equivalent
 * - Network fee display (SOL + EUR)
 * - Confirmation modal with breakdown
 * - Status states: idle → confirming → signing → sending → success/error
 * - Transaction log on success
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { fetchEURtoUSDCRate } from '../lib/wallet';
import {
  sendUSDCPayout,
  fetchNetworkFee,
  logTransaction,
  updateTransactionLog,
  generateId,
  DEVNET_RPC,
} from '../lib/payout';

type Status = 'idle' | 'confirming' | 'signing' | 'sending' | 'success' | 'error';

const DEVNET_CONNECTION = new Connection(DEVNET_RPC, 'confirmed');

export function PayoutForm({ onTransactionComplete }: { onTransactionComplete?: () => void }) {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  const { connection: _mainnetConnection } = useConnection();

  const [eurAmount, setEurAmount] = useState<string>('');
  const [usdcRate, setUsdcRate] = useState<number>(1.0); // EUR → USDC rate
  const [solFee, setSolFee] = useState<number>(0.00025);
  const [solEurRate, setSolEurRate] = useState<number>(150); // 1 SOL ≈ €150 fallback
  const [status, setStatus] = useState<Status>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const eurNum = parseFloat(eurAmount) || 0;
  const usdcEquivalent = eurNum * usdcRate;

  const recipient =
    import.meta.env.VITE_PAYOUT_RECIPIENT ||
    (publicKey ? publicKey.toBase58() : '');

  // Fetch rates and fee estimate on mount
  const loadRates = useCallback(async () => {
    const [rate, fee] = await Promise.all([
      fetchEURtoUSDCRate(),
      fetchNetworkFee(DEVNET_CONNECTION),
    ]);
    setUsdcRate(rate);
    setSolFee(fee);

    // Fetch SOL/EUR price for fee display
    try {
      const resp = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur'
      );
      if (resp.ok) {
        const data = await resp.json();
        const price = data?.solana?.eur;
        if (price && price > 0) setSolEurRate(price);
      }
    } catch {
      // keep fallback
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const feeInEur = solFee * solEurRate;

  const canSend =
    connected &&
    publicKey &&
    eurNum > 0 &&
    recipient.length > 0;

  const handleOpenConfirm = () => {
    if (!canSend) return;
    setStatus('confirming');
    setErrorMsg(null);
  };

  const handleCancel = () => {
    setStatus('idle');
  };

  const handleConfirm = async () => {
    if (!canSend || !publicKey) return;

    const entryId = generateId();
    const entry = {
      id: entryId,
      timestamp: new Date().toISOString(),
      eurAmount: eurNum,
      usdcAmount: usdcEquivalent,
      solFee,
      signature: '',
      status: 'pending' as const,
      recipient,
    };
    logTransaction(entry);

    setStatus('signing');

    try {
      setStatus('sending');
      const { signature } = await sendUSDCPayout(
        DEVNET_CONNECTION,
        wallet,
        recipient,
        usdcEquivalent
      );

      updateTransactionLog(entryId, { signature, status: 'complete' });
      setTxSignature(signature);
      setStatus('success');
      setEurAmount('');
      onTransactionComplete?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateTransactionLog(entryId, { status: 'failed' });

      // User rejection
      if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('cancelled')) {
        setErrorMsg('Transaction cancelled by user.');
      } else if (msg.toLowerCase().includes('insufficient')) {
        setErrorMsg('Insufficient USDC balance for this payout.');
      } else if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('timed out')) {
        setErrorMsg('Network timeout. Please try again.');
      } else {
        setErrorMsg(msg || 'Transaction failed.');
      }
      setStatus('error');
      onTransactionComplete?.();
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMsg(null);
    setTxSignature(null);
  };

  const truncateSig = (sig: string) => `${sig.slice(0, 8)}…${sig.slice(-8)}`;

  // ── Styles ────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 24px',
    flex: 1,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: 20,
    fontWeight: 600,
    color: '#1f2937',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const primaryBtn: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginTop: 16,
    opacity: canSend ? 1 : 0.4,
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 14,
    padding: '28px 32px',
    maxWidth: 380,
    width: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 22 }}>💸</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Manual Payout</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Send USDC · Devnet</div>
          </div>
        </div>

        {/* EUR input */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Amount (EUR)</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 18, fontWeight: 700, color: '#6b7280',
            }}>€</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={eurAmount}
              onChange={e => setEurAmount(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30 }}
            />
          </div>
          {/* USDC equivalent */}
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
            ≈{' '}
            <span style={{ fontWeight: 600, color: '#1f2937' }}>
              {usdcEquivalent > 0
                ? `${usdcEquivalent.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                : '— USDC'}
            </span>
          </div>
        </div>

        {/* Network fee */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: '#6b7280',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Network fee (est.)</span>
            <span style={{ fontWeight: 600, color: '#374151' }}>
              {solFee} SOL ≈ €{feeInEur.toFixed(4)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span>Recipient</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>
              {recipient ? `${recipient.slice(0, 8)}…${recipient.slice(-4)}` : '—'}
            </span>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleOpenConfirm}
          disabled={!canSend}
          style={primaryBtn}
        >
          {connected ? 'Send to Wallet' : 'Connect wallet to send'}
        </button>
      </div>

      {/* Confirmation modal */}
      {status === 'confirming' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1f2937', marginBottom: 20 }}>
              Confirm Payout
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <Row label="Amount (EUR)" value={`€${eurNum.toFixed(2)}`} />
              <Row label="Amount (USDC)" value={`${usdcEquivalent.toFixed(2)} USDC`} bold />
              <Row label="Network fee" value={`${solFee} SOL (≈ €${feeInEur.toFixed(4)})`} />
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                <Row label="Recipient" value={`${recipient.slice(0, 10)}…${recipient.slice(-6)}`} mono />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', fontSize: 14, cursor: 'pointer', color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signing / sending state */}
      {(status === 'signing' || status === 'sending') && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              {status === 'signing' ? '✍️' : '🚀'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1f2937', marginBottom: 8 }}>
              {status === 'signing' ? 'Waiting for signature…' : 'Sending transaction…'}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {status === 'signing'
                ? 'Approve the transaction in Phantom'
                : 'Broadcasting to Solana devnet'}
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && txSignature && (
        <div style={overlayStyle} onClick={() => setStatus('idle')}>
          <div style={{ ...modalStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1f2937', marginBottom: 8 }}>
              Payout Sent!
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Transaction confirmed on devnet
            </div>
            <div style={{
              background: '#f3f4f6', borderRadius: 8, padding: '8px 12px',
              fontSize: 12, fontFamily: 'monospace', color: '#374151',
              marginBottom: 16, wordBreak: 'break-all',
            }}>
              {truncateSig(txSignature)}
            </div>
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', fontSize: 13, color: '#2563eb',
                textDecoration: 'none', marginBottom: 20,
              }}
            >
              View on Solana Explorer →
            </a>
            <button
              onClick={() => setStatus('idle')}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                background: '#1f2937', color: '#fff', fontSize: 14, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1f2937', marginBottom: 8 }}>
              Transaction Failed
            </div>
            <div style={{
              fontSize: 13, color: '#ef4444', marginBottom: 20,
              background: '#fef2f2', borderRadius: 8, padding: '10px 14px',
            }}>
              {errorMsg}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStatus('idle')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', fontSize: 14, cursor: 'pointer', color: '#374151',
                }}
              >
                Close
              </button>
              <button
                onClick={handleRetry}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: '#1f2937', color: '#fff', fontSize: 14, cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{
        fontWeight: bold ? 700 : 500,
        color: '#1f2937',
        fontFamily: mono ? 'monospace' : undefined,
        fontSize: mono ? 12 : undefined,
      }}>
        {value}
      </span>
    </div>
  );
}
