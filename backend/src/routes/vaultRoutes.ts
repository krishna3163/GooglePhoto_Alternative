import { Router, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { VaultDocument } from '../types/index.js';

const router = Router();

// GET /api/v1/vaults
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const vaultsColl = collections.vaults();

    const vaults = await vaultsColl.find({ userId: userObjectId }).toArray();
    res.json({
      success: true,
      data: vaults.map((v) => ({
        id: v._id!.toString(),
        name: v.name,
        description: v.description,
        encryptedVaultKey: v.encryptedVaultKey,
        wrappedWithRecovery: v.wrappedWithRecovery,
        salt: v.salt,
        keyVersion: v.keyVersion,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/vaults
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userObjectId = new ObjectId(req.user!.id);
    const vaultsColl = collections.vaults();
    const { name, description, encryptedVaultKey, wrappedWithRecovery, salt, keyVersion } = req.body || {};

    if (!name || !encryptedVaultKey || !salt) {
      throw new AppError(400, 'MISSING_FIELDS', 'Vault name, encrypted key, and salt are required');
    }

    const doc: VaultDocument = {
      userId: userObjectId,
      name: name.trim(),
      description,
      encryptedVaultKey,
      wrappedWithRecovery,
      salt,
      keyVersion: keyVersion || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await vaultsColl.insertOne(doc);
    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        name: doc.name,
        description: doc.description,
        encryptedVaultKey: doc.encryptedVaultKey,
        wrappedWithRecovery: doc.wrappedWithRecovery,
        salt: doc.salt,
        keyVersion: doc.keyVersion,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
