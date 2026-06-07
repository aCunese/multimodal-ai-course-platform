from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any

import httpx

from ..schemas import GenerationOutput, KeywordMatch


@dataclass(frozen=True)
class DeepSeekSettings:
    provider: str
    api_key: str | None
    base_url: str
    model: str
    timeout_seconds: float


def _get_deepseek_settings(provider_env_var: str) -> DeepSeekSettings:
    return DeepSeekSettings(
        provider=os.getenv(provider_env_var, "local").strip().lower() or "local",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/"),
        model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat").strip() or "deepseek-chat",
        timeout_seconds=float(os.getenv("DEEPSEEK_TIMEOUT_SECONDS", "30")),
    )


def get_deepseek_settings() -> DeepSeekSettings:
    return _get_deepseek_settings("MULTIMODAL_TEXT_GENERATION_PROVIDER")


def get_sentiment_deepseek_settings() -> DeepSeekSettings:
    return _get_deepseek_settings("MULTIMODAL_SENTIMENT_PROVIDER")


def should_use_deepseek(settings: DeepSeekSettings) -> bool:
    return settings.provider == "deepseek" and bool(settings.api_key)


def _strip_json_code_fence(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].startswith("```"):
            return "\n".join(lines[1:-1]).strip()
    return stripped


def _normalize_generation_items(payload: object) -> list[dict[str, object]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    if isinstance(payload, dict):
        outputs = payload.get("outputs")
        if isinstance(outputs, list):
            return [item for item in outputs if isinstance(item, dict)]

    raise ValueError("DeepSeek returned an unexpected response shape for text generation.")


def _normalize_sentiment_payload(payload: object) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("DeepSeek returned an unexpected response shape for sentiment analysis.")
    return payload


_PLACEHOLDER_TITLE_RE = re.compile(r"^(标题|宣传语|短文案|诗意表达)\s*[-_#]?\s*\d+\s*$")


def _tone_guidance(tone: str) -> str:
    return {
        "正式": "表达专业、克制、清晰，避免空泛口号和模板化官话。",
        "活泼": "表达轻快、有感染力，可以口语化，但不要夸张到像段子。",
        "科技感": "表达未来感、效率感和系统感，可适度使用接口、数据、引擎等意象。",
        "文艺": "表达有画面感和节奏感，但不要堆砌生僻辞藻。",
    }.get(tone, "表达自然、具体，避免空泛。")


def _generation_type_guidance(generation_type: str) -> str:
    return {
        "标题": (
            "每条输出的 title 必须像可直接上屏的正式标题，控制在 8-18 个中文字符内；"
            "body 用 18-40 个中文字符补充亮点或副标题。"
        ),
        "宣传语": (
            "每条输出的 title 必须像主宣传语，短促有记忆点；"
            "body 用 20-45 个中文字符补充传播语气或场景。"
        ),
        "短文案": (
            "每条输出的 title 必须概括核心卖点；"
            "body 用 45-90 个中文字符写成完整短文案，必须具体且有信息量。"
        ),
        "诗意表达": (
            "每条输出的 title 必须有意象；"
            "body 用 35-80 个中文字符写成有画面感的诗性表达。"
        ),
    }.get(generation_type, "title 和 body 都必须具体自然。")


def _build_prompt(*, theme: str, tone: str, generation_type: str, quantity: int) -> str:
    return f"""
你是课程项目答辩现场的中文文案总监，擅长把技术主题写得具体、上屏、可展示。
请围绕主题“{theme}”，以“{tone}”语气，生成 {quantity} 条“{generation_type}”。

输出要求：
- 必须严格返回 JSON，不要返回 Markdown，不要写解释。
- 优先返回对象结构：{{"outputs":[{{"title":"...","body":"..."}}]}}
- 每条都必须围绕“{theme}”，彼此角度明显不同，不能只是同一句话改几个词。
- { _tone_guidance(tone) }
- { _generation_type_guidance(generation_type) }
- title 绝对不能使用“标题 1”“宣传语 1”“短文案 1”“诗意表达 1”这类占位写法。
- 避免“本次课程将系统性梳理核心知识体系”“通过实际案例验证学习成果”等空泛答辩套话，除非它们和主题强相关。
- body 必须是自然、流畅、具体的中文，不能只重复 title。
- 返回数量尽量等于 {quantity}。

JSON 示例：
{{
  "outputs": [
    {{
      "title": "示例标题",
      "body": "示例补充文案"
    }}
  ]
}}
""".strip()


def _is_placeholder_title(title: str) -> bool:
    stripped = title.strip()
    return not stripped or bool(_PLACEHOLDER_TITLE_RE.fullmatch(stripped))


def _derive_title_from_body(body: str, generation_type: str, index: int) -> str:
    if not body.strip():
        return f"{generation_type}{index}"

    first_segment = re.split(r"[。！？!?\n；;，,]", body.strip(), maxsplit=1)[0].strip()
    first_segment = re.sub(r"^[：:、,，\-\s]+", "", first_segment)
    first_segment = re.sub(r"\s+", " ", first_segment)
    if not first_segment:
        return f"{generation_type}{index}"

    title_limit = 18 if generation_type in {"标题", "宣传语"} else 20
    candidate = first_segment[:title_limit].strip("，。；：:、!！?？ ")
    return candidate or f"{generation_type}{index}"


def _normalize_output_title(title: object, body: object, generation_type: str, index: int) -> str:
    title_text = str(title or "").strip()
    body_text = str(body or "").strip()
    if _is_placeholder_title(title_text):
        return _derive_title_from_body(body_text, generation_type, index)
    return title_text


def _normalize_keyword_match_items(payload: object) -> list[KeywordMatch]:
    if not isinstance(payload, list):
        return []

    normalized: list[KeywordMatch] = []
    for item in payload:
        if isinstance(item, str):
            label = item.strip()
            if label:
                normalized.append(KeywordMatch(label=label, score=0.7))
            continue

        if isinstance(item, dict):
            label = str(item.get("label") or item.get("keyword") or "").strip()
            if not label:
                continue

            raw_score = item.get("score", 0.7)
            try:
                score = float(raw_score)
            except (TypeError, ValueError):
                score = 0.7
            normalized.append(KeywordMatch(label=label, score=max(0.0, min(0.99, round(score, 2)))))

    return normalized


def _normalize_sentiment_label(value: object) -> str:
    raw = str(value or "").strip().lower()
    mapping = {
        "positive": "正面",
        "negative": "负面",
        "neutral": "中性",
        "正面": "正面",
        "负面": "负面",
        "中性": "中性",
    }
    label = mapping.get(raw)
    if label is None:
        raise ValueError("DeepSeek returned an unsupported sentiment label.")
    return label


def _build_sentiment_prompt(*, text: str) -> str:
    return f"""
你是一个严格输出 JSON 的中文情感分析助手。
请分析下面这段文本的总体情感，并返回结构化结果。

文本：
\"\"\"{text}\"\"\"

输出要求：
- 只返回 JSON，不要返回 Markdown，不要写解释性前言。
- 返回对象结构必须包含：
  {{
    "label": "正面/中性/负面",
    "confidence": 0-100 的数字,
    "positiveMatches": [{{"label":"中文关键词","score":0-0.99}}],
    "negativeMatches": [{{"label":"中文关键词","score":0-0.99}}],
    "explanation": "一句中文解释"
  }}
- label 只能是“正面”“中性”“负面”之一。
- positiveMatches 和 negativeMatches 优先使用中文关键词，不要保留英文原词。
- confidence 必须是数字。
""".strip()


def _deduplicate_titles(outputs: list[GenerationOutput]) -> list[GenerationOutput]:
    counts: dict[str, int] = {}
    deduplicated: list[GenerationOutput] = []
    for output in outputs:
        base_title = output.title.strip() or output.type
        next_count = counts.get(base_title, 0) + 1
        counts[base_title] = next_count
        if next_count == 1:
            deduplicated.append(output)
            continue

        deduplicated.append(
            output.model_copy(update={"title": f"{base_title} {next_count}"})
        )

    return deduplicated


def generate_text_via_deepseek(*, theme: str, tone: str, generation_type: str, quantity: int) -> list[GenerationOutput]:
    settings = get_deepseek_settings()
    if not should_use_deepseek(settings):
        raise RuntimeError("DeepSeek provider is not enabled.")

    prompt = _build_prompt(
        theme=theme,
        tone=tone,
        generation_type=generation_type,
        quantity=quantity,
    )

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
                    {
                        "role": "system",
                        "content": (
                            "你是一个擅长课程答辩展示、产品化表达和中文文案润色的高级文案助手。"
                            "你输出的内容必须具体、自然、适合直接展示。"
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.8,
            },
        )
        response.raise_for_status()

    payload = response.json()
    raw_content = payload["choices"][0]["message"]["content"]
    content = _strip_json_code_fence(raw_content)
    items = _normalize_generation_items(json.loads(content))

    outputs: list[GenerationOutput] = []
    for index, item in enumerate(items[:quantity], start=1):
        body = str(item.get("body") or "").strip()
        outputs.append(
            GenerationOutput(
                id=f"generated-{generation_type}-{index}",
                type=generation_type,
                title=_normalize_output_title(item.get("title"), body, generation_type, index),
                body=body,
            )
        )

    outputs = [output for output in outputs if output.body]
    outputs = _deduplicate_titles(outputs)

    if not outputs:
        raise ValueError("DeepSeek did not return any usable text generation outputs.")

    return outputs


def analyze_sentiment_via_deepseek(*, text: str) -> dict[str, Any]:
    settings = get_sentiment_deepseek_settings()
    if not should_use_deepseek(settings):
        raise RuntimeError("DeepSeek sentiment provider is not enabled.")

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
                    {
                        "role": "system",
                        "content": (
                            "你是一个稳健的中文情感分析助手。"
                            "你的任务是严格输出结构化 JSON，并尽量用中文关键词总结文本情绪线索。"
                        ),
                    },
                    {"role": "user", "content": _build_sentiment_prompt(text=text)},
                ],
                "temperature": 0.2,
            },
        )
        response.raise_for_status()

    payload = response.json()
    raw_content = payload["choices"][0]["message"]["content"]
    content = _strip_json_code_fence(raw_content)
    normalized_payload = _normalize_sentiment_payload(json.loads(content))
    label = _normalize_sentiment_label(normalized_payload.get("label"))

    try:
        confidence = float(normalized_payload.get("confidence", 50))
    except (TypeError, ValueError) as exc:
        raise ValueError("DeepSeek returned an invalid confidence value for sentiment analysis.") from exc

    explanation = str(normalized_payload.get("explanation") or "").strip()
    if not explanation:
        raise ValueError("DeepSeek did not return a usable sentiment explanation.")

    return {
        "label": label,
        "confidence": max(0.0, min(100.0, round(confidence, 1))),
        "positiveMatches": _normalize_keyword_match_items(normalized_payload.get("positiveMatches"))[:5],
        "negativeMatches": _normalize_keyword_match_items(normalized_payload.get("negativeMatches"))[:5],
        "explanation": explanation,
    }
