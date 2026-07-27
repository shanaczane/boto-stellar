"use client";

import { useEffect, useRef, useState } from "react";
import { nativeToScVal, rpc, scValToNative } from "@stellar/stellar-sdk";
import { CONTRACT_ID, RPC_URL } from "@/lib/contract";

const VOTE_TOPIC = nativeToScVal("vote", { type: "symbol" }).toXDR("base64");
const POLL_INTERVAL_MS = 5000;
const MAX_FEED_LENGTH = 5;

export interface VoteFeedEntry {
  id: string;
  ledger: number;
  txHash: string;
  voter: string;
  option: number;
}

export function useVoteEvents(onNewVotes: () => void) {
  const [events, setEvents] = useState<VoteFeedEntry[]>([]);
  const [live, setLive] = useState(false);
  const onNewVotesRef = useRef(onNewVotes);
  useEffect(() => {
    onNewVotesRef.current = onNewVotes;
  }, [onNewVotes]);

  useEffect(() => {
    const server = new rpc.Server(RPC_URL);
    // Testnet RPC only retains a limited event window, so on load we start
    // from the latest ledger rather than trying to backfill history.
    let cursor: string | null = null;
    let cancelled = false;

    const filters: rpc.Api.EventFilter[] = [
      { type: "contract", contractIds: [CONTRACT_ID], topics: [[VOTE_TOPIC]] },
    ];

    async function poll() {
      try {
        const response = cursor
          ? await server.getEvents({ filters, cursor })
          : await server.getEvents({
              filters,
              startLedger: (await server.getLatestLedger()).sequence,
            });

        if (cancelled) return;
        cursor = response.cursor;
        setLive(true);

        if (response.events.length > 0) {
          const decoded = response.events.map((event): VoteFeedEntry => {
            const [voter, option] = scValToNative(event.value) as [string, number];
            return { id: event.id, ledger: event.ledger, txHash: event.txHash, voter, option };
          });
          setEvents((prev) => [...decoded.reverse(), ...prev].slice(0, MAX_FEED_LENGTH));
          onNewVotesRef.current();
        }
      } catch {
        if (!cancelled) setLive(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { events, live };
}
