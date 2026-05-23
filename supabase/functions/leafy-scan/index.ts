import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ScanRequest = {
  imageBase64?: string;
  mimeType?: string;
  organ?: string;
};

type PlantNetResult = {
  score?: number;
  species?: {
    scientificNameWithoutAuthor?: string;
    scientificNameAuthorship?: string;
    commonNames?: string[];
    family?: { scientificNameWithoutAuthor?: string };
    genus?: { scientificNameWithoutAuthor?: string };
  };
};

type PlantNetResponse = {
  query?: {
    remainingIdentificationRequests?: number;
  };
  results?: PlantNetResult[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedOrgans = new Set(["leaf", "flower", "fruit", "bark", "habit", "other"]);

const reviewTerms = [
  "waling-waling",
  "vanda sanderiana",
  "paphiopedilum",
  "cycas wadei",
  "nepenthes",
  "rafflesia",
  "dendrobium schuetzei",
  "phalaenopsis micholitzii",
  "palawan cherry",
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function base64ToBlob(base64: string, mimeType: string) {
  const cleanBase64 = base64.includes(",") ? base64.split(",").pop() ?? "" : base64;
  const binary = atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function inferCategory(name: string, commonNames: string[]) {
  const combined = normalizeText([name, ...commonNames].join(" "));

  if (/(basil|rosemary|mint|oregano|thyme|parsley|cilantro|herb)/.test(combined)) return "Herbs";
  if (/(pechay|bok choy|eggplant|talong|onion|sibuyas|tomato|chili|sili|lettuce|vegetable)/.test(combined)) return "Veggies";
  if (/(calamansi|citrus|mango|guava|papaya|banana|fruit)/.test(combined)) return "Fruit Trees";
  if (/(cactus|succulent|echeveria|aloe|haworthia)/.test(combined)) return "Succulents";
  if (/(orchid|hoya|bougainvillea|flower)/.test(combined)) return "Flowering";
  if (/(monstera|philodendron|pothos|calathea|alocasia|anthurium|fern|snake plant|sansevieria)/.test(combined)) return "Indoor";

  return "Indoor";
}

function getSaleDecision(name: string, commonNames: string[], confidence: number) {
  const combined = normalizeText([name, ...commonNames].join(" "));
  const matchedTerm = reviewTerms.find((term) => combined.includes(term));

  if (matchedTerm && confidence >= 70) {
    return {
      saleStatus: "review_required" as const,
      reviewReason: `Possible protected or restricted species match: ${matchedTerm}. Admin review is required before selling.`,
    };
  }

  if (confidence < 35) {
    return {
      saleStatus: "review_required" as const,
      reviewReason: "Plant identity confidence is low. Add clearer photos for admin review.",
    };
  }

  return {
    saleStatus: "safe_to_sell" as const,
    reviewReason: "No protected-species flag detected. Still confirm local rules before selling.",
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const apiKey = Deno.env.get("PLANTNET_API_KEY");

  if (!apiKey) {
    return jsonResponse({ error: "PlantNet secret is not configured." }, 500);
  }

  let payload: ScanRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be JSON." }, 400);
  }

  if (!payload.imageBase64) {
    return jsonResponse({ error: "imageBase64 is required." }, 400);
  }

  const mimeType = payload.mimeType ?? "image/jpeg";
  const organ = allowedOrgans.has(payload.organ ?? "") ? payload.organ! : "leaf";
  const formData = new FormData();

  formData.append("images", base64ToBlob(payload.imageBase64, mimeType), `scan.${mimeType.includes("png") ? "png" : "jpg"}`);
  formData.append("organs", organ);

  const endpoint = new URL("https://my-api.plantnet.org/v2/identify/all");
  endpoint.searchParams.set("api-key", apiKey);
  endpoint.searchParams.set("lang", "en");
  endpoint.searchParams.set("include-related-images", "false");
  endpoint.searchParams.set("nb-results", "5");

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    return jsonResponse(
      {
        error: "PlantNet scan failed.",
        status: response.status,
        details: details.slice(0, 240),
      },
      response.status,
    );
  }

  const data = (await response.json()) as PlantNetResponse;
  const best = data.results?.[0];

  if (!best?.species) {
    return jsonResponse({ error: "No plant match found. Try a clearer plant photo." }, 422);
  }

  const scientificName = best.species.scientificNameWithoutAuthor ?? "Unknown plant";
  const commonNames = best.species.commonNames ?? [];
  const confidence = Math.round((best.score ?? 0) * 1000) / 10;
  const decision = getSaleDecision(scientificName, commonNames, confidence);

  return jsonResponse({
    provider: "PlantNet",
    bestMatch: commonNames[0] ?? scientificName,
    scientificName,
    commonNames,
    family: best.species.family?.scientificNameWithoutAuthor ?? null,
    genus: best.species.genus?.scientificNameWithoutAuthor ?? null,
    confidence,
    category: inferCategory(scientificName, commonNames),
    saleStatus: decision.saleStatus,
    reviewReason: decision.reviewReason,
    remainingRequests: data.query?.remainingIdentificationRequests,
  });
});
