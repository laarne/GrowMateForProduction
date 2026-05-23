import { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme/colors";

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function Button({ children, onPress, variant = "primary", disabled = false }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[variant], pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: colors.green,
  },
  secondary: {
    backgroundColor: colors.sage,
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryText: {
    color: colors.green,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
