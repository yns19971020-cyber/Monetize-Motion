import React, { useState, useCallback, useRef } from "react";
import { StyleSheet, View, Dimensions, FlatList, ActivityIndicator, ViewToken, Share, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { VideoCard } from "@/components/VideoCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import type { VideoWithUser } from "@shared/schema";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type RootStackParamList = {
  Main: undefined;
  Comments: { videoId: string };
  UserProfile: { userId: string };
};

type FeedScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Main">;
};

export default function FeedScreen({ navigation }: FeedScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const { data: videos, isLoading, error, refetch } = useQuery<VideoWithUser[]>({
    queryKey: ["/api/videos/feed"],
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  const handleLike = async (videoId: string) => {
    try {
      await apiRequest("POST", `/api/videos/${videoId}/like`);
    } catch (error) {
      console.error("Failed to like video:", error);
    }
  };

  const handleComment = (videoId: string) => {
    navigation.navigate("Comments", { videoId });
  };

  const handleShare = async (video: VideoWithUser) => {
    try {
      await Share.share({
        message: `Check out this video by @${video.user.username} on ViralPay!`,
        url: video.videoUrl,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleProfilePress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const renderItem = useCallback(
    ({ item, index }: { item: VideoWithUser; index: number }) => (
      <VideoCard
        video={item}
        isActive={index === activeIndex}
        onLike={() => handleLike(item.id)}
        onComment={() => handleComment(item.id)}
        onShare={() => handleShare(item)}
        onProfilePress={() => handleProfilePress(item.user.id)}
      />
    ),
    [activeIndex]
  );

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <EmptyState
          image={require("../../assets/images/empty-feed.png")}
          title="No Videos Yet"
          description="Be the first to upload a video and start earning!"
          actionLabel="Upload Video"
          onAction={() => {}}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews={Platform.OS !== "web"}
        maxToRenderPerBatch={3}
        windowSize={5}
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
});
