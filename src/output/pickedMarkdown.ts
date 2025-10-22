export function renderPickedMarkdown(picked: unknown): string | undefined {
  if (picked === undefined || picked === null) return undefined;
  if (Array.isArray(picked)) {
    return picked.map((v) => `- ${typeof v === "string" ? v : JSON.stringify(v)}`).join("\n");
  }
  if (typeof picked === "object") {
    const entries = Object.entries(picked as Record<string, unknown>);
    if (entries.length === 0) return undefined;
    return entries
      .map(([sel, val]) => {
        if (Array.isArray(val)) {
          const bullets = val.map((v) => `- ${typeof v === "string" ? v : JSON.stringify(v)}`).join("\n");
          return `### ${sel}\n${bullets}`;
        }
        return `### ${sel}\n${typeof val === "string" ? val : JSON.stringify(val)}`;
      })
      .join("\n\n");
  }
  // primitive
  return String(picked);
}


