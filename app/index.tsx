import { StyleSheet } from "react-native";

import { router } from "expo-router";

const index = () => {
  const loggedIn: boolean = true;
  const role: string = "manufacturer";

  if (loggedIn) {
    if (role === "manufacturer")
      router.replace("/(screens)/(manufacturer)/(tabs)");
    else if (role === "sme") router.replace("/(screens)/(sme)/(tabs)");
  } else router.replace("/(auth)/login");

  // return (
  //   <MainContainer safe={true}>
  //     <TouchableOpacity onPress={() => router.replace("/(auth)")}>
  //       <ThemedText>index</ThemedText>
  //     </TouchableOpacity>
  //   </MainContainer>
  // );
};

export default index;

const styles = StyleSheet.create({});
