const { readConfig, writeConfig, corsHeaders } = require("./utils/config-store");

// POST /api/config/decrement
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
    const { itemId, itemName } = JSON.parse(event.body);
    const config = await readConfig();
    const prizes = config.prizes || config;
    let item;

    if (itemId !== undefined) {
      item = prizes.find((i) => i.id === parseInt(itemId, 10));
    } else if (itemName) {
      item = prizes.find((i) => i.name === itemName || `${i.name} ${i.icon}` === itemName);
    }

    if (item) {
      item.winCount = Number(item.winCount || 0) + 1;
      item.stock = Math.max(0, item.stock - 1);

      const success = await writeConfig(config);
      if (success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: `Stock for ${item.name} decremented.`, data: config }),
        };
      }
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: "Failed to write configuration file." }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: "Item not found." }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Server error." }),
    };
  }
};
