import React from "react";
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { NotificationItem } from "@/components/NotificationItem";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing } from "@/constants/theme";
import type { Notification } from "@shared/schema";

export default function ActivityScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: notifications, isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {unreadCount > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.header,
            { paddingTop: headerHeight + Spacing.md, backgroundColor: theme.backgroundRoot },
          ]}
        >
          <ThemedText type="small" style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </ThemedText>
          <Pressable
            onPress={() => markAllRead.mutate()}
            style={styles.markAllButton}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>
              Mark all as read
            </ThemedText>
          </Pressable>
        </Animated.View>
      ) : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState
          image={require("../../assets/images/empty-notifications.png")}
          title="No Notifications"
          description="You're all caught up! New activity will appear here."
          style={{ paddingTop: headerHeight }}
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item, index }) => (
            <NotificationItem notification={item} index={index} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: unreadCount > 0 ? Spacing.md : headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  unreadText: {
    opacity: 0.7,
  },
  markAllButton: {
    padding: Spacing.xs,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
