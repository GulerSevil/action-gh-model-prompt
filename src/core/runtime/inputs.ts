import * as core from "@actions/core";
import type { ActionInputs, ResponseFormat } from "./types";

export function getActionInputs(): ActionInputs {
  const model = core.getInput("model") || "openai/gpt-4o-mini";
  const promptPath = core.getInput("prompt_path", { required: true });
  const placeholdersJson = core.getInput("placeholders_json") || "{}";
  const system = core.getInput("system") || "Output STRICT JSON only.";
  const responseFormat = (core.getInput("response_format") || "json_object") as ResponseFormat;
  const apiUrl = core.getInput("api_url") || "https://models.github.ai/inference/chat/completions";
  const timeoutMs = parseInt(core.getInput("timeout_ms") || "120000", 10);
  const stripHash = core.getInput("strip_hash_comments") === "true";
  const requestDebug = core.getInput("request_debug") === "true";
  const failOnInvalidJson = core.getInput("fail_on_invalid_json") === "true";
  const jqPick = core.getInput("jq_pick") || "";
  const pickAggregation = (core.getInput("pick_aggregation") || "none") as any;
  const token = core.getInput("token");
  const batchSize = parseInt(core.getInput("batch_size") || "0", 10);

  return {
    model,
    promptPath,
    placeholdersJson,
    system,
    responseFormat,
    apiUrl,
    timeoutMs,
    stripHash,
    requestDebug,
    failOnInvalidJson,
    jqPick,
    pickAggregation,
    token,
    batchSize,
  };
}


