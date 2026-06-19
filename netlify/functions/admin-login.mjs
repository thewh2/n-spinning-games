import { jsonResponse, corsResponse } from "./utils/config-helpers.mjs";

export default async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  try {
    const { username, password } = await req.json();

    if (typeof username !== "string" || typeof password !== "string") {
      return jsonResponse({ success: false, message: "Invalid credentials payload." }, 400);
    }

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "n@dmin#88";

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, message: "Invalid username or password." }, 401);
  } catch (e) {
    console.error("Admin login error:", e);
    return jsonResponse({ success: false, message: "Login failed." }, 500);
  }
};

export const config = { path: "/api/admin/login" };
