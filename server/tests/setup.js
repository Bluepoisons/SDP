const fs = require('fs');
const path = require('path');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_FILE = path.join(__dirname, '../test_db.json');
process.env.WENXIN_API_KEY = 'test_key';
process.env.WENXIN_SECRET_KEY = 'test_secret';

// 清理测试数据库
beforeAll(() => {
  // 确保测试数据库文件存在且为空
  const dbPath = process.env.DB_FILE;
  const initialData = { 
    users: [], 
    dialogSessions: [], 
    userSelections: [], 
    templates: [] 
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData));
});

afterAll(() => {
  // 测试结束后清理
  const dbPath = process.env.DB_FILE;
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});
