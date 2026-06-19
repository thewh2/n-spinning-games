/**
 * Config store using Netlify Blobs REST API directly (no SDK).
 * This avoids all bundling/import issues with @netlify/blobs.
 */

const STORE_NAME = "nchat-wheel-config";
const CONFIG_KEY = "config";
const VERSION_KEY = "version";

const DEFAULT_CONFIG = {
  maxSpinsPerDay: 3,
  prizes: [
    { id: 1, name: "Wallet Ladies", icon: "👜", probability: 2, stock: 10, isPrize: true, enabled: true, winCount: 0 },
    { id: 3, name: "Wallet Men", icon: "💼", probability: 2, stock: 10, isPrize: true, enabled: true, winCount: 0 },
    { id: 5, name: "Pickle Ball", icon: "🎾", probability: 5, stock: 10, isPrize: true, enabled: true, winCount: 0 },
    { id: 7, name: "Pen", icon: "🖊️", probability: 15, stock: 10, isPrize: true, enabled: true, winCount: 0 },
  ],
};

function normalizeConfig(config) {
  const safeConfig = config && typeof config === "object" ? config : { maxSpinsPerDay: 3, prizes: [] };
  const safePrizes = Array.isArray(safeConfig.prizes) ? safeConfig.prizes : [];
  return {
    ...safeConfig,
    prizes: safePrizes.map((item) => ({
      ...item,
      winCount: Number(item.winCount || 0),
    })),
  };
}

// Parse the Netlify Blobs context from environment
function getBlobsContext() {
  const raw = process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) {
    throw new Error("NETLIFY_BLOBS_CONTEXT env var not set — Blobs not available");
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Try base64 decode
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  }
}

// Build the Blobs API URL and headers
function getBlobsRequest(key) {
  const ctx = getBlobsContext();

  // Netlify Blobs context has different formats depending on the version
  const baseURL = ctx.uncachedEdgeURL || ctx.edgeURL || ctx.apiURL;
  const siteID = ctx.siteID;
  const token = ctx.token;
  const deployID = ctx.deployID;

  if (!baseURL || !token) {
    throw new Error(`Invalid blobs context. Keys: ${Object.keys(ctx).join(", ")}`);
  }

  // The URL format for site-level stores
  let url;
  if (ctx.edgeURL || ctx.uncachedEdgeURL) {
    url = `${baseURL}/${siteID}/site:${STORE_NAME}/${key}`;
  } else {
    // API URL format
    url = `${baseURL}/api/v1/blobs/${siteID}/site:${STORE_NAME}/${key}`;
  }

  return {
    url,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

async function getBlob(key) {
  const { url, headers } = getBlobsRequest(key);
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Blob GET failed (${res.status}): ${text}`);
  }
  return res.text();
}

async function setBlob(key, value) {
  const { url, headers } = getBlobsRequest(key);
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/octet-stream" },
    body: value,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Blob PUT failed (${res.status}): ${text}`);
  }
}

async function readConfig() {
  try {
    const data = await getBlob(CONFIG_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return normalizeConfig({ maxSpinsPerDay: 3, prizes: parsed });
      }
      return normalizeConfig(parsed);
    }
  } catch (e) {
    console.error("Error reading config:", e.message || e);
  }
  return normalizeConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
}

async function writeConfig(config) {
  try {
    await setBlob(CONFIG_KEY, JSON.stringify(config));
    await incrementVersion();
    return true;
  } catch (e) {
    console.error("Error writing config:", e.message || e);
    throw e; // Re-throw so the handler can include the error message
  }
}

async function getVersion() {
  try {
    const version = await getBlob(VERSION_KEY);
    return version ? Number(version) : 0;
  } catch (e) {
    console.error("Error getting version:", e.message || e);
    return 0;
  }
}

async function incrementVersion() {
  try {
    const current = await getVersion();
    await setBlob(VERSION_KEY, String(current + 1));
  } catch (e) {
    console.error("Error incrementing version:", e.message || e);
  }
}

// Standard CORS + no-cache headers for all API responses
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
}

module.exports = {
  DEFAULT_CONFIG,
  normalizeConfig,
  readConfig,
  writeConfig,
  getVersion,
  corsHeaders,
};
