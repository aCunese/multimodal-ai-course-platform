from __future__ import annotations

import base64
import json
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services import core

pytestmark = pytest.mark.anyio


def as_data_url(path: Path, mime_type: str = "image/jpeg") -> str:
    return f"data:{mime_type};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


@asynccontextmanager
async def create_client():
    # AsyncClient + ASGITransport does not automatically run FastAPI lifespan hooks.
    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            yield client


async def test_healthcheck(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "health.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_dashboard_summary_contains_modules(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "dashboard.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["modules"]) == 4
    assert payload["metrics"][2]["label"] == "历史记录"


async def test_dashboard_metadata_returns_backend_defaults(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "dashboard-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/dashboard/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["pageTitle"] == "首页总览"
    assert payload["pageDescription"].startswith("探索多模态 AI 能力")
    assert payload["syncLoadingMessage"] == "正在同步后端汇总数据..."
    assert payload["syncReadyMessage"] == "已接入后端汇总接口，统计数据会随联调结果更新。"
    assert payload["syncFallbackMessage"] == "后端汇总接口暂时不可用，当前展示的是本地演示数据。"
    assert payload["heroTitle"] == "多模态 AI 课程成果平台"
    assert payload["primaryAction"] == {
        "label": "开始体验",
        "route": "/image-recognition",
    }
    assert payload["secondaryAction"] == {
        "label": "查看实验模块",
        "route": "/history",
    }
    assert payload["moduleActionLabel"] == "进入模块"
    assert payload["runtimePanelTitle"] == "运行时资源状态"
    assert payload["runtimePanelLoadingMessage"] == "正在检查运行时缓存状态..."
    assert payload["runtimeWarmActionColdLabel"] == "执行预热"
    assert payload["runtimeAssetCacheFileLabel"] == "缓存文件"
    assert payload["runtimeAssetCacheReadyLabel"] == "已生成"
    assert payload["runtimeAssetCacheMissingLabel"] == "未生成"
    assert payload["runtimeAssetCacheSizeLabel"] == "缓存体积"
    assert payload["runtimeAssetUpdatedAtLabel"] == "更新时间"
    assert payload["runtimeAssetMissingUpdatedAtLabel"] == "暂无"
    assert payload["historyPanelTitle"] == "最近实验记录"
    assert payload["historyPanelActionLabel"] == "查看全部记录"
    assert payload["historyTableHeaders"] == ["时间", "实验模块", "输入类型", "输出结果", "状态"]


async def test_sentiment_analysis_creates_negative_result(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "This movie is terrible, slow and awful."},
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "负面"
    assert payload["historyRecord"]["route"] == "/sentiment-analysis"


async def test_sentiment_analysis_understands_strong_chinese_negative_emotion(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-chinese-negative.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "我真的很讨厌你，这句话让我特别崩溃。"},
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "负面"
    assert payload["score"] < -0.6
    assert payload["confidence"] >= 80
    assert any(item["label"] == "讨厌" for item in payload["negativeMatches"])
    assert "讨厌" in payload["explanation"]


async def test_sentiment_analysis_keeps_frontend_sample_positive(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-positive.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "This movie is wonderful, visually stunning and emotionally moving."},
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "正面"
    assert any(item["label"] == "精彩" for item in payload["positiveMatches"])
    assert all(item["label"] != "visually" for item in payload["negativeMatches"])
    assert payload["providerUsed"] == "local"
    assert payload["usedFallback"] is False
    assert "本地词典" in payload["providerStatusMessage"]


async def test_sentiment_analysis_uses_imdb_lexicon_terms(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-imdb.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "This sequel is a flop and feels copied."},
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "负面"
    assert any(item["label"] == "失败" for item in payload["negativeMatches"])


async def test_sentiment_analysis_filters_overly_generic_positive_words_in_local_fallback(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-generic-words.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "I expected more from the plot, but the visuals were okay and the acting was fine."},
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["providerUsed"] == "local"
    assert payload["usedFallback"] is False
    assert payload["label"] != "正面"
    positive_labels = {item["label"] for item in payload["positiveMatches"]}
    negative_labels = {item["label"] for item in payload["negativeMatches"]}
    assert "expected" not in positive_labels
    assert "visuals" not in positive_labels
    assert "okay" not in positive_labels
    assert "fine" not in positive_labels
    assert "expected" not in payload["explanation"]
    assert "visuals" not in payload["explanation"]


async def test_sentiment_analysis_metadata_returns_backend_defaults(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/sentiment-analysis/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["pageTitle"] == "情感分析"
    assert payload["pageDescription"].startswith("输入评论文本")
    assert payload["syncLoadingMessage"] == "正在同步情感分析结果..."
    assert payload["syncAnalyzingMessage"] == "正在调用情感分析接口..."
    assert payload["syncReadyMessage"] == "情感分析结果已接入后端接口。"
    assert payload["syncFallbackMessage"] == "情感分析接口暂时不可用，当前保留最近一次分析结果。"
    assert payload["emptyInputMessage"] == "请输入文本后再调用分析接口。"
    assert payload["textInputLabel"] == "请输入需要分析的文本（支持中英文）"
    assert payload["clearButtonLabel"] == "清空"
    assert payload["sampleButtonLabel"] == "示例文本"
    assert payload["analyzeButtonLabel"] == "开始分析"
    assert payload["analyzeButtonBusyLabel"] == "分析中..."
    assert payload["positiveOnlyButtonLabel"] == "仅积极"
    assert payload["showAllButtonLabel"] == "显示全部"
    assert payload["sampleText"] == "This movie is wonderful, visually stunning and emotionally moving."
    assert payload["pendingResult"]["taskId"] == "SA-PENDING"
    assert payload["pendingResult"]["providerUsed"] == "local"
    assert payload["pendingResult"]["usedFallback"] is False
    assert payload["providerStatus"] == {
        "configuredProvider": "local",
        "activeProvider": "local",
        "enabled": True,
        "statusLabel": "当前分析引擎：本地词典",
        "detailMessage": "当前使用本地分析服务；配置 DEEPSEEK_API_KEY 后会自动切换为 DeepSeek。",
    }
    assert payload["modelLabel"] == "IMDB 评论情感分析"
    assert payload["analysisNote"].startswith("本模型基于 IMDb 电影评论数据集训练")


async def test_text_generation_returns_requested_quantity(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/text-generation/generate",
            json={
                "theme": "课程答辩展示",
                "tone": "科技感",
                "type": "标题",
                "quantity": 2,
            },
        )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["outputs"]) == 2
    assert payload["historyEntry"]["count"] == 2
    assert payload["providerUsed"] == "local"
    assert payload["usedFallback"] is False
    assert "本地模板" in payload["providerStatusMessage"]


async def test_text_generation_metadata_returns_backend_defaults(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/text-generation/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["pageTitle"] == "文案生成"
    assert payload["pageDescription"].startswith("输入主题、语气和输出类型")
    assert payload["syncConnectingMessage"] == "正在连接文案生成接口..."
    assert payload["syncHistoryReadyMessage"] == "文案生成历史记录已由后端接口提供。"
    assert payload["syncFallbackMessage"] == "文案生成接口暂时不可用，当前展示本地演示数据。"
    assert payload["generateLoadingMessage"] == "正在请求文案生成接口..."
    assert payload["generateSuccessMessage"] == "生成结果已来自后端接口，并已写入历史记录。"
    assert payload["generateFallbackMessage"] == "文案生成接口暂时不可用，当前保留最近一次生成结果。"
    assert payload["restoreExampleMessage"] == "已恢复到后端默认示例配置，可继续发起后端生成。"
    assert payload["copyActionLabel"] == "复制"
    assert payload["copySuccessLabel"] == "已复制"
    assert payload["copyFailureMessage"] == "复制失败，请检查浏览器剪贴板权限。"
    assert payload["restoreExampleButtonLabel"] == "恢复示例"
    assert payload["generateButtonLabel"] == "开始生成"
    assert payload["generateButtonBusyLabel"] == "生成中..."
    assert payload["regenerateButtonLabel"] == "重新生成"
    assert payload["toneOptions"] == ["正式", "活泼", "科技感", "文艺"]
    assert payload["generationTypes"] == ["标题", "宣传语", "短文案", "诗意表达"]
    assert payload["defaultConfig"] == {
        "theme": "人工智能课程展示",
        "tone": "科技感",
        "type": "标题",
        "quantity": 3,
    }
    assert payload["providerStatus"] == {
        "configuredProvider": "local",
        "activeProvider": "local",
        "enabled": True,
        "statusLabel": "当前生成引擎：本地模板",
        "detailMessage": "当前使用本地生成服务；配置 DEEPSEEK_API_KEY 后会自动切换为 DeepSeek。",
    }
    assert payload["sampleOutputs"][0]["title"] == "课程成果平台展示标题"
    assert payload["defaultQualityMetrics"][0]["label"] == "主题相关度"


async def test_image_recognition_metadata_returns_backend_defaults(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "image-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/image-recognition/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["pageTitle"] == "图像识别"
    assert payload["pageDescription"].startswith("上传图片后")
    assert payload["syncLoadingMessage"] == "正在同步识别结果..."
    assert payload["syncAnalyzingMessage"] == "正在调用后端识别接口..."
    assert payload["syncReadyMessage"] == "图片识别结果已接入后端接口。"
    assert payload["syncFallbackMessage"] == "后端识别接口暂时不可用，当前展示最近一次结果。"
    assert payload["uploadPanelTitle"] == "图片上传区"
    assert payload["uploadDropzoneTitle"] == "拖拽图片到此处或点击上传"
    assert payload["uploadHint"] == "支持 JPG / PNG"
    assert payload["uploadButtonLabel"] == "上传图片"
    assert payload["exampleButtonLabel"] == "示例图片"
    assert payload["uploadedPreviewTitle"] == "已上传图片"
    assert payload["reuploadButtonLabel"] == "重新上传"
    assert payload["previewLoadedStatusLabel"] == "已加载"
    assert payload["previewAnalyzingStatusLabel"] == "识别中"
    assert payload["resultPanelTitle"] == "识别结果"
    assert payload["resultReadyStatusLabel"] == "识别完成"
    assert payload["resultAnalyzingStatusLabel"] == "识别中"
    assert payload["predictedCategoryLabel"] == "预测类别"
    assert payload["confidenceLabel"] == "置信度"
    assert payload["resultExplanationTitle"] == "结果解释"
    assert payload["probabilityPanelTitle"] == "分类概率分布"
    assert payload["modelInfoPanelTitle"] == "模型信息"
    assert payload["sampleAsset"] == {
        "sampleId": "dangshen_1",
        "name": "dangshen_1.jpg",
        "sizeLabel": "139 KB",
        "dimensionsLabel": "700 × 466",
    }
    assert payload["initialResult"]["label"] == "党参"
    assert payload["initialResult"]["historyRecord"]["route"] == "/image-recognition"
    assert payload["modelInfo"][0] == {
        "label": "模型类型",
        "value": "课程中药样本分类器",
    }


async def test_text_generation_uses_real_poetry_dataset_for_literary_mode(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "poetry.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/text-generation/generate",
            json={
                "theme": "春日答辩展示",
                "tone": "文艺",
                "type": "诗意表达",
                "quantity": 1,
            },
        )
    assert response.status_code == 200
    payload = response.json()
    assert "《" in payload["outputs"][0]["body"]
    assert "春日答辩展示" in payload["outputs"][0]["body"]


async def test_text_generation_uses_deepseek_outputs_when_provider_enabled(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation-deepseek.db"))
    monkeypatch.setenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")

    def fake_generate_text_via_deepseek(*, theme: str, tone: str, generation_type: str, quantity: int):
        assert theme == "课程答辩展示"
        assert tone == "科技感"
        assert generation_type == "标题"
        assert quantity == 2
        return [
            core.GenerationOutput(
                id="generated-title-1",
                type="标题",
                title="标题 1",
                body="DeepSeek 输出 1",
            ),
            core.GenerationOutput(
                id="generated-title-2",
                type="标题",
                title="标题 2",
                body="DeepSeek 输出 2",
            ),
        ]

    monkeypatch.setattr(core, "generate_text_via_deepseek", fake_generate_text_via_deepseek)

    async with create_client() as client:
        response = await client.post(
            "/api/v1/text-generation/generate",
            json={
                "theme": "课程答辩展示",
                "tone": "科技感",
                "type": "标题",
                "quantity": 2,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert [item["body"] for item in payload["outputs"]] == ["DeepSeek 输出 1", "DeepSeek 输出 2"]
    assert payload["historyEntry"]["count"] == 2
    assert payload["providerUsed"] == "deepseek"
    assert payload["usedFallback"] is False
    assert payload["providerStatusMessage"] == "当前生成引擎：DeepSeek"


async def test_text_generation_falls_back_to_local_outputs_when_deepseek_raises(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation-fallback.db"))
    monkeypatch.setenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")

    def fake_generate_text_via_deepseek(*, theme: str, tone: str, generation_type: str, quantity: int):
        raise RuntimeError("deepseek unavailable")

    monkeypatch.setattr(core, "generate_text_via_deepseek", fake_generate_text_via_deepseek)

    async with create_client() as client:
        response = await client.post(
            "/api/v1/text-generation/generate",
            json={
                "theme": "课程答辩展示",
                "tone": "科技感",
                "type": "标题",
                "quantity": 1,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["outputs"]) == 1
    assert payload["outputs"][0]["body"] == "课程答辩展示 · 多模态智能展示中枢"
    assert payload["providerUsed"] == "local"
    assert payload["usedFallback"] is True
    assert payload["providerStatusMessage"] == "当前生成引擎：本地模板（DeepSeek 回退）"


async def test_text_generation_falls_back_to_local_outputs_when_api_key_missing(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation-missing-key.db"))
    monkeypatch.setenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "deepseek")
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    def fail_if_called(**_: object):
        raise AssertionError("DeepSeek client should not be called without DEEPSEEK_API_KEY")

    monkeypatch.setattr(core, "generate_text_via_deepseek", fail_if_called)

    async with create_client() as client:
        response = await client.post(
            "/api/v1/text-generation/generate",
            json={
                "theme": "课程答辩展示",
                "tone": "科技感",
                "type": "标题",
                "quantity": 1,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["outputs"][0]["body"] == "课程答辩展示 · 多模态智能展示中枢"
    assert payload["providerUsed"] == "local"
    assert payload["usedFallback"] is True
    assert payload["providerStatusMessage"] == "当前生成引擎：本地模板（未检测到 DeepSeek API Key）"


async def test_text_generation_metadata_reports_deepseek_missing_key_status(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation-metadata-missing-key.db"))
    monkeypatch.setenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "deepseek")
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    async with create_client() as client:
        response = await client.get("/api/v1/text-generation/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["providerStatus"] == {
        "configuredProvider": "deepseek",
        "activeProvider": "local",
        "enabled": False,
        "statusLabel": "当前生成引擎：本地模板",
        "detailMessage": "未检测到 DEEPSEEK_API_KEY，当前继续使用本地模板与诗词语料生成结果。",
    }


async def test_text_generation_metadata_auto_enables_deepseek_when_api_key_exists(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation-metadata-auto.db"))
    monkeypatch.delenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", raising=False)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    async with create_client() as client:
        response = await client.get("/api/v1/text-generation/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["providerStatus"]["configuredProvider"] == "deepseek"
    assert payload["providerStatus"]["activeProvider"] == "deepseek"
    assert payload["providerStatus"]["enabled"] is True
    assert payload["providerStatus"]["statusLabel"] == "当前生成引擎：DeepSeek"


async def test_sentiment_analysis_uses_deepseek_when_provider_enabled(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-deepseek.db"))
    monkeypatch.setenv("MULTIMODAL_SENTIMENT_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")

    def fake_analyze_sentiment_via_deepseek(*, text: str):
        assert text == "This sequel is a flop and feels copied."
        return {
            "label": "负面",
            "confidence": 87.6,
            "positiveMatches": [{"label": "画面完整", "score": 0.26}],
            "negativeMatches": [{"label": "失败", "score": 0.94}, {"label": "缺乏新意", "score": 0.86}],
            "explanation": "DeepSeek 判断该评论核心情绪偏负面，主要由“失败”“缺乏新意”等表达驱动。",
        }

    monkeypatch.setattr(core, "analyze_sentiment_via_deepseek", fake_analyze_sentiment_via_deepseek, raising=False)

    async with create_client() as client:
        response = await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "This sequel is a flop and feels copied."},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "负面"
    assert payload["providerUsed"] == "deepseek"
    assert payload["usedFallback"] is False
    assert payload["providerStatusMessage"] == "当前分析引擎：DeepSeek"
    assert payload["negativeMatches"][0]["label"] == "失败"


async def test_sentiment_analysis_falls_back_to_local_when_deepseek_raises(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-deepseek-fallback.db"))
    monkeypatch.setenv("MULTIMODAL_SENTIMENT_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")

    def fake_analyze_sentiment_via_deepseek(*, text: str):
        raise RuntimeError("deepseek unavailable")

    monkeypatch.setattr(core, "analyze_sentiment_via_deepseek", fake_analyze_sentiment_via_deepseek, raising=False)

    async with create_client() as client:
        response = await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "This sequel is a flop and feels copied."},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "负面"
    assert payload["providerUsed"] == "local"
    assert payload["usedFallback"] is True
    assert payload["providerStatusMessage"] == "当前分析引擎：本地词典（DeepSeek 回退）"


async def test_sentiment_analysis_metadata_auto_enables_deepseek_when_api_key_exists(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-metadata-auto.db"))
    monkeypatch.delenv("MULTIMODAL_SENTIMENT_PROVIDER", raising=False)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    async with create_client() as client:
        response = await client.get("/api/v1/sentiment-analysis/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["providerStatus"]["configuredProvider"] == "deepseek"
    assert payload["providerStatus"]["activeProvider"] == "deepseek"
    assert payload["providerStatus"]["enabled"] is True
    assert payload["providerStatus"]["statusLabel"] == "当前分析引擎：DeepSeek"


async def test_history_filter_finds_generated_record(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "history.db"))
    async with create_client() as client:
        await client.post(
            "/api/v1/image-recognition/predict",
            json={"fileName": "rabbit_sample.png", "width": 512, "height": 512, "sizeLabel": "98 KB"},
        )
        response = await client.get("/api/v1/history", params={"keyword": "rabbit_sample"})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["records"]) == 1
    assert payload["records"][0]["module"] == "图像识别"


async def test_history_metadata_returns_backend_contract(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "history-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/history/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["pageTitle"] == "历史记录与项目说明"
    assert payload["pageDescription"].startswith("查看平台运行记录")
    assert payload["syncConnectedMessage"] == "已连接历史记录接口。"
    assert payload["syncLoadingMessage"] == "正在同步历史记录..."
    assert payload["syncReadyMessage"] == "历史记录已由后端接口实时提供。"
    assert payload["syncFallbackMessage"] == "历史记录接口暂时不可用，当前展示的是本地演示数据。"
    assert payload["filterPanelTitle"] == "历史记录筛选区"
    assert payload["searchFieldLabel"] == "搜索内容"
    assert payload["searchPlaceholder"] == "搜索输入内容、输出结果或记录 ID..."
    assert payload["moduleFilterLabel"] == "模块筛选"
    assert payload["statusFilterLabel"] == "状态筛选"
    assert payload["exportFormatLabel"] == "导出格式"
    assert payload["clearFiltersLabel"] == "清空筛选"
    assert payload["exportButtonLabel"] == "导出"
    assert payload["exportButtonBusyLabel"] == "导出中..."
    assert payload["exportSuccessMessageTemplate"] == "历史记录已从后端导出为 {format} 文件。"
    assert payload["exportFallbackMessage"] == "历史记录导出接口暂时不可用，已导出当前页面数据。"
    assert payload["tableTitle"] == "历史记录表格"
    assert payload["tableLoadingMessage"] == "正在同步..."
    assert payload["tableCountTemplate"] == "共 {count} 条记录"
    assert payload["tableHeaders"] == ["记录 ID", "时间", "实验模块", "输入内容", "输出结果", "置信度 / 评分", "状态", "操作"]
    assert payload["rowActionLabel"] == "查看"
    assert payload["projectOverviewTitle"] == "项目说明"
    assert payload["moduleSpotlightActionLabel"] == "查看详情"
    assert payload["moduleFilters"][0] == "全部"
    assert payload["statusFilters"] == ["全部", "成功", "警告", "失败"]
    assert payload["exportFormats"] == [
        {"label": "JSON", "value": "json"},
        {"label": "CSV", "value": "csv"},
    ]
    assert payload["overviewSections"][0]["title"] == "平台定位"
    assert payload["moduleSpotlights"][0]["route"] == "/image-recognition"


async def test_app_shell_metadata_returns_backend_contract(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "app-shell-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/app-shell/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["searchFieldAriaLabel"] == "全局搜索"
    assert payload["searchPlaceholder"] == "搜索实验、记录或内容..."
    assert payload["searchResultsAriaLabel"] == "搜索建议"
    assert payload["searchLoadingMessage"] == "正在搜索..."
    assert payload["searchEmptyMessage"] == "未找到匹配结果，可直接回车跳转到历史记录页继续搜索。"
    assert payload["searchUnavailableMessage"] == "全局搜索接口暂时不可用，可直接回车跳转到历史记录页。"
    assert payload["projectReportButtonLabel"] == "导出演示报告"
    assert payload["projectReportFallbackTitle"] == "多模态 AI 课程成果平台演示报告"
    assert payload["projectReportFallbackFilename"] == "multimodal-ai-demo-report.json"
    assert payload["projectDeliverablesButtonLabel"] == "导出交付包"
    assert payload["projectOverviewButtonLabel"] == "查看项目说明"
    assert payload["accountDisplayName"] == "课程实验用户"
    assert payload["accountRoleLabel"] == "学生"


async def test_search_returns_page_suggestions(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "search-pages.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/search", params={"keyword": "博物馆"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["keyword"] == "博物馆"
    assert payload["total"] >= 1
    assert any(
        item["scope"] == "page" and item["route"] == "/museum-vision"
        for item in payload["results"]
    )


async def test_search_returns_history_suggestions(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "search-history.db"))
    async with create_client() as client:
        await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "This sequel is a flop and feels copied."},
        )
        response = await client.get("/api/v1/search", params={"keyword": "flop"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["keyword"] == "flop"
    assert any(
        item["scope"] == "history"
        and item["route"].startswith("/history?keyword=%23")
        and "负面" in item["title"]
        for item in payload["results"]
    )


async def test_project_report_export_returns_live_backend_snapshot(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "project-report.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/project-report/export")
    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]
    assert 'attachment; filename="multimodal-ai-demo-report-' in response.headers["content-disposition"]
    payload = response.json()
    assert payload["title"] == "多模态 AI 课程成果平台演示报告"
    assert payload["reportVersion"] == "v1.0"
    assert payload["pages"][0]["path"] == "/"
    assert payload["dashboard"]["modules"][0]["route"] == "/image-recognition"
    assert payload["runtimeAssets"]["assets"][0]["key"] == "herbal-classifier"
    assert payload["historyMetadata"]["moduleSpotlights"][0]["route"] == "/image-recognition"


async def test_project_delivery_bundle_export_returns_zip_payload(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "project-delivery-bundle.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/project-deliverables/export")
    assert response.status_code == 200
    assert "application/zip" in response.headers["content-type"]
    assert 'attachment; filename="multimodal-ai-delivery-bundle-' in response.headers["content-disposition"]

    with ZipFile(BytesIO(response.content)) as archive:
        names = set(archive.namelist())
        assert "manifest.json" in names
        assert "project-report.json" in names
        assert "history-records.json" in names
        assert "history-records.csv" in names
        assert "runtime-assets.json" in names
        assert "history-metadata.json" in names
        assert "openapi.json" in names
        assert "README.md" in names
        assert "feature_list.json" in names
        assert "progress.md" in names
        assert "session-handoff.md" in names
        assert "architecture/web-architecture-spec.md" in names

        manifest = json.loads(archive.read("manifest.json").decode("utf-8"))
        assert manifest["title"] == "多模态 AI 课程成果平台交付包"
        assert manifest["bundleVersion"] == "v1.1"

        files = {entry["path"]: entry for entry in manifest["files"]}
        report_entry = files["project-report.json"]
        assert report_entry["category"] == "generated-report"
        assert report_entry["contentType"] == "application/json; charset=utf-8"
        assert report_entry["sourceKind"] == "generated"
        assert report_entry["sourcePath"] == "/api/v1/project-report/export"
        assert len(report_entry["sha256"]) == 64
        assert report_entry["sizeBytes"] == len(archive.read("project-report.json"))

        readme_entry = files["README.md"]
        assert readme_entry["category"] == "project-state"
        assert readme_entry["contentType"] == "text/markdown; charset=utf-8"
        assert readme_entry["sourceKind"] == "static"
        assert readme_entry["sourcePath"] == "README.md"
        assert len(readme_entry["sha256"]) == 64

        architecture_entry = files["architecture/web-architecture-spec.md"]
        assert architecture_entry["category"] == "architecture"
        assert architecture_entry["sourceKind"] == "static"
        assert architecture_entry["sourcePath"].startswith("docs/architecture/")

        report_payload = archive.read("project-report.json").decode("utf-8")
        assert "多模态 AI 课程成果平台演示报告" in report_payload

        readme_payload = archive.read("README.md").decode("utf-8")
        assert "多模态 AI 课程成果平台" in readme_payload


async def test_history_export_returns_filtered_csv(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "history-export.db"))
    async with create_client() as client:
        await client.post(
            "/api/v1/image-recognition/predict",
            json={"fileName": "rabbit_sample.png", "width": 512, "height": 512, "sizeLabel": "98 KB"},
        )
        response = await client.get(
            "/api/v1/history/export",
            params={"module": "图像识别", "keyword": "rabbit_sample", "format": "csv"},
        )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert 'attachment; filename="history-records-' in response.headers["content-disposition"]
    assert "rabbit_sample.png" in response.content.decode("utf-8-sig")
    assert "图像识别" in response.content.decode("utf-8-sig")


async def test_history_export_returns_json_with_filters(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "history-export-json.db"))
    async with create_client() as client:
        await client.post(
            "/api/v1/sentiment-analysis/analyze",
            json={"text": "This sequel is a flop and feels copied."},
        )
        response = await client.get(
            "/api/v1/history/export",
            params={"keyword": "flop", "module": "情感分析", "format": "json"},
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["filters"]["keyword"] == "flop"
    assert payload["filters"]["module"] == "情感分析"
    assert payload["count"] == 1
    assert payload["records"][0]["module"] == "情感分析"


async def test_history_export_exposes_filename_header_for_cors(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "history-export-cors.db"))
    async with create_client() as client:
        response = await client.get(
            "/api/v1/history/export",
            params={"format": "csv"},
            headers={"Origin": "http://127.0.0.1:5177"},
        )
    assert response.status_code == 200
    assert response.headers["access-control-expose-headers"] == "Content-Disposition"
    assert 'attachment; filename="history-records-' in response.headers["content-disposition"]


def test_history_export_openapi_declares_download_contract():
    operation = app.openapi()["paths"]["/api/v1/history/export"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/HistoryExportResponse"
    )
    assert success_response["content"]["text/csv"]["schema"] == {
        "type": "string",
        "format": "binary",
    }
    assert success_response["headers"]["Content-Disposition"]["schema"]["type"] == "string"


def test_project_report_export_openapi_declares_download_contract():
    operation = app.openapi()["paths"]["/api/v1/project-report/export"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/ProjectReportExportResponse"
    )
    assert success_response["headers"]["Content-Disposition"]["schema"]["type"] == "string"


def test_project_delivery_bundle_export_openapi_declares_download_contract():
    operation = app.openapi()["paths"]["/api/v1/project-deliverables/export"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/zip"]["schema"] == {
        "type": "string",
        "format": "binary",
    }
    assert success_response["headers"]["Content-Disposition"]["schema"]["type"] == "string"


async def test_museum_vision_tag_export_returns_downloadable_txt(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "museum-tag-export.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/museum-vision/export-tags",
            json={
                "fileName": "smithsonian_786.jpg",
                "institution": "史密森学会",
                "tags": ["馆藏图像", "课程样例", "上传图像"],
            },
        )
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    assert 'attachment; filename="smithsonian_786-tags-' in response.headers["content-disposition"]
    content = response.content.decode("utf-8")
    assert "# 史密森学会" in content
    assert "馆藏图像" in content
    assert "上传图像" in content


def test_museum_vision_tag_export_openapi_declares_download_contract():
    operation = app.openapi()["paths"]["/api/v1/museum-vision/export-tags"]["post"]
    success_response = operation["responses"]["200"]
    request_schema = operation["requestBody"]["content"]["application/json"]["schema"]["$ref"]

    assert request_schema == "#/components/schemas/MuseumVisionTagExportRequest"
    assert success_response["content"]["text/plain"]["schema"] == {
        "type": "string",
        "format": "binary",
    }
    assert success_response["headers"]["Content-Disposition"]["schema"]["type"] == "string"


def test_search_openapi_declares_response_contract():
    operation = app.openapi()["paths"]["/api/v1/search"]["get"]
    success_response = operation["responses"]["200"]
    keyword_parameter = next(
        parameter for parameter in operation["parameters"] if parameter["name"] == "keyword"
    )

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/SearchResponse"
    )
    assert keyword_parameter["schema"]["default"] == ""


def test_text_generation_metadata_openapi_declares_response_contract():
    operation = app.openapi()["paths"]["/api/v1/text-generation/metadata"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/TextGenerationMetadataResponse"
    )


def test_dashboard_metadata_openapi_declares_response_contract():
    operation = app.openapi()["paths"]["/api/v1/dashboard/metadata"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/DashboardMetadataResponse"
    )


def test_app_shell_metadata_openapi_declares_response_contract():
    operation = app.openapi()["paths"]["/api/v1/app-shell/metadata"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/AppShellMetadataResponse"
    )


async def test_museum_vision_metadata_returns_backend_defaults(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "museum-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/museum-vision/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["pageTitle"] == "博物馆图像识别 / 描述"
    assert payload["pageDescription"].startswith("上传博物馆图像后")
    assert payload["syncConnectingMessage"] == "正在连接博物馆图像理解接口..."
    assert payload["syncAnalyzingMessage"] == "正在请求博物馆图像理解接口..."
    assert payload["syncReadyMessage"] == "博物馆图像理解结果已由后端接口提供。"
    assert payload["syncUpdateMessage"] == "博物馆图像理解结果已更新并写入历史记录。"
    assert payload["copyActionLabel"] == "复制描述"
    assert payload["copySuccessLabel"] == "已复制"
    assert payload["copyFailureMessage"] == "复制失败，请检查浏览器剪贴板权限。"
    assert payload["exportTagsActionLabel"] == "导出标签"
    assert payload["exportTagsSuccessLabel"] == "已导出"
    assert payload["exportTagsSuccessMessage"] == "标签导出文件已由后端接口生成。"
    assert payload["exportTagsFallbackMessage"] == "标签导出接口暂时不可用，已导出当前页面标签。"
    assert payload["uploadButtonLabel"] == "上传图像"
    assert payload["switchSampleButtonLabel"] == "切换样例"
    assert payload["sampleLoadedStatusLabel"] == "已载入样例"
    assert payload["uploadSuccessStatusLabel"] == "上传成功"
    assert payload["sampleSourceBadgeLabel"] == "课程样例"
    assert payload["uploadSourceBadgeLabel"] == "本地文件"
    assert payload["openPreviewAriaLabel"] == "打开预览大图"
    assert payload["downloadPreviewAriaLabel"] == "下载当前图片"
    assert payload["switchPreviewAriaLabel"] == "切换样例图片"
    assert payload["initialAssetId"] == "portrait"
    assert payload["sampleAssets"][0] == {
        "id": "portrait",
        "name": "portrait_classical.jpg",
        "format": "JPG",
        "dimensions": "960 × 1280",
        "sizeLabel": "1.82 MB",
    }
    assert payload["initialAnalysis"]["institution"] == "大都会艺术博物馆"
    assert payload["initialAnalysis"]["artworkClue"]["title"] == "古典人物肖像"
    assert payload["sampleDescriptionNote"] == "当前描述结合样例图像的主体内容、构图风格与课程实验设定生成。"
    assert (
        payload["uploadDescriptionNote"]
        == "当前描述会同时参考上传文件名中的作品线索，以及图像颜色、纹理与构图特征，再结合课程数据集中的相似样本生成。"
    )
    assert payload["dataSourceItems"][0]["title"] == "数据来源"


def test_museum_vision_metadata_openapi_declares_response_contract():
    operation = app.openapi()["paths"]["/api/v1/museum-vision/metadata"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/MuseumVisionMetadataResponse"
    )


async def test_sentiment_analysis_metadata_returns_backend_defaults(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "sentiment-metadata.db"))
    async with create_client() as client:
        response = await client.get("/api/v1/sentiment-analysis/metadata")
    assert response.status_code == 200
    payload = response.json()
    assert payload["sampleText"] == "This movie is wonderful, visually stunning and emotionally moving."
    assert payload["pendingResult"]["status"] == "待分析"
    assert payload["pendingResult"]["taskId"] == "SA-PENDING"
    assert payload["modelLabel"] == "IMDB 评论情感分析"
    assert payload["analysisNote"].startswith("本模型基于 IMDb 电影评论数据集训练")


def test_sentiment_analysis_metadata_openapi_declares_response_contract():
    operation = app.openapi()["paths"]["/api/v1/sentiment-analysis/metadata"]["get"]
    success_response = operation["responses"]["200"]

    assert success_response["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/SentimentAnalysisMetadataResponse"
    )


async def test_image_recognition_upload_uses_real_herbal_dataset(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "herbal.db"))
    monkeypatch.setenv("MULTIMODAL_HERBAL_MODEL_CACHE_PATH", str(tmp_path / "herbal-classifier.pkl"))
    core._load_herbal_classifier_cached.cache_clear()
    sample_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "experiments"
        / "experiment-01-herbal-image-classification"
        / "dataset"
        / "data"
        / "dangshen"
        / "dangshen_1.jpg"
    )
    async with create_client() as client:
        response = await client.post(
            "/api/v1/image-recognition/predict",
            json={
                "fileName": sample_path.name,
                "width": 700,
                "height": 466,
                "sizeLabel": "139 KB",
                "imageDataUrl": as_data_url(sample_path),
            },
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "党参"
    assert payload["probabilities"][0]["label"] == "党参"
    assert payload["historyRecord"]["output"] == "党参"


async def test_image_recognition_prefers_gouqi_for_realistic_red_fruit_scene(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "herbal-gouqi-scene.db"))
    monkeypatch.setenv("MULTIMODAL_HERBAL_MODEL_CACHE_PATH", str(tmp_path / "herbal-gouqi-scene.pkl"))
    core._load_herbal_classifier_cached.cache_clear()
    sample_path = Path(__file__).resolve().parent / "fixtures" / "gouqi-realistic-scene.jpg"
    async with create_client() as client:
        response = await client.post(
            "/api/v1/image-recognition/predict",
            json={
                "fileName": sample_path.name,
                "width": 1080,
                "height": 1837,
                "sizeLabel": "381 KB",
                "imageDataUrl": as_data_url(sample_path),
            },
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["label"] == "枸杞"
    assert payload["probabilities"][0]["label"] == "枸杞"
    assert payload["historyRecord"]["output"] == "枸杞"


async def test_image_recognition_reuses_cached_herbal_classifier(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "herbal-cache.db"))
    cache_path = tmp_path / "herbal-classifier.pkl"
    monkeypatch.setenv("MULTIMODAL_HERBAL_MODEL_CACHE_PATH", str(cache_path))
    core._load_herbal_classifier_cached.cache_clear()

    sample_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "experiments"
        / "experiment-01-herbal-image-classification"
        / "dataset"
        / "data"
        / "dangshen"
        / "dangshen_1.jpg"
    )
    payload = {
        "fileName": sample_path.name,
        "width": 700,
        "height": 466,
        "sizeLabel": "139 KB",
        "imageDataUrl": as_data_url(sample_path),
    }

    async with create_client() as client:
        first_response = await client.post("/api/v1/image-recognition/predict", json=payload)
    assert first_response.status_code == 200
    assert cache_path.exists()

    core._load_herbal_classifier_cached.cache_clear()

    def fail_if_retrained(_: Path):
        raise AssertionError("classifier retraining should not happen when a valid cache exists")

    monkeypatch.setattr(core, "_train_herbal_classifier", fail_if_retrained)

    async with create_client() as client:
        second_response = await client.post("/api/v1/image-recognition/predict", json=payload)
    assert second_response.status_code == 200
    assert second_response.json()["label"] == "党参"


async def test_image_recognition_rejects_invalid_upload_payload(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "herbal-invalid.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/image-recognition/predict",
            json={
                "fileName": "broken-upload.jpg",
                "width": 640,
                "height": 480,
                "sizeLabel": "32 KB",
                "imageDataUrl": "data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==",
            },
        )
    assert response.status_code == 400
    assert response.json()["detail"] == "上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。"


async def test_museum_vision_upload_uses_real_dataset_match(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "museum.db"))
    monkeypatch.setenv("MULTIMODAL_MUSEUM_INDEX_CACHE_PATH", str(tmp_path / "museum-index.pkl"))
    core._load_museum_feature_index_cached.cache_clear()
    sample_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "experiments"
        / "experiment-03-museum-multimodal"
        / "images"
        / "smithsonian"
        / "smithsonian_786.jpg"
    )
    async with create_client() as client:
        response = await client.post(
            "/api/v1/museum-vision/analyze",
            json={
                "fileName": sample_path.name,
                "format": "JPG",
                "dimensions": "768 × 768",
                "sizeLabel": "256 KB",
                "sourceMode": "upload",
                "imageDataUrl": as_data_url(sample_path),
            },
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["institution"] == "史密森学会"
    assert payload["matches"][0]["institution"] == "史密森学会"
    assert "课程数据集" in payload["sourceNote"]
    assert payload["artworkClue"]["title"] == "smithsonian"
    assert payload["artworkClue"]["museumHint"] == "史密森学会"


async def test_museum_vision_extracts_artwork_clue_from_filename(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "museum-clue.db"))
    monkeypatch.setenv("MULTIMODAL_MUSEUM_INDEX_CACHE_PATH", str(tmp_path / "museum-clue-index.pkl"))
    core._load_museum_feature_index_cached.cache_clear()
    sample_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "experiments"
        / "experiment-03-museum-multimodal"
        / "images"
        / "smithsonian"
        / "smithsonian_786.jpg"
    )
    async with create_client() as client:
        response = await client.post(
            "/api/v1/museum-vision/analyze",
            json={
                "fileName": "明清缂丝挂画_苏州博物馆馆藏_1_123梦游123_来自小红书网页版.jpg",
                "format": "JPG",
                "dimensions": "1080 × 1440",
                "sizeLabel": "496 KB",
                "sourceMode": "upload",
                "imageDataUrl": as_data_url(sample_path),
            },
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["artworkClue"]["title"] == "明清缂丝挂画"
    assert payload["artworkClue"]["era"] == "明清"
    assert payload["artworkClue"]["category"] == "缂丝挂画"
    assert payload["artworkClue"]["museumHint"] == "苏州博物馆"
    assert "上传文件名" in payload["artworkClue"]["basis"]
    assert "明清缂丝挂画" in payload["description"]


async def test_museum_vision_rejects_invalid_upload_payload(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "museum-invalid.db"))
    async with create_client() as client:
        response = await client.post(
            "/api/v1/museum-vision/analyze",
            json={
                "fileName": "broken-upload.jpg",
                "format": "JPG",
                "dimensions": "768 × 768",
                "sizeLabel": "32 KB",
                "sourceMode": "upload",
                "imageDataUrl": "data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==",
            },
        )
    assert response.status_code == 400
    assert response.json()["detail"] == "上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。"


async def test_museum_feature_index_reuses_disk_cache(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "museum-cache.db"))
    cache_path = tmp_path / "museum-index.pkl"
    monkeypatch.setenv("MULTIMODAL_MUSEUM_INDEX_CACHE_PATH", str(cache_path))
    core._load_museum_feature_index_cached.cache_clear()

    sample_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "experiments"
        / "experiment-03-museum-multimodal"
        / "images"
        / "smithsonian"
        / "smithsonian_786.jpg"
    )
    payload = {
        "fileName": sample_path.name,
        "format": "JPG",
        "dimensions": "768 × 768",
        "sizeLabel": "256 KB",
        "sourceMode": "upload",
        "imageDataUrl": as_data_url(sample_path),
    }

    async with create_client() as client:
        first_response = await client.post("/api/v1/museum-vision/analyze", json=payload)
    assert first_response.status_code == 200
    assert cache_path.exists()

    core._load_museum_feature_index_cached.cache_clear()

    def fail_if_rebuilt(_: Path):
        raise AssertionError("museum feature index rebuild should not happen when a valid cache exists")

    monkeypatch.setattr(core, "_build_museum_feature_index", fail_if_rebuilt)

    async with create_client() as client:
        second_response = await client.post("/api/v1/museum-vision/analyze", json=payload)
    assert second_response.status_code == 200
    assert second_response.json()["institution"] == "史密森学会"


async def test_runtime_assets_status_reports_cold_assets(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "runtime-assets-status.db"))
    herbal_cache_path = tmp_path / "herbal-classifier.pkl"
    museum_cache_path = tmp_path / "museum-index.pkl"
    monkeypatch.setenv("MULTIMODAL_HERBAL_MODEL_CACHE_PATH", str(herbal_cache_path))
    monkeypatch.setenv("MULTIMODAL_MUSEUM_INDEX_CACHE_PATH", str(museum_cache_path))
    core._load_herbal_classifier_cached.cache_clear()
    core._load_museum_feature_index_cached.cache_clear()

    async with create_client() as client:
        response = await client.get("/api/v1/runtime-assets")
    assert response.status_code == 200

    payload = response.json()
    assets = {item["key"]: item for item in payload["assets"]}

    assert assets["herbal-classifier"]["cacheReady"] is False
    assert assets["herbal-classifier"]["statusLabel"] == "待预热"
    assert assets["museum-feature-index"]["cacheReady"] is False
    assert assets["museum-feature-index"]["statusLabel"] == "待预热"
    assert payload["summaryMessage"] == "当前已就绪 0/2 项运行时缓存，建议先执行一次预热。"


async def test_runtime_assets_warmup_creates_ready_caches(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "runtime-assets-warmup.db"))
    herbal_cache_path = tmp_path / "herbal-classifier.pkl"
    museum_cache_path = tmp_path / "museum-index.pkl"
    monkeypatch.setenv("MULTIMODAL_HERBAL_MODEL_CACHE_PATH", str(herbal_cache_path))
    monkeypatch.setenv("MULTIMODAL_MUSEUM_INDEX_CACHE_PATH", str(museum_cache_path))
    core._load_herbal_classifier_cached.cache_clear()
    core._load_museum_feature_index_cached.cache_clear()

    async with create_client() as client:
        response = await client.post("/api/v1/runtime-assets/warmup")
    assert response.status_code == 200

    payload = response.json()
    assert payload["warmedKeys"] == ["herbal-classifier", "museum-feature-index"]
    assert payload["totalDurationMs"] >= 0

    assets = {item["key"]: item for item in payload["assets"]}
    assert assets["herbal-classifier"]["cacheReady"] is True
    assert assets["herbal-classifier"]["statusLabel"] == "就绪"
    assert assets["museum-feature-index"]["cacheReady"] is True
    assert assets["museum-feature-index"]["statusLabel"] == "就绪"
    assert payload["summaryMessage"].startswith("已就绪 2/2 项运行时缓存，新后端进程可直接复用。 本次预热耗时 ")
    assert herbal_cache_path.exists()
    assert museum_cache_path.exists()
