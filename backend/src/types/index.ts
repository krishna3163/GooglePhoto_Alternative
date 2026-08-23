import { ObjectId } from 'mongodb';

export interface UserDocument {
  _id?: ObjectId;
  username: string;
  usernameNormalized: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  telegramConnectionId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'suspended';
}

export interface SessionDocument {
  _id?: ObjectId;
  userId: ObjectId;
  deviceId: string;
  deviceName: string;
  userAgentSummary: string;
  refreshTokenHash: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface VaultDocument {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  encryptedVaultKey: string; // Base64 wrapped with user KEK
  wrappedWithRecovery?: string; // Base64 wrapped with recovery key
  salt: string; // Base64
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaDocument {
  _id?: ObjectId;
  id: string; // Client-side stable UUID
  userId: ObjectId;
  vaultId: string;
  fileName: string;
  mimeType: string;
  mediaType: 'image' | 'video' | 'document';
  size: number;
  width?: number;
  height?: number;
  favorite: boolean;
  trashed: boolean;
  deletedAt?: Date;
  tags?: string[];
  albumIds?: string[];
  exifSummary?: Record<string, any>;
  telegram: {
    original: {
      chatId: string;
      messageId: number;
      fileId: string;
    };
    thumbnail?: {
      chatId: string;
      messageId: number;
      fileId: string;
    };
  };
  encryption: {
    version: number;
    algorithm: 'AES-256-GCM';
    iv: string;
    salt?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumDocument {
  _id?: ObjectId;
  id: string; // Client-side stable UUID
  userId: ObjectId;
  vaultId: string;
  name: string;
  description?: string;
  mediaIds: string[];
  coverMediaId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncRevisionDocument {
  _id?: ObjectId;
  userId: ObjectId;
  currentRevision: number;
  updatedAt: Date;
}

export interface DeviceDocument {
  _id?: ObjectId;
  userId: ObjectId;
  deviceId: string;
  deviceName: string;
  platform: string;
  browser: string;
  lastActiveAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface TelegramConnDocument {
  _id?: ObjectId;
  userId: ObjectId;
  botTokenEncrypted?: string;
  chatId: string;
  botUsername?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  sessionId: string;
  deviceId: string;
}
