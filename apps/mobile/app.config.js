module.exports = {
  expo: {
    name: "Us",
    slug: "us-mobile",
    version: "1.0.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/dev/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/dev/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/dev/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    extra: {
      eas: {
        projectId: "local-dev"
      }
    }
  }
};
