import React from "react";
import { StyleSheet, View, Pressable, Alert, Platform, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
  isDestructive,
  hasSwitch,
  switchValue,
  onSwitchChange,
}: SettingsItemProps) {
  const { theme } = useTheme();
  const iconColor = isDestructive ? Colors.dark.error : theme.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={hasSwitch}
      style={({ pressed }) => [
        styles.settingsItem,
        { backgroundColor: theme.surface, opacity: pressed && onPress ? 0.7 : 1 },
      ]}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <ThemedText
          type="body"
          style={[styles.settingsLabel, isDestructive && { color: Colors.dark.error }]}
        >
          {label}
        </ThemedText>
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#fff"
        />
      ) : value ? (
        <ThemedText type="small" style={styles.settingsValue}>
          {value}
        </ThemedText>
      ) : onPress ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data, videos, and earnings will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Contact Support", "Please contact support to delete your account.");
          },
        },
      ]
    );
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
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileSection}>
          <Avatar uri={user?.avatarUrl} size={80} showVerified={user?.isVerified} />
          <View style={styles.profileInfo}>
            <ThemedText type="h4">{user?.displayName || user?.username}</ThemedText>
            <ThemedText type="body" style={styles.email}>
              {user?.email}
            </ThemedText>
          </View>
          <Pressable
            style={[styles.editButton, { backgroundColor: theme.surface }]}
            onPress={() => {}}
          >
            <Feather name="edit-2" size={18} color={theme.primary} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <ThemedText type="small" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <SettingsItem
            icon="user"
            label="Edit Profile"
            onPress={() => {}}
          />
          <SettingsItem
            icon="credit-card"
            label="Wallet Settings"
            value={user?.walletAddress ? "Connected" : "Not set"}
            onPress={() => {}}
          />
          <SettingsItem
            icon="lock"
            label="Change Password"
            onPress={() => {}}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <ThemedText type="small" style={styles.sectionTitle}>
            Preferences
          </ThemedText>
          <SettingsItem
            icon="bell"
            label="Push Notifications"
            hasSwitch
            switchValue={true}
            onSwitchChange={() => {}}
          />
          <SettingsItem
            icon="download"
            label="Auto-save Videos"
            hasSwitch
            switchValue={false}
            onSwitchChange={() => {}}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <ThemedText type="small" style={styles.sectionTitle}>
            Support
          </ThemedText>
          <SettingsItem
            icon="help-circle"
            label="Help Center"
            onPress={() => {}}
          />
          <SettingsItem
            icon="message-square"
            label="Contact Support"
            onPress={() => {}}
          />
          <SettingsItem
            icon="file-text"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <ThemedText type="small" style={styles.sectionTitle}>
            Danger Zone
          </ThemedText>
          <SettingsItem
            icon="log-out"
            label="Sign Out"
            onPress={handleLogout}
          />
          <SettingsItem
            icon="trash-2"
            label="Delete Account"
            onPress={handleDeleteAccount}
            isDestructive
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.versionInfo}>
          <ThemedText type="small" style={styles.versionText}>
            ViralPay v1.0.0
          </ThemedText>
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  email: {
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    opacity: 0.6,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    ...Shadows.small,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsLabel: {},
  settingsValue: {
    opacity: 0.6,
  },
  versionInfo: {
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  versionText: {
    opacity: 0.4,
  },
});
