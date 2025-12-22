const axios = require('axios');

class AIService {
  constructor() {
    // 硅基流动API配置
    this.API_KEY = process.env.SILICONFLOW_API_KEY || '';
    this.BASE_URL = 'https://api.siliconflow.cn/v1';
    this.MODEL = process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3'; // 免费模型，可更换为其他模型
    
    console.log('🤖 初始化硅基流动AI服务，模型:', this.MODEL);
  }

  /**
   * 生成对话选项 - 硅基流动API版本
   * @param {string} scene 对话场景
   * @param {string} userStyle 用户风格偏好
   * @param {Array} history 历史对话
   */
  async generateDialogOptions(scene, userStyle = 'neutral', history = []) {
    try {
      // 构建符合硅基流动格式的请求
      const messages = [
        {
          role: "system",
          content: "你是一个专业的对话选项生成器，专门为角色扮演游戏生成多样化的对话选择。"
        },
        {
          role: "user",
          content: this.buildPrompt(scene, userStyle, history)
        }
      ];

      const response = await axios.post(
        `${this.BASE_URL}/chat/completions`,
        {
          model: this.MODEL,
          messages: messages,
          temperature: 0.8,
          max_tokens: 800,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );

      // 解析AI响应
      const aiResponse = response.data.choices[0].message.content;
      const options = this.parseAIResponse(aiResponse);
      
      console.log(`✅ 硅基流动API调用成功，生成${options.length}个选项`);
      return options;

    } catch (error) {
      console.error('❌ 硅基流动API调用失败:', error.message);
      if (error.response) {
        console.error('   状态码:', error.response.status);
        console.error('   响应数据:', JSON.stringify(error.response.data));
      }
      
      // 返回降级选项
      return this.getFallbackOptions(scene, userStyle);
    }
  }

  /**
   * 构建提示词（保持原有逻辑，适配硅基流动）
   */
  buildPrompt(scene, userStyle, history) {
    return `你是一个对话选项生成器，专门用于生成角色扮演游戏的对话选项。

当前场景：${scene}

任务：
请生成5个不同的对话选项（A-E），每个选项应该：

1. 符合不同的性格风格：
   - A选项：爽快答应型（热心帮助）
   - B选项：幽默接梗型（轻松幽默）
   - C选项：假装要挟型（戏谑玩笑）
   - D选项：冷漠拆台型（冷淡吐槽）
   - E选项：傲娇责备型（口嫌体正直）

2. 每个选项包含：
   - 选项标签（A/B/C/D/E）
   - 具体的对话文本（口语化，符合角色性格）
   - 用括号标注（风格标签）
   - 用箭头→标注可能的结果影响
   - 最后加一个相关emoji

3. 整体风格倾向：${this.getStyleDescription(userStyle)}

4. 使用中文表达，每行尽量简洁

请严格按照以下格式返回，不要有多余的解释：

A. 具体的对话内容
（风格描述）
→ 结果影响 🌟

B. 具体的对话内容
（风格描述）
→ 结果影响 😄

C. 具体的对话内容
（风格描述）
→ 结果影响 🍖

D. 具体的对话内容
（风格描述）
→ 结果影响 😅

E. 具体的对话内容
（风格描述）
→ 结果影响 🔄`;
  }

  /**
   * 解析AI返回的文本（保持原有解析逻辑）
   */
  parseAIResponse(aiText) {
    const options = [];
    const lines = aiText.split('\n').filter(line => line.trim());
    
    let currentOption = null;
    
    for (const line of lines) {
      // 匹配选项开头，如 "A. " 或 "A: "
      const optionMatch = line.match(/^([A-E])[\.:]\s*(.+)/);
      
      if (optionMatch) {
        if (currentOption) {
          options.push(currentOption);
        }
        currentOption = {
          id: optionMatch[1],
          text: optionMatch[2],
          style: '默认风格',
          effect: '无特殊影响',
          emoji: '💬'
        };
      } else if (currentOption) {
        // 匹配风格描述，如 "（风格描述）"
        const styleMatch = line.match(/^[（\(](.+)[）\)]$/);
        if (styleMatch) {
          currentOption.style = styleMatch[1];
        }
        
        // 匹配结果影响，如 "→ 结果影响 🌟"
        const effectMatch = line.match(/^→\s*(.+?)\s*([^\u0000-\u007F]+)?$/);
        if (effectMatch) {
          currentOption.effect = effectMatch[1];
          if (effectMatch[2]) {
            currentOption.emoji = effectMatch[2];
          }
        }
      }
    }
    
    if (currentOption) {
      options.push(currentOption);
    }
    
    return options;
  }

  /**
   * 获取风格描述
   */
  getStyleDescription(style) {
    const styleMap = {
      'humorous': '以幽默风趣为主，多使用网络流行语和俏皮话',
      'cold': '以简洁高冷为主，惜字如金，略带傲娇',
      'neutral': '平衡各种风格，适当幽默但不过分',
      'reliable': '以可靠稳重为主，体现责任感和担当',
      'playful': '以调皮捣蛋为主，喜欢开玩笑和恶作剧'
    };
    return styleMap[style] || styleMap.neutral;
  }

  /**
   * 降级选项（保持原有逻辑）
   */
  getFallbackOptions(scene, userStyle) {
    return [
      {
        id: 'A',
        text: '放心，我嘴最严了！这事就烂在我肚子里。',
        style: '可靠队友',
        effect: '朋友好感度+1，获得[可靠队友]标签',
        emoji: '🛡️'
      },
      {
        id: 'B',
        text: '只要封口费到位，我什么都不知道~',
        style: '幽默接梗',
        effect: '气氛轻松，朋友觉得你很有趣',
        emoji: '💰'
      },
      {
        id: 'C',
        text: '哦？那得看你表现了，不然我就去告密！',
        style: '假装要挟',
        effect: '朋友紧张了一下，随后大笑',
        emoji: '😈'
      },
      {
        id: 'D',
        text: '无聊，这种小事我才懒得说。',
        style: '冷漠拆台',
        effect: '朋友觉得你很高冷，但很安心',
        emoji: '😒'
      },
      {
        id: 'E',
        text: '哼，谁稀罕说你的破事，别自作多情了。',
        style: '傲娇责备',
        effect: '朋友看穿了你的傲娇，好感度+1',
        emoji: '😤'
      }
    ];
  }
}

module.exports = AIService;
