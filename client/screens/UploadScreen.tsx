import React, { useState } from "react";
import { StyleSheet, View, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

export default function UploadScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant media library access to upload videos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const duration = (asset.duration || 0) / 1000;
      
      if (duration < 15) {
        Alert.alert("Video Too Short", "Videos must be at least 15 seconds long.");
        return;
      }
      if (duration > 60) {
        Alert.alert("Video Too Long", "Videos can be up to 60 seconds long.");
        return;
      }
      
      setVideo(asset);
      setError("");
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera access to record videos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos",
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setVideo(result.assets[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!video) {
      setError("Please select a video to upload");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      
      const fileUri = video.uri;
      const fileName = fileUri.split("/").pop() || "video.mp4";
      
      formData.append("video", {
        uri: fileUri,
        type: "video/mp4",
        name: fileName,
      } as any);
      
      formData.append("caption", caption);
      formData.append("hashtags", hashtags);
      formData.append("duration", String(Math.floor((video.duration || 0) / 1000)));
      formData.append("width", String(video.width || 0));
      formData.append("height", String(video.height || 0));

      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/videos/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Upload failed");
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Success", "Your video has been uploaded!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError(err.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <ThemedText type="h3" style={styles.title}>
            Upload Video
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Share your content and start earning
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          {video ? (
            <Pressable style={styles.videoPreview} onPress={pickVideo}>
              <Image
                source={{ uri: video.uri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <View style={styles.previewOverlay}>
                <View style={[styles.changeButton, { backgroundColor: theme.surface }]}>
                  <Feather name="refresh-cw" size={20} color={theme.text} />
                  <ThemedText type="small">Change Video</ThemedText>
                </View>
              </View>
              <View style={styles.durationBadge}>
                <ThemedText type="small" style={styles.durationText}>
                  {Math.floor((video.duration || 0) / 1000)}s
                </ThemedText>
              </View>
            </Pressable>
          ) : (
            <View style={styles.uploadButtons}>
              <Pressable
                style={[styles.uploadButton, { backgroundColor: theme.surface }]}
                onPress={pickVideo}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="upload" size={28} color={theme.primary} />
                </View>
                <ThemedText type="body" style={styles.uploadButtonText}>
                  Choose from Gallery
                </ThemedText>
                <ThemedText type="small" style={styles.uploadButtonHint}>
                  15-60 seconds
                </ThemedText>
              </Pressable>

              <Pressable
                style={[styles.uploadButton, { backgroundColor: theme.surface }]}
                onPress={recordVideo}
              >
                <View style={[styles.iconCircle, { backgroundColor: Colors.dark.accent + "20" }]}>
                  <Feather name="video" size={28} color={Colors.dark.accent} />
                </View>
                <ThemedText type="body" style={styles.uploadButtonText}>
                  Record New Video
                </ThemedText>
                <ThemedText type="small" style={styles.uploadButtonHint}>
                  Use your camera
                </ThemedText>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {video ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.form}>
            <Input
              label="Caption"
              placeholder="Describe your video..."
              value={caption}
              onChangeText={setCaption}
              multiline
              style={{ height: 80, textAlignVertical: "top" }}
            />

            <Input
              label="Hashtags"
              placeholder="#viral #fyp #trending"
              value={hashtags}
              onChangeText={setHashtags}
            />

            {error ? (
              <ThemedText type="small" style={[styles.error, { color: Colors.dark.error }]}>
                {error}
              </ThemedText>
            ) : null}

            <Button
              onPress={handleUpload}
              disabled={isUploading}
              style={styles.submitButton}
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.guidelines}>
          <ThemedText type="h4" style={styles.guidelinesTitle}>
            Content Guidelines
          </ThemedText>
          <View style={styles.guidelineItem}>
            <Feather name="check-circle" size={16} color={Colors.dark.success} />
            <ThemedText type="small" style={styles.guidelineText}>
              Original content only
            </ThemedText>
          </View>
          <View style={styles.guidelineItem}>
            <Feather name="check-circle" size={16} color={Colors.dark.success} />
            <ThemedText type="small" style={styles.guidelineText}>
              Vertical videos (9:16) perform best
            </ThemedText>
          </View>
          <View style={styles.guidelineItem}>
            <Feather name="check-circle" size={16} color={Colors.dark.success} />
            <ThemedText type="small" style={styles.guidelineText}>
              Earn from views and ad impressions
            </ThemedText>
          </View>
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
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.7,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  uploadButton: {
    flex: 1,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    ...Shadows.small,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  uploadButtonText: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  uploadButtonHint: {
    opacity: 0.6,
    textAlign: "center",
  },
  videoPreview: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: 400,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  durationBadge: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  durationText: {
    color: "#fff",
    fontWeight: "600",
  },
  form: {
    marginBottom: Spacing.xl,
  },
  error: {
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  guidelines: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  guidelinesTitle: {
    marginBottom: Spacing.md,
  },
  guidelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  guidelineText: {
    opacity: 0.8,
  },
});
