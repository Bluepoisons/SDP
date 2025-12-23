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
          timeout: 120000 // 120秒超时
        }
      );

      // 解析AI响应
      const aiResponse = response.data.choices[0].message.content;
      console.log('🤖 AI原始响应:', aiResponse); // 添加日志以便调试
      const options = this.parseAIResponse(aiResponse);
      
      console.log(`✅ 硅基流动API调用成功，生成${options.options.length}个选项`);
      return options; // 返回完整对象 { sceneSummary, options }

    } catch (error) {
      console.error('❌ 硅基流动API调用失败:', error.message);
      if (error.response) {
        console.error('   状态码:', error.response.status);
        console.error('   响应数据:', JSON.stringify(error.response.data));
      }
      
      // 返回降级选项
      return this.getFallbackOptions();
    }
  }

  /**
   * 强化版构建提示词
   */
  buildPrompt(scene, userStyle, history) {
    // 转换历史记录为可读字符串
    const historyContext = history.length > 0 
      ? `【参考历史对话】（仅供参考，请勿针对历史内容回应）：\n${history.map(h => `${h.role === 'user' ? '对方' : '我'}: ${h.content}`).join('\n')}`
      : '【参考历史对话】：无';

    return `你是顶级情商的恋爱Galgame编剧。
⚠️ **重要指令**：请忽略历史对话中的具体事件，**仅针对**以下【当前用户输入】生成5个回应选项。

【当前用户输入】(这是你需要回应的核心内容！)
"${scene}"

${historyContext}

【核心指令】
1. **场景侧写（两段式）**：
   - 第一段（情境分析）：一针见血地分析【当前用户输入】的潜台词与社交张力（30字内）。
   - 第二段（选择预告）：必须以“此刻，你的回应将定义...”开头。
   - 结尾必须带一个氛围颜文字。
2. **强制颜文字库**（必须从以下对应风格中选取，严禁使用图形Emoji）：
   - [治愈系/温柔]: (｡•́︿•̀｡) (◍•ᴗ•◍) (๑'ㅂ๑) (T_T) (｡･ω･｡)
   - [氛围组/幽默]: (￣▽￣*) (ノ￣▽￣) (´･ω･) (≧∇≦)/ (o^ω^o)
   - [观察家/高冷]: (ー_ー゛) (→_→) (´-ω-｀) (￣ヘ￣) (눈_눈)
   - [小太阳/热情]: (๑•̀ㅂ•́)و✧ (≧∇≦)ﾉ o(≧口≦)o (★^O^★) (ง •_•)ง
   - [傲娇鬼/傲娇]: (￣^￣) (๑•́ ₃ •̀๑) (¬_¬) (///ω///) (￣ε(#￣)
3. **角色身份标签**（必须使用以下固定标签）：
   - 选项A (温柔) -> 标签：【治愈系伙伴】
   - 选项B (幽默) -> 标签：【氛围调节者】
   - 选项C (傲娇) -> 标签：【心口不一者】
   - 选项D (高冷) -> 标签：【疏离观察家】
   - 选项E (热情) -> 标签：【太阳般友人】
4. **好感度数值多样性**（严禁全部+1）：
   - 必须根据回应风格产生真实的数值波动。
   - 【傲娇】和【高冷】选项通常初始好感度为 0 或 -1（表现出距离感）。
   - 【幽默】选项如果过于轻浮，好感度可能为 -1。
   - 只有真正触动对方的【温柔】或【热情】才给 +2。
   - 允许范围：-5 到 +5。

【输出格式（严格遵守，每行一个信息）】
[场景侧写内容]

A. [回应内容]
(Style: 【治愈系伙伴】)
(Kaomoji: 颜文字)
(Favor: +1)
(Impact: 简短描述)

B. [回应内容]
(Style: 【氛围调节者】)
(Kaomoji: 颜文字)
(Favor: +1)
(Impact: 简短描述)
(以此类推到E)

【反面教材警告】
- 严禁使用 "默认风格" 或 "Unknown"。
- 严禁使用 😳 等图形Emoji。
- 严禁 A 和 D 内容相似。`;
  }

  /**
   * 解析AI返回的文本（适配强化版格式）
   */
  parseAIResponse(aiText) {
    const lines = aiText.split('\n').map(line => line.trim()).filter(line => line);
    const parsedResult = {
      sceneSummary: '',
      options: []
    };
    
    let currentOption = null;
    
    // 1. 提取场景总结 (通常在第一段，以"对方"开头，或者在选项A之前)
    // 寻找第一个选项的位置
    const firstOptionIndex = lines.findIndex(line => /^[A-E][.、]/.test(line));
    
    if (firstOptionIndex > 0) {
      // 选项前的所有非空行都视为场景总结
      parsedResult.sceneSummary = lines.slice(0, firstOptionIndex).join('\n');
    } else if (firstOptionIndex === -1 && lines.length > 0) {
      // 如果没找到选项，可能整个都是总结（异常情况）
      parsedResult.sceneSummary = lines[0];
    }

    // 2. 解析选项
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检测选项开始 (A. xxx)
      const optionMatch = line.match(/^([A-E])[.、]\s*(.+)/);
      if (optionMatch) {
        if (currentOption) {
          parsedResult.options.push(currentOption);
        }
        
        currentOption = {
          id: optionMatch[1],
          text: optionMatch[2],
          style: '',
          effect: '', // 这里将存储 Impact 内容
          kaomoji: '', 
          favorChange: 0
        };
        continue;
      }
      
      if (currentOption) {
        // 风格行: (Style: xxx)
        const styleMatch = line.match(/\(Style:\s*(.+?)\)/i);
        if (styleMatch) {
          currentOption.style = styleMatch[1].replace(/[【】\[\]]/g, ''); // 去除可能存在的括号
          continue;
        }

        // 颜文字行: (Kaomoji: xxx)
        const kaomojiMatch = line.match(/\(Kaomoji:\s*(.+?)\)/i);
        if (kaomojiMatch) {
          currentOption.kaomoji = kaomojiMatch[1];
          continue;
        }
        
        // 好感度行: (Favor: +1)
        const favorMatch = line.match(/\(Favor:\s*([+-]?\d+)\)/i);
        if (favorMatch) {
          currentOption.favorChange = parseInt(favorMatch[1]);
          continue;
        }

        // 影响/后果行: (Impact: xxx)
        const impactMatch = line.match(/\(Impact:\s*(.+?)\)/i);
        if (impactMatch) {
          currentOption.effect = impactMatch[1];
          continue;
        }
      }
    }
    
    // 添加最后一个选项
    if (currentOption) {
      parsedResult.options.push(currentOption);
    }
    
    // 兜底：如果没有解析出选项，使用默认
    if (parsedResult.options.length === 0) {
      parsedResult.options = this.getFallbackOptions();
    }
    
    // 将 sceneSummary 附加到第一个选项或者作为单独的属性返回
    // 注意：generateDialogOptions 目前只返回 options 数组，
    // 为了传递 sceneSummary，我们可以把它挂在每个选项上，或者修改 generateDialogOptions 的返回结构
    // 这里我们把它挂在第一个选项上，或者前端需要适配
    if (parsedResult.options.length > 0) {
        parsedResult.options[0].sceneSummary = parsedResult.sceneSummary;
    }

    return parsedResult;
  }

  getFallbackOptions() {
    return [
      { 
        id: 'A', 
        text: '系统连接不稳定，无法生成针对性回应。', 
        style: '系统错误', 
        effect: '请检查网络或API配置', 
        kaomoji: '(T_T)', 
        favorChange: 0,
        sceneSummary: '⚠️ AI服务暂时不可用，请稍后重试。'
      },
      { 
        id: 'B', 
        text: '请尝试刷新页面或重新输入。', 
        style: '重试建议', 
        effect: '无影响', 
        kaomoji: '(´･ω･)', 
        favorChange: 0 
      },
      { 
        id: 'C', 
        text: '...', 
        style: '沉默', 
        effect: '无影响', 
        kaomoji: '...', 
        favorChange: 0 
      },
      { 
        id: 'D', 
        text: '...', 
        style: '沉默', 
        effect: '无影响', 
        kaomoji: '...', 
        favorChange: 0 
      },
      { 
        id: 'E', 
        text: '...', 
        style: '沉默', 
        effect: '无影响', 
        kaomoji: '...', 
        favorChange: 0 
      }
    ];
  }
}

module.exports = AIService;
