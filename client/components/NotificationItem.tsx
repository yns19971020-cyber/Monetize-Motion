import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { Notification } from "@shared/schema";

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getIcon(type: string): keyof typeof Feather.glyphMap {
  switch (type) {
    case "like":
      return "heart";
    case "comment":
      return "message-circle";
    case "follow":
      return "user-plus";
    case "earnings":
      return "dollar-sign";
    case "withdrawal":
      return "arrow-up-circle";
    default:
      return "bell";
  }
}

function getIconColor(type: string): string {
  switch (type) {
    case "like":
      return Colors.dark.accent;
    case "comment":
      return Colors.dark.primary;
    case "follow":
      return Colors.dark.primary;
    case "earnings":
      return Colors.dark.success;
    case "withdrawal":
      return Colors.dark.warning;
    default:
      return Colors.dark.textSecondary;
  }
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

export function NotificationItem({
  notification,
  onPress,
  index = 0,
}: NotificationItemProps) {
  const { theme } = useTheme();

  return (
    <AnimatedPressable
      entering={FadeInRight.delay(index * 50).duration(300)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: notification.isRead
            ? "transparent"
            : theme.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconColor(notification.type) + "20" },
        ]}
      >
        <Feather
          name={getIcon(notification.type)}
          size={20}
          color={getIconColor(notification.type)}
        />
      </View>

      <View style={styles.content}>
        <ThemedText type="body" style={styles.title}>
          {notification.title}
        </ThemedText>
        <ThemedText type="small" style={styles.message} numberOfLines={2}>
          {notification.message}
        </ThemedText>
        <ThemedText type="small" style={styles.time}>
          {formatTime(notification.createdAt)}
        </ThemedText>
      </View>

      {!notification.isRead ? (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  message: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  time: {
    opacity: 0.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
});
