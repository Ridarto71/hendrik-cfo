/**
 * WalletProvider.tsx — Solana wallet adapter context provider
 *
 * Wraps the app with Phantom wallet adapter so any component can
 * use useWallet() to access connection state and public key.
 */

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { RPC_ENDPOINT } from './lib/wallet';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: React.ReactNode;
}

export function SolanaWalletProvider({ children }: Props) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
