import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage, markConversationAsRead, type Message } from "../services/messages";
import { supabase } from "../services/supabase";
import { colors } from "../theme/colors";
import { STORAGE_KEYS } from "../utils/storageKeys";

function getLeafyResponse(userInput: string): string {
  const q = userInput.toLowerCase();

  // Watering
  if (q.includes("water") || q.includes("watering") || q.includes("dry") || q.includes("thirsty")) {
    return "🌊 Most indoor plants prefer the 'soak and dry' method: water thoroughly until it drains from the bottom, then let the top 2 inches of soil dry completely before watering again. Stick your finger into the soil — if it's moist, wait a day more!";
  }
  // Overwatering
  if (q.includes("overwater") || q.includes("too much water") || q.includes("root rot")) {
    return "⚠️ Overwatering is the #1 plant killer! Signs: yellowing leaves, mushy stems, soggy soil, and fungus gnats. Fix: let the soil fully dry out, improve drainage, and remove any rotten roots during repotting.";
  }
  // Yellow leaves
  if (q.includes("yellow") || q.includes("yellowing")) {
    return "🍂 Yellow leaves can mean: (1) Overwatering — most common cause, (2) Under-watering — soil too dry, (3) Low light, (4) Lack of nutrients. Check your soil moisture first. If it's wet, let it dry. If dry, water thoroughly.";
  }
  // Brown tips
  if (q.includes("brown tip") || q.includes("brown edge") || q.includes("crispy")) {
    return "🌿 Brown leaf tips usually indicate: (1) Low humidity — mist leaves or use a pebble tray, (2) Over-fertilizing — flush the soil, (3) Tap water with fluoride — try filtered or rain water.";
  }
  // Sunlight & light
  if (q.includes("sunlight") || q.includes("light") || q.includes("window") || q.includes("dark")) {
    return "☀️ Light guide: South or west windows = bright direct light (cacti, succulents). East window = bright indirect light (Monsteras, Pothos). North window = low light (Ferns, ZZ plants). Leggy stems reaching toward light = needs more!";
  }
  // Monstera
  if (q.includes("monstera")) {
    return "🌿 Monstera care: Bright indirect light, water every 1-2 weeks (when top 2 inches dry), chunky well-draining soil (add orchid bark + perlite), wipe leaves monthly. Fenestrations (holes) appear with maturity and good light!";
  }
  // Pothos
  if (q.includes("pothos") || q.includes("golden pothos")) {
    return "✨ Pothos are almost indestructible! Water when soil is dry, they tolerate low light (but variegated ones need more light). Great for beginners. Propagate easily in water — just snip below a node!";
  }
  // Snake plant
  if (q.includes("snake plant") || q.includes("sansevieria") || q.includes("dracaena trifasciata")) {
    return "🌵 Snake plants are the ultimate low-maintenance plant. Water only every 2-6 weeks, tolerate very low light, and thrive on neglect. They're one of the best air purifiers too!";
  }
  // Succulents
  if (q.includes("succulent") || q.includes("cactus") || q.includes("cacti")) {
    return "🌵 Succulents & cacti need: Bright direct sunlight (6+ hours), watering only when soil is BONE DRY, well-draining cactus mix with extra perlite, and a terracotta pot for breathability. Never leave them in standing water!";
  }
  // Soil & repotting
  if (q.includes("soil") || q.includes("potting mix") || q.includes("repot") || q.includes("pot size")) {
    return "🪴 Repotting tips: Choose a pot only 2 inches larger. Repot in spring when you see roots circling or coming out of drainage holes. Use chunky, well-draining mix. Water thoroughly after repotting and keep in indirect light for 1-2 weeks to recover.";
  }
  // Fertilizer
  if (q.includes("fertiliz") || q.includes("nutrient") || q.includes("feed") || q.includes("npk")) {
    return "🌱 Fertilizing guide: Use a balanced liquid fertilizer (e.g. 20-20-20 NPK) at half strength every 2-4 weeks during growing season (spring/summer). Don't fertilize in winter — plants rest! Always fertilize moist soil to avoid root burn.";
  }
  // Humidity
  if (q.includes("humid") || q.includes("mist") || q.includes("dry air")) {
    return "💧 Tropical plants (Calatheas, Ferns, Orchids) love humidity of 50-70%. Tips: Group plants together, use a pebble tray with water, or get a small humidifier. Misting can help but may cause fungal issues if overdone.";
  }
  // Propagation
  if (q.includes("propagat") || q.includes("cutting") || q.includes("clone") || q.includes("stem")) {
    return "✂️ Propagation tips: Most plants propagate from stem cuttings. Cut just below a node (the bump on the stem), let it callus for an hour, then place in water or moist perlite. Change water weekly. Pot up once roots are 2-3 inches long!";
  }
  // Pests
  if (q.includes("pest") || q.includes("bug") || q.includes("spider mite") || q.includes("mealybug") || q.includes("aphid") || q.includes("fungus gnat")) {
    return "🐛 Common pests: Spider mites (fine webbing, spray neem oil), Mealybugs (white fluff, wipe with isopropyl), Aphids (sticky leaves, insecticidal soap), Fungus gnats (overwatering causes these, let soil dry out and use sticky traps). Neem oil + dish soap is a great all-purpose spray!";
  }
  // Calathea
  if (q.includes("calathea") || q.includes("prayer plant") || q.includes("maranta")) {
    return "🙏 Calatheas are drama queens! They need: Filtered water (fluoride causes brown tips), high humidity, indirect light, and consistent moist (not soggy) soil. Keep them away from vents and cold drafts. They'll reward you with stunning foliage!";
  }
  // Orchid
  if (q.includes("orchid") || q.includes("phalaenopsis")) {
    return "🌸 Orchid care: Water by soaking in water for 15 minutes, then let drain completely. Water every 7-14 days. Bright indirect light, bark-based potting mix (not soil!), and fertilize with orchid food monthly. Reblooming tip: place in a cooler room (60°F/15°C) at night for 4-6 weeks.";
  }
  // ZZ plant
  if (q.includes("zz plant") || q.includes("zamioculcas")) {
    return "💪 ZZ plants are nearly indestructible! They store water in their rhizomes, so water only every 3-4 weeks. They thrive in low to medium light. Perfect for offices or dark corners. Wipe leaves to remove dust and keep them shiny.";
  }
  // Peace lily
  if (q.includes("peace lily") || q.includes("spathiphyllum")) {
    return "🕊️ Peace Lilies are great communicators — they visibly droop when thirsty! Water when they droop slightly, keep in low to medium indirect light, and they'll reward you with white blooms. Note: toxic to pets and children.";
  }
  // Herbs
  if (q.includes("herb") || q.includes("basil") || q.includes("mint") || q.includes("rosemary") || q.includes("thyme")) {
    return "🌿 Herb growing tips: Herbs need 6-8 hours of direct sunlight (south-facing window or grow light). Water when the top inch of soil is dry. Pinch off flowers (deadhead) to keep the plant producing leaves. Harvest from the top to encourage bushy growth!";
  }
  // Vegetables
  if (q.includes("vegetable") || q.includes("tomato") || q.includes("chili") || q.includes("pepper") || q.includes("eggplant") || q.includes("talong")) {
    return "🍅 Vegetable growing tips: Most veggies need full sun (6-8 hrs), consistent watering (not letting them dry out completely), and regular fertilizing. Support tall plants like tomatoes with stakes. Harvest regularly to encourage more production!";
  }
  // Buy/sell/market
  if (q.includes("buy") || q.includes("sell") || q.includes("market") || q.includes("price")) {
    return "🛒 You can find plants to buy and sell right here in the GrowMate Marketplace! Head to the Market tab to browse listings, or apply to become a verified seller in your profile settings. Happy trading! 🌱";
  }
  // Hello/hi greeting
  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q === "yo" || q.includes("good morning") || q.includes("good evening")) {
    return "🌿 Hello there, plant lover! 🌱 I'm Leafy, your personal plant care assistant. Ask me anything — watering schedules, pest problems, propagation, specific plants — I'm here to help you grow!";
  }
  // Thank you
  if (q.includes("thank") || q.includes("thanks")) {
    return "🌸 You're so welcome! Happy growing! Remember: the best plant parent is an observant one. Keep checking on your plants daily and you'll notice issues before they become serious. 🌿💚";
  }

  // Default fallback
  return "🌿 Great question! Here's a general tip: Always observe your plant closely — look at the leaves, feel the soil, and check for pests weekly. If you notice something unusual, describe it to me and I'll help diagnose! Healthy plant care starts with good observation. 💚";
}

