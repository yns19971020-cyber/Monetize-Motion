import React, { useState, useCallback } from "react";
import { StyleSheet, View, FlatList, TextInput, Pressable, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInRight } from "react-native-reanimated";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { CommentWithUser } from "@shared/schema";

interface CommentsScreenProps {
  route: { params: { videoId: string } };
}

function formatTime(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

export default function CommentsScreen({ route }: CommentsScreenProps) {
  const { videoId } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const { data: comments, isLoading, refetch } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/videos", videoId, "comments"],
  });

  const postComment = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/videos", videoId, "comments"] });
    },
  });

  const handleSend = () => {
    if (!comment.trim()) return;
    postComment.mutate(comment.trim());
  };

  const renderComment = useCallback(
    ({ item, index }: { item: CommentWithUser; index: number }) => (
      <Animated.View
        entering={FadeInRight.delay(index * 30).duration(200)}
        style={styles.commentItem}
      >
        <Avatar uri={item.user.avatarUrl} size={36} />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <ThemedText type="small" style={styles.username}>
              @{item.user.username}
            </ThemedText>
            <ThemedText type="small" style={styles.time}>
              {formatTime(item.createdAt)}
            </ThemedText>
          </View>
          <ThemedText type="body" style={styles.commentText}>
            {item.content}
          </ThemedText>
          <View style={styles.commentActions}>
            <Pressable style={styles.actionButton}>
              <Feather name="heart" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={styles.actionText}>
                {item.likeCount || 0}
              </ThemedText>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Feather name="message-circle" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={styles.actionText}>
                Reply
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    ),
    [theme]
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="message-circle" size={48} color={theme.textSecondary} />
      <ThemedText type="body" style={styles.emptyText}>
        No comments yet
      </ThemedText>
      <ThemedText type="small" style={styles.emptyHint}>
        Be the first to comment!
      </ThemedText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={comments || []}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={isLoading ? null : ListEmpty}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        <Avatar uri={user?.avatarUrl} size={36} />
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
          placeholder="Add a comment..."
          placeholderTextColor={theme.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!comment.trim() || postComment.isPending}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: comment.trim() ? theme.primary : theme.textSecondary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {postComment.isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Feather name="send" size={18} color="#000" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  username: {
    fontWeight: "600",
  },
  time: {
    opacity: 0.5,
  },
  commentText: {
    marginBottom: Spacing.sm,
  },
  commentActions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionText: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    opacity: 0.7,
  },
  emptyHint: {
    opacity: 0.5,
    marginTop: Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
