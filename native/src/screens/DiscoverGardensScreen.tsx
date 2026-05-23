import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, StyleSheet, Text, View, ScrollView } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { getGardenPlants, type GardenPlant } from "../services/gardens";
import {
  getDiscoverableGardens,
  getFollowedGardens,
  getGardenFollowerCount,
  isFollowingGarden,
  toggleFollowGarden,
  type FollowedGarden,
} from "../services/gardenFollows";
import { colors } from "../theme/colors";

type Tab = "discover" | "following";

export function DiscoverGardensScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [gardens, setGardens] = useState<FollowedGarden[]>([]);
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states for viewing garden plants
  const [selectedGarden, setSelectedGarden] = useState<FollowedGarden | null>(null);
  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);

  async function loadData() {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      let data: FollowedGarden[] = [];
      if (activeTab === "discover") {
        data = await getDiscoverableGardens(user.id);
      } else {
        data = await getFollowedGardens(user.id);
      }

      setGardens(data);

      // Load follower counts and following states
      const counts: Record<string, number> = {};
      const states: Record<string, boolean> = {};

      for (const garden of data) {
        const count = await getGardenFollowerCount(garden.id);
        const state = await isFollowingGarden(garden.id, user.id);
        counts[garden.id] = count;
        states[garden.id] = state;
      }

      setFollowerCounts(counts);
      setFollowingStates(states);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gardens");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab, user?.id]);

  async function handleToggleFollow(gardenId: string) {
    if (!user) return;

    try {
      const isFollowingNow = await toggleFollowGarden(gardenId, user.id);
      setFollowingStates((prev) => ({ ...prev, [gardenId]: isFollowingNow }));
      setFollowerCounts((prev) => ({
        ...prev,
        [gardenId]: (prev[gardenId] ?? 0) + (isFollowingNow ? 1 : -1),
      }));

      if (activeTab === "following" && !isFollowingNow) {
        // Remove from list if in following tab
        setGardens((prev) => prev.filter((g) => g.id !== gardenId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  async function handleViewPlants(garden: FollowedGarden) {
    setSelectedGarden(garden);
    setIsLoadingPlants(true);
    setGardenPlants([]);
    try {
      const plants = await getGardenPlants(garden.id);
      setGardenPlants(plants);
    } catch (err) {
      console.error("Failed to load plants for garden", garden.id, err);
    } finally {
      setIsLoadingPlants(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.flexTab}>
          <Button
            variant={activeTab === "discover" ? "primary" : "secondary"}
            onPress={() => setActiveTab("discover")}
          >
            Discover Gardens
          </Button>
        </View>
        <View style={styles.flexTab}>
          <Button
            variant={activeTab === "following" ? "primary" : "secondary"}
            onPress={() => setActiveTab("following")}
          >
            Following
          </Button>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.green} size="large" />
          <Text style={styles.loadingText}>Loading gardens...</Text>
        </View>
      )}

      {error && (
        <Card tint="warning">
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {!isLoading && !error && gardens.length === 0 && (
        <Card>
          <Text style={styles.emptyTitle}>
            {activeTab === "discover" ? "No discoverable gardens" : "Not following any gardens yet"}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === "discover"
              ? "Check back later for new gardens."
              : "Explore discoverable gardens and tap follow to see them here!"}
          </Text>
        </Card>
      )}

      {!isLoading &&
        !error &&
        gardens.map((garden) => {
          const isFollowing = followingStates[garden.id] ?? false;
          const count = followerCounts[garden.id] ?? 0;

          return (
            <Card key={garden.id} tint="sage">
              <View style={styles.gardenHeader}>
                <View style={styles.ownerInfo}>
                  {garden.avatarUrl ? (
                    <Image source={{ uri: garden.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {garden.userName.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.gardenName}>{garden.name}</Text>
                    <Text style={styles.ownerName}>by {garden.userName}</Text>
                  </View>
                </View>
                <Text style={styles.followerCount}>
                  {count} {count === 1 ? "follower" : "followers"}
                </Text>
              </View>

              {garden.bio && <Text style={styles.bioText}>{garden.bio}</Text>}

              <View style={styles.buttonRow}>
                <View style={styles.flexButton}>
                  <Button variant="secondary" onPress={() => handleViewPlants(garden)}>
                    View Plants
                  </Button>
                </View>
                {garden.userId !== user?.id && (
                  <View style={styles.flexButton}>
                    <Button
                      variant={isFollowing ? "secondary" : "primary"}
                      onPress={() => handleToggleFollow(garden.id)}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  </View>
                )}
              </View>
            </Card>
          );
        })}

      {/* Modal for viewing garden plants */}
      <Modal
        visible={selectedGarden !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedGarden(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedGarden?.name}</Text>
            <Text style={styles.modalSubtitle}>Garden by {selectedGarden?.userName}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {isLoadingPlants && (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={colors.green} size="large" />
                <Text style={styles.loadingText}>Loading plant list...</Text>
              </View>
            )}

            {!isLoadingPlants && gardenPlants.length === 0 && (
              <Card>
                <Text style={styles.emptyTitle}>Garden is empty</Text>
                <Text style={styles.emptyText}>This gardener hasn't added any plants yet.</Text>
              </Card>
            )}

            {!isLoadingPlants &&
              gardenPlants.map((plant) => (
                <Card key={plant.id}>
                  {plant.photoUrl && <Image source={{ uri: plant.photoUrl }} style={styles.plantImage} />}
                  <Text style={styles.plantName}>{plant.name}</Text>
                  <Text style={styles.plantCategory}>
                    {plant.category ?? "Uncategorized"} - {plant.condition ?? "Healthy"}
                  </Text>
                  {plant.scientificName && <Text style={styles.scientificName}>{plant.scientificName}</Text>}
                  {plant.careNotes && <Text style={styles.careNotesText}>{plant.careNotes}</Text>}
                </Card>
              ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button onPress={() => setSelectedGarden(null)}>Close</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  flexTab: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyTitle: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: colors.greenMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  errorTitle: {
    color: "#9f2d20",
    fontSize: 16,
    fontWeight: "900",
  },
  errorText: {
    color: colors.greenMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  gardenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sage,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  gardenName: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  ownerName: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  followerCount: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
  },
  bioText: {
    color: colors.greenMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  flexButton: {
    flex: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: 50,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalTitle: {
    color: colors.green,
    fontSize: 22,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 100,
  },
  modalLoading: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  modalFooter: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.cream,
    paddingTop: 10,
  },
  plantImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.sage,
    marginBottom: 10,
  },
  plantName: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
  },
  plantCategory: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  scientificName: {
    color: colors.greenMuted,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "700",
    marginTop: 2,
  },
  careNotesText: {
    backgroundColor: colors.cream,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    fontSize: 13,
    color: colors.greenMuted,
    fontWeight: "700",
    marginTop: 8,
    lineHeight: 18,
  },
});
