const express = require('express');
const router = express.Router();
const AIService = require('../services/ai.service');
const aiService = new AIService();
const templateService = require('../services/template.service');
const { DialogSession, UserSelection, User } = require('../models');

router.post('/process', async (req, res) => {
  try {
    const { text, userId, style = 'neutral' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '对话文本不能为空' });
    }
    
    // 确保用户存在
    let user = await User.findByPk(userId);
    if (!user) {
      await User.create({ id: userId, username: 'Guest' });
    }
    
    // 调用AI服务生成选项
    const options = await aiService.generateDialogOptions(text, style);
    
    // 存储会话到数据库
    const session = await DialogSession.create({
      userId,
      originalText: text,
      contextStyle: style,
      generatedOptions: options
    });
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        originalText: text,
        options: options,
        style: style,
        timestamp: session.createdAt
      }
    });
    
  } catch (error) {
    console.error('处理对话时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 记录用户选择的接口
router.post('/selection', async (req, res) => {
  try {
    const { sessionId, optionId, userId } = req.body;
    
    // 验证会话是否存在
    const session = await DialogSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: '会话不存在或已过期' });
    }

    // 存储选择记录
    const selection = await UserSelection.create({
      sessionId,
      selectedOptionId: optionId,
      userId
    });
    
    // 触发模板优化和用户偏好更新
    await templateService.recordSelectionAndOptimize(userId, sessionId, optionId);
    
    // 获取用户统计
    const allSelections = await UserSelection.findAll({ where: { userId } });
    const userStats = {
      totalSelections: allSelections.length,
      // 简单的统计示例
      lastSelection: optionId
    };

    res.json({
      success: true,
      message: '选择已记录',
      data: {
        selection: {
            sessionId,
            optionId,
            recordedAt: selection.createdAt
        },
        userStats
      }
    });
    
  } catch (error) {
    console.error('记录选择时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户统计数据接口
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByPk(userId);
        const selections = await UserSelection.findAll({ where: { userId } });
        
        const stats = {
            userId,
            totalDialogs: selections.length,
            stylePreferences: user ? user.preferences : {}
        };
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('获取统计数据出错:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router;
