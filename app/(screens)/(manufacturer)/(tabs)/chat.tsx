import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import React from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";

const Chat = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;

  return (
    <MainContainer safe>
      <Text style={[styles.header, { color: theme.text }]}>Messages</Text>
    </MainContainer>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: "center",
    // justifyContent: "center",
    backgroundColor: "red",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    // textAlign: "center",
    paddingLeft: 20,
  },
});
