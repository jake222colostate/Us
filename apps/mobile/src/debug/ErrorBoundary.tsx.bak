import * as React from 'react';
import { Text, View, ScrollView } from 'react-native';

type Props = { children: React.ReactNode };
type State = { error?: any; info?: { componentStack?: string } };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any, info: any) {
    // Print full detail to native logs
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info?.componentStack);
    this.setState({ info });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ScrollView style={{ padding: 12 }}>
        <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>
          🔥 Render crash captured by ErrorBoundary
        </Text>
        <View style={{ height: 8 }} />
        <Text selectable style={{ fontFamily: 'Courier' }}>
          {String(this.state.error?.stack || this.state.error)}
        </Text>
        <View style={{ height: 8 }} />
        <Text selectable style={{ fontFamily: 'Courier' }}>
          {this.state.info?.componentStack}
        </Text>
      </ScrollView>
    );
  }
}
