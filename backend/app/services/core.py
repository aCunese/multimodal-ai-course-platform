from __future__ import annotations

import base64
import csv
import hashlib
import json
import math
import pickle
import re
import subprocess
import warnings
from zipfile import ZIP_DEFLATED, ZipFile
from collections import Counter, defaultdict
from datetime import datetime
from functools import lru_cache
from io import BytesIO, StringIO
from pathlib import Path
from sqlite3 import Connection
from time import perf_counter
from urllib.parse import quote

try:
    import numpy as np
except ImportError:  # pragma: no cover - exercised only when runtime deps are incomplete.
    np = None

try:
    from PIL import Image
except ImportError:  # pragma: no cover - exercised only when runtime deps are incomplete.
    Image = None

try:
    from sklearn.calibration import CalibratedClassifierCV
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
except ImportError:  # pragma: no cover - exercised only when runtime deps are incomplete.
    CalibratedClassifierCV = None
    make_pipeline = None
    StandardScaler = None
    SVC = None

from ..db import get_connection, get_runtime_path
from .llm_provider import (
    analyze_sentiment_via_deepseek,
    generate_text_via_deepseek,
    get_deepseek_settings,
    get_sentiment_deepseek_settings,
    should_use_deepseek,
)
from ..schemas import (
    AppShellMetadataResponse,
    DashboardAction,
    DashboardMetadataResponse,
    DashboardSummaryResponse,
    GenerationHistoryItem,
    GenerationHistoryResponse,
    GenerationOutput,
    GenerationQualityMetric,
    HistoryExportFormatOption,
    HistoryMetadataResponse,
    HistoryListResponse,
    ImageRecognitionMetadataResponse,
    ImageRecognitionModelInfoItem,
    HistoryRecord,
    ImageRecognitionSampleAsset,
    ImageRecognitionRequest,
    ImageRecognitionResponse,
    KeywordMatch,
    MetricCard,
    ModelProviderStatus,
    ModuleCard,
    MuseumArtworkClue,
    MuseumMatch,
    MuseumVisionDataSourceItem,
    MuseumVisionMetadataResponse,
    MuseumVisionRequest,
    MuseumVisionResponse,
    MuseumVisionSampleAsset,
    MuseumVisionTagExportRequest,
    ProbabilityItem,
    ProjectReportExportResponse,
    ProjectReportPage,
    ProjectModuleSpotlight,
    ProjectOverviewSection,
    RuntimeAssetStatus,
    RuntimeAssetsResponse,
    RuntimeAssetsWarmupResponse,
    SearchResponse,
    SearchSuggestion,
    SentimentAnalysisMetadataResponse,
    SentimentAnalysisRequest,
    SentimentAnalysisResponse,
    TextGenerationDefaultConfig,
    TextGenerationMetadataResponse,
    TextGenerationRequest,
    TextGenerationResponse,
)


class UploadValidationError(ValueError):
    """Raised when an uploaded asset cannot be decoded into a supported image."""


def _build_provider_status(
    *,
    configured_provider: str,
    active_provider: str,
    enabled: bool,
    local_label: str,
    deepseek_label: str,
    local_message: str,
    missing_key_message: str,
) -> ModelProviderStatus:
    if active_provider == "deepseek":
        return ModelProviderStatus(
            configuredProvider="deepseek",
            activeProvider="deepseek",
            enabled=enabled,
            statusLabel=f"当前{deepseek_label}：DeepSeek",
            detailMessage=f"当前已启用 DeepSeek {deepseek_label}，系统会优先使用远程模型结果。",
        )

    if configured_provider == "deepseek":
        return ModelProviderStatus(
            configuredProvider="deepseek",
            activeProvider="local",
            enabled=enabled,
            statusLabel=f"当前{local_label}（未启用 DeepSeek）",
            detailMessage=missing_key_message,
        )

    return ModelProviderStatus(
        configuredProvider="local",
        activeProvider="local",
        enabled=True,
        statusLabel=f"当前{local_label}",
        detailMessage=local_message,
    )

DASHBOARD_MODULES = [
    ModuleCard(
        title="图像识别",
        description="上传图片并识别图像类别，展示分类概率与置信度。",
        route="/image-recognition",
        statusLabel="已联调",
        statusTone="success",
        icon="image",
    ),
    ModuleCard(
        title="情感分析",
        description="输入评论文本，判断情绪倾向并输出关键词解释。",
        route="/sentiment-analysis",
        statusLabel="已联调",
        statusTone="success",
        icon="heart",
    ),
    ModuleCard(
        title="文案生成",
        description="根据主题生成标题、宣传语与短文案结果。",
        route="/text-generation",
        statusLabel="已联调",
        statusTone="success",
        icon="pen",
    ),
    ModuleCard(
        title="博物馆图像理解",
        description="识别博物馆图像来源，生成内容描述并提取关键词标签。",
        route="/museum-vision",
        statusLabel="已联调",
        statusTone="success",
        icon="museum",
    ),
]

DASHBOARD_PAGE_TITLE = "首页总览"
DASHBOARD_PAGE_DESCRIPTION = "探索多模态 AI 能力，体验前端技术，并将课程成果整理为统一的演示平台。"
DASHBOARD_SYNC_LOADING_MESSAGE = "正在同步后端汇总数据..."
DASHBOARD_SYNC_READY_MESSAGE = "已接入后端汇总接口，统计数据会随联调结果更新。"
DASHBOARD_SYNC_FALLBACK_MESSAGE = "后端汇总接口暂时不可用，当前展示的是本地演示数据。"
DASHBOARD_HERO_TITLE = "多模态 AI 课程成果平台"
DASHBOARD_HERO_DESCRIPTION = (
    "整合图像分类、文本情感分析、文本生成与博物馆图像理解实验，形成统一的 AI "
    "课程成果展示与交互平台。"
)
DASHBOARD_PRIMARY_ACTION = DashboardAction(label="开始体验", route="/image-recognition")
DASHBOARD_SECONDARY_ACTION = DashboardAction(label="查看实验模块", route="/history")
DASHBOARD_MODULE_ACTION_LABEL = "进入模块"
DASHBOARD_RUNTIME_PANEL_TITLE = "运行时资源状态"
DASHBOARD_RUNTIME_PANEL_LOADING_MESSAGE = "正在检查运行时缓存状态..."
DASHBOARD_RUNTIME_PANEL_ERROR_MESSAGE = "暂时无法读取后端运行时资源状态，请稍后重试。"
DASHBOARD_RUNTIME_WARM_ACTION_COLD_LABEL = "执行预热"
DASHBOARD_RUNTIME_WARM_ACTION_READY_LABEL = "重新预热"
DASHBOARD_RUNTIME_WARM_ACTION_BUSY_LABEL = "预热中..."
DASHBOARD_RUNTIME_ASSET_CACHE_FILE_LABEL = "缓存文件"
DASHBOARD_RUNTIME_ASSET_CACHE_READY_LABEL = "已生成"
DASHBOARD_RUNTIME_ASSET_CACHE_MISSING_LABEL = "未生成"
DASHBOARD_RUNTIME_ASSET_CACHE_SIZE_LABEL = "缓存体积"
DASHBOARD_RUNTIME_ASSET_UPDATED_AT_LABEL = "更新时间"
DASHBOARD_RUNTIME_ASSET_MISSING_UPDATED_AT_LABEL = "暂无"
DASHBOARD_HISTORY_PANEL_TITLE = "最近实验记录"
DASHBOARD_HISTORY_PANEL_ACTION_LABEL = "查看全部记录"
DASHBOARD_HISTORY_TABLE_HEADERS = ["时间", "实验模块", "输入类型", "输出结果", "状态"]

PROJECT_REPORT_PAGES = [
    ProjectReportPage(label="首页总览", path="/", summary="平台入口与综合统计"),
    ProjectReportPage(label="图像识别", path="/image-recognition", summary="上传图片并查看分类结果"),
    ProjectReportPage(label="情感分析", path="/sentiment-analysis", summary="文本情绪判断与关键词分析"),
    ProjectReportPage(label="文案生成", path="/text-generation", summary="根据主题生成课程演示文案"),
    ProjectReportPage(label="博物馆图像识别 / 描述", path="/museum-vision", summary="图像来源识别与内容描述"),
    ProjectReportPage(label="历史记录与项目说明", path="/history", summary="查看执行日志和项目结构"),
]

SEARCH_PAGE_ITEMS = [
    {
        "id": "page-home",
        "title": "首页总览",
        "subtitle": "页面入口",
        "description": "平台入口、运行时缓存状态和综合统计概览。",
        "route": "/",
        "icon": "home",
        "keywords": "首页 总览 dashboard 统计 运行时 预热 摘要",
    },
    {
        "id": "page-image-recognition",
        "title": "图像识别",
        "subtitle": "页面入口",
        "description": "上传中药图片并查看分类结果、概率分布与说明。",
        "route": "/image-recognition",
        "icon": "image",
        "keywords": "图像 识别 中药 图片 分类 huaihua dangshen herbal",
    },
    {
        "id": "page-sentiment-analysis",
        "title": "情感分析",
        "subtitle": "页面入口",
        "description": "分析评论情绪倾向、关键词和正负面匹配结果。",
        "route": "/sentiment-analysis",
        "icon": "heart",
        "keywords": "情感 分析 评论 文本 imdb sentiment flop positive negative",
    },
    {
        "id": "page-text-generation",
        "title": "文案生成",
        "subtitle": "页面入口",
        "description": "生成标题、宣传语、短文案与诗意表达结果。",
        "route": "/text-generation",
        "icon": "pen",
        "keywords": "文案 生成 标题 宣传语 短文案 诗意 表达 text generation",
    },
    {
        "id": "page-museum-vision",
        "title": "博物馆图像识别 / 描述",
        "subtitle": "页面入口",
        "description": "识别馆藏来源、生成描述并导出图像标签。",
        "route": "/museum-vision",
        "icon": "museum",
        "keywords": "博物馆 图像 描述 馆藏 smithsonian source museum",
    },
    {
        "id": "page-history",
        "title": "历史记录与项目说明",
        "subtitle": "页面入口",
        "description": "搜索任务记录、导出结果并查看项目说明结构。",
        "route": "/history",
        "icon": "history",
        "keywords": "历史 记录 项目 说明 导出 search logs",
    },
]

APP_SHELL_SEARCH_FIELD_ARIA_LABEL = "全局搜索"
APP_SHELL_SEARCH_PLACEHOLDER = "搜索实验、记录或内容..."
APP_SHELL_SEARCH_RESULTS_ARIA_LABEL = "搜索建议"
APP_SHELL_SEARCH_LOADING_MESSAGE = "正在搜索..."
APP_SHELL_SEARCH_EMPTY_MESSAGE = "未找到匹配结果，可直接回车跳转到历史记录页继续搜索。"
APP_SHELL_SEARCH_UNAVAILABLE_MESSAGE = "全局搜索接口暂时不可用，可直接回车跳转到历史记录页。"
APP_SHELL_PROJECT_REPORT_BUTTON_LABEL = "导出演示报告"
APP_SHELL_PROJECT_REPORT_FALLBACK_TITLE = "多模态 AI 课程成果平台演示报告"
APP_SHELL_PROJECT_REPORT_FALLBACK_FILENAME = "multimodal-ai-demo-report.json"
APP_SHELL_PROJECT_DELIVERABLES_BUTTON_LABEL = "导出交付包"
APP_SHELL_PROJECT_OVERVIEW_BUTTON_LABEL = "查看项目说明"
APP_SHELL_ACCOUNT_DISPLAY_NAME = "课程实验用户"
APP_SHELL_ACCOUNT_ROLE_LABEL = "学生"

SEARCH_ICON_BY_MODULE = {
    "图像识别": "image",
    "情感分析": "heart",
    "文案生成": "pen",
    "博物馆图像理解": "museum",
}

HISTORY_MODULE_FILTERS = ["全部", "图像识别", "情感分析", "文案生成", "博物馆图像理解"]
HISTORY_STATUS_FILTERS = ["全部", "成功", "警告", "失败"]
HISTORY_PAGE_TITLE = "历史记录与项目说明"
HISTORY_PAGE_DESCRIPTION = "查看平台运行记录、实验结果和项目模块说明，帮助完成课程答辩与后续开发整理。"
HISTORY_SYNC_CONNECTED_MESSAGE = "已连接历史记录接口。"
HISTORY_SYNC_LOADING_MESSAGE = "正在同步历史记录..."
HISTORY_SYNC_READY_MESSAGE = "历史记录已由后端接口实时提供。"
HISTORY_SYNC_FALLBACK_MESSAGE = "历史记录接口暂时不可用，当前展示的是本地演示数据。"
HISTORY_FILTER_PANEL_TITLE = "历史记录筛选区"
HISTORY_SEARCH_FIELD_LABEL = "搜索内容"
HISTORY_SEARCH_PLACEHOLDER = "搜索输入内容、输出结果或记录 ID..."
HISTORY_MODULE_FILTER_LABEL = "模块筛选"
HISTORY_STATUS_FILTER_LABEL = "状态筛选"
HISTORY_EXPORT_FORMAT_LABEL = "导出格式"
HISTORY_CLEAR_FILTERS_LABEL = "清空筛选"
HISTORY_EXPORT_BUTTON_LABEL = "导出"
HISTORY_EXPORT_BUTTON_BUSY_LABEL = "导出中..."
HISTORY_EXPORT_SUCCESS_MESSAGE_TEMPLATE = "历史记录已从后端导出为 {format} 文件。"
HISTORY_EXPORT_FALLBACK_MESSAGE = "历史记录导出接口暂时不可用，已导出当前页面数据。"
HISTORY_TABLE_TITLE = "历史记录表格"
HISTORY_TABLE_LOADING_MESSAGE = "正在同步..."
HISTORY_TABLE_COUNT_TEMPLATE = "共 {count} 条记录"
HISTORY_TABLE_HEADERS = ["记录 ID", "时间", "实验模块", "输入内容", "输出结果", "置信度 / 评分", "状态", "操作"]
HISTORY_ROW_ACTION_LABEL = "查看"
HISTORY_PROJECT_OVERVIEW_TITLE = "项目说明"
HISTORY_MODULE_SPOTLIGHT_ACTION_LABEL = "查看详情"
HISTORY_EXPORT_FORMATS = [
    HistoryExportFormatOption(label="JSON", value="json"),
    HistoryExportFormatOption(label="CSV", value="csv"),
]
HISTORY_OVERVIEW_SECTIONS = [
    ProjectOverviewSection(
        title="平台定位",
        body="《多模态 AI 课程成果平台》用于整合课程中的多个 AI 实验，包括图像分类、文本情感分析、文本生成和博物馆图像理解。",
    ),
    ProjectOverviewSection(
        title="当前完成度",
        body="前后端主链路已经打通，文本模块和两个图像模块都可接入真实课程数据，历史页也支持按筛选条件导出记录。",
    ),
    ProjectOverviewSection(
        title="后续方向",
        body="下一步重点转向补强可复用自动化回归、沉淀模型缓存与导出物规范，把当前联调版继续收束成稳定成品。",
    ),
]
HISTORY_VALUE_POINTS = [
    "课程实验整合",
    "多模态能力展示",
    "前后端可扩展",
    "可用于答辩演示",
    "支持后续模型接入",
]
HISTORY_MODULE_SPOTLIGHTS = [
    ProjectModuleSpotlight(
        title="图像分类模块",
        description="基于深度学习模型识别图片类别，输出类别标签、置信度和可视化分布。",
        route="/image-recognition",
    ),
    ProjectModuleSpotlight(
        title="情感分析模块",
        description="对文本内容进行情感极性判断，输出情感倾向、关键词和置信评分。",
        route="/sentiment-analysis",
    ),
    ProjectModuleSpotlight(
        title="文本生成模块",
        description="根据输入主题生成多条文案内容，支持多种表达风格和输出类型。",
        route="/text-generation",
    ),
    ProjectModuleSpotlight(
        title="跨模态图像理解模块",
        description="结合图像与知识库进行馆藏推理与描述生成，完成结构化识别结果展示。",
        route="/museum-vision",
    ),
]

