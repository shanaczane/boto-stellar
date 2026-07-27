import { OPTION_LABELS } from "@/lib/contract";

interface ResultsBarProps {
  results: number[] | null;
  live: boolean;
}

export function ResultsBar({ results, live }: ResultsBarProps) {
  const counts = results ?? [0, 0, 0];
  const total = counts.reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground-dim">Results</h2>
        {live && (
          <span className="flex items-center gap-1 text-xs text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            live
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {OPTION_LABELS.map((label, i) => {
          const count = counts[i] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-foreground">{label}</span>
                <span className="font-mono text-foreground-dim">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
