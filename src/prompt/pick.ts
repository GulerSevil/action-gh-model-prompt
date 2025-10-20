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
