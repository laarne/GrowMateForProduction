import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type BrandMarkProps = {
  compact?: boolean;
  size?: number;
};

const logoSource = require("../../assets/icon.png");

export function BrandMark({ compact = false, size = 42 }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <Image source={logoSource} style={[styles.logo, { height: size, width: size }]} />
      {!compact && (
        <View>
          <Text style={styles.wordmark}>GrowMate</Text>
          <Text style={styles.tagline}>Buy, grow, and sell safely</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  logo: {
    borderRadius: 12,
  },
  wordmark: {
    color: colors.green,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  tagline: {
    color: colors.greenMuted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 1,
  },
});
