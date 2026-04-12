# Trendify — Development Guide

## Prerequisites

- Node.js 18+
- npm 9+
- [Expo Go](https://expo.dev/client) app on your phone (for quick device testing)
- Xcode (iOS Simulator, Mac only)
- Android Studio (Android Emulator)

---

## Install dependencies

```bash
npm install
```

---

## Run tests

```bash
npm test
```

Runs all 146 unit and property-based tests using Jest + fast-check.

---

## Start the dev server

```bash
npx expo start
```

Opens Metro bundler with a QR code in the terminal.

---

## Test on a physical device (Expo Go)

> Quickest way to see the app running on real hardware.

1. Install **Expo Go** on your phone
   - iOS → [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android → [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Connect your Mac and phone to the **same Wi-Fi network**
3. Run `npx expo start`
4. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

> **Note:** `react-native-mmkv` is not bundled in Expo Go. Bookmarks and preferences persistence will not work until you create a development build (see below).

---

## Test on iOS Simulator

```bash
npx expo start --ios
```

Requires Xcode installed from the Mac App Store.

---

## Test on Android Emulator

```bash
npx expo start --android
```

Requires Android Studio with an AVD configured.

---

## Full native testing — Development Build

For complete native module support (`react-native-mmkv`, biometrics, camera, etc.) use a development build via EAS.

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure EAS for the project (first time only)
eas build:configure

# Build for iOS (installs on your physical device)
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

After the build completes, install the `.ipa` / `.apk` on your device and run:

```bash
npx expo start --dev-client
```

Scan the QR code from the installed dev client app — all native modules will work.

---

## Project structure

```
Trendify-Mobile-App/
├── App.tsx                  # Root entry point
├── src/
│   ├── api/                 # API client (Zod-validated)
│   ├── components/          # Shared components (ErrorBoundary)
│   ├── hooks/               # React Query hooks
│   ├── navigation/          # React Navigation navigators
│   ├── screens/             # All app screens
│   ├── services/            # Auth, Biometric, Camera, Location, Notification
│   ├── storage/             # MMKV and SecureStore helpers
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript domain types
│   ├── schemas/             # Zod schemas
│   └── utils/               # Scaling / accessibility utilities
└── src/__tests__/
    ├── unit/                # Jest unit tests
    └── property/            # fast-check property-based tests
```
