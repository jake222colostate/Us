import React from 'react';
import { View, Text } from 'react-native';
export { App as RealApp } from './App';

export default function AppDefault() {
  return (
    <View style={{ flex: 1 }}>
      {/* always-visible debug overlay */}
      <View style={{
        position:'fixed', top:12, left:12, zIndex:9999,
        backgroundColor:'#0b1020', borderRadius:8, paddingHorizontal:10, paddingVertical:6,
        borderWidth:1, borderColor:'#1f3b64'
      }}>
        <Text style={{ color:'#7cf' }}>🧩 AppDefault overlay (web)</Text>
      </View>

      {/* your real app */}
      <RealApp />
    </View>
  );
}
