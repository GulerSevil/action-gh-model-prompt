import * as core from "@actions/core";
import { computeEffectiveSystem } from "./core/util/system";
import { getActionInputs } from "./core/runtime/inputs";
import { loadPrompt } from "./prompt/loader";
import { handleOutputs } from "./output/response";
import { renderMarkdownReport } from "./output/report";
import { runBatchedInference } from "./core/inference/batchedInference";
import { runSingleInference } from "./core/inference/singleInference";
import { parseFilesAndDiff } from "./core/util/promptPlaceholders";
import type { InferenceOptions } from "./core/inference/inferenceTypes";

async function runSinglePath(
  promptRaw: string,
  placeholders: Record<string, unknown>,
  inputs: ReturnType<typeof getActionInputs>,
  token: string,
): Promise<void> {
  const effectiveSystem = computeEffectiveSystem(inputs.system, inputs.responseFormat);
  const single = await runSingleInference(promptRaw, placeholders, {
    model: inputs.model,
    system: effectiveSystem,
    apiUrl: inputs.apiUrl,
    timeoutMs: inputs.timeoutMs,
    responseFormat: inputs.responseFormat,
    requestDebug: inputs.requestDebug,
    failOnInvalidJson: inputs.failOnInvalidJson,
    jqPick: inputs.jqPick,
    pickAggregation: inputs.pickAggregation,
    token,
  } as InferenceOptions);
  const raw = single.raw;
  const messageContent = single.messageContent;
  handleOutputs(
    raw,
    messageContent,
    inputs.responseFormat === "json_object",
    inputs.failOnInvalidJson,
    inputs.jqPick,
  );
}

async function runBatchedPath(
  promptRaw: string,
  placeholders: Record<string, unknown>,
  allFiles: string[],
  fullDiff: string,
  batchSize: number,
  inputs: ReturnType<typeof getActionInputs>,
  token: string,
): Promise<void> {
  const effectiveSystem = computeEffectiveSystem(inputs.system, inputs.responseFormat);
  const { rawResponses, messageContents, jsonObjects, picked, pickedMarkdown } = await runBatchedInference(
    promptRaw,
    placeholders,
    allFiles,
    fullDiff,
    batchSize,
    {
      model: inputs.model,
      system: effectiveSystem,
      apiUrl: inputs.apiUrl,
      timeoutMs: inputs.timeoutMs,
      responseFormat: inputs.responseFormat,
      requestDebug: inputs.requestDebug,
      failOnInvalidJson: inputs.failOnInvalidJson,
      jqPick: inputs.jqPick,
      pickAggregation: inputs.pickAggregation,
      token,
    }
  );

  core.setOutput("raw_response", JSON.stringify(rawResponses));
  core.setOutput("message_content", JSON.stringify(messageContents));
  const joinedText = messageContents.join("\n\n");
  if (joinedText) core.setOutput("text", joinedText);
  if (jsonObjects.length > 0) core.setOutput("json", JSON.stringify(jsonObjects, null, 2));
  if (jsonObjects.length > 0) {
    const reports = jsonObjects.map((obj) => renderMarkdownReport(obj)).filter((r) => !!r);
    const aggregated = reports.join("\n\n---\n\n");
    if (aggregated) core.setOutput("report", aggregated);
    // In text mode, prefer meaningful report text over raw JSON/text
    if (inputs.responseFormat === "text" && aggregated) {
      core.setOutput("text", aggregated);
    }
  }
  // Fallback for text mode if no JSON reports produced: build report(s) from message contents
  if (inputs.responseFormat === "text") {
    const haveReport = !!core.getInput("report");
    if (!haveReport) {
      const reports = messageContents.map((mc) => renderMarkdownReport(undefined, mc)).filter((r) => !!r);
      const aggregated = reports.join("\n\n---\n\n");
      if (aggregated) {
        core.setOutput("report", aggregated);
        core.setOutput("text", aggregated);
      }
    }
  }
  if (picked !== undefined) core.setOutput("picked", picked);
  if (pickedMarkdown !== undefined) core.setOutput("picked_markdown", pickedMarkdown);
}

async function run(): Promise<void> {
  try {
    const inputs = getActionInputs();

    const token = inputs.token;
    if (!token) {
      core.setFailed("GITHUB_TOKEN not provided. Set workflow permissions: models: read.");
      return;
    }

    let promptRaw = await loadPrompt(inputs.promptPath, inputs.stripHash);

    let placeholders: Record<string, unknown>;
    try {
      placeholders = JSON.parse(inputs.placeholdersJson);
    } catch (e: any) {
      core.setFailed(`placeholders_json is not valid JSON: ${e.message}`);
      return;
    }

    // Attempt internal batching if FILE_LIST provided
    const { files: allFiles, diff: fullDiff } = parseFilesAndDiff(placeholders);

    const enableBatching = allFiles.length > 0;
    const effectiveBatchSize = inputs.batchSize > 0 ? inputs.batchSize : 30;

    if (!enableBatching || allFiles.length <= effectiveBatchSize) {
      await runSinglePath(promptRaw, placeholders, inputs, token);
      return;
    }

    await runBatchedPath(
      promptRaw,
      placeholders,
      allFiles,
      fullDiff,
      effectiveBatchSize,
      inputs,
      token,
    );
  } catch (err: any) {
    core.setFailed(err?.message ?? String(err));
  }
}

run();
