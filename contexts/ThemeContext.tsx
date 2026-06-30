import Colors from "@/constants/colors";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as rnUseColorScheme } from "react-native";

type ColorScheme = "light" | "dark";

type ThemeContextValue = {
  theme: typeof Colors.light;
  colorScheme: ColorScheme;
  setColorScheme: (s: ColorScheme) => void;
};

const defaultScheme: ColorScheme = "light";

const defaultValue: ThemeContextValue = {
  theme: Colors[defaultScheme],
  colorScheme: defaultScheme,
  setColorScheme: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const sys = rnUseColorScheme();

  // Tracks if the user has manually changed the theme via their Profile screen
  const [hasUserOverridden, setHasUserOverridden] = useState(false);

  const [colorScheme, setInternalColorScheme] = useState<ColorScheme>(
    (sys as ColorScheme) ?? defaultScheme,
  );

  // Sync with native OS changes ONLY if the user hasn't chosen manually
  useEffect(() => {
    if (sys && !hasUserOverridden) {
      setInternalColorScheme(sys as ColorScheme);
    }
  }, [sys, hasUserOverridden]);

  // Wrapper function to set the state and flag the manual override
  const setColorScheme = (s: ColorScheme) => {
    setHasUserOverridden(true);
    setInternalColorScheme(s);
  };

  const value: ThemeContextValue = {
    theme: Colors[colorScheme],
    colorScheme,
    setColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
