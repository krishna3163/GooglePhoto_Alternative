# GitHub Actions Setup Guide - Build Release APK

## Overview
This guide explains how to set up GitHub Actions to automatically build your signed release APK whenever you push code to the repository.

## Prerequisites

You need:
1. GitHub repository with push access
2. Release keystore file (`android/app/release.keystore`)
3. Keystore credentials (passwords and key alias)

## Step 1: Encode Keystore for GitHub Secrets

Your release keystore needs to be converted to base64 format to be stored as a GitHub Secret.

### On Windows (PowerShell):
```powershell
cd "c:\Users\Admin\Desktop\telegramGPhoto\android\app"
# Convert keystore to base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Set-Clipboard
echo "✅ Keystore base64 copied to clipboard"
```

### On macOS/Linux:
```bash
cd android/app
base64 -w 0 < release.keystore | pbcopy
# Or on Linux:
base64 -w 0 < release.keystore | xclip -selection clipboard
```

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these 4 secrets:

### Secret 1: RELEASE_KEYSTORE_BASE64
- **Name**: `RELEASE_KEYSTORE_BASE64`
- **Value**: Paste the base64-encoded keystore (from Step 1)

### Secret 2: RELEASE_KEYSTORE_PASSWORD
- **Name**: `RELEASE_KEYSTORE_PASSWORD`
- **Value**: `gphoto2024`

### Secret 3: RELEASE_KEY_ALIAS
- **Name**: `RELEASE_KEY_ALIAS`
- **Value**: `gphoto_key`

### Secret 4: RELEASE_KEY_PASSWORD
- **Name**: `RELEASE_KEY_PASSWORD`
- **Value**: `gphoto2024`

## Step 3: Verify Workflow File

Check that the workflow file exists:
- `.github/workflows/build-release-apk.yml`

This file defines the build process and is already configured.

## Step 4: Trigger the Build

### Option A: Automatic Trigger
Push code to the `main` branch:
```bash
git push origin main
```

The workflow will automatically start building.

### Option B: Manual Trigger
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **"Build Release APK"** workflow
4. Click **Run workflow** → **Run workflow**

## Step 5: Monitor Build Progress

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. Click **build** to see detailed logs
4. Wait for build to complete (5-10 minutes)

## Step 6: Download APK

After build completes:
1. Click the completed workflow run
2. Scroll to **Artifacts** section
3. Download **TelePhoto-Cloud-Release-APK**
4. Extract the `app-release.apk` file

## Troubleshooting

### ❌ Build Failed: "Keystore not found"
**Cause**: `RELEASE_KEYSTORE_BASE64` secret not configured
**Solution**: Follow Step 2 to add all required secrets

### ❌ Build Failed: "Signature not recognized"
**Cause**: Keystore password wrong
**Solution**: Verify `RELEASE_KEYSTORE_PASSWORD` is `gphoto2024`

### ❌ Build Timeout
**Cause**: First build downloads many dependencies
**Solution**: Wait 15-20 minutes, subsequent builds are faster

### ❌ APK Not Signed
**Cause**: Secrets not properly configured
**Solution**: Double-check all 4 secrets are present and correct

## What the Workflow Does

1. **Checkout** code from repository
2. **Setup** Node.js, Java JDK
3. **Install** dependencies (npm ci)
4. **Apply** patches (text recognition)
5. **Import** release keystore from GitHub Secrets
6. **Build** signed release APK
7. **Upload** APK as artifact
8. **Generate** build report

## Output APK Location

After successful build, the APK is available as:
```
Artifacts → TelePhoto-Cloud-Release-APK → app-release.apk
```

APK is:
- ✅ Signed with release keystore
- ✅ Minified and optimized
- ✅ Ready for Google Play Store
- ✅ Version 1.0.0

## Using the APK

### Test on Device:
```bash
# Via ADB
adb install app-release.apk

# Or manually:
# 1. Transfer APK to phone
# 2. Open file manager
# 3. Tap APK to install
```

### Publish to Google Play:
1. Create Google Play Store account
2. Create new app listing
3. Upload `app-release.apk`
4. Fill store details
5. Submit for review

## Updating Secrets

If you change the keystore password:
1. Update the keystore file
2. Re-encode to base64
3. Update GitHub Secrets with new values
4. Push code to trigger new build

## Security Notes

⚠️ **Important**:
- Secrets are encrypted and hidden from logs
- Only used during build process
- Not stored in repository
- Only accessible to GitHub Actions workflows
- Can be rotated anytime

## Workflow Logs

To view detailed build logs:
1. Go to **Actions** → Latest run
2. Click **build** job
3. Expand steps to see:
   - Dependency installation
   - Build compilation
   - Gradle output
   - Error messages

## Retrying Failed Builds

If build fails:
1. Click **Re-run all jobs** button
2. Check **Workflow logs** for error details
3. Fix issue locally and push code
4. Workflow automatically retriggers

## Continuous Integration Benefits

✅ **Automated**: Build on every push
✅ **Consistent**: Same build environment
✅ **Artifact Storage**: Download anytime
✅ **History**: Track all builds
✅ **Release Ready**: Signed and optimized

## Next Steps

1. Add the 4 GitHub Secrets
2. Push code to main branch
3. Check Actions tab for build progress
4. Download the signed APK when ready
5. Test on Android device
6. Publish to Google Play Store

## Support

For GitHub Actions help:
- Read GitHub Actions docs: https://docs.github.com/en/actions
- Check workflow syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- View build logs for errors

---

**Ready to build?** Push to GitHub and watch it build automatically! 🚀
