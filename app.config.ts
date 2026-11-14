import type { ExpoConfig, ConfigContext } from 'expo/config';

const base = {
  name: 'GatePass',
  slug: 'gatepass',
  owner: 'gatepassng',
  version: '1.0.1',
  scheme: 'gatepass',
  orientation: 'portrait',
  icon: './src/assets/gatepass_ng_Gp.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './src/assets/images/gatepass-mark-white.png',
    resizeMode: 'contain',
    backgroundColor: '#113E55',
  },
  android: {
    package: 'com.gatepassng.gms',
    adaptiveIcon: {
      foregroundImage: './src/assets/android-adaptive-foreground.png',
      backgroundColor: '#FFFFFF',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'app.gatepassng.com',
            pathPrefix: '/activate',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        data: [
          {
            scheme: 'https',
            host: 'app.gatepassng.com',
            pathPrefix: '/auth/reset-password',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        data: [
          {
            scheme: 'gatepass',
            host: '*',
            pathPrefix: '/auth/reset-password',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    googleServicesFile: './google-services.json',
    permissions: ['NOTIFICATIONS', 'POST_NOTIFICATIONS'],
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.gatepassng.gms',
    associatedDomains: ['applinks:app.gatepassng.com'],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSFaceIDUsageDescription: 'Use Face ID to securely sign in to GatePass.',
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSExceptionDomains: {
          localhost: {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSIncludesSubdomains: true,
          },
          'cloudinary.com': {
            NSIncludesSubdomains: true,
            NSExceptionRequiresForwardSecrecy: false,
          },
          'cdnjs.cloudflare.com': {
            NSIncludesSubdomains: true,
          },
        },
      },
      UIBackgroundModes: ['remote-notification'],
    },
    googleServicesFile: './GoogleService-Info.plist',
    entitlements: {
      'aps-environment': 'production',
    },
  },
  web: {
    bundler: 'metro',
    output: 'single',
    image: './src/assets/gatepass_ng_Gp.png',
    favicon: './src/assets/gatepass_ng_Gp.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow GatePass to use your camera to scan access codes.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow GatePass to access your photos to update your profile picture.',
        cameraPermission:
          'Allow GatePass to use your camera to take a profile picture or identification photo.',
        microphonePermission: false,
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Use Face ID to securely sign in to GatePass.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './src/assets/images/gatepass-mark-white.png',
        imageWidth: 170,
        resizeMode: 'contain',
        backgroundColor: '#113E55',
        dark: {
          image: './src/assets/images/gatepass-mark-white.png',
          backgroundColor: '#113E55',
        },
      },
    ],
    'expo-secure-store',
    '@react-native-community/datetimepicker',
    'expo-sharing',
    'expo-status-bar',
    [
      'expo-notifications',
      {
        icon: './src/assets/gatepass_ng_Gp.png',
        color: '#113E55',
        defaultChannel: 'default',
      },
    ],
  ],
  assetBundlePatterns: ['**/*'],
  extra: {
    router: {},
    eas: {
      projectId: 'af7a228b-45e8-4505-bbef-4e9288d902e9',
    },
  },
} as ExpoConfig;

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE ?? process.env.APP_ENV ?? 'development';
  const isProduction = profile === 'production';

  return {
    ...config,
    ...base,
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/af7a228b-45e8-4505-bbef-4e9288d902e9',
      fallbackToCacheTimeout: 0,
    },
    ios: {
      ...base.ios,
      entitlements: {
        ...(base.ios?.entitlements ?? {}),
        // REL-06: development/preview use sandbox APNs; production uses production.
        'aps-environment': isProduction ? 'production' : 'development',
      },
    },
    plugins: [...(base.plugins ?? []), 'expo-updates'],
  };
};
