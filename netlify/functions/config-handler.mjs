import { readConfig, writeConfig, normalizeConfig, jsonResponse, corsResponse } from "./utils/config-helpers.mjs";

// Handles both GET /api/config and POST /api/config
export default async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    if (req.method === "GET") {
      const config = await readConfig();
      return jsonResponse(config);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const config = normalizeConfig(body);

      if (config && typeof config === "object" && config.prizes && Array.isArray(config.prizes)) {
        await writeConfig(config);
        return jsonResponse({ success: true, message: "Configuration saved successfully!", data: config });
      }
      return jsonResponse({ success: false, message: "Invalid configuration format." }, 400);
    }

    return jsonResponse({ message: "Method not allowed" }, 405);
  } catch (e) {
    console.error("config-handler error:", e);
    return jsonResponse({
      success: false,
      message: "Server error: " + (e.message || "Unknown"),
      debug: { hasBlobsContext: !!process.env.NETLIFY_BLOBS_CONTEXT, nodeVersion: process.version },
    }, 500);
  }
};

export const config = { path: "/api/config" };
