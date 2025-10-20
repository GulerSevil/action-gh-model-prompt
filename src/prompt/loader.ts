import { promises as fs } from "fs";

export async function loadPrompt(path: string, stripHash: boolean): Promise<string> {
  let content = await fs.readFile(path, "utf8");
  if (stripHash) {
    content = content
      .split("\n")
      .filter((line) => !line.startsWith("# "))
      .join("\n");
  }
  return content;
}
