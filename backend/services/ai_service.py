"""
AI Service - 恋爱军师核心逻辑 v8.0 指挥官系统
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
from models.schemas import AdvisorResponse, SituationAnalysis
from config.styles import (
    build_advisor_prompt, 
    build_analyze_prompt, 
    build_execute_prompt,
    get_random_styles
)

class AIService:
    """
    AI 服务类 - v8.0 指挥官系统
    支持双阶段处理: Analyze (态势感知) -> Execute (战术执行)
    """
    
    def __init__(self) -> None:
        logger.info("🚀 [AIService] Initializing Commander System v8.0...")
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

    def _detect_burst_mode(self, text: str) -> tuple[bool, int]:
        """
        检测连发消息模式
        Returns: (is_burst, pressure_level)
        """
        lines = text.strip().split('\n')
        line_count = len(lines)
        
        # 计算短消息占比（<=5字符的行）
        short_lines = sum(1 for line in lines if len(line.strip()) <= 5)
        
        is_burst = line_count >= 3 or (line_count >= 2 and short_lines >= 2)
        pressure_level = min(line_count, 5)  # 最高5级
        
        return is_burst, pressure_level

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

    def _parse_analysis_response(self, raw_content: str) -> Dict[str, Any]:
        """
        解析态势感知响应 (SituationAnalysis)
        """
        clean_content = raw_content.replace("```json", "").replace("```", "").strip()
        
        try:
            data = json.loads(clean_content)
            validated = SituationAnalysis(**data)
            return validated.model_dump()
        except json.JSONDecodeError as e:
            logger.error(f"❌ [Analyze Parse] JSON Error: {e}")
            raise e
        except ValidationError as e:
            logger.error(f"❌ [Analyze Parse] Schema Error: {e}")
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

    # ==================== v8.0 新增：双阶段 API ====================
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        retry=retry_if_exception_type((json.JSONDecodeError, ValidationError, Exception)),
        reraise=True,
    )
    async def analyze_situation(self, user_input: str, history: list = []) -> Dict[str, Any]:
        """
        v8.0 Phase 1: 态势感知 (Situation Awareness)
        分析对方情绪、意图和语境压迫感
        
        Args:
            user_input: 对方发来的消息（支持多行连发）
            history: 历史对话上下文
            
        Returns:
            SituationAnalysis 的字典形式
        """
        self._refresh_config()
        
        # 1. 预检测连发模式
        is_burst, pressure_level = self._detect_burst_mode(user_input)
        logger.info(f"🎯 [Analyze] Input: {user_input[:30]}... | Burst: {is_burst} | Pressure: {pressure_level}")
        
        # 2. 构建分析 Prompt
        system_prompt = build_analyze_prompt(user_input, history)
        
        try:
            # 3. 调用 LLM 进行心理侧写
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"请分析以下消息：\n{user_input}"},
                ],
                temperature=0.7,  # 分析阶段降低随机性
                max_tokens=512,   # 分析输出较短
                response_format={"type": "json_object"},
            )
            
            raw_content = response.choices[0].message.content
            result = self._parse_analysis_response(raw_content)
            
            # 4. 用预检测结果覆盖（更准确）
            result["burst_detected"] = is_burst
            result["pressure_level"] = max(result.get("pressure_level", 0), pressure_level)
            
            logger.success(f"✅ [Analyze] Strategy: {result.get('strategy')} | Emotion: {result.get('emotion_score')}")
            
            return result
            
        except Exception as exc:
            logger.error(f"❌ [Analyze] Failed: {exc}")
            # 返回默认分析结果
            return {
                "summary": "无法完成态势分析，请手动调整参数。",
                "emotion_score": 0,
                "intent": "UNKNOWN",
                "strategy": "COMFORT",
                "confidence": 0.5,
                "burst_detected": is_burst,
                "pressure_level": pressure_level
            }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        retry=retry_if_exception_type((json.JSONDecodeError, ValidationError, Exception)),
        reraise=True,
    )
    async def execute_tactics(
        self, 
        user_input: str, 
        analysis: Dict[str, Any], 
        history: list = []
    ) -> Dict[str, Any]:
        """
        v8.0 Phase 2: 战术执行 (Tactical Execution)
        基于确定的战术策略生成回复选项
        
        Args:
            user_input: 对方原始消息
            analysis: 经用户确认/修改的战术分析 (SituationAnalysis)
            history: 历史对话上下文
            
        Returns:
            AdvisorResponse 的字典形式 (analysis, options)
        """
        self._refresh_config()
        
        # 1. 随机抽取风格
        selected_styles = get_random_styles(3)
        style_names = [s['name'] for s in selected_styles]
        logger.info(f"🎲 [Execute] Styles: {style_names} | Strategy: {analysis.get('strategy')}")
        
        # 2. 构建执行 Prompt
        system_prompt = build_execute_prompt(user_input, analysis, selected_styles, history)
        
        try:
            # 3. 调用 LLM 生成回复
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"基于{analysis.get('strategy')}策略，为以下消息生成3个回复选项：\n{user_input}"},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"},
            )
            
            raw_content = response.choices[0].message.content
            result = self._parse_response(raw_content)
            
            logger.success(f"✅ [Execute] Generated {len(result.get('options', []))} options")
            
            return result
            
        except Exception as exc:
            logger.error(f"❌ [Execute] Failed: {exc}")
            raise exc

    # ==================== 原有接口（保持兼容） ====================

    # v8.1: 战术意图到策略的映射
    INTENT_TO_STRATEGY = {
        "PRESSURE": "OFFENSIVE_FLIRT",   # 高压威慑 → 进攻调情
        "LURE": "DEFENSIVE_FLIRT",       # 示弱诱敌 → 防守调情
        "PROBE": "PUSH_PULL",            # 模糊试探 → 推拉战术
        "COMFORT": "COMFORT",            # 情绪安抚 → 安抚
    }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        retry=retry_if_exception_type((json.JSONDecodeError, ValidationError, Exception)),
        reraise=True,
    )
    async def generate_response_with_intent(
        self, 
        user_input: str, 
        history: list = [], 
        tactical_intent: str = None
    ) -> Dict[str, Any]:
        """
        v8.1「直出+热修」模式的生成接口
        
        Args:
            user_input: 对方发来的文本
            history: 历史对话记录
            tactical_intent: 用户指定的战术意图 (PRESSURE/LURE/PROBE/COMFORT)
            
        Returns:
            AdvisorResponse 的字典形式 (analysis, options)
        """
        self._refresh_config()
        
        # 1. 随机抽取 3 种风格
        selected_styles = get_random_styles(3)
        style_names = [s['name'] for s in selected_styles]
        
        intent_str = f" | Intent: {tactical_intent}" if tactical_intent else " | Auto"
        logger.info(f"🎲 [Generate] Styles: {style_names} | History: {len(history)}{intent_str}")
        
        # 2. 构建带记忆的 Prompt
        system_prompt = self._build_context_prompt(user_input, history, selected_styles)
        
        # 3. 如果有战术意图，添加战术指令
        if tactical_intent and tactical_intent in self.INTENT_TO_STRATEGY:
            strategy = self.INTENT_TO_STRATEGY[tactical_intent]
            intent_instructions = f"""

# 🎯 用户指定战术意图: {tactical_intent}
用户明确要求使用「{tactical_intent}」策略，请严格按照以下风格方向生成回复：

- PRESSURE (高压威慑): 回复要强势、主导、带有轻微压迫感，让对方感受到你的气场
- LURE (示弱诱敌): 回复要撒娇、示弱、卖萌，引发对方的保护欲和心软
- PROBE (模糊试探): 回复要含糊、话里有话、不正面回应，让对方猜测你的真实意图
- COMFORT (情绪安抚): 回复要共情、理解、温柔陪伴，让对方感受到被接纳和支持

当前策略: {tactical_intent}
所有3个选项都应该符合这个战术方向，但保持风格差异。
"""
            system_prompt += intent_instructions
        
        logger.info(f"⚡ [Request] Input: {user_input[:30]}...")

        try:
            # 4. 调用 LLM
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"对方最新消息：{user_input}"},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"},
            )

            raw_content = response.choices[0].message.content
            
            # 5. 解析结果
            result = self._parse_response(raw_content)
            
            logger.success(f"✅ [LLM] Generation successful | Options: {len(result.get('options', []))}")
            
            return result
            
        except Exception as exc:
            logger.error(f"❌ [LLM] Failed: {exc}")
            raise exc

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