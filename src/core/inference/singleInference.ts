import * as core from "@actions/core";
import { renderPlaceholders } from "../../prompt/render";
import { callModelsApi } from "../../http/modelsClient";
import { extractMessageContent } from "../../output/response";
import type { InferenceOptions } from "./inferenceTypes";

export async function runSingleInference(
  promptTemplate: string,
  placeholders: Record<string, unknown>,
  options: InferenceOptions,
): Promise<{ raw: string; messageContent: string }>{
  const rendered = renderPlaceholders(promptTemplate, placeholders);
  const payload: any = {
    model: options.model,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: rendered }
    ]
  };
  if (options.responseFormat === "json_object") payload.response_format = { type: "json_object" };
  if (options.requestDebug) {
    core.startGroup("Rendered prompt");
    core.info(rendered.substring(0, 4000));
    core.endGroup();
  }
  const raw = await callModelsApi(options.apiUrl, options.token, payload, options.timeoutMs);
  const messageContent = extractMessageContent(raw);
  return { raw, messageContent };
}


