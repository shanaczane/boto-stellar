"use client";

import { useWallet } from "@/hooks/useWallet";

function truncate(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletBar() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground-dim">Boto — Live Poll</span>
        {address ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-accent">{truncate(address)}</span>
            <button
              onClick={disconnect}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground-dim transition hover:border-secondary hover:text-secondary"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={connecting}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
      {error && <span className="text-sm text-secondary">{error}</span>}
    </div>
  );
}
