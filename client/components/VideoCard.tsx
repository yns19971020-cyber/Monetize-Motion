import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, Dimensions, Platform } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import type { VideoWithUser } from "@shared/schema";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VideoCardProps {
  video: VideoWithUser;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfilePress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}

export function VideoCard({
  video,
  isActive,
  onLike,
  onComment,
  onShare,
  onProfilePress,
}: VideoCardProps) {
  const { theme } = useTheme();
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [likeCount, setLikeCount] = useState(video.likeCount || 0);
  const heartScale = useSharedValue(1);
  const doubleTapScale = useSharedValue(0);
  const doubleTapOpacity = useSharedValue(0);

  const player = useVideoPlayer(video.videoUrl, (p) => {
    p.loop = true;
    if (isActive) {
      p.play();
    }
  });

  React.useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleDoubleTapLike = useCallback(() => {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
      onLike();
    }
    triggerHaptic();

    doubleTapScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(0, { damping: 10 })
    );
    doubleTapOpacity.value = withSequence(
      withSpring(1),
      withSpring(0)
    );
  }, [isLiked, onLike, triggerHaptic]);

  const handleLikePress = useCallback(() => {
    triggerHaptic();
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
      onLike();
    }
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  }, [isLiked, onLike, triggerHaptic]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTapLike)();
    });

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const doubleTapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doubleTapScale.value }],
    opacity: doubleTapOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <GestureDetector gesture={doubleTap}>
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
          
          <Animated.View style={[styles.doubleTapHeart, doubleTapAnimatedStyle]}>
            <Feather name="heart" size={100} color={Colors.dark.accent} />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.sidebar}>
        <Pressable style={styles.sidebarItem} onPress={onProfilePress}>
          <Avatar
            uri={video.user.avatarUrl}
            size={48}
            showVerified={video.user.isVerified}
          />
        </Pressable>

        <AnimatedPressable
          style={[styles.sidebarItem, heartAnimatedStyle]}
          onPress={handleLikePress}
        >
          <Feather
            name="heart"
            size={28}
            color={isLiked ? Colors.dark.accent : "#fff"}
            style={isLiked ? styles.likedIcon : undefined}
          />
          <ThemedText type="small" style={styles.sidebarText}>
            {formatCount(likeCount)}
          </ThemedText>
        </AnimatedPressable>

        <Pressable style={styles.sidebarItem} onPress={onComment}>
          <Feather name="message-circle" size={28} color="#fff" />
          <ThemedText type="small" style={styles.sidebarText}>
            {formatCount(video.commentCount || 0)}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.sidebarItem} onPress={onShare}>
          <Feather name="share" size={28} color="#fff" />
          <ThemedText type="small" style={styles.sidebarText}>
            {formatCount(video.shareCount || 0)}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.bottomOverlay}>
        <Pressable onPress={onProfilePress}>
          <ThemedText type="body" style={styles.username}>
            @{video.user.username}
          </ThemedText>
        </Pressable>
        {video.caption ? (
          <ThemedText type="small" style={styles.caption} numberOfLines={2}>
            {video.caption}
          </ThemedText>
        ) : null}
        <View style={styles.viewCount}>
          <Feather name="eye" size={14} color="rgba(255,255,255,0.7)" />
          <ThemedText type="small" style={styles.viewCountText}>
            {formatCount(video.viewCount || 0)} views
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  doubleTapHeart: {
    position: "absolute",
    alignSelf: "center",
  },
  sidebar: {
    position: "absolute",
    right: Spacing.lg,
    bottom: 150,
    alignItems: "center",
    gap: Spacing.xl,
  },
  sidebarItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  sidebarText: {
    color: "#fff",
    fontWeight: "600",
  },
  likedIcon: {
    textShadowColor: Colors.dark.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bottomOverlay: {
    position: "absolute",
    left: Spacing.lg,
    right: 80,
    bottom: 100,
  },
  username: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  caption: {
    color: "rgba(255,255,255,0.9)",
    marginBottom: Spacing.sm,
  },
  viewCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  viewCountText: {
    color: "rgba(255,255,255,0.7)",
  },
});
