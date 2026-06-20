import { Ionicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { FadeIn } from "./FadeIn";

const { width: SW } = Dimensions.get("window");

interface StatChipProps {
  stat: {
    label: string;
    value: string;
    icon: string;
    color: string;
  };
  theme: any;
  delay: number;
}

export const StatChip = ({ stat, theme, delay }: StatChipProps) => (
  <FadeIn delay={delay}>
    <View
      style={[
        styles.statChip,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View
        style={[styles.statIconBox, { backgroundColor: stat.color + "18" }]}
      >
        <Ionicons name={stat.icon as any} size={16} color={stat.color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>
        {stat.value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {stat.label}
      </Text>
    </View>
  </FadeIn>
);

const styles = StyleSheet.create({
  statChip: {
    width: (SW - 52) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  statLabel: { fontSize: 11.5 },
});
