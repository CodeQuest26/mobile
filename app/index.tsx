import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import MainContainer from "@/components/MainContainer";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";

const index = () => {
  return (
    <MainContainer safe={true}>
      <TouchableOpacity onPress={() => router.replace("/(auth)")}>
        <ThemedText>index</ThemedText>
      </TouchableOpacity>
    </MainContainer>
  );
};

export default index;

const styles = StyleSheet.create({});
