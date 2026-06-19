const { corsHeaders } = require("./utils/config-store");

// POST /api/admin/login
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  const headers = { ...corsHeaders(), "Content-Type": "application/json" };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { username, password } = JSON.parse(event.body || "{}");

    if (typeof username !== "string" || typeof password !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid credentials payload." }),
      };
    }

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "n@dmin#88";

    const usernameOk = username === ADMIN_USERNAME;
    const passwordOk = password === ADMIN_PASSWORD;

    if (usernameOk && passwordOk) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, message: "Invalid username or password." }),
    };
  } catch (e) {
    console.error("Admin login error:", e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Login failed." }),
    };
  }
};
