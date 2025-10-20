export interface InferenceOptions {
  model: string;
  system: string;
  apiUrl: string;
  timeoutMs: number;
  responseFormat: "json_object" | "text";
  requestDebug: boolean;
  failOnInvalidJson: boolean;
  jqPick: string;
  pickAggregation?: "none" | "first" | "join" | "worst_severity";
  token: string;
}


