import React from "react";
import { StyleSheet, View, FlatList, Pressable, Dimensions, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius, Colors, Fonts } from "@/constants/theme";
import type { User, Video } from "@shared/schema";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const ITEM_GAP = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - ITEM_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

interface UserProfileScreenProps {
  route: { params: { userId: string } };
  navigation: any;
}

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function UserProfileScreen({ route, navigation }: UserProfileScreenProps) {
  const { userId } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();

  const { data: profileUser, isLoading: loadingUser } = useQuery<User & { isFollowing?: boolean }>({
    queryKey: ["/api/users", userId],
  });

  const { data: videos, isLoading: loadingVideos } = useQuery<Video[]>({
    queryKey: ["/api/users", userId, "videos"],
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        profileUser?.isFollowing ? "DELETE" : "POST",
        `/api/users/${userId}/follow`
      );
      return response.json();
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
    },
  });

  const isOwnProfile = currentUser?.id === userId;

  const renderVideoItem = ({ item, index }: { item: Video; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
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
      </Pressable>
    </Animated.View>
  );

  const ListHeader = () => (
    <View style={styles.headerContent}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.profileSection}>
        <Avatar
          uri={profileUser?.avatarUrl}
          size={90}
          showVerified={profileUser?.isVerified}
        />
        <ThemedText type="h3" style={styles.displayName}>
          {profileUser?.displayName || profileUser?.username}
        </ThemedText>
        <ThemedText type="body" style={styles.username}>
          @{profileUser?.username}
        </ThemedText>
        {profileUser?.bio ? (
          <ThemedText type="small" style={styles.bio}>
            {profileUser.bio}
          </ThemedText>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="h4" style={styles.statValue}>
              {formatCount(profileUser?.followerCount || 0)}
            </ThemedText>
            <ThemedText type="small" style={styles.statLabel}>
              Followers
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h4" style={styles.statValue}>
              {formatCount(profileUser?.followingCount || 0)}
            </ThemedText>
            <ThemedText type="small" style={styles.statLabel}>
              Following
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h4" style={styles.statValue}>
              {formatCount(videos?.length || 0)}
            </ThemedText>
            <ThemedText type="small" style={styles.statLabel}>
              Videos
            </ThemedText>
          </View>
        </View>

        {!isOwnProfile ? (
          <View style={styles.actionButtons}>
            <Button
              onPress={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              style={[
                styles.followButton,
                profileUser?.isFollowing && { backgroundColor: theme.surface },
              ]}
            >
              {profileUser?.isFollowing ? "Following" : "Follow"}
            </Button>
            <Pressable
              style={[styles.messageButton, { backgroundColor: theme.surface }]}
            >
              <Feather name="message-circle" size={20} color={theme.text} />
            </Pressable>
          </View>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.videosHeader}>
        <ThemedText type="h4">Videos</ThemedText>
      </Animated.View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        image={require("../../assets/images/empty-videos.png")}
        title="No Videos Yet"
        description={isOwnProfile ? "Upload your first video!" : "This user hasn't posted any videos yet."}
      />
    </View>
  );

  if (loadingUser) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={videos || []}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={loadingVideos ? null : ListEmpty}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={videos && videos.length > 0 ? styles.row : undefined}
        ItemSeparatorComponent={() => <View style={{ height: ITEM_GAP }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    marginBottom: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  displayName: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  username: {
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  bio: {
    opacity: 0.8,
    textAlign: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  statValue: {
    fontFamily: Fonts?.mono,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    opacity: 0.6,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  followButton: {
    paddingHorizontal: Spacing["4xl"],
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  videosHeader: {
    marginBottom: Spacing.md,
  },
  row: {
    gap: ITEM_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    aspectRatio: 9 / 16,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
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
  emptyContainer: {
    paddingTop: Spacing["3xl"],
  },
});
