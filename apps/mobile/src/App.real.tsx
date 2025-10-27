import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';

export default function RealApp() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0f19', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#111827' }}>
        <Text style={{ color: '#72f1b8', fontSize: 18, marginBottom: 8 }}>
          ✅ RealApp mounted
        </Text>
        <Text style={{ color: '#9ab' }}>
          Replace this with your actual navigation/UI once we’re rendering.
        </Text>
      </View>
    </SafeAreaView>
  );
}
