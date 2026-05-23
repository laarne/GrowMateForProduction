import { supabase } from "./supabase";

export type FollowedGarden = {
  id: string;
  name: string;
  bio: string | null;
  coverPhotoUrl: string | null;
  userId: string;
  userName: string;
  avatarUrl: string | null;
};

export async function isFollowingGarden(gardenId: string, followerId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("garden_follows")
    .select("garden_id")
    .eq("garden_id", gardenId)
    .eq("follower_id", followerId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function toggleFollowGarden(gardenId: string, followerId: string): Promise<boolean> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("garden_follows")
    .select("garden_id")
    .eq("garden_id", gardenId)
    .eq("follower_id", followerId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    const { error: deleteError } = await supabase
      .from("garden_follows")
      .delete()
      .eq("garden_id", gardenId)
      .eq("follower_id", followerId);
    if (deleteError) throw deleteError;
    return false; // Unfollowed
  } else {
    const { error: insertError } = await supabase
      .from("garden_follows")
      .insert({ garden_id: gardenId, follower_id: followerId });
    if (insertError) throw insertError;
    return true; // Followed
  }
}

export async function getGardenFollowerCount(gardenId: string): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("garden_follows")
    .select("*", { count: "exact", head: true })
    .eq("garden_id", gardenId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getFollowedGardens(followerId: string): Promise<FollowedGarden[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("garden_follows")
    .select(`
      garden:gardens (
        id,
        name,
        bio,
        cover_photo_url,
        user_id,
        owner:profiles!gardens_user_id_fkey(display_name, avatar_url)
      )
    `)
    .eq("follower_id", followerId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const garden = row.garden;
    const owner = Array.isArray(garden?.owner) ? garden.owner[0] : garden?.owner;

    return {
      id: garden?.id ?? "",
      name: garden?.name ?? "Unknown Garden",
      bio: garden?.bio ?? null,
      coverPhotoUrl: garden?.cover_photo_url ?? null,
      userId: garden?.user_id ?? "",
      userName: owner?.display_name ?? "GrowMate Gardener",
      avatarUrl: owner?.avatar_url ?? null,
    };
  });
}

export async function getDiscoverableGardens(currentUserId: string): Promise<FollowedGarden[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("gardens")
    .select(`
      id,
      name,
      bio,
      cover_photo_url,
      user_id,
      owner:profiles!gardens_user_id_fkey(display_name, avatar_url)
    `)
    .eq("is_public", true)
    .neq("user_id", currentUserId)
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((garden: any) => {
    const owner = Array.isArray(garden.owner) ? garden.owner[0] : garden.owner;
    return {
      id: garden.id,
      name: garden.name,
      bio: garden.bio,
      coverPhotoUrl: garden.cover_photo_url,
      userId: garden.user_id,
      userName: owner?.display_name ?? "GrowMate Gardener",
      avatarUrl: owner?.avatar_url ?? null,
    };
  });
}
