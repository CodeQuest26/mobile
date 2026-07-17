import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

const ActivityItem = ({ title, description, time, icon, color }: any) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[styles.itemContainer, { backgroundColor: theme.cardBackground }]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Text style={[styles.time, { color: theme.textSecondary }]}>{time}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconBox: { padding: 10, borderRadius: 8, marginRight: 15 },
  textContainer: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600" },
  description: { fontSize: 12 },
  time: { fontSize: 11 },
});

export default ActivityItem;
