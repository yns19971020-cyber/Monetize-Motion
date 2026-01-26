import React, { useState } from "react";
import { StyleSheet, TextInput, View, Pressable, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  icon,
  isPassword,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderScale = useSharedValue(1);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: borderScale.value }],
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderScale.value = withSpring(1.01, { damping: 15 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderScale.value = withSpring(1, { damping: 15 });
    onBlur?.(e);
  };

  const borderColor = error
    ? Colors.dark.error
    : isFocused
    ? theme.primary
    : theme.border;

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="small" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <AnimatedView
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderColor,
          },
          animatedBorderStyle,
        ]}
      >
        {icon ? (
          <Feather
            name={icon}
            size={20}
            color={isFocused ? theme.primary : theme.textSecondary}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            icon ? styles.inputWithIcon : null,
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </AnimatedView>
      {error ? (
        <ThemedText type="small" style={[styles.error, { color: Colors.dark.error }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
