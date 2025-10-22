export function pickByDotPath(input: unknown, selector: string): unknown {
  if (!selector) return undefined;
  const path = selector.replace(/^\./, "");
  const segments = path.split(".").flatMap((segment) => {
    const parts: string[] = [];
    const regex = /([^\[]+)|(\[(\d+)\])/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(segment)) !== null) {
      if (match[1]) parts.push(match[1]);
      if (match[3]) parts.push(match[3]);
    }
    return parts;
  });

  let current: any = input;
  for (const seg of segments) {
    if (current == null) return undefined;
    const index = Number(seg);
    if (!Number.isNaN(index) && String(index) === seg) {
      current = Array.isArray(current) ? current[index] : undefined;
    } else {
      current = typeof current === "object" && current !== null ? (current as Record<string, unknown>)[seg] : undefined;
    }
  }
  return current;
}

export function aggregatePickedValues(
  values: string[],
  mode: "none" | "first" | "join" | "worst_severity" | undefined,
  worstSeverityFn: (arr: string[]) => string,
): string | undefined {
  if (!values || values.length === 0) return undefined;
  const agg = mode || "none";
  if (agg === "first") return values[0];
  if (agg === "join") return values.join("\n");
  if (agg === "worst_severity") return worstSeverityFn(values);
  return undefined;
}

export function splitSelectors(jqPick: string): string[] {
  if (!jqPick) return [];
  // Comma-separated list of selectors; trim whitespace; ignore empty
  return jqPick
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function pickByDotPaths(input: unknown, jqPick: string): unknown {
  const selectors = splitSelectors(jqPick);
  if (selectors.length <= 1) {
    const sel = selectors[0] ?? jqPick;
    return pickByDotPath(input, sel);
  }
  const out: Record<string, unknown> = {};
  for (const sel of selectors) {
    const val = pickByDotPath(input, sel);
    if (val !== undefined) out[sel] = val as unknown;
  }
  return out;
}
