import Colors from "@/constants/colors";
import React from "react";
import { StyleSheet, useColorScheme, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MainContainerProps {
  safe?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

const MainContainer = ({
  safe = false,
  children,
  style,
}: MainContainerProps) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const safeStyle: ViewStyle = safe
    ? {
        paddingTop: insets.top,
        // paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    : {};

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
        safeStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default MainContainer;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
