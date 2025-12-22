const { User, Template, DialogSession } = require('../models');

class TemplateService {
  
  // 获取最佳模板
  async getOptimalTemplate(userId, style = 'neutral') {
    // 1. 尝试获取用户特定偏好的模板
    // 简化逻辑：目前先返回默认的基础模板
    // 后续可加入：根据用户历史选择风格，动态调整Prompt的语气词
    
    let template = await Template.findOne({
      where: { 
        isActive: true,
        style: style
      },
      order: [['successRate', 'DESC']] // 优先选成功率高的
    });

    if (!template) {
      // 如果没有找到，返回默认模板
      return this.getDefaultPrompt(style);
    }

    return template.promptTemplate;
  }

  // 记录选择并触发优化
  async recordSelectionAndOptimize(userId, sessionId, optionId) {
    try {
      // 1. 获取会话详情
      const session = await DialogSession.findByPk(sessionId);
      if (!session) return;

      // 2. 分析用户选择
      const selectedOption = session.generatedOptions.find(opt => opt.id === optionId);
      if (!selectedOption) return;

      // 3. 更新用户画像 (简化版)
      const user = await User.findByPk(userId);
      if (user) {
        const prefs = user.preferences || {};
        // 如果用户选择了"幽默"风格的选项，增加幽默权重
        if (selectedOption.style.includes('幽默')) {
          prefs.humorLevel = Math.min(10, (prefs.humorLevel || 5) + 0.1);
        }
        // 如果用户选择了"冷漠"风格
        if (selectedOption.style.includes('冷漠')) {
          prefs.coldLevel = Math.min(10, (prefs.coldLevel || 5) + 0.1);
        }
        
        user.preferences = prefs;
        await User.save(user);
      }

      // 4. 模板效果评估 (如果关联了模板)
      if (session.TemplateId) {
        await this.updateTemplateStats(session.TemplateId, true);
      }

    } catch (error) {
      console.error('Template optimization failed:', error);
    }
  }

  async updateTemplateStats(templateId, isSuccess) {
    const template = await Template.findByPk(templateId);
    if (template) {
      // 简单的移动平均更新成功率
      const alpha = 0.1; // 学习率
      const currentScore = isSuccess ? 1.0 : 0.0;
      template.successRate = (1 - alpha) * template.successRate + alpha * currentScore;
      await Template.save(template);
    }
  }

  getDefaultPrompt(style) {
    return `
你是一个智能对话助手。请根据以下对话场景，生成5个不同风格的回复选项。

对话场景：{{scene}}
用户偏好风格：${style}

请严格按照以下JSON格式返回结果，不要包含任何其他文字：
[
  {
    "id": "A",
    "text": "回复内容",
    "style": "风格描述",
    "effect": "预期效果",
    "emoji": "表情"
  }
]
`;
  }
}

module.exports = new TemplateService();
