# Implementation Plan: Trendify

## Overview

Incremental implementation of the Trendify Expo/TypeScript app. Each task builds on the previous, wiring everything together by the end. Tests are co-located with the code they validate.

## Tasks

- [x] 1. Project foundation — types, schemas, and storage
  - [x] 1.1 Define all domain types and Zod schemas
    - Create `src/types/index.ts` with `TrendItem`, `TrendItemPage`, `AuthToken`, `AuthResult`, `BiometricResult`, `CaptureResult`, `Coordinates`, `UserProfile`, `FetchTrendParams`, `PermissionType`, `PermissionStatus`, `Category`, `PermissionResults`
    - Create `src/schemas/index.ts` with `TrendItemSchema`, `TrendItemPageSchema`, `AuthTokenSchema` (Zod)
    - _Requirements: 12.1, 12.6, 12.7_

  - [x] 1.2 Write property tests for Zod schema validation (P15) and serialization round-trip (P16)
    - **Property 15: Zod schema rejects invalid API responses**
    - **Property 16: API serialization round-trip**
    - **Validates: Requirements 12.6, 12.7**
    - File: `src/__tests__/property/api-schema.property.test.ts`

- [x] 2. Local storage layer — MMKV and SecureStore wrappers
  - [x] 2.1 Create MMKV storage module
    - Create `src/storage/mmkv.ts` exporting a typed MMKV instance
    - Implement typed helpers: `getBookmarks`, `setBookmarks`, `getPreferences`, `setPreferences`, `getOnboardingComplete`, `setOnboardingComplete`, `getPermissionDenials`, `setPermissionDenials`
    - _Requirements: 9.1, 1.4, 1.3_

  - [x] 2.2 Create SecureStore token helpers
    - Create `src/storage/secureStore.ts` with `storeToken`, `getToken`, `clearToken`
    - _Requirements: 2.2, 2.6_

- [x] 3. Zustand stores
  - [x] 3.1 Implement AuthStore
    - Create `src/stores/authStore.ts` with `token`, `user`, `isAuthenticated`, `setToken`, `clearAuth`
    - Persist token to SecureStore on `setToken`; clear on `clearAuth`
    - _Requirements: 2.2, 2.6_

  - [x] 3.2 Implement PreferencesStore
    - Create `src/stores/preferencesStore.ts` with all preference fields and setters
    - Persist to MMKV on every mutation
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 3.3 Implement BookmarksStore
    - Create `src/stores/bookmarksStore.ts` with `bookmarks`, `addBookmark`, `removeBookmark`, `isBookmarked`
    - Persist to MMKV on every mutation
    - _Requirements: 4.4, 9.1, 9.4_

  - [x] 3.4 Write property tests for BookmarksStore (P8, P9)
    - **Property 8: Bookmark round-trip**
    - **Property 9: Bookmark removal clears storage**
    - **Validates: Requirements 4.4, 9.1, 9.4**
    - File: `src/__tests__/property/bookmarks.property.test.ts`

  - [x] 3.5 Write unit tests for AuthStore and BookmarksStore
    - Test `setToken` persists to SecureStore, `clearAuth` clears it
    - Test `addBookmark` / `removeBookmark` / `isBookmarked` with concrete items
    - File: `src/__tests__/unit/bookmarks.test.ts`

