import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, closeDatabase, queryPg } from '../src/config/database.js';
import { TelegramStorageService } from '../src/services/telegramStorage.js';

describe('Phase 16 & Production Isolation: Vault Isolation & Mock Protection Tests', () => {
  const ts = Date.now();
  const testUser = {
    username: `vault_user_${ts}`,
    email: `vault_user_${ts}@test.local`,
    password: 'VaultUserSecure2026!',
    initialVault: { name: 'Personal Vault', encryptedVaultKey: 'key_personal', salt: 'salt_1' },
  };

  let token = '';
  let userId = '';
  let personalVaultId = '';
  let familyVaultId = '';
  let docVaultId = '';

  let personalMediaId = `media_personal_${ts}`;
  let familyMediaId = `media_family_${ts}`;

  beforeAll(async () => {
    try {
      await connectDatabase();

      // 1. Register test user
      const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
      token = regRes.body.data.accessToken;
      userId = regRes.body.data.user.id;
      personalVaultId = regRes.body.data.defaultVault.id;

      // 2. Create Family Vault
      const famRes = await request(app)
        .post('/api/v1/vaults')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Family Vault',
          description: 'Family memories and shared albums',
          encryptedVaultKey: 'key_family',
          salt: 'salt_2',
        });
      familyVaultId = famRes.body.data.id;

      // 3. Create Documents Vault
      const docRes = await request(app)
        .post('/api/v1/vaults')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Documents Vault',
          description: 'Secure documents and PDFs',
          encryptedVaultKey: 'key_docs',
          salt: 'salt_3',
        });
      docVaultId = docRes.body.data.id;

      // 4. Upload photo to Personal Vault
      await request(app)
        .post('/api/v1/migration/bootstrap')
        .set('Authorization', `Bearer ${token}`)
        .send({
          media: [
            {
              id: personalMediaId,
              vaultId: personalVaultId,
              fileName: 'personal_trip.jpg',
              mediaType: 'image',
              fileSizeBytes: 1024 * 300,
              isFavourite: false,
            },
          ],
          albums: [],
        });

      // 5. Upload photo to Family Vault
      await request(app)
        .post('/api/v1/migration/bootstrap')
        .set('Authorization', `Bearer ${token}`)
        .send({
          media: [
            {
              id: familyMediaId,
              vaultId: familyVaultId,
              fileName: 'family_gathering.jpg',
              mediaType: 'image',
              fileSizeBytes: 1024 * 400,
              isFavourite: true,
            },
          ],
          albums: [],
        });
    } catch (err) {
      console.warn('Vault isolation test suite initialization notice:', err);
    }
  });

  afterAll(async () => {
    try {
      await queryPg('DELETE FROM users WHERE id = $1', [userId]);
      await closeDatabase();
    } catch {}
  });

  it('TEST VAULT-001: User can list all created vaults', async () => {
    const res = await request(app)
      .get('/api/v1/vaults')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const vaultNames = res.body.data.map((v: any) => v.name);
    expect(vaultNames).toContain('Personal Vault');
    expect(vaultNames).toContain('Family Vault');
    expect(vaultNames).toContain('Documents Vault');
  });

  it('TEST VAULT-002: Querying media by Personal Vault ID returns only Personal Vault items', async () => {
    const res = await request(app)
      .get(`/api/v1/media?vaultId=${personalVaultId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const items = res.body.data.items;
    const itemIds = items.map((i: any) => i.id);

    expect(itemIds).toContain(personalMediaId);
    expect(itemIds).not.toContain(familyMediaId);
  });

  it('TEST VAULT-003: Querying media by Family Vault ID returns only Family Vault items', async () => {
    const res = await request(app)
      .get(`/api/v1/media?vaultId=${familyVaultId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const items = res.body.data.items;
    const itemIds = items.map((i: any) => i.id);

    expect(itemIds).toContain(familyMediaId);
    expect(itemIds).not.toContain(personalMediaId);
  });

  it('TEST STORAGE-001: TelegramStorageService in production mode throws error for mock credentials', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      // Temporarily simulate production environment
      process.env.NODE_ENV = 'production';

      await expect(
        TelegramStorageService.uploadEncryptedMedia(
          Buffer.from('test_ciphertext'),
          'photo.jpg',
          'chat_123',
          'mock_custom_bot_token'
        )
      ).rejects.toThrow();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
