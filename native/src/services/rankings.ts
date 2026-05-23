import { supabase } from "./supabase";

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  location: string | null;
  avatarUrl: string | null;
  points: number;
};

type RankEventRow = {
  user_id: string;
  points: number;
  profiles: {
    display_name: string;
    location: string | null;
    avatar_url: string | null;
  } | null;
};

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  // Fetch recent rank events with profile information
  const { data, error } = await supabase
    .from("rank_events")
    .select(`
      user_id,
      points,
      profiles:user_id (
        display_name,
        location,
        avatar_url
      )
    `)
    .limit(200);

  if (error) {
    throw error;
  }

  const events = (data ?? []) as unknown as RankEventRow[];
  const userMap = new Map<string, LeaderboardEntry>();

  for (const event of events) {
    const profile = event.profiles;
    if (!profile) continue;

    const existing = userMap.get(event.user_id);
    if (existing) {
      existing.points += event.points;
    } else {
      userMap.set(event.user_id, {
        userId: event.user_id,
        displayName: profile.display_name,
        location: profile.location,
        avatarUrl: profile.avatar_url,
        points: event.points,
      });
    }
  }

  // Convert map to array and sort by points descending
  const leaderboard = Array.from(userMap.values());
  return leaderboard.sort((a, b) => b.points - a.points).slice(0, 10);
}
