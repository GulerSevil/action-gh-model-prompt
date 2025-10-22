function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function renderHeading(text: string, level: number): string {
  const safeLevel = Math.min(6, Math.max(1, level));
  return `${"#".repeat(safeLevel)} ${text}`;
}

function toDisplayString(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatHeadingKey(rawKey: string): string {
  const withSpaces = String(rawKey).replace(/[\-_]/g, " ").trim();
  if (!withSpaces) return "";
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function renderGenericSection(key: string, value: any, level: number): string {
  const headingKey = formatHeadingKey(key);
  if (value === undefined) return "";
  if (!isPlainObject(value) && !Array.isArray(value)) {
    return `${renderHeading(headingKey, level)}\n${toDisplayString(value)}\n`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const allPrimitive = value.every((v) => !isPlainObject(v) && !Array.isArray(v));
    if (allPrimitive) {
      const bullets = value.map((v) => `- ${toDisplayString(v)}`).join("\n");
      return `${renderHeading(headingKey, level)}\n${bullets}\n`;
    }
    // Array of objects/mixed: render each entry as a subsection
    const sections = value.map((v, i) => renderGenericSection(`${key} ${i + 1}`, v, level + 1)).join("\n");
    return `${renderHeading(headingKey, level)}\n${sections}`;
  }
  // Plain object
  const entries = Object.entries(value);
  if (entries.length === 0) return "";
  const body = entries
    .map(([k, v]) => renderGenericSection(k, v, level + 1))
    .filter(Boolean)
    .join("\n");
  return `${renderHeading(headingKey, level)}\n${body}`;
}

function renderGenericMarkdown(parsed: any, rawMessage?: string): string {
  const header = `# Report\n`;
  const body = renderGenericSection("Data", parsed, 2);
  let out = header + (body ? `\n${body}\n` : "");
  try {
    out += `\n## Raw JSON\n\n` + "~~~json\n" + JSON.stringify(parsed, null, 2) + "\n~~~";
  } catch {}
  if (rawMessage) {
    out += `\n\n## Raw Message Content\n\n` + "~~~markdown\n" + rawMessage + "\n~~~";
  }
  return out;
}

export function renderMarkdownReport(parsed: unknown, rawMessage?: string): string {
  if (!parsed || typeof parsed !== "object") {
    if (rawMessage) {
      const header = `# Report\n`;
      return (
        header +
        `\n## Raw Message Content\n\n` +
        "~~~markdown\n" +
        rawMessage +
        "\n~~~"
      );
    }
    return "";
  }
  return renderGenericMarkdown(parsed, rawMessage);
}


