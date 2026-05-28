import { useState, useRef } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Image,
  Pressable,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type ImageZoomModalProps = {
  imageUrl: string | null;
  onClose: () => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ImageZoomModal({ imageUrl, onClose }: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const lastTap = useRef<number>(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!imageUrl) return null;

  // Handle double tap to toggle zoom between 1x and 2.5x
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      // Toggle scale
      const newScale = scale === 1 ? 2.5 : 1;
      setScale(newScale);
      Animated.spring(scaleAnim, {
        toValue: newScale,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
    }
    lastTap.current = now;
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.5, 4);
    setScale(newScale);
    Animated.spring(scaleAnim, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    Animated.spring(scaleAnim, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleReset = () => {
    setScale(1);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Top bar with close button */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={colors.white} />
          </Pressable>
        </View>

        {/* Center zoomable image */}
        <Pressable onPress={handleDoubleTap} style={styles.imageContainer}>
          {Platform.OS === "ios" ? (
            <ScrollView
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            </ScrollView>
          ) : (
            // On Android/Web, use scale animation
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </Pressable>

        {/* Bottom toolbar for explicit zoom controls */}
        <View style={styles.toolbar}>
          <Pressable onPress={handleZoomOut} style={styles.toolBtn}>
            <MaterialCommunityIcons name="magnify-minus" size={22} color={colors.white} />
          </Pressable>
          <Pressable onPress={handleReset} style={styles.toolBtn}>
            <MaterialCommunityIcons name="arrow-expand-all" size={20} color={colors.white} />
          </Pressable>
          <Pressable onPress={handleZoomIn} style={styles.toolBtn}>
            <MaterialCommunityIcons name="magnify-plus" size={22} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: Platform.OS === "ios" ? 54 : 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    alignItems: "center",
    justifyContent: "center",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 160,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 10,
    zIndex: 10,
  },
  toolBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
