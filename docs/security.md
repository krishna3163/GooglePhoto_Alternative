# TeleGphoto Security & Privacy Architecture

## 1. Zero-Knowledge Cryptography

TeleGphoto guarantees that neither the server hosting the backend nor Telegram ever possesses access to raw, unencrypted media or master keys.

### 1.1 Envelope Encryption Lifecycle
1. **Master Vault Key ($K_V$)**: 256-bit AES-GCM key generated locally in the browser via `crypto.subtle.generateKey`.
2. **Key Encryption Key ($KEK$)**: Derived from the user's password using `PBKDF2` (100,000 iterations of SHA-256 + 16-byte random salt).
3. **Wrapped Vault Key**: $K_V$ encrypted with $KEK$ using AES-256-GCM. Stored in PostgreSQL/MongoDB `vaults.encryptedVaultKey`.
4. **Emergency Recovery Key ($K_R$)**: 64-hex random phrase generated at registration. $K_V$ is also wrapped with $K_R$ for offline emergency recovery if the password is forgotten.
5. **Media Encryption**: Every media asset and thumbnail is encrypted with $K_V$ using a unique 12-byte random IV.

---

## 2. Server-Side Scoping & Authorization

### 2.1 Principle of Least Privilege
- Every incoming request to protected routes passes through `requireAuth` middleware.
- The authenticated user's ID is extracted directly from the verified JWT:
  ```typescript
  const userId = req.user.id;
  ```
- All database queries enforce scoping:
  ```sql
  SELECT * FROM media WHERE user_id = $1 AND id = $2;
  ```
- Any request attempting to access another user's `vaultId`, `mediaId`, or `albumId` returns `404 Not Found` or `403 Forbidden`.

---

## 3. Secret Management & Telegram Proxying

- **No Secrets on Client**: Telegram bot tokens, API hashes, database connection strings, and JWT signing keys are completely absent from the client code and build artifacts.
- **Backend Proxy**: Render backend communicates directly with `https://api.telegram.org` over TLS.
- **Session Protection**: Refresh tokens are stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with SHA-256 token hashing in the database.
