const { v4: uuidv4 } = require('uuid');
const db = require('./src/services/database.service');
const { DialogSession, User } = require('./src/models');
const AIService = require('./src/services/ai.service');

async function test() {
  console.log('1. Testing UUID...');
  try {
    const id = uuidv4();
    console.log('   UUID:', id);
  } catch (e) {
    console.error('   UUID Failed:', e);
  }

  console.log('2. Testing DB Write...');
  try {
    await User.create({ id: 'debug-user-' + Date.now(), username: 'Debug' });
    console.log('   User created');
    
    await DialogSession.create({
      userId: 'debug-user',
      originalText: 'test',
      contextStyle: 'neutral',
      generatedOptions: []
    });
    console.log('   DialogSession created');
  } catch (e) {
    console.error('   DB Write Failed:', e);
  }

  console.log('3. Testing AI Service...');
  try {
    const ai = new AIService();
    const options = await ai.generateDialogOptions('Test scene', 'neutral');
    console.log('   AI Options:', options.length);
  } catch (e) {
    console.error('   AI Service Failed:', e);
  }
}

test();
