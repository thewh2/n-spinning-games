import { getStore } from "@netlify/blobs";

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

export function normalizeConfig(config) {
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

export function getConfigStore() {
  return getStore(STORE_NAME);
}

export async function readConfig() {
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
    console.error("Error reading config:", e.message || e);
    throw e;
  }
  return normalizeConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
}

export async function writeConfig(config) {
  const store = getConfigStore();
  await store.set(CONFIG_KEY, JSON.stringify(config));
  const current = await getVersion();
  await store.set(VERSION_KEY, String(current + 1));
}

export async function getVersion() {
  try {
    const store = getConfigStore();
    const version = await store.get(VERSION_KEY);
    return version ? Number(version) : 0;
  } catch (e) {
    return 0;
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export function corsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export { DEFAULT_CONFIG };
