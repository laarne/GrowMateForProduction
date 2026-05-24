import { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * React class-based error boundary.
 * Wrap screens or subtrees that may crash to prevent the whole app from going down.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeScreen />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#d1fae5" />
          <Text style={styles.title}>{this.props.fallbackTitle ?? "Something went wrong"}</Text>
          <Text style={styles.message} numberOfLines={4}>
            {this.state.error?.message ?? "An unexpected error occurred in this section."}
          </Text>
          <Pressable onPress={this.handleReset} style={styles.btn}>
            <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
            <Text style={styles.btnText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 20,
    gap: 12,
    margin: 20,
    padding: 32,
  },
  title: {
    color: "#d1fae5",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: "#a7f3d0",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  btn: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
});
