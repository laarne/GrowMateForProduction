import { supabase } from "./supabase";
import { sanitizeUserInput } from "../utils/sanitize";

export type SellerVerificationDocuments = {
  idFrontUrl: string;
  idBackUrl: string;
  selfieWithIdUrl: string;
  selfieWithPlantUrl: string;
};

export async function createSellerApplication(
  userId: string,
  shopName: string,
  reason: string,
  documents: SellerVerificationDocuments
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const sanitizedShopName = sanitizeUserInput(shopName, { maxLength: 100 });
  const sanitizedReason = sanitizeUserInput(reason, { maxLength: 1200, preserveNewlines: true });
  if (!sanitizedShopName || !sanitizedReason) {
    throw new Error("Shop name and application reason are required.");
  }

  const { error } = await supabase.from("seller_applications").insert({
    user_id: userId,
    shop_name: sanitizedShopName,
    reason: sanitizedReason,
    proof_photo_url: documents.idFrontUrl,
    id_front_url: documents.idFrontUrl,
    id_back_url: documents.idBackUrl,
    selfie_with_id_url: documents.selfieWithIdUrl,
    selfie_with_plant_url: documents.selfieWithPlantUrl,
    source_notes: "Submitted from the mobile app with ID front, ID back, selfie with ID, and selfie with plant.",
  });

  if (error) {
    throw error;
  }
}
