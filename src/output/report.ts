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

function renderGenericSection(key: string, value: any, level: number): string {
  if (value === undefined) return "";
  if (!isPlainObject(value) && !Array.isArray(value)) {
    return `${renderHeading(key, level)}\n${toDisplayString(value)}\n`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const allPrimitive = value.every((v) => !isPlainObject(v) && !Array.isArray(v));
    if (allPrimitive) {
      const bullets = value.map((v) => `- ${toDisplayString(v)}`).join("\n");
      return `${renderHeading(key, level)}\n${bullets}\n`;
    }
    // Array of objects/mixed: render each entry as a subsection
    const sections = value.map((v, i) => renderGenericSection(`${key} ${i + 1}`, v, level + 1)).join("\n");
    return `${renderHeading(key, level)}\n${sections}`;
  }
  // Plain object
  const entries = Object.entries(value);
  if (entries.length === 0) return "";
  const body = entries
    .map(([k, v]) => renderGenericSection(k.replace(/_/g, " "), v, level + 1))
    .filter(Boolean)
    .join("\n");
  return `${renderHeading(key, level)}\n${body}`;
}

function renderGenericMarkdown(parsed: any): string {
  const header = `# Report\n`;
  const body = renderGenericSection("Data", parsed, 2);
  let out = header + (body ? `\n${body}\n` : "");
  try {
    out += `\n## Raw JSON\n\n` + "```json\n" + JSON.stringify(parsed, null, 2) + "\n```";
  } catch {}
  return out;
}

export function renderMarkdownReport(parsed: any): string {
  if (!parsed || typeof parsed !== "object") return "";

  const hasKnownSchema =
    isPlainObject(parsed) && (
      Object.prototype.hasOwnProperty.call(parsed, "detailed_analysis") ||
      Object.prototype.hasOwnProperty.call(parsed, "analysis") ||
      Object.prototype.hasOwnProperty.call(parsed, "json_summary")
    );

  if (!hasKnownSchema) {
    return renderGenericMarkdown(parsed);
  }

  // Specialized rendering for known risk-report schemas
  const da = (parsed as any).detailed_analysis || (parsed as any).analysis || {};
  const es = da.executive_summary || {};
  const js = (parsed as any).json_summary || {};

  const bullet = (arr: any[]) => Array.isArray(arr) ? arr.map((x) => `- ${String(x)}`).join("\n") : "";

  const topFindings = Array.isArray(es.top_findings)
    ? es.top_findings.map((f: any) => {
        if (typeof f === "string") return `- ${f}`;
        return `- [${f.severity ?? ""}] ${f.file ?? ""}: ${f.description ?? ""}`;
      }).join("\n")
    : "";

  const criticalArray = Array.isArray(da.critical_issues) ? da.critical_issues : [];
  const criticalIssues = criticalArray
    .map((i: any) => {
      if (typeof i === "string") return `- ${i}`;
      return `- [${i.severity ?? ""}] ${i.file ?? ""}: ${i.description ?? ""}`;
    })
    .join("\n");

  const filesOfConcern = bullet(js.files_of_concern || []);
  const impactedAreas = bullet(js.impacted_areas || []);
  const mustTests = bullet(js.must_tests || []);
  const mitigations = bullet(js.mitigations || []);

  const header = `# Risk Report\n`;
  const summary = `\n**Risk**: ${es.risk ?? ""}  \n**Verdict**: ${es.verdict ?? ""}\n`;
  const findings = topFindings ? `\n## Top Findings\n${topFindings}\n` : "";
  const crit = criticalIssues ? `\n## Critical Issues\n${criticalIssues}\n` : "";
  const files = filesOfConcern ? `\n## Files of Concern\n${filesOfConcern}\n` : "";
  const areas = impactedAreas ? `\n## Impacted Areas\n${impactedAreas}\n` : "";
  const tests = mustTests ? `\n## Must Tests\n${mustTests}\n` : "";
  const miti = mitigations ? `\n## Mitigations\n${mitigations}\n` : "";

  const notes = js.notes ? `\n## Notes\n${js.notes}\n` : "";

  let out = [header, summary, findings, crit, files, areas, tests, miti, notes].join("");

  // Always append raw JSON for completeness
  try {
    out += `\n## Raw JSON\n\n` + "```json\n" + JSON.stringify(parsed, null, 2) + "\n```";
  } catch {}

  return out;
}


