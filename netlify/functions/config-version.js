const { getVersion, corsHeaders } = require("./utils/config-store");

// GET /api/config/version
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  const headers = { ...corsHeaders(), "Content-Type": "application/json" };

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const version = await getVersion();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ version }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ version: 0, message: "Failed to read config version" }),
    };
  }
};
