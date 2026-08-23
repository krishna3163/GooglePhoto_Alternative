import { MongoClient, Db, Collection } from 'mongodb';
import { env } from './env.js';
import type {
  UserDocument,
  SessionDocument,
  VaultDocument,
  MediaDocument,
  AlbumDocument,
  SyncRevisionDocument,
  DeviceDocument,
  TelegramConnDocument,
} from '../types/index.js';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectDatabase(): Promise<Db | null> {
  if (dbInstance) return dbInstance;

  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) {
    console.log('ℹ No MONGODB_URI configured. Running with PostgreSQL / Prisma data layer.');
    return null;
  }

  try {
    client = new MongoClient(mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    dbInstance = client.db();
    console.log('✓ Successfully connected to MongoDB database:', dbInstance.databaseName);

    // Initialize required indexes
    await setupIndexes(dbInstance);

    return dbInstance;
  } catch (error: any) {
    console.warn('⚠ MongoDB connection note:', error?.message || error);
    // Do not throw fatal error if DATABASE_URL or mock is available
    return null;
  }
}

export function getDb(): Db {
  if (!dbInstance) {
    throw new Error('Database not initialized. Please ensure MONGODB_URI or DATABASE_URL is set.');
  }
  return dbInstance;
}

export function getCollection<T extends Record<string, any>>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

export const collections = {
  users: () => getCollection<UserDocument>('users'),
  sessions: () => getCollection<SessionDocument>('sessions'),
  vaults: () => getCollection<VaultDocument>('vaults'),
  media: () => getCollection<MediaDocument>('media'),
  albums: () => getCollection<AlbumDocument>('albums'),
  syncRevisions: () => getCollection<SyncRevisionDocument>('sync_revisions'),
  devices: () => getCollection<DeviceDocument>('devices'),
  telegramConnections: () => getCollection<TelegramConnDocument>('telegram_connections'),
};

export async function setupIndexes(db: Db): Promise<void> {
  try {
    // 1. Users collection indexes
    await db.collection('users').createIndex({ usernameNormalized: 1 }, { unique: true });
    await db.collection('users').createIndex({ emailNormalized: 1 }, { unique: true });

    // 2. Sessions collection indexes
    await db.collection('sessions').createIndex({ userId: 1, deviceId: 1 });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // 3. Vaults collection indexes
    await db.collection('vaults').createIndex({ userId: 1, _id: 1 });

    // 4. Media collection indexes
    await db.collection('media').createIndex({ userId: 1, vaultId: 1, createdAt: -1 });
    await db.collection('media').createIndex({ userId: 1, vaultId: 1, trashed: 1, createdAt: -1 });
    await db.collection('media').createIndex({ userId: 1, vaultId: 1, favorite: 1 });
    await db.collection('media').createIndex({ userId: 1, id: 1 }, { unique: true });

    // 5. Albums collection indexes
    await db.collection('albums').createIndex({ userId: 1, vaultId: 1, id: 1 }, { unique: true });

    // 6. Sync revisions
    await db.collection('sync_revisions').createIndex({ userId: 1 }, { unique: true });

    // 7. Devices
    await db.collection('devices').createIndex({ userId: 1, deviceId: 1 }, { unique: true });

    console.log('✓ MongoDB indexes verified & created.');
  } catch (err) {
    console.warn('Notice while configuring database indexes:', err);
  }
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    console.log('MongoDB connection closed.');
  }
}
