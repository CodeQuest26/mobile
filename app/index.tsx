import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import MainContainer from "@/components/MainContainer";
import { router } from "expo-router";

const index = () => {
  return (
    <MainContainer safe={true}>
      <TouchableOpacity onPress={() => router.push("/(auth)")}>
        <Text>index</Text>
      </TouchableOpacity>
    </MainContainer>
  );
};

export default index;

const styles = StyleSheet.create({});
