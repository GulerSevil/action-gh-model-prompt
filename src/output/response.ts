import * as core from "@actions/core";
import { pickByDotPath, pickByDotPaths } from "../prompt/pick";
import { renderPickedMarkdown } from "./pickedMarkdown";
import { renderMarkdownReport } from "./report";
import { extractFirstJson } from "./jsonExtract";

export function extractMessageContent(rawResponse: string): string {
  try {
    const j = JSON.parse(rawResponse) as any;
    return j?.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

export function handleOutputs(
  rawResponse: string,
  messageContent: string,
  expectingJson: boolean,
  failOnInvalidJson: boolean,
  jqPick: string,
): void {
  core.setOutput("raw_response", rawResponse);
  core.setOutput("message_content", messageContent);
  core.setOutput("text", messageContent);
  console.log("messageContent", messageContent);
  if (!messageContent) return;
  try {
    const parsed = extractFirstJson(messageContent) ?? JSON.parse(messageContent);
    core.setOutput("json", JSON.stringify(parsed, null, 2));
    console.log("parsed", parsed);
    const report = renderMarkdownReport(parsed, messageContent);
    if (report) core.setOutput("report", report);
    // If not expecting JSON (text mode), prefer meaningful report as the text output
    if (!expectingJson && report) {
      core.setOutput("text", report);
    }

    if (jqPick) {
      const picked = pickByDotPaths(parsed, jqPick);
      if (picked !== undefined) {
        core.setOutput("picked", typeof picked === "string" ? picked : JSON.stringify(picked));
        const md = renderPickedMarkdown(picked);
        if (md) core.setOutput("picked_markdown", md);
      }
    }
  } catch (e: any) {
    if (expectingJson && failOnInvalidJson) {
      core.startGroup("Non-JSON model content");
      core.error(messageContent);
      core.endGroup();
      throw new Error(`Model did not return valid JSON: ${e.message}`);
    }
  }
}
