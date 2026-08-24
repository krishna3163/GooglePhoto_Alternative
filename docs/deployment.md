# TeleGphoto Deployment Guide (Render + Vercel)

This guide walks you through deploying **TeleGphoto** to production using **Render** (for the Node.js / Express backend) and **Vercel** (for the React / Vite frontend).

---

## 1. Architecture Overview

| Component | Platform | URL / Endpoint |
|---|---|---|
| **Backend API** | **Render** (Web Service) | `https://<your-service-name>.onrender.com` |
| **Frontend Web App** | **Vercel** (Static / SPA) | `https://<your-project>.vercel.app` |
| **Database** | **PostgreSQL** (Supabase / Neon / Render Postgres) | `postgresql://...` |
| **Encrypted File Store** | **Telegram Bot Cloud API** | Direct encrypted chunk storage |

---

## 2. Deploying Backend on Render

### Method A: Using Render Blueprint (Recommended - 1-Click)
1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** $\to$ **Blueprint**.
4. Connect your `krishna3163/GooglePhoto_Alternative` repository.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/User/Desktop/Github/GooglePhoto_Alternative/render.yaml) and pre-configure the Web Service.
6. Fill in the required secret environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `FRONTEND_URL` (Your Vercel frontend URL, e.g. `https://your-app.vercel.app`)
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_DEFAULT_CHAT_ID`
7. Click **Apply**.

---

### Method B: Manual Web Service Setup on Render
1. In the [Render Dashboard](https://dashboard.render.com/), click **New +** $\to$ **Web Service**.
2. Connect your GitHub repository.
3. Configure the following service settings:
   - **Name**: `telegphoto-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your database (e.g. Frankfurt, Oregon, Singapore)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Under **Advanced** $\to$ **Health Check Path**, enter: `/health`

5. Add the **Environment Variables**:
   | Key | Value / Description |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | `postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require` |
   | `JWT_SECRET` | 32+ character random string |
   | `JWT_REFRESH_SECRET` | 32+ character random string |
   | `ACCESS_TOKEN_EXPIRES_IN` | `15m` |
   | `REFRESH_TOKEN_EXPIRES_IN` | `30d` |
   | `FRONTEND_URL` | `https://<your-project>.vercel.app` *(add `,http://localhost:5173` for dev)* |
   | `TELEGRAM_BOT_TOKEN` | Your Telegram Bot token from @BotFather |
   | `TELEGRAM_DEFAULT_CHAT_ID` | Master storage chat ID |

6. Click **Create Web Service**.
7. Once deployed, note your Render URL (e.g., `https://telegphoto-backend.onrender.com`).
8. Verify the backend health endpoint by opening:
   `https://<your-service>.onrender.com/health` $\to$ Should return `{"status":"ok", ...}`

---

## 3. Deploying Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** $\to$ **Project**.
3. Import your GitHub repository: `krishna3163/GooglePhoto_Alternative`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `web-app`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

5. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api/v1` |

   *(Ensure `/api/v1` is at the end of the URL)*

6. Click **Deploy**.

---

## 4. Post-Deployment Verification Checklist

- [ ] **Backend Health**: Visit `https://<render-service>.onrender.com/health` $\to$ Returns HTTP 200 OK.
- [ ] **CORS Configuration**: Verify that `FRONTEND_URL` on Render includes your exact Vercel domain (`https://<your-project>.vercel.app`).
- [ ] **SPA Client Routing**: Refreshing any subpage on Vercel works cleanly thanks to [`web-app/vercel.json`](file:///c:/Users/User/Desktop/Github/GooglePhoto_Alternative/web-app/vercel.json).
- [ ] **Registration & Login**: Create an account from the Vercel frontend to test end-to-end database connectivity and JWT cookies.
- [ ] **Media Upload & Telegram Relay**: Upload a test photo to confirm client encryption and Telegram cloud storage relay.
