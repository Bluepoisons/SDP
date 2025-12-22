const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_ID = 'test-user-' + Date.now();
let sessionId = null;

async function verifyApi() {
  console.log('🚀 开始验证后端 API...\n');

  try {
    // 1. 验证健康检查 (GET /)
    console.log('1️⃣  验证服务状态 (GET /)...');
    const healthRes = await axios.get(`${BASE_URL}/`);
    if (healthRes.status === 200 && healthRes.data.message) {
      console.log('✅ 服务运行正常:', healthRes.data.message);
    } else {
      throw new Error('服务状态异常');
    }

    // 2. 验证对话生成 (POST /api/dialog/process)
    console.log('\n2️⃣  验证对话生成 (POST /api/dialog/process)...');
    const processRes = await axios.post(`${BASE_URL}/api/dialog/process`, {
      text: '测试对话文本',
      userId: USER_ID,
      style: 'humorous'
    });

    if (processRes.status === 200 && processRes.data.success) {
      console.log('✅ 对话生成成功');
      sessionId = processRes.data.data.sessionId;
      console.log('   Session ID:', sessionId);
      console.log('   选项数量:', processRes.data.data.options.length);
    } else {
      throw new Error('对话生成失败');
    }

    // 3. 验证用户选择 (POST /api/dialog/selection)
    if (sessionId) {
      console.log('\n3️⃣  验证用户选择 (POST /api/dialog/selection)...');
      const selectionRes = await axios.post(`${BASE_URL}/api/dialog/selection`, {
        sessionId: sessionId,
        optionId: 'A',
        userId: USER_ID
      });

      if (selectionRes.status === 200 && selectionRes.data.success) {
        console.log('✅ 选择记录成功');
      } else {
        throw new Error('选择记录失败');
      }
    }

    // 4. 验证用户统计 (GET /api/dialog/stats/:userId)
    console.log(`\n4️⃣  验证用户统计 (GET /api/dialog/stats/${USER_ID})...`);
    const statsRes = await axios.get(`${BASE_URL}/api/dialog/stats/${USER_ID}`);

    if (statsRes.status === 200 && statsRes.data.success) {
      console.log('✅ 统计获取成功');
      console.log('   总对话数:', statsRes.data.data.totalDialogs);
      console.log('   风格偏好:', JSON.stringify(statsRes.data.data.stylePreference));
    } else {
      throw new Error('统计获取失败');
    }

    console.log('\n🎉 所有 API 验证通过！');

  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    console.error('   错误代码:', error.code);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', JSON.stringify(error.response.data));
    }
  }
}

verifyApi();
