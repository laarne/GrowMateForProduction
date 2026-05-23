import { supabase } from "./supabase";

export async function createSellerApplication(
  userId: string,
  shopName: string,
  reason: string,
  proofPhotoUrl?: string | null
) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.from("seller_applications").insert({
    user_id: userId,
    shop_name: shopName,
    reason: reason,
    proof_photo_url: proofPhotoUrl || null,
    source_notes: "Submitted from the mobile app.",
  });

  if (error) {
    throw error;
  }
}
