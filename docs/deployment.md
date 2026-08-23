# TeleGphoto Deployment Guide

## 1. Architecture Overview
- **Frontend**: Vercel (Production URL: `https://telegphoto.vercel.app`)
- **Backend API**: Render Web Service (Node.js)
- **Database**: PostgreSQL (Neon, Supabase, or Render PostgreSQL) / MongoDB Atlas
- **Storage**: Telegram Cloud Storage

---

## 2. Backend Deployment on Render

### Step-by-Step:
1. Navigate to [Render Dashboard](https://dashboard.render.com/) and click **New +** $\to$ **Web Service**.
2. Connect the GitHub repository: `https://github.com/krishna3163/GooglePhoto_Alternative`.
3. Configure the build parameters:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
   JWT_SECRET=<32-char-random-secret>
   JWT_REFRESH_SECRET=<32-char-random-secret>
   FRONTEND_URL=https://telegphoto.vercel.app,http://localhost:5173
   TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
   TELEGRAM_DEFAULT_CHAT_ID=<your-telegram-chat-id>
   ```
5. Click **Deploy Web Service**.

---

## 3. Frontend Deployment on Vercel

1. In the Vercel project dashboard, navigate to **Settings** $\to$ **Environment Variables**.
2. Add:
   ```env
   VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
   ```
3. Trigger a redeployment.
