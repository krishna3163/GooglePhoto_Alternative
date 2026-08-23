# TeleGphoto Cross-Device Sync & Conflict Engine

## 1. Monotonic Cursor-Based Synchronization
TeleGphoto avoids heavy full-database re-downloads by implementing a monotonic cursor sync model.

### Sync Flow
```
Device A (Uploads / Updates Media)
   │
   ▼
Backend updates Media record
   │
   ▼
Backend creates SyncEvent (syncVersion = N + 1)
   │
   ▼
Device B polls: GET /api/sync?cursor=N
   │
   ▼
Backend returns:
{
  "nextCursor": N + 1,
  "hasMore": false,
  "changes": [
    {
      "syncVersion": N + 1,
      "entityType": "media",
      "operation": "UPDATE",
      "data": { "id": "...", "isFavorite": true }
    }
  ]
}
   │
   ▼
Device B applies delta to local IndexedDB
   │
   ▼
Device B updates local cursor to N + 1
```

---

## 2. Fresh Device Bootstrap Flow

When a user logs into a brand new device or an Incognito browser session:

1. **Authentication**: User logs in with Username and Password.
2. **Key Recovery**: Password derives the Key Encryption Key (KEK) using PBKDF2-SHA256, unwrapping the Master Vault Key $K_V$.
3. **Bootstrap Request**: Client calls `GET /api/sync/bootstrap`.
4. **Metadata Insertion**: The backend returns user vaults, albums, and paginated media metadata records.
5. **Progressive Storage**: Client writes metadata directly into local IndexedDB and renders the photo gallery immediately.
6. **Lazy Binary Loading**: Thumbnails and full photos are retrieved and decrypted from Telegram only on-demand when viewport elements become visible or when a photo is opened.

---

## 3. Offline Queue & Conflict Resolution

### 3.1 Offline Actions
When offline:
- User actions (Favorite, Trash, Restore, Tag, Rename, Create Album) generate a local `SyncOperation` stored in `telegphoto_sync_queue`.
- The UI updates optimistically.

### 3.2 Network Restoration
- When the `online` event fires, the client flushes pending operations via `POST /api/sync/push` or `POST /api/v1/sync/mutations`.
- The backend applies changes atomically, updates `updatedAt`, increments `syncVersion`, and publishes `SyncEvent` records.

### 3.3 Conflict Resolution Strategy
- **Last-Write-Wins (LWW)**: Determined by server-assigned `updatedAt` and `syncVersion`.
- **Field-Level Isolation**: Distinct fields (e.g. `fileName` updated on PC while `isFavorite` updated on Mobile) merge cleanly.
- **Album Preservation**: Deleting an album deletes only the `Album` and `AlbumMedia` links; underlying `Media` assets are strictly preserved.
