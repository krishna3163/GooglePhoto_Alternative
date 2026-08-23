# TeleGphoto System Architecture

## 1. Overview
TeleGphoto is a zero-knowledge, encrypted, cross-device personal media cloud built on:
- **Frontend**: React 19 + TypeScript + Vite + PWA (Hosted on Vercel)
- **Backend API**: Node.js + TypeScript (Express) with strict authorization scoping (Deployable on Render)
- **Database**: PostgreSQL with Prisma ORM for relational metadata, user identity, and monotonic sync streams
- **Media Storage**: Telegram Cloud Storage (via secure backend proxy) for encrypted media binaries
- **Client Cache**: IndexedDB for local-first instant rendering and offline queues

---

## 2. Architecture Diagram

```
                        USER
                         │
                         ▼
              ┌─────────────────────┐
              │   React Frontend    │
              │   Vercel Hosting    │
              │   (IndexedDB Cache) │
              └──────────┬──────────┘
                         │ HTTPS (Bearer JWT)
                         ▼
              ┌─────────────────────┐
              │    Backend API      │
              │ Node.js + TypeScript│
              │ Render Deployment   │
              │                     │
              │ • Auth & Sessions   │
              │ • Media Metadata    │
              │ • Sync Stream Engine│
              │ • Telegram Proxy    │
              └───────┬──────┬──────┘
                      │      │
        SQL Metadata  │      │ Encrypted Media Stream
                      ▼      ▼
             ┌────────────┐ ┌───────────────┐
             │ PostgreSQL │ │   TELEGRAM    │
             │   (Prisma) │ │               │
             │            │ │ Encrypted     │
             │ Users      │ │ Photos        │
             │ Vaults     │ │ Videos        │
             │ Media      │ │ Documents     │
             │ Albums     │ │ Thumbnails    │
             │ SyncEvents │ │               │
             │ Devices    │ └───────────────┘
             └────────────┘
```

---

## 3. Component Responsibilities

### 3.1 Frontend (Vercel)
- **Zero-Knowledge Encryption**: Encrypts and decrypts media files locally in Web Workers using AES-256-GCM and Web Crypto API.
- **Local-First Rendering**: Loads cached media instantly from IndexedDB upon launch.
- **Offline Mutation Queue**: Queues user operations (favorites, tags, moves, deletions) during network interruptions and flushes them when online.
- **On-Device Intelligence**: Generates semantic embeddings, local OCR with Tesseract.js, and local vector searches without leaking private imagery.

### 3.2 Backend (Render)
- **Identity & Authentication**: Argon2id / Bcrypt password verification, issuing short-lived access JWTs and rotated refresh tokens.
- **Strict Authorization Scoping**: Every database operation is strictly filtered by `userId = req.user.id`. No query or route trusts client-supplied user IDs.
- **Sync Stream Generation**: Generates atomic, monotonic `syncVersion` events on every mutation for cross-device convergence.
- **Telegram Proxy**: Safely negotiates Telegram `sendDocument`, `getFile`, and `deleteMessage` APIs without ever exposing bot credentials to the client.

### 3.3 Database (PostgreSQL)
- Persists relational entities: `User`, `Session`, `Device`, `Vault`, `Media`, `Album`, `AlbumMedia`, and `SyncEvent`.
- Indexes optimized for high-performance gallery feeds (`[userId, vaultId, isDeleted, createdAt DESC]`) and incremental sync (`[userId, syncVersion]`).

### 3.4 Media Storage (Telegram)
- Stores opaque, client-encrypted binary blobs (`.enc`).
- Provides unlimited, zero-cost object storage without requiring expensive S3 or cloud buckets.
