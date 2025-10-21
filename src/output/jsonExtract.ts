function stripCodeFences(input: string): string | undefined {
  const fenceRegex = /```(?:json|javascript|js|ts)?\s*([\s\S]*?)```/i;
  const m = fenceRegex.exec(input);
  if (m && m[1]) return m[1].trim();
  return undefined;
}

function findFirstBalancedJsonSlice(input: string): string | undefined {
  const text = input.trim();
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (start === -1) {
      if (ch === '{' || ch === '[') {
        start = i;
        depth = 1;
        inString = false;
        escape = false;
      }
      continue;
    }
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') depth--;
    if (depth === 0 && start !== -1) {
      return text.slice(start, i + 1);
    }
  }
  return undefined;
}

export function extractFirstJsonString(input: string): string | undefined {
  if (!input) return undefined;
  // 1) Try direct JSON
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {}
  }
  // 2) Try code fences
  const fenced = stripCodeFences(input);
  if (fenced) {
    try {
      JSON.parse(fenced);
      return fenced;
    } catch {}
  }
  // 3) Find first balanced JSON slice
  const slice = findFirstBalancedJsonSlice(input);
  if (slice) {
    try {
      JSON.parse(slice);
      return slice;
    } catch {}
  }
  return undefined;
}

export function extractFirstJson(input: string): any | undefined {
  const s = extractFirstJsonString(input);
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}


