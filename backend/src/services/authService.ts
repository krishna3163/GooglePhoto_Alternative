import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { queryPg } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
  initialVault?: {
    name: string;
    encryptedVaultKey: string;
    wrappedWithRecovery?: string;
    salt: string;
    keyVersion?: number;
  };
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static async register(input: RegisterInput): Promise<{ user: any; tokens: AuthTokens; defaultVault: any }> {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();

    // 1. Check duplicate username or email
    const existing = await queryPg(
      'SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1',
      [username, email]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.username.toLowerCase() === username.toLowerCase()) {
        throw new AppError(409, 'USERNAME_TAKEN', 'This username is already taken');
      }
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }

    // 2. Strong password hash (bcrypt rounds 12)
    const passwordHash = await bcrypt.hash(input.password, 12);

    // 3. Insert User
    const userRes = await queryPg(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, passwordHash]
    );
    const user = userRes.rows[0];
    const userId = user.id;

    // 4. Create default Personal Vault
    const vaultRes = await queryPg(
      `INSERT INTO vaults (user_id, name, encrypted_vault_key, wrapped_with_recovery, salt, key_version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, encrypted_vault_key, wrapped_with_recovery, salt, key_version`,
      [
        userId,
        input.initialVault?.name || 'Personal Vault',
        input.initialVault?.encryptedVaultKey || 'initial_empty_encrypted_key',
        input.initialVault?.wrappedWithRecovery || null,
        input.initialVault?.salt || 'initial_salt',
        input.initialVault?.keyVersion || 1,
      ]
    );
    const vault = vaultRes.rows[0];

    // 5. Initialize Sync Event
    await queryPg(
      `INSERT INTO sync_events (user_id, entity_type, entity_id, operation, sync_version, payload)
       VALUES ($1, 'vault', $2, 'CREATE', 1, $3)`,
      [userId, vault.id, JSON.stringify({ name: vault.name })]
    );

    // 6. Create Session and issue tokens
    const deviceId = input.deviceId || crypto.randomUUID();
    const deviceName = input.deviceName || 'Web Browser';
    const tokens = await this.createSession(userId, user.username, user.email, deviceId, deviceName);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      defaultVault: {
        id: vault.id,
        name: vault.name,
        encryptedVaultKey: vault.encrypted_vault_key,
        wrappedWithRecovery: vault.wrapped_with_recovery,
        salt: vault.salt,
        keyVersion: vault.key_version,
      },
      tokens,
    };
  }

  public static async login(input: LoginInput): Promise<{ user: any; tokens: AuthTokens; vaults: any[] }> {
    const query = input.usernameOrEmail.trim().toLowerCase();

    // 1. Fetch user by username or email
    const res = await queryPg(
      'SELECT id, username, email, password_hash, status FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1',
      [query]
    );

    if (res.rows.length === 0) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const user = res.rows[0];
    if (user.status === 'suspended') {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
    }

    // 2. Validate password
    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    // 3. Fetch user vaults
    const vaultsRes = await queryPg(
      'SELECT id, name, description, encrypted_vault_key, wrapped_with_recovery, salt, key_version FROM vaults WHERE user_id = $1 ORDER BY created_at ASC',
      [user.id]
    );

    // 4. Create Session
    const deviceId = input.deviceId || crypto.randomUUID();
    const deviceName = input.deviceName || 'Web Browser';
    const tokens = await this.createSession(user.id, user.username, user.email, deviceId, deviceName);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      vaults: vaultsRes.rows.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        encryptedVaultKey: v.encrypted_vault_key,
        wrappedWithRecovery: v.wrapped_with_recovery,
        salt: v.salt,
        keyVersion: v.key_version,
      })),
      tokens,
    };
  }

  public static async refreshSession(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

      const sessionRes = await queryPg(
        'SELECT id, user_id, refresh_token_hash, device_id, device_name FROM sessions WHERE id = $1 AND revoked_at IS NULL LIMIT 1',
        [payload.sessionId]
      );

      if (sessionRes.rows.length === 0) {
        throw new AppError(401, 'SESSION_EXPIRED', 'Session has expired or was revoked');
      }

      const session = sessionRes.rows[0];
      const tokenHash = this.hashToken(refreshToken);

      if (session.refresh_token_hash !== tokenHash) {
        // Revoke immediately if reused
        await queryPg('UPDATE sessions SET revoked_at = NOW() WHERE id = $1', [session.id]);
        throw new AppError(401, 'TOKEN_COMPROMISED', 'Refresh token reused or invalidated');
      }

      const userRes = await queryPg('SELECT id, username, email FROM users WHERE id = $1 LIMIT 1', [session.user_id]);
      if (userRes.rows.length === 0) {
        throw new AppError(401, 'USER_NOT_FOUND', 'User not found');
      }
      const user = userRes.rows[0];

      // Rotate Refresh Token
      const newRefreshToken = jwt.sign(
        { sessionId: session.id, userId: user.id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      const newAccessToken = jwt.sign(
        {
          sub: user.id,
          userId: user.id,
          username: user.username,
          email: user.email,
          sessionId: session.id,
          deviceId: session.device_id,
        },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      await queryPg(
        'UPDATE sessions SET refresh_token_hash = $1, last_used_at = NOW() WHERE id = $2',
        [this.hashToken(newRefreshToken), session.id]
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    }
  }

  public static async logout(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await queryPg('UPDATE sessions SET revoked_at = NOW() WHERE id = $1', [sessionId]);
  }

  public static async logoutAllDevices(userId: string): Promise<void> {
    await queryPg('UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
  }

  public static async changePassword(
    userId: string,
    currentPass: string,
    newPass: string,
    newEncryptedVaultKeys: { vaultId: string; encryptedVaultKey: string; salt: string }[]
  ): Promise<void> {
    const userRes = await queryPg('SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (userRes.rows.length === 0) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(currentPass, user.password_hash);
    if (!isMatch) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Current password does not match');
    }

    const newHash = await bcrypt.hash(newPass, 12);
    await queryPg('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

    for (const item of newEncryptedVaultKeys) {
      await queryPg(
        'UPDATE vaults SET encrypted_vault_key = $1, salt = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4',
        [item.encryptedVaultKey, item.salt, item.vaultId, userId]
      );
    }
  }

  private static async createSession(
    userId: string,
    username: string,
    email: string,
    deviceId: string,
    deviceName: string
  ): Promise<AuthTokens> {
    // 1. Insert session record
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const sessionRes = await queryPg(
      `INSERT INTO sessions (user_id, device_id, device_name, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, '', $4)
       RETURNING id`,
      [userId, deviceId, deviceName, expiresAt]
    );
    const sessionId = sessionRes.rows[0].id;

    // 2. Track device
    await queryPg(
      `INSERT INTO devices (user_id, device_id, device_name, last_seen_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, device_id) DO UPDATE SET device_name = $3, last_seen_at = NOW()`,
      [userId, deviceId, deviceName]
    );

    // 3. Issue Tokens
    const refreshToken = jwt.sign(
      { sessionId, userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    const accessToken = jwt.sign(
      {
        sub: userId,
        userId,
        username,
        email,
        sessionId,
        deviceId,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 4. Update session with refresh token hash
    await queryPg('UPDATE sessions SET refresh_token_hash = $1 WHERE id = $2', [
      this.hashToken(refreshToken),
      sessionId,
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }
}
