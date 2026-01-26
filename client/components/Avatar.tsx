import React from "react";
import { StyleSheet, View, Pressable, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Colors } from "@/constants/theme";

interface AvatarProps {
  uri?: string | null;
  size?: number;
  onPress?: () => void;
  showVerified?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  uri,
  size = 40,
  onPress,
  showVerified,
  style,
}: AvatarProps) {
  const { theme } = useTheme();

  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.surface,
        },
        style,
      ]}
    >
      <Image
        source={uri ? { uri } : require("../../assets/images/avatar-default.png")}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        contentFit="cover"
        transition={200}
      />
      {showVerified ? (
        <View
          style={[
            styles.verifiedBadge,
            {
              backgroundColor: Colors.dark.primary,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Feather name="check" size={10} color="#000" />
        </View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  verifiedBadge: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
