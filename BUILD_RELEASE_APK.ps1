#!/bin/bash
# TelePhoto Cloud - Quick Build Script
# Run this after Android SDK and Java JDK are installed and configured

echo "================================"
echo "TelePhoto Cloud - Release APK Build"
echo "================================"
echo ""

cd "c:\Users\Admin\Desktop\telegramGPhoto"

echo "[1/4] Checking prerequisites..."
if (!($env:ANDROID_HOME)) {
    Write-Host "⚠️  WARNING: ANDROID_HOME is not set"
    Write-Host "Set it via: setx ANDROID_HOME 'C:\Your\Android\Sdk\Path'"
    Write-Host "Or update android/local.properties with sdk.dir path"
    Write-Host ""
}

echo "[2/4] Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed"
    exit 1
}

echo "[3/4] Running prebuild..."
npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prebuild failed"
    exit 1
}

echo "[4/4] Building release APK..."
cd android
cmd /c "gradlew assembleRelease"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed"
    exit 1
}

Write-Host ""
Write-Host "✅ Release APK built successfully!"
Write-Host "📱 APK Location: app\build\outputs\apk\release\app-release.apk"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test APK on Android device"
Write-Host "2. Upload to Google Play Store"
Write-Host "3. Fill store listing details"
Write-Host "4. Submit for review"
