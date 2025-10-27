import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import App from './App';

export default function AppWeb(): JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Web mount OK — App.web.tsx</Text>
      </View>
      <View style={styles.appContainer}>
        <App />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  banner: {
    paddingVertical: 8,
    backgroundColor: '#FCE4F3',
    alignItems: 'center',
  },
  bannerText: {
    fontWeight: '600',
    color: '#A3206F',
  },
  appContainer: {
    flex: 1,
  },
});
import * as AppModule from './App';
// Use default if present, else named { App }
const RealApp = (AppModule as any).default ?? (AppModule as any).App;
export default RealApp;
