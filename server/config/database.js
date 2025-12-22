module.exports = {
  sqlite: {
    filename: process.env.SQLITE_PATH || './sdp_database.sqlite'
  },
  // 移除PostgreSQL和Redis配置
};
