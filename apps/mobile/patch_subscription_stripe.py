from pathlib import Path
import re

path = Path("src/lib/subscriptionActions.ts")
text = path.read_text(encoding="utf-8")

# 1) Make sure Linking is imported
if "Linking" not in text:
    text = text.replace(
        "import { Alert } from 'react-native';",
        "import { Alert, Linking } from 'react-native';",
    )

# 2) Replace startUpgradeFlow with a Stripe-based version
pattern = r"export function startUpgradeFlow[\\s\\S]*?}\\n\\nexport function startManageSubscription"

new_func = """export function startUpgradeFlow(planId: Exclude<SubscriptionPlanId, 'free'>) {
  const label = planId === 'plus' ? 'Premium' : 'Elite';
  console.log('[subscription] start upgrade flow (Stripe)', planId);

  // TODO: Replace these with real Stripe Checkout links for each plan
  const checkoutUrl =
    planId === 'plus'
      ? 'https://buy.stripe.com/test_plus_REPLACE_ME'
      : 'https://buy.stripe.com/test_pro_REPLACE_ME';

  Alert.alert(
    'Upgrade with Stripe',
    `You’ll be redirected to Stripe to start the ${label} plan. After payment, your plan will update automatically.`,
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Continue',
        style: 'default',
        onPress: () => {
          Linking.openURL(checkoutUrl).catch((err) => {
            console.warn('[subscription] failed to open Stripe URL', err);
            Alert.alert('Error', 'Unable to open Stripe checkout right now.');
          });
        },
      },
    ],
  );
}
"""

replacement = new_func + "\n\nexport function startManageSubscription"

if not re.search(pattern, text):
    raise SystemExit("❌ startUpgradeFlow/manageSubscription block pattern not found; no changes made.")

text = re.sub(pattern, replacement, text, count=1)
path.write_text(text, encoding="utf-8")
print("✅ subscriptionActions.ts: startUpgradeFlow now opens Stripe Checkout URL (update with real links).")
