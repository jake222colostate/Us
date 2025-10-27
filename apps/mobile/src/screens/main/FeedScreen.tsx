import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFeedQuery } from '../../features/feed/hooks';
import { FeedCard } from '../../features/feed/components/FeedCard';
import { Skeleton, DistanceSlider, Text } from '@us/ui';
import { useLocationStore } from '../../state/locationStore';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';

export const FeedScreen: React.FC = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } = useFeedQuery();
  const radiusKm = useLocationStore((state) => state.radiusKm);
  const setRadius = useLocationStore((state) => state.setRadius);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const posts = useMemo(() => {
    const items = data?.pages.flatMap((page) => page.posts) ?? [];
    return items.filter((post, index) => {
      const prev = items[index - 1];
      return !prev || prev.user_id !== post.user_id;
    });
  }, [data]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const refreshControl = (
    <RefreshControl
      refreshing={isLoading}
      onRefresh={() => {
        refetch();
      }}
      tintColor="#FF4F8B"
    />
  );

  const header = (
    <View style={styles.header}>
      <Text weight="bold" style={styles.headerTitle}>
        Nearby moments
      </Text>
      <DistanceSlider value={radiusKm} onChange={setRadius} unit={Platform.OS === 'ios' ? 'mi' : 'km'} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={posts}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            distanceText={item.profile?.radius_km ? `${item.profile?.radius_km} km away` : undefined}
            onOpenProfile={() => navigation.navigate('Profile', { screen: 'ProfileDetail', params: { userId: item.user_id } })}
          />
        )}
        estimatedItemSize={420}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={styles.headerContainer}
        ListFooterComponent={hasNextPage ? <Skeleton style={styles.skeleton} rounded="xl" /> : null}
        refreshing={isLoading}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        refreshControl={refreshControl}
        ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
        ListEmptyComponent={isLoading ? <Skeleton style={styles.skeleton} rounded="xl" /> : <Text muted>No posts nearby yet. Adjust your distance.</Text>}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 120,
  },
  headerContainer: {
    marginBottom: 24,
  },
  header: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
  },
  skeleton: {
    height: 420,
  },
});
