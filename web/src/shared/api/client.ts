import type {
  AppShellMetadataResponse,
  BackendApiOperationId,
  DashboardMetadataResponse,
  DashboardSummaryResponse,
  GenerationHistoryResponse,
  TextGenerationMetadataResponse,
  HistoryMetadataResponse,
  HistoryExportFormat,
  HistoryListResponse,
  HistoryQuery,
  ImageRecognitionMetadataResponse,
  ImageRecognitionRequest,
  ImageRecognitionResponse,
  MuseumVisionMetadataResponse,
  MuseumVisionRequest,
  MuseumVisionResponse,
  MuseumVisionTagExportRequest,
  RuntimeAssetsResponse,
  RuntimeAssetsWarmupResponse,
  SearchResponse,
  SentimentAnalysisMetadataResponse,
  SentimentAnalysisResponse,
  TextGenerationRequest,
  TextGenerationResponse,
} from "./types";
import { backendApiOperations } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api/v1").replace(/\/$/, "");
const API_ROUTE_PREFIX = "/api/v1";
type OperationQueryPrimitive = string | number | boolean | null | undefined;
type OperationQueryValue = OperationQueryPrimitive | OperationQueryPrimitive[];

function getOperationPath(operationId: BackendApiOperationId) {
  const fullPath = backendApiOperations[operationId].path;

  if (!fullPath.startsWith(API_ROUTE_PREFIX)) {
    return fullPath;
  }

  const relativePath = fullPath.slice(API_ROUTE_PREFIX.length);
  return relativePath || "/";
}

function buildOperationUrl(
  operationId: BackendApiOperationId,
  query?: Record<string, OperationQueryValue>,
) {
  const path = getOperationPath(operationId);

  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  const { queryKeys } = backendApiOperations[operationId];

  for (const key of queryKeys) {
    const rawValue = query[key];

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item === undefined || item === null) {
          continue;
        }

        const normalized = typeof item === "string" ? item.trim() : String(item);
        if (normalized.length === 0) {
          continue;
        }
        params.append(key, normalized);
      }
      continue;
    }

    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const normalized = typeof rawValue === "string" ? rawValue.trim() : String(rawValue);
    if (normalized.length === 0) {
      continue;
    }
    params.set(key, normalized);
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

async function fetchApi(path: string, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
}

function readValidationErrorMessage(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    Array.isArray(body.detail)
  ) {
    const [firstDetail] = body.detail as Array<{ msg?: unknown }>;
    if (firstDetail && typeof firstDetail.msg === "string" && firstDetail.msg.trim().length > 0) {
      return firstDetail.msg;
    }
  }

  return null;
}

function readApiDetailMessage(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    typeof body.detail === "string" &&
    body.detail.trim().length > 0
  ) {
    return body.detail;
  }

  return null;
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
  operationId?: BackendApiOperationId,
) {
  let message = fallbackMessage;

  if (!response.ok) {
    try {
      const errorBody = (await response.json()) as unknown;
      const errorResponseSchemas = operationId
        ? (backendApiOperations[operationId].errorResponseSchemas as Readonly<Record<string, string>>)
        : undefined;
      const schemaName = operationId
        ? errorResponseSchemas?.[String(response.status)]
        : undefined;

      if (schemaName === "HTTPValidationError") {
        message = readValidationErrorMessage(errorBody) ?? message;
      } else if (schemaName === "ApiErrorResponse") {
        message = readApiDetailMessage(errorBody) ?? message;
      } else {
        message = readApiDetailMessage(errorBody) ?? readValidationErrorMessage(errorBody) ?? message;
      }
    } catch {
      // Ignore JSON parsing failures and use the default message.
    }

    throw new Error(message);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: {
    operationId?: BackendApiOperationId;
    fallbackMessage?: string;
  },
): Promise<T> {
  const response = await fetchApi(path, init);
  await readErrorMessage(response, options?.fallbackMessage ?? "请求失败，请稍后重试。", options?.operationId);
  return (await response.json()) as T;
}

function requestOperation<T>(operationId: BackendApiOperationId, init?: RequestInit): Promise<T> {
  const operation = backendApiOperations[operationId];
  return request<T>(buildOperationUrl(operationId), {
    method: operation.method.toUpperCase(),
    ...init,
  }, {
    operationId,
  });
}

function getFilenameFromDisposition(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) {
    return fallback;
  }

  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? fallback;
}

async function requestDownloadOperation(
  operationId: BackendApiOperationId,
  options: {
    query?: Record<string, OperationQueryValue>;
    fallbackFilename: string;
    body?: string;
  },
) {
  const operation = backendApiOperations[operationId];
  const response = await fetchApi(buildOperationUrl(operationId, options.query), {
    method: operation.method.toUpperCase(),
    body: options.body,
  });

  await readErrorMessage(response, "导出失败，请稍后重试。", operationId);

  const responseHeaderKeys = operation.responseHeaderKeys as ReadonlyArray<string>;
  const filename = responseHeaderKeys.includes("Content-Disposition")
    ? getFilenameFromDisposition(response.headers.get("content-disposition"), options.fallbackFilename)
    : options.fallbackFilename;

  return {
    blob: await response.blob(),
    filename,
  };
}

