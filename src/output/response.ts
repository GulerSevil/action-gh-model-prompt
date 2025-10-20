import * as core from "@actions/core";
import { pickByDotPath } from "../prompt/pick";

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
  console.log("messageContent", messageContent);
  if (!messageContent) return;
  try {
    const parsed = JSON.parse(messageContent);
    core.setOutput("json", JSON.stringify(parsed, null, 2));
    console.log("parsed", parsed);
    

    if (jqPick) {
      const picked = pickByDotPath(parsed, jqPick);
      if (picked !== undefined) {
        core.setOutput("picked", typeof picked === "string" ? picked : JSON.stringify(picked));
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
