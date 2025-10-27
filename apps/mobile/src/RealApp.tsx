import React from 'react';
import RootNavigator from './navigation/RootNavigator';

export default function RealApp() {
  console.log('🟩 RealApp render (navigator)');
  return <RootNavigator />;
}
