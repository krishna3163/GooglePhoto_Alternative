## 🎉 What's New in This Update

### Model 3: Telegram Account-Based Cloud Storage (Experimental)

We've extended TeleGphoto with an advanced storage option that allows you to use your **Telegram account directly** as cloud storage, without needing a bot!

---

## 📱 Model 3 Features

### What is Model 3?

**Model 3** is an experimental feature that replaces the traditional bot-based storage (Model 1) with direct **Telegram account integration** using the MTProto API. Your files are stored in your Telegram **Saved Messages** chat, making them fully accessible from your phone while maintaining privacy.

#### Key Differences:

| Feature | Model 1 (Bot) | Model 3 (Account) |
|---------|---------------|-------------------|
| Storage Type | Telegram Bot | Your Account |
| Setup | Bot Token + Chat ID | Phone Number + OTP |
| File Access | Via Bot API | Via Saved Messages |
| Status | Production | Experimental ⚠️ |
| Default | ✅ Yes | ❌ No |

---

## 🚀 How to Enable Model 3

### Step 1: Unlock Developer Mode

There are **two ways** to unlock Developer Mode:

#### Method A: 5-Tap Activation
1. Go to the web app
2. **Tap the TeleGphoto logo 5 times** rapidly
3. Developer Mode will be activated automatically

#### Method B: Toggle Switch
1. Go to **Settings** (gear icon)
2. Look for the **Developer Mode** toggle
3. Switch it ON

> 💡 Developer Mode is OFF by default for security

### Step 2: Select Storage Model

Once Developer Mode is enabled:

1. Open **Settings**
2. Scroll to **Storage Model** section
3. Choose between:
   - **Model 1 (Bot Storage)** - Recommended, Production-ready
   - **Model 3 (Account Cloud)** - Experimental, New!

### Step 3: Login with Your Telegram Account (For Model 3)

1. In the **Telegram Account Cloud (Experimental)** section, click **Send OTP**
2. Enter your phone number (e.g., +91-XXXXXXXXXX)
3. Check your Telegram app:
   - Go to **Settings** → **Privacy and Security** → **Login Attempts**
   - Copy the 6-digit code
4. Paste the code back into TeleGphoto
5. ✅ You're logged in!

---

## 🔐 Security & Privacy

### Model 3 Security Features:

✅ **Encrypted Sessions** - Session data is encrypted before storage
✅ **No Credential Exposure** - Your password/session hash is never logged
✅ **Saved Messages Only** - Files only go to your Saved Messages, not visible to others
✅ **Automatic Logout** - Sessions expire and can be manually terminated
✅ **Transparent Storage** - Every file is visible AND accessible from Telegram mobile

### Important Warnings:

⚠️ **Experimental Feature** - Still in beta, expect improvements
⚠️ **MTProto API** - Uses Telegram's client API (be aware of terms)
⚠️ **No Offline Access** - Requires internet to fetch files
⚠️ **Session Management** - Keep your session secure, logout from untrusted devices

---

## 📤 How Upload Destination Selection Works

### When Developer Mode is OFF:
- Files upload to **Model 1 (Bot)** only
- Upload destination selector is hidden

### When Developer Mode is ON:
- Click the **Upload** button
- You'll see a popup asking: "Select Upload Destination"
- Choose between Model 1 or Model 3
- Your choice is remembered for the session

---

## 📂 Fetching Media from Saved Messages (Model 3)

When using Model 3:

1. The app automatically fetches **media messages** from your Saved Messages
2. **Images** and **Videos** are displayed in the gallery
3. **Documents** are also supported
4. Files are **lazy-loaded** - only fetches when needed
5. **Thumbnails are cached** for faster browsing

### Accessing Your Files:

#### From TeleGphoto:
- Media appears in the **Photos** gallery
- Download files directly to your device
- Share or manage files like any other storage

#### From Telegram Mobile:
- Open your Telegram app
- Go to **Saved Messages**
- All your TeleGphoto uploads are there!
- Access anywhere, anytime

---

## ⚙️ Backend Setup for Model 3

If you're self-hosting TeleGphoto, you need to set up the Model 3 backend:

### Backend Requirements:

1. **Node.js/Express server** for MTProto proxy
2. **Telegram TDLib or Pyrogram** for MTProto
3. **Session encryption** (for storing encrypted sessions)
4. **Redis/Database** to map sessions to users

### API Endpoints (Required):

```
POST /api/model3/request-otp
  - Request OTP with phone number

POST /api/model3/verify-otp
  - Verify OTP and create session

POST /api/model3/saved-messages
  - Fetch messages from Saved Messages

POST /api/model3/upload-file
  - Upload file to Saved Messages

POST /api/model3/get-file-url
  - Get download URL for a file

POST /api/model3/delete-message
  - Delete a message from Saved Messages

POST /api/model3/logout
  - Logout and clear session

POST /api/model3/validate-session
  - Check if session is still valid
```

> 📝 See the Model 3 Service file for full implementation details

---

