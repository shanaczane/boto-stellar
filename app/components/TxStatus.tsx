import type { VoteStatus } from "@/lib/contract";

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

function ExplorerLink({ hash }: { hash: string }) {
  return (
    <a
      href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-accent underline underline-offset-2"
    >
      {truncateHash(hash)}
    </a>
  );
}

export function TxStatus({ status }: { status: VoteStatus | null }) {
  if (!status) return null;

  switch (status.state) {
    case "simulating":
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground-dim">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground-dim" />
          Simulating transaction…
        </div>
      );
    case "pending":
      return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground-dim">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Waiting for confirmation…
          </span>
          <ExplorerLink hash={status.hash} />
        </div>
      );
    case "success":
      return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-accent/40 bg-surface px-4 py-3 text-sm text-accent">
          <span>Vote confirmed</span>
          <ExplorerLink hash={status.hash} />
        </div>
      );
    case "error":
      return (
        <div className="rounded-lg border border-secondary/40 bg-surface px-4 py-3 text-sm text-secondary">
          {status.message}
        </div>
      );
  }
}
