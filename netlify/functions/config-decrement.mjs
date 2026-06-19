import { readConfig, writeConfig, jsonResponse, corsResponse } from "./utils/config-helpers.mjs";

export default async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  try {
    const { itemId, itemName } = await req.json();
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
      await writeConfig(config);
      return jsonResponse({ success: true, message: `Stock for ${item.name} decremented.`, data: config });
    }

    return jsonResponse({ success: false, message: "Item not found." }, 404);
  } catch (e) {
    return jsonResponse({ success: false, message: "Server error: " + (e.message || "Unknown") }, 500);
  }
};

export const config = { path: "/api/config/decrement" };
