# Trendify

**Domain: News & Trend Aggregation Mobile App**

Trendify is a cross-platform mobile application that aggregates trending content across multiple categories — technology, sports, finance, entertainment, health, and science. Users can browse a personalized feed, explore trends by category or region, bookmark articles for later, and manage their preferences. Built with React Native and Expo.

---

## Features

- **Onboarding Flow** — Welcome walkthrough, feature introduction, permission requests (camera, location, notifications), and optional biometric setup
- **Authentication** — Email/password registration and login with secure token storage, biometric login support, and session restore
- **Trend Feed** — Infinite-scrolling feed of trending articles powered by React Query, filterable by category and region
- **Explore** — Discover trends across different categories and regions
- **Bookmarks** — Save articles locally (MMKV) with background sync to the API; works offline
- **User Profile** — View and manage account details and avatar
- **Preferences** — Choose preferred categories, toggle notifications, location, biometric lock, and set daily reminder times; synced to the backend
- **Permissions** — Managed through a unified permission service for camera, location, and notifications
- **Error Handling** — Global ErrorBoundary catches unexpected crashes gracefully

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 54) + React Native 0.81 |
| Language | TypeScript |
| Navigation | React Navigation 6 (native stack + bottom tabs) |
| Data Fetching | TanStack React Query 5 (infinite queries, caching) |
| State Management | Zustand 5 |
| Schema Validation | Zod 3 |
| Secure Storage | expo-secure-store (tokens) |
| Local Storage | react-native-mmkv (bookmarks, preferences) |
| Biometrics | expo-local-authentication |
| Camera | expo-camera + expo-image-picker |
| Location | expo-location |
| Notifications | expo-notifications |
| Testing | Jest 29, ts-jest, fast-check (property-based) |

---

## Project Structure

```
Trendify/
├── App.tsx                          # Root entry point
├── src/
│   ├── api/                         # API client, config, HTTP helpers (Zod-validated)
│   ├── components/                  # Shared components (ErrorBoundary)
│   ├── hooks/                       # React Query hooks (useTrendFeed, useTrendItemDetail)
│   ├── navigation/                  # React Navigation navigators
│   │   ├── RootNavigator.tsx        #   Onboarding → Auth → Main routing
│   │   ├── MainNavigator.tsx        #   Bottom tabs (Feed, Explore, Bookmarks, Profile)
│   │   ├── AuthNavigator.tsx        #   Login / Register
│   │   ├── FeedNavigator.tsx        #   Feed + detail
│   │   ├── ExploreNavigator.tsx     #   Explore
│   │   ├── BookmarksNavigator.tsx   #   Bookmarks
│   │   └── OnboardingNavigator.tsx  #   Welcome → Features → Permissions → Biometric
│   ├── screens/                     # All app screens
│   │   ├── auth/                    #   LoginScreen, RegisterScreen
│   │   ├── bookmarks/               #   Bookmarks list
│   │   ├── explore/                 #   ExploreScreen
│   │   ├── feed/                    #   FeedScreen, TrendItemDetailScreen
│   │   ├── onboarding/              #   Welcome, FeatureIntro, Permissions, BiometricSetup
│   │   └── profile/                 #   ProfileScreen
│   ├── services/                    # Auth, Biometric, Camera, Location, Notification, Permissions
│   ├── storage/                     # MMKV and SecureStore helpers
│   ├── stores/                      # Zustand stores (auth, bookmarks, preferences)
│   ├── types/                       # TypeScript domain types
│   ├── schemas/                     # Zod schemas for API validation
│   └── utils/                       # Scaling / accessibility utilities
└── src/__tests__/
    ├── unit/                        # Jest unit tests
    └── property/                    # fast-check property-based tests
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- [Expo Go](https://expo.dev/client) on your phone (for quick testing)
- Xcode (iOS Simulator, Mac only)
- Android Studio (Android Emulator)

### Install

```bash
npm install
```

### Run the Dev Server

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS Camera / Android Expo Go app). Your Mac and phone must be on the same Wi-Fi network.

### Run on Simulators

```bash
# iOS (requires Xcode)
npx expo start --ios

# Android (requires Android Studio + AVD)
npx expo start --android
```

---

## Testing

```bash
npm test
```

Runs all unit and property-based tests (Jest + fast-check).

---

## Development Build (Full Native Modules)

Expo Go does not include all native modules (e.g. `react-native-mmkv`, biometrics). For full functionality, create a development build with EAS:

```bash
npm install -g eas-cli
eas login
eas build:configure                          # first time only
eas build --profile development --platform ios
eas build --profile development --platform android
```

Then start the dev client:

```bash
npx expo start --dev-client
```

---

## API

The app connects to a backend hosted at:

```
https://trendify-backend-1vta.onrender.com/api/v1
```

Key endpoints used: `/auth/login`, `/auth/register`, `/auth/logout`, `/users/me`, `/users/me/preferences`, `/bookmarks`, and trend item endpoints.

---

## License

Private — not published to npm.
