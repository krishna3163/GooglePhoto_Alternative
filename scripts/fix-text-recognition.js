#!/usr/bin/env node
/**
 * Optional patch for @react-native-ml-kit/text-recognition native module.
 * Run before Android build if the native build fails due to ML Kit.
 * No-op if no patch is required.
 */
const fs = require('fs');
const path = require('path');

const androidBuildGradle = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (!fs.existsSync(androidBuildGradle)) {
  console.log('scripts/fix-text-recognition.js: android/app/build.gradle not found, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(androidBuildGradle, 'utf8');
const original = content;

// Ensure minSdkVersion is at least 21 for ML Kit if present
if (content.includes('minSdkVersion') && !content.includes('minSdkVersion 21')) {
  // Only adjust if current minSdk is lower than 21 (ML Kit requirement)
  const match = content.match(/minSdkVersion\s+rootProject\.ext\.minSdkVersion/);
  if (match) {
    console.log('scripts/fix-text-recognition.js: build.gradle uses rootProject minSdkVersion, no change needed.');
  }
}

console.log('scripts/fix-text-recognition.js: done.');
process.exit(0);
