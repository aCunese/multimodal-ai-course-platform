from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

HistoryStatus = Literal["成功", "警告", "失败"]
GenerationType = Literal["标题", "宣传语", "短文案", "诗意表达"]
GenerationTone = Literal["正式", "活泼", "科技感", "文艺"]
SentimentLabel = Literal["正面", "中性", "负面"]
SentimentEnglishLabel = Literal["Positive", "Neutral", "Negative"]
ProviderName = Literal["local", "deepseek"]
IconName = Literal[
    "home",
    "image",
    "heart",
    "pen",
    "museum",
    "history",
    "search",
    "download",
    "file",
    "user",
    "arrow-right",
    "check",
    "spark",
    "chart",
    "layers",
    "shield",
    "cube",
    "upload",
    "refresh",
    "light",
    "filter",
    "clock",
    "database",
    "copy",
    "tag",
]


class ModuleCard(BaseModel):
    title: str
    description: str
    route: str
    statusLabel: str
    statusTone: Literal["success", "accent", "warning", "neutral"]
    icon: IconName


class MetricCard(BaseModel):
    label: str
    value: str
    caption: str
    icon: IconName


class HistoryRecord(BaseModel):
    id: str
    date: str
    time: str
    module: str
    inputType: str
    inputContent: str
    output: str
    confidence: str
    status: HistoryStatus
    route: str


class DashboardSummaryResponse(BaseModel):
    modules: list[ModuleCard]
    metrics: list[MetricCard]
    recentHistory: list[HistoryRecord]


class DashboardAction(BaseModel):
    label: str
    route: str


class DashboardMetadataResponse(BaseModel):
    pageTitle: str
    pageDescription: str
    syncLoadingMessage: str
    syncReadyMessage: str
    syncFallbackMessage: str
    heroTitle: str
    heroDescription: str
    primaryAction: DashboardAction
    secondaryAction: DashboardAction
    moduleActionLabel: str
    runtimePanelTitle: str
    runtimePanelLoadingMessage: str
    runtimePanelErrorMessage: str
    runtimeWarmActionColdLabel: str
    runtimeWarmActionReadyLabel: str
    runtimeWarmActionBusyLabel: str
    runtimeAssetCacheFileLabel: str
    runtimeAssetCacheReadyLabel: str
    runtimeAssetCacheMissingLabel: str
    runtimeAssetCacheSizeLabel: str
    runtimeAssetUpdatedAtLabel: str
    runtimeAssetMissingUpdatedAtLabel: str
    historyPanelTitle: str
    historyPanelActionLabel: str
    historyTableHeaders: list[str]


class ProjectReportPage(BaseModel):
    label: str
    path: str
    summary: str


class RuntimeAssetStatus(BaseModel):
    key: Literal["herbal-classifier", "museum-feature-index"]
    label: str
    description: str
    cachePath: str
    cacheExists: bool
    cacheReady: bool
    cacheSizeBytes: int | None = None
    cacheUpdatedAt: str | None = None
    datasetStatus: Literal["ready", "missing"]
    statusLabel: Literal["就绪", "待预热", "缺少数据"]
    statusTone: Literal["success", "warning", "neutral"]
    note: str


class RuntimeAssetsResponse(BaseModel):
    assets: list[RuntimeAssetStatus]
    summaryMessage: str


class RuntimeAssetsWarmupResponse(BaseModel):
    assets: list[RuntimeAssetStatus]
    warmedKeys: list[Literal["herbal-classifier", "museum-feature-index"]]
    totalDurationMs: int
    warmedAt: str
    summaryMessage: str


class ApiErrorResponse(BaseModel):
    detail: str


class HistoryListResponse(BaseModel):
    records: list[HistoryRecord]


class HistoryExportFilters(BaseModel):
    keyword: str
    module: str
    status: str


class HistoryExportResponse(BaseModel):
    exportedAt: str
    filters: HistoryExportFilters
    count: int
    records: list[HistoryRecord]


class HistoryExportFormatOption(BaseModel):
    label: str
    value: Literal["json", "csv"]


class ProjectOverviewSection(BaseModel):
    title: str
    body: str


class ProjectModuleSpotlight(BaseModel):
    title: str
    description: str
    route: str


class SearchSuggestion(BaseModel):
    id: str
    title: str
    subtitle: str
    description: str
    route: str
    icon: IconName
    scope: Literal["page", "history"]


class SearchResponse(BaseModel):
    keyword: str
    total: int
    results: list[SearchSuggestion]


