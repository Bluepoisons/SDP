import json
import os
from typing import Any, Dict, List

import httpx
from dotenv import load_dotenv
from pydantic import ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential_jitter

from schemas import GameResponse, StyleCode

class AIService:
    def __init__(self) -> None:
        self.base_url = "https://api.siliconflow.cn/v1"
        self._refresh_config()

    def _refresh_config(self) -> None:
        load_dotenv(override=True)
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        self.model = os.getenv("AI_MODEL", "Qwen/Qwen2.5-72B-Instruct")
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "900"))
        self.temperature = float(os.getenv("AI_TEMPERATURE", "0.9"))
        self.timeout = float(os.getenv("AI_TIMEOUT", "60.0"))
        self.timeout_read = float(os.getenv("AI_TIMEOUT_READ", str(self.timeout)))
        self.timeout_connect = float(os.getenv("AI_TIMEOUT_CONNECT", "10.0"))
        self.history_limit = int(os.getenv("AI_HISTORY_LIMIT", "8"))

    def _build_user_content(self, text: str, history: List[Dict[str, Any]]) -> str:
        """构建用户输入内容，保证 System Prompt 保持严格格式。"""

        safe_history = (history or [])[-self.history_limit :]
        if not safe_history:
            return f"用户输入：{text}"

        history_lines = []
        for item in safe_history:
            role = "玩家" if item.get("role") == "user" else "角色"
            content = item.get("content", "")
            history_lines.append(f"- {role}: {content}")

        history_block = "\n".join(history_lines)
        return f"用户输入：{text}\n\n历史对话：\n{history_block}"

    def _normalize_style(self, style: StyleCode) -> str:
        return style.value

    def _parse_model_output(self, content: str) -> Dict[str, Any]:
        """解析模型返回并进行严格校验。"""

        raw = json.loads(content)
        validated = GameResponse.model_validate(raw)
        return validated.model_dump()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=0.5, max=3.0),
        retry=retry_if_exception_type((json.JSONDecodeError, ValidationError)),
        reraise=True,
    )
    async def _call_and_parse(self, client: httpx.AsyncClient, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = await client.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return self._parse_model_output(content)

    async def generate_dialog_options(
        self,
        text: str,
        style: StyleCode = StyleCode.TSUNDERE,
        history: List[Dict[str, Any]] | None = None,
    ) -> Dict[str, Any]:
        """调用模型并返回结构化结果。"""

        self._refresh_config()
        style_code = self._normalize_style(style)
        messages = [
            {"role": "system", "content": f"SDP_STYLE: {style_code}"},
            {"role": "user", "content": self._build_user_content(text, history or [])},
        ]

        timeout = httpx.Timeout(
            connect=self.timeout_connect,
            read=self.timeout_read,
            write=10.0,
            pool=10.0,
        )

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                return await self._call_and_parse(client, messages)
        except json.JSONDecodeError:
            return {
                "error": "模型返回 JSON 解析失败",
                "errorType": "JSONDecodeError",
            }
        except ValidationError as exc:
            return {
                "error": "模型返回字段校验失败",
                "errorType": "ValidationError",
                "details": exc.errors(),
            }
        except httpx.TimeoutException:
            return {
                "error": "模型请求超时",
                "errorType": "timeout",
            }
        except httpx.RequestError:
            return {
                "error": "模型请求异常",
                "errorType": "network",
            }
        except httpx.HTTPStatusError as exc:
            return {
                "error": f"模型服务错误 ({exc.response.status_code})",
                "errorType": "http",
            }
        except Exception as exc:
            return {
                "error": f"未知错误: {exc}",
                "errorType": "unknown",
            }

ai_service = AIService()