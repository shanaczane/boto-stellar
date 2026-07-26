"use client";

import { useCallback, useEffect, useState } from "react";
import { KitEventType, StellarWalletsKit, initWalletKit } from "@/lib/walletKit";

interface WalletState {
  address: string | null;
  walletId: string | null;
}

export function useWallet() {
  const [{ address, walletId }, setState] = useState<WalletState>({
    address: null,
    walletId: null,
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initWalletKit();

    // These fire immediately on subscribe with the kit's persisted session,
    // so a previously connected wallet reappears without any manual storage.
    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      setState((s) => ({ ...s, address: event.payload.address ?? null }));
    });
    const unsubSelected = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event) => {
      setState((s) => ({ ...s, walletId: event.payload.id ?? null }));
    });
    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setState({ address: null, walletId: null });
    });

    return () => {
      unsubState();
      unsubSelected();
      unsubDisconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      await StellarWalletsKit.authModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect();
  }, []);

  return { address, walletId, connecting, error, connect, disconnect };
}
