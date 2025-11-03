const APP_NAME = "Us";
const SLUG = "us-mobile";
const IOS_BUNDLE_IDENTIFIER = "com.us.mobile";
const ANDROID_PACKAGE = "com.us.mobile";

const env = process.env;

export default {
  expo: {
    name: APP_NAME,
    slug: SLUG,
    version: "1.0.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/dev/icon.png",
    userInterfaceStyle: "light",
    scheme: "us",
    assetBundlePatterns: ["**/*"],
    updates: {
      fallbackToCacheTimeout: 0,
    },
    splash: {
      image: "./assets/dev/icon.png",
      resizeMode: "contain",
      backgroundColor: "#0b1220",
    },
    ios: {
      bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription:
          "Allow Us to access your camera so you can verify your identity and add photos to your profile.",
        NSPhotoLibraryUsageDescription:
          "Allow Us to access your photo library so you can upload profile photos for moderation.",
        NSPhotoLibraryAddUsageDescription:
          "Allow Us to save approved photos so you can keep copies on your device.",
      },
    },
    android: {
      package: ANDROID_PACKAGE,
      adaptiveIcon: {
        foregroundImage: "./assets/dev/adaptive-icon.png",
        backgroundColor: "#0b1220",
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
      ],
    },
    web: {
      bundler: "metro",
      favicon: "./assets/dev/icon.png",
    },
    extra: {
      supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiBaseUrl: env.EXPO_PUBLIC_API_BASE_URL,
      eas: {
        projectId: "local-dev",
      },
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
  },
};
