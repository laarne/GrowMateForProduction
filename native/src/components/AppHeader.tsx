import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { BrandMark } from "./BrandMark";
import { colors } from "../theme/colors";

type AppHeaderProps = {
  onMessagesPress?: () => void;
};

export function AppHeader({ onMessagesPress }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <BrandMark />
      <Pressable accessibilityLabel="Open messages" onPress={onMessagesPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons color={colors.green} name="message-outline" size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#315d37",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
