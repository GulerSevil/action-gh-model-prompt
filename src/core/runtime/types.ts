export type ResponseFormat = "json_object" | "text";

export interface ActionInputs {
  model: string;
  promptPath: string;
  placeholdersJson: string;
  system: string;
  responseFormat: ResponseFormat;
  apiUrl: string;
  timeoutMs: number;
  stripHash: boolean;
  requestDebug: boolean;
  failOnInvalidJson: boolean;
  jqPick: string;
  pickAggregation: "none" | "first" | "join" | "worst_severity";
  token: string;
  batchSize: number;
}


