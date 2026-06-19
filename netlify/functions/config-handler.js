const { readConfig, writeConfig, normalizeConfig, corsHeaders } = require("./utils/config-store");

// Handles both GET /api/config and POST /api/config
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  const headers = { ...corsHeaders(), "Content-Type": "application/json" };

  try {
    // GET - Fetch config
    if (event.httpMethod === "GET") {
      const config = await readConfig();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(config),
      };
    }

    // POST - Update config
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const config = normalizeConfig(body);

      if (config && typeof config === "object" && config.prizes && Array.isArray(config.prizes)) {
        await writeConfig(config);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: "Configuration saved successfully!", data: config }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid configuration format." }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  } catch (e) {
    console.error("config-handler error:", e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Server error: " + (e.message || "Unknown"),
        debug: {
          hasBlobsContext: !!process.env.NETLIFY_BLOBS_CONTEXT,
          nodeVersion: process.version,
        },
      }),
    };
  }
};
