import { supabase } from "./supabase";
import { sanitizeNullableUserInput, sanitizeUserInput } from "../utils/sanitize";

export type SellerStatus = "not_applied" | "pending" | "verified" | "rejected" | "suspended";

export type Profile = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  bio: string | null;
  seller_status: SellerStatus;
  is_admin: boolean;
};

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileAvatar(userId: string, avatarUrl: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
  if (error) throw error;
}

export async function updateProfileCover(userId: string, coverUrl: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("profiles").update({ cover_url: coverUrl }).eq("id", userId);
  if (error) throw error;
}

export async function updateProfile(
  userId: string,
  updates: { display_name: string; username?: string | null; bio?: string | null; location?: string | null }
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const displayName = sanitizeUserInput(updates.display_name, { maxLength: 80 });
  if (!displayName) throw new Error("Display name is required.");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      username: sanitizeNullableUserInput(updates.username, { maxLength: 32 }),
      bio: sanitizeNullableUserInput(updates.bio, { maxLength: 500, preserveNewlines: true }),
      location: sanitizeNullableUserInput(updates.location, { maxLength: 120 }),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export type SellerProfile = {
  userId: string;
  shopName: string;
  sellerBio: string | null;
  trustScore: number;
  completedSales: number;
  displayName: string;
  avatarUrl: string | null;
  location: string | null;
  createdAt: string;
};

export async function getSellerProfile(sellerId: string): Promise<SellerProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("seller_profiles")
    .select(`
      user_id,
      shop_name,
      seller_bio,
      trust_score,
      completed_sales,
      created_at,
      profile:profiles!seller_profiles_user_id_fkey(display_name, avatar_url, location)
    `)
    .eq("user_id", sellerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const profile = Array.isArray(data.profile) ? data.profile[0] : data.profile;

  return {
    userId: data.user_id,
    shopName: data.shop_name,
    sellerBio: data.seller_bio,
    trustScore: Number(data.trust_score),
    completedSales: data.completed_sales,
    displayName: profile?.display_name ?? "Verified Seller",
    avatarUrl: profile?.avatar_url ?? null,
    location: profile?.location ?? null,
    createdAt: data.created_at,
  };
}

export type SellerStats = {
  totalRevenue: number;
  pendingOrdersCount: number;
  soldListingsCount: number;
  ratingsAverage: number;
  ratingsCount: number;
};

export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  if (!supabase) {
    return { totalRevenue: 0, pendingOrdersCount: 0, soldListingsCount: 0, ratingsAverage: 0, ratingsCount: 0 };
  }

  // Fetch all orders for this seller
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("status, subtotal")
    .eq("seller_id", sellerId);

  // Fetch all reviews for this seller
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", sellerId);

  if (ordersError || reviewsError) {
    console.warn("Failed to load seller stats:", ordersError?.message || reviewsError?.message);
    return { totalRevenue: 0, pendingOrdersCount: 0, soldListingsCount: 0, ratingsAverage: 0, ratingsCount: 0 };
  }

  let totalRevenue = 0;
  let pendingOrdersCount = 0;
  let soldListingsCount = 0;

  (orders ?? []).forEach((order) => {
    if (order.status === "completed" || order.status === "paid") {
      totalRevenue += Number(order.subtotal);
      soldListingsCount += 1;
    } else if (order.status === "pending") {
      pendingOrdersCount += 1;
    }
  });

  let ratingsAverage = 0;
  const ratingsCount = reviews?.length ?? 0;
  if (ratingsCount > 0) {
    const sum = (reviews ?? []).reduce((acc, rev) => acc + rev.rating, 0);
    ratingsAverage = Math.round((sum / ratingsCount) * 10) / 10;
  }

  return {
    totalRevenue,
    pendingOrdersCount,
    soldListingsCount,
    ratingsAverage,
    ratingsCount,
  };
}
