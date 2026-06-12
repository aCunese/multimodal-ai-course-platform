// Auto-generated from backend FastAPI OpenAPI components.
// Run `cd backend && uv run python scripts/sync_api_contracts.py` to regenerate.

export type ApiErrorResponse = {
  detail: string;
};

export type AppShellMetadataResponse = {
  searchFieldAriaLabel: string;
  searchPlaceholder: string;
  searchResultsAriaLabel: string;
  searchLoadingMessage: string;
  searchEmptyMessage: string;
  searchUnavailableMessage: string;
  projectReportButtonLabel: string;
  projectReportFallbackTitle: string;
  projectReportFallbackFilename: string;
  projectDeliverablesButtonLabel: string;
  projectOverviewButtonLabel: string;
  accountDisplayName: string;
  accountRoleLabel: string;
};

export type DashboardAction = {
  label: string;
  route: string;
};

export type DashboardMetadataResponse = {
  pageTitle: string;
  pageDescription: string;
  syncLoadingMessage: string;
  syncReadyMessage: string;
  syncFallbackMessage: string;
  heroTitle: string;
  heroDescription: string;
  primaryAction: DashboardAction;
  secondaryAction: DashboardAction;
  moduleActionLabel: string;
  runtimePanelTitle: string;
  runtimePanelLoadingMessage: string;
  runtimePanelErrorMessage: string;
  runtimeWarmActionColdLabel: string;
  runtimeWarmActionReadyLabel: string;
  runtimeWarmActionBusyLabel: string;
  runtimeAssetCacheFileLabel: string;
  runtimeAssetCacheReadyLabel: string;
  runtimeAssetCacheMissingLabel: string;
  runtimeAssetCacheSizeLabel: string;
  runtimeAssetUpdatedAtLabel: string;
  runtimeAssetMissingUpdatedAtLabel: string;
  historyPanelTitle: string;
  historyPanelActionLabel: string;
  historyTableHeaders: Array<string>;
};

export type DashboardSummaryResponse = {
  modules: Array<ModuleCard>;
  metrics: Array<MetricCard>;
  recentHistory: Array<HistoryRecord>;
};

export type GenerationHistoryItem = {
  id: string;
  theme: string;
  type: "标题" | "宣传语" | "短文案" | "诗意表达";
  tone: "正式" | "活泼" | "科技感" | "文艺";
  count: number;
  time: string;
  status: "已生成" | "草稿";
};

export type GenerationHistoryResponse = {
  items: Array<GenerationHistoryItem>;
};

export type GenerationOutput = {
  id: string;
  type: "标题" | "宣传语" | "短文案" | "诗意表达";
  title: string;
  body: string;
};

export type GenerationQualityMetric = {
  label: string;
  value: number;
};

export type HTTPValidationError = {
  detail?: Array<ValidationError>;
};

export type HealthResponse = {
  status: "ok";
};

export type HistoryExportFilters = {
  keyword: string;
  module: string;
  status: string;
};

export type HistoryExportFormatOption = {
  label: string;
  value: "json" | "csv";
};

export type HistoryExportResponse = {
  exportedAt: string;
  filters: HistoryExportFilters;
  count: number;
  records: Array<HistoryRecord>;
};

export type HistoryListResponse = {
  records: Array<HistoryRecord>;
};

export type HistoryMetadataResponse = {
  pageTitle: string;
  pageDescription: string;
  syncConnectedMessage: string;
  syncLoadingMessage: string;
  syncReadyMessage: string;
  syncFallbackMessage: string;
  filterPanelTitle: string;
  searchFieldLabel: string;
  searchPlaceholder: string;
  moduleFilterLabel: string;
  statusFilterLabel: string;
  exportFormatLabel: string;
  clearFiltersLabel: string;
  exportButtonLabel: string;
  exportButtonBusyLabel: string;
  exportSuccessMessageTemplate: string;
  exportFallbackMessage: string;
  tableTitle: string;
  tableLoadingMessage: string;
  tableCountTemplate: string;
  tableHeaders: Array<string>;
  rowActionLabel: string;
  projectOverviewTitle: string;
  moduleSpotlightActionLabel: string;
  moduleFilters: Array<string>;
  statusFilters: Array<string>;
  exportFormats: Array<HistoryExportFormatOption>;
  overviewSections: Array<ProjectOverviewSection>;
  valuePoints: Array<string>;
  moduleSpotlights: Array<ProjectModuleSpotlight>;
};

