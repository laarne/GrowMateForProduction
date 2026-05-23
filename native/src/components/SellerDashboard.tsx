import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { Button } from "./Button";
import { Card } from "./Card";
import { useAuth } from "../context/AuthContext";
import { createListingForReview, getSellerListings, deleteListing, type ListingInput, type SellerListing } from "../services/listings";
import { scanPlantWithLeafy, type LeafyScanResult } from "../services/leafyScan";
import { pickImageFromLibrary, uploadPublicImage, type PickedImage } from "../services/storage";
import { colors } from "../theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const units: ListingInput["unit"][] = ["Pot", "Cutting", "Seedling", "Node", "Pack"];

export function SellerDashboard() {
  const { profile, user } = useAuth();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [localName, setLocalName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitIndex, setUnitIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [scanResult, setScanResult] = useState<LeafyScanResult | null>(null);
  const [location, setLocation] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("Pickup / Meetup / Delivery");

  useEffect(() => {
    if (profile?.location) {
      setLocation(profile.location);
    }
  }, [profile?.location]);

  async function loadListings() {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSellerListings(user.id);
      setListings(data);
    } catch (loadError) {
      const nextMessage = loadError instanceof Error ? loadError.message : "Unable to load seller listings.";
      setError(nextMessage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, [user?.id]);

  async function handleCreateListing() {
    if (!user) return;

    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (!name.trim() || !category.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Add a plant name, category, valid price, and valid quantity.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const uploadedPhoto = photo ? await uploadPublicImage("listing-photos", user.id, "listings", photo) : null;

      await createListingForReview({
        sellerId: user.id,
        name: name.trim(),
        localName: localName.trim(),
        scientificName: scientificName.trim(),
        category: category.trim(),
        price: parsedPrice,
        quantity: parsedQuantity,
        unit: units[unitIndex],
        location: location.trim() || profile?.location || "Butuan City",
        deliveryOption: deliveryOption.trim() || "Pickup / Meetup / Delivery",
        description: description.trim(),
        photoPath: uploadedPhoto?.path,
        aiProvider: scanResult?.provider ?? null,
        aiConfidence: scanResult?.confidence ?? null,
        aiResult: scanResult ?? null,
      });
      setMessage("Listing submitted for admin review.");
      setName("");
      setLocalName("");
      setScientificName("");
      setCategory("");
      setPrice("");
      setQuantity("1");
      setUnitIndex(0);
      setDescription("");
      setPhoto(null);
      setScanResult(null);
      await loadListings();
    } catch (saveError) {
      const nextMessage = saveError instanceof Error ? saveError.message : "Unable to create listing.";
      setError(nextMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteListing(listingId: string) {
    try {
      await deleteListing(listingId);
      setMessage("Listing archived.");
      await loadListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive listing.");
    }
  }

  async function handlePickPhoto() {
    setError(null);

    try {
      const pickedPhoto = await pickImageFromLibrary();
      if (pickedPhoto) {
        setPhoto(pickedPhoto);
        setScanResult(null);
      }
    } catch (photoError) {
      const nextMessage = photoError instanceof Error ? photoError.message : "Unable to choose listing photo.";
      setError(nextMessage);
    }
  }

  async function handleScanPhoto() {
    if (!photo) {
      setError("Add a listing photo before scanning.");
      return;
    }

    setIsScanning(true);
    setMessage(null);
    setError(null);

    try {
      const result = await scanPlantWithLeafy(photo);
      setScanResult(result);
      setName((current) => current || result.bestMatch);
      setScientificName((current) => current || result.scientificName || "");
      setCategory((current) => current || result.category);
      setDescription((current) => current || `Leafy AI identified this as ${result.bestMatch}. ${result.reviewReason}`);
      setMessage(result.saleStatus === "safe_to_sell" ? "Leafy scan complete. Listing can be submitted for review." : "Leafy scan complete. Admin review is required.");
    } catch (scanError) {
      const nextMessage = scanError instanceof Error ? scanError.message : "Leafy scan failed.";
      setError(nextMessage);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <Card>
      <Text style={styles.title}>Seller Dashboard</Text>
      <Text style={styles.body}>Create listings for review. Public Market visibility starts only after admin approval.</Text>

      <View style={styles.form}>
        {photo && <Image source={{ uri: photo.uri }} style={styles.preview} />}
        <Button variant="secondary" onPress={handlePickPhoto}>
          {photo ? "Change listing photo" : "Add listing photo"}
        </Button>
        <Button disabled={!photo || isScanning} variant="secondary" onPress={handleScanPhoto}>
          {isScanning ? "Scanning with Leafy..." : "Scan with Leafy AI"}
        </Button>
        {scanResult && (
          <View style={styles.scanCard}>
            <View style={styles.scanHeader}>
              <Text style={styles.scanEyebrow}>Leafy AI result</Text>
              <Text style={[styles.scanBadge, scanResult.saleStatus !== "safe_to_sell" && styles.scanBadgeWarning]}>
                {scanResult.saleStatus === "safe_to_sell" ? "Safe to sell" : "Needs review"}
              </Text>
            </View>
            <Text style={styles.scanTitle}>{scanResult.bestMatch}</Text>
            <Text style={styles.scanMeta}>
              {scanResult.scientificName ?? "Scientific name unavailable"} - {scanResult.confidence}% match
            </Text>
            <Text style={styles.scanBody}>{scanResult.reviewReason}</Text>
          </View>
        )}
        <TextInput onChangeText={setName} placeholder="Plant name" placeholderTextColor="#8a9583" style={styles.input} value={name} />
        <TextInput onChangeText={setLocalName} placeholder="Local name, optional" placeholderTextColor="#8a9583" style={styles.input} value={localName} />
        <TextInput onChangeText={setScientificName} placeholder="Scientific name, optional" placeholderTextColor="#8a9583" style={styles.input} value={scientificName} />
        <TextInput onChangeText={setCategory} placeholder="Category" placeholderTextColor="#8a9583" style={styles.input} value={category} />
        <View style={styles.row}>
          <TextInput
            keyboardType="numeric"
            onChangeText={setPrice}
            placeholder="Price"
            placeholderTextColor="#8a9583"
            style={[styles.input, styles.rowInput]}
            value={price}
          />
          <TextInput
            keyboardType="number-pad"
            onChangeText={setQuantity}
            placeholder="Qty"
            placeholderTextColor="#8a9583"
            style={[styles.input, styles.rowInput]}
            value={quantity}
          />
        </View>
        <View style={styles.unitRow}>
          {units.map((unit, index) => (
            <Button key={unit} variant={index === unitIndex ? "primary" : "secondary"} onPress={() => setUnitIndex(index)}>
              {unit}
            </Button>
          ))}
        </View>
        <TextInput onChangeText={setLocation} placeholder="Location (e.g. Butuan City)" placeholderTextColor="#8a9583" style={styles.input} value={location} />
        <TextInput onChangeText={setDeliveryOption} placeholder="Delivery Options (e.g. Meetup / Delivery)" placeholderTextColor="#8a9583" style={styles.input} value={deliveryOption} />
        <TextInput
          multiline
          onChangeText={setDescription}
          placeholder="Description"
          placeholderTextColor="#8a9583"
          style={[styles.input, styles.textarea]}
          value={description}
        />
        <Button disabled={isSaving} onPress={handleCreateListing}>
          {isSaving ? "Submitting..." : "Submit for review"}
        </Button>
      </View>

      {message && <Text style={styles.success}>{message}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.divider} />
      <Text style={styles.subtitle}>My listings</Text>
      {isLoading && <ActivityIndicator color={colors.green} style={styles.loader} />}
      {!isLoading && listings.length === 0 && <Text style={styles.body}>No seller listings yet.</Text>}
      {!isLoading &&
        listings.map((listing) => (
          <View key={listing.id} style={styles.listingItem}>
            <View style={styles.listingHeader}>
              <View style={styles.flexItem}>
                <Text style={styles.listingName}>{listing.name}</Text>
                <Text style={styles.listingMeta}>
                  PHP {listing.price.toLocaleString("en-PH")} - {listing.quantity} {listing.unit} - {listing.status}
                </Text>
              </View>
              {listing.status !== "archived" && (
                <Pressable onPress={() => handleDeleteListing(listing.id)} style={styles.deletePress}>
                  <MaterialCommunityIcons name="archive-outline" size={20} color="#d14b4b" />
                </Pressable>
              )}
            </View>
          </View>
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.green,
    fontSize: 20,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },
  body: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8,
  },
  form: {
    gap: 10,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.cream,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  preview: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    height: 180,
    width: "100%",
  },
  scanCard: {
    backgroundColor: "#f0f9eb",
    borderColor: "#cce8bd",
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  scanHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  scanEyebrow: {
    color: colors.greenMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  scanBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    color: colors.green,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scanBadgeWarning: {
    backgroundColor: "#fff2cc",
    color: "#8a5a00",
  },
  scanTitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
  },
  scanMeta: {
    color: colors.greenMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  scanBody: {
    color: colors.greenMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  success: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 12,
  },
  error: {
    color: "#9f2d20",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 12,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: 18,
  },
  loader: {
    marginVertical: 10,
  },
  listingItem: {
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  listingName: {
    color: colors.green,
    fontSize: 15,
    fontWeight: "900",
  },
  listingMeta: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "capitalize",
  },
  listingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flexItem: {
    flex: 1,
  },
  deletePress: {
    padding: 6,
  },
});