SEED_HISTORY_RECORDS = [
    HistoryRecord(
        id="#1024",
        date="2026-06-05",
        time="14:25",
        module="图像识别",
        inputType="图片",
        inputContent="cat.jpg",
        output="猫",
        confidence="92.8%",
        status="成功",
        route="/image-recognition",
    ),
    HistoryRecord(
        id="#1023",
        date="2026-06-05",
        time="14:18",
        module="情感分析",
        inputType="文本",
        inputContent="IMDB 评论",
        output="正面",
        confidence="88.4%",
        status="成功",
        route="/sentiment-analysis",
    ),
    HistoryRecord(
        id="#1022",
        date="2026-06-05",
        time="13:55",
        module="文案生成",
        inputType="主题",
        inputContent="AI 课程展示",
        output="已生成 3 条",
        confidence="92%",
        status="成功",
        route="/text-generation",
    ),
    HistoryRecord(
        id="#1021",
        date="2026-06-05",
        time="13:35",
        module="博物馆图像理解",
        inputType="图片",
        inputContent="museum_01.jpg",
        output="古代青铜器",
        confidence="90.1%",
        status="成功",
        route="/museum-vision",
    ),
    HistoryRecord(
        id="#1020",
        date="2026-06-05",
        time="12:48",
        module="图像识别",
        inputType="图片",
        inputContent="dog.png",
        output="狗",
        confidence="91.3%",
        status="成功",
        route="/image-recognition",
    ),
    HistoryRecord(
        id="#1019",
        date="2026-06-05",
        time="12:30",
        module="情感分析",
        inputType="文本",
        inputContent="产品评价文本",
        output="负面",
        confidence="72.6%",
        status="警告",
        route="/sentiment-analysis",
    ),
    HistoryRecord(
        id="#1018",
        date="2026-06-05",
        time="11:50",
        module="文案生成",
        inputType="活动主题",
        inputContent="活动宣传文案",
        output="已生成 5 条",
        confidence="89%",
        status="成功",
        route="/text-generation",
    ),
    HistoryRecord(
        id="#1017",
        date="2026-06-05",
        time="11:10",
        module="博物馆图像理解",
        inputType="图片",
        inputContent="artifact_02.jpg",
        output="唐三彩骆驼俑",
        confidence="87.2%",
        status="失败",
        route="/museum-vision",
    ),
]

SEED_GENERATION_HISTORY = [
    GenerationHistoryItem(
        id="hist-1",
        theme="人工智能课程展示",
        type="标题",
        tone="科技感",
        count=3,
        time="14:32",
        status="已生成",
    ),
    GenerationHistoryItem(
        id="hist-2",
        theme="多模态 AI 应用探索",
        type="宣传语",
        tone="正式",
        count=5,
        time="14:18",
        status="已生成",
    ),
    GenerationHistoryItem(
        id="hist-3",
        theme="图像与文本的融合创新",
        type="短文案",
        tone="活泼",
        count=3,
        time="13:55",
        status="已生成",
    ),
    GenerationHistoryItem(
        id="hist-4",
        theme="走进 AI 的未来世界",
        type="诗意表达",
        tone="文艺",
        count=3,
        time="13:35",
        status="草稿",
    ),
    GenerationHistoryItem(
        id="hist-5",
        theme="课程项目亮点总结",
        type="标题",
        tone="正式",
        count=5,
        time="12:48",
        status="已生成",
    ),
]

TEXT_GENERATION_TONE_OPTIONS = ["正式", "活泼", "科技感", "文艺"]
TEXT_GENERATION_TYPES = ["标题", "宣传语", "短文案", "诗意表达"]
TEXT_GENERATION_PAGE_TITLE = "文案生成"
TEXT_GENERATION_PAGE_DESCRIPTION = "输入主题、语气和输出类型，生成适合课程答辩、海报展示和项目说明的演示文案。"
TEXT_GENERATION_SYNC_CONNECTING_MESSAGE = "正在连接文案生成接口..."
TEXT_GENERATION_SYNC_HISTORY_READY_MESSAGE = "文案生成历史记录已由后端接口提供。"
TEXT_GENERATION_SYNC_FALLBACK_MESSAGE = "文案生成接口暂时不可用，当前展示本地演示数据。"
TEXT_GENERATION_GENERATE_LOADING_MESSAGE = "正在请求文案生成接口..."
TEXT_GENERATION_GENERATE_SUCCESS_MESSAGE = "生成结果已来自后端接口，并已写入历史记录。"
TEXT_GENERATION_GENERATE_FALLBACK_MESSAGE = "文案生成接口暂时不可用，当前保留最近一次生成结果。"
TEXT_GENERATION_RESTORE_EXAMPLE_MESSAGE = "已恢复到后端默认示例配置，可继续发起后端生成。"
TEXT_GENERATION_COPY_ACTION_LABEL = "复制"
TEXT_GENERATION_COPY_SUCCESS_LABEL = "已复制"
TEXT_GENERATION_COPY_FAILURE_MESSAGE = "复制失败，请检查浏览器剪贴板权限。"
TEXT_GENERATION_RESTORE_EXAMPLE_BUTTON_LABEL = "恢复示例"
TEXT_GENERATION_GENERATE_BUTTON_LABEL = "开始生成"
TEXT_GENERATION_GENERATE_BUTTON_BUSY_LABEL = "生成中..."
TEXT_GENERATION_REGENERATE_BUTTON_LABEL = "重新生成"
TEXT_GENERATION_DEFAULT_CONFIG = TextGenerationDefaultConfig(
    theme="人工智能课程展示",
    tone="科技感",
    type="标题",
    quantity=3,
)
TEXT_GENERATION_SAMPLE_OUTPUTS = [
    GenerationOutput(
        id="gen-1",
        type="标题",
        title="课程成果平台展示标题",
        body="多模态 AI 实验一站式展示，让图像、文本与知识理解在同一界面协同呈现。",
    ),
    GenerationOutput(
        id="gen-2",
        type="宣传语",
        title="答辩宣传语",
        body="从原始实验数据到可交互演示页面，统一呈现课程成果的技术路径与应用价值。",
    ),
    GenerationOutput(
        id="gen-3",
        type="短文案",
        title="短说明文案",
        body="系统支持图像识别、情感分析、文案生成与博物馆图像理解四类任务，适合课堂汇报与课程答辩演示。",
    ),
]
TEXT_GENERATION_DEFAULT_QUALITY_METRICS = [
    GenerationQualityMetric(label="主题相关度", value=92),
    GenerationQualityMetric(label="语言流畅度", value=92),
    GenerationQualityMetric(label="创意表达", value=86),
]
TEXT_GENERATION_DEFAULT_QUALITY_TIP = "推荐用于产品化展示、模块介绍和平台价值主张区域。"
TEXT_GENERATION_DEFAULT_TONE_KEYWORDS = ["技术气质", "未来感强", "适合产品页"]


def _get_text_generation_provider_status() -> ModelProviderStatus:
    settings = get_deepseek_settings()
    return _build_provider_status(
        configured_provider=settings.provider,
        active_provider="deepseek" if should_use_deepseek(settings) else "local",
        enabled=should_use_deepseek(settings),
        local_label="生成引擎：本地模板",
        deepseek_label="生成引擎",
        local_message="当前未启用 DeepSeek 文案生成，系统将使用本地模板与诗词语料生成结果。",
        missing_key_message="已配置 DeepSeek 文案生成模式，但当前未检测到 DEEPSEEK_API_KEY，系统将回退到本地模板与诗词语料。",
    )


def _text_generation_execution_status_message(*, provider_used: str, used_fallback: bool, fallback_reason: str | None = None) -> str:
    if provider_used == "deepseek":
        return "当前生成引擎：DeepSeek"
    if used_fallback and fallback_reason == "missing-key":
        return "当前生成引擎：本地模板（未检测到 DeepSeek API Key）"
    if used_fallback:
        return "当前生成引擎：本地模板（DeepSeek 回退）"
    return "当前生成引擎：本地模板"


IMAGE_RECOGNITION_SAMPLE_ASSET = ImageRecognitionSampleAsset(
    sampleId="dangshen_1",
    name="dangshen_1.jpg",
    sizeLabel="139 KB",
    dimensionsLabel="700 × 466",
)
IMAGE_RECOGNITION_PAGE_TITLE = "图像识别"
IMAGE_RECOGNITION_PAGE_DESCRIPTION = "上传图片后，系统将基于课程图像分类模型识别图片所属类别，并展示预测结果与置信度。"
IMAGE_RECOGNITION_SYNC_LOADING_MESSAGE = "正在同步识别结果..."
IMAGE_RECOGNITION_SYNC_ANALYZING_MESSAGE = "正在调用后端识别接口..."
IMAGE_RECOGNITION_SYNC_READY_MESSAGE = "图片识别结果已接入后端接口。"
IMAGE_RECOGNITION_SYNC_FALLBACK_MESSAGE = "后端识别接口暂时不可用，当前展示最近一次结果。"
IMAGE_RECOGNITION_UPLOAD_PANEL_TITLE = "图片上传区"
IMAGE_RECOGNITION_UPLOAD_DROPZONE_TITLE = "拖拽图片到此处或点击上传"
IMAGE_RECOGNITION_UPLOAD_HINT = "支持 JPG / PNG"
IMAGE_RECOGNITION_UPLOAD_BUTTON_LABEL = "上传图片"
IMAGE_RECOGNITION_EXAMPLE_BUTTON_LABEL = "示例图片"
IMAGE_RECOGNITION_UPLOADED_PREVIEW_TITLE = "已上传图片"
IMAGE_RECOGNITION_REUPLOAD_BUTTON_LABEL = "重新上传"
IMAGE_RECOGNITION_PREVIEW_LOADED_STATUS_LABEL = "已加载"
IMAGE_RECOGNITION_PREVIEW_ANALYZING_STATUS_LABEL = "识别中"
IMAGE_RECOGNITION_RESULT_PANEL_TITLE = "识别结果"
IMAGE_RECOGNITION_RESULT_READY_STATUS_LABEL = "识别完成"
IMAGE_RECOGNITION_RESULT_ANALYZING_STATUS_LABEL = "识别中"
IMAGE_RECOGNITION_PREDICTED_CATEGORY_LABEL = "预测类别"
IMAGE_RECOGNITION_CONFIDENCE_LABEL = "置信度"
IMAGE_RECOGNITION_RESULT_EXPLANATION_TITLE = "结果解释"
IMAGE_RECOGNITION_PROBABILITY_PANEL_TITLE = "分类概率分布"
IMAGE_RECOGNITION_MODEL_INFO_PANEL_TITLE = "模型信息"
IMAGE_RECOGNITION_INITIAL_RESULT = ImageRecognitionResponse(
    label="党参",
    confidence=90.5,
    explanation="图像的条状根茎结构、褐黄色纹理和表面纤维细节与课程样本中的党参特征更接近。",
    probabilities=[
        ProbabilityItem(label="党参", value=90.5),
        ProbabilityItem(label="百合", value=4.1),
        ProbabilityItem(label="金银花", value=2.3),
        ProbabilityItem(label="槐花", value=1.9),
        ProbabilityItem(label="枸杞", value=1.2),
    ],
    historyRecord=HistoryRecord(
        id="#1024",
        date="2026-06-05",
        time="14:25",
        module="图像识别",
        inputType="图片",
        inputContent="dangshen_1.jpg",
        output="党参",
        confidence="90.5%",
        status="成功",
        route="/image-recognition",
    ),
)
IMAGE_RECOGNITION_MODEL_INFO = [
    ImageRecognitionModelInfoItem(label="模型类型", value="课程中药样本分类器"),
    ImageRecognitionModelInfoItem(label="输入格式", value="上传图片内容 + 颜色 / 纹理特征"),
    ImageRecognitionModelInfoItem(label="输出类型", value="5 类中药材概率"),
    ImageRecognitionModelInfoItem(label="应用场景", value="课程中药图像分类实验演示"),
]
MUSEUM_VISION_SAMPLE_ASSETS = [
    MuseumVisionSampleAsset(
        id="portrait",
        name="portrait_classical.jpg",
        format="JPG",
        dimensions="960 × 1280",
        sizeLabel="1.82 MB",
    ),
    MuseumVisionSampleAsset(
        id="landscape",
        name="museum_sample.jpg",
        format="JPG",
        dimensions="768 × 768",
        sizeLabel="0.68 MB",
    ),
]
MUSEUM_VISION_PAGE_TITLE = "博物馆图像识别 / 描述"
MUSEUM_VISION_PAGE_DESCRIPTION = "上传博物馆图像后，系统将识别图像来源，生成内容描述，并提取艺术品相关标签。"
MUSEUM_VISION_SYNC_CONNECTING_MESSAGE = "正在连接博物馆图像理解接口..."
MUSEUM_VISION_SYNC_ANALYZING_MESSAGE = "正在请求博物馆图像理解接口..."
MUSEUM_VISION_SYNC_READY_MESSAGE = "博物馆图像理解结果已由后端接口提供。"
MUSEUM_VISION_SYNC_UPDATE_MESSAGE = "博物馆图像理解结果已更新并写入历史记录。"
MUSEUM_VISION_SYNC_FALLBACK_MESSAGE = "博物馆图像接口暂时不可用，当前展示本地演示数据。"
MUSEUM_VISION_COPY_ACTION_LABEL = "复制描述"
MUSEUM_VISION_COPY_SUCCESS_LABEL = "已复制"
MUSEUM_VISION_COPY_FAILURE_MESSAGE = "复制失败，请检查浏览器剪贴板权限。"
MUSEUM_VISION_EXPORT_TAGS_ACTION_LABEL = "导出标签"
MUSEUM_VISION_EXPORT_TAGS_SUCCESS_LABEL = "已导出"
MUSEUM_VISION_EXPORT_TAGS_SUCCESS_MESSAGE = "标签导出文件已由后端接口生成。"
MUSEUM_VISION_EXPORT_TAGS_FALLBACK_MESSAGE = "标签导出接口暂时不可用，已导出当前页面标签。"
MUSEUM_VISION_UPLOAD_BUTTON_LABEL = "上传图像"
MUSEUM_VISION_SWITCH_SAMPLE_BUTTON_LABEL = "切换样例"
MUSEUM_VISION_SAMPLE_LOADED_STATUS_LABEL = "已载入样例"
MUSEUM_VISION_UPLOAD_SUCCESS_STATUS_LABEL = "上传成功"
MUSEUM_VISION_SAMPLE_SOURCE_BADGE_LABEL = "课程样例"
MUSEUM_VISION_UPLOAD_SOURCE_BADGE_LABEL = "本地文件"
MUSEUM_VISION_OPEN_PREVIEW_ARIA_LABEL = "打开预览大图"
MUSEUM_VISION_DOWNLOAD_PREVIEW_ARIA_LABEL = "下载当前图片"
MUSEUM_VISION_SWITCH_PREVIEW_ARIA_LABEL = "切换样例图片"
MUSEUM_VISION_INITIAL_ASSET_ID = "portrait"
MUSEUM_VISION_INITIAL_ANALYSIS = MuseumVisionResponse(
    name="portrait_classical.jpg",
    format="JPG",
    dimensions="960 × 1280",
    sizeLabel="1.82 MB",
    sourceNote="来源样例：大都会肖像馆藏样例",
    uploadedAt="2026-06-06 12:00:00",
    institution="大都会艺术博物馆",
    confidence=89.6,
    description="这是一幅具有古典风格的人物绘画作品，画面主体位于中央，背景色调柔和，整体呈现典型的博物馆藏品图像特征。",
    artworkClue=MuseumArtworkClue(
        title="古典人物肖像",
        era="古典风格",
        category="人物肖像",
        museumHint="大都会艺术博物馆",
        basis="该线索根据课程样例名称与画面中的人物构图特征生成，用于帮助说明作品题材。",
    ),
    tags=["人物肖像", "古典绘画", "博物馆藏品", "暖色调", "历史艺术", "服饰细节", "构图分析"],
    matches=[
        MuseumMatch(institution="大都会艺术博物馆", score=89.6),
        MuseumMatch(institution="哈佛艺术博物馆", score=6.2),
        MuseumMatch(institution="普林斯顿大学艺术博物馆", score=2.8),
        MuseumMatch(institution="史密森学会", score=1.4),
    ],
    historyRecord=HistoryRecord(
        id="#1021",
        date="2026-06-05",
        time="13:35",
        module="博物馆图像理解",
        inputType="图片",
        inputContent="museum_01.jpg",
        output="古代青铜器",
        confidence="90.1%",
        status="成功",
        route="/museum-vision",
    ),
)
MUSEUM_VISION_SAMPLE_DESCRIPTION_NOTE = "当前描述结合样例图像的主体内容、构图风格与课程实验设定生成。"
MUSEUM_VISION_UPLOAD_DESCRIPTION_NOTE = (
    "当前描述会同时参考上传文件名中的作品线索，以及图像颜色、纹理与构图特征，再结合课程数据集中的相似样本生成。"
)
MUSEUM_VISION_DATA_SOURCE_ITEMS = [
    MuseumVisionDataSourceItem(
        title="数据来源",
        body="本模块基于课程中的图像理解 / 跨模态实验设计，数据来源包括哈佛艺术博物馆、大都会艺术博物馆、普林斯顿大学艺术博物馆、史密森学会等馆藏图像数据。",
    ),
    MuseumVisionDataSourceItem(
        title="当前状态",
        body="当前页面已具备样例切换、本地上传、课程数据集相似度比对、来源匹配和描述生成的联调链路。",
    ),
]
SENTIMENT_ANALYSIS_SAMPLE_TEXT = "This movie is wonderful, visually stunning and emotionally moving."
SENTIMENT_ANALYSIS_PAGE_TITLE = "情感分析"
SENTIMENT_ANALYSIS_PAGE_DESCRIPTION = "输入评论文本，系统将判断文本情绪倾向，并展示情感类别、置信度和关键词分析。"
SENTIMENT_ANALYSIS_SYNC_LOADING_MESSAGE = "正在同步情感分析结果..."
SENTIMENT_ANALYSIS_SYNC_ANALYZING_MESSAGE = "正在调用情感分析接口..."
SENTIMENT_ANALYSIS_SYNC_READY_MESSAGE = "情感分析结果已接入后端接口。"
SENTIMENT_ANALYSIS_SYNC_FALLBACK_MESSAGE = "情感分析接口暂时不可用，当前保留最近一次分析结果。"
SENTIMENT_ANALYSIS_EMPTY_INPUT_MESSAGE = "请输入文本后再调用分析接口。"
SENTIMENT_ANALYSIS_TEXT_INPUT_LABEL = "请输入需要分析的文本（支持中英文）"
SENTIMENT_ANALYSIS_CLEAR_BUTTON_LABEL = "清空"
SENTIMENT_ANALYSIS_SAMPLE_BUTTON_LABEL = "示例文本"
SENTIMENT_ANALYSIS_ANALYZE_BUTTON_LABEL = "开始分析"
SENTIMENT_ANALYSIS_ANALYZE_BUTTON_BUSY_LABEL = "分析中..."
SENTIMENT_ANALYSIS_POSITIVE_ONLY_BUTTON_LABEL = "仅积极"
SENTIMENT_ANALYSIS_SHOW_ALL_BUTTON_LABEL = "显示全部"
SENTIMENT_ANALYSIS_PENDING_RESULT = SentimentAnalysisResponse(
    label="中性",
    englishLabel="Neutral",
    confidence=50,
    score=0,
    tags=["待分析"],
    positiveMatches=[
        KeywordMatch(label="精彩", score=0.94),
        KeywordMatch(label="出色", score=0.89),
        KeywordMatch(label="感人", score=0.83),
        KeywordMatch(label="动人", score=0.82),
        KeywordMatch(label="推荐", score=0.78),
    ],
    negativeMatches=[
        KeywordMatch(label="拖沓", score=0.21),
        KeywordMatch(label="节奏慢", score=0.18),
        KeywordMatch(label="无聊", score=0.16),
    ],
    explanation="请输入文本并点击“开始分析”，系统会根据关键词和语义倾向给出情感判断。",
    status="待分析",
    processingTime="--",
    taskId="SA-PENDING",
    completedAt="--",
    providerUsed="local",
    usedFallback=False,
    providerStatusMessage="当前分析引擎：本地词典",
    historyRecord=HistoryRecord(
        id="#1023",
        date="2026-06-05",
        time="14:18",
        module="情感分析",
        inputType="文本",
        inputContent="IMDB 评论",
        output="正面",
        confidence="88.4%",
        status="成功",
        route="/sentiment-analysis",
    ),
)
SENTIMENT_ANALYSIS_MODEL_LABEL = "IMDB 评论情感分析"
SENTIMENT_ANALYSIS_NOTE = (
    "本模型基于 IMDb 电影评论数据集训练，能够识别文本情感倾向，并提供置信度评分与关键词重要性分析，帮助用户快速理解文本的情绪表达。"
)


