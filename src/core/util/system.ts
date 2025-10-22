export function computeEffectiveSystem(system: string, responseFormat: string): string {
  const defaultJsonSystem = "Output STRICT JSON only.";
  if (responseFormat === "text" && system === defaultJsonSystem) {
    return "Produce a concise, human-readable markdown report. Avoid JSON; prefer sections and bullet points.";
  }
  return system;
}


