"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchHasVoted, fetchResults } from "@/lib/contract";

export function usePollResults(voterAddress: string | null) {
  const [results, setResults] = useState<number[] | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextResults, nextHasVoted] = await Promise.all([
        fetchResults(),
        voterAddress ? fetchHasVoted(voterAddress) : Promise.resolve(false),
      ]);
      setResults(nextResults);
      setHasVoted(nextHasVoted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load poll results");
    } finally {
      setLoading(false);
    }
  }, [voterAddress]);

  useEffect(() => {
    // Fetch-on-mount + interval polling (added in Phase 5) isn't expressible
    // without setState reaching back from an effect; that's the pattern here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { results, hasVoted, loading, error, refresh };
}
