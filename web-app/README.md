# TelePhoto Web 🌐

**Google Photos UI for your Telegram Cloud**

TelePhoto Web is a premium web interface for the TelePhoto Cloud project, designed to look and feel exactly like Google Photos while utilizing Telegram as an unlimited backend storage.

## ✨ Features

- **Google Photos UI**: A pixel-perfect clone of the modern Google Photos dark theme.
- **Unlimited Storage**: Leverages the Telegram Bot API to store photos and videos for free.
- **Smart Search**: Search through your memories by filename or extracted text (OCR).
- **OCR Integration**: Automatically extracts text from uploaded images using Tesseract.js.
- **Drag & Drop Upload**: Easily upload files from your computer directly to your Telegram channel.
- **Responsive Design**: Works beautifully on both desktop and mobile browsers.

## 🚀 Getting Started

### 1. Installation
```bash
cd web-app
npm install
```

### 2. Configuration
When you first open the app, you will be prompted to enter your:
- **Telegram Bot Token**: Created via @BotFather.
- **Chat ID**: The unique ID of your private Telegram channel/vault.

### 3. Development
```bash
npm run dev
```

## 🛠 Tech Stack
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Icons**: Lucide React
- **OCR**: Tesseract.js
- **API**: Axios (Telegram Bot API)
- **Styling**: Vanilla CSS (Premium Look & Feel)

## 📸 UI Reference
The interface is modeled after the latest Google Photos design, including:
- Sticky date headers.
- Masonry-style photo grid.
- Interactive search bar.
- Material Design 3 inspired modals and components.
