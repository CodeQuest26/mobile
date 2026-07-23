import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

const ThemedView = ({ safe = false, ...props }) => {
  const colorScheme = useColorScheme();

  return <View style={styles.container} />;
};

export default ThemedView;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
