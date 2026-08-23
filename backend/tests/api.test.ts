import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Backend API Security & Routing Integration Suite', () => {
  it('GET /health returns status ok with uptime and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /unknown-route returns formatted 404 error without stack trace', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(res.body.stack).toBeUndefined();
  });

  it('POST /api/v1/auth/register fails on missing email or short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'validuser',
        email: 'not-an-email',
        password: 'short',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login fails on missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Protected routes reject unauthenticated requests with 401 UNAUTHORIZED', async () => {
    const routes = [
      { method: 'get', path: '/api/v1/media' },
      { method: 'get', path: '/api/v1/vaults' },
      { method: 'get', path: '/api/v1/albums' },
      { method: 'get', path: '/api/v1/devices' },
      { method: 'get', path: '/api/v1/sync/state' },
      { method: 'get', path: '/api/v1/sync/bootstrap' },
      { method: 'post', path: '/api/v1/sync/mutations' },
      { method: 'post', path: '/api/v1/migration/bootstrap' },
    ];

    for (const r of routes) {
      const res = await (request(app) as any)[r.method](r.path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('POST /api/v1/auth/refresh without token returns 401 NO_REFRESH_TOKEN', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NO_REFRESH_TOKEN');
  });

  it('CORS & Security headers (Helmet) are properly attached', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
});
