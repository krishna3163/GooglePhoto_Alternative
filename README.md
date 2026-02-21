# TelePhoto Cloud 🚀
**Cloud Storage powered by Telegram**

TelePhoto Cloud is a robust React Native Expo application that transforms your Telegram account into a powerful cloud storage system similar to Google Photos and Google Drive. It automatically backs up your photos and videos, allows manual document uploads, and provides a sleek interface for browsing, searching (with OCR), and organizing your files.

---

## ✨ Features

### 📸 Smart Gallery & Photo Backup
*   **Automatic Sync**: Background engine scans your device and uploads new photos/videos to Telegram.
*   **Media Support**: Full support for Images (JPEG, PNG), Videos (MP4), and Documents (PDF, DOCX, TXT).
*   **Selective Sync**: Choose specific device folders/albums to back up.
*   **Dashboard**: Real-time stats on sync status and storage usage.

### 🔍 Search & Intelligence
*   **OCR Text Recognition**: Automatically extracts text from images after upload.
*   **Deep Search**: Find photos by typing text contained *inside* the image (e.g., search "receipt" to find a photo of a bill).
*   **Global Search**: Filter by filename, media type, or extracted text.

### 📂 Cloud Drive & File Management
*   **Cloud Browsing**: View all your Telegram-stored files in a Google Drive-style interface.
*   **Folder System**: Organize files into custom folders.
*   **Universal Viewer**: Preview images, watch videos, and read documents directly inside the app.
*   **Download & Share**: Re-download any cloud file to your device's local storage or share via native share sheet.

### ⚙️ advanced Control
*   **Telegram Integration**: Simple setup using a Telegram Bot Token and Chat ID.
*   **Sync Logic**: Toggles for Auto-Backup and Wi-Fi-only synchronization to save data.
*   **Theming**: Beautiful light and dark modes with modern "Immich-style" aesthetics.
*   **Privacy**: Uses a private Telegram channel/group for your files.

---

## 🛠 Technology Stack

*   **Framework**: [Expo](https://expo.dev/) (React Native)
*   **Language**: TypeScript
*   **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Local tracking of uploads and OCR data)
*   **Storage Backend**: [Telegram Bot API](https://core.telegram.org/bots/api)
*   **Network**: Axios
*   **OCR**: react-native-text-recognition
*   **Background Tasks**: expo-task-manager & expo-background-fetch

---

## 📂 Project Structure

```text
/
├── app/                  # Expo Router (Navigation & Tabs)
│   ├── (tabs)/           # Main App Sections (Photos, Search, Drive, Albums, Profile)
│   ├── _layout.tsx       # Root Layout & App Initialization
│   └── ...               # Secondary Screens (Settings, File Viewer)
├── components/           # Reusable UI Components
├── constants/            # Theme (Colors.ts) and Configs
├── database/             # SQLite Schema and Database Services (db.ts)
├── screens/              # Core Screen Implementations
├── services/             # Logic Layer
│   ├── syncService.ts    # Core Sync Engine
│   ├── telegramService.ts# API communication with Telegram
│   ├── ocrService.ts     # Text recognition logic
│   ├── albumService.ts   # Device folder management
│   └── storage.ts        # AsyncStorage (Settings)
├── assets/               # Static assets & icons
└── package.json          # Dependencies & Scripts
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm installed.
*   Expo Go app (for basic preview) or Development Build (for OCR/Video).
*   A Telegram Bot (create one via [@BotFather](https://t.me/botfather)).
*   A Telegram Group/Channel ID where files will be stored.

### Installation
1.  **Clone the project**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the app**:
    ```bash
    npx expo start
    ```

### Telegram Configuration
1.  Open the app and navigate to **Profile -> Settings**.
2.  Enter your **Telegram Bot Token**.
3.  Enter your **Chat ID** (the ID of your private channel or your own user ID).
4.  Tap **Save**.
5.  Use the **Test Upload** button to verify the connection.

---

## 📝 Important Notes

*   **OCR & Video**: These features require native modules. If running in "Expo Go", some parts may be simulated. For full functionality, it is recommended to create a development build (`npx expo run:android` or `npx expo run:ios`).
*   **File Size**: Telegram Bot API supports files up to 50MB via standard upload. For larger 4K videos, ensure your expectations align with API limits.
*   **Privacy**: Your data is stored on Telegram's servers. Using a private channel ensures only you (and anyone you add to the channel) can see the backed-up files.

---

## 📄 License
This project is open-source. Feel free to modify and expand!
