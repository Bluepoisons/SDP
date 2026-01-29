"""
backend/config/styles.py
Galgame 风格配置与 Prompt 模板管理 - 恋爱军师版
"""
import random
from typing import List, Dict

# ==================== 风格定义 ====================
# 定义新的5种风格池
REPLY_STYLES = {
    "COLD": {
        "name": "高冷",
        "description": "冷漠、话少、惜字如金，看似不在意实则拿捏对方，颜文字使用克制。"
    },
    "TSUNDERE": {
        "name": "傲娇",
        "description": "口是心非，嘴上嫌弃但内容透着关心，容易害羞炸毛，常用 (￣^￣) 等颜文字。"
    },
    "GENKI": {
        "name": "元气",
        "description": "热情洋溢，充满活力，全是感叹号，极易调动情绪，常用 (≧∇≦)/ 等颜文字。"
    },
    "FLATTERING": {
        "name": "谄媚",
        "description": "俗称'舔狗'模式，极度顺从，疯狂提供情绪价值，放低姿态，常用 🥺 等颜文字。"
    },
    "CHUNIBYO": {
        "name": "中二",
        "description": "沉浸在幻想世界，说话带魔幻设定（契约/封印/魔力），让人不明觉厉。"
    }
}

# ==================== Prompt 模板 ====================
# 恋爱军师专用 Prompt
# 设计思路：
# 1. Role: 设定为高情商恋爱专家。
# 2. Input: 对方的一句话。
# 3. Task: 先分析，再生成。
# 4. Output: 强制 JSON 格式，包含 score 评分系统。

ADVISOR_PROMPT_TEMPLATE = """# Role
You are a high-EQ communication assistant and dating coach (AI恋爱军师).
Your goal is to help the user reply to a message from another person to achieve specific emotional effects.

# Input - The Other Person's Message
"{user_input}"

# Task
1. **Analyze**: Briefly analyze the other person's intent and emotion in the `analysis` field.
2. **Select Styles**: I have randomly selected 3 styles for you to generate replies for:
   - Style A: {style1_name} ({style1_desc})
   - Style B: {style2_name} ({style2_desc})
   - Style C: {style3_name} ({style3_desc})
3. **Generate Options**: Generate ONE reply for EACH of the 3 styles.

# Requirements for Each Option
- **text**: The pure reply text **WITHOUT** Kaomoji. Keep it clean and readable.
- **kaomoji**: A single, expressive Kaomoji that fits the style (e.g. "(˘³˘)♥" for romantic, "(￣^￣)" for tsundere).
- **Tone**: Strictly follow the assigned style persona.
- **Favorability/EQ Score**: Rate the "Emotional Intelligence (EQ)" or potential "Favorability Impact" of this reply from **-3 to 3**.
   - **+3**: Perfect high EQ response, makes the other person feel loved/valued.
   - **+2**: Strong positive impact, warm and charming.
   - **+1/0**: Neutral or standard response.
   - **-1**: Slightly awkward or low EQ.
   - **-2**: Awkward, cringe, or insensitive.
   - **-3**: Disaster, relationship-damaging (e.g. extreme coldness or confusing chunibyo).

# Output Format (JSON Only)
You must return a valid JSON object:
```json
{{
  "analysis": "Brief analysis of the situation (e.g., '对方在撒娇', '对方有点生气了')...",
  "options": [
    {{
      "style": "{style1_key}",
      "style_name": "{style1_name}",
      "text": "其实...我也不是特意等你的啦",
      "kaomoji": "(⁄ ⁄•⁄ω⁄•⁄ ⁄)",
      "score": 2
    }},
    {{
      "style": "{style2_key}",
      "style_name": "{style2_name}",
      "text": "Reply text WITHOUT kaomoji",
      "kaomoji": "(˘³˘)♥",
      "score": <integer between -3 and 3>
    }},
    {{
      "style": "{style3_key}",
      "style_name": "{style3_name}",
      "text": "Pure text reply",
      "kaomoji": "(≧∇≦)/",
      "score": <integer>
    }}
  ]
}}
```
"""

def get_random_styles(count: int = 3) -> List[Dict[str, str]]:
    """
    从风格池中随机抽取指定数量的风格
    """
    keys = list(REPLY_STYLES.keys())
    # 确保不重复抽取
    selected_keys = random.sample(keys, min(count, len(keys)))
    
    return [
        {
            "key": k, 
            "name": REPLY_STYLES[k]["name"], 
            "desc": REPLY_STYLES[k]["description"]
        }
        for k in selected_keys
    ]

def build_advisor_prompt(user_input: str, selected_styles: List[Dict[str, str]]) -> str:
    """
    构建完整的 Prompt 字符串
    """
    # 确保有3个风格，不够的逻辑上应该在调用前处理好，这里直接解包
    s1, s2, s3 = selected_styles[0], selected_styles[1], selected_styles[2]
    
    return ADVISOR_PROMPT_TEMPLATE.format(
        user_input=user_input,
        style1_key=s1["key"], style1_name=s1["name"], style1_desc=s1["desc"],
        style2_key=s2["key"], style2_name=s2["name"], style2_desc=s2["desc"],
        style3_key=s3["key"], style3_name=s3["name"], style3_desc=s3["desc"],
    )
