function replaceAll(haystack: string, needle: string, replacement: string): string {
  return haystack.split(needle).join(replacement);
}

export function renderPlaceholders(template: string, placeholders: Record<string, unknown>): string {
  let result = template;
  for (const [k, v] of Object.entries(placeholders)) {
    const placeholder = `{{${k}}}`;
    result = replaceAll(result, placeholder, String(v));
  }
  return result;
}
