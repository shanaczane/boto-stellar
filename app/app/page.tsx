"use client";

import { useCallback, useState } from "react";
import { EventFeed } from "@/components/EventFeed";
import { PollCard } from "@/components/PollCard";
import { ResultsBar } from "@/components/ResultsBar";
import { TxStatus } from "@/components/TxStatus";
import { WalletBar } from "@/components/WalletBar";
import { useWallet } from "@/hooks/useWallet";
import { usePollResults } from "@/hooks/usePollResults";
import { useVoteEvents } from "@/hooks/useVoteEvents";
import { StellarWalletsKit } from "@/lib/walletKit";
import { submitVote, type VoteStatus } from "@/lib/contract";

export default function Home() {
  const { address } = useWallet();
  const { results, hasVoted, refresh } = usePollResults(address);
  const { events, live } = useVoteEvents(refresh);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);

  const voting = voteStatus?.state === "simulating" || voteStatus?.state === "pending";

  const handleVote = useCallback(
    async (option: number) => {
      if (!address) return;
      await submitVote(address, option, StellarWalletsKit.signTransaction, (status) => {
        setVoteStatus(status);
        if (status.state === "success") refresh();
      });
    },
    [address, refresh],
  );

  return (
    <div className="flex flex-1 justify-center px-4 py-10">
      <main className="flex w-full max-w-md flex-col gap-4">
        <WalletBar />
        <PollCard
          connected={!!address}
          hasVoted={hasVoted}
          onVote={handleVote}
          voting={voting}
        />
        <ResultsBar results={results} live={live} />
        <TxStatus status={voteStatus} />
        <EventFeed events={events} />
      </main>
    </div>
  );
}