export type HistoryRecord = {
  id: string;
  date: string;
  time: string;
  module: string;
  inputType: string;
  inputContent: string;
  output: string;
  confidence: string;
  status: "成功" | "警告" | "失败";
  route: string;
};

export type ImageRecognitionMetadataResponse = {
  pageTitle: string;
  pageDescription: string;
  syncLoadingMessage: string;
  syncAnalyzingMessage: string;
  syncReadyMessage: string;
  syncFallbackMessage: string;
  uploadPanelTitle: string;
  uploadDropzoneTitle: string;
  uploadHint: string;
  uploadButtonLabel: string;
  exampleButtonLabel: string;
  uploadedPreviewTitle: string;
  reuploadButtonLabel: string;
  previewLoadedStatusLabel: string;
  previewAnalyzingStatusLabel: string;
  resultPanelTitle: string;
  resultReadyStatusLabel: string;
  resultAnalyzingStatusLabel: string;
  predictedCategoryLabel: string;
  confidenceLabel: string;
  resultExplanationTitle: string;
  probabilityPanelTitle: string;
  modelInfoPanelTitle: string;
  sampleAsset: ImageRecognitionSampleAsset;
  initialResult: ImageRecognitionResponse;
  modelInfo: Array<ImageRecognitionModelInfoItem>;
};

export type ImageRecognitionModelInfoItem = {
  label: string;
  value: string;
};

export type ImageRecognitionRequest = {
  fileName: string;
  width?: number | null;
  height?: number | null;
  sizeLabel?: string | null;
  imageDataUrl?: string | null;
};

export type ImageRecognitionResponse = {
  label: string;
  confidence: number;
  explanation: string;
  probabilities: Array<ProbabilityItem>;
  historyRecord: HistoryRecord;
};

export type ImageRecognitionSampleAsset = {
  sampleId: string;
  name: string;
  sizeLabel: string;
  dimensionsLabel: string;
};

export type KeywordMatch = {
  label: string;
  score: number;
};

export type MetricCard = {
  label: string;
  value: string;
  caption: string;
  icon: "home" | "image" | "heart" | "pen" | "museum" | "history" | "search" | "download" | "file" | "user" | "arrow-right" | "check" | "spark" | "chart" | "layers" | "shield" | "cube" | "upload" | "refresh" | "light" | "filter" | "clock" | "database" | "copy" | "tag";
};

export type ModelProviderStatus = {
  configuredProvider: "local" | "deepseek";
  activeProvider: "local" | "deepseek";
  enabled: boolean;
  statusLabel: string;
  detailMessage: string;
};

export type ModuleCard = {
  title: string;
  description: string;
  route: string;
  statusLabel: string;
  statusTone: "success" | "accent" | "warning" | "neutral";
  icon: "home" | "image" | "heart" | "pen" | "museum" | "history" | "search" | "download" | "file" | "user" | "arrow-right" | "check" | "spark" | "chart" | "layers" | "shield" | "cube" | "upload" | "refresh" | "light" | "filter" | "clock" | "database" | "copy" | "tag";
};

export type MuseumArtworkClue = {
  title: string;
  era: string;
  category: string;
  museumHint: string;
  basis: string;
};

export type MuseumMatch = {
  institution: string;
  score: number;
};

export type MuseumVisionDataSourceItem = {
  title: string;
  body: string;
};

