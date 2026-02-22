# Quick Start - Build Release APK (After Android SDK Setup)

## Option 1: Using Command Line (Fastest)

### Add Android SDK Path

**Option A** - Set environment variable (permanent):
```powershell
# Run in PowerShell as Administrator
setx ANDROID_HOME "C:\Users\Admin\AppData\Local\Android\Sdk"
# Close and reopen terminal for changes to take effect
```

**Option B** - Update local.properties (quick):
```bash
cd c:\Users\Admin\Desktop\telegramGPhoto\android
# Edit local.properties and set:
# sdk.dir=C:\Users\Admin\AppData\Local\Android\Sdk
```

### Build the APK

```bash
cd c:\Users\Admin\Desktop\telegramGPhoto

# Build release APK
npm run build:release
```

**Build takes 5-15 minutes. Common output messages:**
- `> root project` - Downloading dependencies
- `> Compiling` - Compiling Java code
- `> Generating` - Building APK
- `BUILD SUCCESSFUL` - Done!

### Find Your APK

```
c:\Users\Admin\Desktop\telegramGPhoto\android\app\build\outputs\apk\release\app-release.apk
```

---

## Option 2: Using PowerShell Script

```powershell
cd c:\Users\Admin\Desktop\telegramGPhoto
./BUILD_RELEASE_APK.ps1
```

---

## Option 3: Manual Step-by-Step

```bash
cd c:\Users\Admin\Desktop\telegramGPhoto

# Step 1: Install dependencies
npm install

# Step 2: Prebuild native files
npx expo prebuild --platform android --no-install

# Step 3: Fix text recognition library
node scripts/fix-text-recognition.js

# Step 4: Build release APK
cd android
cmd /c "gradlew assembleRelease"
```

---

## Verify Build Success

✅ **Success indicators:**
```
BUILD SUCCESSFUL in 8m 23s
app-release.apk found
File size: 50-100 MB typical
```

❌ **Error indicators:**
- `BUILD FAILED`
- `SDK location not found` → Set ANDROID_HOME or local.properties
- `Command not found: gradlew` → Run from android directory
- `Java not found` → Install JDK 11+

---

## Testing on Device

### Transfer to Phone
1. Copy `app-release.apk` to phone
2. Open file manager on phone
3. Tap the APK file
4. Install the app

### Or via ADB (if installed)
```bash
adb install app-release.apk
```

### Test Checklist
- [ ] App installs without errors
- [ ] Splash screen plays on first launch
- [ ] All three opening videos work
- [ ] App navigates to permission screen
- [ ] Photo gallery loads
- [ ] Settings accessible
- [ ] No crashes

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| ANDROID_HOME not found | Set environment variable or update local.properties |
| Java not found | Install JDK 11+, set JAVA_HOME |
| Gradle timeout | Increase timeout: add `org.gradle.jvmargs=-Xmx4096m` to gradle.properties |
| Out of memory | Close other apps, increase RAM allocation |
| Build takes too long | Normal first-time build (30min+), subsequent builds faster |

---

## What's Included

✅ **Opening Animation**
- Randomly selects from 3 video files
- Auto-plays on app first launch
- Duration: configurable (default 6 seconds)

✅ **Onboarding**
- Permission request screen
- Privacy policy screen  
- Disclaimer screen

✅ **Main App Features**
- Photo gallery with date grouping
- Album selection and organization
- Cloud backup to Telegram
- File viewer
- Search functionality
- Settings/configuration
- Dark mode support

---

## Next Steps After APK Build

1. **Test on multiple devices**
   - At least one physical Android device
   - Test different Android versions (if possible)

2. **Fix any issues found during testing**
   - Check error logs: `adb logcat`
   - Update code as needed
   - Rebuild APK

3. **Publish to Google Play Store**
   - Create developer account (registration fee: ~$25)
   - Create app listing
   - Upload APK
   - Fill store listing details
   - Submit for review (2-3 hours to 1 day)

4. **Monitor after launch**
   - Check crash reports
   - Read user reviews
   - Plan updates

---

## Key Information

**App Details:**
- Name: TelePhoto Cloud
- Package: com.krishna3163.gphoton
- Version: 1.0.0
- Min SDK: 23 (Android 6.0)
- Target SDK: 34 (Android 14)

**Release Keystore:**
- Location: `android/app/release.keystore`
- Alias: `gphoto_key`
- Password: `gphoto2024`
- ⚠️ **Keep this safe** - needed for future updates!

---

## Support

For more detailed information, see:
- `RELEASE_BUILD_GUIDE.md` - Comprehensive setup guide
- `RELEASE_APKCHECKLIST.md` - Complete checklist
- `RELEASE_SUMMARY.md` - What was changed
