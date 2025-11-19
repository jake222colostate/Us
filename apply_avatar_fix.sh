# Add avatar next to name
# Replace bottomRow metaBlock to include avatar image
sed -i "s|<Pressable style={styles.metaBlock} onPress={() => onOpenProfile(post.user_id)}>|<Pressable style={styles.metaBlock} onPress={() => onOpenProfile(post.user_id)}><Image source={{ uri: post.avatar }} style={styles.avatar} />|" apps/mobile/src/features/feed/components/FeedCard.tsx

# Inject avatar style at bottom of styles block
sed -i "/const styles = StyleSheet.create({/a \ \ avatar: {\n    width: 38,\n    height: 38,\n    borderRadius: 19,\n    marginBottom: 6,\n    borderWidth: 2,\n    borderColor: 'white',\n  }," apps/mobile/src/features/feed/components/FeedCard.tsx

# Force authStore avatar to always use signed URLs if available
sed -i "s|avatar: signedAvatar ?? firstApproved?.url ?? null|avatar: signedAvatar ?? (firstApproved?.url ?? null)|" apps/mobile/src/state/authStore.ts
