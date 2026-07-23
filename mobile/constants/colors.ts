// constants/colors.ts
export type Theme = {
  text: string;
  textSecondary: string;
  background: string;
  cardBackground: string;
  icon: string;
  iconBackground: string;
  primary: string;
  onPrimary: string;
  border: string;
  shadow: string;
  info: string;
  warning: string;
  error: string;
};

const primaryColor = "#4CB37E";

export const Colors: Record<"light" | "dark" | "unspecified", Theme> = {
  light: {
    text: "#1C1C1E",
    textSecondary: "#6C757D",
    background: "#F8F8F8",
    cardBackground: "#FFFFFF",
    icon: "#6C757D",
    iconBackground: "#EFEFEF",
    primary: primaryColor,
    onPrimary: "#FFFFFF",
    border: "#E0E0E0",
    shadow: "#000000",
    warning: "#F59E0B",
    error: "#fa4343",
    info: primaryColor,
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    background: "#1C1C1E",
    cardBackground: "#2C2C2E",
    icon: "#B0B0B0",
    iconBackground: "#3A3A3C",
    primary: primaryColor,
    onPrimary: "#FFFFFF",
    border: "#4A4A4C",
    shadow: "#000000",
    warning: "#F59E0B",
    error: "#fa4343",
    info: primaryColor,
  },
  unspecified: {
    text: "#1C1C1E",
    textSecondary: "#6C757D",
    background: "#F8F8F8",
    cardBackground: "#FFFFFF",
    icon: "#6C757D",
    iconBackground: "#EFEFEF",
    primary: primaryColor,
    onPrimary: "#FFFFFF",
    border: "#E0E0E0",
    shadow: "#000000",
    warning: "#F59E0B",
    error: "#fa4343",
    info: primaryColor,
  },
};

export default Colors;
