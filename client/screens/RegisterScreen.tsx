import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image, Platform } from "react-native";
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
import { Spacing } from "@/constants/theme";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), username.trim(), password);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setErrors({ email: error.message || "Registration failed" });
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
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
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
            Create Account
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Start earning real money from your videos
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
            label="Username"
            icon="at-sign"
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.username}
            testID="input-username"
          />

          <Input
            label="Password"
            icon="lock"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
            testID="input-password"
          />

          <Input
            label="Confirm Password"
            icon="lock"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            error={errors.confirmPassword}
            testID="input-confirm-password"
          />

          <Button
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.footer}>
          <ThemedText type="body" style={styles.footerText}>
            Already have an account?{" "}
          </ThemedText>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
              Sign In
            </ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.terms}>
          <ThemedText type="small" style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
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
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: "center",
  },
  form: {
    marginBottom: Spacing["2xl"],
  },
  button: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  footerText: {
    opacity: 0.7,
  },
  terms: {
    alignItems: "center",
  },
  termsText: {
    opacity: 0.5,
    textAlign: "center",
  },
});
