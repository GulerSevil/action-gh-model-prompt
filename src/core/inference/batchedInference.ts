import * as core from "@actions/core";
import { renderPlaceholders } from "../../prompt/render";
import { callModelsApi } from "../../http/modelsClient";
import { extractMessageContent } from "../../output/response";
import { extractFirstJson } from "../../output/jsonExtract";
import { pickByDotPath, aggregatePickedValues } from "../../prompt/pick";
import { filterDiffByFiles, splitIntoBatches } from "../batching";
import { worstSeverity } from "../util/severity";
import type { InferenceOptions } from "./inferenceTypes";

class BatchPlanner {
  private fileList: string[];
  private batchSize: number;

  constructor(fileList: string[], batchSize: number) {
    this.fileList = fileList;
    this.batchSize = batchSize;
  }

  plan(): string[][] {
    return splitIntoBatches(this.fileList, this.batchSize);
  }
}

class PromptBuilder {
  static buildPlaceholders(
    basePlaceholders: Record<string, unknown>,
    batchFiles: string[],
    fullDiff: string,
  ): Record<string, unknown> {
    const placeholders: Record<string, unknown> = { ...basePlaceholders };
    placeholders.FILE_LIST = batchFiles.join("\n");
    if (fullDiff) placeholders.DIFF = filterDiffByFiles(fullDiff, batchFiles);
    return placeholders;
  }

  static render(template: string, placeholders: Record<string, unknown>): string {
    return renderPlaceholders(template, placeholders);
  }
}

class RequestRunner {
  private options: InferenceOptions;

  constructor(options: InferenceOptions) {
    this.options = options;
  }

  async run(renderedPrompt: string, batchInfo?: { index: number; total: number }): Promise<{ raw: string; content: string }>{
    const payload: any = {
      model: this.options.model,
      messages: [
        { role: "system", content: this.options.system },
        { role: "user", content: renderedPrompt }
      ]
    };
    if (this.options.responseFormat === "json_object") payload.response_format = { type: "json_object" };
    if (this.options.requestDebug) {
      const prefix = batchInfo ? `Rendered prompt (batch ${batchInfo.index}/${batchInfo.total})` : "Rendered prompt";
      core.startGroup(prefix);
      core.info(renderedPrompt.substring(0, 4000));
      core.endGroup();
    }
    const raw = await callModelsApi(this.options.apiUrl, this.options.token, payload, this.options.timeoutMs);
    const content = extractMessageContent(raw);
    return { raw, content };
  }
}

export async function runBatchedInference(
  promptTemplate: string,
  basePlaceholders: Record<string, unknown>,
  fileList: string[],
  fullDiff: string,
  batchSize: number,
  options: InferenceOptions,
): Promise<{ rawResponses: string[]; messageContents: string[]; jsonObjects: any[]; picked?: string }> {
  const planner = new BatchPlanner(fileList, batchSize);
  const batches = planner.plan();
  core.info(`Batching ${fileList.length} files into ${batches.length} batches of up to ${batchSize}.`);

  const rawResponses: string[] = [];
  const messageContents: string[] = [];
  const jsonObjects: any[] = [];
  const pickedValues: string[] = [];
  const runner = new RequestRunner(options);

  for (let i = 0; i < batches.length; i++) {
    const batchFiles = batches[i];
    const placeholders = PromptBuilder.buildPlaceholders(basePlaceholders, batchFiles, fullDiff);
    const rendered = PromptBuilder.render(promptTemplate, placeholders);
    const { raw, content } = await runner.run(rendered, { index: i + 1, total: batches.length });
    rawResponses.push(raw);
    messageContents.push(content);
    if (options.responseFormat === "json_object" && content) {
      try {
        const parsed = extractFirstJson(content) ?? JSON.parse(content);
        jsonObjects.push(parsed);
        if (options.jqPick) {
          const picked = pickByDotPath(parsed, options.jqPick);
          if (picked != null) pickedValues.push(typeof picked === "string" ? picked : JSON.stringify(picked));
        }
      } catch {
      }
    }
  }

  const result: { rawResponses: string[]; messageContents: string[]; jsonObjects: any[]; picked?: string } = {
    rawResponses,
    messageContents,
    jsonObjects,
  };
  if (options.jqPick) {
    const aggregated = aggregatePickedValues(pickedValues, options.pickAggregation, worstSeverity);
    if (aggregated !== undefined) result.picked = aggregated;
  }

  if (options.responseFormat === "json_object" && options.failOnInvalidJson) {
    const anyMissing = messageContents.some((c) => {
      const extracted = extractFirstJson(c);
      if (extracted) return false;
      try { JSON.parse(c); return false; } catch { return true; }
    });
    if (anyMissing) core.setFailed("At least one batch did not return valid JSON.");
  }

  return result;
}


