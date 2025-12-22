const axios = require('axios');
const qs = require('qs');

class WenxinService {
  constructor() {
    // 从环境变量读取配置
    this.APP_ID = process.env.WENXIN_APP_ID || 'app-k41vhA5j'; // 您的应用身份ID
    this.API_KEY = process.env.WENXIN_API_KEY || this.APP_ID; // 新版中二者相同
    
    // Token缓存
    this.accessToken = null;
    this.tokenExpires = 0;
    
    console.log('🔐 初始化新版文心服务，应用ID:', this.APP_ID);
  }

  /**
   * 获取IAM Access Token（新版认证方式）
   * 使用应用身份ID作为client_id，无需Secret Key
   */
  async getAccessToken() {
    // 检查Token是否有效（提前5分钟刷新）
    if (this.accessToken && Date.now() < this.tokenExpires) {
      return this.accessToken;
    }
    
    const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token';
    
    // 新版请求参数：grant_type固定，client_id为您的应用身份ID
    const params = {
      grant_type: 'client_credentials',
      client_id: this.API_KEY,  // 使用应用身份ID作为client_id
    };
    
    try {
      console.log('🔄 获取新版IAM Access Token，应用ID:', this.APP_ID);
      
      const response = await axios.post(tokenUrl, qs.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10秒超时
      });
      
      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        // 计算过期时间（提前5分钟刷新）
        this.tokenExpires = Date.now() + (response.data.expires_in - 300) * 1000;
        
        console.log('✅ IAM Access Token获取成功，过期时间:', 
          new Date(this.tokenExpires).toLocaleTimeString());
        return this.accessToken;
      } else {
        throw new Error('Token响应格式异常: ' + JSON.stringify(response.data));
      }
      
    } catch (error) {
      console.error('❌ 获取IAM Access Token失败:');
      
      if (error.response) {
        // 服务器响应了错误状态码
        console.error('   状态码:', error.response.status);
        console.error('   响应数据:', JSON.stringify(error.response.data));
        
        if (error.response.status === 401) {
          throw new Error('认证失败：应用身份ID无效或已禁用');
        } else if (error.response.status === 429) {
          throw new Error('请求频率超限，请稍后重试');
        }
      } else if (error.request) {
        // 请求已发送但无响应
        console.error('   网络错误：无响应');
        throw new Error('网络连接失败，请检查网络设置');
      }
      
      throw new Error(`获取Token失败: ${error.message}`);
    }
  }

  /**
   * 调用文心大模型生成对话选项（新版API）
   */
  async generateOptions(scene, style = 'neutral') {
    try {
      // 1. 获取Access Token
      const accessToken = await this.getAccessToken();
      
      // 2. 构建提示词
      const prompt = this.buildPrompt(scene, style);
      
      // 3. 调用文心大模型API（新版端点）
      const apiUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions`;
      
      const response = await axios.post(`${apiUrl}?access_token=${accessToken}`, {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        top_p: 0.8,
        penalty_score: 1.0,
        stream: false,
        disable_search: false,
        enable_citation: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30秒超时
      });
      
      // 4. 解析响应
      if (response.data.result) {
        const options = this.parseAIResponse(response.data.result);
        console.log(`✅ 文心API调用成功，生成${options.length}个选项`);
        return options;
      } else {
        throw new Error('API返回格式异常: ' + JSON.stringify(response.data));
      }
      
    } catch (error) {
      console.error('❌ 调用文心API失败:', error.message);
      
      // 返回降级选项
      return this.getFallbackOptions(scene, style);
    }
  }

  /**
   * 构建提示词模板
   */
  buildPrompt(scene, style) {
    return `
你是一个智能对话助手。请根据以下对话场景，生成5个不同风格的回复选项。

对话场景：${scene}
用户偏好风格：${style}

请严格按照以下JSON格式返回结果，不要包含任何其他文字：
[
  {
    "id": "A",
    "text": "回复内容",
    "style": "风格描述（如：爽快答应、幽默接梗）",
    "effect": "预期效果（如：增加好感、缓解气氛）",
    "emoji": "相关表情符号"
  },
  ...
]

要求：
1. 选项A：爽快答应型（热心帮助）
2. 选项B：幽默接梗型（轻松幽默）
3. 选项C：假装要挟型（戏谑玩笑）
4. 选项D：冷漠拆台型（冷淡吐槽）
5. 选项E：傲娇责备型（口嫌体正直）
6. 每个回复不超过20个字。
`;
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(aiText) {
    try {
      // 有时候模型会返回Markdown代码块，需要处理
      const jsonStr = aiText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse Wenxin response:', aiText);
      return this.getFallbackOptions();
    }
  }

  /**
   * 降级选项
   */
  getFallbackOptions(scene, style) {
    return [
      { id: 'A', text: '好的，没问题！', style: '爽快答应', effect: '积极回应', emoji: '👍' },
      { id: 'B', text: '这就去办，老板！', style: '幽默接梗', effect: '轻松氛围', emoji: '😎' },
      { id: 'C', text: '求我呀~', style: '假装要挟', effect: '增加互动', emoji: '😏' },
      { id: 'D', text: '哦。', style: '冷漠拆台', effect: '结束话题', emoji: '😐' },
      { id: 'E', text: '真拿你没办法。', style: '傲娇责备', effect: '拉近关系', emoji: '😤' }
    ];
  }
}

module.exports = new WenxinService();
