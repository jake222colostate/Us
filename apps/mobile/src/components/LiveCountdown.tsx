import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

function formatRemaining(expiresAt: string) {
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) {
    return '00:00';
  }
  const diff = Math.max(0, expires - Date.now());
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

type Props = {
  expiresAt: string;
  style?: TextStyle;
};

export function LiveCountdown({ expiresAt, style }: Props) {
  const [label, setLabel] = React.useState(() => formatRemaining(expiresAt));

  React.useEffect(() => {
    setLabel(formatRemaining(expiresAt));
    const interval = setInterval(() => {
      setLabel(formatRemaining(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <Text style={[styles.countdown, style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  countdown: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
});

export default LiveCountdown;
