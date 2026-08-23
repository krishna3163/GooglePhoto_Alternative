import { Router, Response, NextFunction } from 'express';
import { queryPg } from '../config/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/v1/vaults
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vaultsRes = await queryPg('SELECT * FROM vaults WHERE user_id = $1 ORDER BY created_at ASC', [req.user!.id]);
    res.json({
      success: true,
      data: vaultsRes.rows.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        encryptedVaultKey: v.encrypted_vault_key,
        wrappedWithRecovery: v.wrapped_with_recovery,
        salt: v.salt,
        keyVersion: v.key_version,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/vaults
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, encryptedVaultKey, wrappedWithRecovery, salt, keyVersion } = req.body || {};

    if (!name || !encryptedVaultKey || !salt) {
      throw new AppError(400, 'MISSING_FIELDS', 'Vault name, encrypted key, and salt are required');
    }

    const insertRes = await queryPg(
      `INSERT INTO vaults (user_id, name, description, encrypted_vault_key, wrapped_with_recovery, salt, key_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user!.id,
        name.trim(),
        description || null,
        encryptedVaultKey,
        wrappedWithRecovery || null,
        salt,
        keyVersion || 1,
      ]
    );

    const doc = insertRes.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        encryptedVaultKey: doc.encrypted_vault_key,
        wrappedWithRecovery: doc.wrapped_with_recovery,
        salt: doc.salt,
        keyVersion: doc.key_version,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
