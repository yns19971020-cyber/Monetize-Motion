import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Fonts, Shadows } from "@/constants/theme";

interface EarningsCardProps {
  totalEarnings: string;
  availableBalance: string;
  totalViews: number;
  adImpressions: number;
  style?: ViewStyle;
  delay?: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function formatCurrency(amount: string): string {
  const num = parseFloat(amount || "0");
  return num.toFixed(2);
}

export function EarningsCard({
  totalEarnings,
  availableBalance,
  totalViews,
  adImpressions,
  style,
  delay = 0,
}: EarningsCardProps) {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        style,
      ]}
    >
      <View style={styles.mainBalance}>
        <ThemedText type="small" style={styles.label}>
          Available Balance
        </ThemedText>
        <View style={styles.balanceRow}>
          <ThemedText type="h1" style={[styles.balance, { color: Colors.dark.success }]}>
            ${formatCurrency(availableBalance)}
          </ThemedText>
          <ThemedText type="small" style={styles.currency}>
            USDC
          </ThemedText>
        </View>
        <ThemedText type="small" style={styles.totalLabel}>
          Total Earned: ${formatCurrency(totalEarnings)}
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="eye" size={18} color={theme.primary} />
          </View>
          <ThemedText type="body" style={styles.statValue}>
            {formatNumber(totalViews)}
          </ThemedText>
          <ThemedText type="small" style={styles.statLabel}>
            Views
          </ThemedText>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.dark.warning + "20" }]}>
            <Feather name="play-circle" size={18} color={Colors.dark.warning} />
          </View>
          <ThemedText type="body" style={styles.statValue}>
            {formatNumber(adImpressions)}
          </ThemedText>
          <ThemedText type="small" style={styles.statLabel}>
            Ad Impressions
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.medium,
  },
  mainBalance: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  label: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
  balance: {
    fontFamily: Fonts?.mono,
  },
  currency: {
    opacity: 0.7,
    fontWeight: "600",
  },
  totalLabel: {
    opacity: 0.5,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontWeight: "700",
    fontFamily: Fonts?.mono,
  },
  statLabel: {
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: Spacing.sm,
  },
});
