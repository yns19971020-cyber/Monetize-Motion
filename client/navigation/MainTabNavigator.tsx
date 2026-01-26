import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";

import FeedScreen from "@/screens/FeedScreen";
import DiscoverScreen from "@/screens/DiscoverScreen";
import ActivityScreen from "@/screens/ActivityScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius, Shadows } from "@/constants/theme";

export type MainTabParamList = {
  FeedTab: undefined;
  DiscoverTab: undefined;
  UploadTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function UploadButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.uploadButton,
        { 
          backgroundColor: theme.primary,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Feather name="plus" size={26} color="#000" />
    </Pressable>
  );
}

export default function MainTabNavigator({ navigation }: any) {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="FeedTab"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingTop: 10,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadTab"
        component={View}
        options={{
          title: "",
          tabBarButton: (props) => (
            <UploadButton onPress={() => navigation.navigate("Upload")} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Upload");
          },
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    width: 48,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    ...Shadows.medium,
  },
});
