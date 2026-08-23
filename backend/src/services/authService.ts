import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { env } from '../config/env.js';
import { collections } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import type { UserDocument, SessionDocument, VaultDocument } from '../types/index.js';

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
    const users = collections.users();
    const vaults = collections.vaults();
    const syncRevs = collections.syncRevisions();

    const usernameNormalized = input.username.trim().toLowerCase();
    const emailNormalized = input.email.trim().toLowerCase();

    // Check duplicate username or email
    const existingUser = await users.findOne({
      $or: [{ usernameNormalized }, { emailNormalized }],
    });

    if (existingUser) {
      if (existingUser.usernameNormalized === usernameNormalized) {
        throw new AppError(409, 'USERNAME_TAKEN', 'This username is already taken');
      }
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }

    // Strong password hash (bcrypt rounds 12)
    const passwordHash = await bcrypt.hash(input.password, 12);

    const userDoc: UserDocument = {
      username: input.username.trim(),
      usernameNormalized,
      email: input.email.trim(),
      emailNormalized,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    const insertResult = await users.insertOne(userDoc);
    const userId = insertResult.insertedId;

    // Create default Personal Vault
    const vaultDoc: VaultDocument = {
      userId,
      name: input.initialVault?.name || 'Personal Vault',
      encryptedVaultKey: input.initialVault?.encryptedVaultKey || 'initial_empty_encrypted_key',
      wrappedWithRecovery: input.initialVault?.wrappedWithRecovery,
      salt: input.initialVault?.salt || 'initial_salt',
      keyVersion: input.initialVault?.keyVersion || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const vaultResult = await vaults.insertOne(vaultDoc);

    // Initialize Sync Revision tracker
    await syncRevs.insertOne({
      userId,
      currentRevision: 1,
      updatedAt: new Date(),
    });

    // Create active session and generate tokens
    const deviceId = input.deviceId || crypto.randomUUID();
    const deviceName = input.deviceName || 'Web Browser';
    const tokens = await this.createSession(userId, input.username.trim(), input.email.trim(), deviceId, deviceName);

    return {
      user: {
        id: userId.toString(),
        username: userDoc.username,
        email: userDoc.email,
      },
      defaultVault: {
        id: vaultResult.insertedId.toString(),
        name: vaultDoc.name,
        encryptedVaultKey: vaultDoc.encryptedVaultKey,
        wrappedWithRecovery: vaultDoc.wrappedWithRecovery,
        salt: vaultDoc.salt,
        keyVersion: vaultDoc.keyVersion,
      },
      tokens,
    };
  }

  public static async login(input: LoginInput): Promise<{ user: any; tokens: AuthTokens; vaults: any[] }> {
    const users = collections.users();
    const vaults = collections.vaults();

    const normalizedQuery = input.usernameOrEmail.trim().toLowerCase();
    const user = await users.findOne({
      $or: [{ usernameNormalized: normalizedQuery }, { emailNormalized: normalizedQuery }],
    });

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    if (user.status === 'suspended') {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const deviceId = input.deviceId || crypto.randomUUID();
    const deviceName = input.deviceName || 'Web Browser';
    const tokens = await this.createSession(user._id!, user.username, user.email, deviceId, deviceName);

    const userVaults = await vaults.find({ userId: user._id }).toArray();

    return {
      user: {
        id: user._id!.toString(),
        username: user.username,
        email: user.email,
        telegramConnectionId: user.telegramConnectionId,
      },
      vaults: userVaults.map((v) => ({
        id: v._id!.toString(),
        name: v.name,
        description: v.description,
        encryptedVaultKey: v.encryptedVaultKey,
        wrappedWithRecovery: v.wrappedWithRecovery,
        salt: v.salt,
        keyVersion: v.keyVersion,
      })),
      tokens,
    };
  }

  public static async refreshSession(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
      const sessions = collections.sessions();
      const users = collections.users();

      const session = await sessions.findOne({
        _id: new ObjectId(payload.sessionId),
        revokedAt: { $exists: false },
      });

      if (!session) {
        throw new AppError(401, 'SESSION_EXPIRED', 'Session has expired or was revoked');
      }

      const tokenHash = this.hashToken(refreshToken);
      if (session.refreshTokenHash !== tokenHash) {
        // Potential token reuse / compromise: revoke session immediately
        await sessions.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
        throw new AppError(401, 'TOKEN_COMPROMISED', 'Refresh token reused or invalidated');
      }

      const user = await users.findOne({ _id: session.userId });
      if (!user) {
        throw new AppError(401, 'USER_NOT_FOUND', 'User not found');
      }

      // Rotate Refresh Token
      const newRefreshToken = jwt.sign(
        { sessionId: session._id!.toString(), userId: user._id!.toString() },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      const newAccessToken = jwt.sign(
        {
          sub: user._id!.toString(),
          userId: user._id!.toString(),
          username: user.username,
          email: user.email,
          sessionId: session._id!.toString(),
          deviceId: session.deviceId,
        },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      await sessions.updateOne(
        { _id: session._id },
        {
          $set: {
            refreshTokenHash: this.hashToken(newRefreshToken),
            lastUsedAt: new Date(),
          },
        }
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    }
  }

  public static async logout(sessionId: string): Promise<void> {
    if (!sessionId) return;
    const sessions = collections.sessions();
    await sessions.updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { revokedAt: new Date() } }
    );
  }

  public static async logoutAllDevices(userId: string): Promise<void> {
    const sessions = collections.sessions();
    await sessions.updateMany(
      { userId: new ObjectId(userId), revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
  }

  public static async changePassword(
    userId: string,
    currentPass: string,
    newPass: string,
    newEncryptedVaultKeys: { vaultId: string; encryptedVaultKey: string; salt: string }[]
  ): Promise<void> {
    const users = collections.users();
    const vaults = collections.vaults();

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Current password does not match');
    }

    const newHash = await bcrypt.hash(newPass, 12);
    await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    );

    // Update re-wrapped vault keys
    for (const item of newEncryptedVaultKeys) {
      await vaults.updateOne(
        { _id: new ObjectId(item.vaultId), userId: user._id },
        {
          $set: {
            encryptedVaultKey: item.encryptedVaultKey,
            salt: item.salt,
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  private static async createSession(
    userId: ObjectId,
    username: string,
    email: string,
    deviceId: string,
    deviceName: string
  ): Promise<AuthTokens> {
    const sessions = collections.sessions();
    const devices = collections.devices();

    const sessionDoc: SessionDocument = {
      userId,
      deviceId,
      deviceName,
      userAgentSummary: deviceName,
      refreshTokenHash: '',
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    const sessionRes = await sessions.insertOne(sessionDoc);
    const sessionId = sessionRes.insertedId.toString();

    // Register / update device
    await devices.updateOne(
      { userId, deviceId },
      {
        $set: {
          deviceName,
          platform: 'Web',
          browser: 'Browser',
          lastActiveAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const refreshToken = jwt.sign(
      { sessionId, userId: userId.toString() },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    const accessToken = jwt.sign(
      {
        sub: userId.toString(),
        userId: userId.toString(),
        username,
        email,
        sessionId,
        deviceId,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    await sessions.updateOne(
      { _id: sessionRes.insertedId },
      { $set: { refreshTokenHash: this.hashToken(refreshToken) } }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }
}
