# TeleGphoto Backend Service

Production-ready backend API service for **TeleGphoto** providing user authentication, session management, cross-device library synchronization, and a zero-knowledge Telegram storage proxy.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your MongoDB Atlas connection string and Telegram Bot credentials.

### 3. Run in Development Mode
```bash
npm run dev
```

### 4. Run Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🌐 Deploy to Render (Free Tier)

1. Create a **New Web Service** on [Render.com](https://render.com).
2. Connect your GitHub repository: `https://github.com/krishna3163/GooglePhoto_Alternative`.
3. Set the following settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables** in Render Dashboard:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/telegphoto?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<generate-a-strong-random-32-character-secret>`
   - `JWT_REFRESH_SECRET`: `<generate-another-strong-random-32-character-secret>`
   - `FRONTEND_URL`: `https://telegphoto.vercel.app`
   - `TELEGRAM_BOT_TOKEN`: `<your-telegram-bot-token>`
   - `TELEGRAM_DEFAULT_CHAT_ID`: `<your-telegram-chat-id>`
5. Click **Deploy Web Service**.
6. Set the backend URL on your Vercel frontend as `VITE_API_BASE_URL=https://your-service.onrender.com/api`.

---

## 🗄️ MongoDB Atlas Setup (Free M0 Cluster)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a **Free Shared M0 Cluster**.
2. Under **Database Access**, create a database user with `readWriteAnyDatabase` permissions.
3. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) so Render can connect dynamically.
4. Click **Connect** → **Drivers (Node.js)** and copy the connection string into `MONGODB_URI`.

---

## 🔒 Security & Privacy Architecture

- **Zero-Knowledge Encryption**: Media bytes are always encrypted on the browser via `AES-256-GCM` before transmission.
- **No Plaintext Passwords**: Password storage uses `bcrypt` with 12 salt rounds.
- **No Secrets on Client**: Telegram bot tokens and database URIs remain strictly on the backend.
- **Session Revocation**: Stored refresh token hashes allow users to revoke any device session remotely from Settings.
