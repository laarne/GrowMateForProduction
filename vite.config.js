import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

function plantIdDevProxy(apiKey) {
  return {
    name: "growmate-plant-id-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/plant-id-scan", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          if (!apiKey) throw new Error("Plant.id API key is missing");
          let rawBody = "";
          for await (const chunk of req) rawBody += chunk;
          const body = JSON.parse(rawBody || "{}");
          const response = await fetch("https://plant.id/api/v3/identification?classification_level=species", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Api-Key": apiKey,
            },
            body: JSON.stringify({ images: body.images ?? [] }),
          });
          const text = await response.text();
          res.statusCode = response.status;
          res.setHeader("Content-Type", "application/json");
          res.end(text);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message ?? "Plant.id proxy failed" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const plantIdKey = env.PLANT_ID_API_KEY || env.VITE_PLANT_ID_API_KEY;

  return {
    base: "./",
    plugins: [react(), plantIdDevProxy(plantIdKey)],
  };
});
