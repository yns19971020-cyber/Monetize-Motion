import { Platform } from "react-native";

// App-specific brand colors
const primaryCyan = "#00D9FF";
const primaryCyanDark = "#0099CC";
const accentRed = "#FF3B5C";
const successGreen = "#00D084";
const warningYellow = "#FFB800";
const errorRed = "#FF453A";

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: primaryCyan,
    link: primaryCyan,
    primary: primaryCyan,
    primaryDark: primaryCyanDark,
    accent: accentRed,
    success: successGreen,
    warning: warningYellow,
    error: errorRed,
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F2F2F2",
    backgroundSecondary: "#E6E6E6",
    backgroundTertiary: "#D9D9D9",
    surface: "#F8F8F8",
    surfaceElevated: "#FFFFFF",
    border: "#E0E0E0",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    buttonText: "#000000",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryCyan,
    link: primaryCyan,
    primary: primaryCyan,
    primaryDark: primaryCyanDark,
    accent: accentRed,
    success: successGreen,
    warning: warningYellow,
    error: errorRed,
    backgroundRoot: "#0A0A0A",
    backgroundDefault: "#1C1C1E",
    backgroundSecondary: "#2C2C2E",
    backgroundTertiary: "#3C3C3E",
    surface: "#1C1C1E",
    surfaceElevated: "#2C2C2E",
    border: "#3C3C3E",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  monospace: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: {
    shadowColor: primaryCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 0,
  },
};
