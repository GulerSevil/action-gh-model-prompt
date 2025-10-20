export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

export function filterDiffByFiles(diff: string, files: string[]): string {
  if (!diff || files.length === 0) return "";
  const fileSet = new Set(files);
  const chunks: string[] = [];
  let keep = false;
  for (const line of diff.split("\n")) {
    const m = /^\+\+\+ b\/(.+)$/.exec(line);
    if (m) {
      keep = fileSet.has(m[1]);
    }
    if (keep) chunks.push(line);
  }
  return chunks.join("\n");
}


