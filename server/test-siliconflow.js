require('dotenv').config();
const AIService = require('./src/services/ai.service');

async function testSiliconFlow() {
  console.log('🧪 测试硅基流动API集成...\n');
  
  const aiService = new AIService();
  
  try {
    console.log('1. 测试对话生成...');
    const testScene = '朋友悄悄对你说："打游戏时别提下午的事，女朋友知道要肘击我了。"';
    const options = await aiService.generateDialogOptions(testScene, 'humorous');
    
    console.log('✅ API调用成功');
    console.log('   返回选项数:', options.length);
    
    if (options.length > 0) {
      console.log('\n   第一个选项示例:');
      console.log(`   ${options[0].id}. ${options[0].text}`);
      console.log(`      风格: ${options[0].style}`);
      console.log(`      影响: ${options[0].effect} ${options[0].emoji}`);
    }
    
    console.log('\n🎉 硅基流动API测试通过！');
    return true;
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    return false;
  }
}

testSiliconFlow();
