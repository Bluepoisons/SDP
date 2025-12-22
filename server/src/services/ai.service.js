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
    return `你是一位资深的 Galgame（视觉小说）金牌脚本作家。
现在请根据以下【原始场景】，为男主角设计接下来的对话分支。

【原始场景】
"${scene}"

【写作要求】
1. **场景侧写**：第一行生成一段极具文学感的旁白，描述当前空气中的氛围或对方细微的神态变化。
2. **选项风格**：生成 A-E 五个选项，严格符合以下人设：
   - A. [王道/温柔]：阳光、包容，满分的情商，给人绝对的安全感。
   - B. [风趣/调侃]：机智幽默，擅长化解尴尬，带点小坏的调皮感。
   - C. [霸道/撩拨]：强势进攻，掌握主动权，带有强烈的荷尔蒙张力。
   - D. [冷静/高冷]：理性得近乎冷酷，简短有力，典型的外冷内热（酷娇）。
   - E. [傲娇/笨拙]：口嫌体正直，用责备掩饰害羞，充满反差萌。

【输出格式】
第一行：场景侧写（如：夕阳映在她的侧脸，那抹犹豫在空气中凝固了...）
空一行
每个选项严格遵循以下 4 行格式：
[选项序号] 动作描写 + 对话内容
(性格标签)
→ [属性影响] (例如：好感度+5 / 羁绊值上升)
一个代表心情的 Emoji

【范例参考】
空气中弥漫着尴尬的沉默，她绞着手指，等待着你的审判。

A. （轻轻拍了拍她的肩膀）别担心，剩下的交给我，你已经做得很好。
(温柔体贴)
→ 好感度+10
✨

B. （笑出声来）要是道歉有用的话，还要警察干嘛？除非你请我喝奶茶。
(幽默风趣)
→ 气氛活跃+5
🧋

请严格保持“1行侧写 + 空行 + 5个选项（每个选项4行）”的格式，禁止输出任何额外解释或旁白。`;
  }

  /**
   * 解析AI返回的文本（适配新的4行格式 + 场景旁白）
   */
  parseAIResponse(aiText) {
    const lines = aiText.split('\n').filter(line => line.trim());
    const parsedResult = {
      sceneSummary: '',
      options: []
    };
    
    let currentOption = null;
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
    
    // 尝试提取第一行作为场景旁白（如果它不是选项的话）
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const isOption = optionLetters.some(letter => firstLine.startsWith(letter + '.') || firstLine.startsWith(letter + '、'));
      
      if (!isOption) {
        parsedResult.sceneSummary = firstLine;
        // 移除第一行，后续只处理选项
        lines.shift();
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 1. 检测选项开始 (A. xxx)
      if (optionLetters.includes(line[0]) && (line[1] === '.' || line[1] === '、')) {
        if (currentOption) {
          parsedResult.options.push(currentOption);
        }
        
        const id = line[0];
        let text = line.substring(2).trim(); // 兼容 A. 和 A、
        
        currentOption = {
          id,
          text,
          style: '',
          effect: '',
          emoji: '🤔',
          favorChange: 0,
          tags: []
        };

        // 尝试从文本行中提取内联风格 (例如: "xxx (开心)")
        const inlineStyleMatch = text.match(/[（(]([^）)]+)[）)]$/);
        if (inlineStyleMatch) {
          currentOption.style = inlineStyleMatch[1];
          currentOption.text = text.replace(inlineStyleMatch[0], '').trim();
        }
        
      } else if (currentOption) {
        // 2. 风格行 (括号内)
        if ((line.startsWith('(') && line.endsWith(')')) || (line.startsWith('（') && line.endsWith('）'))) {
          currentOption.style = line.replace(/[（）()]/g, '');
        
        // 3. 影响行 (箭头→开头)
        } else if (line.startsWith('→') || line.startsWith('->')) {
          const effectLine = line.replace(/^[→\->\s]+/, '').trim();
          currentOption.effect = effectLine;
          
          // 解析好感度
          const favorMatch = effectLine.match(/好感度[：:]?\s*([+-]?\d+)/);
          if (favorMatch) {
            currentOption.favorChange = parseInt(favorMatch[1]);
          }
          
        // 4. Emoji行 (通常是单独的Emoji)
        } else if (/\p{Emoji}/u.test(line) && line.length < 10) {
           // 提取第一个Emoji
           const emojiMatch = line.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
           if (emojiMatch) {
             currentOption.emoji = emojiMatch[0];
           }
        }
      }
    }
    
    // 添加最后一个选项
    if (currentOption) {
      parsedResult.options.push(currentOption);
    }
    
    // 确保有5个选项
    if (parsedResult.options.length < 5) {
      console.warn(`⚠️ 只解析出${parsedResult.options.length}个选项，使用备用选项`);
      // 注意：这里假设 getFallbackOptions 返回的是数组，我们需要保持结构一致
      // 如果 getFallbackOptions 返回的是数组，我们直接赋值给 options
      parsedResult.options = this.getFallbackOptions();
    }
    
    return parsedResult;
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
        text: '当然可以！97年的姐姐现在也才20多岁，正是最好的年纪。需要我帮你设计开场白吗？',
        style: '热情帮助',
        effect: '好感度：+1，获得[热心助手]标签',
        emoji: '🤝',
        favorChange: 1,
        tags: ['热心助手']
      },
      {
        id: 'B',
        text: '97年的姐姐？那你得叫我叔叔了！不过话说回来，年龄不是问题，心态年轻最重要～',
        style: '幽默接梗',
        effect: '好感度：+0，氛围+1，获得[气氛担当]标签',
        emoji: '😄',
        favorChange: 0,
        tags: ['气氛担当']
      },
      {
        id: 'C',
        text: '现在的小年轻都这么直接吗？姐姐是随便能找的吗？……不过看在你诚实的份上，也不是不行。',
        style: '傲娇责备',
        effect: '好感度：-1，但可能触发后续事件',
        emoji: '😏',
        favorChange: -1,
        tags: ['傲娇鬼']
      },
      {
        id: 'D',
        text: '嗯。随你。',
        style: '高冷毒舌',
        effect: '好感度：-2，对方觉得你太冷淡',
        emoji: '😶',
        favorChange: -2,
        tags: ['高冷范']
      },
      {
        id: 'E',
        text: '从社交心理学角度，年龄差3-5岁是最佳沟通区间。97年的话，你需要先了解她的兴趣爱好。',
        style: '理性分析',
        effect: '好感度：+1，获得[智囊团]标签',
        emoji: '🧠',
        favorChange: 1,
        tags: ['智囊团']
      }
    ];
  }
}

module.exports = AIService;
