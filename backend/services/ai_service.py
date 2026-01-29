"""
AI Service - 恋爱军师核心逻辑
"""
import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from loguru import logger
from openai import AsyncOpenAI
from pydantic import ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

# 引入新定义的 Schema 和 Config
from models.schemas import AdvisorResponse
from config.styles import build_advisor_prompt, get_random_styles

class AIService:
    """
    AI 服务类 - 恋爱军师版
    """
    
    def __init__(self) -> None:
        logger.info("🚀 [AIService] Initializing Dating Advisor Service...")
        self._refresh_config()

    def _refresh_config(self) -> None:
        """加载环境变量配置"""
        load_dotenv(override=True)
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        # 推荐使用指令遵循能力强的模型
        self.model = os.getenv("AI_MODEL", "Qwen/Qwen2.5-72B-Instruct")
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "2048"))
        self.temperature = float(os.getenv("AI_TEMPERATURE", "0.95")) # 提高创造性
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://api.siliconflow.cn/v1"
        )
        
        logger.success(f"✅ [Config] Model: {self.model} | Temp: {self.temperature}")

    def _parse_response(self, raw_content: str) -> Dict[str, Any]:
        """
        解析 LLM 返回的 JSON 响应并验证数据结构
        """
        clean_content = raw_content.replace("```json", "").replace("```", "").strip()
        
        logger.debug(f"📝 [Parse] Raw content length: {len(clean_content)}")
        
        try:
            data = json.loads(clean_content)
            # 使用新版模型验证
            validated = AdvisorResponse(**data)
            logger.debug(f"✅ [Validate] Analysis: {validated.analysis[:20]}...")
            return validated.model_dump()
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ [Parse] JSON Error: {e}")
            raise e
        except ValidationError as e:
            logger.error(f"❌ [Parse] Schema Error: {e}")
            raise e

    def _build_context_prompt(self, user_input: str, history: list, selected_styles: list) -> str:
        """
        构建带上下文的 Prompt
        
        Args:
            user_input: 对方最新消息
            history: 历史对话记录 [{"role": "user", "content": "..."}, ...]
            selected_styles: 已选择的3种风格
            
        Returns:
            完整的 system prompt
        """
        # 1. 格式化历史记录
        context_str = ""
        if history:
            context_str = "\n# 📜 Conversation History (Recent Context)\n"
            context_str += "以下是之前的对话上下文，用于理解当前局势的背景：\n"
            for i, msg in enumerate(history, 1):
                role = "对方" if msg.get("role") == "user" else "你之前的建议"
                content = msg.get("content", "")
                context_str += f"{i}. {role}: {content}\n"
            context_str += "\n---\n"
        
        # 2. 获取基础 prompt
        base_prompt = build_advisor_prompt(user_input, selected_styles)
        
        # 3. 将 context 插入到 Input 之前
        if context_str:
            final_prompt = base_prompt.replace(
                "# Input - The Other Person's Message", 
                f"{context_str}# Input - The Other Person's Message (最新消息)"
            )
        else:
            final_prompt = base_prompt
            
        return final_prompt

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        retry=retry_if_exception_type((json.JSONDecodeError, ValidationError, Exception)),
        reraise=True,
    )
    async def generate_response(self, user_input: str, history: list = []) -> Dict[str, Any]:
        """
        生成恋爱军师建议（支持历史上下文）
        
        Args:
            user_input: 对方发来的文本
            history: 历史对话记录，用于上下文理解
            
        Returns:
            AdvisorResponse 的字典形式 (analysis, options)
        """
        self._refresh_config()
        
        # 1. 随机抽取 3 种风格
        selected_styles = get_random_styles(3)
        style_names = [s['name'] for s in selected_styles]
        logger.info(f"🎲 [Random] Styles: {style_names} | History Depth: {len(history)}")
        
        # 2. 构建带记忆的 Prompt
        system_prompt = self._build_context_prompt(user_input, history, selected_styles)
        
        logger.info(f"⚡ [Request] Input: {user_input[:30]}... | Context: {len(history)} messages")

        try:
            # 3. 调用 LLM
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    # 也可以选择把 user_input 放在这里再次强调，或者仅靠 system prompt
                    {"role": "user", "content": f"对方最新消息：{user_input}"},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"},
            )

            raw_content = response.choices[0].message.content
            
            # 4. 解析结果
            result = self._parse_response(raw_content)
            
            logger.success(f"✅ [LLM] Generation successful | Options: {len(result.get('options', []))}")
            
            return result
            
        except Exception as exc:
            logger.error(f"❌ [LLM] Failed: {exc}")
            raise exc

# 创建全局实例
ai_service = AIService()