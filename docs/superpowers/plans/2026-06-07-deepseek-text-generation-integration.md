# DeepSeek Text Generation Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `text-generation` 模块接入 DeepSeek API，让文案生成优先使用远程大模型结果，并在接口不可用时自动回退到当前本地模板生成，且不把密钥写入仓库。

**Architecture:** 保持前端 contract 和 `POST /api/v1/text-generation/generate` 响应结构不变，只在后端生成实现内部新增一个小型 provider 层。通过环境变量驱动 `local / deepseek` 模式，`deepseek` 模式下调用 DeepSeek Chat Completions 接口，失败时回退到现有 `_build_output()` 本地逻辑，避免破坏课堂演示和现有测试基线。

**Tech Stack:** FastAPI, Pydantic, SQLite, httpx, pytest, uv

---

## File Structure

- Create: `backend/app/services/llm_provider.py`
  - 单一职责：读取 DeepSeek 环境变量、拼装请求、解析返回内容、把远程结果映射成现有 `GenerationOutput` 结构。
- Modify: `backend/app/services/core.py`
  - 保留现有 `_build_output()` 本地生成逻辑，新增 provider 选择与回退逻辑，接线到 `generate_text()`。
- Modify: `backend/pyproject.toml`
  - 把 `httpx` 加入运行时依赖，确保后端服务在非测试环境也能调用 DeepSeek。
- Modify: `backend/tests/test_api.py`
  - 新增 API 级回归，覆盖 `deepseek` 成功、`deepseek` 失败回退、未配置密钥回退三条主路径。
- Modify: `backend/README.md`
  - 记录需要的环境变量、启动方式、密钥安全约束。
- Modify: `feature_list.json`
  - 新增或更新 DeepSeek 文案生成接入 feature 的状态和 evidence。
- Modify: `progress.md`
  - 记录本次接入、验证结果、风险和下一步。
- Modify: `session-handoff.md`
  - 记录如何继续扩展到情感分析，和当前 DeepSeek 接入的运行方式。

## Environment Contract

实现阶段统一使用以下环境变量，不把任何真实密钥写入仓库文件：

- `MULTIMODAL_TEXT_GENERATION_PROVIDER=local|deepseek`
- `DEEPSEEK_API_KEY=<secret>`
- `DEEPSEEK_BASE_URL=https://api.deepseek.com`
- `DEEPSEEK_MODEL=deepseek-chat`
- `DEEPSEEK_TIMEOUT_SECONDS=30`

本轮本地调试命令使用：

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform/backend
export MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek
export DEEPSEEK_API_KEY='REPLACE_AT_RUNTIME_ONLY'
export DEEPSEEK_BASE_URL='https://api.deepseek.com'
export DEEPSEEK_MODEL='deepseek-chat'
export DEEPSEEK_TIMEOUT_SECONDS='30'
uv run uvicorn app.main:app --reload --port 8000
```

### Task 1: Add a Focused DeepSeek Provider Module

**Files:**
- Create: `backend/app/services/llm_provider.py`
- Modify: `backend/pyproject.toml`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Write the failing tests**

在 `backend/tests/test_api.py` 里追加这三个测试，先锁定 provider 选择和回退行为。测试直接 patch `core.generate_text_via_deepseek`，避免在 API 测试里发真实网络请求。

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform/backend
uv run pytest tests/test_api.py -k "text_generation_uses_deepseek_outputs_when_provider_enabled or text_generation_falls_back_to_local_outputs_when_deepseek_raises or text_generation_falls_back_to_local_outputs_when_api_key_missing" -v
```

Expected:

```text
FAILED tests/test_api.py::test_text_generation_uses_deepseek_outputs_when_provider_enabled - AttributeError: module 'app.services.core' has no attribute 'generate_text_via_deepseek'
FAILED tests/test_api.py::test_text_generation_falls_back_to_local_outputs_when_deepseek_raises - AttributeError: module 'app.services.core' has no attribute 'generate_text_via_deepseek'
```

- [ ] **Step 3: Write minimal implementation**

1. 在 `backend/pyproject.toml` 的运行时依赖里加入 `httpx>=0.28.0`：

```toml
[project]
name = "multimodal-ai-course-platform-backend"
version = "0.1.0"
description = "FastAPI backend for the multimodal AI course platform"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.116.0",
  "httpx>=0.28.0",
  "numpy>=2.0.0",
  "pillow>=11.0.0",
  "pydantic>=2.11.0",
  "scikit-learn>=1.7.0",
  "uvicorn>=0.35.0",
]
```

