import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, View, ScrollView, Pressable } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { getListingDetail, createPendingOrder, type ListingDetail } from "../services/listings";
import { getSellerProfile, type SellerProfile } from "../services/profile";
import { isFavorited, toggleFavorite } from "../services/favorites";
import { createReport } from "../services/reports";
import { getOrCreateMarketConversation } from "../services/messages";
import { colors } from "../theme/colors";
import { formatCurrency } from "../utils/currency";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type ListingDetailScreenProps = {
  listingId: string;
  onClose: () => void;
  onOpenChat?: (convoId: string, title: string) => void;
};

export function ListingDetailScreen({ listingId, onClose, onOpenChat }: ListingDetailScreenProps) {
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order states
  const [isOrdering, setIsOrdering] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Report Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const reportReasons = ["Spam", "Scam / Fraud", "Inappropriate Content", "Offensive Language", "Other"];

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await getListingDetail(listingId);
      if (!detail) {
        setError("Listing not found.");
        return;
      }
      setListing(detail);

      // Load seller details
      const sellerProfile = await getSellerProfile(detail.sellerId);
      setSeller(sellerProfile);

      // Check if favorited
      if (user) {
        const saved = await isFavorited(listingId, user.id);
        setIsSaved(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listing details");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [listingId, user?.id]);

  async function handleToggleSave() {
    if (!user || !listing) return;
    try {
      const saved = await toggleFavorite(listing.id, user.id);
      setIsSaved(saved);
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  }

  async function handleBuy() {
    if (!user || !listing) return;
    setIsOrdering(true);
    setStatusMessage(null);
    try {
      // Create MarketListing shape for order helper
      const marketListing = {
        id: listing.id,
        sellerId: listing.sellerId,
        name: listing.name,
        localName: listing.localName,
        scientificName: listing.scientificName,
        category: listing.category,
        price: listing.price,
        quantity: listing.quantity,
        unit: listing.unit,
        location: listing.location,
        deliveryOption: listing.deliveryOption,
        description: listing.description,
        sellerName: listing.sellerName,
        photoUrl: listing.photoUrls[0] || null,
      };

      await createPendingOrder(marketListing, user.id);
      setStatusMessage(`Success! Pending order created for ${listing.name}.`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Unable to start order.");
    } finally {
      setIsOrdering(false);
    }
  }

  async function handleMessageSeller() {
    if (!user || !listing || !onOpenChat) return;
    if (listing.sellerId === user.id) {
      setStatusMessage("You cannot message yourself about your own listing.");
      return;
    }
    setIsMessaging(true);
    setStatusMessage(null);
    try {
      const convoId = await getOrCreateMarketConversation(listing.id, user.id, listing.sellerId, listing.name);
      onOpenChat(convoId, `Inquiry: ${listing.name}`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Unable to start conversation.");
    } finally {
      setIsMessaging(false);
    }
  }

  async function handleSubmitReport() {
    if (!user || !listing) return;
    setIsReporting(true);
    try {
      await createReport({
        reporterId: user.id,
        listingId: listing.id,
        reason: reportReason,
        details: reportDetails,
      });
      setShowReportModal(false);
      setReportDetails("");
      setStatusMessage("Thank you. Listing has been reported to admins.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsReporting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error || "Listing not found"}</Text>
        <Button onPress={onClose}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.green} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {listing.name}
        </Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleToggleSave} style={styles.actionIcon}>
            <MaterialCommunityIcons
              name={isSaved ? "heart" : "heart-outline"}
              size={24}
              color={isSaved ? "#d14b4b" : colors.green}
            />
          </Pressable>
          <Pressable onPress={() => setShowReportModal(true)} style={styles.actionIcon}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.green} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Images */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator style={styles.imageScroll}>
          {listing.photoUrls.length > 0 ? (
            listing.photoUrls.map((url, idx) => (
              <Image key={idx} source={{ uri: url }} style={styles.listingImage} />
            ))
          ) : (
            <View style={styles.photoFallback}>
              <MaterialCommunityIcons name="image-outline" size={48} color={colors.greenMuted} />
              <Text style={styles.photoFallbackText}>No Image Available</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.content}>
          {/* Main Info */}
          <Text style={styles.category}>{listing.category}</Text>
          <Text style={styles.titleText}>{listing.name}</Text>
          {listing.scientificName && <Text style={styles.scientificName}>{listing.scientificName}</Text>}
          {listing.localName && <Text style={styles.localName}>Local Name: {listing.localName}</Text>}

          <Text style={styles.price}>{formatCurrency(listing.price)}</Text>

          {/* Details list */}
          <Card tint="sage">
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={styles.detailValue}>
                {listing.quantity} {listing.unit}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{listing.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery:</Text>
              <Text style={styles.detailValue}>{listing.deliveryOption}</Text>
            </View>
          </Card>

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{listing.description}</Text>
            </View>
          )}

          {/* Seller profile card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Seller</Text>
            <Card>
              <View style={styles.sellerHeader}>
                <View>
                  <Text style={styles.sellerShopName}>{seller?.shopName ?? listing.sellerName}</Text>
                  <Text style={styles.sellerName}>{listing.sellerName}</Text>
                </View>
                <View style={styles.sellerStats}>
                  <View style={styles.statBubble}>
                    <MaterialCommunityIcons name="star" size={16} color="#d4a373" />
                    <Text style={styles.statText}>{seller?.trustScore?.toFixed(1) ?? "0.0"}</Text>
                  </View>
                  <View style={styles.statBubble}>
                    <MaterialCommunityIcons name="cart-outline" size={16} color={colors.green} />
                    <Text style={styles.statText}>{seller?.completedSales ?? 0} sales</Text>
                  </View>
                </View>
              </View>
              {seller?.sellerBio && <Text style={styles.sellerBio}>{seller.sellerBio}</Text>}
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Footer bar */}
      <View style={styles.footer}>
        {statusMessage && <Text style={styles.statusText}>{statusMessage}</Text>}
        <View style={styles.buttonRow}>
          <View style={styles.flexButton}>
            <Button disabled={isOrdering} onPress={handleBuy}>
              {isOrdering ? "Starting Order..." : "Start Order"}
            </Button>
          </View>
          {onOpenChat && listing.sellerId !== user?.id && (
            <View style={styles.flexButton}>
              <Button disabled={isMessaging} variant="secondary" onPress={handleMessageSeller}>
                {isMessaging ? "Opening Chat..." : "Chat Seller"}
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Listing</Text>
            <Text style={styles.modalLabel}>Select Reason:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reasonsContainer}>
              {reportReasons.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => setReportReason(reason)}
                  style={[styles.reasonChip, reportReason === reason && styles.reasonChipActive]}
                >
                  <Text style={[styles.reasonChipText, reportReason === reason && styles.reasonChipTextActive]}>
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="Tell us details..."
              placeholderTextColor="#8a9583"
              multiline
              numberOfLines={4}
              value={reportDetails}
              onChangeText={setReportDetails}
            />

            <View style={styles.modalActions}>
              <View style={styles.flexButton}>
                <Button disabled={isReporting} onPress={handleSubmitReport}>
                  {isReporting ? "Reporting..." : "Submit"}
                </Button>
              </View>
              <View style={styles.flexButton}>
                <Button variant="secondary" onPress={() => setShowReportModal(false)}>
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
  },
  loadingText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.cream,
  },
  errorTitle: {
    color: "#9f2d20",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },
  errorText: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.cream,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "900",
    color: colors.green,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionIcon: {
    padding: 6,
    marginLeft: 10,
  },
  scroll: {
    paddingBottom: 120,
  },
  imageScroll: {
    height: 250,
    backgroundColor: colors.sage,
  },
  listingImage: {
    width: 375, // Standard width - scale to device if needed
    height: 250,
    resizeMode: "cover",
  },
  photoFallback: {
    width: 375,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sage,
  },
  photoFallbackText: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  category: {
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.green,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.green,
    lineHeight: 28,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: colors.greenMuted,
    fontWeight: "700",
    marginTop: 4,
  },
  localName: {
    fontSize: 14,
    color: colors.greenMuted,
    fontWeight: "700",
    marginTop: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.green,
    marginTop: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLabel: {
    color: colors.greenMuted,
    fontWeight: "700",
    fontSize: 14,
  },
  detailValue: {
    color: colors.green,
    fontWeight: "800",
    fontSize: 14,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.green,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.greenMuted,
    fontWeight: "700",
  },
  sellerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellerShopName: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.green,
  },
  sellerName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.greenMuted,
    marginTop: 2,
  },
  sellerStats: {
    flexDirection: "row",
    gap: 8,
  },
  statBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.sage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.green,
  },
  sellerBio: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.greenMuted,
    fontWeight: "700",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  statusText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  // Modal Report style
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.green,
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.greenMuted,
    marginBottom: 8,
  },
  reasonsContainer: {
    flexDirection: "row",
    marginBottom: 14,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.sage,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  reasonChipActive: {
    backgroundColor: colors.green,
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.green,
  },
  reasonChipTextActive: {
    color: colors.white,
  },
  modalInput: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
});
