export function severityRank(value: string): number {
  const v = (value || "").toLowerCase();
  if (v === "block") return 3;
  if (v === "high") return 2;
  if (v === "medium") return 1;
  if (v === "low") return 0;
  return -1;
}

export function worstSeverity(values: string[]): string {
  let best = values[0];
  let bestRank = severityRank(best);
  for (const v of values.slice(1)) {
    const r = severityRank(v);
    if (r > bestRank) {
      best = v;
      bestRank = r;
    }
  }
  return best;
}


