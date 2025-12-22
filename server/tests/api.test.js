const request = require('supertest');
const app = require('../src/index');
const { User, DialogSession } = require('../src/models');

// Mock Wenxin Service
jest.mock('../src/services/wenxin.service', () => ({
  generateOptions: jest.fn().mockResolvedValue([
    { id: 'A', text: 'Mock Option A', style: 'neutral', effect: 'none', emoji: '😐' },
    { id: 'B', text: 'Mock Option B', style: 'humorous', effect: 'laugh', emoji: '😂' }
  ])
}));

describe('API Integration Tests', () => {
  
  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/dialog/process', () => {
    it('should process dialog and return options', async () => {
      const res = await request(app)
        .post('/api/dialog/process')
        .send({
          text: 'Hello world',
          userId: 'test_user_1',
          style: 'neutral'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.options).toHaveLength(2);
      expect(res.body.data.sessionId).toBeDefined();
    });

    it('should return 400 if text is missing', async () => {
      const res = await request(app)
        .post('/api/dialog/process')
        .send({
          userId: 'test_user_1'
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/dialog/selection', () => {
    let sessionId;

    beforeAll(async () => {
      // Create a session first
      const res = await request(app)
        .post('/api/dialog/process')
        .send({ text: 'Setup session', userId: 'test_user_1' });
      sessionId = res.body.data.sessionId;
    });

    it('should record user selection', async () => {
      const res = await request(app)
        .post('/api/dialog/selection')
        .send({
          sessionId: sessionId,
          optionId: 'A',
          userId: 'test_user_1'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for invalid session', async () => {
      const res = await request(app)
        .post('/api/dialog/selection')
        .send({
          sessionId: 'invalid_session',
          optionId: 'A',
          userId: 'test_user_1'
        });

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('GET /api/dialog/stats/:userId', () => {
    it('should return user stats', async () => {
      const res = await request(app).get('/api/dialog/stats/test_user_1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalDialogs');
    });
  });

});
