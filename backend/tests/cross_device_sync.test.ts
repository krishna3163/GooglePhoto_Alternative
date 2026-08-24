import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, closeDatabase, queryPg } from '../src/config/database.js';

describe('Phase 11 & 13: Cross-Device Synchronization Test Suite', () => {
  const ts = Date.now();
  const testUser = {
    username: `sync_user_${ts}`,
    email: `sync_user_${ts}@test.local`,
    password: 'SyncPassword2026!',
    initialVault: { name: 'Personal Vault', encryptedVaultKey: 'key_sync', salt: 'salt_sync' },
  };

  let tokenDeviceA = '';
  let tokenDeviceB = '';
  const photoFromDeviceA = `photo_dev_a_${ts}`;
  const photoFromDeviceB = `photo_dev_b_${ts}`;

  beforeAll(async () => {
    try {
      await connectDatabase();

      // Device A registers account
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      tokenDeviceA = res.body.data.accessToken;

      // Device B logs into same account independently
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ usernameOrEmail: testUser.email, password: testUser.password });
      tokenDeviceB = loginRes.body.data.accessToken;
    } catch (err) {
      console.warn('Sync test suite initialization notice:', err);
    }
  });

  afterAll(async () => {
    try {
      await queryPg('DELETE FROM users WHERE email = $1', [testUser.email]);
      await closeDatabase();
    } catch {}
  });

  it('TEST SYNC-001: Device A uploads media; Device B immediately discovers it via Bootstrap', async () => {
    // 1. Device A uploads photo
    const uploadRes = await request(app)
      .post('/api/v1/migration/bootstrap')
      .set('Authorization', `Bearer ${tokenDeviceA}`)
      .send({
        media: [
          {
            id: photoFromDeviceA,
            fileName: 'device_a_photo.jpg',
            mediaType: 'image',
            fileSizeBytes: 300000,
            isFavourite: false,
          },
        ],
        albums: [],
      });
    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.data.migratedMedia).toBe(1);

    // 2. Device B calls bootstrap to sync
    const bootRes = await request(app)
      .get('/api/v1/sync/bootstrap')
      .set('Authorization', `Bearer ${tokenDeviceB}`);

    expect(bootRes.status).toBe(200);
    expect(bootRes.body.success).toBe(true);
    const mediaIds = bootRes.body.data.media.map((m: any) => m.id);
    expect(mediaIds).toContain(photoFromDeviceA);
  });

  it('TEST SYNC-002: Device B modifies favorite; Device A reflects the change', async () => {
    // 1. Device B favorites the photo
    const favRes = await request(app)
      .patch(`/api/v1/media/${photoFromDeviceA}/favorite`)
      .set('Authorization', `Bearer ${tokenDeviceB}`)
      .send({ favorite: true });

    expect(favRes.status).toBe(200);
    expect(favRes.body.data.favorite).toBe(true);

    // 2. Device A reads media item
    const getRes = await request(app)
      .get(`/api/v1/media/${photoFromDeviceA}`)
      .set('Authorization', `Bearer ${tokenDeviceA}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.is_favorite).toBe(true);
  });

  it('TEST SYNC-003: Device B uploads photo; Device A bootstrap sees both photos (Bi-directional sync)', async () => {
    // 1. Device B uploads photo
    await request(app)
      .post('/api/v1/migration/bootstrap')
      .set('Authorization', `Bearer ${tokenDeviceB}`)
      .send({
        media: [
          {
            id: photoFromDeviceB,
            fileName: 'device_b_photo.jpg',
            mediaType: 'image',
            fileSizeBytes: 450000,
            isFavourite: true,
          },
        ],
        albums: [],
      });

    // 2. Device A bootstrap verifies both photos exist
    const bootRes = await request(app)
      .get('/api/v1/sync/bootstrap')
      .set('Authorization', `Bearer ${tokenDeviceA}`);

    expect(bootRes.status).toBe(200);
    const mediaIds = bootRes.body.data.media.map((m: any) => m.id);
    expect(mediaIds).toContain(photoFromDeviceA);
    expect(mediaIds).toContain(photoFromDeviceB);
    expect(bootRes.body.data.totalMediaCount).toBeGreaterThanOrEqual(2);
  });
});
