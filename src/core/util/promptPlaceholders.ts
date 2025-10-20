export function parseFilesAndDiff(placeholders: Record<string, unknown>): { files: string[]; diff: string } {
  const fileListRaw = String((placeholders as any).FILE_LIST ?? (placeholders as any).CHANGED_FILES ?? "");
  const files = fileListRaw.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  const diff = String((placeholders as any).DIFF ?? "");
  return { files, diff };
}


