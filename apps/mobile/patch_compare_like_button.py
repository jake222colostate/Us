from pathlib import Path

path = Path("src/screens/compare/CompareScreen.tsx")
text = path.read_text(encoding="utf-8")

# 1) Add handleQuickLike after handleSendLike
needle = "  }, [session?.user?.id, params.profile?.id, left, rightPhoto, rightPhotoSource, selectedPostId, show, navigation]);"
if "handleQuickLike" not in text and needle in text:
    insert = needle + """

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
      setIsSendingLike(true);
      await likeUser(session.user.id, params.profile.id, {
        kind: 'like',
        source: 'compare-quick',
      });
      show('Like sent!');
      await handleNextProfile();
    } catch (error) {
      console.error('Failed to send quick like', error);
      Alert.alert('Unable to send like', 'Please try again in a moment.');
    } finally {
      setIsSendingLike(false);
    }
  }, [session?.user?.id, params.profile?.id, show, handleNextProfile]);
"""
    text = text.replace(needle, insert)
    print("✅ Added handleQuickLike in CompareScreen.")
else:
    print("ℹ️ handleQuickLike already present or anchor not found.")

# 2) Rewire bottom Send Like button -> Like with new handler
label = "<Text style={styles.sendLikeLabel}>Send Like</Text>"
if label in text:
    idx = text.index(label)
    start = text.rfind("<Pressable", 0, idx)
    end = text.find("</Pressable>", idx)
    if start != -1 and end != -1:
        new_block = """      <Pressable
            accessibilityRole="button"
            onPress={handleQuickLike}
            style={({ pressed }) => [
              styles.sendLikeButton,
              pressed && styles.sendLikeButtonPressed,
            ]}
          >
            <Text style={styles.sendLikeLabel}>{isSendingLike ? 'Liking…' : 'Like'}</Text>
          </Pressable>"""
        text = text[:start] + new_block + text[end+len("</Pressable>"):]
        print("✅ Rewired bottom button to 'Like' and hooked up handleQuickLike.")
    else:
        print("⚠️ Could not locate Send Like Pressable block.")
else:
    print("⚠️ 'Send Like' label not found; no button changes applied.")

path.write_text(text, encoding="utf-8")
