import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

interface StarRatingProps {
  rating: number;
  color?: string;
  size?: number;
}

const StarRating = ({
  rating,
  color = "#F59E0B",
  size = 15,
}: StarRatingProps) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={
          rating >= star
            ? "star"
            : rating >= star - 0.5
              ? "star-half"
              : "star-outline"
        }
        size={size}
        color={color}
      />
    ))}
  </View>
);

export default StarRating;
