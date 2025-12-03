from pathlib import Path

path = Path("src/screens/compare/CompareScreen.tsx")
text = path.read_text(encoding="utf-8")

lines = text.splitlines()
out = []
in_quick = False

for line in lines:
    # Enter quick-like block when we see the label
    if 'Send Like' in line:
        in_quick = True
        line = line.replace('Send Like', 'Like')

    if in_quick:
        # Drop any disabled prop so the button is always tappable
        if 'disabled=' in line:
            print("🧹 Removing disabled= from quick-like button:", line.strip())
            continue

        # Ensure this button calls handleQuickLike
        if 'onPress=' in line and 'handleQuickLike' not in line:
            print("🔧 Rewiring quick-like onPress to handleQuickLike.")
            indent = line[:len(line) - len(line.lstrip())]
            line = f"{indent}onPress={{handleQuickLike}}"

    # Leave quick-like block at the end of its Pressable
    if in_quick and '</Pressable>' in line:
        in_quick = False

    out.append(line)

path.write_text("\n".join(out), encoding="utf-8")
print("✅ Quick-like button updated: label='Like', always enabled, uses handleQuickLike.")
