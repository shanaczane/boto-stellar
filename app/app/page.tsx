"use client";

import { useCallback, useState } from "react";
import { PollCard } from "@/components/PollCard";
import { ResultsBar } from "@/components/ResultsBar";
import { TxStatus } from "@/components/TxStatus";
import { WalletBar } from "@/components/WalletBar";
import { useWallet } from "@/hooks/useWallet";
import { usePollResults } from "@/hooks/usePollResults";
import { StellarWalletsKit } from "@/lib/walletKit";
import { submitVote, type VoteStatus } from "@/lib/contract";

export default function Home() {
  const { address } = useWallet();
  const { results, hasVoted, loading, refresh } = usePollResults(address);
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
        <ResultsBar results={results} loading={loading} />
        <TxStatus status={voteStatus} />
      </main>
    </div>
  );
}