## 🎯 Use Cases for Model 3

### Best For:
✅ Personal cloud storage on your own account
✅ Avoiding bot setup complexity
✅ Seamless integration with Telegram mobile
✅ Privacy-conscious users
✅ Unlimited Telegram storage access

### Not Ideal For:
❌ Large-scale shared storage
❌ Business use (no audit logs)
❌ Offline access (requires internet)
❌ Production environments (experimental)

---

## 📊 Storage Model Selection & Defaults

### Default Behavior:
- **Model 1 (Bot)** is the default storage
- All existing configurations continue to work
- Model 3 is completely optional

### Switching Models:
1. Go to **Settings** → **Storage Model**
2. Select your preferred model
3. Click **Save Settings**
4. New uploads will use the selected model
5. Old files remain accessible regardless of the model

---

## 🎓 Technical Architecture

### Model 3 Flow:

```
User's Phone
      ↓
  [Telegram App]
      ↓
   MTProto API
      ↓
  [TeleGphoto Backend]
      ↓
  Decrypt Session + Create File
      ↓
  Upload to Saved Messages
      ↓
  [Telegram Servers]
      ↓
  File Stored in User's Account
```

### Session Persistence:

```
1. User Login (Phone → OTP → Session)
   ↓
2. Session encrypted & stored locally
   ↓
3. On refresh, session automatically restored
   ↓
4. Transparent to user = seamless experience
```

---

## ⚠️ Known Limitations

1. **MTProto Rate Limits** - Telegram may rate-limit requests
2. **No Encryption** - Files are not encrypted in Telegram
3. **Large Uploads** - May be slower than bot uploads
4. **Session Timeout** - Inactive sessions may expire after 7-28 days
5. **API Changes** - Telegram may change MTProto protocol (rare)

---

## 🔧 Troubleshooting Model 3

### "OTP not received"
- Check **Settings** → **Privacy and Security** → **Login Attempts** in Telegram
- Make sure 2FA isn't enabled (disable if it is)
- Try requesting OTP again

### "Session expired"
- Re-login with your phone number
- Stored session is automatically refreshed

### "Could not fetch Saved Messages"
- Check internet connection
- Ensure your Telegram account is active
- Try logging out and back in

### "Upload failed"
- Check file size (avoid very large files)
- Ensure Model 3 session is active
- Check Developer Mode is enabled

---

## 📚 API Usage Examples

### JavaScript/TypeScript:

```typescript
import { uploadFileToModel3, fetchSavedMessages } from './services/model3Service';

// Upload file to Model 3
const result = await uploadFileToModel3(session, file, (progress) => {
    console.log(`Upload progress: ${progress}%`);
});

console.log(`Message ID: ${result.messageId}, File ID: ${result.fileId}`);

// Fetch media from Saved Messages
const media = await fetchSavedMessages(session, limit=50, offset=0);
console.log(`Total files: ${media.totalCount}`);
```

---

## 🎁 Future Improvements

We're planning these features for future versions:

- [ ] End-to-End Encryption (E2EE) for Model 3
- [ ] Automatic background sync
- [ ] File sharing via Telegram links
- [ ] Folder organization in Saved Messages
- [ ] Smart caching and offline access
- [ ] Model 3 UI improvements
- [ ] Performance optimizations

---

## ❓ FAQ

**Q: Is Model 3 safe to use?**
A: Model 3 uses Telegram's official APIs and encrypted sessions. Your credentials are never exposed. However, it's still in beta, so use with caution for critical files.

**Q: Can I use both Model 1 and Model 3 together?**
A: Yes! You can switch between them anytime. Existing files remain accessible.

**Q: Will my files be private in Saved Messages?**
A: Yes! Saved Messages is your personal chat accessible only by you, even on web.

**Q: What happens if I disable Developer Mode?**
A: Model 3 features will be hidden, but stored data isn't deleted. Re-enable anytime to access again.

**Q: Can I share files from Model 3?**
A: Not currently through TeleGphoto UI, but you can access and share from your Telegram Saved Messages directly.

---

## 📞 Support

Having issues with Model 3? 

1. Check the **Troubleshooting** section above
2. Report bugs via the **Report a Bug** link in the Developer Profile
3. Check GitHub issues: [GooglePhoto_Alternative](https://github.com/krishna3163/GooglePhoto_Alternative)

---

## 📝 Summary of Changes

### Added:
- ✨ Model 3 (Account-based) cloud storage option
- ✨ 5-tap Developer Mode activation
- ✨ Telegram OTP login system
- ✨ Saved Messages media fetcher
- ✨ Upload destination selector
- ✨ Session persistence & encryption
- ✨ Unified storage service (Model 1 & 3)

### Unchanged:
- ✅ Model 1 (Bot) remains default
- ✅ Existing configurations still work
- ✅ All original features intact
- ✅ No breaking changes

---

**Version:** 2.0.0 (Model 3 Beta)  
**Status:** 🧪 Experimental  
**Last Updated:** February 2026

