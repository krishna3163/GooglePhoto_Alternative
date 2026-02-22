# 🚀 TeleGphoto — Unlimited Cloud Storage

**TeleGphoto** is a premium, open-source personal cloud storage solution that uses the **Telegram Bot API** as a backend. It allows you to transform Telegram's unlimited storage into your personal, beautiful, and private photo & document gallery.

---

## ✨ Features

- **🛡️ Private & Secure**: All your files are stored in your own private Telegram channel. No third-party servers store your data.
- **☁️ Unlimited Storage**: Leverage Telegram's infinite storage capacity for free.
- **📱 PWA Ready**: Install it as a native app on your Android or iOS device for a seamless experience.
- **🎨 Premium UI/UX**: Designed with a modern Glassmorphism aesthetic featuring dark mode and smooth animations.
- **🔍 Smart Search (OCR)**: Automatically extracts text from your images for easy searching.
- **📁 Multi-Format Support**: Support for Photos, Videos, and PDFs with in-place previews.
- **⚡ Fast Performance**: Optimized for speed with lazy loading and smart caching.

---

## 🛠️ Setup Guide

### 1. Create your Bot (Token)
- Open Telegram and search for **@BotFather**.
- Type `/newbot` and follow the instructions to get your **HTTP API Token**.

### 2. Create your Vault (Chat ID)
- Create a **New Private Channel** in Telegram.
- Add your bot as an **Administrator** with "Post Messages" permissions.
- Forward any message from the channel to **@userinfobot** to get your **Chat ID** (starts with `-100`).

### 3. Connect & Use
- Open the web application and enter your **Token** and **Chat ID** in the settings.
- Start uploading!

---

## 💻 Technical Stack

- **Frontend**: React + TypeScript
- **Styling**: Vanilla CSS (Premium Glassmorphism Design)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **API**: Telegram Bot API
- **Build Tool**: Vite

---

## 📦 Project Structure

```text
├── release/               # Final production builds
│   └── TeleGphoto_v1.0.apk  # Final Android Release APK
├── web-app/               # Core web application code
│   ├── src/               # React source files
│   ├── public/            # Static assets & Service Worker
│   └── package.json       # Dependencies
└── README.md              # Project documentation
```

---

## 🚀 Installation & Build

### Run Locally
```bash
cd web-app
npm install
npm run dev
```

### Install as App (PWA)
1. Open the website in Chrome (Android) or Safari (iOS).
2. For Android: A popup will appear, or tap ⋮ → **Install App**.
3. For iOS: Tap "Share" → **Add to Home Screen**.

### Android App
You can find the finalized Android app in the `/release` folder.

---

## 🤝 Contribution

We welcome contributions! If you have ideas for new features or bug fixes, feel free to open a Pull Request.

**Built with ❤️ in India by Krishna Kumar.**

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
