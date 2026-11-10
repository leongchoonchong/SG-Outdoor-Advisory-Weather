/**
 * Serverless client for Data.gov.sg (v2 real-time environmental API endpoints)
 * Connects to keyless, live Singapore National Environment Agency (NEA) and MSS endpoints.
 */

export interface GovSgApiResponse<T = any> {
  code: number;
  data: T;
  errorMsg?: string;
}

export const DATA_GOV_ENDPOINTS = {
  TWO_HR_FORECAST: 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
  TWENTY_FOUR_HR_FORECAST: 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast',
  FOUR_DAY_OUTLOOK: 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook',
  AIR_TEMPERATURE: 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
  RAINFALL: 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
  PSI: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
  PM25: 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
  UV: 'https://api-open.data.gov.sg/v2/real-time/api/uv',
  RELATIVE_HUMIDITY: 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
  WIND_SPEED: 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed',
} as const;

export type EndpointKey = keyof typeof DATA_GOV_ENDPOINTS;

// In-memory cache for serverless invocation reuse
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 90 * 1000; // 90 seconds cache

/**
 * Fetch a single data.gov.sg v2 endpoint with timeout, caching, 429 backoff, and resilient fallbacks
 */
export async function fetchGovSgEndpoint<T = any>(
  endpointUrl: string,
  options?: { ttlMs?: number; bypassCache?: boolean; timeoutMs?: number; retryCount?: number }
): Promise<{ data: T; source: 'cache' | 'network' | 'fallback'; latencyMs: number }> {
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  const timeoutMs = options?.timeoutMs ?? 6000;
  const maxRetries = options?.retryCount ?? 1;

  if (!options?.bypassCache) {
    const cached = cache.get(endpointUrl);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return { data: cached.data, source: 'cache', latencyMs: 0 };
    }
  }

  const startTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpointUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SG-Weather-Outdoor-Advisory/2.0',
        },
      });
      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited by data.gov.sg
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
          continue;
        }
        // If we have any cached data (even stale), return it on 429
        const staleCached = cache.get(endpointUrl);
        if (staleCached) {
          return { data: staleCached.data, source: 'cache', latencyMs: Date.now() - startTime };
        }
      }

      if (!res.ok) {
        throw new Error(`Data.gov.sg endpoint returned HTTP ${res.status}: ${res.statusText}`);
      }

      const json = (await res.json()) as GovSgApiResponse<T>;
      const latencyMs = Date.now() - startTime;

      // Cache the unwrapped data
      const payload = json.data !== undefined ? json.data : (json as any);
      cache.set(endpointUrl, { data: payload, timestamp: Date.now() });

      return { data: payload, source: 'network', latencyMs };
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt < maxRetries && err.name !== 'AbortError') {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      // If cache has stale item, return stale rather than breaking
      const cached = cache.get(endpointUrl);
      if (cached) {
        return { data: cached.data, source: 'cache', latencyMs: Date.now() - startTime };
      }
      throw err;
    }
  }

  throw new Error(`Data.gov.sg request failed after retries: ${endpointUrl}`);
}

/**
 * Individual endpoint accessors
 */
export const dataGovClient = {
  // 1. Two-hour nowcast across 47 town areas
  getTwoHrForecast: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.TWO_HR_FORECAST, { bypassCache }),

  // 2. Twenty-four hour regional forecast
  getTwentyFourHrForecast: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.TWENTY_FOUR_HR_FORECAST, { bypassCache }),

  // 3. Four-day outlook
  getFourDayOutlook: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.FOUR_DAY_OUTLOOK, { bypassCache }),

  // 4. Air temperature stations
  getAirTemperature: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.AIR_TEMPERATURE, { bypassCache }),

  // 5. Rainfall stations
  getRainfall: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.RAINFALL, { bypassCache }),

  // 6. Pollutant Standards Index (PSI)
  getPsi: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.PSI, { bypassCache }),

  // 7. PM2.5 1-hr and 24-hr particulate
  getPm25: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.PM25, { bypassCache }),

  // 8. UV Index
  getUv: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.UV, { bypassCache }),

  // 9. Relative humidity stations
  getRelativeHumidity: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.RELATIVE_HUMIDITY, { bypassCache }),

  // 10. Wind speed stations
  getWindSpeed: (bypassCache = false) =>
    fetchGovSgEndpoint(DATA_GOV_ENDPOINTS.WIND_SPEED, { bypassCache }),

  // Batch query all 10 endpoints simultaneously
  getAllEndpoints: async (bypassCache = false) => {
    const keys = Object.keys(DATA_GOV_ENDPOINTS) as EndpointKey[];
    const results = await Promise.allSettled(
      keys.map(async (k) => {
        const res = await fetchGovSgEndpoint(DATA_GOV_ENDPOINTS[k], { bypassCache });
        return { key: k, url: DATA_GOV_ENDPOINTS[k], ...res };
      })
    );

    const successful: Record<string, any> = {};
    const failed: Record<string, string> = {};

    results.forEach((r, idx) => {
      const key = keys[idx];
      if (r.status === 'fulfilled') {
        successful[key] = r.value;
      } else {
        failed[key] = r.reason?.message || 'Failed to fetch';
      }
    });

    return {
      timestamp: new Date().toISOString(),
      successfulCount: Object.keys(successful).length,
      failedCount: Object.keys(failed).length,
      successful,
      failed,
    };
  },
};
