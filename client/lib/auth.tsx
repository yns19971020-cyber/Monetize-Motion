import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { apiRequest, queryClient } from "@/lib/query-client";
import type { User } from "@shared/schema";

type AuthUser = Pick<User, "id" | "email" | "username" | "displayName" | "avatarUrl" | "isVerified" | "isAdmin" | "totalEarnings" | "availableBalance" | "followerCount" | "followingCount">;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function removeStoredToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await getStoredToken();
      if (token) {
        const response = await apiRequest("GET", "/api/auth/me");
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      await removeStoredToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    await setStoredToken(data.token);
    setUser(data.user);
  }

  async function register(email: string, username: string, password: string) {
    const response = await apiRequest("POST", "/api/auth/register", { email, username, password });
    const data = await response.json();
    await setStoredToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    await removeStoredToken();
    setUser(null);
    queryClient.clear();
  }

  async function refreshUser() {
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      // Ignore errors during refresh
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