- [x] 4. Service layer
  - [x] 4.1 Implement PermissionManager
    - Create `src/services/permissionManager.ts` implementing `requestAll`, `getStatus`, `recordDenial`
    - Read/write denial list from MMKV storage
    - _Requirements: 1.2, 1.3_

  - [x] 4.2 Write property test for permission denial recording (P1) and onboarding flag (P2)
    - **Property 1: Permission denial is recorded for all permission types**
    - **Property 2: Onboarding completion flag persists**
    - **Validates: Requirements 1.3, 1.4**
    - File: `src/__tests__/property/permissions.property.test.ts`

  - [x] 4.3 Implement AuthService
    - Create `src/services/authService.ts` implementing `register`, `login`, `logout`, `restoreSession`, `storeToken`, `clearToken`
    - Use SecureStore helpers; return generic error messages on invalid credentials
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 4.4 Write property tests for AuthService (P3, P4, P5)
    - **Property 3: Auth token round-trip**
    - **Property 4: Invalid credential errors are non-specific**
    - **Property 5: Logout clears all auth state**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.6**
    - File: `src/__tests__/property/auth.property.test.ts`

  - [x] 4.5 Write unit tests for AuthService
    - Test login success flow, token storage, session restore, logout
    - File: `src/__tests__/unit/auth.test.ts`

  - [x] 4.6 Implement BiometricService
    - Create `src/services/biometricService.ts` implementing `isAvailable`, `authenticate`, `enableBiometricLogin`, `disableBiometricLogin`
    - _Requirements: 2.5, 1.5_

  - [x] 4.7 Implement LocationService
    - Create `src/services/locationService.ts` implementing `getCurrentCoordinates`, `resolveRegionCode`, `requestPermission`
    - Timeout after 10 s; fall back to null
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.8 Implement CameraService
    - Create `src/services/cameraService.ts` implementing `openCamera`, `requestPermission`
    - _Requirements: 6.1, 6.2_

  - [x] 4.9 Implement NotificationService
    - Create `src/services/notificationService.ts` implementing `register`, `scheduleDaily`, `cancelScheduled`, `requestPermission`
    - _Requirements: 7.1, 7.4_

- [x] 5. API Client
  - [x] 5.1 Implement APIClient with Zod validation
    - Create `src/api/client.ts` implementing `fetchTrendItems` and `fetchTrendItemById`
    - Validate all responses with `TrendItemPageSchema` / `TrendItemSchema`; throw on parse failure
    - Serialize `FetchTrendParams` (categories array, regionCode) into query string
    - _Requirements: 3.1, 3.2, 5.2, 12.6, 12.7_

- [x] 6. React Query hooks
  - [x] 6.1 Implement `useTrendFeed` infinite query hook
    - Create `src/hooks/useTrendFeed.ts`
    - Read categories from PreferencesStore and pass to APIClient
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [x] 6.2 Implement `useTrendItemDetail` query hook
    - Create `src/hooks/useTrendItemDetail.ts`
    - _Requirements: 4.1_

  - [x] 6.3 Write property tests for feed query (P6, P7, P10)
    - **Property 6: Category preferences are included in API requests**
    - **Property 7: Network error produces error state with retry**
    - **Property 10: Location coordinates produce region code in API params**
    - **Validates: Requirements 3.2, 3.5, 5.2, 8.2**
    - File: `src/__tests__/property/feed.property.test.ts`

  - [x] 6.4 Write unit tests for feed and detail hooks
    - Test loading state, success state, error state, pull-to-refresh
    - File: `src/__tests__/unit/feed.test.ts`

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Navigation structure
  - [x] 8.1 Set up RootNavigator with OnboardingNavigator, AuthNavigator, MainNavigator
    - Create `src/navigation/RootNavigator.tsx`
    - Gate on `onboarding_complete` flag (MMKV) and `isAuthenticated` (AuthStore)
    - _Requirements: 10.1, 10.3, 1.1_

  - [x] 8.2 Implement MainNavigator bottom tabs (Feed, Explore, Bookmarks, Profile)
    - Create `src/navigation/MainNavigator.tsx` with React Navigation bottom tabs
    - _Requirements: 10.1, 10.2_

  - [x] 8.3 Implement stack navigators for Feed and Explore tabs
    - Create `src/navigation/FeedNavigator.tsx` and `src/navigation/ExploreNavigator.tsx`
    - _Requirements: 10.3, 10.4_

  - [x] 8.4 Write unit tests for navigation routing
    - Test unauthenticated → AuthNavigator, authenticated → MainNavigator, onboarding gating
    - File: `src/__tests__/unit/navigation.test.ts`

- [x] 9. Onboarding screens
  - [x] 9.1 Implement WelcomeScreen and FeatureIntroScreen
    - Create `src/screens/onboarding/WelcomeScreen.tsx` and `FeatureIntroScreen.tsx`
    - _Requirements: 1.1_

  - [x] 9.2 Implement PermissionsScreen
    - Create `src/screens/onboarding/PermissionsScreen.tsx`
    - Call `PermissionManager.requestAll()`; record denials; show per-permission status
    - _Requirements: 1.2, 1.3_

  - [x] 9.3 Implement BiometricSetupScreen
    - Create `src/screens/onboarding/BiometricSetupScreen.tsx`
    - Show only when `BiometricService.isAvailable()` returns true
    - On completion write `onboarding_complete = true` to MMKV
    - _Requirements: 1.4, 1.5_