export function getDashboardSummary() {
  return requestOperation<DashboardSummaryResponse>("dashboard_api_v1_dashboard_get");
}

export function getDashboardMetadata() {
  return requestOperation<DashboardMetadataResponse>("dashboard_metadata_api_v1_dashboard_metadata_get");
}

export function getRuntimeAssets() {
  return requestOperation<RuntimeAssetsResponse>("runtime_assets_api_v1_runtime_assets_get");
}

export function warmRuntimeAssets() {
  return requestOperation<RuntimeAssetsWarmupResponse>("runtime_assets_warmup_api_v1_runtime_assets_warmup_post");
}

export function getHistoryRecords(query: HistoryQuery) {
  return request<HistoryListResponse>(
    buildOperationUrl("history_api_v1_history_get", query),
    undefined,
    {
      operationId: "history_api_v1_history_get",
    },
  );
}

export function getHistoryMetadata() {
  return requestOperation<HistoryMetadataResponse>("history_metadata_api_v1_history_metadata_get");
}

export function getAppShellMetadata() {
  return requestOperation<AppShellMetadataResponse>("app_shell_metadata_api_v1_app_shell_metadata_get");
}

export function searchPlatform(keyword: string) {
  return request<SearchResponse>(
    buildOperationUrl("search_api_v1_search_get", { keyword }),
    undefined,
    {
      operationId: "search_api_v1_search_get",
    },
  );
}

export async function downloadHistoryRecords(query: HistoryQuery, format: HistoryExportFormat) {
  const fallbackFilename = format === "csv" ? "history-records.csv" : "history-records.json";
  return requestDownloadOperation("export_history_api_v1_history_export_get", {
    query: {
      ...query,
      format,
    },
    fallbackFilename,
  });
}

export async function downloadProjectReport() {
  return requestDownloadOperation("project_report_export_api_v1_project_report_export_get", {
    fallbackFilename: "multimodal-ai-project-overview.json",
  });
}

export async function downloadProjectDeliveryBundle() {
  return requestDownloadOperation("project_delivery_bundle_export_api_v1_project_deliverables_export_get", {
    fallbackFilename: "multimodal-ai-project-snapshot.zip",
  });
}

export function getImageRecognitionMetadata() {
  return requestOperation<ImageRecognitionMetadataResponse>(
    "image_recognition_metadata_api_v1_image_recognition_metadata_get",
  );
}

export function classifyImage(payload: ImageRecognitionRequest) {
  return requestOperation<ImageRecognitionResponse>("image_recognition_api_v1_image_recognition_predict_post", {
    body: JSON.stringify(payload),
  });
}

export function analyzeSentiment(text: string) {
  return requestOperation<SentimentAnalysisResponse>("sentiment_analysis_api_v1_sentiment_analysis_analyze_post", {
    body: JSON.stringify({ text }),
  });
}

export function getSentimentAnalysisMetadata() {
  return requestOperation<SentimentAnalysisMetadataResponse>(
    "sentiment_analysis_metadata_api_v1_sentiment_analysis_metadata_get",
  );
}

export function generateText(payload: TextGenerationRequest) {
  return requestOperation<TextGenerationResponse>("text_generation_api_v1_text_generation_generate_post", {
    body: JSON.stringify(payload),
  });
}

export function getGenerationHistory() {
  return requestOperation<GenerationHistoryResponse>("text_generation_history_api_v1_text_generation_history_get");
}

export function getTextGenerationMetadata() {
  return requestOperation<TextGenerationMetadataResponse>(
    "text_generation_metadata_api_v1_text_generation_metadata_get",
  );
}

export function getMuseumVisionMetadata() {
  return requestOperation<MuseumVisionMetadataResponse>(
    "museum_vision_metadata_api_v1_museum_vision_metadata_get",
  );
}

export function analyzeMuseumVision(payload: MuseumVisionRequest) {
  return requestOperation<MuseumVisionResponse>("museum_vision_api_v1_museum_vision_analyze_post", {
    body: JSON.stringify(payload),
  });
}

export async function downloadMuseumVisionTags(payload: MuseumVisionTagExportRequest) {
  const stem = payload.fileName.replace(/\.[^.]+$/, "") || "museum-tags";
  return requestDownloadOperation("museum_vision_export_tags_api_v1_museum_vision_export_tags_post", {
    body: JSON.stringify(payload),
    fallbackFilename: `${stem}-tags.txt`,
  });
}
