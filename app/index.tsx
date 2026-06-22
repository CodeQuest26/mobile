import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";

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

  // return router.replace("/(onboarding)");
};

export default Index;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
