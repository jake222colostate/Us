import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFeedQuery } from '../../features/feed/hooks';
import { FeedCard } from '../../features/feed/components/FeedCard';
import { Skeleton, DistanceSlider, Text } from '@us/ui';
import { useLocationStore } from '../../state/locationStore';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export const FeedScreen: React.FC = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } = useFeedQuery();
  const radiusKm = useLocationStore((state) => state.radiusKm);
  const setRadius = useLocationStore((state) => state.setRadius);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

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
      <View>
        <Text weight="bold" style={styles.headerTitle}>
          Discover nearby moments
        </Text>
        <Text muted style={styles.headerSubtitle}>
          Swipe through fresh stories around you and send a heart when something sparks.
        </Text>
      </View>
      <View style={styles.sliderBlock}>
        <Text muted weight="semibold" style={styles.sliderLabel}>
          Distance filter
        </Text>
        <DistanceSlider value={radiusKm} onChange={setRadius} unit={Platform.OS === 'ios' ? 'mi' : 'km'} />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#07070C', '#050509', '#020205']} style={styles.container}>
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
        estimatedItemSize={560}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={[styles.headerContainer, isDesktop && styles.headerContainerDesktop]}
        ListFooterComponent={hasNextPage ? <Skeleton style={styles.skeleton} rounded="xl" /> : null}
        refreshing={isLoading}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={refreshControl}
        ItemSeparatorComponent={() => <View style={{ height: 32 }} />}
        ListEmptyComponent={
          isLoading ? (
            <Skeleton style={styles.skeleton} rounded="xl" />
          ) : (
            <Text muted style={styles.emptyText}>
              No posts nearby yet. Adjust your distance to explore more moments.
            </Text>
          )
        }
        contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 160,
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 32,
  },
  header: {
    backgroundColor: 'rgba(15,15,30,0.72)',
    borderRadius: 28,
    padding: 24,
    gap: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 6,
    color: 'rgba(235,235,245,0.7)',
    lineHeight: 20,
  },
  sliderBlock: {
    gap: 12,
  },
  sliderLabel: {
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  skeleton: {
    height: 560,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 40,
  },
  listContentDesktop: {
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  headerContainerDesktop: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
});
