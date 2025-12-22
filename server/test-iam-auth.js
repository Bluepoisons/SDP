require('dotenv').config();
const WenXinService = require('./src/services/wenxin.service');

async function testNewIAMAuth() {
  console.log('🧪 开始测试新版IAM认证...\n');
  console.log('应用身份ID:', process.env.WENXIN_APP_ID);
  console.log('环境变量加载:', process.env.WENXIN_APP_ID ? '成功' : '失败');
  
  // WenXinService 导出的已经是一个实例
  const wenxin = WenXinService;
  
  try {
    // 1. 测试获取Token
    console.log('\n1. 测试获取IAM Access Token...');
    const token = await wenxin.getAccessToken();
    console.log('✅ Token获取成功:', token ? '是' : '否');
    console.log('   Token长度:', token?.length || 0);
    
    // 2. 测试API调用
    console.log('\n2. 测试文心API调用...');
    const testScene = '朋友悄悄说："打游戏时别提下午的事"';
    const options = await wenxin.generateOptions(testScene, 'humorous');
    
    console.log('✅ API调用成功');
    console.log('   返回选项数:', options.length);
    
    if (options.length > 0) {
      console.log('\n   第一个选项示例:');
      console.log(`   ${options[0].id}. ${options[0].text}`);
      console.log(`      风格: ${options[0].style}`);
      console.log(`      effect: ${options[0].effect} ${options[0].emoji}`);
    }
    
    console.log('\n🎉 新版IAM认证测试全部通过！');
    return true;
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    return false;
  }
}

// 运行测试
testNewIAMAuth().then(success => {
  process.exit(success ? 0 : 1);
});
