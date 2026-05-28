import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius } from "../theme/colors";
import { Button } from "./Button";

type EmptyStateProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  buttonLabel,
  onButtonPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.graphicContainer}>
        {/* Layered concentric circles for a premium illustration style */}
        <View style={styles.outerCircle}>
          <View style={styles.midCircle}>
            <View style={styles.innerCircle}>
              <MaterialCommunityIcons name={icon} size={42} color={colors.green} />
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {buttonLabel && onButtonPress && (
        <View style={styles.buttonWrapper}>
          <Button variant="secondary" size="sm" onPress={onButtonPress}>
            {buttonLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    width: "100%",
  },
  graphicContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.surface1,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
  },
  midCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 280,
  },
  buttonWrapper: {
    minWidth: 140,
    alignItems: "center",
  },
});
