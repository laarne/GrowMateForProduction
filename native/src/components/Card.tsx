import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "../theme/colors";

type CardProps = {
  children: ReactNode;
  tint?: "white" | "sage" | "warning";
};

export function Card({ children, tint = "white" }: CardProps) {
  return <View style={[styles.card, styles[tint]]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
    padding: 18,
    shadowColor: "#315d37",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  white: {
    backgroundColor: colors.white,
  },
  sage: {
    backgroundColor: colors.sage,
  },
  warning: {
    backgroundColor: colors.warning,
  },
});

