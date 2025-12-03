from pathlib import Path

path = Path("src/screens/compare/CompareScreen.tsx")
text = path.read_text(encoding="utf-8")

start_marker = "        <View style={styles.ctaRow}>"
end_marker = "      <Modal"

if start_marker not in text or end_marker not in text:
    print("⚠️ Could not find CTA block anchors; no changes made.")
else:
    start = text.index(start_marker)
    end = text.index(end_marker, start)

    new_block = """        <View style={styles.ctaRow}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSendLike || isSendingLike}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && canSendLike && !isSendingLike && styles.primaryButtonPressed,
              (!canSendLike || isSendingLike) && styles.primaryButtonDisabled,
            ]}
            onPress={handleSendLike}
          >
            <Text style={styles.primaryButtonLabel}>
              {isSendingLike && canSendLike ? 'Sending…' : 'Send the photo of Us'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sendLikeRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isSendingLike}
            onPress={handleQuickLike}
            style={({ pressed }) => [
              styles.sendLikeButton,
              pressed && !isSendingLike && styles.sendLikeButtonPressed,
            ]}
          >
            <Text style={styles.sendLikeLabel}>{isSendingLike ? 'Liking…' : 'Like'}</Text>
          </Pressable>
        </View>

"""

    text = text[:start] + new_block + text[end:]
    path.write_text(text, encoding="utf-8")
    print("✅ CompareScreen CTA rebuilt: big 'Send the photo of Us' + single 'Like' button wired to handleQuickLike.")
