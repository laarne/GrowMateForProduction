import { supabase } from "./supabase";

export type Garden = {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  coverPhotoUrl: string | null;
  isPublic: boolean;
};

export type GardenPlant = {
  id: string;
  name: string;
  localName: string | null;
  scientificName: string | null;
  category: string | null;
  condition: string | null;
  careNotes: string | null;
  photoUrl: string | null;
};

type GardenPlantPhotoRow = {
  storage_path: string;
  sort_order: number;
};

type GardenPlantRow = {
  id: string;
  name: string;
  local_name: string | null;
  scientific_name: string | null;
  category: string | null;
  condition: string | null;
  care_notes: string | null;
  garden_plant_photos?: GardenPlantPhotoRow[];
};

function getGardenPhotoUrl(storagePath?: string | null) {
  if (!supabase || !storagePath) return null;
  return supabase.storage.from("garden-photos").getPublicUrl(storagePath).data.publicUrl;
}

export async function getOrCreateMyGarden(userId: string): Promise<Garden> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: existingGarden, error: existingError } = await supabase.from("gardens").select("*").eq("user_id", userId).limit(1).maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingGarden) {
    return {
      id: existingGarden.id,
      userId: existingGarden.user_id,
      name: existingGarden.name,
      bio: existingGarden.bio,
      coverPhotoUrl: existingGarden.cover_photo_url,
      isPublic: existingGarden.is_public,
    };
  }

  const { data: createdGarden, error: createError } = await supabase
    .from("gardens")
    .insert({
      user_id: userId,
      name: "My Plant Collection",
      is_public: true,
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return {
    id: createdGarden.id,
    userId: createdGarden.user_id,
    name: createdGarden.name,
    bio: createdGarden.bio,
    coverPhotoUrl: createdGarden.cover_photo_url,
    isPublic: createdGarden.is_public,
  };
}

export async function getGardenPlants(gardenId: string): Promise<GardenPlant[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("garden_plants")
    .select("id, name, local_name, scientific_name, category, condition, care_notes, garden_plant_photos(storage_path, sort_order)")
    .eq("garden_id", gardenId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as GardenPlantRow[]).map((plant) => {
    const sortedPhotos = [...(plant.garden_plant_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);

    return {
      id: plant.id,
      name: plant.name,
      localName: plant.local_name,
      scientificName: plant.scientific_name,
      category: plant.category,
      condition: plant.condition,
      careNotes: plant.care_notes,
      photoUrl: getGardenPhotoUrl(sortedPhotos[0]?.storage_path),
    };
  });
}

export async function createGardenPlant(
  userId: string,
  gardenId: string,
  name: string,
  photoPath?: string | null,
  category?: string | null,
  scientificName?: string | null,
  condition?: string | null,
  careNotes?: string | null
) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("garden_plants")
    .insert({
      garden_id: gardenId,
      user_id: userId,
      name,
      category: category || "Uncategorized",
      scientific_name: scientificName || null,
      condition: condition || "Healthy",
      care_notes: careNotes || null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  if (photoPath) {
    const { error: photoError } = await supabase.from("garden_plant_photos").insert({
      garden_plant_id: data.id,
      user_id: userId,
      storage_path: photoPath,
      sort_order: 0,
    });

    if (photoError) {
      throw photoError;
    }
  }
}
