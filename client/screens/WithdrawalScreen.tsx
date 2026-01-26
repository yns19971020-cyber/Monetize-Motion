import React, { useState } from "react";
import { StyleSheet, View, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/query-client";
import { Spacing, BorderRadius, Colors, Fonts, Shadows } from "@/constants/theme";

type NetworkType = "BEP20" | "ERC20";

export default function WithdrawalScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || "");
  const [network, setNetwork] = useState<NetworkType>("BEP20");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableBalance = parseFloat(user?.availableBalance?.toString() || "0");
  const minimumWithdrawal = 10;

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/withdrawals", {
        amount: parseFloat(amount),
        walletAddress,
        network,
      });
      return response.json();
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      refreshUser();
      Alert.alert(
        "Withdrawal Requested",
        "Your withdrawal request has been submitted and is pending admin approval.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error", error.message || "Failed to submit withdrawal request");
    },
  });

  const handleWithdraw = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      newErrors.amount = "Please enter a valid amount";
    } else if (amountNum < minimumWithdrawal) {
      newErrors.amount = `Minimum withdrawal is $${minimumWithdrawal}`;
    } else if (amountNum > availableBalance) {
      newErrors.amount = "Insufficient balance";
    }

    if (!walletAddress.trim()) {
      newErrors.walletAddress = "Wallet address is required";
    } else if (walletAddress.length < 20) {
      newErrors.walletAddress = "Please enter a valid wallet address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    Alert.alert(
      "Confirm Withdrawal",
      `Withdraw $${amountNum.toFixed(2)} USDC to:\n${walletAddress.substring(0, 20)}...`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => withdrawMutation.mutate() },
      ]
    );
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toFixed(2));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.balanceCard}>
          <ThemedText type="small" style={styles.balanceLabel}>
            Available Balance
          </ThemedText>
          <ThemedText type="h2" style={[styles.balance, { color: Colors.dark.success }]}>
            ${availableBalance.toFixed(2)}
          </ThemedText>
          <ThemedText type="small" style={styles.usdcLabel}>
            USDC
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.form}>
          <View style={styles.amountContainer}>
            <Input
              label="Amount (USDC)"
              icon="dollar-sign"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={errors.amount}
            />
            <Pressable
              style={[styles.maxButton, { backgroundColor: theme.primary + "20" }]}
              onPress={handleMaxAmount}
            >
              <ThemedText type="small" style={{ color: theme.primary }}>
                MAX
              </ThemedText>
            </Pressable>
          </View>

          <Input
            label="USDC Wallet Address"
            icon="credit-card"
            placeholder="Enter your Binance USDC wallet address"
            value={walletAddress}
            onChangeText={setWalletAddress}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.walletAddress}
          />

          <ThemedText type="small" style={styles.networkLabel}>
            Select Network
          </ThemedText>
          <View style={styles.networkOptions}>
            <Pressable
              style={[
                styles.networkOption,
                { backgroundColor: network === "BEP20" ? theme.primary + "20" : theme.surface },
                network === "BEP20" && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => setNetwork("BEP20")}
            >
              <ThemedText
                type="body"
                style={[
                  styles.networkText,
                  { color: network === "BEP20" ? theme.primary : theme.text },
                ]}
              >
                BEP20
              </ThemedText>
              <ThemedText type="small" style={styles.networkHint}>
                Binance Smart Chain
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.networkOption,
                { backgroundColor: network === "ERC20" ? theme.primary + "20" : theme.surface },
                network === "ERC20" && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => setNetwork("ERC20")}
            >
              <ThemedText
                type="body"
                style={[
                  styles.networkText,
                  { color: network === "ERC20" ? theme.primary : theme.text },
                ]}
              >
                ERC20
              </ThemedText>
              <ThemedText type="small" style={styles.networkHint}>
                Ethereum Network
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.infoCard}>
          <Feather name="info" size={20} color={Colors.dark.warning} />
          <View style={styles.infoContent}>
            <ThemedText type="body" style={styles.infoTitle}>
              Important Information
            </ThemedText>
            <ThemedText type="small" style={styles.infoText}>
              {"\u2022"} Minimum withdrawal: ${minimumWithdrawal} USDC{"\n"}
              {"\u2022"} Processing time: 1-3 business days{"\n"}
              {"\u2022"} Withdrawals require admin approval{"\n"}
              {"\u2022"} Make sure your wallet address is correct
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Button
            onPress={handleWithdraw}
            disabled={withdrawMutation.isPending}
            style={[styles.submitButton, { backgroundColor: Colors.dark.success }]}
          >
            {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
          </Button>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  balanceCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
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
  form: {
    marginBottom: Spacing.xl,
  },
  amountContainer: {
    position: "relative",
  },
  maxButton: {
    position: "absolute",
    right: Spacing.md,
    top: 34,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  networkLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  networkOptions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  networkOption: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.small,
  },
  networkText: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  networkHint: {
    opacity: 0.6,
  },
  infoCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    backgroundColor: Colors.dark.warning + "10",
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.warning,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  infoText: {
    opacity: 0.8,
    lineHeight: 22,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
