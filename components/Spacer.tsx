import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";

const Spacer = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  return <View style={[{ height: 15, width: "100%" }, style]} />;
};

export default Spacer;
