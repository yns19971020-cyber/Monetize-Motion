import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image, Platform, KeyboardAvoidingView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";
import { Spacing, Colors } from "@/constants/theme";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    setErrors({});
    
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setErrors({ email: error.message || "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h2" style={styles.title}>
            Welcome Back
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Sign in to continue earning from your content
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
          <Input
            label="Email"
            icon="mail"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            testID="input-email"
          />

          <Input
            label="Password"
            icon="lock"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
            testID="input-password"
          />

          <Pressable style={styles.forgotPassword}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              Forgot Password?
            </ThemedText>
          </Pressable>

          <Button
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.footer}>
          <ThemedText type="body" style={styles.footerText}>
            Don't have an account?{" "}
          </ThemedText>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
              Sign Up
            </ThemedText>
          </Pressable>
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
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: "center",
  },
  form: {
    marginBottom: Spacing["3xl"],
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing.xl,
    marginTop: -Spacing.sm,
  },
  button: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    opacity: 0.7,
  },
});
