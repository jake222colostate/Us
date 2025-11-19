# Patch FeedCard to show post.avatar in top left of bottom row
sed -i "/<View style={styles.topRow}>/a \ \ \ \ \ \ {post.avatar ? (\n            <Image source={{ uri: post.avatar }} style={styles.avatar} />\n          ) : null}" apps/mobile/src/features/feed/components/FeedCard.tsx
