# TelePhoto Cloud - Release APK Build Guide

## Prerequisites Installation

### 1. Install Android SDK
You need to have the Android SDK installed on your system. Here are the easiest ways:

#### Option A: Download from Android Developers (Recommended)
1. Go to https://developer.android.com/studio
2. Download Android Studio
3. Install it and let it install the default Android SDK components
4. The SDK will be installed at: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

#### Option B: Use Android Command Line Tools Only
1. Download SDK command-line tools from: https://developer.android.com/studio
2. Extract to a folder like `C:\Android\sdk`
3. Run the following commands:
   ```
   cd C:\Android\sdk\bin
   sdkmanager "platforms;android-34"
   sdkmanager "build-tools;34.0.0"
   sdkmanager "ndk;26.1.10909125"
   ```

### 2. Set ANDROID_HOME Environment Variable

#### On Windows:
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables..."
4. Click "New..." under System variables
5. Variable name: `ANDROID_HOME`
6. Variable value: `C:\Users\YourUsername\AppData\Local\Android\Sdk` (or your SDK path)
7. Click OK and restart your terminal/IDE

#### OR Update local.properties:
1. Edit `android/local.properties`
2. Add: `sdk.dir=C:\Users\YourUsername\AppData\Local\Android\Sdk`

### 3. Install Java Development Kit (JDK)
- Download JDK 11 or 17 from: https://www.oracle.com/java/technologies/downloads/
- Install it and set JAVA_HOME environment variable similarly to ANDROID_HOME

## Building the Release APK

Once prerequisites are installed:

```bash
cd c:\Users\Admin\Desktop\telegramGPhoto

# Install/update dependencies
npm install

# Run the release build
npm run build:release
```

The release APK will be generated at:
```
android\app\build\outputs\apk\release\app-release.apk
```

## Release Configuration Details

### What's been configured:
1. ✅ Startup splash screen with random opening animation videos
2. ✅ Release keystore created for signing: `android/app/release.keystore`
   - Storepass: `gphoto2024`
   - Key alias: `gphoto_key`
   - Keypass: `gphoto2024`
3. ✅ Android build.gradle updated for release signing
4. ✅ App name: "TelePhoto Cloud"
5. ✅ Package name: "com.krishna3163.gphoton"
6. ✅ Version: 1.0.0 (versionCode: 1)

### Permissions configured:
- Read external storage (photos/videos)
- Write external storage (for backup)
- Read media images
- Read media video
- Internet access (for Telegram API)

## Troubleshooting

### Build fails with "SDK location not found"
- Ensure ANDROID_HOME is set correctly
- Or update `android/local.properties` with correct Android SDK path
- Verify path exists by opening it in file explorer

### Build fails with Java version error
- Ensure Java 11+ is installed
- Check: `java -version`
- Set JAVA_HOME environment variable if not already set

### Keystore password error
- Release keystore password: `gphoto2024`
- Key password: `gphoto2024`
- Key alias: `gphoto_key`

## Publishing to Google Play Store

After generating the APK:

1. Create a Google Play Console account: https://play.google.com/console
2. Create a new app
3. Upload the signed release APK
4. Fill in store listing details
5. Set pricing and distribution
6. Submit for review (usually takes 2-3 hours to 1 day)

## Additional Features

### Opening Animation
- 3 random video animations play on first app launch
- Splash screen duration: 6 seconds (customizable)
- Videos sourced from StartingVideo folder

### App Screens Shown on First Launch (Onboarding):
1. Permission introduction screen
2. Privacy policy screen
3. Disclaimer screen
4. Main app (photo backup interface)

After first launch, the splash animation only shows on subsequent first launches if the "hasSeenSplash" flag is reset.

## Notes

- Keep the release.keystore file safe - you'll need it for future updates
- For security, consider changing the keystore passwords if you're publishing publicly
- The APK is signed and ready for Google Play Store distribution
- Test the APK on physical devices before publishing
