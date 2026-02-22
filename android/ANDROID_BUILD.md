# Android APK build – where errors can occur

Same setup as before; this file only documents where build can fail so you can fix quickly.

## 1. GitHub Actions

- **"node_modules missing"** → Run `npm ci` (workflow does this). If it fails, check `package.json` and lockfile.
- **"android folder missing"** → Run `npx expo prebuild --platform android` and commit the `android/` folder.
- **"android/react-settings-plugin missing"** → The plugin for `com.facebook.react.settings` (RN 0.74) lives here. It must exist under `android/react-settings-plugin`. If you removed it, restore it or regenerate `android/` with prebuild.

## 2. Gradle – `android/settings.gradle`

- **"node failed"** → All Node commands run from **project root** (parent of `android/`). So `node_modules` must be at repo root and contain `react-native`, `expo`, etc. Error line in script shows which `require.resolve(...)` failed.
- **"Could not find plugin com.facebook.react.settings"** → For RN 0.74 we `includeBuild("react-settings-plugin")`. So `android/react-settings-plugin/` must exist and contain a valid Gradle plugin (e.g. `build.gradle.kts` and plugin registration).

## 3. Gradle – `android/build.gradle`

- **"node failed"** → Same as above: Node runs from `projectRoot` (parent of `android/`). Ensure `node_modules` at repo root and dependencies installed.

## 4. Gradle – `android/app/build.gradle`

- **"node failed"** → Same: Node runs from `projectRootDir` (repo root). Fix by ensuring deps at repo root.
- **"release.keystore" not found** → Either add `RELEASE_KEYSTORE_BASE64` secret in GitHub and decode to `android/app/release.keystore`, or let CI replace release with debug signing (workflow does this when secret is missing).
- **Entry file / resolveAppEntry** → Fails if `expo` or app entry is missing. Ensure `expo` is installed and app has a valid entry (e.g. `expo-router/entry` in `package.json`).

## 5. Local build (same logic)

From repo root:

```bash
npm ci
cd android
./gradlew assembleRelease
```

Or use the npm script:

```bash
npm run build:release
```

(That runs prebuild then Gradle; if you already have `android/` committed, you can run Gradle only as above.)

## Summary

| Error / symptom | Where it comes from | What to do |
|-----------------|---------------------|------------|
| node_modules missing | CI step or Gradle node run | `npm ci` at repo root |
| android folder missing | CI step | Prebuild and commit `android/` |
| react-settings-plugin missing | CI step or settings.gradle | Restore `android/react-settings-plugin` or prebuild |
| Plugin com.facebook.react.settings not found | settings.gradle | Include `react-settings-plugin` and have it at `android/react-settings-plugin` |
| node failed (in Gradle) | settings.gradle, build.gradle, app/build.gradle | Run Node from repo root; fix deps / path |
| release.keystore not found | app/build.gradle | Add keystore or use debug signing in CI |

All Node commands in Gradle use **project root** (parent of `android/`) as working directory so `require('react-native/package.json')` and similar resolve correctly on CI and locally.
