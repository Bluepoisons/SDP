const express = require('express');
const router = express.Router();

// 测试用对话处理接口
router.post('/process', async (req, res) => {
  try {
    const { text, userId, style = 'neutral' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '对话文本不能为空' });
    }
    
    // 模拟AI处理（先用静态数据）
    const options = [
      "这个想法不错，我支持！",
      "需要更多细节才能判断。",
      "让我想想有没有更好的方案。"
    ];
    
    res.json({
      success: true,
      data: {
        originalText: text,
        options: options,
        templateId: 'temp_001',
        style: style,
        timestamp: new Date().toISOString()
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
    const { sessionId, optionIndex, userId } = req.body;
    
    // 模拟存储到数据库
    console.log(`用户 ${userId} 在会话 ${sessionId} 选择了选项 ${optionIndex}`);
    
    res.json({
      success: true,
      message: '选择已记录',
      data: {
        sessionId,
        optionIndex,
        recordedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('记录选择时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
