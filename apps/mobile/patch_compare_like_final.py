from pathlib import Path

path = Path("src/screens/compare/CompareScreen.tsx")
text = path.read_text(encoding="utf-8")

changed = False

# 1) Insert handleQuickLike (if not already there)
if "handleQuickLike" not in text:
    marker = "  const handleSendLike = useCallback("
    idx = text.find(marker)
    if idx != -1:
        insert_at = idx
        snippet = '''
  const handleQuickLike = useCallback(async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Create an account to send likes.');
      return;
    }
    if (!params.profile?.id) {
      Alert.alert('Missing profile', 'This profile is no longer available.');
      return;
    }

    try {
      const result = await likeUser(session.user.id, params.profile.id, {
        kind: 'like',
        source: 'compare-quick',
      });

      if (result.matchCreated) {
        show('It’s a match! 🎉');
      } else {
        show('Like sent!');
      }

      await handleNextProfile();
    } catch (error):
      print('Failed to send quick like', error)
      Alert.alert('Unable to send', 'Please try again in a moment.')
  }, [session?.user?.id, params.profile?.id, show, handleNextProfile]);

'''
        text = text[:insert_at] + snippet + text[insert_at:]
        changed = True
        print("✅ Inserted handleQuickLike.")
    else:
        print("⚠️ handleSendLike marker not found; could not insert handleQuickLike.")
else:
    print("ℹ️ handleQuickLike already present; skipping insert.")

# 2) Replace CTA block (buttons) with Send-photo + Like buttons
cta_marker = "        <View style={styles.ctaRow}>"
cta_idx = text.find(cta_marker)
scroll_marker = "\n      </ScrollView>"
scroll_idx = text.find(scroll_marker)
if cta_idx != -1 and scroll_idx != -1 and scroll_idx > cta_idx:
    new_cta = '''        <View style={styles.ctaColumn}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSendLike}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && canSendLike && styles.primaryButtonPressed,
              !canSendLike && styles.primaryButtonDisabled,
            ]}
            onPress={handleSendLike}
          >
            <Text style={styles.primaryButtonLabel}>
              {isSendingLike ? 'Sending…' : 'Send the photo of Us'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleQuickLike}
            style={({ pressed }) => [
              styles.quickLikeButton,
              pressed && styles.quickLikeButtonPressed,
            ]}
          >
            <Text style={styles.quickLikeLabel}>Like</Text>
          </Pressable>
        </View>'''
    before = text[:cta_idx]
    after = text[scroll_idx:]
    text = before + new_cta + after
    changed = True
    print("✅ Replaced CTA block with Send-photo + Like buttons.")
else:
    print("⚠️ CTA block markers not found; no CTA replacement applied.")

# 3) Inject styles for ctaColumn + quickLike button
if "quickLikeButton" not in text:
    styles_marker = "    ctaRow:"
    styles_idx = text.find(styles_marker)
    if styles_idx != -1:
        end_idx = text.find("},", styles_idx)
        if end_idx != -1:
            end_idx += 2
            snippet = '''
    ctaColumn: {
      marginTop: 24,
      gap: spacing.md,
    },
    quickLikeButton: {
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 28,
      borderRadius: 999,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.accent,
    },
    quickLikeButtonPressed: {
      opacity: 0.9,
    },
    quickLikeLabel: {
      fontWeight: '600',
      color: palette.accent,
      fontSize: 16,
    },'''
            text = text[:end_idx] + snippet + text[end_idx:]
            changed = True
            print("✅ Added ctaColumn/quickLike styles after ctaRow.")
        else:
            print("⚠️ Could not find end of ctaRow style block; no style insert.")
    else:
        print("⚠️ ctaRow style marker not found; no style insert.")
else:
    print("ℹ️ quickLike styles already present; skipping style insert.")

if changed:
    path.write_text(text, encoding="utf-8")
    print("💾 CompareScreen.tsx updated.")
else:
    print("ℹ️ No changes written; file already up to date.")
