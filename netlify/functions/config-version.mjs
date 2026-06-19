import { getVersion, jsonResponse, corsResponse } from "./utils/config-helpers.mjs";

export default async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const version = await getVersion();
    return jsonResponse({ version });
  } catch (e) {
    return jsonResponse({ version: 0, message: "Failed to read config version" }, 500);
  }
};

export const config = { path: "/api/config/version" };