2. 新建 `backend/app/services/llm_provider.py`：

```python
from __future__ import annotations

import json
import os
from dataclasses import dataclass

import httpx

from ..schemas import GenerationOutput


@dataclass(frozen=True)
class DeepSeekSettings:
    provider: str
    api_key: str | None
    base_url: str
    model: str
    timeout_seconds: float


def get_deepseek_settings() -> DeepSeekSettings:
    return DeepSeekSettings(
        provider=os.getenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "local").strip().lower() or "local",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url=(os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")),
        model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat").strip() or "deepseek-chat",
        timeout_seconds=float(os.getenv("DEEPSEEK_TIMEOUT_SECONDS", "30")),
    )


def should_use_deepseek(settings: DeepSeekSettings) -> bool:
    return settings.provider == "deepseek" and bool(settings.api_key)


def generate_text_via_deepseek(*, theme: str, tone: str, generation_type: str, quantity: int) -> list[GenerationOutput]:
    settings = get_deepseek_settings()
    if not should_use_deepseek(settings):
        raise RuntimeError("DeepSeek provider is not enabled.")

    prompt = f"""
你是课程答辩文案助手。请围绕主题“{theme}”，以“{tone}”语气，生成 {quantity} 条“{generation_type}”。
要求：
1. 输出 JSON 数组，不要输出 Markdown。
2. 每项包含 title 和 body 两个字段。
3. title 使用“{generation_type} 1”这类格式。
4. body 要自然、具体、中文表达流畅。
""".strip()

    with httpx.Client(timeout=settings.timeout_seconds) as client:
        response = client.post(
            f"{settings.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.model,
                "messages": [
                    {"role": "system", "content": "你是一个严谨的中文课程展示文案生成助手。"},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.8,
            },
        )
        response.raise_for_status()

    payload = response.json()
    content = payload["choices"][0]["message"]["content"]
    items = json.loads(content)

    outputs: list[GenerationOutput] = []
    for index, item in enumerate(items[:quantity], start=1):
        outputs.append(
            GenerationOutput(
                id=f"generated-{generation_type}-{index}",
                type=generation_type,
                title=str(item.get("title") or f"{generation_type} {index}"),
                body=str(item.get("body") or "").strip(),
            )
        )
    return outputs
```

3. 在 `backend/app/services/core.py` 顶部 imports 里加入：

```python
from .llm_provider import generate_text_via_deepseek, get_deepseek_settings, should_use_deepseek
```

4. 在 `backend/app/services/core.py` 里新增一个本地输出 helper，避免回退逻辑复制：

```python
def _build_local_generation_outputs(theme: str, tone: str, generation_type: str, quantity: int) -> list[GenerationOutput]:
    return [
        _build_output(theme, tone, generation_type, index)
        for index in range(quantity)
    ]
```

5. 把 `generate_text()` 改成 provider-aware：

```python
def generate_text(payload: TextGenerationRequest) -> TextGenerationResponse:
    settings = get_deepseek_settings()

    if should_use_deepseek(settings):
        try:
            outputs = generate_text_via_deepseek(
                theme=payload.theme,
                tone=payload.tone,
                generation_type=payload.type,
                quantity=payload.quantity,
            )
        except Exception:
            outputs = _build_local_generation_outputs(
                payload.theme,
                payload.tone,
                payload.type,
                payload.quantity,
            )
    else:
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
        historyRecord=history_record,
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform/backend
uv sync
uv run pytest tests/test_api.py -k "text_generation_uses_deepseek_outputs_when_provider_enabled or text_generation_falls_back_to_local_outputs_when_deepseek_raises or text_generation_falls_back_to_local_outputs_when_api_key_missing" -v
```

Expected:

```text
3 passed
```

- [ ] **Step 5: Commit**

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform
git add backend/app/services/llm_provider.py backend/app/services/core.py backend/pyproject.toml backend/tests/test_api.py
git commit -m "feat: add deepseek-backed text generation provider"
```

### Task 2: Harden DeepSeek Response Parsing and Real API Debugging

**Files:**
- Modify: `backend/app/services/llm_provider.py`
- Modify: `backend/tests/test_api.py`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Write the failing tests**

在 `backend/tests/test_api.py` 里追加这两个测试，锁定“DeepSeek 把 JSON 包在代码块里”和“返回数量不足时补齐本地结果”的真实兼容问题。

```python
def test_generate_text_via_deepseek_parses_json_code_fence(monkeypatch):
    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": '```json\\n[{"title":"标题 1","body":"围绕课程展示打造更清晰的智能叙事。"}]\\n```'
                        }
                    }
                ]
            }

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, *args, **kwargs):
            return FakeResponse()

    monkeypatch.setenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setattr("app.services.llm_provider.httpx.Client", FakeClient)

    outputs = core.generate_text_via_deepseek(
        theme="课程答辩展示",
        tone="科技感",
        generation_type="标题",
        quantity=1,
    )

    assert outputs[0].body == "围绕课程展示打造更清晰的智能叙事。"