class AppShellMetadataResponse(BaseModel):
    searchFieldAriaLabel: str
    searchPlaceholder: str
    searchResultsAriaLabel: str
    searchLoadingMessage: str
    searchEmptyMessage: str
    searchUnavailableMessage: str
    projectReportButtonLabel: str
    projectReportFallbackTitle: str
    projectReportFallbackFilename: str
    projectDeliverablesButtonLabel: str
    projectOverviewButtonLabel: str
    accountDisplayName: str
    accountRoleLabel: str


class HistoryMetadataResponse(BaseModel):
    pageTitle: str
    pageDescription: str
    syncConnectedMessage: str
    syncLoadingMessage: str
    syncReadyMessage: str
    syncFallbackMessage: str
    filterPanelTitle: str
    searchFieldLabel: str
    searchPlaceholder: str
    moduleFilterLabel: str
    statusFilterLabel: str
    exportFormatLabel: str
    clearFiltersLabel: str
    exportButtonLabel: str
    exportButtonBusyLabel: str
    exportSuccessMessageTemplate: str
    exportFallbackMessage: str
    tableTitle: str
    tableLoadingMessage: str
    tableCountTemplate: str
    tableHeaders: list[str]
    rowActionLabel: str
    projectOverviewTitle: str
    moduleSpotlightActionLabel: str
    moduleFilters: list[str]
    statusFilters: list[str]
    exportFormats: list[HistoryExportFormatOption]
    overviewSections: list[ProjectOverviewSection]
    valuePoints: list[str]
    moduleSpotlights: list[ProjectModuleSpotlight]


class ProjectReportExportResponse(BaseModel):
    generatedAt: str
    title: str
    reportVersion: str
    pages: list[ProjectReportPage]
    dashboard: DashboardSummaryResponse
    runtimeAssets: RuntimeAssetsResponse
    historyMetadata: HistoryMetadataResponse


class ImageRecognitionRequest(BaseModel):
    fileName: str = Field(min_length=1)
    width: int | None = None
    height: int | None = None
    sizeLabel: str | None = None
    imageDataUrl: str | None = None


class ProbabilityItem(BaseModel):
    label: str
    value: float


class ImageRecognitionResponse(BaseModel):
    label: str
    confidence: float
    explanation: str
    probabilities: list[ProbabilityItem]
    historyRecord: HistoryRecord


class ImageRecognitionSampleAsset(BaseModel):
    sampleId: str
    name: str
    sizeLabel: str
    dimensionsLabel: str


class ImageRecognitionModelInfoItem(BaseModel):
    label: str
    value: str


class ImageRecognitionMetadataResponse(BaseModel):
    pageTitle: str
    pageDescription: str
    syncLoadingMessage: str
    syncAnalyzingMessage: str
    syncReadyMessage: str
    syncFallbackMessage: str
    uploadPanelTitle: str
    uploadDropzoneTitle: str
    uploadHint: str
    uploadButtonLabel: str
    exampleButtonLabel: str
    uploadedPreviewTitle: str
    reuploadButtonLabel: str
    previewLoadedStatusLabel: str
    previewAnalyzingStatusLabel: str
    resultPanelTitle: str
    resultReadyStatusLabel: str
    resultAnalyzingStatusLabel: str
    predictedCategoryLabel: str
    confidenceLabel: str
    resultExplanationTitle: str
    probabilityPanelTitle: str
    modelInfoPanelTitle: str
    sampleAsset: ImageRecognitionSampleAsset
    initialResult: ImageRecognitionResponse
    modelInfo: list[ImageRecognitionModelInfoItem]


class SentimentAnalysisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class KeywordMatch(BaseModel):
    label: str
    score: float


class ModelProviderStatus(BaseModel):
    configuredProvider: ProviderName
    activeProvider: ProviderName
    enabled: bool
    statusLabel: str
    detailMessage: str


class SentimentAnalysisResponse(BaseModel):
    label: SentimentLabel
    englishLabel: SentimentEnglishLabel
    confidence: float
    score: float
    tags: list[str]
    positiveMatches: list[KeywordMatch]
    negativeMatches: list[KeywordMatch]
    explanation: str
    status: Literal["已完成", "待分析"]
    processingTime: str
    taskId: str
    completedAt: str
    providerUsed: ProviderName
    usedFallback: bool
    providerStatusMessage: str
    historyRecord: HistoryRecord


class SentimentAnalysisMetadataResponse(BaseModel):
    pageTitle: str
    pageDescription: str
    syncLoadingMessage: str
    syncAnalyzingMessage: str
    syncReadyMessage: str
    syncFallbackMessage: str
    emptyInputMessage: str
    textInputLabel: str
    clearButtonLabel: str
    sampleButtonLabel: str
    analyzeButtonLabel: str
    analyzeButtonBusyLabel: str
    positiveOnlyButtonLabel: str
    showAllButtonLabel: str
    sampleText: str
    pendingResult: SentimentAnalysisResponse
    providerStatus: ModelProviderStatus
    modelLabel: str
    analysisNote: str