def _get_sentiment_provider_status() -> ModelProviderStatus:
    settings = get_sentiment_deepseek_settings()
    return _build_provider_status(
        configured_provider=settings.provider,
        active_provider="deepseek" if should_use_deepseek(settings) else "local",
        enabled=should_use_deepseek(settings),
        local_label="分析引擎：本地词典",
        deepseek_label="分析引擎",
        local_message="当前未启用 DeepSeek 情感分析，系统使用本地 IMDb 词典规则完成判断。",
        missing_key_message="已配置 DeepSeek 情感分析模式，但当前未检测到 DEEPSEEK_API_KEY，系统将回退到本地 IMDb 词典规则。",
    )


def _sentiment_execution_status_message(*, provider_used: str, used_fallback: bool) -> str:
    if provider_used == "deepseek":
        return "当前分析引擎：DeepSeek"
    if used_fallback:
        return "当前分析引擎：本地词典（DeepSeek 回退）"
    return "当前分析引擎：本地词典"

CURATED_SENTIMENT_OVERRIDES = {
    "wonderful": 0.94,
    "excellent": 0.89,
    "touching": 0.83,
    "moving": 0.82,
    "recommended": 0.78,
    "stunning": 0.74,
    "beautiful": 0.72,
    "great": 0.68,
    "good": 0.58,
    "long": -0.21,
    "slow": -0.18,
    "boring": -0.16,
    "bad": -0.48,
    "awful": -0.78,
    "terrible": -0.82,
    "poor": -0.55,
}

SENTIMENT_KEYWORD_TRANSLATIONS = {
    "wonderful": "精彩",
    "excellent": "出色",
    "touching": "感人",
    "moving": "动人",
    "recommended": "推荐",
    "stunning": "惊艳",
    "beautiful": "优美",
    "great": "优秀",
    "good": "不错",
    "long": "拖沓",
    "slow": "节奏慢",
    "boring": "无聊",
    "bad": "糟糕",
    "awful": "很差",
    "terrible": "差劲",
    "poor": "薄弱",
    "flop": "失败",
    "copied": "缺乏新意",
}

CURATED_SENTIMENT_PHRASES = {
    "喜欢": 0.78,
    "开心": 0.84,
    "高兴": 0.8,
    "满意": 0.71,
    "感动": 0.79,
    "惊喜": 0.76,
    "安心": 0.66,
    "治愈": 0.74,
    "推荐": 0.68,
    "太棒了": 0.95,
    "讨厌": -0.94,
    "崩溃": -0.98,
    "难过": -0.84,
    "伤心": -0.86,
    "失望": -0.78,
    "生气": -0.85,
    "愤怒": -0.9,
    "焦虑": -0.82,
    "压抑": -0.8,
    "难受": -0.79,
    "痛苦": -0.88,
    "糟糕": -0.76,
    "恶心": -0.88,
    "害怕": -0.74,
    "恐惧": -0.8,
    "后悔": -0.7,
    "受不了": -0.9,
    "不能接受": -0.92,
}

SENTIMENT_INTENSIFIER_WEIGHTS = (
    ("超级", 1.42),
    ("极其", 1.38),
    ("特别", 1.3),
    ("非常", 1.28),
    ("太", 1.22),
    ("真的", 1.18),
    ("很", 1.12),
)

SENTIMENT_SOFTENER_WEIGHTS = (
    ("有一点", 0.78),
    ("有点", 0.8),
    ("稍微", 0.82),
    ("有些", 0.86),
    ("一点点", 0.72),
)

SENTIMENT_NEGATIONS = ("并不", "不是", "没有", "没", "不", "无")

SENTIMENT_STOP_WORDS = {
    "this",
    "that",
    "these",
    "those",
    "movie",
    "film",
    "films",
    "movies",
    "acting",
    "story",
    "characters",
    "character",
    "plot",
    "director",
    "really",
    "very",
    "just",
    "also",
    "into",
    "with",
    "from",
    "visually",
    "visuals",
    "their",
    "about",
    "would",
    "could",
    "should",
    "expected",
    "emotionally",
    "okay",
    "fine",
}

TONE_KEYWORDS = {
    "正式": ["结构清晰", "适合答辩", "语言稳健"],
    "活泼": ["传播轻快", "适合展示", "记忆点强"],
    "科技感": ["技术气质", "未来感强", "适合产品页"],
    "文艺": ["语言柔和", "画面感强", "适合项目说明"],
}

QUALITY_TIPS = {
    "正式": "推荐用于课程答辩封面、项目说明页和成果汇报摘要。",
    "活泼": "推荐用于海报、班级展示页和对外传播的短句模块。",
    "科技感": "推荐用于产品化展示、模块介绍和平台价值主张区域。",
    "文艺": "推荐用于作品陈述、收尾总结和具氛围感的项目描述。",
}

POETRY_DATASET_PATH = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "experiments"
    / "experiment-02-text-analysis-generation"
    / "datasets"
    / "poetry.txt"
)

IMDB_DATASET_DIR = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "experiments"
    / "experiment-02-text-analysis-generation"
    / "datasets"
)
IMDB_DATASET_PATH = IMDB_DATASET_DIR / "imdb.npz"
IMDB_WORD_INDEX_PATH = IMDB_DATASET_DIR / "imdb_word_index.json"
HERBAL_ARCHIVE_PATH = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "experiments"
    / "experiment-01-herbal-image-classification"
    / "archives"
    / "data.rar"
)
HERBAL_DATASET_ROOT = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "experiments"
    / "experiment-01-herbal-image-classification"
    / "dataset"
    / "data"
)
HERBAL_LABELS = {
    "baihe": "百合",
    "dangshen": "党参",
    "gouqi": "枸杞",
    "huaihua": "槐花",
    "jinyinhua": "金银花",
}
HERBAL_DESCRIPTIONS = {
    "baihe": "图像中呈现片状、浅米黄色和较柔和的纹理特征，整体更接近课程样本中的百合切片外观。",
    "dangshen": "图像的条状根茎结构、褐黄色纹理和表面纤维细节与课程样本中的党参特征更接近。",
    "gouqi": "图像中红橙色颗粒和果实聚集形态明显，颜色分布与课程样本中的枸杞最为接近。",
    "huaihua": "图像的花蕾密集度、黄绿色调和碎花结构更接近课程样本中的槐花外观。",
    "jinyinhua": "图像呈现细长花蕾和偏浅色花材纹理，整体与课程样本中的金银花特征更吻合。",
}
HERBAL_PROBABILITY_ORDER = ["dangshen", "gouqi", "huaihua", "jinyinhua", "baihe"]
HERBAL_MODEL_CACHE_VERSION = "herbal-classifier-v1"
HERBAL_GOUQI_REFINEMENT_MIN_BRIGHT_RED_COVERAGE = 0.18
HERBAL_GOUQI_REFINEMENT_MAX_MARGIN = 0.13
HERBAL_GOUQI_REFINEMENT_MIN_CROP_CONFIDENCE = 0.65
MUSEUM_INDEX_CACHE_VERSION = "museum-feature-index-v1"
MUSEUM_IMAGE_DATASET_ROOT = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "experiments"
    / "experiment-03-museum-multimodal"
    / "images"
)
MUSEUM_INSTITUTION_LABELS = {
    "harvard": "哈佛艺术博物馆",
    "metropolitan": "大都会艺术博物馆",
    "princeton": "普林斯顿大学艺术博物馆",
    "smithsonian": "史密森学会",
}

MUSEUM_PRESETS = {
    "portrait": {
        "sourceNote": "来源样例：大都会肖像馆藏样例",
        "institution": "大都会艺术博物馆",
        "confidence": 89.6,
        "description": "这是一幅具有古典风格的人物绘画作品，画面主体位于中央，背景色调柔和，整体呈现典型的博物馆藏品图像特征。",
        "artworkClue": MuseumArtworkClue(
            title="古典人物肖像",
            era="古典风格",
            category="人物肖像",
            museumHint="大都会艺术博物馆",
            basis="该线索根据课程样例名称与人物构图特征生成，用于说明画面题材。",
        ),
        "tags": ["人物肖像", "古典绘画", "博物馆藏品", "暖色调", "历史艺术", "服饰细节", "构图分析"],
        "matches": [
            MuseumMatch(institution="大都会艺术博物馆", score=89.6),
            MuseumMatch(institution="哈佛艺术博物馆", score=6.2),
            MuseumMatch(institution="普林斯顿大学艺术博物馆", score=2.8),
            MuseumMatch(institution="史密森学会", score=1.4),
        ],
    },
    "landscape": {
        "sourceNote": "来源样例：大都会馆藏山水样例",
        "institution": "大都会艺术博物馆",
        "confidence": 91.2,
        "description": "图像呈现典型山水留白结构，近景与远景层次清晰，整体风格偏向东方传统绘画，具有较强的馆藏检索特征。",
        "artworkClue": MuseumArtworkClue(
            title="东方山水画",
            era="传统绘画风格",
            category="山水画",
            museumHint="大都会艺术博物馆",
            basis="该线索根据课程样例名称与山水留白构图特征生成，用于说明画面题材。",
        ),
        "tags": ["山水", "纸本", "墨色层次", "馆藏溯源", "东方绘画", "留白构图", "题跋分析"],
        "matches": [
            MuseumMatch(institution="大都会艺术博物馆", score=91.2),
            MuseumMatch(institution="哈佛艺术博物馆", score=5.6),
            MuseumMatch(institution="普林斯顿大学艺术博物馆", score=2.0),
            MuseumMatch(institution="史密森学会", score=1.2),
        ],
    },
}


def _now() -> datetime:
    return datetime.now()


def _format_date_time(value: datetime | None = None) -> tuple[str, str]:
    current = value or _now()
    return current.strftime("%Y-%m-%d"), current.strftime("%H:%M")


def _format_timestamp(value: datetime | None = None) -> str:
    current = value or _now()
    return current.strftime("%Y-%m-%d %H:%M:%S")


def _format_clock(value: datetime | None = None) -> str:
    current = value or _now()
    return current.strftime("%H:%M")


