const { getStore } = require("@netlify/blobs");

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

function getConfigStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

async function readConfig() {
  try {
    const store = getConfigStore();
    const data = await store.get(CONFIG_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return normalizeConfig({ maxSpinsPerDay: 3, prizes: parsed });
      }
      return normalizeConfig(parsed);
    }
  } catch (e) {
    console.error("Error reading config from Blobs:", e.message || e);
  }
  // Return default config if nothing stored yet
  return normalizeConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
}

async function writeConfig(config) {
  try {
    const store = getConfigStore();
    await store.set(CONFIG_KEY, JSON.stringify(config));
    // Increment version counter
    await incrementVersion();
    return true;
  } catch (e) {
    console.error("Error writing config to Blobs:", e.message || e);
    return false;
  }
}

async function getVersion() {
  try {
    const store = getConfigStore();
    const version = await store.get(VERSION_KEY);
    return version ? Number(version) : 0;
  } catch (e) {
    console.error("Error getting version:", e.message || e);
    return 0;
  }
}

async function incrementVersion() {
  try {
    const store = getConfigStore();
    const current = await getVersion();
    await store.set(VERSION_KEY, String(current + 1));
  } catch (e) {
    console.error("Error incrementing version:", e.message || e);
  }
}

// Standard CORS headers for all API responses
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
