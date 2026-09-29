# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Push notifications

The backend delivers push through **firebase-admin**
(`messaging.send_multicast`), so it expects a raw **FCM registration token**.
The app therefore calls `Notifications.getDevicePushTokenAsync()` — _not_
`getExpoPushTokenAsync()`, whose `ExponentPushToken[...]` value FCM rejects.

Registration lives in [`src/lib/pushNotifications.ts`](src/lib/pushNotifications.ts)
and is driven by [`PushNotificationsHost`](src/components/common/PushNotificationsHost.tsx),
mounted in the protected layout. It registers on sign-in
(`POST /api/v1/device-tokens`) and removes the token on sign-out
(`DELETE /api/v1/device-tokens/by-token/{token}`).

### Required before push will work

Two Firebase config files are referenced from `app.json` and are **not** in the
repo. Native builds fail until they are added:

| File                       | Where it goes | Source                                                                   |
| -------------------------- | ------------- | ------------------------------------------------------------------------ |
| `google-services.json`     | project root  | Firebase console → Project settings → Android app (`com.gatepassng.gms`) |
| `GoogleService-Info.plist` | project root  | Firebase console → Project settings → iOS app (`com.gatepassng.gms`)     |

The server also needs `FCM_CREDENTIALS_JSON` set (a Firebase service-account
key) or `notification_service` logs _"FCM not initialised"_ and silently skips
delivery.

### Platform status

- **Android** — works once `google-services.json` is present.
  `getDevicePushTokenAsync()` returns an FCM token directly.
- **iOS** — `getDevicePushTokenAsync()` returns an **APNs** token, which
  firebase-admin will not accept as a registration token. iOS needs the
  Firebase iOS SDK (via `GoogleService-Info.plist`) to exchange APNs → FCM.
  Verify an iOS token is accepted before relying on it.

### Expo Go

Expo Go dropped remote-notification support in SDK 53 and **throws on import**
of `expo-notifications`. Because push registration is reached from the auth
context, a static import crashes the whole app at startup in Expo Go.

`expo-notifications` and `expo-device` are therefore loaded with a runtime
`require()` behind a `pushSupported` guard (`Platform.OS !== 'web'` and not
Expo Go). Nothing may import them at module scope — the guard is the only
thing keeping Expo Go usable for day-to-day development.

To actually test push, use a development build:

```bash
npx expo run:android      # or: eas build --profile development --platform android
```

Push tokens are only issued on physical devices; simulators, web and Expo Go
are skipped, and `registerForPushNotifications()` simply returns `null`.