@lru_cache(maxsize=1)
def _load_poetry_entries() -> list[tuple[str, str]]:
    if not POETRY_DATASET_PATH.exists():
        return []

    entries: list[tuple[str, str]] = []
    with POETRY_DATASET_PATH.open(encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or ":" not in line:
                continue
            title, body = line.split(":", 1)
            if title and body:
                entries.append((title.strip(), body.strip()))
    return entries


def _theme_tokens(theme: str) -> list[str]:
    tokens = re.findall(r"[\u4e00-\u9fff]{2,}|[A-Za-z]{3,}", theme)
    return [token.lower() for token in tokens if token.strip()]


def _pick_poetry_entries(theme: str, limit: int) -> list[tuple[str, str]]:
    corpus = _load_poetry_entries()
    if not corpus:
        return []

    tokens = _theme_tokens(theme)
    if tokens:
        matched = [
            (title, body)
            for title, body in corpus
            if any(token in title.lower() or token in body.lower() for token in tokens)
        ]
        if matched:
            return matched[:limit]

    start = sum(ord(char) for char in theme.strip()) % len(corpus) if theme.strip() else 0
    selected: list[tuple[str, str]] = []
    for index in range(limit):
        selected.append(corpus[(start + index) % len(corpus)])
    return selected


@lru_cache(maxsize=1)
def _load_imdb_sentiment_lexicon() -> dict[str, float]:
    if np is None or not IMDB_DATASET_PATH.exists() or not IMDB_WORD_INDEX_PATH.exists():
        return {}

    word_index = json.loads(IMDB_WORD_INDEX_PATH.read_text(encoding="utf-8"))
    reverse_index = {value + 3: key for key, value in word_index.items()}

    positive_counts: Counter[int] = Counter()
    negative_counts: Counter[int] = Counter()
    document_counts: Counter[int] = Counter()

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with np.load(IMDB_DATASET_PATH, allow_pickle=True) as dataset:
            for sequence, label in zip(dataset["x_train"], dataset["y_train"]):
                unique_tokens = {int(token) for token in sequence if int(token) >= 4}
                document_counts.update(unique_tokens)
                if int(label) == 1:
                    positive_counts.update(unique_tokens)
                else:
                    negative_counts.update(unique_tokens)

    lexicon: dict[str, float] = {}
    for token, total_documents in document_counts.items():
        word = reverse_index.get(token)
        if word is None:
            continue
        if not re.fullmatch(r"[a-z']{3,}", word):
            continue
        if word in SENTIMENT_STOP_WORDS:
            continue
        if total_documents < 40:
            continue

        score = math.log((positive_counts[token] + 1) / (negative_counts[token] + 1))
        if abs(score) < 0.12:
            continue
        lexicon[word] = round(score, 4)

    return lexicon


@lru_cache(maxsize=1)
def _combined_sentiment_lexicon() -> dict[str, float]:
    return {**_load_imdb_sentiment_lexicon(), **CURATED_SENTIMENT_OVERRIDES}


def _keyword_importance(score: float) -> float:
    return round(min(0.99, math.tanh(abs(score) * 1.8)), 2)


def _display_sentiment_keyword(word: str) -> str:
    return SENTIMENT_KEYWORD_TRANSLATIONS.get(word, word)


def _upsert_sentiment_match(
    bucket: dict[str, KeywordMatch],
    *,
    label: str,
    score: float,
) -> None:
    importance = _keyword_importance(score)
    existing = bucket.get(label)
    if existing is None or importance > existing.score:
        bucket[label] = KeywordMatch(label=label, score=importance)


def _iter_phrase_occurrences(text: str, phrase: str) -> list[int]:
    positions: list[int] = []
    start = 0
    while True:
        index = text.find(phrase, start)
        if index == -1:
            return positions
        positions.append(index)
        start = index + len(phrase)


def _apply_phrase_sentiment_context(*, text: str, phrase: str, start: int, base_score: float) -> float:
    leading_context = text[max(0, start - 4) : start]
    trailing_context = text[start + len(phrase) : start + len(phrase) + 2]
    multiplier = 1.0

    for token, factor in SENTIMENT_SOFTENER_WEIGHTS:
        if token in leading_context:
            multiplier = min(multiplier, factor)

    for token, factor in SENTIMENT_INTENSIFIER_WEIGHTS:
        if token in leading_context:
            multiplier = max(multiplier, factor)

    if any(leading_context.endswith(token) for token in SENTIMENT_NEGATIONS):
        multiplier *= -0.72

    punctuation_window = text[max(0, start - 1) : start + len(phrase) + 2]
    if any(mark in punctuation_window for mark in ("!", "！")):
        multiplier *= 1.06

    if any(token in trailing_context for token in ("死了", "爆了")):
        multiplier *= 1.08

    return round(base_score * multiplier, 4)


def _extract_sentiment_matches(text: str) -> tuple[list[KeywordMatch], list[KeywordMatch], float]:
    words = list(dict.fromkeys(re.findall(r"[a-z']+", text.lower())))
    lexicon = _combined_sentiment_lexicon()
    positive_matches: dict[str, KeywordMatch] = {}
    negative_matches: dict[str, KeywordMatch] = {}
    raw_score = 0.0

    for word in words:
        score = lexicon.get(word)
        if score is None:
            continue
        raw_score += score
        label = _display_sentiment_keyword(word)
        if score > 0:
            _upsert_sentiment_match(positive_matches, label=label, score=score)
        else:
            _upsert_sentiment_match(negative_matches, label=label, score=score)

    for phrase, base_score in CURATED_SENTIMENT_PHRASES.items():
        for start in _iter_phrase_occurrences(text, phrase):
            adjusted_score = _apply_phrase_sentiment_context(text=text, phrase=phrase, start=start, base_score=base_score)
            if adjusted_score == 0:
                continue
            raw_score += adjusted_score
            if adjusted_score > 0:
                _upsert_sentiment_match(positive_matches, label=phrase, score=adjusted_score)
            else:
                _upsert_sentiment_match(negative_matches, label=phrase, score=adjusted_score)

    return list(positive_matches.values()), list(negative_matches.values()), raw_score


def _decode_data_url(data_url: str | None) -> tuple[bytes, str] | None:
    if not data_url or not data_url.startswith("data:") or "," not in data_url:
        return None

    header, encoded = data_url.split(",", 1)
    if ";base64" not in header:
        return None

    mime_type = header[5:].split(";", 1)[0] or "application/octet-stream"
    try:
        return base64.b64decode(encoded), mime_type
    except (ValueError, TypeError):
        return None


def _decode_uploaded_image_or_raise(data_url: str | None) -> tuple[bytes, str]:
    decoded = _decode_data_url(data_url)
    if decoded is None:
        raise UploadValidationError("上传的图片数据无效，请重新选择 JPG、PNG 或 WEBP 图片。")

    image_bytes, mime_type = decoded
    if not mime_type.startswith("image/"):
        raise UploadValidationError("上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。")

    return image_bytes, mime_type


def _extract_visual_feature_from_bytes(image_bytes: bytes) -> tuple[np.ndarray, dict[str, float | int | str]] | None:
    if np is None or Image is None:
        return None

    with Image.open(BytesIO(image_bytes)) as image:
        rgb = image.convert("RGB")
        width, height = rgb.size
        resized_rgb = np.asarray(rgb.resize((16, 16)), dtype=np.float32) / 255.0
        resized_gray = np.asarray(rgb.convert("L").resize((16, 16)), dtype=np.float32) / 255.0

    horizontal_edges = np.abs(np.diff(resized_gray, axis=1)).mean() if resized_gray.shape[1] > 1 else 0.0
    vertical_edges = np.abs(np.diff(resized_gray, axis=0)).mean() if resized_gray.shape[0] > 1 else 0.0
    edge_density = float((horizontal_edges + vertical_edges) / 2)
    mean_rgb = resized_rgb.mean(axis=(0, 1))
    std_rgb = resized_rgb.std(axis=(0, 1))
    grayscale_mean = float(resized_gray.mean())
    grayscale_std = float(resized_gray.std())
    aspect_ratio = width / max(height, 1)

    feature = np.concatenate(
        [
            resized_rgb.reshape(-1),
            resized_gray.reshape(-1),
            mean_rgb,
            std_rgb,
            np.array([grayscale_mean, grayscale_std, aspect_ratio, edge_density], dtype=np.float32),
        ]
    ).astype(np.float32)
    feature /= np.linalg.norm(feature) + 1e-8

    profile = {
        "width": width,
        "height": height,
        "brightness": grayscale_mean,
        "contrast": grayscale_std,
        "aspect_ratio": float(aspect_ratio),
        "warmth": float(mean_rgb[0] - mean_rgb[2]),
        "green_bias": float(mean_rgb[1] - (mean_rgb[0] + mean_rgb[2]) / 2),
        "edge_density": edge_density,
    }
    return feature, profile


def _ensure_herbal_dataset_ready() -> Path | None:
    if HERBAL_DATASET_ROOT.exists():
        return HERBAL_DATASET_ROOT

    if not HERBAL_ARCHIVE_PATH.exists():
        return None

    extract_root = HERBAL_DATASET_ROOT.parent
    extract_root.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            [
                "unar",
                "-quiet",
                "-force-overwrite",
                "-output-directory",
                str(extract_root),
                str(HERBAL_ARCHIVE_PATH),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return None

    return HERBAL_DATASET_ROOT if HERBAL_DATASET_ROOT.exists() else None


def _hog_feature(gray: np.ndarray, *, cell_size: int = 8, bins: int = 9) -> np.ndarray:
    gx = np.zeros_like(gray)
    gy = np.zeros_like(gray)
    gx[:, 1:-1] = gray[:, 2:] - gray[:, :-2]
    gy[1:-1, :] = gray[2:, :] - gray[:-2, :]
    magnitude = np.sqrt(gx * gx + gy * gy)
    orientation = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0

    features: list[np.ndarray] = []
    for y in range(0, gray.shape[0], cell_size):
        for x in range(0, gray.shape[1], cell_size):
            cell_mag = magnitude[y : y + cell_size, x : x + cell_size].ravel()
            cell_ori = orientation[y : y + cell_size, x : x + cell_size].ravel()
            hist = np.zeros(bins, dtype=np.float32)
            for value, angle in zip(cell_mag, cell_ori):
                index = min(bins - 1, int(angle / 180.0 * bins))
                hist[index] += value
            features.append(hist)
    return np.concatenate(features)


def _extract_herbal_feature_from_bytes(image_bytes: bytes) -> np.ndarray | None:
    if np is None or Image is None:
        return None

    with Image.open(BytesIO(image_bytes)) as image:
        rgb = image.convert("RGB").resize((64, 64))
        rgb_array = np.asarray(rgb, dtype=np.float32) / 255.0
        gray_array = np.asarray(rgb.convert("L"), dtype=np.float32) / 255.0
        hsv_array = np.asarray(rgb.convert("HSV"), dtype=np.float32) / 255.0

    features: list[np.ndarray] = [_hog_feature(gray_array)]
    for channel in range(3):
        hist, _ = np.histogram(rgb_array[:, :, channel], bins=16, range=(0, 1), density=True)
        features.append(hist.astype(np.float32))
    for channel in range(3):
        hist, _ = np.histogram(hsv_array[:, :, channel], bins=16, range=(0, 1), density=True)
        features.append(hist.astype(np.float32))

    return np.concatenate(features).astype(np.float32)


def _predict_herbal_probability_map(model: object, image_bytes: bytes) -> dict[str, float] | None:
    if model is None or np is None:
        return None

    feature = _extract_herbal_feature_from_bytes(image_bytes)
    if feature is None:
        return None

    probabilities = model.predict_proba([feature])[0]
    classes = list(model.classes_)
    return {label: float(score) for label, score in zip(classes, probabilities)}


def _measure_herbal_bright_red_coverage(image_bytes: bytes) -> float:
    if np is None or Image is None:
        return 0.0

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            hsv_array = np.asarray(image.convert("HSV").resize((256, 256)), dtype=np.float32) / 255.0
    except OSError:
        return 0.0

    hue = hsv_array[:, :, 0]
    saturation = hsv_array[:, :, 1]
    value = hsv_array[:, :, 2]
    mask = (((hue <= 0.06) | (hue >= 0.97)) & (saturation >= 0.5) & (value >= 0.35))
    return float(mask.mean())


def _extract_herbal_lower_focus_crop_bytes(image_bytes: bytes) -> bytes | None:
    if Image is None:
        return None

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            rgb = image.convert("RGB")
            width, height = rgb.size
            crop_top = min(height - 1, max(0, int(height * 0.35)))
            cropped = rgb.crop((0, crop_top, width, height))
            buffer = BytesIO()
            cropped.save(buffer, format="JPEG", quality=95)
    except OSError:
        return None

    return buffer.getvalue()


def _refine_herbal_probability_map_for_gouqi(
    model: object,
    image_bytes: bytes,
    probability_map: dict[str, float],
) -> dict[str, float]:
    ranked = sorted(probability_map.items(), key=lambda item: item[1], reverse=True)
    if len(ranked) < 2:
        return probability_map

    top_key, top_score = ranked[0]
    second_key, second_score = ranked[1]
    if top_key == "gouqi" or second_key != "gouqi":
        return probability_map

    bright_red_coverage = _measure_herbal_bright_red_coverage(image_bytes)
    if bright_red_coverage < HERBAL_GOUQI_REFINEMENT_MIN_BRIGHT_RED_COVERAGE:
        return probability_map

    if (top_score - second_score) > HERBAL_GOUQI_REFINEMENT_MAX_MARGIN:
        return probability_map

    focus_crop_bytes = _extract_herbal_lower_focus_crop_bytes(image_bytes)
    if focus_crop_bytes is None:
        return probability_map

    focus_probability_map = _predict_herbal_probability_map(model, focus_crop_bytes)
    if focus_probability_map is None:
        return probability_map

    if focus_probability_map.get("gouqi", 0.0) < HERBAL_GOUQI_REFINEMENT_MIN_CROP_CONFIDENCE:
        return probability_map

    if max(focus_probability_map, key=focus_probability_map.get) != "gouqi":
        return probability_map

    return focus_probability_map


def _get_herbal_classifier_cache_path() -> Path:
    return get_runtime_path(
        "herbal-classifier.pkl",
        env_var="MULTIMODAL_HERBAL_MODEL_CACHE_PATH",
    )


def _herbal_dataset_fingerprint(dataset_root: Path) -> str:
    digest = hashlib.sha256()
    digest.update(HERBAL_MODEL_CACHE_VERSION.encode("utf-8"))

    for path in sorted(dataset_root.glob("*/*.jpg")):
        stats = path.stat()
        digest.update(str(path.relative_to(dataset_root)).encode("utf-8"))
        digest.update(str(stats.st_size).encode("utf-8"))
        digest.update(str(stats.st_mtime_ns).encode("utf-8"))

    return digest.hexdigest()


def _train_herbal_classifier(dataset_root: Path) -> tuple[object | None, list[str]]:
    if (
        np is None
        or Image is None
        or CalibratedClassifierCV is None
        or make_pipeline is None
        or StandardScaler is None
        or SVC is None
    ):
        return None, []

    features: list[np.ndarray] = []
    labels: list[str] = []

    for class_key in HERBAL_LABELS:
        folder = dataset_root / class_key
        if not folder.exists():
            continue
        for path in sorted(folder.glob("*.jpg")):
            try:
                feature = _extract_herbal_feature_from_bytes(path.read_bytes())
            except OSError:
                continue
            if feature is None:
                continue
            features.append(feature)
            labels.append(class_key)

    if not features:
        return None, []

    model = make_pipeline(
        StandardScaler(),
        CalibratedClassifierCV(
            SVC(C=3.0, kernel="rbf", gamma="scale"),
            ensemble=False,
        ),
    )
    model.fit(np.stack(features), labels)
    return model, sorted(set(labels))


def _read_cached_herbal_classifier(cache_path: Path, fingerprint: str) -> dict[str, object] | None:
    if not cache_path.exists():
        return None

    try:
        with cache_path.open("rb") as handle:
            bundle = pickle.load(handle)
    except (OSError, pickle.PickleError, EOFError, AttributeError, ValueError, TypeError):
        return None

    if bundle.get("fingerprint") != fingerprint:
        return None

    model = bundle.get("model")
    classes = bundle.get("classes")
    if model is None or not isinstance(classes, list):
        return None

    return {"model": model, "classes": classes}


def _write_cached_herbal_classifier(
    cache_path: Path,
    *,
    fingerprint: str,
    model: object,
    classes: list[str],
) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = cache_path.with_suffix(".tmp")
    payload = {
        "version": HERBAL_MODEL_CACHE_VERSION,
        "fingerprint": fingerprint,
        "classes": classes,
        "model": model,
    }

    with temp_path.open("wb") as handle:
        pickle.dump(payload, handle, protocol=pickle.HIGHEST_PROTOCOL)

    temp_path.replace(cache_path)


@lru_cache(maxsize=4)
def _load_herbal_classifier_cached(
    dataset_root_value: str,
    cache_path_value: str,
    fingerprint: str,
) -> dict[str, object]:
    dataset_root = Path(dataset_root_value)
    cache_path = Path(cache_path_value)

    cached_bundle = _read_cached_herbal_classifier(cache_path, fingerprint)
    if cached_bundle is not None:
        return cached_bundle

    model, classes = _train_herbal_classifier(dataset_root)
    if model is None:
        return {"model": None, "classes": []}

    _write_cached_herbal_classifier(
        cache_path,
        fingerprint=fingerprint,
        model=model,
        classes=classes,
    )
    return {"model": model, "classes": classes}


def _load_herbal_classifier() -> dict[str, object]:
    dataset_root = _ensure_herbal_dataset_ready()
    if dataset_root is None:
        return {"model": None, "classes": []}

    cache_path = _get_herbal_classifier_cache_path()
    fingerprint = _herbal_dataset_fingerprint(dataset_root)
    return _load_herbal_classifier_cached(str(dataset_root), str(cache_path), fingerprint)


def _get_museum_feature_index_cache_path() -> Path:
    return get_runtime_path(
        "museum-feature-index.pkl",
        env_var="MULTIMODAL_MUSEUM_INDEX_CACHE_PATH",
    )


def _museum_dataset_fingerprint(dataset_root: Path) -> str:
    digest = hashlib.sha256()
    digest.update(MUSEUM_INDEX_CACHE_VERSION.encode("utf-8"))

    for path in sorted(dataset_root.glob("*/*.jpg")):
        stats = path.stat()
        digest.update(str(path.relative_to(dataset_root)).encode("utf-8"))
        digest.update(str(stats.st_size).encode("utf-8"))
        digest.update(str(stats.st_mtime_ns).encode("utf-8"))

    return digest.hexdigest()


def _build_museum_feature_index(dataset_root: Path) -> dict[str, object]:
    if np is None or Image is None or not dataset_root.exists():
        return {"features": None, "labels": [], "file_names": []}

    features: list[np.ndarray] = []
    labels: list[str] = []
    file_names: list[str] = []

    for institution_key in MUSEUM_INSTITUTION_LABELS:
        folder = dataset_root / institution_key
        for path in sorted(folder.glob("*.jpg")):
            try:
                extracted = _extract_visual_feature_from_bytes(path.read_bytes())
            except OSError:
                continue
            if extracted is None:
                continue
            feature, _ = extracted
            features.append(feature)
            labels.append(institution_key)
            file_names.append(path.name)

    if not features:
        return {"features": None, "labels": labels, "file_names": file_names}

    return {
        "features": np.stack(features),
        "labels": labels,
        "file_names": file_names,
    }


def _read_cached_museum_feature_index(cache_path: Path, fingerprint: str) -> dict[str, object] | None:
    if not cache_path.exists():
        return None

    try:
        with cache_path.open("rb") as handle:
            bundle = pickle.load(handle)
    except (OSError, pickle.PickleError, EOFError, AttributeError, ValueError, TypeError):
        return None

    if bundle.get("fingerprint") != fingerprint:
        return None

    features = bundle.get("features")
    labels = bundle.get("labels")
    file_names = bundle.get("file_names")
    if features is None or not isinstance(labels, list) or not isinstance(file_names, list):
        return None

    return {
        "features": features,
        "labels": labels,
        "file_names": file_names,
    }


def _write_cached_museum_feature_index(
    cache_path: Path,
    *,
    fingerprint: str,
    feature_index: dict[str, object],
) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = cache_path.with_suffix(".tmp")
    payload = {
        "version": MUSEUM_INDEX_CACHE_VERSION,
        "fingerprint": fingerprint,
        "features": feature_index["features"],
        "labels": feature_index["labels"],
        "file_names": feature_index["file_names"],
    }

    with temp_path.open("wb") as handle:
        pickle.dump(payload, handle, protocol=pickle.HIGHEST_PROTOCOL)

    temp_path.replace(cache_path)


@lru_cache(maxsize=4)
def _load_museum_feature_index_cached(
    dataset_root_value: str,
    cache_path_value: str,
    fingerprint: str,
) -> dict[str, object]:
    dataset_root = Path(dataset_root_value)
    cache_path = Path(cache_path_value)

    cached_bundle = _read_cached_museum_feature_index(cache_path, fingerprint)
    if cached_bundle is not None:
        return cached_bundle

    feature_index = _build_museum_feature_index(dataset_root)
    if feature_index["features"] is None:
        return feature_index

    _write_cached_museum_feature_index(
        cache_path,
        fingerprint=fingerprint,
        feature_index=feature_index,
    )
    return feature_index


def _load_museum_feature_index() -> dict[str, object]:
    if not MUSEUM_IMAGE_DATASET_ROOT.exists():
        return {"features": None, "labels": [], "file_names": []}

    cache_path = _get_museum_feature_index_cache_path()
    fingerprint = _museum_dataset_fingerprint(MUSEUM_IMAGE_DATASET_ROOT)
    return _load_museum_feature_index_cached(
        str(MUSEUM_IMAGE_DATASET_ROOT),
        str(cache_path),
        fingerprint,
    )


def _format_runtime_timestamp(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")


def _runtime_asset_status(
    *,
    key: str,
    label: str,
    description: str,
    cache_path: Path,
    dataset_ready: bool,
    cache_ready: bool,
) -> RuntimeAssetStatus:
    cache_exists = cache_path.exists()
    cache_size_bytes = cache_path.stat().st_size if cache_exists else None
    cache_updated_at = _format_runtime_timestamp(cache_path.stat().st_mtime) if cache_exists else None

    if not dataset_ready:
        status_label = "缺少数据"
        status_tone = "neutral"
        note = "课程数据集当前不可用，无法生成对应运行时缓存。"
    elif cache_ready:
        status_label = "就绪"
        status_tone = "success"
        note = "已生成可复用缓存，新后端进程启动后可直接复用。"
    else:
        status_label = "待预热"
        status_tone = "warning"
        note = "数据集已就位，但缓存尚未准备；可先执行一次预热。"

    return RuntimeAssetStatus(
        key=key,
        label=label,
        description=description,
        cachePath=str(cache_path),
        cacheExists=cache_exists,
        cacheReady=cache_ready,
        cacheSizeBytes=cache_size_bytes,
        cacheUpdatedAt=cache_updated_at,
        datasetStatus="ready" if dataset_ready else "missing",
        statusLabel=status_label,
        statusTone=status_tone,
        note=note,
    )


def _get_herbal_runtime_asset_status() -> RuntimeAssetStatus:
    dataset_root = _ensure_herbal_dataset_ready()
    cache_path = _get_herbal_classifier_cache_path()
    cache_ready = False

    if dataset_root is not None:
        fingerprint = _herbal_dataset_fingerprint(dataset_root)
        cache_ready = _read_cached_herbal_classifier(cache_path, fingerprint) is not None

    return _runtime_asset_status(
        key="herbal-classifier",
        label="中药分类器缓存",
        description="基于 experiment-01 中药样本训练的轻量分类器缓存。",
        cache_path=cache_path,
        dataset_ready=dataset_root is not None,
        cache_ready=cache_ready,
    )


def _get_museum_runtime_asset_status() -> RuntimeAssetStatus:
    cache_path = _get_museum_feature_index_cache_path()
    dataset_ready = MUSEUM_IMAGE_DATASET_ROOT.exists()
    cache_ready = False

    if dataset_ready:
        fingerprint = _museum_dataset_fingerprint(MUSEUM_IMAGE_DATASET_ROOT)
        cache_ready = _read_cached_museum_feature_index(cache_path, fingerprint) is not None

    return _runtime_asset_status(
        key="museum-feature-index",
        label="博物馆特征索引缓存",
        description="基于 experiment-03 馆藏图片构建的相似度检索特征索引。",
        cache_path=cache_path,
        dataset_ready=dataset_ready,
        cache_ready=cache_ready,
    )


def _build_runtime_assets_summary_message(assets: list[RuntimeAssetStatus]) -> str:
    if not assets:
        return "暂未获取到运行时资源状态。"

    ready_count = sum(1 for asset in assets if asset.cacheReady)
    available_count = sum(1 for asset in assets if asset.datasetStatus == "ready")

    if available_count == 0:
        return "当前没有可用课程数据集，运行时缓存尚无法建立。"

    if ready_count == available_count:
        return f"已就绪 {ready_count}/{available_count} 项运行时缓存，新后端进程可直接复用。"

    return f"当前已就绪 {ready_count}/{available_count} 项运行时缓存，建议先执行一次预热。"


def get_runtime_assets_status() -> RuntimeAssetsResponse:
    assets = [
        _get_herbal_runtime_asset_status(),
        _get_museum_runtime_asset_status(),
    ]
    return RuntimeAssetsResponse(
        assets=assets,
        summaryMessage=_build_runtime_assets_summary_message(assets),
    )


def warm_runtime_assets() -> RuntimeAssetsWarmupResponse:
    started_at = perf_counter()

    if _ensure_herbal_dataset_ready() is not None:
        _load_herbal_classifier()

    if MUSEUM_IMAGE_DATASET_ROOT.exists():
        _load_museum_feature_index()

    assets_response = get_runtime_assets_status()
    total_duration_ms = int((perf_counter() - started_at) * 1000)
    warmed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return RuntimeAssetsWarmupResponse(
        assets=assets_response.assets,
        warmedKeys=[asset.key for asset in assets_response.assets],
        totalDurationMs=total_duration_ms,
        warmedAt=warmed_at,
        summaryMessage=f"{assets_response.summaryMessage} 本次预热耗时 {total_duration_ms} ms。",
    )


def _orientation_tag(aspect_ratio: float) -> str:
    if aspect_ratio >= 1.18:
        return "横向构图"
    if aspect_ratio <= 0.84:
        return "纵向构图"
    return "近方形构图"


def _tone_tag(profile: dict[str, float | int | str]) -> str:
    warmth = float(profile["warmth"])
    green_bias = float(profile["green_bias"])
    brightness = float(profile["brightness"])

    if warmth > 0.06:
        return "暖色主调"
    if warmth < -0.06:
        return "冷色主调"
    if green_bias > 0.04:
        return "青绿色调"
    if brightness > 0.72:
        return "高亮底色"
    return "中性色调"


def _contrast_tag(contrast: float) -> str:
    if contrast >= 0.26:
        return "高反差"
    if contrast <= 0.14:
        return "低反差"
    return "中等反差"


def _edge_tag(edge_density: float) -> str:
    if edge_density >= 0.12:
        return "细节密集"
    if edge_density <= 0.06:
        return "边缘柔和"
    return "纹理均衡"


MUSEUM_FILENAME_NOISE_PATTERNS = [
    r"来自.*$",
    r"小红书.*$",
    r"微信图片.*$",
    r"截图.*$",
]

MUSEUM_ERA_PATTERNS = [
    "新石器",
    "商周",
    "春秋",
    "战国",
    "秦汉",
    "魏晋",
    "南北朝",
    "隋唐",
    "唐代",
    "宋代",
    "元代",
    "明代",
    "清代",
    "近现代",
    "民国",
    "当代",
    "明清",
    "唐",
    "宋",
    "元",
    "明",
    "清",
]

MUSEUM_CATEGORY_PATTERNS = [
    "缂丝挂画",
    "缂丝",
    "挂画",
    "山水画",
    "人物画",
    "人物肖像",
    "肖像画",
    "花鸟画",
    "书法",
    "青铜器",
    "瓷器",
    "玉器",
    "手卷",
    "册页",
    "卷轴",
]

MUSEUM_TAG_CATEGORY_MAP = {
    "人物肖像": "人物肖像",
    "山水": "山水画",
    "古典绘画": "古典绘画",
    "东方绘画": "东方绘画",
}


def _clean_museum_filename_segments(file_name: str) -> list[str]:
    stem = Path(file_name).stem
    cleaned = stem
    for pattern in MUSEUM_FILENAME_NOISE_PATTERNS:
        cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)

    raw_segments = re.split(r"[_|｜\-—]+", cleaned)
    segments: list[str] = []
    for segment in raw_segments:
        normalized = re.sub(r"\s+", " ", segment).strip(" ·.()[]【】（）")
        if not normalized:
            continue
        if not re.search(r"[\u4e00-\u9fffA-Za-z]", normalized):
            continue
        segments.append(normalized)
    return segments


def _extract_museum_hint(segments: list[str]) -> str:
    for segment in segments:
        if any(keyword in segment for keyword in ("博物馆", "美术馆", "艺术馆", "museum", "Museum")):
            return re.sub(r"(馆藏|藏品|收藏)$", "", segment).strip()
    return ""


def _extract_artwork_title(segments: list[str], museum_hint: str) -> str:
    best_title = ""
    best_score = -10
    for segment in segments:
        score = 0
        if museum_hint and museum_hint in segment:
            score -= 4
        if re.fullmatch(r"[A-Za-z0-9 ]+", segment):
            score -= 3
        if re.search(r"\d", segment):
            score -= 1
        chinese_length = len(re.findall(r"[\u4e00-\u9fff]", segment))
        score += chinese_length
        if any(keyword in segment for keyword in ("画", "缂丝", "卷", "册页", "器", "像", "图")):
            score += 3
        if any(keyword in segment for keyword in ("馆藏", "博物馆", "美术馆")):
            score -= 2
        if score > best_score:
            best_score = score
            best_title = segment
    return best_title


def _extract_era_from_text(text: str) -> str:
    for era in MUSEUM_ERA_PATTERNS:
        if era in text:
            return era
    return ""


def _extract_category_from_text(text: str, tags: list[str]) -> str:
    for category in MUSEUM_CATEGORY_PATTERNS:
        if category in text:
            return category

    for tag in tags:
        mapped = MUSEUM_TAG_CATEGORY_MAP.get(tag)
        if mapped:
            return mapped
    return ""


def _build_museum_artwork_clue(
    *,
    file_name: str,
    tags: list[str],
    fallback_institution: str,
    default_title: str = "",
) -> MuseumArtworkClue:
    segments = _clean_museum_filename_segments(file_name)
    museum_hint = _extract_museum_hint(segments)
    joined_text = " ".join(segments)
    title = _extract_artwork_title(segments, museum_hint)
    if not title:
        title = default_title

    era = _extract_era_from_text(joined_text or title)
    category = _extract_category_from_text(joined_text or title, tags)

    if not title:
        if category:
            title = f"未命名{category}"
        else:
            title = "未识别到明确作品名"

    if not museum_hint:
        museum_hint = fallback_institution

    if segments:
        basis = "该线索优先来自上传文件名中的中文文本，再结合画面题材标签做了归纳。"
    else:
        basis = "未识别到明确文件名线索，当前作品信息主要依据画面题材标签与机构相似度生成。"

    return MuseumArtworkClue(
        title=title,
        era=era,
        category=category,
        museumHint=museum_hint,
        basis=basis,
    )


def _build_museum_upload_analysis(
    payload: MuseumVisionRequest,
    image_bytes: bytes,
) -> tuple[str, float, str, str, MuseumArtworkClue, list[str], list[MuseumMatch]]:
    extracted = _extract_visual_feature_from_bytes(image_bytes)
    museum_index = _load_museum_feature_index()
    features = museum_index["features"]

    if extracted is None or features is None:
        raise ValueError("museum image feature extraction is unavailable")

    query_feature, profile = extracted
    labels = museum_index["labels"]
    file_names = museum_index["file_names"]
    similarities = features @ query_feature
    top_indices = similarities.argsort()[-10:][::-1]

    institution_scores: defaultdict[str, float] = defaultdict(float)
    institution_examples: defaultdict[str, list[str]] = defaultdict(list)
    for index in top_indices:
        similarity = max(float(similarities[index]), 0.0)
        institution_key = labels[index]
        institution_scores[institution_key] += similarity
        if len(institution_examples[institution_key]) < 3:
            institution_examples[institution_key].append(file_names[index])

    total_score = sum(institution_scores.values()) or 1.0
    matches = [
        MuseumMatch(
            institution=MUSEUM_INSTITUTION_LABELS[key],
            score=round(score / total_score * 100, 1),
        )
        for key, score in sorted(institution_scores.items(), key=lambda item: item[1], reverse=True)
    ]

    top_match = matches[0]
    top_key = next(key for key, label in MUSEUM_INSTITUTION_LABELS.items() if label == top_match.institution)
    example_names = institution_examples[top_key]
    example_text = "、".join(example_names[:2]) if example_names else "课程样本图像"

    orientation = _orientation_tag(float(profile["aspect_ratio"]))
    tone = _tone_tag(profile)
    contrast = _contrast_tag(float(profile["contrast"]))
    texture = _edge_tag(float(profile["edge_density"]))

    source_note = f"上传图像已与课程数据集比对，最相近的 {top_match.institution} 样本包括 {example_text}。"
    artwork_clue = _build_museum_artwork_clue(
        file_name=payload.fileName,
        tags=[orientation, tone, contrast, texture],
        fallback_institution=top_match.institution,
    )
    description = (
        f"系统先对上传图像的颜色分布、灰度纹理和构图比例做特征提取，再与课程博物馆图像数据集进行相似度检索。"
        f"当前图像呈现 {orientation}、{tone} 和 {contrast} 的视觉特征，整体细节表现为 {texture}，"
        f"因此结果更接近 {top_match.institution} 的馆藏图像风格。"
    )
    if artwork_clue.title != "未识别到明确作品名":
        description += (
            f" 结合上传文件名中的线索，系统还推测这件作品可概括为“{artwork_clue.title}”。"
        )
    tags = [
        "课程数据集比对",
        top_match.institution,
        orientation,
        tone,
        contrast,
        texture,
        "上传图像",
    ]
    if artwork_clue.category:
        tags.insert(2, artwork_clue.category)
    if artwork_clue.era:
        tags.insert(2, artwork_clue.era)

    confidence = round(min(98.6, max(62.0, top_match.score + 18.0)), 1)
    return top_match.institution, confidence, source_note, description, artwork_clue, tags, matches[:4]


def _confidence_value(text: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    return float(match.group(1))


def _history_to_row(record: HistoryRecord) -> tuple[str, str, str, str, str, str, str, str, str]:
    return (
        record.id,
        record.date,
        record.time,
        record.module,
        record.inputType,
        record.inputContent,
        record.output,
        record.confidence,
        record.status,
        record.route,
    )


def _generation_to_row(item: GenerationHistoryItem) -> tuple[str, str, str, str, int, str, str]:
    return (
        item.id,
        item.theme,
        item.type,
        item.tone,
        item.count,
        item.time,
        item.status,
    )


def init_db() -> None:
    connection = get_connection()
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS history_records (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                module TEXT NOT NULL,
                input_type TEXT NOT NULL,
                input_content TEXT NOT NULL,
                output TEXT NOT NULL,
                confidence TEXT NOT NULL,
                status TEXT NOT NULL,
                route TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS generation_history (
                id TEXT PRIMARY KEY,
                theme TEXT NOT NULL,
                type TEXT NOT NULL,
                tone TEXT NOT NULL,
                count INTEGER NOT NULL,
                time TEXT NOT NULL,
                status TEXT NOT NULL
            )
            """
        )
        if connection.execute("SELECT COUNT(*) FROM history_records").fetchone()[0] == 0:
            connection.executemany(
                """
                INSERT INTO history_records (
                    id, date, time, module, input_type, input_content, output, confidence, status, route
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [_history_to_row(record) for record in SEED_HISTORY_RECORDS],
            )
        if connection.execute("SELECT COUNT(*) FROM generation_history").fetchone()[0] == 0:
            connection.executemany(
                """
                INSERT INTO generation_history (id, theme, type, tone, count, time, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [_generation_to_row(item) for item in SEED_GENERATION_HISTORY],
            )
        connection.commit()
    finally:
        connection.close()


def _row_to_history(row) -> HistoryRecord:
    return HistoryRecord(
        id=row["id"],
        date=row["date"],
        time=row["time"],
        module=row["module"],
        inputType=row["input_type"],
        inputContent=row["input_content"],
        output=row["output"],
        confidence=row["confidence"],
        status=row["status"],
        route=row["route"],
    )


def _row_to_generation(row) -> GenerationHistoryItem:
    return GenerationHistoryItem(
        id=row["id"],
        theme=row["theme"],
        type=row["type"],
        tone=row["tone"],
        count=row["count"],
        time=row["time"],
        status=row["status"],
    )


def _next_history_id(connection: Connection) -> str:
    rows = connection.execute("SELECT id FROM history_records").fetchall()
    values = [int(row["id"].replace("#", "")) for row in rows if row["id"].startswith("#")]
    return f"#{(max(values) if values else 1024) + 1}"


def _next_generation_id(connection: Connection) -> str:
    rows = connection.execute("SELECT id FROM generation_history").fetchall()
    values = [int(row["id"].replace("hist-", "")) for row in rows if row["id"].startswith("hist-")]
    return f"hist-{(max(values) if values else 0) + 1}"


def add_history_record(
    *,
    module: str,
    input_type: str,
    input_content: str,
    output: str,
    confidence: str,
    status: str,
    route: str,
) -> HistoryRecord:
    connection = get_connection()
    try:
        connection.execute("BEGIN IMMEDIATE")
        record_id = _next_history_id(connection)
        date, time = _format_date_time()
        connection.execute(
            """
            INSERT INTO history_records (
                id, date, time, module, input_type, input_content, output, confidence, status, route
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (record_id, date, time, module, input_type, input_content, output, confidence, status, route),
        )
        connection.commit()
        return HistoryRecord(
            id=record_id,
            date=date,
            time=time,
            module=module,
            inputType=input_type,
            inputContent=input_content,
            output=output,
            confidence=confidence,
            status=status,
            route=route,
        )
    finally:
        connection.close()


def list_history_records(
    *,
    keyword: str = "",
    module: str = "全部",
    status: str = "全部",
    limit: int | None = None,
) -> HistoryListResponse:
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT * FROM history_records
            ORDER BY CAST(REPLACE(id, '#', '') AS INTEGER) DESC
            """
        ).fetchall()
    finally:
        connection.close()

    records = [_row_to_history(row) for row in rows]
    search_term = keyword.strip().lower()

    def include(record: HistoryRecord) -> bool:
        matches_module = module == "全部" or record.module == module
        matches_status = status == "全部" or record.status == status
        matches_keyword = True
        if search_term:
            searchable = " ".join(
                [
                    record.id,
                    record.date,
                    record.time,
                    record.module,
                    record.inputType,
                    record.inputContent,
                    record.output,
                    record.confidence,
                ]
            ).lower()
            matches_keyword = search_term in searchable
        return matches_module and matches_status and matches_keyword

    filtered = [record for record in records if include(record)]
    if limit is not None:
        filtered = filtered[:limit]
    return HistoryListResponse(records=filtered)


def get_history_metadata() -> HistoryMetadataResponse:
    return HistoryMetadataResponse(
        pageTitle=HISTORY_PAGE_TITLE,
        pageDescription=HISTORY_PAGE_DESCRIPTION,
        syncConnectedMessage=HISTORY_SYNC_CONNECTED_MESSAGE,
        syncLoadingMessage=HISTORY_SYNC_LOADING_MESSAGE,
        syncReadyMessage=HISTORY_SYNC_READY_MESSAGE,
        syncFallbackMessage=HISTORY_SYNC_FALLBACK_MESSAGE,
        filterPanelTitle=HISTORY_FILTER_PANEL_TITLE,
        searchFieldLabel=HISTORY_SEARCH_FIELD_LABEL,
        searchPlaceholder=HISTORY_SEARCH_PLACEHOLDER,
        moduleFilterLabel=HISTORY_MODULE_FILTER_LABEL,
        statusFilterLabel=HISTORY_STATUS_FILTER_LABEL,
        exportFormatLabel=HISTORY_EXPORT_FORMAT_LABEL,
        clearFiltersLabel=HISTORY_CLEAR_FILTERS_LABEL,
        exportButtonLabel=HISTORY_EXPORT_BUTTON_LABEL,
        exportButtonBusyLabel=HISTORY_EXPORT_BUTTON_BUSY_LABEL,
        exportSuccessMessageTemplate=HISTORY_EXPORT_SUCCESS_MESSAGE_TEMPLATE,
        exportFallbackMessage=HISTORY_EXPORT_FALLBACK_MESSAGE,
        tableTitle=HISTORY_TABLE_TITLE,
        tableLoadingMessage=HISTORY_TABLE_LOADING_MESSAGE,
        tableCountTemplate=HISTORY_TABLE_COUNT_TEMPLATE,
        tableHeaders=HISTORY_TABLE_HEADERS,
        rowActionLabel=HISTORY_ROW_ACTION_LABEL,
        projectOverviewTitle=HISTORY_PROJECT_OVERVIEW_TITLE,
        moduleSpotlightActionLabel=HISTORY_MODULE_SPOTLIGHT_ACTION_LABEL,
        moduleFilters=HISTORY_MODULE_FILTERS,
        statusFilters=HISTORY_STATUS_FILTERS,
        exportFormats=HISTORY_EXPORT_FORMATS,
        overviewSections=HISTORY_OVERVIEW_SECTIONS,
        valuePoints=HISTORY_VALUE_POINTS,
        moduleSpotlights=HISTORY_MODULE_SPOTLIGHTS,
    )


def search_platform(keyword: str, *, limit: int = 8) -> SearchResponse:
    normalized_keyword = keyword.strip()
    if not normalized_keyword:
        return SearchResponse(keyword="", total=0, results=[])

    lowered_keyword = normalized_keyword.lower()

    page_results = [
        SearchSuggestion(
            id=item["id"],
            title=item["title"],
            subtitle=item["subtitle"],
            description=item["description"],
            route=item["route"],
            icon=item["icon"],
            scope="page",
        )
        for item in SEARCH_PAGE_ITEMS
        if lowered_keyword in " ".join(
            [
                item["title"],
                item["subtitle"],
                item["description"],
                item["keywords"],
            ]
        ).lower()
    ]

    history_records = list_history_records(keyword=normalized_keyword, limit=limit).records
    history_results = [
        SearchSuggestion(
            id=f"history-{record.id.removeprefix('#')}",
            title=f"{record.module} · {record.output}",
            subtitle=f"历史记录 · {record.status} · {record.date} {record.time}",
            description=f"{record.inputContent} -> {record.output}",
            route=f"/history?keyword={quote(record.id)}",
            icon=SEARCH_ICON_BY_MODULE.get(record.module, "history"),
            scope="history",
        )
        for record in history_records
    ]

    results = (page_results + history_results)[:limit]
    return SearchResponse(
        keyword=normalized_keyword,
        total=len(results),
        results=results,
    )


def get_app_shell_metadata() -> AppShellMetadataResponse:
    return AppShellMetadataResponse(
        searchFieldAriaLabel=APP_SHELL_SEARCH_FIELD_ARIA_LABEL,
        searchPlaceholder=APP_SHELL_SEARCH_PLACEHOLDER,
        searchResultsAriaLabel=APP_SHELL_SEARCH_RESULTS_ARIA_LABEL,
        searchLoadingMessage=APP_SHELL_SEARCH_LOADING_MESSAGE,
        searchEmptyMessage=APP_SHELL_SEARCH_EMPTY_MESSAGE,
        searchUnavailableMessage=APP_SHELL_SEARCH_UNAVAILABLE_MESSAGE,
        projectReportButtonLabel=APP_SHELL_PROJECT_REPORT_BUTTON_LABEL,
        projectReportFallbackTitle=APP_SHELL_PROJECT_REPORT_FALLBACK_TITLE,
        projectReportFallbackFilename=APP_SHELL_PROJECT_REPORT_FALLBACK_FILENAME,
        projectDeliverablesButtonLabel=APP_SHELL_PROJECT_DELIVERABLES_BUTTON_LABEL,
        projectOverviewButtonLabel=APP_SHELL_PROJECT_OVERVIEW_BUTTON_LABEL,
        accountDisplayName=APP_SHELL_ACCOUNT_DISPLAY_NAME,
        accountRoleLabel=APP_SHELL_ACCOUNT_ROLE_LABEL,
    )


def export_history_records(
    *,
    keyword: str = "",
    module: str = "全部",
    status: str = "全部",
    export_format: str = "json",
) -> tuple[str, str, bytes]:
    response = list_history_records(keyword=keyword, module=module, status=status)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    if export_format == "csv":
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "记录 ID",
                "日期",
                "时间",
                "实验模块",
                "输入类型",
                "输入内容",
                "输出结果",
                "置信度 / 评分",
                "状态",
                "路由",
            ]
        )
        for record in response.records:
            writer.writerow(
                [
                    record.id,
                    record.date,
                    record.time,
                    record.module,
                    record.inputType,
                    record.inputContent,
                    record.output,
                    record.confidence,
                    record.status,
                    record.route,
                ]
            )

        return (
            f"history-records-{timestamp}.csv",
            "text/csv; charset=utf-8",
            buffer.getvalue().encode("utf-8-sig"),
        )

    payload = {
        "exportedAt": datetime.now().isoformat(timespec="seconds"),
        "filters": {
            "keyword": keyword.strip(),
            "module": module,
            "status": status,
        },
        "count": len(response.records),
        "records": [record.model_dump() for record in response.records],
    }
    return (
        f"history-records-{timestamp}.json",
        "application/json; charset=utf-8",
        json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8"),
    )


def export_project_report() -> tuple[str, str, bytes]:
    payload = ProjectReportExportResponse(
        generatedAt=datetime.now().isoformat(timespec="seconds"),
        title="多模态 AI 课程成果平台演示报告",
        reportVersion="v1.0",
        pages=PROJECT_REPORT_PAGES,
        dashboard=get_dashboard_summary(),
        runtimeAssets=get_runtime_assets_status(),
        historyMetadata=get_history_metadata(),
    )
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return (
        f"multimodal-ai-demo-report-{timestamp}.json",
        "application/json; charset=utf-8",
        json.dumps(payload.model_dump(), ensure_ascii=False, indent=2).encode("utf-8"),
    )


def export_project_delivery_bundle() -> tuple[str, str, bytes]:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    generated_at = datetime.now().isoformat(timespec="seconds")
    report_filename, _report_media_type, report_content = export_project_report()
    history_json_filename, _history_json_media_type, history_json_content = export_history_records(export_format="json")
    history_csv_filename, _history_csv_media_type, history_csv_content = export_history_records(export_format="csv")
    runtime_assets = get_runtime_assets_status()
    history_metadata = get_history_metadata()
    project_root = Path(__file__).resolve().parents[3]

    openapi_path = project_root / "docs" / "api" / "openapi.json"
    if openapi_path.exists():
        openapi_content = openapi_path.read_bytes()
    else:
        openapi_content = json.dumps({"warning": "openapi snapshot missing"}, ensure_ascii=False, indent=2).encode("utf-8")

    static_file_entries: list[tuple[str, str, Path]] = [
        ("README.md", "project-state", project_root / "README.md"),
        ("feature_list.json", "project-state", project_root / "feature_list.json"),
        ("progress.md", "project-state", project_root / "progress.md"),
        ("session-handoff.md", "project-state", project_root / "session-handoff.md"),
        (
            "architecture/web-architecture-spec.md",
            "architecture",
            project_root / "docs" / "architecture" / "2026-06-05-multimodal-ai-platform-web-architecture-spec.md",
        ),
        (
            "architecture/project-harness-baseline.md",
            "architecture",
            project_root / "docs" / "architecture" / "2026-06-05-project-harness-baseline.md",
        ),
        (
            "architecture/project-root-canonicalization.md",
            "architecture",
            project_root / "docs" / "architecture" / "2026-06-05-project-root-canonicalization.md",
        ),
    ]
    generated_file_entries: list[tuple[str, str, str, bytes]] = [
        ("project-report.json", "generated-report", "/api/v1/project-report/export", report_content),
        ("history-records.json", "generated-history", "/api/v1/history/export?format=json", history_json_content),
        ("history-records.csv", "generated-history", "/api/v1/history/export?format=csv", history_csv_content),
        (
            "runtime-assets.json",
            "generated-runtime",
            "/api/v1/runtime-assets",
            json.dumps(runtime_assets.model_dump(), ensure_ascii=False, indent=2).encode("utf-8"),
        ),
        (
            "history-metadata.json",
            "generated-metadata",
            "/api/v1/history/metadata",
            json.dumps(history_metadata.model_dump(), ensure_ascii=False, indent=2).encode("utf-8"),
        ),
    ]
    file_entries: list[tuple[str, bytes]] = []
    manifest_files: list[dict[str, str | int]] = []

    def detect_content_type(archive_name: str) -> str:
        suffix = Path(archive_name).suffix.lower()
        if suffix == ".json":
            return "application/json; charset=utf-8"
        if suffix == ".csv":
            return "text/csv; charset=utf-8"
        if suffix == ".md":
            return "text/markdown; charset=utf-8"
        if suffix == ".txt":
            return "text/plain; charset=utf-8"
        return "application/octet-stream"

    def build_manifest_entry(
        *,
        archive_name: str,
        category: str,
        content: bytes,
        source_kind: str,
        source_path: str,
    ) -> dict[str, str | int]:
        return {
            "path": archive_name,
            "category": category,
            "sizeBytes": len(content),
            "sha256": hashlib.sha256(content).hexdigest(),
            "contentType": detect_content_type(archive_name),
            "sourceKind": source_kind,
            "sourcePath": source_path,
        }

    for archive_name, category, source_path, content in generated_file_entries:
        file_entries.append((archive_name, content))
        manifest_files.append(
            build_manifest_entry(
                archive_name=archive_name,
                category=category,
                content=content,
                source_kind="generated",
                source_path=source_path,
            )
        )

    file_entries.append(("openapi.json", openapi_content))
    manifest_files.append(
        build_manifest_entry(
            archive_name="openapi.json",
            category="api-contract",
            content=openapi_content,
            source_kind="static",
            source_path="docs/api/openapi.json",
        )
    )

    for archive_name, category, source_path in static_file_entries:
        if not source_path.exists():
            continue
        content = source_path.read_bytes()
        file_entries.append((archive_name, content))
        manifest_files.append(
            build_manifest_entry(
                archive_name=archive_name,
                category=category,
                content=content,
                source_kind="static",
                source_path=source_path.relative_to(project_root).as_posix(),
            )
        )

    manifest = {
        "generatedAt": generated_at,
        "title": "多模态 AI 课程成果平台交付包",
        "bundleVersion": "v1.1",
        "sourceReportFile": report_filename,
        "sourceHistoryJsonFile": history_json_filename,
        "sourceHistoryCsvFile": history_csv_filename,
        "files": manifest_files,
    }

    buffer = BytesIO()
    with ZipFile(buffer, "w", compression=ZIP_DEFLATED) as archive:
        archive.writestr(
            "manifest.json",
            json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8"),
        )
        for name, content in file_entries:
            archive.writestr(name, content)

    return (
        f"multimodal-ai-delivery-bundle-{timestamp}.zip",
        "application/zip",
        buffer.getvalue(),
    )


def export_museum_tags(payload: MuseumVisionTagExportRequest) -> tuple[str, str, bytes]:
    sanitized_name = Path(payload.fileName).stem or "museum-tags"
    sanitized_name = re.sub(r"[^A-Za-z0-9._-]+", "-", sanitized_name).strip("-") or "museum-tags"
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    content = "\n".join(
        [
            f"# {payload.institution}",
            *payload.tags,
        ]
    )
    return (
        f"{sanitized_name}-tags-{timestamp}.txt",
        "text/plain; charset=utf-8",
        content.encode("utf-8"),
    )


def list_generation_history() -> GenerationHistoryResponse:
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT * FROM generation_history
            ORDER BY CAST(REPLACE(id, 'hist-', '') AS INTEGER) DESC
            """
        ).fetchall()
        return GenerationHistoryResponse(items=[_row_to_generation(row) for row in rows])
    finally:
        connection.close()


def get_text_generation_metadata() -> TextGenerationMetadataResponse:
    return TextGenerationMetadataResponse(
        pageTitle=TEXT_GENERATION_PAGE_TITLE,
        pageDescription=TEXT_GENERATION_PAGE_DESCRIPTION,
        syncConnectingMessage=TEXT_GENERATION_SYNC_CONNECTING_MESSAGE,
        syncHistoryReadyMessage=TEXT_GENERATION_SYNC_HISTORY_READY_MESSAGE,
        syncFallbackMessage=TEXT_GENERATION_SYNC_FALLBACK_MESSAGE,
        generateLoadingMessage=TEXT_GENERATION_GENERATE_LOADING_MESSAGE,
        generateSuccessMessage=TEXT_GENERATION_GENERATE_SUCCESS_MESSAGE,
        generateFallbackMessage=TEXT_GENERATION_GENERATE_FALLBACK_MESSAGE,
        restoreExampleMessage=TEXT_GENERATION_RESTORE_EXAMPLE_MESSAGE,
        copyActionLabel=TEXT_GENERATION_COPY_ACTION_LABEL,
        copySuccessLabel=TEXT_GENERATION_COPY_SUCCESS_LABEL,
        copyFailureMessage=TEXT_GENERATION_COPY_FAILURE_MESSAGE,
        restoreExampleButtonLabel=TEXT_GENERATION_RESTORE_EXAMPLE_BUTTON_LABEL,
        generateButtonLabel=TEXT_GENERATION_GENERATE_BUTTON_LABEL,
        generateButtonBusyLabel=TEXT_GENERATION_GENERATE_BUTTON_BUSY_LABEL,
        regenerateButtonLabel=TEXT_GENERATION_REGENERATE_BUTTON_LABEL,
        toneOptions=TEXT_GENERATION_TONE_OPTIONS,
        generationTypes=TEXT_GENERATION_TYPES,
        defaultConfig=TEXT_GENERATION_DEFAULT_CONFIG,
        providerStatus=_get_text_generation_provider_status(),
        sampleOutputs=TEXT_GENERATION_SAMPLE_OUTPUTS,
        defaultQualityMetrics=TEXT_GENERATION_DEFAULT_QUALITY_METRICS,
        defaultQualityTip=TEXT_GENERATION_DEFAULT_QUALITY_TIP,
        defaultToneKeywords=TEXT_GENERATION_DEFAULT_TONE_KEYWORDS,
    )


def get_image_recognition_metadata() -> ImageRecognitionMetadataResponse:
    return ImageRecognitionMetadataResponse(
        pageTitle=IMAGE_RECOGNITION_PAGE_TITLE,
        pageDescription=IMAGE_RECOGNITION_PAGE_DESCRIPTION,
        syncLoadingMessage=IMAGE_RECOGNITION_SYNC_LOADING_MESSAGE,
        syncAnalyzingMessage=IMAGE_RECOGNITION_SYNC_ANALYZING_MESSAGE,
        syncReadyMessage=IMAGE_RECOGNITION_SYNC_READY_MESSAGE,
        syncFallbackMessage=IMAGE_RECOGNITION_SYNC_FALLBACK_MESSAGE,
        uploadPanelTitle=IMAGE_RECOGNITION_UPLOAD_PANEL_TITLE,
        uploadDropzoneTitle=IMAGE_RECOGNITION_UPLOAD_DROPZONE_TITLE,
        uploadHint=IMAGE_RECOGNITION_UPLOAD_HINT,
        uploadButtonLabel=IMAGE_RECOGNITION_UPLOAD_BUTTON_LABEL,
        exampleButtonLabel=IMAGE_RECOGNITION_EXAMPLE_BUTTON_LABEL,
        uploadedPreviewTitle=IMAGE_RECOGNITION_UPLOADED_PREVIEW_TITLE,
        reuploadButtonLabel=IMAGE_RECOGNITION_REUPLOAD_BUTTON_LABEL,
        previewLoadedStatusLabel=IMAGE_RECOGNITION_PREVIEW_LOADED_STATUS_LABEL,
        previewAnalyzingStatusLabel=IMAGE_RECOGNITION_PREVIEW_ANALYZING_STATUS_LABEL,
        resultPanelTitle=IMAGE_RECOGNITION_RESULT_PANEL_TITLE,
        resultReadyStatusLabel=IMAGE_RECOGNITION_RESULT_READY_STATUS_LABEL,
        resultAnalyzingStatusLabel=IMAGE_RECOGNITION_RESULT_ANALYZING_STATUS_LABEL,
        predictedCategoryLabel=IMAGE_RECOGNITION_PREDICTED_CATEGORY_LABEL,
        confidenceLabel=IMAGE_RECOGNITION_CONFIDENCE_LABEL,
        resultExplanationTitle=IMAGE_RECOGNITION_RESULT_EXPLANATION_TITLE,
        probabilityPanelTitle=IMAGE_RECOGNITION_PROBABILITY_PANEL_TITLE,
        modelInfoPanelTitle=IMAGE_RECOGNITION_MODEL_INFO_PANEL_TITLE,
        sampleAsset=IMAGE_RECOGNITION_SAMPLE_ASSET,
        initialResult=IMAGE_RECOGNITION_INITIAL_RESULT,
        modelInfo=IMAGE_RECOGNITION_MODEL_INFO,
    )


def get_museum_vision_metadata() -> MuseumVisionMetadataResponse:
    return MuseumVisionMetadataResponse(
        pageTitle=MUSEUM_VISION_PAGE_TITLE,
        pageDescription=MUSEUM_VISION_PAGE_DESCRIPTION,
        syncConnectingMessage=MUSEUM_VISION_SYNC_CONNECTING_MESSAGE,
        syncAnalyzingMessage=MUSEUM_VISION_SYNC_ANALYZING_MESSAGE,
        syncReadyMessage=MUSEUM_VISION_SYNC_READY_MESSAGE,
        syncUpdateMessage=MUSEUM_VISION_SYNC_UPDATE_MESSAGE,
        syncFallbackMessage=MUSEUM_VISION_SYNC_FALLBACK_MESSAGE,
        copyActionLabel=MUSEUM_VISION_COPY_ACTION_LABEL,
        copySuccessLabel=MUSEUM_VISION_COPY_SUCCESS_LABEL,
        copyFailureMessage=MUSEUM_VISION_COPY_FAILURE_MESSAGE,
        exportTagsActionLabel=MUSEUM_VISION_EXPORT_TAGS_ACTION_LABEL,
        exportTagsSuccessLabel=MUSEUM_VISION_EXPORT_TAGS_SUCCESS_LABEL,
        exportTagsSuccessMessage=MUSEUM_VISION_EXPORT_TAGS_SUCCESS_MESSAGE,
        exportTagsFallbackMessage=MUSEUM_VISION_EXPORT_TAGS_FALLBACK_MESSAGE,
        uploadButtonLabel=MUSEUM_VISION_UPLOAD_BUTTON_LABEL,
        switchSampleButtonLabel=MUSEUM_VISION_SWITCH_SAMPLE_BUTTON_LABEL,
        sampleLoadedStatusLabel=MUSEUM_VISION_SAMPLE_LOADED_STATUS_LABEL,
        uploadSuccessStatusLabel=MUSEUM_VISION_UPLOAD_SUCCESS_STATUS_LABEL,
        sampleSourceBadgeLabel=MUSEUM_VISION_SAMPLE_SOURCE_BADGE_LABEL,
        uploadSourceBadgeLabel=MUSEUM_VISION_UPLOAD_SOURCE_BADGE_LABEL,
        openPreviewAriaLabel=MUSEUM_VISION_OPEN_PREVIEW_ARIA_LABEL,
        downloadPreviewAriaLabel=MUSEUM_VISION_DOWNLOAD_PREVIEW_ARIA_LABEL,
        switchPreviewAriaLabel=MUSEUM_VISION_SWITCH_PREVIEW_ARIA_LABEL,
        sampleAssets=MUSEUM_VISION_SAMPLE_ASSETS,
        initialAssetId=MUSEUM_VISION_INITIAL_ASSET_ID,
        initialAnalysis=MUSEUM_VISION_INITIAL_ANALYSIS,
        sampleDescriptionNote=MUSEUM_VISION_SAMPLE_DESCRIPTION_NOTE,
        uploadDescriptionNote=MUSEUM_VISION_UPLOAD_DESCRIPTION_NOTE,
        dataSourceItems=MUSEUM_VISION_DATA_SOURCE_ITEMS,
    )


def get_sentiment_analysis_metadata() -> SentimentAnalysisMetadataResponse:
    return SentimentAnalysisMetadataResponse(
        pageTitle=SENTIMENT_ANALYSIS_PAGE_TITLE,
        pageDescription=SENTIMENT_ANALYSIS_PAGE_DESCRIPTION,
        syncLoadingMessage=SENTIMENT_ANALYSIS_SYNC_LOADING_MESSAGE,
        syncAnalyzingMessage=SENTIMENT_ANALYSIS_SYNC_ANALYZING_MESSAGE,
        syncReadyMessage=SENTIMENT_ANALYSIS_SYNC_READY_MESSAGE,
        syncFallbackMessage=SENTIMENT_ANALYSIS_SYNC_FALLBACK_MESSAGE,
        emptyInputMessage=SENTIMENT_ANALYSIS_EMPTY_INPUT_MESSAGE,
        textInputLabel=SENTIMENT_ANALYSIS_TEXT_INPUT_LABEL,
        clearButtonLabel=SENTIMENT_ANALYSIS_CLEAR_BUTTON_LABEL,
        sampleButtonLabel=SENTIMENT_ANALYSIS_SAMPLE_BUTTON_LABEL,
        analyzeButtonLabel=SENTIMENT_ANALYSIS_ANALYZE_BUTTON_LABEL,
        analyzeButtonBusyLabel=SENTIMENT_ANALYSIS_ANALYZE_BUTTON_BUSY_LABEL,
        positiveOnlyButtonLabel=SENTIMENT_ANALYSIS_POSITIVE_ONLY_BUTTON_LABEL,
        showAllButtonLabel=SENTIMENT_ANALYSIS_SHOW_ALL_BUTTON_LABEL,
        sampleText=SENTIMENT_ANALYSIS_SAMPLE_TEXT,
        pendingResult=SENTIMENT_ANALYSIS_PENDING_RESULT,
        providerStatus=_get_sentiment_provider_status(),
        modelLabel=SENTIMENT_ANALYSIS_MODEL_LABEL,
        analysisNote=SENTIMENT_ANALYSIS_NOTE,
    )


def get_dashboard_metadata() -> DashboardMetadataResponse:
    return DashboardMetadataResponse(
        pageTitle=DASHBOARD_PAGE_TITLE,
        pageDescription=DASHBOARD_PAGE_DESCRIPTION,
        syncLoadingMessage=DASHBOARD_SYNC_LOADING_MESSAGE,
        syncReadyMessage=DASHBOARD_SYNC_READY_MESSAGE,
        syncFallbackMessage=DASHBOARD_SYNC_FALLBACK_MESSAGE,
        heroTitle=DASHBOARD_HERO_TITLE,
        heroDescription=DASHBOARD_HERO_DESCRIPTION,
        primaryAction=DASHBOARD_PRIMARY_ACTION,
        secondaryAction=DASHBOARD_SECONDARY_ACTION,
        moduleActionLabel=DASHBOARD_MODULE_ACTION_LABEL,
        runtimePanelTitle=DASHBOARD_RUNTIME_PANEL_TITLE,
        runtimePanelLoadingMessage=DASHBOARD_RUNTIME_PANEL_LOADING_MESSAGE,
        runtimePanelErrorMessage=DASHBOARD_RUNTIME_PANEL_ERROR_MESSAGE,
        runtimeWarmActionColdLabel=DASHBOARD_RUNTIME_WARM_ACTION_COLD_LABEL,
        runtimeWarmActionReadyLabel=DASHBOARD_RUNTIME_WARM_ACTION_READY_LABEL,
        runtimeWarmActionBusyLabel=DASHBOARD_RUNTIME_WARM_ACTION_BUSY_LABEL,
        runtimeAssetCacheFileLabel=DASHBOARD_RUNTIME_ASSET_CACHE_FILE_LABEL,
        runtimeAssetCacheReadyLabel=DASHBOARD_RUNTIME_ASSET_CACHE_READY_LABEL,
        runtimeAssetCacheMissingLabel=DASHBOARD_RUNTIME_ASSET_CACHE_MISSING_LABEL,
        runtimeAssetCacheSizeLabel=DASHBOARD_RUNTIME_ASSET_CACHE_SIZE_LABEL,
        runtimeAssetUpdatedAtLabel=DASHBOARD_RUNTIME_ASSET_UPDATED_AT_LABEL,
        runtimeAssetMissingUpdatedAtLabel=DASHBOARD_RUNTIME_ASSET_MISSING_UPDATED_AT_LABEL,
        historyPanelTitle=DASHBOARD_HISTORY_PANEL_TITLE,
        historyPanelActionLabel=DASHBOARD_HISTORY_PANEL_ACTION_LABEL,
        historyTableHeaders=DASHBOARD_HISTORY_TABLE_HEADERS,
    )


def add_generation_history(
    *,
    theme: str,
    generation_type: str,
    tone: str,
    count: int,
    status: str = "已生成",
) -> GenerationHistoryItem:
    connection = get_connection()
    try:
        connection.execute("BEGIN IMMEDIATE")
        item_id = _next_generation_id(connection)
        time = _format_clock()
        connection.execute(
            """
            INSERT INTO generation_history (id, theme, type, tone, count, time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (item_id, theme, generation_type, tone, count, time, status),
        )
        connection.commit()
        return GenerationHistoryItem(
            id=item_id,
            theme=theme,
            type=generation_type,
            tone=tone,
            count=count,
            time=time,
            status=status,
        )
    finally:
        connection.close()


def get_dashboard_summary() -> DashboardSummaryResponse:
    recent_history = list_history_records(limit=8).records
    history_count = list_history_records().records
    confidence_values = [
        value
        for value in (_confidence_value(record.confidence) for record in history_count)
        if value is not None
    ]
    average_confidence = round(sum(confidence_values) / len(confidence_values), 1) if confidence_values else 0.0

    metrics = [
        MetricCard(
            label="已整合实验",
            value="4 个",
            caption="涵盖图像、文本、生成与跨模态展示。",
            icon="cube",
        ),
        MetricCard(
            label="支持任务类型",
            value="图像 / 文本 / 生成 / 跨模态",
            caption="前端模块已通过统一 API 合同联通后端服务。",
            icon="layers",
        ),
        MetricCard(
            label="历史记录",
            value=f"{len(history_count)} 条",
            caption="SQLite 历史记录可驱动首页总览与项目说明页面。",
            icon="clock",
        ),
        MetricCard(
            label="平均置信度",
            value=f"{average_confidence:.1f}%",
            caption="根据当前历史记录动态计算综合置信度均值。",
            icon="chart",
        ),
    ]
    return DashboardSummaryResponse(modules=DASHBOARD_MODULES, metrics=metrics, recentHistory=recent_history)


def classify_image(payload: ImageRecognitionRequest) -> ImageRecognitionResponse:
    lower_name = payload.fileName.lower()
    decoded_upload = None
    if payload.imageDataUrl is not None:
        decoded_upload = _decode_uploaded_image_or_raise(payload.imageDataUrl)

    if decoded_upload is not None:
        image_bytes, _mime_type = decoded_upload
        classifier_bundle = _load_herbal_classifier()
        model = classifier_bundle["model"]
        try:
            probability_map = _predict_herbal_probability_map(model, image_bytes)
        except OSError:
            raise UploadValidationError("上传的图片内容无法解析，请重新选择清晰的 JPG、PNG 或 WEBP 图片。") from None

        if model is not None and probability_map is not None:
            # When the full-frame scene is ambiguous, re-check a lower subject crop
            # so bright-red gouqi berries are less likely to be diluted by props/background.
            probability_map = _refine_herbal_probability_map_for_gouqi(model, image_bytes, probability_map)
            predicted_key = max(probability_map, key=probability_map.get)
            predicted_score = probability_map[predicted_key]

            sorted_keys = sorted(
                HERBAL_PROBABILITY_ORDER,
                key=lambda item: probability_map.get(item, 0.0),
                reverse=True,
            )
            probability_items = [
                ProbabilityItem(
                    label=HERBAL_LABELS[key],
                    value=round(probability_map.get(key, 0.0) * 100, 1),
                )
                for key in sorted_keys
            ]
            label = HERBAL_LABELS[predicted_key]
            confidence = round(predicted_score * 100, 1)
            explanation = HERBAL_DESCRIPTIONS[predicted_key]
            output = label

            history_record = add_history_record(
                module="图像识别",
                input_type="图片",
                input_content=payload.fileName,
                output=output,
                confidence=f"{confidence:.1f}%",
                status="成功",
                route="/image-recognition",
            )

            return ImageRecognitionResponse(
                label=label,
                confidence=confidence,
                explanation=explanation,
                probabilities=probability_items,
                historyRecord=history_record,
            )

        raise UploadValidationError("当前上传图片暂时无法完成识别，请重新选择清晰的 JPG、PNG 或 WEBP 图片。")

    if "dog" in lower_name:
        label = "狗"
        confidence = 91.3
        explanation = "图像中犬类口鼻轮廓、耳部形态和毛色分区较明显，因此模型更偏向识别为狗。"
        probabilities = [
            ProbabilityItem(label="狗", value=91.3),
            ProbabilityItem(label="猫", value=5.8),
            ProbabilityItem(label="兔子", value=1.9),
            ProbabilityItem(label="其他", value=1.0),
        ]
        output = "狗"
    elif "rabbit" in lower_name or "bunny" in lower_name:
        label = "兔子"
        confidence = 89.1
        explanation = "长耳轮廓和头部比例与训练样本中的兔类特征更接近，因此判断结果偏向兔子。"
        probabilities = [
            ProbabilityItem(label="兔子", value=89.1),
            ProbabilityItem(label="猫", value=6.2),
            ProbabilityItem(label="狗", value=3.1),
            ProbabilityItem(label="其他", value=1.6),
        ]
        output = "兔子"
    else:
        label = "猫"
        confidence = 92.8
        explanation = "模型认为该图片具有明显的动物面部、耳朵轮廓和毛发纹理特征，因此对猫类判断置信度较高。"
        probabilities = [
            ProbabilityItem(label="猫", value=92.8),
            ProbabilityItem(label="狗", value=4.6),
            ProbabilityItem(label="兔子", value=1.8),
            ProbabilityItem(label="其他", value=0.8),
        ]
        output = "猫"

    history_record = add_history_record(
        module="图像识别",
        input_type="图片",
        input_content=payload.fileName,
        output=output,
        confidence=f"{confidence:.1f}%",
        status="成功",
        route="/image-recognition",
    )

    return ImageRecognitionResponse(
        label=label,
        confidence=confidence,
        explanation=explanation,
        probabilities=probabilities,
        historyRecord=history_record,
    )


def _build_sentiment_explanation(label: str, positives: list[str], negatives: list[str]) -> str:
    if label == "正面" and positives:
        return f"文本中包含 {'、'.join(positives)} 等积极词汇，因此模型判断为正面情绪。"
    if label == "负面" and negatives:
        return f"文本中出现 {'、'.join(negatives)} 等负面表达，因此模型判断当前文本更偏向负面情绪。"
    if not positives and not negatives:
        return "当前文本没有命中足够明显的中英文情绪线索，系统暂时将其判断为中性表达。"
    return "文本中的正负面信号接近，整体表达更平稳，因此模型判断为中性情绪。"


def _coerce_keyword_match_list(items: object) -> list[KeywordMatch]:
    if not isinstance(items, list):
        return []

    normalized: list[KeywordMatch] = []
    for item in items:
        if isinstance(item, KeywordMatch):
            normalized.append(item)
            continue
        if not isinstance(item, dict):
            continue
        label = str(item.get("label") or "").strip()
        if not label:
            continue
        try:
            score = float(item.get("score", 0.7))
        except (TypeError, ValueError):
            score = 0.7
        normalized.append(KeywordMatch(label=label, score=max(0.0, min(0.99, round(score, 2)))))

    return normalized


def _build_local_sentiment_response(payload: SentimentAnalysisRequest, *, used_fallback: bool) -> SentimentAnalysisResponse:
    words = re.findall(r"[a-z']+", payload.text.lower())
    matched_positive, matched_negative, raw_score = _extract_sentiment_matches(payload.text)
    positive_pool = matched_positive
    negative_pool = matched_negative

    positive_signal = sum(item.score for item in positive_pool)
    negative_signal = sum(item.score for item in negative_pool)
    total_signal = positive_signal + negative_signal

    if total_signal > 0:
        normalized_score = round(max(-0.98, min(0.98, (positive_signal - negative_signal) / total_signal)), 2)
    else:
        normalized_score = round(max(-0.98, min(0.98, math.tanh(raw_score / 2.4))), 2)

    confidence = round(
        min(96.0, max(58.0, 58.0 + total_signal * 12.5 + abs(normalized_score) * 18.0)),
        1,
    )

    if normalized_score > 0.12:
        label = "正面"
        english_label = "Positive"
        tags = ["积极", "推荐", "满意"]
    elif normalized_score < -0.12:
        label = "负面"
        english_label = "Negative"
        tags = ["消极", "需优化", "风险提示"]
    else:
        label = "中性"
        english_label = "Neutral"
        tags = ["平稳", "中性", "待补充语境"]

    explanation = _build_sentiment_explanation(
        label,
        [item.label for item in positive_pool[:3]],
        [item.label for item in negative_pool[:3]],
    )
    processing_time = f"{(0.86 + len(words) / 180):.2f} 秒"
    completed_at = _format_timestamp()
    task_id = f"SA-{int(_now().timestamp() * 1000) % 100000000:08d}"
    status = "警告" if label == "负面" and confidence < 80 else "成功"

    history_record = add_history_record(
        module="情感分析",
        input_type="文本",
        input_content=payload.text[:32] + ("..." if len(payload.text) > 32 else ""),
        output=label,
        confidence=f"{confidence:.1f}%",
        status=status,
        route="/sentiment-analysis",
    )

    return SentimentAnalysisResponse(
        label=label,
        englishLabel=english_label,
        confidence=confidence,
        score=round(normalized_score, 2),
        tags=tags,
        positiveMatches=sorted(positive_pool, key=lambda item: item.score, reverse=True)[:5],
        negativeMatches=sorted(negative_pool, key=lambda item: item.score, reverse=True)[:3],
        explanation=explanation,
        status="已完成",
        processingTime=processing_time,
        taskId=task_id,
        completedAt=completed_at,
        providerUsed="local",
        usedFallback=used_fallback,
        providerStatusMessage=_sentiment_execution_status_message(provider_used="local", used_fallback=used_fallback),
        historyRecord=history_record,
    )


def analyze_sentiment(payload: SentimentAnalysisRequest) -> SentimentAnalysisResponse:
    settings = get_sentiment_deepseek_settings()
    if should_use_deepseek(settings):
        try:
            remote = analyze_sentiment_via_deepseek(text=payload.text)
            label = str(remote.get("label") or "中性")
            english_label = {"正面": "Positive", "负面": "Negative", "中性": "Neutral"}[label]
            confidence = max(0.0, min(100.0, round(float(remote.get("confidence", 50)), 1)))
            positive_matches = _coerce_keyword_match_list(remote.get("positiveMatches"))[:5]
            negative_matches = _coerce_keyword_match_list(remote.get("negativeMatches"))[:5]
            explanation = str(remote.get("explanation") or "").strip() or _build_sentiment_explanation(
                label,
                [item.label for item in positive_matches[:3]],
                [item.label for item in negative_matches[:3]],
            )
            if label == "正面":
                tags = ["积极", "推荐", "满意"]
                normalized_score = 0.82
            elif label == "负面":
                tags = ["消极", "需优化", "风险提示"]
                normalized_score = -0.82
            else:
                tags = ["平稳", "中性", "待补充语境"]
                normalized_score = 0.0

            history_record = add_history_record(
                module="情感分析",
                input_type="文本",
                input_content=payload.text[:32] + ("..." if len(payload.text) > 32 else ""),
                output=label,
                confidence=f"{confidence:.1f}%",
                status="成功",
                route="/sentiment-analysis",
            )

            return SentimentAnalysisResponse(
                label=label,
                englishLabel=english_label,
                confidence=confidence,
                score=normalized_score,
                tags=tags,
                positiveMatches=positive_matches,
                negativeMatches=negative_matches,
                explanation=explanation,
                status="已完成",
                processingTime=f"{(0.72 + len(payload.text.strip()) / 220):.2f} 秒",
                taskId=f"SA-{int(_now().timestamp() * 1000) % 100000000:08d}",
                completedAt=_format_timestamp(),
                providerUsed="deepseek",
                usedFallback=False,
                providerStatusMessage=_sentiment_execution_status_message(provider_used="deepseek", used_fallback=False),
                historyRecord=history_record,
            )
        except Exception:
            return _build_local_sentiment_response(payload, used_fallback=True)

    return _build_local_sentiment_response(payload, used_fallback=False)


def _build_output(theme: str, tone: str, generation_type: str, index: int) -> GenerationOutput:
    theme_label = theme.strip() or "多模态 AI 课程成果平台"
    seed = index + 1
    poetry_entries = _pick_poetry_entries(theme_label, max(3, seed))
    poetry_title, poetry_body = poetry_entries[index % len(poetry_entries)] if poetry_entries else ("", "")

    if tone == "文艺" and poetry_body:
        poetry_excerpt = poetry_body[:28].rstrip("，。；、")

        if generation_type == "标题":
            return GenerationOutput(
                id=f"generated-title-{seed}",
                type="标题",
                title=f"标题 {seed}",
                body=f"{theme_label} · 取意《{poetry_title}》",
            )

        if generation_type == "宣传语":
            return GenerationOutput(
                id=f"generated-tagline-{seed}",
                type="宣传语",
                title=f"宣传语 {seed}",
                body=f"借《{poetry_title}》中“{poetry_excerpt}”的气质，把 {theme_label} 写得更有画面感与余韵。",
            )

        if generation_type == "短文案":
            return GenerationOutput(
                id=f"generated-body-{seed}",
                type="短文案",
                title=f"短文案 {seed}",
                body=f"{theme_label} 可借《{poetry_title}》的意象展开表达，以“{poetry_excerpt}”为引，让技术展示多一点叙述温度。",
            )

        if generation_type == "诗意表达":
            return GenerationOutput(
                id=f"generated-poem-{seed}",
                type="诗意表达",
                title=f"诗意表达 {seed}",
                body=f"《{poetry_title}》有句：{poetry_body} 以此映照 {theme_label}，让成果展示更具文艺气息。",
            )

    if generation_type == "标题":
        body = {
            "正式": f"{theme_label}课程成果展示方案",
            "活泼": f"{theme_label}，把 AI 成果讲得更好懂",
            "科技感": f"{theme_label} · 多模态智能展示中枢",
            "文艺": f"{theme_label}，让实验与表达彼此照亮",
        }[tone]
        return GenerationOutput(id=f"generated-title-{seed}", type="标题", title=f"标题 {seed}", body=body)

    if generation_type == "宣传语":
        body = {
            "正式": f"围绕 {theme_label} 构建统一的课程实验展示界面，清晰呈现方法、结果与应用价值。",
            "活泼": f"从图像到文字，从实验到表达，{theme_label} 让每一步成果都更容易被看见。",
            "科技感": f"{theme_label} 以统一前端承载图像识别、情感分析与内容生成，形成完整的 AI 交互演示闭环。",
            "文艺": f"{theme_label} 把冷静的数据与清晰的叙述连接起来，让技术成果拥有更顺畅的表达。",
        }[tone]
        return GenerationOutput(id=f"generated-tagline-{seed}", type="宣传语", title=f"宣传语 {seed}", body=body)

    if generation_type == "短文案":
        body = {
            "正式": f"{theme_label} 面向课程答辩与成果汇报场景，统一展示实验输入、模型输出、可视化指标和项目说明。",
            "活泼": f"{theme_label} 让图像识别、文本分析和生成式内容同台出现，做成一眼就能讲清楚的互动 demo。",
            "科技感": f"{theme_label} 通过模块化前端和统一数据结构，把多模态实验整合为一套可演示、可扩展的交互界面。",
            "文艺": f"{theme_label} 把模型运行的轨迹轻轻铺开，让每一次输入与输出都能被完整讲述。",
        }[tone]
        return GenerationOutput(id=f"generated-body-{seed}", type="短文案", title=f"短文案 {seed}", body=body)

    body = {
        "正式": f"{theme_label} 在有序的结构里展开，让实验结论与展示语言一起变得更清晰。",
        "活泼": f"{theme_label} 像把一组组实验结果点亮，让图像、文本和创意在同一页里一起发声。",
        "科技感": f"{theme_label} 像一道安静运行的接口，把多模态能力汇聚成可被快速理解的前端空间。",
        "文艺": f"{theme_label} 像一条被整理好的光带，把散落的实验、图像与文字慢慢收束成完整的叙述。",
    }[tone]
    return GenerationOutput(id=f"generated-poem-{seed}", type="诗意表达", title=f"诗意表达 {seed}", body=body)


def _build_local_generation_outputs(theme: str, tone: str, generation_type: str, quantity: int) -> list[GenerationOutput]:
    return [
        _build_output(theme, tone, generation_type, index)
        for index in range(quantity)
    ]


def _merge_remote_and_local_generation_outputs(
    remote_outputs: list[GenerationOutput],
    *,
    theme: str,
    tone: str,
    generation_type: str,
    quantity: int,
) -> list[GenerationOutput]:
    if len(remote_outputs) >= quantity:
        return remote_outputs[:quantity]

    fallback_outputs = _build_local_generation_outputs(theme, tone, generation_type, quantity)
    merged = list(remote_outputs)
    for fallback_output in fallback_outputs[len(remote_outputs):quantity]:
        merged.append(fallback_output)
    return merged


def generate_text(payload: TextGenerationRequest) -> TextGenerationResponse:
    settings = get_deepseek_settings()
    provider_used = "local"
    used_fallback = False
    fallback_reason: str | None = None

    if should_use_deepseek(settings):
        try:
            remote_outputs = generate_text_via_deepseek(
                theme=payload.theme,
                tone=payload.tone,
                generation_type=payload.type,
                quantity=payload.quantity,
            )
            provider_used = "deepseek"
            outputs = _merge_remote_and_local_generation_outputs(
                remote_outputs,
                theme=payload.theme,
                tone=payload.tone,
                generation_type=payload.type,
                quantity=payload.quantity,
            )
        except Exception:
            used_fallback = True
            outputs = _build_local_generation_outputs(
                payload.theme,
                payload.tone,
                payload.type,
                payload.quantity,
            )
    else:
        used_fallback = settings.provider == "deepseek"
        fallback_reason = "missing-key" if settings.provider == "deepseek" and not settings.api_key else None
        outputs = _build_local_generation_outputs(
            payload.theme,
            payload.tone,
            payload.type,
            payload.quantity,
        )

    quality_metrics = [
        GenerationQualityMetric(label="主题相关度", value=min(98, 82 + min(len(payload.theme.strip()), 12))),
        GenerationQualityMetric(
            label="语言流畅度",
            value=93 if payload.tone == "正式" else 92 if payload.tone == "科技感" else 88 if payload.tone == "文艺" else 90,
        ),
        GenerationQualityMetric(
            label="创意表达",
            value=94 if payload.type == "诗意表达" else 90 if payload.tone == "活泼" else 86 if payload.tone == "科技感" else 82,
        ),
    ]
    generated_at = _format_timestamp()
    history_entry = add_generation_history(
        theme=payload.theme.strip() or "未命名主题",
        generation_type=payload.type,
        tone=payload.tone,
        count=payload.quantity,
    )
    average_confidence = round(sum(metric.value for metric in quality_metrics) / len(quality_metrics), 1)
    history_record = add_history_record(
        module="文案生成",
        input_type="主题",
        input_content=payload.theme.strip() or "未命名主题",
        output=f"已生成 {payload.quantity} 条",
        confidence=f"{average_confidence:.1f}%",
        status="成功",
        route="/text-generation",
    )

    return TextGenerationResponse(
        outputs=outputs,
        historyEntry=history_entry,
        history=list_generation_history().items,
        qualityMetrics=quality_metrics,
        qualityTip=QUALITY_TIPS[payload.tone],
        toneKeywords=TONE_KEYWORDS[payload.tone],
        generatedAt=generated_at,
        providerUsed=provider_used,
        usedFallback=used_fallback,
        providerStatusMessage=_text_generation_execution_status_message(
            provider_used=provider_used,
            used_fallback=used_fallback,
            fallback_reason=fallback_reason,
        ),
        historyRecord=history_record,
    )


def analyze_museum_vision(payload: MuseumVisionRequest) -> MuseumVisionResponse:
    lower_name = payload.fileName.lower()
    uploaded_at = _format_timestamp()
    format_label = payload.format or payload.fileName.rsplit(".", 1)[-1].upper()
    decoded_upload = None
    if payload.sourceMode == "upload" and payload.imageDataUrl is not None:
        decoded_upload = _decode_uploaded_image_or_raise(payload.imageDataUrl)
    elif payload.imageDataUrl is not None:
        decoded_upload = _decode_data_url(payload.imageDataUrl)

    if decoded_upload is not None:
        try:
            image_bytes, _mime_type = decoded_upload
            institution, confidence, source_note, description, artwork_clue, tags, matches = _build_museum_upload_analysis(
                payload,
                image_bytes,
            )
            dimensions = payload.dimensions or "未知尺寸"
            size_label = payload.sizeLabel or "未知大小"
            output = institution
        except (OSError, ValueError):
            raise UploadValidationError("上传的图片内容无法解析，请重新选择清晰的 JPG、PNG 或 WEBP 图片。") from None

    if decoded_upload is None:
        preset_key = "landscape" if any(token in lower_name for token in ("mountain", "landscape", "ink", "museum")) else "portrait"
        preset = MUSEUM_PRESETS[preset_key]
        institution = preset["institution"]
        confidence = preset["confidence"]
        source_note = preset["sourceNote"]
        description = preset["description"]
        artwork_clue = preset["artworkClue"]
        tags = preset["tags"]
        matches = preset["matches"]
        dimensions = payload.dimensions or ("768 × 768" if preset_key == "landscape" else "960 × 1280")
        size_label = payload.sizeLabel or ("0.68 MB" if preset_key == "landscape" else "1.82 MB")
        output = institution

    history_record = add_history_record(
        module="博物馆图像理解",
        input_type="图片",
        input_content=payload.fileName,
        output=output,
        confidence=f"{confidence:.1f}%",
        status="成功",
        route="/museum-vision",
    )
    return MuseumVisionResponse(
        name=payload.fileName,
        format=format_label,
        dimensions=dimensions,
        sizeLabel=size_label,
        sourceNote=source_note,
        uploadedAt=uploaded_at,
        institution=institution,
        confidence=confidence,
        description=description,
        artworkClue=artwork_clue,
        tags=tags,
        matches=matches,
        historyRecord=history_record,
    )
