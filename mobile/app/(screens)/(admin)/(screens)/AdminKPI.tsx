import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

const AdminKPICard = ({ title, value, color, icon, onPress }: any) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
        },
      ]}
    >
      <Ionicons name={icon} size={28} color={color} style={styles.icon} />
      <Text style={[styles.title, { color: theme.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    width: 150,
    height: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: { marginBottom: 12 },
  title: { fontSize: 12, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: "bold" },
});

export default AdminKPICard;