async def test_text_generation_backfills_local_outputs_when_deepseek_returns_too_few_items(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("MULTIMODAL_APP_DB_PATH", str(tmp_path / "generation-short-list.db"))
    monkeypatch.setenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")

    def fake_generate_text_via_deepseek(*, theme: str, tone: str, generation_type: str, quantity: int):
        return [
            core.GenerationOutput(
                id="generated-title-1",
                type="标题",
                title="标题 1",
                body="只返回了一条远程结果",
            )
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
    assert len(payload["outputs"]) == 2
    assert payload["outputs"][0]["body"] == "只返回了一条远程结果"
    assert payload["outputs"][1]["body"] == "课程答辩展示 · 多模态智能展示中枢"
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform/backend
uv run pytest tests/test_api.py -k "parses_json_code_fence or backfills_local_outputs_when_deepseek_returns_too_few_items" -v
```

Expected:

```text
FAILED tests/test_api.py::test_generate_text_via_deepseek_parses_json_code_fence - json.decoder.JSONDecodeError
FAILED tests/test_api.py::test_text_generation_backfills_local_outputs_when_deepseek_returns_too_few_items - AssertionError: assert 1 == 2
```

- [ ] **Step 3: Write minimal implementation**

1. 在 `backend/app/services/llm_provider.py` 中新增内容清洗函数：

```python
def _strip_json_code_fence(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].startswith("```"):
            return "\n".join(lines[1:-1]).strip()
    return stripped
```

2. 调整 `generate_text_via_deepseek()` 中的解析逻辑：

```python
    payload = response.json()
    raw_content = payload["choices"][0]["message"]["content"]
    content = _strip_json_code_fence(raw_content)
    items = json.loads(content)
```

3. 在 `backend/app/services/core.py` 中新增“补齐不足数量”的 helper：

```python
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
```

4. 把 `generate_text()` 里 DeepSeek 成功分支替换成：

```python
        try:
            remote_outputs = generate_text_via_deepseek(
                theme=payload.theme,
                tone=payload.tone,
                generation_type=payload.type,
                quantity=payload.quantity,
            )
            outputs = _merge_remote_and_local_generation_outputs(
                remote_outputs,
                theme=payload.theme,
                tone=payload.tone,
                generation_type=payload.type,
                quantity=payload.quantity,
            )
        except Exception:
            outputs = _build_local_generation_outputs(
                payload.theme,
                payload.tone,
                payload.type,
                payload.quantity,
            )
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform/backend
uv run pytest tests/test_api.py -k "parses_json_code_fence or backfills_local_outputs_when_deepseek_returns_too_few_items" -v
```

Expected:

```text
2 passed
```

- [ ] **Step 5: Commit**

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform
git add backend/app/services/llm_provider.py backend/app/services/core.py backend/tests/test_api.py
git commit -m "fix: harden deepseek text-generation fallback parsing"
```

### Task 3: Verify Against the Real DeepSeek API and Document the Operational Contract

**Files:**
- Modify: `backend/README.md`
- Modify: `feature_list.json`
- Modify: `progress.md`
- Modify: `session-handoff.md`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Write the failing operational check**

先用现有 API 测试和全量 harness 做验收前置，保证集成后没有破坏其它模块。这个步骤不是新写测试文件，而是先跑整体现有验证并记录当前行为。

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform
./init.sh
```

Expected before code completion:

```text
Harness verification complete.
```

- [ ] **Step 2: Write minimal documentation and state updates**

1. 在 `backend/README.md` 的“当前职责”后追加运行说明：

```md
## DeepSeek 文案生成接入

`POST /api/v1/text-generation/generate` 现在支持通过环境变量切换到 DeepSeek：

- `MULTIMODAL_TEXT_GENERATION_PROVIDER=local|deepseek`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`，默认 `https://api.deepseek.com`
- `DEEPSEEK_MODEL`，默认 `deepseek-chat`
- `DEEPSEEK_TIMEOUT_SECONDS`，默认 `30`

安全约束：

- 不要把真实 `DEEPSEEK_API_KEY` 写入仓库文件、测试文件或文档示例。
- 本地调试通过 shell `export` 注入；CI 或部署环境通过 secret 管理。

回退策略：

- 当 provider 为 `local` 时，继续使用现有本地模板与诗词语料生成。
- 当 provider 为 `deepseek` 且接口调用失败、返回非法 JSON 或未配置密钥时，自动回退到本地生成逻辑。
```

2. 在 `feature_list.json` 新增一个 feature，放在现有列表尾部：

```json
{
  "id": "feat-044",
  "name": "DeepSeek 文案生成接入",
  "description": "为 text-generation 模块接入 DeepSeek API，并保留本地模板生成为稳定回退路径。",
  "dependencies": ["feat-008", "feat-011", "feat-012"],
  "status": "done",
  "evidence": "backend/app/services/llm_provider.py, backend/app/services/core.py::generate_text provider fallback, backend/tests/test_api.py DeepSeek success/fallback regressions; verified by backend pytest, ./init.sh, and a real DeepSeek API smoke request on 2026-06-07"
}
```

3. 在 `progress.md` 的“Current Snapshot”追加一条：

```md
- `backend/` 的文案生成模块现在支持通过 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek` 接入 DeepSeek API；当远程接口不可用、未配置密钥或返回内容不合法时，会自动回退到现有本地模板生成逻辑，保证课堂演示稳定性。
```

4. 在 `progress.md` 的“验证结果”追加一组记录：

```md
- 2026-06-07：围绕 DeepSeek 文案生成接入执行了定向与全量验证，结果均通过：
  - `backend/` 内执行 `uv run pytest tests/test_api.py -k 'deepseek or text_generation' -v`
  - 项目根目录执行 `./init.sh`
  - 本地注入 `DEEPSEEK_API_KEY` 后，向 `POST /api/v1/text-generation/generate` 发起真实 smoke 请求，确认返回 200，且输出内容来自远程模型
```

5. 在 `session-handoff.md` 的 `Current Focus` 或 `What Changed In This Session` 追加：

```md
- `text-generation` 已完成 DeepSeek 接入，当前通过 `MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek` + `DEEPSEEK_API_KEY` 启用，失败时自动回退本地模板；下一条更合适的单一切片是把同样的 provider 能力扩展到 `sentiment-analysis` 的 explanation 增强层，而不是直接替换整个分类逻辑。
```

- [ ] **Step 3: Run verification and real API smoke test**

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform/backend
uv run pytest tests/test_api.py -k "deepseek or text_generation" -v
```

Expected:

```text
passed
```

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform
./init.sh
```

Expected:

```text
Harness verification complete.
```

Run the real DeepSeek smoke request with runtime-only secrets:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform/backend
export MULTIMODAL_TEXT_GENERATION_PROVIDER=deepseek
export DEEPSEEK_API_KEY='REPLACE_AT_RUNTIME_ONLY'
export DEEPSEEK_BASE_URL='https://api.deepseek.com'
export DEEPSEEK_MODEL='deepseek-chat'
export DEEPSEEK_TIMEOUT_SECONDS='30'
uv run python - <<'PY'
from app.services.core import generate_text
from app.schemas import TextGenerationRequest

response = generate_text(
    TextGenerationRequest(
        theme="多模态 AI 课程成果平台答辩展示",
        tone="科技感",
        type="宣传语",
        quantity=2,
    )
)
print(len(response.outputs))
for item in response.outputs:
    print(item.title, "=>", item.body[:60])
PY
```

Expected:

```text
2
宣传语 1 => ...
宣传语 2 => ...
```

- [ ] **Step 4: Run final full acceptance**

Run:

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform
./init.sh e2e
```

Expected:

```text
Harness verification complete.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/ruyne./Library/Mobile Documents/com~apple~CloudDocs/大三课程文档/自然语言作业存放/期末/multimodal-ai-course-platform
git add backend/README.md feature_list.json progress.md session-handoff.md
git commit -m "docs: record deepseek text-generation integration"
```

## Self-Review

- Spec coverage:
  - DeepSeek API 接入：Task 1
  - 不写死密钥到仓库：Environment Contract + Task 3
  - 自行调试：Task 2 和 Task 3 的真实 smoke request
  - 保持项目稳定：Task 1 fallback、Task 3 full acceptance
- Placeholder scan:
  - 本计划没有使用 `TODO`、`TBD`、`implement later` 或“类似 Task N”这类占位写法。
- Type consistency:
  - 计划中统一使用 `generate_text_via_deepseek`、`_build_local_generation_outputs`、`_merge_remote_and_local_generation_outputs` 这三个函数名，没有在后续任务中改名。