type ChatDetailScreenProps = {
  conversationId: string;
  title: string;
  onClose: () => void;
};

export function ChatDetailScreen({ conversationId, title, onClose }: ChatDetailScreenProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLeafyTyping, setIsLeafyTyping] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  async function loadMessages(silent = false) {
    if (conversationId === "leafy-ai-assistant") {
      if (!silent) {
        setIsLoading(true);
      }
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.LEAFY_MESSAGES);
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          const welcomeMsg: Message = {
            id: "welcome-leafy",
            conversationId: "leafy-ai-assistant",
            senderId: "leafy-ai",
            body: "Hello! I am Leafy, your GrowMate AI assistant. 🌿 Ask me anything about plant care, watering, soils, or gardening tips!",
            imageUrl: null,
            createdAt: new Date().toISOString()
          };
          setMessages([welcomeMsg]);
          await AsyncStorage.setItem(STORAGE_KEYS.LEAFY_MESSAGES, JSON.stringify([welcomeMsg]));
        }
      } catch (e) {
        console.warn("AsyncStorage leafy chat error:", e);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
      if (!silent) {
        setError(null);
      }
    } catch (msgError) {
      if (!silent) {
        const message = msgError instanceof Error ? msgError.message : "Unable to load messages.";
        setError(message);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }

  async function handleSend() {
    if (!user || !text.trim() || isSending) return;

    setIsSending(true);
    const content = text.trim();
    setText("");

    if (conversationId === "leafy-ai-assistant") {
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: "leafy-ai-assistant",
        senderId: user.id,
        body: content,
        imageUrl: null,
        createdAt: new Date().toISOString()
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      await AsyncStorage.setItem(STORAGE_KEYS.LEAFY_MESSAGES, JSON.stringify(updatedMessages));
      
      // Auto scroll
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);

      // Start typing indicator simulation
      setIsLeafyTyping(true);

      // Generate leafy response
      setTimeout(async () => {
        let leafyResponseText = getLeafyResponse(content);

        const leafyMsg: Message = {
          id: `msg-${Date.now()}-leafy`,
          conversationId: "leafy-ai-assistant",
          senderId: "leafy-ai",
          body: leafyResponseText,
          imageUrl: null,
          createdAt: new Date().toISOString()
        };
        const finalMessages = [...updatedMessages, leafyMsg];
        setMessages(finalMessages);
        await AsyncStorage.setItem(STORAGE_KEYS.LEAFY_MESSAGES, JSON.stringify(finalMessages));
        
        // Disable typing animation and finish sending
        setIsLeafyTyping(false);
        setIsSending(false);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }, 1200);

      return;
    }

    try {
      const newMsg = await sendMessage(conversationId, user.id, content);
      setMessages((current) => [...current, newMsg]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Failed to send message.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    loadMessages();
    if (user && conversationId !== "leafy-ai-assistant") {
      markConversationAsRead(conversationId, user.id).catch(console.error);
    }

    let channel: any = null;

    if (supabase && conversationId !== "leafy-ai-assistant") {
      channel = supabase
        .channel(`chat:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            const newMsg = payload.new;
            setMessages((current) => {
              if (current.some((m) => m.id === newMsg.id)) {
                return current;
              }
              return [
                ...current,
                {
                  id: newMsg.id,
                  conversationId: newMsg.conversation_id,
                  senderId: newMsg.sender_id,
                  body: newMsg.body,
                  imageUrl: newMsg.image_url,
                  createdAt: newMsg.created_at,
                },
              ];
            });
            if (user) {
              markConversationAsRead(conversationId, user.id).catch(console.error);
            }
          }
        )
        .subscribe();
    }

    // Poll for new messages every 5 seconds as a silent fallback
    const interval = setInterval(() => {
      if (conversationId !== "leafy-ai-assistant") {
        loadMessages(true);
        if (user) {
          markConversationAsRead(conversationId, user.id).catch(console.error);
        }
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, user?.id]);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, isLeafyTyping]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <Screen>
        <View style={styles.header}>
          <Button variant="secondary" onPress={onClose}>
            Back
          </Button>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>

        {error && (
          <Card tint="warning">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.green} size="large" />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messagesList} style={styles.scroll}>
            {messages.length === 0 && !isLeafyTyping ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No messages yet. Send a message to start conversing!</Text>
              </View>
            ) : (
              <>
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <View key={msg.id} style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther]}>
                      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                          {msg.body}
                        </Text>
                        <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {isLeafyTyping && (
                  <View style={[styles.bubbleWrap, styles.bubbleWrapOther]}>
                    <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
                      <ActivityIndicator size="small" color={colors.green} style={styles.typingIndicator} />
                      <Text style={[styles.bubbleText, styles.bubbleTextOther, styles.typingText]}>
                        Leafy is typing...
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        <View style={styles.composerRow}>
          <TextInput
            multiline
            onChangeText={setText}
            placeholder="Type your message..."
            placeholderTextColor="#8a9583"
            style={styles.input}
            value={text}
          />
          <Button disabled={isSending || !text.trim()} onPress={handleSend}>
            {isSending ? "Sending" : "Send"}
          </Button>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
  },
  title: {
    color: colors.green,
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
  },
  scroll: {
    flex: 1,
    marginVertical: 10,
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 10,
  },
  bubbleWrap: {
    flexDirection: "row",
    marginVertical: 6,
    width: "100%",
  },
  bubbleWrapMe: {
    justifyContent: "flex-end",
  },
  bubbleWrapOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    borderRadius: 20,
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: colors.green,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.sage,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: colors.white,
  },
  bubbleTextOther: {
    color: colors.green,
  },
  timeText: {
    fontSize: 9,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "right",
  },
  timeTextMe: {
    color: colors.sage,
  },
  timeTextOther: {
    color: colors.greenMuted,
  },
  composerRow: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    color: colors.green,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    maxHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loaderWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyText: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    color: "#9f2d20",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingIndicator: {
    marginRight: 4,
  },
  typingText: {
    fontStyle: "italic",
    color: colors.greenMuted,
  },
});
