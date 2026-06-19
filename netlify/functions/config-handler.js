const { readConfig, writeConfig, normalizeConfig, corsHeaders } = require("./utils/config-store");

// Handles both GET /api/config and POST /api/config
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  const headers = { ...corsHeaders(), "Content-Type": "application/json" };

  // GET - Fetch config
  if (event.httpMethod === "GET") {
    try {
      const config = await readConfig();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(config),
      };
    } catch (e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: "Failed to read config." }),
      };
    }
  }

  // POST - Update config
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body);
      const config = normalizeConfig(body);

      if (config && typeof config === "object" && config.prizes && Array.isArray(config.prizes)) {
        const success = await writeConfig(config);
        if (success) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: "Configuration saved successfully!", data: config }),
          };
        }
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, message: "Failed to write configuration." }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid configuration format." }),
      };
    } catch (e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: "Failed to save config." }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ message: "Method not allowed" }),
  };
};
