import { OPTION_LABELS } from "@/lib/contract";

interface PollCardProps {
  connected: boolean;
  hasVoted: boolean;
  onVote?: (option: number) => void;
  voting?: boolean;
}

export function PollCard({ connected, hasVoted, onVote, voting }: PollCardProps) {
  const disabled = !connected || hasVoted || !onVote || voting;

  let hint: string | null = null;
  if (!connected) hint = "Connect a wallet to vote.";
  else if (hasVoted) hint = "This address has already voted.";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface px-4 py-5">
      <h1 className="text-lg font-semibold text-foreground">Best racquet sport?</h1>
      <div className="flex flex-col gap-2">
        {OPTION_LABELS.map((label, option) => (
          <button
            key={label}
            onClick={() => onVote?.(option)}
            disabled={disabled}
            className="rounded-md border border-border px-4 py-2.5 text-left capitalize text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
          >
            {label}
          </button>
        ))}
      </div>
      {hint && <p className="text-sm text-foreground-dim">{hint}</p>}
    </div>
  );
}
