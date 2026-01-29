"""
AI Service - 核心 LLM 调用服务
使用 AsyncOpenAI 原生异步客户端 + Loguru 结构化日志
"""
import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from loguru import logger
from openai import AsyncOpenAI
from pydantic import ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from models.schemas import GameResponse
from config.styles import build_system_prompt

class AIService:
    """
    AI 服务类 - 负责与 LLM 交互
    
    Features:
    - AsyncOpenAI 原生异步客户端（高并发性能优化）
    - Tenacity 自动重试机制（容错性）
    - Loguru 结构化日志（可观测性）
    - Pydantic 数据校验（类型安全）
    """
    
    def __init__(self) -> None:
        logger.info("🚀 [AIService] Initializing AI Service...")
        self._refresh_config()

    def _refresh_config(self) -> None:
        """加载环境变量配置"""
        load_dotenv(override=True)
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        self.model = os.getenv("AI_MODEL", "Qwen/Qwen2.5-72B-Instruct")
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "2048"))
        self.temperature = float(os.getenv("AI_TEMPERATURE", "0.85"))
        
        # 使用 AsyncOpenAI 原生异步客户端
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://api.siliconflow.cn/v1"
        )
        
        logger.success(f"✅ [Config] Model: {self.model} | Tokens: {self.max_tokens} | Temp: {self.temperature}")

    def _parse_response(self, raw_content: str) -> Dict[str, Any]:
        """
        解析 LLM 返回的 JSON 响应并验证数据结构
        
        Args:
            raw_content: LLM 返回的原始字符串
            
        Returns:
            验证后的字典数据
            
        Raises:
            json.JSONDecodeError: JSON 解析失败
            ValidationError: Pydantic 数据验证失败
        """
        # 清理可能的 Markdown 代码块标记
        clean_content = raw_content.replace("```json", "").replace("```", "").strip()
        
        logger.debug(f"📝 [Parse] Raw content length: {len(clean_content)}")
        
        # JSON 解析
        data = json.loads(clean_content)
        
        # Pydantic 验证
        validated = GameResponse(**data)
        
        logger.debug(f"✅ [Validate] Mood: {validated.mood} | Scene: {validated.scene}")
        
        return validated.model_dump()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        retry=retry_if_exception_type((json.JSONDecodeError, ValidationError, Exception)),
        reraise=True,
    )
    async def generate_response(self, user_input: str, style: str) -> Dict[str, Any]:
        """
        生成 AI 响应 - 使用原生异步客户端
        
        Args:
            user_input: 用户输入文本
            style: 风格代码 (TSUNDERE/YANDERE/KUUDERE/GENKI)
            
        Returns:
            包含 summary, text, mood, scene, options 的字典
            
        Raises:
            Exception: API 调用失败或数据验证失败
        """
        self._refresh_config()
        
        # 从配置模块动态构建 Prompt
        system_prompt = build_system_prompt(style)
        
        logger.info(f"⚡ [Request] Style: {style} | Input: {user_input[:30]}...")

        try:
            # 直接 await 原生异步方法，无需 asyncio.to_thread
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"},
            )

            raw_content = response.choices[0].message.content
            result = self._parse_response(raw_content)
            
            logger.success(f"✅ [LLM] Generation successful | Options: {len(result.get('options', []))}")
            
            return result
            
        except Exception as exc:
            logger.error(f"❌ [LLM] Failed: {exc}")
            raise exc


# 创建全局实例供 main.py 导入
ai_service = AIService()