export type MuseumVisionMetadataResponse = {
  pageTitle: string;
  pageDescription: string;
  syncConnectingMessage: string;
  syncAnalyzingMessage: string;
  syncReadyMessage: string;
  syncUpdateMessage: string;
  syncFallbackMessage: string;
  copyActionLabel: string;
  copySuccessLabel: string;
  copyFailureMessage: string;
  exportTagsActionLabel: string;
  exportTagsSuccessLabel: string;
  exportTagsSuccessMessage: string;
  exportTagsFallbackMessage: string;
  uploadButtonLabel: string;
  switchSampleButtonLabel: string;
  sampleLoadedStatusLabel: string;
  uploadSuccessStatusLabel: string;
  sampleSourceBadgeLabel: string;
  uploadSourceBadgeLabel: string;
  openPreviewAriaLabel: string;
  downloadPreviewAriaLabel: string;
  switchPreviewAriaLabel: string;
  sampleAssets: Array<MuseumVisionSampleAsset>;
  initialAssetId: string;
  initialAnalysis: MuseumVisionResponse;
  sampleDescriptionNote: string;
  uploadDescriptionNote: string;
  dataSourceItems: Array<MuseumVisionDataSourceItem>;
};

export type MuseumVisionRequest = {
  fileName: string;
  format?: string | null;
  dimensions?: string | null;
  sizeLabel?: string | null;
  sourceMode?: "sample" | "upload";
  imageDataUrl?: string | null;
};

export type MuseumVisionResponse = {
  name: string;
  format: string;
  dimensions: string;
  sizeLabel: string;
  sourceNote: string;
  uploadedAt: string;
  institution: string;
  confidence: number;
  description: string;
  artworkClue: MuseumArtworkClue;
  tags: Array<string>;
  matches: Array<MuseumMatch>;
  historyRecord: HistoryRecord;
};

export type MuseumVisionSampleAsset = {
  id: string;
  name: string;
  format: string;
  dimensions: string;
  sizeLabel: string;
};

export type MuseumVisionTagExportRequest = {
  fileName: string;
  institution: string;
  tags: Array<string>;
};

export type ProbabilityItem = {
  label: string;
  value: number;
};

export type ProjectModuleSpotlight = {
  title: string;
  description: string;
  route: string;
};

export type ProjectOverviewSection = {
  title: string;
  body: string;
};

export type ProjectReportExportResponse = {
  generatedAt: string;
  title: string;
  reportVersion: string;
  pages: Array<ProjectReportPage>;
  dashboard: DashboardSummaryResponse;
  runtimeAssets: RuntimeAssetsResponse;
  historyMetadata: HistoryMetadataResponse;
};

export type ProjectReportPage = {
  label: string;
  path: string;
  summary: string;
};

export type RuntimeAssetStatus = {
  key: "herbal-classifier" | "museum-feature-index";
  label: string;
  description: string;
  cachePath: string;
  cacheExists: boolean;
  cacheReady: boolean;
  cacheSizeBytes?: number | null;
  cacheUpdatedAt?: string | null;
  datasetStatus: "ready" | "missing";
  statusLabel: "就绪" | "待预热" | "缺少数据";
  statusTone: "success" | "warning" | "neutral";
  note: string;
};

export type RuntimeAssetsResponse = {
  assets: Array<RuntimeAssetStatus>;
  summaryMessage: string;
};

export type RuntimeAssetsWarmupResponse = {
  assets: Array<RuntimeAssetStatus>;
  warmedKeys: Array<"herbal-classifier" | "museum-feature-index">;
  totalDurationMs: number;
  warmedAt: string;
  summaryMessage: string;
};

export type SearchResponse = {
  keyword: string;
  total: number;
  results: Array<SearchSuggestion>;
};

export type SearchSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  icon: "home" | "image" | "heart" | "pen" | "museum" | "history" | "search" | "download" | "file" | "user" | "arrow-right" | "check" | "spark" | "chart" | "layers" | "shield" | "cube" | "upload" | "refresh" | "light" | "filter" | "clock" | "database" | "copy" | "tag";
  scope: "page" | "history";
};

export type SentimentAnalysisMetadataResponse = {
  pageTitle: string;
  pageDescription: string;
  syncLoadingMessage: string;
  syncAnalyzingMessage: string;
  syncReadyMessage: string;
  syncFallbackMessage: string;
  emptyInputMessage: string;
  textInputLabel: string;
  clearButtonLabel: string;
  sampleButtonLabel: string;
  analyzeButtonLabel: string;
  analyzeButtonBusyLabel: string;
  positiveOnlyButtonLabel: string;
  showAllButtonLabel: string;
  sampleText: string;
  pendingResult: SentimentAnalysisResponse;
  providerStatus: ModelProviderStatus;
  modelLabel: string;
  analysisNote: string;
};

