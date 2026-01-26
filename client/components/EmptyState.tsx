import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Image, ImageSource } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing } from "@/constants/theme";

interface EmptyStateProps {
  image: ImageSource;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  image,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={image}
        style={styles.image}
        contentFit="contain"
        transition={300}
      />
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="body" style={styles.description}>
          {description}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: Spacing["2xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: Spacing.xl,
  },
  button: {
    paddingHorizontal: Spacing["3xl"],
  },
});
