import { supabase } from "./supabase";

type ProfileRow = {
  id: string;
  display_name: string;
  location: string | null;
};

type SellerApplicationRow = {
  id: string;
  user_id: string;
  shop_name: string | null;
  reason: string | null;
  proof_photo_url: string | null;
  status: string;
  created_at: string;
};

type ListingReviewRow = {
  id: string;
  seller_id: string;
  name: string;
  local_name: string | null;
  category: string;
  price: number | string;
  quantity: number;
  unit: string;
  location: string;
  description: string | null;
  ai_confidence: number | string | null;
  created_at: string;
};

export type PendingSellerApplication = {
  id: string;
  userId: string;
  applicantName: string;
  applicantLocation: string | null;
  shopName: string | null;
  reason: string | null;
  proofPhotoUrl: string | null;
  status: string;
  createdAt: string;
};

export type PendingListingReview = {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  localName: string | null;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  location: string;
  description: string | null;
  aiConfidence: number | null;
  createdAt: string;
};

async function getProfilesByIds(ids: string[]) {
  if (!supabase || ids.length === 0) return new Map<string, ProfileRow>();

  const { data, error } = await supabase.from("profiles").select("id, display_name, location").in("id", ids);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile as ProfileRow]));
}

export async function getPendingSellerApplications(): Promise<PendingSellerApplication[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("seller_applications")
    .select("id, user_id, shop_name, reason, proof_photo_url, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const applications = (data ?? []) as SellerApplicationRow[];
  const profiles = await getProfilesByIds(applications.map((application) => application.user_id));

  return applications.map((application) => {
    const profile = profiles.get(application.user_id);

    return {
      id: application.id,
      userId: application.user_id,
      applicantName: profile?.display_name ?? "GrowMate user",
      applicantLocation: profile?.location ?? null,
      shopName: application.shop_name,
      reason: application.reason,
      proofPhotoUrl: application.proof_photo_url,
      status: application.status,
      createdAt: application.created_at,
    };
  });
}

export async function getPendingListingReviews(): Promise<PendingListingReview[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("listings")
    .select("id, seller_id, name, local_name, category, price, quantity, unit, location, description, ai_confidence, created_at")
    .eq("status", "review")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const listings = (data ?? []) as ListingReviewRow[];
  const profiles = await getProfilesByIds(listings.map((listing) => listing.seller_id));

  return listings.map((listing) => {
    const profile = profiles.get(listing.seller_id);

    return {
      id: listing.id,
      sellerId: listing.seller_id,
      sellerName: profile?.display_name ?? "Verified seller",
      name: listing.name,
      localName: listing.local_name,
      category: listing.category,
      price: Number(listing.price),
      quantity: listing.quantity,
      unit: listing.unit,
      location: listing.location,
      description: listing.description,
      aiConfidence: listing.ai_confidence === null ? null : Number(listing.ai_confidence),
      createdAt: listing.created_at,
    };
  });
}

export async function approveSellerApplication(application: PendingSellerApplication, adminId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const shopName = application.shopName || `${application.applicantName}'s Plant Shop`;

  const { error: profileError } = await supabase.from("profiles").update({ seller_status: "verified" }).eq("id", application.userId);
  if (profileError) throw profileError;

  const { error: sellerProfileError } = await supabase.from("seller_profiles").upsert(
    {
      user_id: application.userId,
      shop_name: shopName,
      seller_bio: application.reason,
    },
    { onConflict: "user_id" },
  );
  if (sellerProfileError) throw sellerProfileError;

  const { error: applicationError } = await supabase
    .from("seller_applications")
    .update({
      status: "verified",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_note: "Approved for seller access.",
    })
    .eq("id", application.id);

  if (applicationError) throw applicationError;
}

export async function rejectSellerApplication(application: PendingSellerApplication, adminId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error: profileError } = await supabase.from("profiles").update({ seller_status: "rejected" }).eq("id", application.userId);
  if (profileError) throw profileError;

  const { error } = await supabase
    .from("seller_applications")
    .update({
      status: "rejected",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_note: "Seller application rejected by admin.",
    })
    .eq("id", application.id);

  if (error) throw error;
}

export async function approveListingReview(listingId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from("listings")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
      review_note: "Approved for marketplace.",
    })
    .eq("id", listingId);

  if (error) throw error;
}

export async function rejectListingReview(listingId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from("listings")
    .update({
      status: "rejected",
      review_note: "Listing rejected by admin.",
    })
    .eq("id", listingId);

  if (error) throw error;
}
