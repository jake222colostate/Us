from pathlib import Path

path = Path("App.tsx")
text = path.read_text()

if "StripeProvider" not in text:
    new = """import { StripeProvider } from '@stripe/stripe-react-native';"""
    text = text.replace("import React", f"{new}\nimport React")

if "StripeProvider" not in text:
    print("⚠️ Could not insert import; check manually.")
else:
    if "<StripeProvider" not in text:
        text = text.replace(
            "export default function App() {",
            "export default function App() {\n  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';"
        )
        text = text.replace(
            "return (",
            "return (\n    <StripeProvider publishableKey={publishableKey}>"
        )
        text = text.replace(
            ");\n}",
            "    </StripeProvider>\n  );\n}"
        )
        path.write_text(text)
        print('✅ Added StripeProvider around App root.')
    else:
        print('ℹ️ StripeProvider already present.')
