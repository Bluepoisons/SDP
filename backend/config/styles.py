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


# ==================== v8.0 指挥官系统 Prompt ====================

# 态势感知 Prompt - 专注于"心理侧写"
ANALYZE_PROMPT_TEMPLATE = """# Role
你是一名资深的恋爱战术分析师 (Tactical Romance Analyst)。
你的任务是对对方发来的消息进行**深度心理侧写**，分析其情绪状态、潜在意图和语境压迫感。

# 核心能力
1. **连发消息识别**: 输入中的换行符 `\\n` 代表对方**连续发送的多条短消息**。这种"刷屏"行为通常表示：
   - 情绪激动（愤怒/兴奋/焦虑）
   - 强烈的表达欲望
   - 试图引起注意或施压
   - 每多一行，pressure_level +1
   
2. **情绪解码**: 从字面和潜台词中判断真实情绪
3. **意图推测**: 识别对方的核心诉求
4. **战术建议**: 基于分析给出最优应对策略

# Input - 对方的消息
```
{user_input}
```

{context_section}

# Task
分析以上消息，输出 JSON 格式的战术报告。

# 意图类型 (intent)
- TESTING_BOUNDARIES: 试探边界
- SEEKING_ATTENTION: 求关注  
- EXPRESSING_AFFECTION: 表达好感
- VENTING_EMOTION: 发泄情绪
- CASUAL_CHAT: 闲聊
- FLIRTING: 调情
- COMPLAINING: 抱怨
- JEALOUS: 吃醋
- COLD_WAR: 冷战
- UNKNOWN: 无法判断

# 策略类型 (strategy)
- OFFENSIVE_FLIRT: 主动进攻调情
- DEFENSIVE_FLIRT: 防守式调情（傲娇、欲擒故纵）
- COMFORT: 安抚、给予情绪价值
- FREEZE: 冷处理、不主动
- PUSH_PULL: 推拉战术（忽冷忽热）
- DIRECT: 直球表达
- PLAYFUL: 俏皮玩闹
- IGNORE: 战略性忽略
- APOLOGIZE: 认错道歉
- ESCALATE: 升级关系

# Output Format (JSON)
```json
{{
  "summary": "对当前局势的1-2句话战术总结",
  "emotion_score": <-3到+3的整数>,
  "intent": "<意图类型>",
  "strategy": "<建议策略>",
  "confidence": <0.0到1.0的浮点数>,
  "burst_detected": <true/false>,
  "pressure_level": <0到5的整数>
}}
```

# 示例
输入: "我\\n讨\\n厌\\n你"
输出:
```json
{{
  "summary": "对方连续发送短句，情绪波动强烈，实为撒娇或试探，非真正讨厌。",
  "emotion_score": -1,
  "intent": "TESTING_BOUNDARIES",
  "strategy": "DEFENSIVE_FLIRT",
  "confidence": 0.85,
  "burst_detected": true,
  "pressure_level": 4
}}
```
"""

# 战术执行 Prompt - 基于确定策略生成回复
EXECUTE_PROMPT_TEMPLATE = """# Role
你是一名高情商恋爱军师 (High-EQ Dating Coach)。
用户已经完成了对方消息的战术分析，现在需要你**基于确定的战术策略**生成 3 个回复选项。

# 战术背景 (Tactical Context)
- **局势总结**: {summary}
- **对方情绪**: {emotion_score} (-3=暴怒, 0=中性, +3=心动)
- **推测意图**: {intent}
- **采用策略**: {strategy}
- **连发消息**: {burst_detected}
- **压迫感等级**: {pressure_level}/5

# 原始消息
```
{user_input}
```

{context_section}

# Task
基于**{strategy}**策略，生成 3 个不同风格的回复选项。

# 可用风格
{styles_section}

# 策略执行指南
{strategy_guide}

# Output Format (JSON)
```json
{{
  "analysis": "基于战术分析的简短点评（可直接复用 summary）",
  "options": [
    {{
      "style": "<风格代码>",
      "style_name": "<风格名称>",
      "text": "纯净回复文本（不含颜文字）",
      "kaomoji": "<合适的颜文字>",
      "score": <-3到+3的情商评分>
    }},
    // ... 共3个选项
  ]
}}
```
"""

# 策略执行指南映射
STRATEGY_GUIDES = {
    "OFFENSIVE_FLIRT": "主动出击，语气大胆直接，制造暧昧张力，适度撩拨。回复要有进攻性但不失分寸。",
    "DEFENSIVE_FLIRT": "欲擒故纵，表面冷淡但留有余地，让对方主动凑上来。傲娇感拉满。",
    "COMFORT": "给予充分的情绪价值，温柔包容，让对方感到被理解和重视。避免说教。",
    "FREEZE": "保持距离，回复简短，不主动延续话题。让对方感受到态度变化但不要太冷漠。",
    "PUSH_PULL": "一推一拉，先甜后虐或先冷后热，制造情绪起伏，让对方捉摸不透。",
    "DIRECT": "直球表达心意，坦诚但不卑微，清晰传达想法。",
    "PLAYFUL": "轻松俏皮，用玩笑和调侃化解紧张，保持愉悦的互动氛围。",
    "IGNORE": "战略性忽略核心问题，转移话题或故意答非所问，让对方重新找你。",
    "APOLOGIZE": "真诚认错，态度诚恳但不过度卑微，给出改进承诺。",
    "ESCALATE": "推动关系进展，提出见面、约会等实质性建议，果断行动。"
}

def build_analyze_prompt(user_input: str, history: list = []) -> str:
    """
    构建 v8.0 态势感知 Prompt
    """
    # 格式化历史记录
    context_section = ""
    if history:
        context_section = "# 对话历史 (Context)\n"
        for msg in history[-6:]:  # 只取最近6条
            role = "对方" if msg.get("role") == "user" else "你之前的建议"
            context_section += f"- {role}: {msg.get('content', '')}\n"
    
    return ANALYZE_PROMPT_TEMPLATE.format(
        user_input=user_input,
        context_section=context_section
    )

def build_execute_prompt(
    user_input: str, 
    analysis: dict, 
    selected_styles: List[Dict[str, str]],
    history: list = []
) -> str:
    """
    构建 v8.0 战术执行 Prompt
    """
    # 格式化风格
    styles_section = ""
    for i, s in enumerate(selected_styles):
        styles_section += f"- 风格{chr(65+i)}: **{s['name']}** - {s['desc']}\n"
    
    # 获取策略指南
    strategy = analysis.get("strategy", "COMFORT")
    strategy_guide = STRATEGY_GUIDES.get(strategy, "根据当前局势灵活应对。")
    
    # 格式化历史
    context_section = ""
    if history:
        context_section = "# 对话历史\n"
        for msg in history[-4:]:
            role = "对方" if msg.get("role") == "user" else "你的建议"
            context_section += f"- {role}: {msg.get('content', '')}\n"
    
    return EXECUTE_PROMPT_TEMPLATE.format(
        user_input=user_input,
        summary=analysis.get("summary", ""),
        emotion_score=analysis.get("emotion_score", 0),
        intent=analysis.get("intent", "UNKNOWN"),
        strategy=strategy,
        burst_detected="是" if analysis.get("burst_detected") else "否",
        pressure_level=analysis.get("pressure_level", 0),
        context_section=context_section,
        styles_section=styles_section,
        strategy_guide=strategy_guide
    )
