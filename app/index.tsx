import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const Index = () => {
  const loggedIn: boolean = true;
  const role: string = "sme";

  useEffect(() => {
    if (loggedIn) {
      if (role === "manufacturer")
        router.replace("/(screens)/(manufacturer)/(tabs)");
      else if (role === "sme") router.replace("/(screens)/(sme)/(tabs)");
    } else router.replace("/(auth)/login");
  }, [loggedIn, role]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
