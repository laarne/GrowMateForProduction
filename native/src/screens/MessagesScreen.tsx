import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { getConversations, type Conversation } from "../services/messages";
import { colors } from "../theme/colors";

type MessagesScreenProps = {
  onOpenChat: (conversationId: string, title: string) => void;
};

export function MessagesScreen({ onOpenChat }: MessagesScreenProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadConversations() {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (convoError) {
      const message = convoError instanceof Error ? convoError.message : "Unable to load inbox.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Inbox</Text>
        <Button variant="secondary" onPress={loadConversations}>
          Refresh
        </Button>
      </View>

      {error && (
        <Card tint="warning">
          <Text style={styles.errorTitle}>Connection error</Text>
          <Text style={styles.body}>{error}</Text>
        </Card>
      )}

      {isLoading && (
        <Card>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.body}>Opening your inbox...</Text>
        </Card>
      )}

      {!isLoading && conversations.length === 0 && (
        <Card>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.body}>Inquiries from marketplace listings and chats will appear here.</Text>
        </Card>
      )}

      {!isLoading &&
        conversations.map((convo) => {
          const chatTitle = convo.title || convo.otherMember?.displayName || "GrowMate Chat";
          const subtitle = convo.type === "market" ? "Marketplace Inquiry" : "Direct Message";
          return (
            <Pressable key={convo.id} onPress={() => onOpenChat(convo.id, chatTitle)}>
              <Card>
                <View style={styles.convoRow}>
                  {convo.otherMember?.avatarUrl ? (
                    <Image source={{ uri: convo.otherMember.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarLetter}>
                        {(convo.otherMember?.displayName ?? "G").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.content}>
                    <Text style={styles.chatTitle}>{chatTitle}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                  </View>
                  <Text style={styles.time}>
                    {new Date(convo.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: colors.green,
    fontSize: 30,
    fontWeight: "900",
  },
  errorTitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
  },
  emptyTitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  convoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    backgroundColor: colors.sage,
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarLetter: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  content: {
    flex: 1,
  },
  chatTitle: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  time: {
    color: colors.greenMuted,
    fontSize: 11,
    fontWeight: "800",
  },
});
