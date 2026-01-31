"""
Vision Service - v10.0 视觉智能模块
实现截图 -> 情报解析 -> 战术建议的完整流程
"""
import base64
import json
import os
import time
from typing import Optional

from dotenv import load_dotenv
from loguru import logger
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_fixed

from models.schemas import VisionIntelligence, VisionBubble


class VisionService:
    """
    视觉智能服务 - 支持多种 VLM 后端
    
    支持的模型:
    - Qwen-VL-Max (通义千问视觉版) - 推荐
    - GPT-4V (OpenAI)
    - 本地 OCR fallback (PaddleOCR)
    """
    
    def __init__(self) -> None:
        logger.info("👁️ [VisionService] Initializing Tactical Vision v10.0...")
        self._refresh_config()
    
    def _refresh_config(self) -> None:
        """加载视觉模型配置"""
        load_dotenv(override=True)
        
        # 优先使用专门的视觉 API，否则复用主 API
        self.api_key = os.getenv("VISION_API_KEY") or os.getenv("SILICONFLOW_API_KEY", "")
        self.base_url = os.getenv("VISION_BASE_URL", "https://api.siliconflow.cn/v1")
        
        # 视觉模型配置 - 推荐 Qwen-VL
        self.model = os.getenv("VISION_MODEL", "Qwen/Qwen2-VL-72B-Instruct")
        self.max_tokens = int(os.getenv("VISION_MAX_TOKENS", "2048"))
        self.temperature = float(os.getenv("VISION_TEMPERATURE", "0.7"))
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )
        
        logger.success(f"✅ [VisionConfig] Model: {self.model}")
    
    def _build_vision_prompt(self) -> str:
        """构建视觉分析系统提示词"""
        return """你是一个专业的恋爱战术分析AI，代号「战术目视」。
你的任务是分析聊天记录截图，提取关键情报并给出战术建议。

## 分析要求
1. **识别对话双方**: 右边/下方通常是"我"（主角），左边/上方是"对方"
2. **提取对话内容**: 按时间顺序列出每条消息
3. **情绪分析**: 判断对方当前的情绪状态
4. **潜台词解读**: 分析对方话语背后的真实意图
5. **战术建议**: 给出简短的应对策略

## 输出格式 (严格JSON)
```json
{
    "summary": "一句话总结当前局势，如：对方在撒娇求关注",
    "bubbles": [
        {"text": "对话内容", "is_me": false, "confidence": 0.95},
        {"text": "我的回复", "is_me": true, "confidence": 0.90}
    ],
    "emotion_detected": "撒娇/生气/开心/冷淡/期待/...",
    "emotion_score": 1,
    "context_hint": "对方可能在试探你的底线",
    "tactical_suggestion": "建议采用推拉战术，先示弱再反击",
    "confidence": 0.85
}
```

## 情绪评分标准
- -3: 暴怒/厌恶，关系危机
- -2: 生气/不满
- -1: 轻微不悦/冷淡
-  0: 中性/日常
- +1: 轻微好感/有兴趣
- +2: 开心/喜欢
- +3: 心动/明确表达爱意

## 重要提醒
- 如果图片模糊或无法识别，在 summary 中说明
- 保持分析客观，不要过度解读
- 气泡按从上到下的时间顺序排列"""

    @retry(stop=stop_after_attempt(2), wait=wait_fixed(1))
    async def analyze_screenshot(
        self, 
        image_base64: str, 
        hint: Optional[str] = None
    ) -> tuple[VisionIntelligence, str, int]:
        """
        分析截图并提取情报
        
        Args:
            image_base64: Base64 编码的图片
            hint: 用户补充提示
            
        Returns:
            (VisionIntelligence, raw_text, analysis_time_ms)
        """
        start_time = time.perf_counter()
        
        # 构建用户消息
        user_content = []
        
        # 添加图片
        # 处理可能的 data URI 前缀
        if image_base64.startswith("data:"):
            image_url = image_base64
        else:
            image_url = f"data:image/png;base64,{image_base64}"
        
        user_content.append({
            "type": "image_url",
            "image_url": {"url": image_url}
        })
        
        # 添加文字提示
        text_prompt = "请分析这张聊天记录截图。"
        if hint:
            text_prompt += f"\n用户补充信息: {hint}"
        
        user_content.append({
            "type": "text",
            "text": text_prompt
        })
        
        try:
            logger.info(f"👁️ [Vision] Analyzing screenshot... (hint: {hint or 'none'})")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._build_vision_prompt()},
                    {"role": "user", "content": user_content}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            raw_content = response.choices[0].message.content or ""
            analysis_time_ms = int((time.perf_counter() - start_time) * 1000)
            
            logger.debug(f"📝 [Vision] Raw response: {raw_content[:200]}...")
            
            # 解析 JSON 响应
            intelligence = self._parse_vision_response(raw_content)
            
            return intelligence, raw_content, analysis_time_ms
            
        except Exception as e:
            logger.error(f"❌ [Vision] Analysis failed: {e}")
            analysis_time_ms = int((time.perf_counter() - start_time) * 1000)
            
            # 返回默认响应
            return VisionIntelligence(
                summary="视觉分析模块暂时离线，请手动输入对话内容。",
                bubbles=[],
                emotion_detected="未知",
                emotion_score=0,
                context_hint="",
                tactical_suggestion="建议手动补充对话内容后重试",
                confidence=0.0
            ), str(e), analysis_time_ms
    
    def _parse_vision_response(self, raw_content: str) -> VisionIntelligence:
        """解析 VLM 返回的 JSON 响应"""
        # 清理 Markdown 代码块
        clean_content = raw_content
        if "```json" in clean_content:
            clean_content = clean_content.split("```json")[1].split("```")[0]
        elif "```" in clean_content:
            clean_content = clean_content.split("```")[1].split("```")[0]
        
        clean_content = clean_content.strip()
        
        try:
            data = json.loads(clean_content)
            
            # 转换 bubbles
            bubbles = []
            for b in data.get("bubbles", []):
                bubbles.append(VisionBubble(
                    text=b.get("text", ""),
                    is_me=b.get("is_me", False),
                    confidence=b.get("confidence", 0.9)
                ))
            
            return VisionIntelligence(
                summary=data.get("summary", "无法解析截图内容"),
                bubbles=bubbles,
                emotion_detected=data.get("emotion_detected", "未知"),
                emotion_score=data.get("emotion_score", 0),
                context_hint=data.get("context_hint", ""),
                tactical_suggestion=data.get("tactical_suggestion", ""),
                confidence=data.get("confidence", 0.5)
            )
            
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ [Vision] JSON parse failed, using fallback: {e}")
            
            # 尝试从原始文本中提取信息
            return VisionIntelligence(
                summary=raw_content[:200] if raw_content else "分析失败",
                bubbles=[],
                emotion_detected="未知",
                emotion_score=0,
                context_hint="JSON解析失败，显示原始响应",
                tactical_suggestion="",
                confidence=0.3
            )


# 单例实例
vision_service = VisionService()
