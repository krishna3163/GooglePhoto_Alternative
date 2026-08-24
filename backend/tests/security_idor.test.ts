import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, closeDatabase, queryPg } from '../src/config/database.js';

describe('Phase 6 & 22: Multi-User Isolation & IDOR Security Test Suite', () => {
  const ts = Date.now();
  const userA = {
    username: `user_a_${ts}`,
    email: `user_a_${ts}@test.local`,
    password: 'PasswordUserA2026!',
    initialVault: { name: 'Vault A', encryptedVaultKey: 'key_a', salt: 'salt_a' },
  };

  const userB = {
    username: `user_b_${ts}`,
    email: `user_b_${ts}@test.local`,
    password: 'PasswordUserB2026!',
    initialVault: { name: 'Vault B', encryptedVaultKey: 'key_b', salt: 'salt_b' },
  };

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';
  let mediaAId = `media_a_${ts}`;
  let albumAId = `album_a_${ts}`;

  beforeAll(async () => {
    try {
      await connectDatabase();

      // Register User A
      const resA = await request(app).post('/api/v1/auth/register').send(userA);
      tokenA = resA.body.data.accessToken;
      userAId = resA.body.data.user.id;

      // Register User B
      const resB = await request(app).post('/api/v1/auth/register').send(userB);
      tokenB = resB.body.data.accessToken;
      userBId = resB.body.data.user.id;

      // User A creates a media record via migration bootstrap
      await request(app)
        .post('/api/v1/migration/bootstrap')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          media: [
            {
              id: mediaAId,
              fileName: 'secret_photo_user_a.jpg',
              mediaType: 'image',
              fileSizeBytes: 1024 * 500,
              isFavourite: true,
            },
          ],
          albums: [],
        });

      // User A creates an album
      const albumRes = await request(app)
        .post('/api/v1/albums')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          id: albumAId,
          name: "User A's Private Vacation",
        });
    } catch (err) {
      console.warn('IDOR test suite initialization notice:', err);
    }
  });

  afterAll(async () => {
    try {
      await queryPg('DELETE FROM users WHERE email IN ($1, $2)', [userA.email, userB.email]);
      await closeDatabase();
    } catch {}
  });

  it('TEST IDOR-001: User B cannot access User A gallery media list', async () => {
    const res = await request(app)
      .get('/api/v1/media')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const mediaIds = res.body.data.items.map((i: any) => i.id);
    expect(mediaIds).not.toContain(mediaAId);
  });

  it('TEST IDOR-002: User B cannot GET User A single media item by ID (Returns 404)', async () => {
    const res = await request(app)
      .get(`/api/v1/media/${mediaAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('TEST IDOR-003: User B cannot favorite or modify User A media', async () => {
    const res = await request(app)
      .patch(`/api/v1/media/${mediaAId}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ favorite: false });

    expect(res.status).toBe(404);
  });

  it('TEST IDOR-004: User B cannot delete User A media', async () => {
    const res = await request(app)
      .delete(`/api/v1/media/${mediaAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it('TEST IDOR-005: User B cannot access User A albums', async () => {
    const res = await request(app)
      .get('/api/v1/albums')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const albumNames = res.body.data.map((a: any) => a.name);
    expect(albumNames).not.toContain("User A's Private Vacation");
  });

  it('TEST IDOR-006: User B cannot access User A private vaults', async () => {
    const res = await request(app)
      .get('/api/v1/vaults')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const vaultNames = res.body.data.map((v: any) => v.name);
    expect(vaultNames).not.toContain('Vault A');
  });

  it('TEST IDOR-007: User B bootstrap sync does not leak User A media', async () => {
    const res = await request(app)
      .get('/api/v1/sync/bootstrap')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const mediaIds = res.body.data.media.map((m: any) => m.id);
    expect(mediaIds).not.toContain(mediaAId);
  });
});
