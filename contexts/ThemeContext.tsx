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
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    (sys as ColorScheme) ?? defaultScheme,
  );

  useEffect(() => {
    // when system changes and user hasn't overridden, sync
    if (!colorScheme) setColorScheme((sys as ColorScheme) ?? defaultScheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sys]);

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
