import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { useNavigationContext } from "../context/NavigationContext";

type AppHeaderProps = {
  sectionLabel?: string;
  title?: string;
  onCartPress?: () => void;
};

const logoSource = require("../../assets/growmate-logo.png");

export function AppHeader({ sectionLabel, title, onCartPress }: AppHeaderProps) {
  const { setActiveTab } = useNavigationContext();

  const handlePress = () => {
    if (onCartPress) {
      onCartPress();
    } else {
      setActiveTab("Orders");
    }
  };

  return (
    <View style={styles.header}>
      {/* Left: logo icon + section label + screen title */}
      <View style={styles.brandRow}>
        <Image source={logoSource} style={styles.logo} />
        <View style={styles.labelWrap}>
          {sectionLabel ? (
            <Text style={styles.sectionLabel}>{sectionLabel.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.screenTitle}>{title ?? "GrowMate"}</Text>
        </View>
      </View>

      {/* Right: cart shortcut */}
      <Pressable
        accessibilityLabel="Open cart"
        onPress={handlePress}
        style={({ pressed }) => [styles.msgButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.white} name="cart-outline" size={21} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#315d37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
  },
  labelWrap: {
    flexDirection: "column",
    gap: 0,
  },
  sectionLabel: {
    color: colors.greenMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 1,
  },
  screenTitle: {
    color: colors.green,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  msgButton: {
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#d14b4b",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
  },
});
