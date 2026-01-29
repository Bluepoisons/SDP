import asyncio
import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from schemas import GameResponse

class AIService:
    # Style Personality Guide for Prompt Engineering
    STYLE_GUIDE = {
        "TSUNDERE": {
            "personality": "傲娇 (Tsundere): 内心想关心对方，但嘴上必须拒绝或嘲讽。不坦率，容易害羞后生气。",
            "kaomoji": "(￣^￣), (⁄ ⁄•⁄ω⁄•⁄ ⁄), (｀ε´), (｡•ˇ‸ˇ•｡)",
            "inner_voice": "内心常常挣扎于'想帮忙但不想显得在意'，会在心里吐槽自己或对方。"
        },
        "YANDERE": {
            "personality": "病娇 (Yandere): 表面温柔体贴，内心充满极端的占有欲和嫉妒。爱意扭曲，透着危险的气息。",
            "kaomoji": "(♡_♡), (..•˘_˘•..), (◕‿◕), (◉_◉)",
            "inner_voice": "内心充满对玩家的执念，会计算如何让对方永远留在身边，思维略带偏执。"
        },
        "KUUDERE": {
            "personality": "三无 (Kuudere): 外表冷淡无表情，说话简短毒舌，内心其实极其理性且偶尔关心对方。",
            "kaomoji": "(._.), (ー_ー), (¬_¬), ( ̄ー ̄)",
            "inner_voice": "内心以极其理性的方式分析局势，偶尔会冒出'真是麻烦'或'为什么要在意这种事'的吐槽。"
        },
        "GENKI": {
            "personality": "元气 (Genki): 充满活力和好奇心，把一切当作冒险，说话带感叹号，情绪外放。",
            "kaomoji": "(≧∇≦)/, (☆▽☆), (^▽^), ヾ(≧▽≦*)o",
            "inner_voice": "内心也保持高能量，会把现状脑补成冒险剧情，对一切都充满期待。"
        }
    }

    def __init__(self) -> None:
        self._refresh_config()

    def _refresh_config(self) -> None:
        load_dotenv(override=True)
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        self.model = os.getenv("AI_MODEL", "Qwen/Qwen2.5-72B-Instruct")
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "2048"))
        self.temperature = float(os.getenv("AI_TEMPERATURE", "0.85"))
        self.client = OpenAI(api_key=self.api_key, base_url="https://api.siliconflow.cn/v1")

    def _parse_response(self, raw_content: str) -> Dict[str, Any]:
        clean_content = raw_content.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_content)
        validated = GameResponse(**data)
        return validated.model_dump()

    def _build_system_prompt(self, style: str) -> str:
        """构建结构化的 System Prompt，根据 style 动态注入人设。"""
        style_info = self.STYLE_GUIDE.get(style, self.STYLE_GUIDE["TSUNDERE"])
        
        prompt = f"""# Role Definition
You are a **Galgame Engine** designed to generate immersive dialogue with distinct personality traits.

# Current Character Style
**{style_info['personality']}**

**Recommended Kaomoji**: {style_info['kaomoji']}

**Inner Voice Characteristics**: {style_info['inner_voice']}

# Output Requirements
You **MUST** return a JSON object with the following structure:

```json
{{
  "summary": "<角色的内心独白/心理活动>（禁止使用颜文字，语气符合内心人设，可以是吐槽、分析或情绪波动）",
  "text": "<角色实际说出口的话>（必须包含大量符合人设的颜文字 Kaomoji，体现外在表现）",
  "mood": "<情绪标签: angry/shy/happy/dark/neutral/excited/love>",
  "scene": "<当前场景的简短描述，如'夕阳下的教室'、'深夜的图书馆'等>",
  "options": ["<选项1>", "<选项2>", "<选项3>"]
}}
```

# Field Explanation
1. **summary**: 角色的真实心理活动，**不对外显示**，玩家只能"窥探"到内心想法。必须符合人设的内在逻辑（如傲娇的矛盾、病娇的执念、三无的冷静分析、元气的脑补剧情）。
2. **text**: 角色实际说出的话，**对玩家展示**。必须使用颜文字强化情感表达，体现人设的外在行为。
3. **mood**: 当前情绪状态，用于 UI 渲染。
4. **scene**: 场景描述，用于氛围营造。
5. **options**: 给玩家的 3 个互动选项，符合当前剧情走向。

# Critical Constraints
- **summary** 字段：禁止颜文字，语气冷静或符合内心人设的吐槽/分析。
- **text** 字段：必须包含至少 2 个符合人设的颜文字。
- **Output Format**: 严格遵守 JSON 格式，不要添加任何 Markdown 代码块标记。
- **Language**: 全部使用中文回复（除 JSON 字段名）。
"""
        return prompt

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
        retry=retry_if_exception_type((json.JSONDecodeError, ValidationError, Exception)),
        reraise=True,
    )
    async def generate_response(self, user_input: str, style: str) -> Dict[str, Any]:
        """生成 AI 响应，使用高级提示工程确保 summary 和 text 的严格区分。"""
        self._refresh_config()
        system_prompt = self._build_system_prompt(style)

        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
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
            return self._parse_response(raw_content)
        except Exception as exc:
            raise exc

ai_service = AIService()