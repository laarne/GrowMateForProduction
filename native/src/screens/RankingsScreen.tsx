import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { getLeaderboard, type LeaderboardEntry } from "../services/rankings";
import { colors } from "../theme/colors";

export function RankingsScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLeaderboard() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load leaderboard.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  function getRankBadge(index: number) {
    if (index === 0) return { icon: "🥇", color: "#d4af37" };
    if (index === 1) return { icon: "🥈", color: "#c0c0c0" };
    if (index === 2) return { icon: "🥉", color: "#cd7f32" };
    return null;
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Rankings</Text>
        <Button variant="secondary" onPress={loadLeaderboard}>
          Refresh
        </Button>
      </View>

      <Card tint="sage">
        <Text style={styles.cardTitle}>GrowMate Community Leaders</Text>
        <Text style={styles.cardBody}>
          Earn reputation points by completing sales, sharing helpful feed answers, and maintaining your garden.
        </Text>
      </Card>

      {error && (
        <Card tint="warning">
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {isLoading && (
        <Card>
          <ActivityIndicator color={colors.green} style={styles.loader} />
          <Text style={styles.loadingText}>Fetching growers leaderboard...</Text>
        </Card>
      )}

      {!isLoading && leaderboard.length === 0 && (
        <Card>
          <Text style={styles.emptyTitle}>Leaderboard is quiet</Text>
          <Text style={styles.emptyBody}>Complete transactions or post in the community to start earning points!</Text>
        </Card>
      )}

      {!isLoading && leaderboard.length > 0 && (
        <ScrollView style={styles.list}>
          {leaderboard.map((entry, index) => {
            const badge = getRankBadge(index);
            return (
              <View key={entry.userId} style={styles.entryRow}>
                <View style={styles.rankCol}>
                  {badge ? (
                    <Text style={styles.badgeText}>{badge.icon}</Text>
                  ) : (
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  )}
                </View>
                {entry.avatarUrl ? (
                  <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>
                      {entry.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.content}>
                  <Text style={styles.displayName}>{entry.displayName}</Text>
                  {entry.location && <Text style={styles.meta}>{entry.location}</Text>}
                </View>
                <View style={styles.pointsCol}>
                  <Text style={styles.pointsNumber}>{entry.points}</Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  cardTitle: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "900",
  },
  cardBody: {
    marginTop: 8,
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  list: {
    marginTop: 10,
  },
  entryRow: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 14,
  },
  rankCol: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
  },
  badgeText: {
    fontSize: 22,
  },
  rankNumber: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "900",
  },
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarLetter: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "900",
  },
  content: {
    flex: 1,
  },
  displayName: {
    color: colors.green,
    fontSize: 15,
    fontWeight: "900",
  },
  meta: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  pointsCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  pointsNumber: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  pointsLabel: {
    color: colors.greenMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  loader: {
    marginVertical: 12,
  },
  loadingText: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 8,
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  errorText: {
    color: "#9f2d20",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
