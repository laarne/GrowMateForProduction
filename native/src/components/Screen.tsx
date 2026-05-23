import { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { AppHeader } from "./AppHeader";
import { colors } from "../theme/colors";

type ScreenProps = {
  children: ReactNode;
  showHeader?: boolean;
  scroll?: boolean;
};

export function Screen({ children, scroll = true, showHeader = true }: ScreenProps) {
  const content = <View style={styles.inner}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe}>
      {showHeader && <AppHeader />}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    paddingBottom: 120,
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
});
