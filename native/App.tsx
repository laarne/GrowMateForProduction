import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AuthScreen } from "./src/screens/AuthScreen";
import { getUnreadMessagesCount } from "./src/services/messages";
import { FeedScreen } from "./src/screens/FeedScreen";
import { GardenScreen } from "./src/screens/GardenScreen";
import { MarketScreen } from "./src/screens/MarketScreen";
import { MessagesScreen } from "./src/screens/MessagesScreen";
import { ChatDetailScreen } from "./src/screens/ChatDetailScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ListingDetailScreen } from "./src/screens/ListingDetailScreen";
import { RankingsScreen } from "./src/screens/RankingsScreen";
import { colors } from "./src/theme/colors";

type TabKey = "Market" | "Feed" | "Garden" | "Messages" | "Rankings" | "Profile";

const tabs: TabKey[] = ["Market", "Feed", "Garden", "Messages", "Rankings", "Profile"];

const logoSource = require("./assets/icon.png");

const tabIcons: Record<TabKey, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Market: "storefront-outline",
  Feed: "message-text-outline",
  Garden: "leaf",
  Messages: "email-outline",
  Rankings: "trophy-outline",
  Profile: "account-outline",
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("Market");
  const [activeChat, setActiveChat] = useState<{ id: string; title: string } | null>(null);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const { isLoading, session, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session || !user) return;

    const fetchUnread = async () => {
      try {
        const count = await getUnreadMessagesCount(user.id);
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    };

    fetchUnread();

    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [session, user?.id]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <Image source={logoSource} style={styles.loadingLogo} />
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.loadingText}>Loading GrowMate</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen />
      </>
    );
  }

  const handleOpenChat = (conversationId: string, title: string) => {
    setActiveChat({ id: conversationId, title });
  };

  const handleOpenListingDetail = (listingId: string) => {
    setActiveListingId(listingId);
  };

  if (activeChat) {
    return (
      <ChatDetailScreen
        conversationId={activeChat.id}
        title={activeChat.title}
        onClose={() => setActiveChat(null)}
      />
    );
  }

  if (activeListingId) {
    return (
      <ListingDetailScreen
        listingId={activeListingId}
        onClose={() => setActiveListingId(null)}
        onOpenChat={handleOpenChat}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {activeTab === "Market" && (
        <MarketScreen onOpenChat={handleOpenChat} onOpenListingDetail={handleOpenListingDetail} />
      )}
      {activeTab === "Feed" && <FeedScreen />}
      {activeTab === "Garden" && <GardenScreen />}
      {activeTab === "Messages" && <MessagesScreen onOpenChat={handleOpenChat} />}
      {activeTab === "Rankings" && <RankingsScreen />}
      {activeTab === "Profile" && <ProfileScreen onOpenListingDetail={handleOpenListingDetail} />}
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.navItem}>
              <View style={[styles.iconBubble, isActive && styles.iconBubbleActive]}>
                <MaterialCommunityIcons color={isActive ? colors.white : colors.greenMuted} name={tabIcons[tab]} size={22} />
                {tab === "Messages" && unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loading: {
    alignItems: "center",
    backgroundColor: colors.cream,
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 14,
  },
  loadingLogo: {
    borderRadius: 22,
    height: 86,
    marginBottom: 18,
    width: 86,
  },
  nav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingBottom: 22,
    paddingTop: 10,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 58,
  },
  iconBubble: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  iconBubbleActive: {
    backgroundColor: colors.green,
  },
  navLabel: {
    color: colors.greenMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  navLabelActive: {
    color: colors.green,
    fontWeight: "900",
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
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
});
