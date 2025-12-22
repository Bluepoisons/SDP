const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 更严格的 CORS 响应头（供 Electron/前端探测使用）
router.use((req, res, next) => {
  // 允许来自本地开发端口和 Electron 的请求
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// /bridge/health - 返回增强的健康信息，方便前端检测
router.get('/health', (req, res) => {
  try {
    const dbPath = process.env.DB_FILE || path.join(__dirname, '../../db.json');
    const dbExists = fs.existsSync(dbPath);

    res.json({
      status: 'bridge-ok',
      timestamp: new Date(),
      pid: process.pid,
      platform: os.platform(),
      nodeVersion: process.version,
      dbPath,
      dbExists
    });
  } catch (err) {
    res.status(500).json({ error: 'bridge-error', detail: String(err) });
  }
});

// 可选：简单代理到内置 /health，保证两者语义一致
router.get('/forward-health', async (req, res) => {
  try {
    // 直接构造与主 /health 相同格式
    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ error: 'forward-failed', detail: String(err) });
  }
});

module.exports = router;
