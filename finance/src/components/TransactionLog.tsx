/**
 * TransactionLog.tsx — USDC payout transaction history
 *
 * Reads from localStorage (payout_log key) and displays last 10 entries.
 */

import { useState, useEffect, useCallback } from 'react';
import { getTransactionLog, clearTransactionLog } from '../lib/payout';
import type { TransactionLogEntry } from '../lib/payout';

export function TransactionLog({ refreshTrigger }: { refreshTrigger?: number }) {
  const [entries, setEntries] = useState<TransactionLogEntry[]>([]);

  const load = useCallback(() => {
    setEntries(getTransactionLog().slice(0, 10));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const handleClear = () => {
    clearTransactionLog();
    setEntries([]);
  };

  const statusBadge = (status: TransactionLogEntry['status']) => {
    if (status === 'complete') return { icon: '✅', label: 'Complete', color: '#10b981', bg: '#d1fae5' };
    if (status === 'failed') return { icon: '❌', label: 'Failed', color: '#ef4444', bg: '#fee2e2' };
    return { icon: '🟡', label: 'Pending', color: '#f59e0b', bg: '#fef3c7' };
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('nl-NL', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });

  const truncateSig = (sig: string) => {
    if (!sig) return '—';
    return `${sig.slice(0, 6)}…${sig.slice(-6)}`;
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Payout History</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Last {entries.length} transactions</div>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 12,
              cursor: 'pointer',
              color: '#991b1b',
            }}
          >
            Clear History
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 0',
          fontSize: 13, color: '#9ca3af',
        }}>
          No payout transactions yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: 13, color: '#374151',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Date', 'EUR', 'USDC', 'Fee (SOL)', 'Status', 'Tx Hash'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '6px 8px',
                    fontSize: 11, fontWeight: 600, color: '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const badge = statusBadge(entry.status);
                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: i < entries.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    <td style={{ padding: '8px 8px', whiteSpace: 'nowrap', color: '#6b7280' }}>
                      {formatDate(entry.timestamp)}
                    </td>
                    <td style={{ padding: '8px 8px', fontWeight: 600 }}>
                      €{entry.eurAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      {entry.usdcAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 8px', color: '#6b7280' }}>
                      {entry.solFee}
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{
                        background: badge.bg,
                        color: badge.color,
                        borderRadius: 20,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      {entry.signature ? (
                        <a
                          href={`https://explorer.solana.com/tx/${entry.signature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#2563eb', textDecoration: 'none',
                            fontFamily: 'monospace', fontSize: 12,
                          }}
                          title={entry.signature}
                        >
                          {truncateSig(entry.signature)}
                        </a>
                      ) : (
                        <span style={{ color: '#d1d5db', fontFamily: 'monospace', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