class GenerationOutput(BaseModel):
    id: str
    type: GenerationType
    title: str
    body: str


class GenerationHistoryItem(BaseModel):
    id: str
    theme: str
    type: GenerationType
    tone: GenerationTone
    count: int
    time: str
    status: Literal["已生成", "草稿"]


class GenerationQualityMetric(BaseModel):
    label: str
    value: int


class TextGenerationRequest(BaseModel):
    theme: str = Field(max_length=80)
    tone: GenerationTone
    type: GenerationType
    quantity: int = Field(ge=1, le=5)


class TextGenerationResponse(BaseModel):
    outputs: list[GenerationOutput]
    historyEntry: GenerationHistoryItem
    history: list[GenerationHistoryItem]
    qualityMetrics: list[GenerationQualityMetric]
    qualityTip: str
    toneKeywords: list[str]
    generatedAt: str
    providerUsed: ProviderName
    usedFallback: bool
    providerStatusMessage: str
    historyRecord: HistoryRecord


class GenerationHistoryResponse(BaseModel):
    items: list[GenerationHistoryItem]


class TextGenerationDefaultConfig(BaseModel):
    theme: str
    tone: GenerationTone
    type: GenerationType
    quantity: int


class TextGenerationMetadataResponse(BaseModel):
    pageTitle: str
    pageDescription: str
    syncConnectingMessage: str
    syncHistoryReadyMessage: str
    syncFallbackMessage: str
    generateLoadingMessage: str
    generateSuccessMessage: str
    generateFallbackMessage: str
    restoreExampleMessage: str
    copyActionLabel: str
    copySuccessLabel: str
    copyFailureMessage: str
    restoreExampleButtonLabel: str
    generateButtonLabel: str
    generateButtonBusyLabel: str
    regenerateButtonLabel: str
    toneOptions: list[GenerationTone]
    generationTypes: list[GenerationType]
    defaultConfig: TextGenerationDefaultConfig
    providerStatus: ModelProviderStatus
    sampleOutputs: list[GenerationOutput]
    defaultQualityMetrics: list[GenerationQualityMetric]
    defaultQualityTip: str
    defaultToneKeywords: list[str]


class MuseumVisionRequest(BaseModel):
    fileName: str = Field(min_length=1)
    format: str | None = None
    dimensions: str | None = None
    sizeLabel: str | None = None
    sourceMode: Literal["sample", "upload"] = "sample"
    imageDataUrl: str | None = None


class MuseumMatch(BaseModel):
    institution: str
    score: float


class MuseumArtworkClue(BaseModel):
    title: str
    era: str
    category: str
    museumHint: str
    basis: str


class MuseumVisionResponse(BaseModel):
    name: str
    format: str
    dimensions: str
    sizeLabel: str
    sourceNote: str
    uploadedAt: str
    institution: str
    confidence: float
    description: str
    artworkClue: MuseumArtworkClue
    tags: list[str]
    matches: list[MuseumMatch]
    historyRecord: HistoryRecord


class MuseumVisionSampleAsset(BaseModel):
    id: str
    name: str
    format: str
    dimensions: str
    sizeLabel: str


class MuseumVisionDataSourceItem(BaseModel):
    title: str
    body: str


class MuseumVisionMetadataResponse(BaseModel):
    pageTitle: str
    pageDescription: str
    syncConnectingMessage: str
    syncAnalyzingMessage: str
    syncReadyMessage: str
    syncUpdateMessage: str
    syncFallbackMessage: str
    copyActionLabel: str
    copySuccessLabel: str
    copyFailureMessage: str
    exportTagsActionLabel: str
    exportTagsSuccessLabel: str
    exportTagsSuccessMessage: str
    exportTagsFallbackMessage: str
    uploadButtonLabel: str
    switchSampleButtonLabel: str
    sampleLoadedStatusLabel: str
    uploadSuccessStatusLabel: str
    sampleSourceBadgeLabel: str
    uploadSourceBadgeLabel: str
    openPreviewAriaLabel: str
    downloadPreviewAriaLabel: str
    switchPreviewAriaLabel: str
    sampleAssets: list[MuseumVisionSampleAsset]
    initialAssetId: str
    initialAnalysis: MuseumVisionResponse
    sampleDescriptionNote: str
    uploadDescriptionNote: str
    dataSourceItems: list[MuseumVisionDataSourceItem]


class MuseumVisionTagExportRequest(BaseModel):
    fileName: str = Field(min_length=1)
    institution: str = Field(min_length=1)
    tags: list[str] = Field(min_length=1)


class HealthResponse(BaseModel):
    status: Literal["ok"]
