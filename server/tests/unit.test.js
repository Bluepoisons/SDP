const wenxinService = require('../src/services/wenxin.service');
const axios = require('axios');

jest.mock('axios');

describe('WenxinService Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    wenxinService.accessToken = null;
    wenxinService.tokenExpiresAt = 0;
  });

  describe('getAccessToken', () => {
    it('should fetch new token if not exists', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'new_token', expires_in: 3600 }
      });

      const token = await wenxinService.getAccessToken();
      expect(token).toBe('new_token');
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should return cached token if valid', async () => {
      wenxinService.accessToken = 'cached_token';
      wenxinService.tokenExpiresAt = Date.now() + 10000;

      const token = await wenxinService.getAccessToken();
      expect(token).toBe('cached_token');
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('generateOptions', () => {
    it('should return parsed options on success', async () => {
      // Mock token call
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'token', expires_in: 3600 }
      });

      // Mock chat completion call
      const mockResponse = {
        result: JSON.stringify([
          { id: 'A', text: 'Option A', style: 'style', effect: 'effect', emoji: '😀' }
        ])
      };
      axios.post.mockResolvedValueOnce({ data: mockResponse });

      const options = await wenxinService.generateOptions('scene');
      expect(options).toHaveLength(1);
      expect(options[0].id).toBe('A');
    });

    it('should return fallback options on API failure', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      const options = await wenxinService.generateOptions('scene');
      expect(options).toHaveLength(5); // Fallback has 5 options
      expect(options[0].style).toBe('爽快答应');
    });
  });

});
