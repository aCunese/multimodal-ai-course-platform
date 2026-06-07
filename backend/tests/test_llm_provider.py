from __future__ import annotations

from dataclasses import dataclass

import pytest

from app.services import llm_provider


def test_build_prompt_rejects_placeholder_titles():
    prompt = llm_provider._build_prompt(
        theme="课程答辩展示",
        tone="科技感",
        generation_type="标题",
        quantity=2,
    )

    assert "title 绝对不能使用“标题 1”" in prompt
    assert "每条都必须围绕“课程答辩展示”" in prompt
    assert "控制在 8-18 个中文字符内" in prompt
    assert "通过实际案例验证学习成果" in prompt


def test_generate_text_via_deepseek_rewrites_placeholder_titles(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("MULTIMODAL_TEXT_GENERATION_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("DEEPSEEK_MODEL", "deepseek-chat")

    captured_request: dict[str, object] = {}

    @dataclass
    class DummyResponse:
        payload: dict[str, object]

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return self.payload

    class DummyClient:
        def __init__(self, *, timeout: float):
            self.timeout = timeout

        def __enter__(self) -> "DummyClient":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            return None

        def post(self, url: str, *, headers: dict[str, str], json: dict[str, object]) -> DummyResponse:
            captured_request["url"] = url
            captured_request["headers"] = headers
            captured_request["json"] = json
            return DummyResponse(
                payload={
                    "choices": [
                        {
                            "message": {
                                "content": """
                                {
                                  "outputs": [
                                    {"title": "标题 1", "body": "让答辩现场像一块会发光的接口面板，把多模态结果一次讲清。"},
                                    {"title": "标题 2", "body": "把图像、文本与交互整合进同一块展示屏，让课程成果一眼被看懂。"}
                                  ]
                                }
                                """,
                            }
                        }
                    ]
                }
            )

    monkeypatch.setattr(llm_provider.httpx, "Client", DummyClient)

    outputs = llm_provider.generate_text_via_deepseek(
        theme="课程答辩展示",
        tone="科技感",
        generation_type="标题",
        quantity=2,
    )

    assert [item.title for item in outputs] == [
        "让答辩现场像一块会发光的接口面板",
        "把图像、文本与交互整合进同一块展示屏",
    ]
    assert [item.body for item in outputs] == [
        "让答辩现场像一块会发光的接口面板，把多模态结果一次讲清。",
        "把图像、文本与交互整合进同一块展示屏，让课程成果一眼被看懂。",
    ]

    request_payload = captured_request["json"]
    assert isinstance(request_payload, dict)
    messages = request_payload["messages"]
    assert isinstance(messages, list)
    user_prompt = messages[-1]["content"]
    assert "title 绝对不能使用“标题 1”" in user_prompt
    assert "title 使用“标题 1”这种形式即可" not in user_prompt
