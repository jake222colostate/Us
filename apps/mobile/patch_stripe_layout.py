from pathlib import Path

path = Path("app/_layout.tsx")
text = path.read_text()

new = """import { Stack } from 'expo-router';
import { StripeProvider } from '@stripe/stripe-react-native';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={publishableKey}>
      <Stack screenOptions={{ headerShown: false }} />
    </StripeProvider>
  );
}
"""

path.write_text(new)
print("✅ app/_layout.tsx wrapped in StripeProvider. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your env.")
