const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dialogRoutes = require('./routes/dialog.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 基础路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'SDP API 服务已启动',
    version: '1.0.0',
    endpoints: {
      dialog: '/api/dialog',
      template: '/api/template',
      user: '/api/user'
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.use('/api/dialog', dialogRoutes);

// 处理404
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 API文档: http://localhost:${PORT}/api-docs`);
});
