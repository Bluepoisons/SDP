const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const dbPath = process.env.DB_FILE || path.join(__dirname, '../../db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

// 初始化默认数据
db.defaults({ 
  users: [], 
  dialogSessions: [], 
  userSelections: [], 
  templates: [] 
}).write();

console.log('✅ LowDB 本地数据库已加载');

module.exports = db;
