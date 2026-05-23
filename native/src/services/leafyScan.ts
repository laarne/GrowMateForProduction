import { supabase } from "./supabase";
import type { PickedImage } from "./storage";

export type LeafyScanResult = {
  provider: string;
  bestMatch: string;
  scientificName: string | null;
  commonNames: string[];
  family: string | null;
  genus: string | null;
  confidence: number;
  category: string;
  saleStatus: "safe_to_sell" | "review_required" | "blocked";
  reviewReason: string;
  remainingRequests?: number;
};

export async function scanPlantWithLeafy(image: PickedImage): Promise<LeafyScanResult> {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!image.base64) throw new Error("Choose an image again so Leafy can scan it.");

  const { data, error } = await supabase.functions.invoke<LeafyScanResult>("leafy-scan", {
    body: {
      imageBase64: image.base64,
      mimeType: image.mimeType ?? "image/jpeg",
      organ: "auto",
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Leafy scan did not return a result.");
  }

  return data;
}
