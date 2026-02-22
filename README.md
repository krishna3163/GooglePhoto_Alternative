# TelePhoto Cloud 🚀
**Unlocking Unlimited Cloud Storage via Telegram**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/krishna3163/GooglePhoto_Alternative/actions/workflows/apk.yml/badge.svg)](https://github.com/krishna3163/GooglePhoto_Alternative/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
![Views](https://komarev.com/ghpvc/?username=krishna3163&repo=GooglePhoto_Alternative&label=Project+Views&color=0e75b6&style=flat)

TelePhoto Cloud is a smart app that turns your Telegram account into your own personal "Google Photos." It gives you a way to save all your memories forever without paying for expensive monthly plans.

---

## 🧸 How does it work? (The "Simple" Version)

Imagine you have a giant, magical backpack (that's **Telegram**). You can put almost anything inside it, and it never gets full! 

1. **The Snap**: You take a photo on your phone.
2. **The Helper**: Our app is like a friendly robot. It sees your new photo and says, *"Hey! I should save this safely in the magical backpack!"* 🤖
3. **The Trip**: The app sends the photo to a private corner of your Telegram where only you can see it.
4. **The Magic**: Even if you delete the photo from your phone to save space, it stays safe in your Telegram backpack! You can look at it, download it back, or share it anytime you want.

---

## 🛠 Telegram Setup (The Real Magic Behind the Scenes)

To unlock cloud backup, you need to connect the app with your personal Telegram storage. Don’t worry — it only takes a few minutes.

### 🤖 Step 1 — Create your Robot Helper (Bot Token)
Your bot is the messenger that uploads files to Telegram.
1. Open Telegram and search for **@BotFather**.
2. Tap **Start**.
3. Type `/newbot`.
4. Enter a name for your bot.
5. Enter a username that ends with `bot` (Example: `MagicBackpack_bot`).
6. BotFather will send your **Bot Token** (Example: `123456789:AAExampleBotToken`).
7. 👉 **Copy this token and keep it safe.**

### 🏰 Step 2 — Create your Secret Vault (Private Channel)
This channel will act as your personal cloud storage.
1. Open Telegram → **New Channel**.
2. Choose **Private Channel**.
3. Give it a name (example: `My Secret Vault`).
4. Create the channel.

### ➕ Step 3 — Add the Bot to Your Vault
1. Open the channel.
2. Tap **Channel Info** → **Administrators**.
3. Tap **Add Admin**.
4. Search your bot and add it.
5. Allow **Post Messages** permission.
   *Now your robot can store files.*

### 🆔 Step 4 — Get Your Chat ID (Vault Address)
1. Open the channel.
2. Send a message like: `hello`.
3. Open this link in your browser: `https://api.telegram.org/bot<TOKEN>/getUpdates` (Replace `<TOKEN>` with your bot token).
   - Example: `https://api.telegram.org/bot123456:ABCDEF/getUpdates`
4. 🔎 **Find Chat ID in Response**: You will see JSON like:
   ```json
   {
     "chat": {
       "id": -1001234567890,
       "title": "My Secret Vault"
     }
   }
   ```
5. 👉 The `"id"` value is your **Chat ID**. (Negative numbers are normal for channels).

### 🔑 Final Step — Connect the App
1. Open the **TelePhoto Cloud** app (or Web App).
2. Go to **Settings**.
3. Paste the **Bot Token** and the **Chat ID**.
4. Tap **Save** and start syncing! 🚀

---


## �📈 Project Growth
![Commit Activity](https://img.shields.io/github/commit-activity/m/krishna3163/GooglePhoto_Alternative)
![Last Commit](https://img.shields.io/github/last-commit/krishna3163/GooglePhoto_Alternative)
![GitHub repo size](https://img.shields.io/github/repo-size/krishna3163/GooglePhoto_Alternative)

---

## ✨ Features that Wow

### 📸 Pro-Grade Gallery & Auto-Sync
- **Intelligence Sync**: Our background helper works even when you aren't using the app.
- **Selective Backup**: You tell the app which folders to watch (like Camera or WhatsApp).
- **Smart Dashboard**: A cool screen that shows you exactly what's being saved.

### 🔍 Search with Superpowers
- **Reading Robot (OCR)**: The app can "read" your photos. Search for "Milk" and it will find the photo of that grocery list you took yesterday!
- **Fast Find**: Search by name or date in a blink.

### 📂 Your Cloud Drive
- **Everything in One Place**: Like a digital filing cabinet for your photos, videos, and documents.
- **No Waiting**: Watch your videos directly from the cloud without needing to download them first.

---

## 🛠 Tech Stack
- **Engine**: [Expo](https://expo.dev/) (React Native) + TypeScript
- **State & Local DB**: [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (A tiny, fast brain for the app).
- **Back-end**: [Telegram Bot API](https://core.telegram.org/bots/api).
- **CI/CD**: Automatic Robot building with GitHub Actions.

---

## 🎉 What's New: Model 3 (Account-Based Storage)

We just added an **experimental** new storage option! 🚀

### 📱 Model 3: Store Files in Your Telegram Saved Messages

Instead of using a bot, you can now use your **Telegram account directly** to store files in your Saved Messages! This means:

✨ **No Bot Setup** - Login with your phone number + OTP  
✨ **Direct Storage** - Files go into your Saved Messages  
✨ **Mobile Sync** - Access from Telegram app instantly  
✨ **Seamless** - Works across web and mobile  

### How to Enable:

1. **Unlock Developer Mode**: Tap the TelePhoto logo 5 times (or use Settings toggle)
2. **Enable Model 3**: Go to Settings → Storage Model → Select Model 3
3. **Login**: Verify with OTP from Telegram
4. **Done!** - Choose storage destination when uploading

### 📚 Learn More:
👉 **[Read Full Model 3 Documentation →](./MODEL3_FEATURES.md)**

#### Key Information:
- ⚠️ **Experimental Feature** - Use with caution
- ✅ **Model 1 (Bot)** remains the default
- ✅ **No Breaking Changes** - Existing setup still works
- 🔐 **Encrypted Sessions** - Your credentials stay safe

---

## 🤝 Build With Us: Join the Revolution!
We are making storage free for everyone. Whether you are a coding pro or just starting out, we need your help!

### Why Join the Team?
1. **Help the World**: Help people save their precious memories without paying big companies.
2. **Learn Cool Stuff**: Learn how to make apps, talk to robots (APIs), and work with a team.
3. **Your Name Here**: Get your name on our list of creators!

### How to Help?
- 🐛 **Bug Hunter**: Find something broken? Tell us!
- ✨ **Dreamer**: Have a cool idea for a new feature? Share it!
- 🎨 **Artist**: Help us make the app look even prettier.
- 📖 **Teacher**: Help us write better instructions for others.

---

## 🚀 Dev Setup (For the Techies)

1. **Get the Code**:
   ```bash
   git clone https://github.com/krishna3163/GooglePhoto_Alternative.git
   cd GooglePhoto_Alternative
   npm install
   ```
2. **Start the Engine**:
   ```bash
   npx expo start
   ```

---

## 📄 License
This project is under the **MIT License**. It's free to use and open for everyone.

---

## 🌐 TelePhoto Web (NEW!)
We now have a beautiful web interface that looks and feel exactly like **Google Photos**!

### Key Features:
- **Premium UI**: Dark mode, masonry grid, and smooth animations.
- **Web Uploads**: Upload from your PC directly to Telegram.
- **Search & OCR**: Find your photos via text search.

Check it out in the `/web-app` directory! 🚀

---

## 🌟 Support the Project
Love this idea? Give us a ⭐️ on GitHub! It makes us happy and helps more people find the app.

