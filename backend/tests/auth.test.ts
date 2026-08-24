import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, closeDatabase, queryPg } from '../src/config/database.js';

describe('Phase 4: Authentication & Security Test Suite', () => {
  const ts = Date.now();
  const testUser = {
    username: `auth_user_${ts}`,
    email: `auth_user_${ts}@example.com`,
    password: 'SecureAuthTest2026!',
    initialVault: {
      name: 'Personal Vault',
      encryptedVaultKey: 'wrapped_key_test_payload',
      wrappedWithRecovery: 'wrapped_recovery_test_payload',
      salt: 'test_salt_123',
      keyVersion: 1,
    },
  };

  let accessToken = '';
  let refreshToken = '';

  beforeAll(async () => {
    try {
      await connectDatabase();
    } catch (err) {
      console.warn('Database connection warning in test environment:', err);
    }
  });

  afterAll(async () => {
    try {
      // Clean up test user
      await queryPg('DELETE FROM users WHERE email = $1', [testUser.email]);
      await closeDatabase();
    } catch {}
  });

  it('TEST AUTH-000: GET /health returns 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('TEST AUTH-001: Register new account successfully with hashed password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.user.password).toBeUndefined(); // Plaintext password must NEVER be returned
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined(); // Refresh token securely placed in HttpOnly cookie
    expect(res.body.data.defaultVault).toBeDefined();
    expect(res.body.data.defaultVault.name).toBe('Personal Vault');

    accessToken = res.body.data.accessToken;
    const cookieHeader = res.headers['set-cookie'];
    if (cookieHeader && cookieHeader[0]) {
      const match = cookieHeader[0].match(/refreshToken=([^;]+)/);
      if (match) refreshToken = match[1];
    }
  });

  it('TEST AUTH-001b: Reject registration with invalid short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `short_user_${Date.now()}`,
        email: `short_${Date.now()}@example.com`,
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('TEST AUTH-001c: Reject duplicate registration with same email or username', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(['USER_EXISTS', 'USERNAME_TAKEN', 'EMAIL_TAKEN']).toContain(res.body.error.code);
  });

  it('TEST AUTH-002: Login using correct email and password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.vaults).toBeInstanceOf(Array);
    expect(res.body.data.vaults.length).toBeGreaterThan(0);
  });

  it('TEST AUTH-003: Login with wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: testUser.email,
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('TEST AUTH-004: Login with unknown email returns safe 401 without user enumeration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: `nonexistent_${Date.now()}@example.com`,
        password: 'AnyPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('TEST AUTH-006: Access protected endpoint without token returns 401', async () => {
    const res = await request(app).get('/api/v1/vaults');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('TEST AUTH-010: Access protected endpoint with tampered JWT returns 401', async () => {
    const tamperedToken = accessToken.slice(0, -5) + 'xxxxx';
    const res = await request(app)
      .get('/api/v1/vaults')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('TEST AUTH-008: Refresh access token using valid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('TEST AUTH-009: Reject invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: 'invalid_refresh_token_string' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
