import type { VoteFeedEntry } from "@/hooks/useVoteEvents";
import { OPTION_LABELS } from "@/lib/contract";

function truncate(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function EventFeed({ events }: { events: VoteFeedEntry[] }) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-4">
      <h2 className="text-sm font-medium text-foreground-dim">Recent votes</h2>
      <ul className="flex flex-col gap-1.5">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="font-mono text-foreground-dim">{truncate(event.voter)}</span>
            <span className="capitalize text-foreground">{OPTION_LABELS[event.option]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
