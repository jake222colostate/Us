import { ExpoConfig, ConfigContext } from 'expo/config';

const defineConfig = (_: ConfigContext): ExpoConfig => ({
  name: 'Us',
  slug: 'us',
  scheme: 'usapp',
  owner: 'us-co',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/dev/icon.png',
  userInterfaceStyle: 'automatic',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    billingMode: process.env.EXPO_PUBLIC_BILLING_MODE ?? 'auto',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    revenueCatSdkKey: process.env.EXPO_PUBLIC_REVENUECAT_SDK_KEY,
    bigHeartPriceUsd: process.env.EXPO_PUBLIC_BIGHEART_PRICE_USD ?? '3.99'
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.us.app',
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: {
    package: 'com.us.app',
    adaptiveIcon: {
      foregroundImage: './assets/dev/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    }
  },
  web: {
    bundler: 'metro',
    },
  plugins: [
    ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
    'expo-location',
    'expo-image-picker',
    'expo-media-library',
  ]
});

export default defineConfig;
