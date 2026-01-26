import React, { useState } from "react";
import { StyleSheet, View, TextInput, FlatList, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { VideoWithUser } from "@shared/schema";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const ITEM_GAP = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

type RootStackParamList = {
  Main: undefined;
  VideoDetail: { videoId: string };
};

type DiscoverScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Main">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: videos, isLoading } = useQuery<VideoWithUser[]>({
    queryKey: ["/api/videos/trending"],
  });

  const filteredVideos = searchQuery
    ? videos?.filter(
        (v) =>
          v.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;

  const renderItem = ({ item, index }: { item: VideoWithUser; index: number }) => (
    <AnimatedPressable
      entering={FadeIn.delay(index * 50).duration(300)}
      style={styles.gridItem}
      onPress={() => navigation.navigate("VideoDetail", { videoId: item.id })}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.videoUrl }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemOverlay}>
        <View style={styles.viewCount}>
          <Feather name="play" size={12} color="#fff" />
          <ThemedText type="small" style={styles.viewCountText}>
            {formatCount(item.viewCount || 0)}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );

  const trendingHashtags = ["#viral", "#comedy", "#dance", "#challenge", "#fyp"];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[
          styles.searchContainer,
          {
            paddingTop: headerHeight + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search videos or creators..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {!searchQuery ? (
          <View style={styles.hashtags}>
            {trendingHashtags.map((tag, index) => (
              <Pressable
                key={tag}
                style={[styles.hashtagChip, { backgroundColor: theme.primary + "20" }]}
                onPress={() => setSearchQuery(tag)}
              >
                <ThemedText type="small" style={{ color: theme.primary }}>
                  {tag}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Animated.View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !filteredVideos || filteredVideos.length === 0 ? (
        <EmptyState
          image={require("../../assets/images/empty-search.png")}
          title={searchQuery ? "No Results Found" : "Discover Videos"}
          description={
            searchQuery
              ? "Try a different search term"
              : "Popular videos will appear here"
          }
        />
      ) : (
        <FlatList
          data={filteredVideos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={{
            paddingBottom: tabBarHeight + Spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: ITEM_GAP }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  hashtags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  hashtagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: ITEM_GAP,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  itemOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: Spacing.xs,
  },
  viewCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCountText: {
    color: "#fff",
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
