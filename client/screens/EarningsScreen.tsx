import React from "react";
import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { Spacing, BorderRadius, Colors, Fonts, Shadows } from "@/constants/theme";
import type { Withdrawal } from "@shared/schema";

type EarningsStackParamList = {
  Earnings: undefined;
  Withdrawal: undefined;
};

type EarningsScreenProps = {
  navigation: NativeStackNavigationProp<EarningsStackParamList, "Earnings">;
};

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(2);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return Colors.dark.success;
    case "pending":
      return Colors.dark.warning;
    case "rejected":
      return Colors.dark.error;
    default:
      return Colors.dark.textSecondary;
  }
}

function getStatusIcon(status: string): keyof typeof Feather.glyphMap {
  switch (status) {
    case "completed":
      return "check-circle";
    case "pending":
      return "clock";
    case "rejected":
      return "x-circle";
    default:
      return "circle";
  }
}

export default function EarningsScreen({ navigation }: EarningsScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const { data: stats } = useQuery<{
    totalViews: number;
    adImpressions: number;
    cpm: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
  }>({
    queryKey: ["/api/users/me/earnings-stats"],
  });

  const minimumWithdrawal = 10; // $10 minimum
  const canWithdraw = parseFloat(user?.availableBalance?.toString() || "0") >= minimumWithdrawal;

  const renderWithdrawalItem = ({ item, index }: { item: Withdrawal; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={[styles.withdrawalItem, { backgroundColor: theme.surface }]}
    >
      <View style={styles.withdrawalLeft}>
        <Feather
          name={getStatusIcon(item.status)}
          size={20}
          color={getStatusColor(item.status)}
        />
        <View style={styles.withdrawalInfo}>
          <ThemedText type="body" style={styles.withdrawalAmount}>
            ${formatCurrency(item.amount)}
          </ThemedText>
          <ThemedText type="small" style={styles.withdrawalDate}>
            {formatDate(item.createdAt)} • {item.network}
          </ThemedText>
        </View>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) + "20" },
        ]}
      >
        <ThemedText
          type="small"
          style={[styles.statusText, { color: getStatusColor(item.status) }]}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </ThemedText>
      </View>
    </Animated.View>
  );

  const ListHeader = () => (
    <View style={styles.headerContent}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.balanceSection}>
        <ThemedText type="small" style={styles.balanceLabel}>
          Available Balance
        </ThemedText>
        <ThemedText type="h1" style={[styles.balance, { color: Colors.dark.success }]}>
          ${formatCurrency(user?.availableBalance?.toString() || "0")}
        </ThemedText>
        <ThemedText type="small" style={styles.usdcLabel}>
          USDC
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Feather name="dollar-sign" size={20} color={Colors.dark.success} />
          <ThemedText type="body" style={styles.statValue}>
            ${formatCurrency(user?.totalEarnings?.toString() || "0")}
          </ThemedText>
          <ThemedText type="small" style={styles.statLabel}>
            Total Earned
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Feather name="trending-up" size={20} color={theme.primary} />
          <ThemedText type="body" style={styles.statValue}>
            ${formatCurrency(stats?.cpm || 0)}
          </ThemedText>
          <ThemedText type="small" style={styles.statLabel}>
            CPM Rate
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.revenueSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Revenue Breakdown
        </ThemedText>
        <View style={[styles.revenueCard, { backgroundColor: theme.surface }]}>
          <View style={styles.revenueRow}>
            <ThemedText type="body">Today</ThemedText>
            <ThemedText type="body" style={styles.revenueValue}>
              ${formatCurrency(stats?.revenueToday || 0)}
            </ThemedText>
          </View>
          <View style={styles.revenueRow}>
            <ThemedText type="body">This Week</ThemedText>
            <ThemedText type="body" style={styles.revenueValue}>
              ${formatCurrency(stats?.revenueThisWeek || 0)}
            </ThemedText>
          </View>
          <View style={styles.revenueRow}>
            <ThemedText type="body">This Month</ThemedText>
            <ThemedText type="body" style={styles.revenueValue}>
              ${formatCurrency(stats?.revenueThisMonth || 0)}
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Button
          onPress={() => navigation.navigate("Withdrawal")}
          disabled={!canWithdraw}
          style={[styles.withdrawButton, { backgroundColor: Colors.dark.success }]}
        >
          {canWithdraw ? "Request Withdrawal" : `Minimum $${minimumWithdrawal} to Withdraw`}
        </Button>
        {!canWithdraw ? (
          <ThemedText type="small" style={styles.minimumNote}>
            You need ${formatCurrency(minimumWithdrawal - parseFloat(user?.availableBalance?.toString() || "0"))} more to withdraw
          </ThemedText>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.historyHeader}>
        <ThemedText type="h4">Transaction History</ThemedText>
      </Animated.View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyHistory}>
      <Feather name="inbox" size={48} color={theme.textSecondary} />
      <ThemedText type="body" style={styles.emptyText}>
        No withdrawals yet
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={withdrawals || []}
        renderItem={renderWithdrawalItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={isLoading ? null : ListEmpty}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      />
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerContent: {
    marginBottom: Spacing.xl,
  },
  balanceSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  balanceLabel: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  balance: {
    fontFamily: Fonts?.mono,
  },
  usdcLabel: {
    opacity: 0.5,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.small,
  },
  statValue: {
    fontWeight: "700",
    fontFamily: Fonts?.mono,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    opacity: 0.6,
  },
  revenueSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  revenueCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  revenueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  revenueValue: {
    fontWeight: "600",
    fontFamily: Fonts?.mono,
  },
  withdrawButton: {
    marginBottom: Spacing.sm,
  },
  minimumNote: {
    textAlign: "center",
    opacity: 0.6,
    marginBottom: Spacing.xl,
  },
  historyHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  withdrawalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  withdrawalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  withdrawalInfo: {},
  withdrawalAmount: {
    fontWeight: "600",
    fontFamily: Fonts?.mono,
  },
  withdrawalDate: {
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontWeight: "600",
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    opacity: 0.6,
    marginTop: Spacing.md,
  },
});
