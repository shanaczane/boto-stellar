"use client";

import { PollCard } from "@/components/PollCard";
import { ResultsBar } from "@/components/ResultsBar";
import { WalletBar } from "@/components/WalletBar";
import { useWallet } from "@/hooks/useWallet";
import { usePollResults } from "@/hooks/usePollResults";

export default function Home() {
  const { address } = useWallet();
  const { results, hasVoted, loading } = usePollResults(address);

  return (
    <div className="flex flex-1 justify-center px-4 py-10">
      <main className="flex w-full max-w-md flex-col gap-4">
        <WalletBar />
        <PollCard connected={!!address} hasVoted={hasVoted} />
        <ResultsBar results={results} loading={loading} />
      </main>
    </div>
  );
}
