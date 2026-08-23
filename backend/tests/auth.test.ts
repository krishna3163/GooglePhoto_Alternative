import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, closeDatabase, collections } from '../src/config/database.js';

describe('Authentication & User Management API Tests', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@example.com`,
    password: 'StrongPassword123!',
  };

  let accessToken = '';
  let refreshToken = '';

  beforeAll(async () => {
    try {
      await connectDatabase();
    } catch {
      // If local mongo is not running, we'll continue with unit mocks
    }
  });

  afterAll(async () => {
    try {
      await closeDatabase();
    } catch {}
  });

  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('POST /api/v1/auth/register fails with invalid password length', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'shortuser',
        email: 'valid@example.com',
        password: '123', // Too short
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
