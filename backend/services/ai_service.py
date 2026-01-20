import os
import re
import json
import httpx  # 需要 pip install httpx
from dotenv import load_dotenv
from typing import List, Dict, Any
from models.schemas import DialogOutput
from services.db_service import db_service

class AIService:
    def __init__(self):
        self.base_url = "https://api.siliconflow.cn/v1"
        self._refresh_config()

    def _refresh_config(self):
        load_dotenv(override=True)
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        self.model = os.getenv("AI_MODEL", "deepseek-ai/DeepSeek-V3")
        # 适当增加 token 以允许 AI 进行更深的思考
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "800"))
        self.timeout = float(os.getenv("AI_TIMEOUT", "60.0"))
        self.timeout_read = float(os.getenv("AI_TIMEOUT_READ", str(self.timeout)))
        self.timeout_connect = float(os.getenv("AI_TIMEOUT_CONNECT", "10.0"))
        self.max_retries = int(os.getenv("AI_MAX_RETRIES", "2"))
        self.history_limit = int(os.getenv("AI_HISTORY_LIMIT", "10")) # 增加历史记录长度

    def build_prompt(self, scene: str, user_style: str = "neutral", history: List[Dict] = []) -> str:
        # 1. 历史记录处理：保留对话流，不仅仅是文本
        safe_history = history[-self.history_limit :] if history else []
        history_context = ""
        if safe_history:
            history_lines = []
            for h in safe_history:
                role = "玩家" if h.get('role') == 'user' else "攻略对象"
                history_lines.append(f"- {role}: {h.get('content')}")
            history_str = "\n".join(history_lines)
            history_context = f"""
【前情提要】
(AI需理解以下对话的流动，捕捉双方关系的变化，如暧昧、冷战、初识等)
{history_str}
"""
        else:
            history_context = "【前情提要】：初次见面 / 新的对话开始"

        # 2. 核心 Prompt：Galgame 专用逻辑
        return f"""
你是由顶尖视觉小说家调教的【Galgame 剧情引擎】。你的任务是根据玩家输入，生成推动剧情发展的三个分支选项。

{history_context}

【当前玩家输入】
“{scene}”

【思维链 (Chain of Thought)】
在生成选项前，请先在内心快速分析：
1. **潜台词识别**：玩家这句话表面是什么？实际想表达什么？（是试探、挑逗、还是拒绝？）
2. **关系定位**：当前好感度阶段是（陌生 -> 熟悉 -> 暧昧 -> 恋人）？
3. **预期反应**：针对玩家输入，设计三种截然不同的回应策略。

【思维链要求 (Chain of Thought)】
在生成最终 JSON 之前，请先在内心进行三步推演：
1. **情感侦测**：分析用户输入的微表情和潜台词（是试探、撒娇还是冷战？）。
2. **关系定位**：判断当前好感度阶段（陌生/暧昧/热恋）。
3. **策略制定**：针对 Romantic/Humorous/Cold 三个方向分别制定攻势。

(注意：虽然你要进行这些思考，但为了接口格式，请不要输出思考过程，直接输出最终的 JSON 结果)

【选项生成规则 (必须严格遵守)】
请生成 A、B、C 三个选项，分别对应以下三种【人设/策略】：

- **选项 A (Type: romantic/进攻)**: 
  定义：直球进攻、深情撩拨、或是温柔包容。
  目标：瞬间拉近距离，让对方脸红心跳。
  *关键词：宠溺、直白、心动、高情商*

- **选项 B (Type: humorous/破冰)**: 
  定义：幽默玩梗、调皮捉弄、或是用玩笑化解尴尬。
  目标：活跃气氛，展示有趣的灵魂。
  *关键词：机智、傲娇、反差萌、玩世不恭*

- **选项 C (Type: cold/欲擒故纵)**: 
  定义：保持神秘、冷静分析、或是略带攻击性的质疑。
  目标：通过推拉建立心理优势，激起对方征服欲。
  *关键词：高冷、毒舌、理性、克制*

【场景侧写要求】
- 生成一段 30-50 字的【场景旁白】，描述对方微表情、空气中的暧昧流动或心理活动。
- 结尾必须带有一个符合当前氛围的颜文字。

【输出格式】
只输出 JSON，不要 Markdown 标记。格式如下：
{{
  "sceneSummary": "对方微微一怔，耳根泛起不易察觉的红晕... (oﾟvﾟ)ノ",
  "options": [
     {{ "id": "A", "text": "（回复内容）", "style": "romantic" }},
     {{ "id": "B", "text": "（回复内容）", "style": "humorous" }},
     {{ "id": "C", "text": "（回复内容）", "style": "cold" }}
  ]
}}
"""

    # 改为 async 方法，提高并发性能
    async def generate_dialog_options(self, scene: str, user_style: str = "neutral", history: List[Dict] = [], user_id: str = "", regenerate_id: str | None = None) -> Dict[str, Any]:
        self._refresh_config()
        
        # 注入用户偏好
        preferred_styles = db_service.get_user_top_styles(user_id) if user_id else []
        style_instruction = ""
        if preferred_styles:
            style_instruction = f"注意：该玩家倾向于选择 {', '.join(preferred_styles)} 风格的选项，请在对应风格上增加吸引力。"

        messages = [
            {
                "role": "system",
                "content": f"你是一个沉浸式 Galgame 剧本生成器。请严格遵循 JSON 格式输出。{style_instruction}"
            },
            {
                "role": "user",
                "content": self.build_prompt(scene, user_style, history)
            }
        ]

        temperature = 1.1 + (0.15 if regenerate_id else 0.0)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": min(1.5, temperature),  # 提高温度以增加创造性和人味
            "top_p": 0.95,
            "max_tokens": self.max_tokens,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "dialog_output",
                    "schema": DialogOutput.schema()
                }
            }
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # 使用 httpx 进行异步请求
        timeout = httpx.Timeout(
            connect=self.timeout_connect,
            read=self.timeout_read,
            write=10.0,
            pool=10.0,
        )
        async with httpx.AsyncClient(timeout=timeout) as client:
            last_error_message = ""
            last_error_type = "unknown"
            for attempt in range(1, self.max_retries + 2):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()

                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # 容错处理：移除可能的 Markdown 标记
                    content = re.sub(r'^```json\s*', '', content)
                    content = re.sub(r'\s*```$', '', content)

                    return DialogOutput.parse_raw(content).dict()

                except httpx.TimeoutException as exc:
                    last_error_type = "timeout"
                    last_error_message = f"请求超时（>{self.timeout:.0f}s）"
                    print(f"请求超时 ({attempt}): {exc}")
                except httpx.RequestError as exc:
                    last_error_type = "network"
                    last_error_message = "网络请求异常"
                    print(f"请求异常 ({attempt}): {exc}")
                except httpx.HTTPStatusError as exc:
                    last_error_type = "http"
                    last_error_message = f"API 错误 ({exc.response.status_code})"
                    print(f"API 错误 ({attempt}): {exc.response.status_code}")
                except Exception as e:
                    last_error_type = "unknown"
                    last_error_message = "未知错误"
                    print(f"Attempt {attempt} failed: {str(e)}")
        
        # 兜底返回
        return {
            "options": [
                {"id": "A", "text": "系统正在重新连接命运线...", "style": "neutral"},
                {"id": "B", "text": "AI 思维殿堂暂时关闭...", "style": "neutral"},
                {"id": "C", "text": "请稍后再试...", "style": "neutral"}
            ],
            "sceneSummary": "（系统连接超时，请检查网络或 API 配置） (xp_x)",
            "error": last_error_message or "生成失败",
            "errorType": last_error_type
        }

ai_service = AIService()