from pathlib import Path

path = Path("src/screens/compare/CompareScreen.tsx")
text = path.read_text(encoding="utf-8")

old = "\n    </SafeAreaView>\n  );\n}"
new = "\n      </ScrollView>\n    </SafeAreaView>\n  );\n}"

if old not in text:
    print("⚠️ Pattern not found, no changes made. Dumping last 40 lines for inspection:")
    print("\n".join(text.splitlines()[-40:]))
else:
    path.write_text(text.replace(old, new), encoding="utf-8")
    print("✅ Inserted missing </ScrollView> before </SafeAreaView>.")