- [x] 10. Auth screens
  - [x] 10.1 Implement LoginScreen
    - Create `src/screens/auth/LoginScreen.tsx`
    - Call `AuthService.login`; on success dispatch `setToken` to AuthStore
    - Show generic error message on failure
    - Support biometric login when enabled
    - _Requirements: 2.1, 2.3, 2.5_

  - [x] 10.2 Implement RegisterScreen
    - Create `src/screens/auth/RegisterScreen.tsx`
    - Call `AuthService.register`; on success navigate to MainNavigator
    - _Requirements: 2.1_

- [x] 11. Feed and Explore screens
  - [x] 11.1 Implement FeedScreen
    - Create `src/screens/feed/FeedScreen.tsx`
    - Use `useTrendFeed` hook; render virtualized `FlatList` with skeleton loader
    - Pull-to-refresh, infinite scroll trigger at 200 px from bottom
    - Show location indicator while location is resolving
    - Show error message + retry button on query error
    - Show offline message + link to Bookmarks when no network and no cache
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 5.4, 9.3, 12.4_

  - [x] 11.2 Implement ExploreScreen
    - Create `src/screens/explore/ExploreScreen.tsx`
    - Reuse `useTrendFeed` with category filter UI
    - _Requirements: 3.1, 3.2_

  - [x] 11.3 Implement TrendItemDetailScreen
    - Create `src/screens/feed/TrendItemDetailScreen.tsx`
    - Display full title, description, source, date, cached image
    - Bookmark button (wired to BookmarksStore), share button (native share sheet)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 12. Bookmarks screen
  - [x] 12.1 Implement BookmarksScreen
    - Create `src/screens/bookmarks/BookmarksScreen.tsx`
    - Read from BookmarksStore; support remove bookmark
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 13. Profile screen and preferences
  - [x] 13.1 Implement ProfileScreen
    - Create `src/screens/profile/ProfileScreen.tsx`
    - Display display name, email; category multi-select; notification/location/biometric toggles
    - Show permission status badges for camera, location, notifications
    - Show settings deep-link prompts when permissions are denied
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.5_

  - [x] 13.2 Write property tests for preferences and permission status (P11, P12)
    - **Property 11: Preference toggle applies to service registration**
    - **Property 12: Permission status is accurately reflected in Profile screen**
    - **Validates: Requirements 8.3, 8.4, 8.5**
    - File: `src/__tests__/property/preferences.property.test.ts`
    - File: `src/__tests__/property/permissions.property.test.ts` (P12 appended)

  - [x] 13.3 Write unit tests for ProfileScreen
    - Test category selection persists, toggle wires to services, permission badges render
    - File: `src/__tests__/unit/profile.test.ts`

- [x] 14. Accessibility compliance
  - [x] 14.1 Audit and add `accessibilityLabel` to all interactive elements across all screens
    - Every `onPress` element must have a non-empty `accessibilityLabel`
    - _Requirements: 11.1_

  - [x] 14.2 Apply relative font units and minimum 44×44 pt touch targets
    - Use `rem`/`sp` or `PixelRatio`-scaled values for text
    - Wrap small touchables in a 44×44 pt hit-slop or container
    - _Requirements: 11.2, 11.3_

  - [x] 14.3 Write property tests for accessibility labels (P13) and touch target size (P14)
    - **Property 13: All interactive elements have accessibility labels**
    - **Property 14: All interactive elements meet minimum touch target size**
    - **Validates: Requirements 11.1, 11.3**
    - File: `src/__tests__/property/accessibility.property.test.ts`

- [x] 15. Error boundaries and app wiring
  - [x] 15.1 Add error boundaries around major screen components
    - Create `src/components/ErrorBoundary.tsx`
    - Wrap each tab's root screen
    - _Requirements: 12.5_

  - [x] 15.2 Wire QueryClient, Zustand providers, and NavigationContainer in `App.tsx`
    - Configure React Query `QueryClient` with sensible defaults
    - Restore auth session on app start via `AuthService.restoreSession`
    - _Requirements: 2.4, 12.2, 12.3_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with `numRuns: 100` minimum; each test file includes the comment `// Feature: trendify, Property N: <property_text>`
- Unit tests use Jest + React Native Testing Library