export type SentimentAnalysisRequest = {
  text: string;
};

export type SentimentAnalysisResponse = {
  label: "正面" | "中性" | "负面";
  englishLabel: "Positive" | "Neutral" | "Negative";
  confidence: number;
  score: number;
  tags: Array<string>;
  positiveMatches: Array<KeywordMatch>;
  negativeMatches: Array<KeywordMatch>;
  explanation: string;
  status: "已完成" | "待分析";
  processingTime: string;
  taskId: string;
  completedAt: string;
  providerUsed: "local" | "deepseek";
  usedFallback: boolean;
  providerStatusMessage: string;
  historyRecord: HistoryRecord;
};

export type TextGenerationDefaultConfig = {
  theme: string;
  tone: "正式" | "活泼" | "科技感" | "文艺";
  type: "标题" | "宣传语" | "短文案" | "诗意表达";
  quantity: number;
};

export type TextGenerationMetadataResponse = {
  pageTitle: string;
  pageDescription: string;
  syncConnectingMessage: string;
  syncHistoryReadyMessage: string;
  syncFallbackMessage: string;
  generateLoadingMessage: string;
  generateSuccessMessage: string;
  generateFallbackMessage: string;
  restoreExampleMessage: string;
  copyActionLabel: string;
  copySuccessLabel: string;
  copyFailureMessage: string;
  restoreExampleButtonLabel: string;
  generateButtonLabel: string;
  generateButtonBusyLabel: string;
  regenerateButtonLabel: string;
  toneOptions: Array<"正式" | "活泼" | "科技感" | "文艺">;
  generationTypes: Array<"标题" | "宣传语" | "短文案" | "诗意表达">;
  defaultConfig: TextGenerationDefaultConfig;
  providerStatus: ModelProviderStatus;
  sampleOutputs: Array<GenerationOutput>;
  defaultQualityMetrics: Array<GenerationQualityMetric>;
  defaultQualityTip: string;
  defaultToneKeywords: Array<string>;
};

export type TextGenerationRequest = {
  theme: string;
  tone: "正式" | "活泼" | "科技感" | "文艺";
  type: "标题" | "宣传语" | "短文案" | "诗意表达";
  quantity: number;
};

export type TextGenerationResponse = {
  outputs: Array<GenerationOutput>;
  historyEntry: GenerationHistoryItem;
  history: Array<GenerationHistoryItem>;
  qualityMetrics: Array<GenerationQualityMetric>;
  qualityTip: string;
  toneKeywords: Array<string>;
  generatedAt: string;
  providerUsed: "local" | "deepseek";
  usedFallback: boolean;
  providerStatusMessage: string;
  historyRecord: HistoryRecord;
};

export type ValidationError = {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
};

