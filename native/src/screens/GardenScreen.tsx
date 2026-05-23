import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View, ScrollView, Pressable } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { createGardenPlant, getGardenPlants, getOrCreateMyGarden, type Garden, type GardenPlant } from "../services/gardens";
import { scanPlantWithLeafy, type LeafyScanResult } from "../services/leafyScan";
import { pickImageFromLibrary, uploadPublicImage, type PickedImage } from "../services/storage";
import { colors } from "../theme/colors";
import { DiscoverGardensScreen } from "./DiscoverGardensScreen";

export function GardenScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my_garden" | "discover">("my_garden");
  const [garden, setGarden] = useState<Garden | null>(null);
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [plantName, setPlantName] = useState("");
  const [category, setCategory] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [condition, setCondition] = useState("Healthy");
  const [careNotes, setCareNotes] = useState("");
  const [plantPhoto, setPlantPhoto] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LeafyScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  async function loadGarden() {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentGarden = await getOrCreateMyGarden(user.id);
      const currentPlants = await getGardenPlants(currentGarden.id);
      setGarden(currentGarden);
      setPlants(currentPlants);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load garden.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadGarden();
  }, [user?.id]);

  async function handleAddPlant() {
    if (!user || !garden || !plantName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const uploadedPhoto = plantPhoto ? await uploadPublicImage("garden-photos", user.id, "plants", plantPhoto) : null;
      await createGardenPlant(
        user.id,
        garden.id,
        plantName.trim(),
        uploadedPhoto?.path,
        category.trim(),
        scientificName.trim(),
        condition.trim(),
        careNotes.trim()
      );
      setPlantName("");
      setCategory("");
      setScientificName("");
      setCondition("Healthy");
      setCareNotes("");
      setPlantPhoto(null);
      setScanResult(null);
      setScanMessage(null);
      await loadGarden();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to add plant.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePickPlantPhoto() {
    setError(null);

    try {
      const pickedPhoto = await pickImageFromLibrary();
      if (pickedPhoto) {
        setPlantPhoto(pickedPhoto);
        setScanResult(null);
        setScanMessage(null);
      }
    } catch (photoError) {
      const message = photoError instanceof Error ? photoError.message : "Unable to choose plant photo.";
      setError(message);
    }
  }

  async function handleScanPhoto() {
    if (!plantPhoto) {
      setError("Add a photo before scanning.");
      return;
    }

    setIsScanning(true);
    setScanMessage(null);
    setError(null);

    try {
      const result = await scanPlantWithLeafy(plantPhoto);
      setScanResult(result);
      setPlantName(result.bestMatch);
      setScientificName(result.scientificName || "");
      setCategory(result.category);
      setCondition("Healthy (AI Verified)");
      setCareNotes(`Leafy AI identified this as ${result.bestMatch} (Confidence: ${result.confidence}%).`);
      setScanMessage("Leafy AI successfully scanned this plant!");
    } catch (scanError) {
      const message = scanError instanceof Error ? scanError.message : "Leafy AI scan failed.";
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <Screen>
      <View style={styles.tabHeader}>
        <View style={styles.flexTabHeader}>
          <Pressable
            onPress={() => setActiveTab("my_garden")}
            style={[styles.tabButton, activeTab === "my_garden" && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === "my_garden" && styles.tabButtonTextActive]}>My Garden</Text>
          </Pressable>
        </View>
        <View style={styles.flexTabHeader}>
          <Pressable
            onPress={() => setActiveTab("discover")}
            style={[styles.tabButton, activeTab === "discover" && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === "discover" && styles.tabButtonTextActive]}>Discover</Text>
          </Pressable>
        </View>
      </View>

      {activeTab === "discover" ? (
        <DiscoverGardensScreen />
      ) : (
        <>
          <Text style={styles.title}>{garden?.name ?? "My Plant Collection"}</Text>
          
          <Card tint="sage">
            <Text style={styles.cardTitle}>Showcase your garden</Text>
            <Text style={styles.body}>Add real plant entries, scan them with Leafy AI, and document your growth progress.</Text>
            <View style={styles.form}>
              {plantPhoto && <Image source={{ uri: plantPhoto.uri }} style={styles.preview} />}
              <Button variant="secondary" onPress={handlePickPlantPhoto}>
                {plantPhoto ? "Change plant photo" : "Add plant photo"}
              </Button>
              <Button disabled={!plantPhoto || isScanning} variant="secondary" onPress={handleScanPhoto}>
                {isScanning ? "Scanning with Leafy..." : "Scan with Leafy AI"}
              </Button>

              {scanMessage && <Text style={styles.success}>{scanMessage}</Text>}
              {scanResult && (
                <View style={styles.scanSummary}>
                  <Text style={styles.scanTitle}>Matched: {scanResult.bestMatch}</Text>
                  <Text style={styles.scanMeta}>{scanResult.scientificName || "No scientific name"}</Text>
                </View>
              )}

              <TextInput onChangeText={setPlantName} placeholder="Plant name" placeholderTextColor="#8a9583" style={styles.input} value={plantName} />
              <TextInput onChangeText={setScientificName} placeholder="Scientific name, optional" placeholderTextColor="#8a9583" style={styles.input} value={scientificName} />
              <TextInput onChangeText={setCategory} placeholder="Category (e.g. Herbs, Flowering, Indoor)" placeholderTextColor="#8a9583" style={styles.input} value={category} />
              <TextInput onChangeText={setCondition} placeholder="Plant condition (e.g. Healthy, Needs watering)" placeholderTextColor="#8a9583" style={styles.input} value={condition} />
              <TextInput onChangeText={setCareNotes} placeholder="Care notes & progress updates" placeholderTextColor="#8a9583" style={styles.input} value={careNotes} />

              <Button disabled={isSaving || !plantName.trim()} onPress={handleAddPlant}>
                {isSaving ? "Adding..." : "Add plant"}
              </Button>
            </View>
          </Card>

          {error && (
            <Card tint="warning">
              <Text style={styles.emptyTitle}>Garden error</Text>
              <Text style={styles.body}>{error}</Text>
            </Card>
          )}

          {isLoading && (
            <Card>
              <ActivityIndicator color={colors.green} />
              <Text style={styles.body}>Loading your plant collection...</Text>
            </Card>
          )}

          {!isLoading && plants.length === 0 && (
            <Card>
              <Text style={styles.emptyTitle}>No plants added yet</Text>
              <Text style={styles.body}>Your plant cards will appear here after saving them to Supabase.</Text>
            </Card>
          )}

          {!isLoading &&
            plants.map((plant) => (
              <Card key={plant.id}>
                {plant.photoUrl && <Image source={{ uri: plant.photoUrl }} style={styles.plantImage} />}
                <Text style={styles.plantName}>{plant.name}</Text>
                <Text style={styles.body}>
                  {plant.category ?? "Uncategorized"} - {plant.condition ?? "Healthy"}
                </Text>
                {plant.scientificName && <Text style={styles.scientificText}>{plant.scientificName}</Text>}
                {plant.localName && <Text style={styles.body}>Local name: {plant.localName}</Text>}
                {plant.careNotes && <Text style={styles.careNotesText}>{plant.careNotes}</Text>}
              </Card>
            ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.green,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
  },
  cardTitle: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "900",
  },
  body: {
    marginTop: 8,
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  emptyTitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
  },
  form: {
    gap: 12,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  preview: {
    backgroundColor: colors.white,
    borderRadius: 20,
    height: 180,
    width: "100%",
  },
  plantImage: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    height: 180,
    marginBottom: 14,
    width: "100%",
  },
  plantName: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "900",
  },
  scientificText: {
    color: colors.greenMuted,
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "800",
    marginTop: 4,
  },
  careNotesText: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    color: colors.greenMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 8,
    padding: 10,
  },
  success: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center",
  },
  scanSummary: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  scanTitle: {
    color: colors.green,
    fontSize: 15,
    fontWeight: "900",
  },
  scanMeta: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  tabHeader: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  flexTabHeader: {
    flex: 1,
  },
  tabButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: colors.green,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.greenMuted,
  },
  tabButtonTextActive: {
    color: colors.green,
    fontWeight: "900",
  },
});
