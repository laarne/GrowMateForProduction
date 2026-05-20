exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const apiKey = process.env.PLANT_ID_API_KEY || process.env.VITE_PLANT_ID_API_KEY;
    if (!apiKey) throw new Error("Plant.id API key is missing");

    const body = JSON.parse(event.body || "{}");
    const response = await fetch("https://plant.id/api/v3/identification?classification_level=species", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
      },
      body: JSON.stringify({ images: body.images ?? [] }),
    });

    const text = await response.text();
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Plant.id scan failed" }),
    };
  }
};