export type BackendApiOperationMap = {
  app_shell_metadata_api_v1_app_shell_metadata_get: {
    method: "get";
    path: "/api/v1/app-shell/metadata";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: AppShellMetadataResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  dashboard_api_v1_dashboard_get: {
    method: "get";
    path: "/api/v1/dashboard";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: DashboardSummaryResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  dashboard_metadata_api_v1_dashboard_metadata_get: {
    method: "get";
    path: "/api/v1/dashboard/metadata";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: DashboardMetadataResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  healthcheck_api_v1_health_get: {
    method: "get";
    path: "/api/v1/health";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: HealthResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  history_api_v1_history_get: {
    method: "get";
    path: "/api/v1/history";
    query: {
  keyword?: string;
  module?: string;
  status?: string;
};
    queryDefaults: {
  keyword: "";
  module: "全部";
  status: "全部";
};
    pathParams: never;
    requestBody: never;
    responseBody: HistoryListResponse;
    errorResponses: {
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  export_history_api_v1_history_export_get: {
    method: "get";
    path: "/api/v1/history/export";
    query: {
  keyword?: string;
  module?: string;
  status?: string;
  format?: "json" | "csv";
};
    queryDefaults: {
  keyword: "";
  module: "全部";
  status: "全部";
  format: "json";
};
    pathParams: never;
    requestBody: never;
    responseBody: HistoryExportResponse;
    errorResponses: {
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  history_metadata_api_v1_history_metadata_get: {
    method: "get";
    path: "/api/v1/history/metadata";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: HistoryMetadataResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  image_recognition_metadata_api_v1_image_recognition_metadata_get: {
    method: "get";
    path: "/api/v1/image-recognition/metadata";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: ImageRecognitionMetadataResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  image_recognition_api_v1_image_recognition_predict_post: {
    method: "post";
    path: "/api/v1/image-recognition/predict";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: ImageRecognitionRequest;
    responseBody: ImageRecognitionResponse;
    errorResponses: {
  400: ApiErrorResponse;
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  museum_vision_api_v1_museum_vision_analyze_post: {
    method: "post";
    path: "/api/v1/museum-vision/analyze";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: MuseumVisionRequest;
    responseBody: MuseumVisionResponse;
    errorResponses: {
  400: ApiErrorResponse;
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  museum_vision_export_tags_api_v1_museum_vision_export_tags_post: {
    method: "post";
    path: "/api/v1/museum-vision/export-tags";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: MuseumVisionTagExportRequest;
    responseBody: unknown;
    errorResponses: {
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  museum_vision_metadata_api_v1_museum_vision_metadata_get: {
    method: "get";
    path: "/api/v1/museum-vision/metadata";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: MuseumVisionMetadataResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  project_delivery_bundle_export_api_v1_project_deliverables_export_get: {
    method: "get";
    path: "/api/v1/project-deliverables/export";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: unknown;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  project_report_export_api_v1_project_report_export_get: {
    method: "get";
    path: "/api/v1/project-report/export";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: ProjectReportExportResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  runtime_assets_api_v1_runtime_assets_get: {
    method: "get";
    path: "/api/v1/runtime-assets";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: RuntimeAssetsResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  runtime_assets_warmup_api_v1_runtime_assets_warmup_post: {
    method: "post";
    path: "/api/v1/runtime-assets/warmup";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: RuntimeAssetsWarmupResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  search_api_v1_search_get: {
    method: "get";
    path: "/api/v1/search";
    query: {
  keyword?: string;
};
    queryDefaults: {
  keyword: "";
};
    pathParams: never;
    requestBody: never;
    responseBody: SearchResponse;
    errorResponses: {
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  sentiment_analysis_api_v1_sentiment_analysis_analyze_post: {
    method: "post";
    path: "/api/v1/sentiment-analysis/analyze";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: SentimentAnalysisRequest;
    responseBody: SentimentAnalysisResponse;
    errorResponses: {
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  sentiment_analysis_metadata_api_v1_sentiment_analysis_metadata_get: {
    method: "get";
    path: "/api/v1/sentiment-analysis/metadata";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: SentimentAnalysisMetadataResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  text_generation_api_v1_text_generation_generate_post: {
    method: "post";
    path: "/api/v1/text-generation/generate";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: TextGenerationRequest;
    responseBody: TextGenerationResponse;
    errorResponses: {
  422: HTTPValidationError;
};
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  text_generation_history_api_v1_text_generation_history_get: {
    method: "get";
    path: "/api/v1/text-generation/history";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: GenerationHistoryResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
  text_generation_metadata_api_v1_text_generation_metadata_get: {
    method: "get";
    path: "/api/v1/text-generation/metadata";
    query: never;
    queryDefaults: Record<string, never>;
    pathParams: never;
    requestBody: never;
    responseBody: TextGenerationMetadataResponse;
    errorResponses: Record<string, never>;
    successStatus: 200;
    responseContentTypes: Array<string>;
    responseHeaderKeys: Array<string>;
    errorResponseSchemas: Record<string, string>;
  };
};

export type BackendApiOperationId = keyof BackendApiOperationMap;

export const backendApiOperations = {
  app_shell_metadata_api_v1_app_shell_metadata_get: {
    method: "get",
    path: "/api/v1/app-shell/metadata",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  dashboard_api_v1_dashboard_get: {
    method: "get",
    path: "/api/v1/dashboard",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  dashboard_metadata_api_v1_dashboard_metadata_get: {
    method: "get",
    path: "/api/v1/dashboard/metadata",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  healthcheck_api_v1_health_get: {
    method: "get",
    path: "/api/v1/health",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  history_api_v1_history_get: {
    method: "get",
    path: "/api/v1/history",
    queryKeys: ["keyword", "module", "status"],
    queryDefaults: {"keyword": "", "module": "全部", "status": "全部"},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {"422": "HTTPValidationError"},
  },
  export_history_api_v1_history_export_get: {
    method: "get",
    path: "/api/v1/history/export",
    queryKeys: ["keyword", "module", "status", "format"],
    queryDefaults: {"keyword": "", "module": "全部", "status": "全部", "format": "json"},
    successStatus: 200,
    responseContentTypes: ["application/json", "text/csv"],
    responseHeaderKeys: ["Content-Disposition"],
    errorResponseSchemas: {"422": "HTTPValidationError"},
  },
  history_metadata_api_v1_history_metadata_get: {
    method: "get",
    path: "/api/v1/history/metadata",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  image_recognition_metadata_api_v1_image_recognition_metadata_get: {
    method: "get",
    path: "/api/v1/image-recognition/metadata",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  image_recognition_api_v1_image_recognition_predict_post: {
    method: "post",
    path: "/api/v1/image-recognition/predict",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {"400": "ApiErrorResponse", "422": "HTTPValidationError"},
  },
  museum_vision_api_v1_museum_vision_analyze_post: {
    method: "post",
    path: "/api/v1/museum-vision/analyze",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {"400": "ApiErrorResponse", "422": "HTTPValidationError"},
  },
  museum_vision_export_tags_api_v1_museum_vision_export_tags_post: {
    method: "post",
    path: "/api/v1/museum-vision/export-tags",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json", "text/plain"],
    responseHeaderKeys: ["Content-Disposition"],
    errorResponseSchemas: {"422": "HTTPValidationError"},
  },
  museum_vision_metadata_api_v1_museum_vision_metadata_get: {
    method: "get",
    path: "/api/v1/museum-vision/metadata",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  project_delivery_bundle_export_api_v1_project_deliverables_export_get: {
    method: "get",
    path: "/api/v1/project-deliverables/export",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json", "application/zip"],
    responseHeaderKeys: ["Content-Disposition"],
    errorResponseSchemas: {},
  },
  project_report_export_api_v1_project_report_export_get: {
    method: "get",
    path: "/api/v1/project-report/export",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: ["Content-Disposition"],
    errorResponseSchemas: {},
  },
  runtime_assets_api_v1_runtime_assets_get: {
    method: "get",
    path: "/api/v1/runtime-assets",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  runtime_assets_warmup_api_v1_runtime_assets_warmup_post: {
    method: "post",
    path: "/api/v1/runtime-assets/warmup",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  search_api_v1_search_get: {
    method: "get",
    path: "/api/v1/search",
    queryKeys: ["keyword"],
    queryDefaults: {"keyword": ""},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {"422": "HTTPValidationError"},
  },
  sentiment_analysis_api_v1_sentiment_analysis_analyze_post: {
    method: "post",
    path: "/api/v1/sentiment-analysis/analyze",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {"422": "HTTPValidationError"},
  },
  sentiment_analysis_metadata_api_v1_sentiment_analysis_metadata_get: {
    method: "get",
    path: "/api/v1/sentiment-analysis/metadata",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  text_generation_api_v1_text_generation_generate_post: {
    method: "post",
    path: "/api/v1/text-generation/generate",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {"422": "HTTPValidationError"},
  },
  text_generation_history_api_v1_text_generation_history_get: {
    method: "get",
    path: "/api/v1/text-generation/history",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
  text_generation_metadata_api_v1_text_generation_metadata_get: {
    method: "get",
    path: "/api/v1/text-generation/metadata",
    queryKeys: [],
    queryDefaults: {},
    successStatus: 200,
    responseContentTypes: ["application/json"],
    responseHeaderKeys: [],
    errorResponseSchemas: {},
  },
} as const;
