import os
import requests
import json
import re
from typing import List, Dict, Any

class AIService:
    def __init__(self):
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        self.base_url = "https://api.siliconflow.cn/v1"
        self.model = os.getenv("AI_MODEL", "deepseek-ai/DeepSeek-V3")

    def build_prompt(self, scene: str, user_style: str = "neutral", history: List[Dict] = []) -> str:
        history_context = ""
        if history:
            history_str = "\n".join([f"{'对方' if h.get('role') == 'user' else '我'}: {h.get('content')}" for h in history])
            history_context = f"【参考历史对话】（仅供参考，请勿针对历史内容回应）：\n{history_str}"
        else:
            history_context = "【参考历史对话】：无"

        return f"""你是顶级情商的恋爱Galgame编剧。
⚠️ **重要指令**：请忽略历史对话中的具体事件，**仅针对**以下【当前用户输入】生成3个回应选项。

【当前用户输入】(这是你需要回应的核心内容！)
"{scene}"

{history_context}

【核心指令】
1. **场景侧写（两段式）**：
   - 第一段（情境分析）：一针见血地分析【当前用户输入】的潜台词与社交张力（30字内）。
   - 第二段（选择预告）：必须以“此刻，你的回应将定义...”开头。
   - 结尾必须带一个氛围颜文字。
2. **强制颜文字库**（必须从以下对应风格中选取，严禁使用图形Emoji）：
   - [积极/热情]: (๑•̀ㅂ•́)و✧ (≧∇≦)ﾉ o(≧口≦)o (★^O^★) (ง •_•)ง (｡◕‿◕｡)
   - [幽默/调侃]: (￣▽￣*) (ノ￣▽￣) (´･ω･) (≧∇≦)/ (o^ω^o) (￣ω￣)
   - [高冷/理智]: (ー_ー゛) (→_→) (´-ω-｀) (￣ヘ￣) (눈_눈) (¬_¬)
3. **角色身份标签**（必须严格使用以下3个固定标签）：
   - 选项A -> 标签：【积极热情】（温暖、主动、支持性的回应）
   - 选项B -> 标签：【幽默调侃】（轻松、俏皮、化解尴尬）
   - 选项C -> 标签：【高冷理智】（冷静、客观、保持距离）

【输出格式要求】
请直接返回一个 JSON 对象，不要包含 Markdown 代码块标记（如 ```json）。格式如下：
{{
  "sceneSummary": "场景侧写内容...",
  "options": [
    "选项A的内容...",
    "选项B的内容...",
    "选项C的内容..."
  ]
}}
"""

    def generate_dialog_options(self, scene: str, user_style: str = "neutral", history: List[Dict] = []) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = [
            {
                "role": "system",
                "content": "你是一个专业的对话选项生成器，专门为角色扮演游戏生成多样化的对话选择。请只输出 JSON。"
            },
            {
                "role": "user",
                "content": self.build_prompt(scene, user_style, history)
            }
        ]
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.8,
            "max_tokens": 800,
            "response_format": {"type": "json_object"}
        }
        
        try: 
            print(f"Sending request to SiliconFlow: model={self.model}")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                print(f"API Error: {response.status_code} - {response.text}")
            
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Clean up content if it contains markdown code blocks
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                return {
                    "options": ["解析失败", "解析失败", "解析失败"],
                    "sceneSummary": f"JSON解析失败: {content[:100]}..."
                }
                
        except Exception as e:
            print(f"Error calling AI service: {e}")
            return {
                "options": ["API调用错误", "请检查网络", "或API Key"],
                "sceneSummary": str(e)
            }

ai_service = AIService()
