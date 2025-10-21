export function renderMarkdownReport(parsed: any): string {
  if (!parsed || typeof parsed !== "object") return "";
  // Support both detailed_analysis/json_summary and analysis schemas
  const da = parsed.detailed_analysis || parsed.analysis || {};
  const es = da.executive_summary || {};
  const js = parsed.json_summary || {};

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


