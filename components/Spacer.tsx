import React from "react";
import { View } from "react-native";

const Spacer = ({ style, ...props }) => {
  return <View style={[{ height: 15, width: "100%" }, style]} />;
};

export default Spacer;
