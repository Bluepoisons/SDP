const axios = require('axios');

async function testBridge() {
  try {
    console.log('Testing Bridge Endpoint...');
    const response = await axios.get('http://localhost:3000/bridge/health');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('Headers:', response.headers);
    
    if (response.data.status === 'bridge-ok') {
      console.log('✅ Bridge is working correctly!');
    } else {
      console.log('❌ Bridge returned unexpected status.');
    }
  } catch (error) {
    console.error('❌ Bridge test failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBridge();