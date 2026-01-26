import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import CommentsScreen from "@/screens/CommentsScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import EarningsScreen from "@/screens/EarningsScreen";
import WithdrawalScreen from "@/screens/WithdrawalScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import UploadScreen from "@/screens/UploadScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Comments: { videoId: string };
  UserProfile: { userId: string };
  Earnings: undefined;
  Withdrawal: undefined;
  Settings: undefined;
  Upload: undefined;
  VideoDetail: { videoId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Comments"
            component={CommentsScreen}
            options={{
              presentation: "modal",
              headerTitle: "Comments",
            }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{
              headerTitle: "",
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="Earnings"
            component={EarningsScreen}
            options={{
              headerTitle: "Earnings",
            }}
          />
          <Stack.Screen
            name="Withdrawal"
            component={WithdrawalScreen}
            options={{
              headerTitle: "Withdraw USDC",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerTitle: "Settings",
            }}
          />
          <Stack.Screen
            name="Upload"
            component={UploadScreen}
            options={{
              presentation: "modal",
              headerTitle: "New Video",
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
