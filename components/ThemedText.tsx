import React from "react";
import { StyleSheet, Text } from "react-native";

const ThemedText = ({ text, style }: { text: string; style: any }) => {
  return <Text style={style}>{text}</Text>;
};

export default ThemedText;

const styles = StyleSheet.create({});
