import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Us Mobile',
  slug: 'us-mobile',
  scheme: 'us',
  sdkVersion: '54.0.0',
  plugins: [
    'expo-secure-store',
    'expo-web-browser',
  ],
};

export default config;
