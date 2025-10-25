/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  apps: {
    'ios.sim': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Us.app',
    },
    'android.emu': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 14' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_5_API_33' },
    },
  },
  configurations: {
    ios: {
      device: 'simulator',
      app: 'ios.sim',
    },
    android: {
      device: 'emulator',
      app: 'android.emu',
    },
  },
};
