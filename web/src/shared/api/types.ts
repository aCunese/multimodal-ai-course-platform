import type { BackendApiOperationMap } from "./generated-contract";

export * from "./generated-contract";

export type HistoryQuery = BackendApiOperationMap["history_api_v1_history_get"]["query"];

export type HistoryExportFormat = NonNullable<
  BackendApiOperationMap["export_history_api_v1_history_export_get"]["query"]["format"]
>;
