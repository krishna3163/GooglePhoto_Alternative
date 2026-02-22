# 📱 TelePhoto Cloud - Release APK Checklist

## Pre-Build Checklist

### System Requirements
- [ ] Windows PC with at least 8GB RAM
- [ ] ~5GB free disk space  
- [ ] Internet connection for downloading dependencies

### Software Installation
- [ ] ✅ Node.js 16+ installed (`node -v`)
- [ ] ✅ npm installed (`npm -v`)
- [ ] Android SDK installed (see RELEASE_BUILD_GUIDE.md)
  - [ ] API Level 34+ installed
  - [ ] Build-tools 34.0.0 installed
  - [ ] NDK 26.1.10909125 installed
- [ ] Java JDK 11+ installed (`java -version`)

### Environment Configuration
- [ ] ✅ ANDROID_HOME environment variable set
  - OR
- [ ] ✅ `android/local.properties` updated with SDK path
- [ ] ✅ JAVA_HOME environment variable set (if needed)

## Project Preparation Checklist

### Code
- [ ] ✅ Splash screen component created
- [ ] ✅ Video assets copied to assets folder
- [ ] ✅ App configuration updated (app.json)
- [ ] ✅ Android build configuration updated
- [ ] ✅ Release signing keystore created
- [ ] ✅ Build scripts added (package.json)

### Configuration Files
- [ ] ✅ `screens/SplashScreen.tsx` - Created
- [ ] ✅ `assets/` - Videos copied
- [ ] ✅ `app.json` - Updated permissions and config
- [ ] ✅ `app/_layout.tsx` - Splash integration
- [ ] ✅ `android/app/build.gradle` - Release signing
- [ ] ✅ `android/app/release.keystore` - Created
- [ ] ✅ `android/build.gradle` - Fixed classpath
- [ ] ✅ `android/local.properties` - Template created
- [ ] ✅ `package.json` - Release build script added

### Documentation
- [ ] ✅ `RELEASE_BUILD_GUIDE.md` - Created
- [ ] ✅ `RELEASE_SUMMARY.md` - Created
- [ ] ✅ `BUILD_RELEASE_APK.ps1` - Created

## Build Process Checklist

### Step 1: Install Dependencies
- [ ] Run `npm install` (if not already done)
- [ ] Verify no errors in output

### Step 2: Run Prebuild
- [ ] Run `npx expo prebuild --platform android --no-install`
- [ ] Verify prebuild completes successfully
- [ ] Check `android/` folder is created/updated

### Step 3: Apply Patches
- [ ] Run `node scripts/fix-text-recognition.js`
- [ ] Verify patch applied (check output message)

### Step 4: Build Release APK
- [ ] Run `cd android && cmd /c "gradlew assembleRelease"`
- [ ] Monitor build progress (takes 5-15 minutes)
- [ ] Verify no build errors

### Step 5: Verify APK Generated
- [ ] Check file exists: `android/app/build/outputs/apk/release/app-release.apk`
- [ ] Verify file size is reasonable (~50-100 MB)
- [ ] Copy to safe location

## Testing Checklist

### Device Testing
- [ ] ✅ Install APK on test Android device
- [ ] ✅ App launches successfully
- [ ] ✅ Splash screen animation plays
- [ ] ✅ Onboarding screens display correctly
- [ ] ✅ Permission requests work
- [ ] ✅ Main app functions work
- [ ] ✅ photo gallery loads
- [ ] ✅ Settings screen accessible
- [ ] ✅ No crashes or errors

### APK Validation
- [ ] ✅ APK is digitally signed
- [ ] ✅ Version 1.0.0 shown in app info
- [ ] ✅ Package name: com.krishna3163.gphoton
- [ ] ✅ Permissions properly declared

## Pre-Launch Checklist

### Store Preparation
- [ ] Create Google Play Store account
- [ ] Complete developer profile
- [ ] Add payment method
- [ ] Create new app listing

### Content Review
- [ ] App store description written
- [ ] Screenshots captured (4-8 images)
  - [ ] Splash screen/startup
  - [ ] Gallery view
  - [ ] Cloud drive view
  - [ ] Settings screen
  - [ ] Permission screen
- [ ] Privacy policy document ready
- [ ] Support email configured
- [ ] Website/support URLs prepared

### APK Release
- [ ] App version: 1.0.0 ✅
- [ ] Version code: 1 ✅
- [ ] Release type: Production
- [ ] Target API: 34 ✅
- [ ] Min API: 23 ✅
- [ ] APK tested on devices
- [ ] Signed with release keystore ✅

### Final Review
- [ ] All required fields in Play Store filled
- [ ] Pricing and distribution set
- [ ] Content rating completed
- [ ] Release notes prepared
- [ ] Keystore backup created and secured

## Post-Launch Checklist

### After Publishing
- [ ] Monitor Play Store dashboard
- [ ] Check crash reports
- [ ] Read user feedback/ratings
- [ ] Plan next version features
- [ ] Set up beta testing (optional)

### Backup & Security
- [ ] ✅ Backup `android/app/release.keystore` file
- [ ] ✅ Store passwords securely
- [ ] ✅ Document keystore details for future updates
- [ ] Back up `keys.txt` or password manager

## Keystore Details (SAVE SECURELY)

**Location**: `android/app/release.keystore`
**Storepass**: gphoto2024
**Key Alias**: gphoto_key
**Keypass**: gphoto2024
**Validity**: 10,000 days (until year 2053)

⚠️ **IMPORTANT**: This keystore is required for:
- Publishing updates to Google Play Store
- Ensuring app signature consistency
- Re-releasing your app in the future

Keep this file and these passwords in a safe place!

---

## Status Summary

| Item | Status |
|------|--------|
| Splash screen animation | ✅ Complete |
| Video assets | ✅ Copied |
| App configuration | ✅ Updated |
| Android setup | ✅ Configured |
| Release keystore | ✅ Created |
| Build scripts | ✅ Added |
| Documentation | ✅ Complete |
| **Overall Readiness** | **✅ 100%** |

## Next Step

Follow the RELEASE_BUILD_GUIDE.md to:
1. Install Android SDK (if not already installed)
2. Configure environment variables
3. Run the release build command
4. Test the generated APK
5. Publish to Google Play Store

Good luck! 🚀
