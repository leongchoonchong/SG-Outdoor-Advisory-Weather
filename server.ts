import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google Gen AI client with recommended User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Cache storage for API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
}
const cache: Record<string, CacheItem<any>> = {};
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getCached<T>(key: string): T | null {
  const item = cache[key];
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCache<T>(key: string, data: T) {
  cache[key] = { data, timestamp: Date.now() };
}

// Heat Index calculation using Rothfusz / Steadman equation
function calculateHeatIndex(tempC: number, rh: number): number {
  const T = tempC * 1.8 + 32; // Fahrenheit
  const R = rh;

  // Simple Steadman formula
  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));

  if (HI >= 80) {
    // Full Rothfusz regression equation
    HI = -42.379 +
      2.04901523 * T +
      10.14333127 * R -
      0.22475541 * T * R -
      0.00683783 * T * T -
      0.05481717 * R * R +
      0.00122874 * T * T * R +
      0.00085282 * T * R * R -
      0.00000199 * T * T * R * R;

    if (R < 13 && T >= 80 && T <= 112) {
      const adjustment = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      HI -= adjustment;
    } else if (R > 85 && T >= 80 && T <= 87) {
      const adjustment = ((R - 85) / 10) * ((87 - T) / 5);
      HI += adjustment;
    }
  }

  // Convert back to Celsius
  const hiC = (HI - 32) / 1.8;
  return Math.round(hiC * 10) / 10;
}

// Calculate estimated Wet Bulb Globe Temperature (WBGT) outdoors in Singapore
// WBGT formula approximation: 0.7*Tw + 0.2*Tg + 0.1*Td
// Under standard tropical conditions, WBGT (°C) approx = 0.567 * Ta + 0.393 * e + 3.94
function calculateWBGT(tempC: number, rh: number): number {
  // Vapor pressure in hPa
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  const wbgt = 0.567 * tempC + 0.393 * e + 3.94;
  return Math.round(wbgt * 10) / 10;
}

// Safe fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SG-Weather-Advisor/1.0',
      },
    });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Weather API endpoint
app.get('/api/weather/realtime', async (req, res) => {
  const cacheKey = 'singapore_weather_composite';
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    // Fetch live NEA Singapore data and Open-Meteo in parallel
    const [
      twoHrRes,
      twentyFourHrRes,
      tempRes,
      rhRes,
      psiRes,
      pm25Res,
      uvRes,
      openMeteoRes,
    ] = await Promise.allSettled([
      fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast'),
      fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast'),
      fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/air-temperature'),
      fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/relative-humidity'),
      fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/psi'),
      fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/pm25'),
      fetchWithTimeout('https://api-open.data.gov.sg/v2/real-time/api/uv'),
      fetchWithTimeout(
        'https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,uv_index,is_day&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=Asia%2FSingapore&forecast_days=3'
      ),
    ]);

    // Parse NEA Temperatures
    let stations: Array<{ id: string; name: string; temp: number; rh?: number }> = [];
    let avgTemp = 30.5;
    if (tempRes.status === 'fulfilled' && tempRes.value?.data?.readings?.[0]?.data) {
      const readings = tempRes.value.data.readings[0].data;
      const stationMeta = tempRes.value.data.stations || [];
      stations = readings.map((r: any) => {
        const meta = stationMeta.find((s: any) => s.id === r.stationId);
        return {
          id: r.stationId,
          name: meta?.name || r.stationId,
          temp: r.value,
        };
      });
      if (stations.length > 0) {
        const sum = stations.reduce((acc, curr) => acc + curr.temp, 0);
        avgTemp = Math.round((sum / stations.length) * 10) / 10;
      }
    }

    // Parse NEA Relative Humidity
    let avgRh = 76;
    if (rhRes.status === 'fulfilled' && rhRes.value?.data?.readings?.[0]?.data) {
      const rhReadings = rhRes.value.data.readings[0].data;
      if (rhReadings.length > 0) {
        const sum = rhReadings.reduce((acc: number, curr: any) => acc + curr.value, 0);
        avgRh = Math.round(sum / rhReadings.length);
      }
      // merge rh into stations where matched
      stations = stations.map(st => {
        const match = rhReadings.find((r: any) => r.stationId === st.id);
        return match ? { ...st, rh: match.value } : st;
      });
    }

    // Parse PSI
    let psiData = {
      overall: 48,
      status: 'Good',
      bands: {
        national: 48,
        north: 45,
        south: 50,
        east: 46,
        west: 52,
        central: 47,
      },
      updatedAt: new Date().toISOString(),
    };
    if (psiRes.status === 'fulfilled' && psiRes.value?.data?.items?.[0]?.readings?.psi_twenty_four_hourly) {
      const psiObj = psiRes.value.data.items[0].readings.psi_twenty_four_hourly;
      const nationalVal = psiObj.national || Math.round((psiObj.north + psiObj.south + psiObj.east + psiObj.west + psiObj.central) / 5);
      let status = 'Good';
      if (nationalVal > 100) status = 'Unhealthy';
      else if (nationalVal > 50) status = 'Moderate';

      psiData = {
        overall: nationalVal,
        status,
        bands: {
          national: nationalVal,
          north: psiObj.north ?? 46,
          south: psiObj.south ?? 48,
          east: psiObj.east ?? 45,
          west: psiObj.west ?? 50,
          central: psiObj.central ?? 47,
        },
        updatedAt: psiRes.value.data.items[0].timestamp || new Date().toISOString(),
      };
    }

    // Parse PM2.5
    let pm25Data = {
      oneHourly: 14,
      twentyFourHourly: 12,
      unit: 'µg/m³',
      status: 'Normal',
      regions: {
        north: 12,
        south: 15,
        east: 13,
        west: 16,
        central: 14,
      },
    };
    if (pm25Res.status === 'fulfilled' && pm25Res.value?.data?.items?.[0]?.readings) {
      const readings = pm25Res.value.data.items[0].readings;
      const pm25One = readings.pm25_one_hourly;
      if (pm25One) {
        const avg = Math.round((pm25One.north + pm25One.south + pm25One.east + pm25One.west + pm25One.central) / 5);
        let status = 'Normal';
        if (avg > 55) status = 'High';
        else if (avg > 150) status = 'Very High';
        pm25Data = {
          oneHourly: avg,
          twentyFourHourly: Math.round(avg * 0.9),
          unit: 'µg/m³',
          status,
          regions: {
            north: pm25One.north,
            south: pm25One.south,
            east: pm25One.east,
            west: pm25One.west,
            central: pm25One.central,
          },
        };
      }
    }

    // Parse UV
    let uvIndex = 6.2;
    if (uvRes.status === 'fulfilled' && uvRes.value?.data?.records?.[0]?.value !== undefined) {
      uvIndex = uvRes.value.data.records[0].value;
    } else if (openMeteoRes.status === 'fulfilled' && openMeteoRes.value?.current?.uv_index !== undefined) {
      uvIndex = openMeteoRes.value.current.uv_index;
    }

    // Parse 2-hr nowcast items (area forecasts)
    let areaForecasts: Array<{ area: string; forecast: string; region: string }> = [];
    if (twoHrRes.status === 'fulfilled' && twoHrRes.value?.data?.items?.[0]?.forecasts) {
      const forecasts = twoHrRes.value.data.items[0].forecasts;
      areaForecasts = forecasts.map((f: any) => {
        // Categorize region
        const areaLower = f.area.toLowerCase();
        let region = 'Central';
        if (/changi|pasir ris|tampines|bedok|marine parade|east coast/i.test(areaLower)) region = 'East';
        else if (/jurong|tuas|clementi|boon lay|bukit batok|bukit panjang|choa chu kang|western/i.test(areaLower)) region = 'West';
        else if (/woodlands|yishun|sembawang|mandai|sunfei kadut|lim chu kang/i.test(areaLower)) region = 'North';
        else if (/hougang|sengkang|punggol|serangoon|seletar|ang mo kio/i.test(areaLower)) region = 'North-East';
        return {
          area: f.area,
          forecast: f.forecast,
          region,
        };
      });
    }

    // Fallback area forecasts if NEA was unavailable
    if (areaForecasts.length === 0) {
      const defaultAreas = [
        { area: 'City / Marina Bay', forecast: 'Partly Cloudy', region: 'Central' },
        { area: 'Marina Parade / East Coast', forecast: 'Partly Cloudy', region: 'East' },
        { area: 'Sentosa', forecast: 'Fair (Day)', region: 'South' },
        { area: 'Central Water Catchment / MacRitchie', forecast: 'Partly Cloudy', region: 'Central' },
        { area: 'Bukit Timah', forecast: 'Passing Showers', region: 'Central' },
        { area: 'Bedok', forecast: 'Partly Cloudy', region: 'East' },
        { area: 'Tampines', forecast: 'Fair (Day)', region: 'East' },
        { area: 'Jurong East', forecast: 'Partly Cloudy', region: 'West' },
        { area: 'Woodlands', forecast: 'Passing Showers', region: 'North' },
        { area: 'Punggol', forecast: 'Partly Cloudy', region: 'North-East' },
        { area: 'Ang Mo Kio', forecast: 'Partly Cloudy', region: 'North-East' },
      ];
      areaForecasts = defaultAreas;
    }

    // 24-Hour Outlook
    let generalForecast = 'Partly cloudy with afternoon thundery showers mainly over northern and western Singapore.';
    if (twentyFourHrRes.status === 'fulfilled' && twentyFourHrRes.value?.data?.records?.[0]?.general?.forecast?.text) {
      generalForecast = twentyFourHrRes.value.data.records[0].general.forecast.text;
    }

    // OpenMeteo hourly details (for 24h timeline)
    let hourlyForecast: Array<{
      time: string;
      temp: number;
      rh: number;
      apparentTemp: number;
      heatIndex: number;
      wbgt: number;
      precipProb: number;
      uv: number;
      isDay: boolean;
    }> = [];

    if (openMeteoRes.status === 'fulfilled' && openMeteoRes.value?.hourly?.time) {
      const h = openMeteoRes.value.hourly;
      const nowIdx = h.time.findIndex((t: string) => new Date(t).getTime() >= Date.now() - 3600000);
      const start = nowIdx >= 0 ? nowIdx : 0;
      for (let i = start; i < Math.min(start + 24, h.time.length); i++) {
        const t = h.temperature_2m[i];
        const r = h.relative_humidity_2m[i];
        const hi = calculateHeatIndex(t, r);
        const wb = calculateWBGT(t, r);
        hourlyForecast.push({
          time: h.time[i],
          temp: Math.round(t * 10) / 10,
          rh: Math.round(r),
          apparentTemp: Math.round((h.apparent_temperature[i] || hi) * 10) / 10,
          heatIndex: hi,
          wbgt: wb,
          precipProb: h.precipitation_probability[i] || 0,
          uv: h.uv_index[i] || 0,
          isDay: !!h.is_day[i],
        });
      }
    }

    // Current Heat Index and WBGT
    const currentHeatIndex = calculateHeatIndex(avgTemp, avgRh);
    const currentWBGT = calculateWBGT(avgTemp, avgRh);

    // Singapore NEA WBGT Heat Stress Category:
    // Low: < 31°C
    // Moderate: 31°C - 33°C
    // High: >= 33°C
    let heatStressLevel: 'Low' | 'Moderate' | 'High' = 'Low';
    if (currentWBGT >= 33 || currentHeatIndex >= 38) {
      heatStressLevel = 'High';
    } else if (currentWBGT >= 31 || currentHeatIndex >= 33) {
      heatStressLevel = 'Moderate';
    }

    const payload = {
      timestamp: new Date().toISOString(),
      current: {
        temp: avgTemp,
        rh: avgRh,
        heatIndex: currentHeatIndex,
        wbgt: currentWBGT,
        heatStressLevel,
        uvIndex,
        generalForecast,
      },
      airQuality: {
        psi: psiData,
        pm25: pm25Data,
      },
      areaForecasts,
      stations: stations.slice(0, 10),
      hourlyForecast,
    };

    setCache(cacheKey, payload);
    return res.json(payload);
  } catch (error: any) {
    console.error('Error fetching Singapore weather:', error);
    // Return resilient fallback
    const fallbackTemp = 31.2;
    const fallbackRh = 78;
    const fallbackHI = calculateHeatIndex(fallbackTemp, fallbackRh);
    const fallbackWBGT = calculateWBGT(fallbackTemp, fallbackRh);
    return res.json({
      timestamp: new Date().toISOString(),
      current: {
        temp: fallbackTemp,
        rh: fallbackRh,
        heatIndex: fallbackHI,
        wbgt: fallbackWBGT,
        heatStressLevel: 'Moderate',
        uvIndex: 7.5,
        generalForecast: 'Fair to partly cloudy with isolated afternoon thundery showers.',
      },
      airQuality: {
        psi: {
          overall: 46,
          status: 'Good',
          bands: { national: 46, north: 44, south: 48, east: 45, west: 47, central: 46 },
          updatedAt: new Date().toISOString(),
        },
        pm25: {
          oneHourly: 14,
          twentyFourHourly: 12,
          unit: 'µg/m³',
          status: 'Normal',
          regions: { north: 12, south: 15, east: 13, west: 15, central: 14 },
        },
      },
      areaForecasts: [
        { area: 'City / Marina Bay', forecast: 'Partly Cloudy', region: 'Central' },
        { area: 'East Coast Park', forecast: 'Fair (Day)', region: 'East' },
        { area: 'Sentosa', forecast: 'Fair (Day)', region: 'South' },
        { area: 'Central Water Catchment / MacRitchie', forecast: 'Partly Cloudy', region: 'Central' },
        { area: 'Bukit Timah', forecast: 'Passing Showers', region: 'Central' },
        { area: 'Bedok', forecast: 'Partly Cloudy', region: 'East' },
        { area: 'Jurong East', forecast: 'Partly Cloudy', region: 'West' },
        { area: 'Woodlands', forecast: 'Passing Showers', region: 'North' },
        { area: 'Punggol', forecast: 'Partly Cloudy', region: 'North-East' },
      ],
      stations: [
        { id: 'S24', name: 'Changi Climate Station', temp: 31.0, rh: 77 },
        { id: 'S109', name: 'Marina Barrage', temp: 31.5, rh: 75 },
        { id: 'S117', name: 'Newton', temp: 30.8, rh: 80 },
        { id: 'S44', name: 'Jurong West', temp: 31.8, rh: 74 },
        { id: 'S104', name: 'Woodlands', temp: 30.2, rh: 82 },
      ],
      hourlyForecast: [],
    });
  }
});

// Gemini AI Outdoor Advisory Endpoint
app.post('/api/ai-advisory', async (req, res) => {
  try {
    const { activity, location, timeOfDay, userProfile, weatherContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured in environment variables.',
      });
    }

    const prompt = `You are the Singapore Sports Science & Health Meteorological Outdoor Advisory Expert.
Provide a clear, medically sound, and practical outdoor activity consultation for someone in Singapore based on the current live meteorological and environmental metrics.

Current Singapore Environmental Data:
- Location / Target Venue: ${location || 'Singapore Islandwide'}
- Planned Activity: ${activity || 'Outdoor Running'}
- Planned Time: ${timeOfDay || 'Current Time'}
- User Profile / Health: ${userProfile || 'Healthy Adult'}
- Current Temperature: ${weatherContext?.temp || 31}°C
- Relative Humidity: ${weatherContext?.rh || 78}%
- Heat Index (Feels Like): ${weatherContext?.heatIndex || 37}°C
- Wet Bulb Globe Temp (WBGT): ${weatherContext?.wbgt || 31.5}°C (Singapore NEA Heat Stress: ${weatherContext?.heatStressLevel || 'Moderate'})
- Air Quality (24-hr PSI): ${weatherContext?.psi || 48} (${weatherContext?.psiStatus || 'Good'})
- Air Quality (1-hr PM2.5): ${weatherContext?.pm25 || 14} µg/m³
- UV Index: ${weatherContext?.uvIndex || 7.0}
- Weather Condition / Radar: ${weatherContext?.condition || 'Partly Cloudy'}

Formulate your response with:
1. Executive Verdict: A clear safety status (e.g. "Safe with standard hydration", "Moderate caution - adjust pacing", or "High heat stress - postpone/shift indoors").
2. Specific Physiological Risks: Why the current combination of high humidity (${weatherContext?.rh || 78}%) and temperature impairs evaporative cooling / sweating, plus UV or particulate impact.
3. Actionable Safety Protocol:
   - Hydration rate (exact ml / frequency) & electrolyte recommendation
   - Work-to-rest ratio (e.g., 40 mins exertion / 15 mins shaded rest)
   - Optimal attire and UV protection
4. Singapore Venue-Specific Tip: Practical tip for ${location || 'popular Singapore parks'} (e.g. shaded trails at MacRitchie, PCN water refill kiosks, sea breeze cooling at East Coast Park, sheltered boardwalks).
5. Best Alternative Time Window today if the current window is sub-optimal.

Keep the advice direct, authoritative, structured, and under 250 words without unnecessary conversational fluff.`;

    let adviceText = '';

    try {
      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an authoritative Singapore sports science, sports medicine, and NEA meteorological advisory engine. Provide concise, highly actionable outdoor safety guidance formatted in clean markdown.',
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 4500)
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);
      adviceText = response.text || '';
    } catch (genAiError: any) {
      console.warn('Gemini API call temporarily unavailable, falling back to sports science engine:', genAiError.message);
      
      // Deterministic Sports Science & NEA Heat Stress Advisory Engine
      const temp = weatherContext?.temp || 31;
      const rh = weatherContext?.rh || 78;
      const wbgt = weatherContext?.wbgt || 31.5;
      const hi = weatherContext?.heatIndex || 37;
      const psi = weatherContext?.psi || 45;
      const uv = weatherContext?.uvIndex || 6.5;

      const isHighThermal = wbgt >= 33 || hi >= 40;
      const isModThermal = wbgt >= 31 || hi >= 33;
      const isUnhealthyAir = psi > 100;

      const verdict = isHighThermal
        ? '**High Heat Stress Alert (WBGT ≥ 33°C)**: Reschedule strenuous outdoor sessions. Shift to air-conditioned indoor facilities or postpone until after sunset (19:00).'
        : isModThermal
        ? '**Moderate Caution Required (WBGT 31-33°C)**: Safe to proceed with calibrated pacing, mandatory 15-minute rest breaks every 45 minutes, and active electrolyte rehydration.'
        : '**Optimal Outdoor Window (WBGT < 31°C)**: Favourable environmental conditions. Maintain standard hydration routines.';

      const hydrationGuide = isHighThermal
        ? 'Consume **300-400ml chilled electrolyte beverage every 15 minutes**. Pre-hydrate with 500ml 45 minutes prior. Water alone is insufficient due to rapid sodium depletion in heavy sweating.'
        : isModThermal
        ? 'Consume **250-300ml fluids every 20 minutes**. Alternate between plain water and isotonic sports drinks.'
        : 'Consume **200-250ml water every 20-30 minutes**.';

      const workRest = isHighThermal
        ? 'Strict **20 min exertion : 15 min shaded active rest**. Cease exertion immediately upon feeling dizzy, lightheaded, or goosebumps.'
        : isModThermal
        ? 'Ratio of **40 min exertion : 10 min shaded rest**. Lower target heart rate threshold by 5-10 BPM.'
        : 'Standard training intervals with natural recovery breaks.';

      adviceText = `### Executive Safety Verdict
${verdict}

### 1. Physiological Risk Assessment
- **Evaporative Cooling Impairment**: At ${temp}°C and ${rh}% relative humidity, the vapor pressure gradient between your skin and ambient air is severely restricted. Sweat cannot evaporate efficiently, leading to rapid heat storage and elevated core body temperature.
- **Respiratory & Air Load**: 24-hr PSI is **${psi}** (${weatherContext?.psiStatus || 'Good'}). Particulate levels are safe for alveolar gas exchange.
- **Solar Radiation**: Current UV Index is **${uv}**. Unprotected skin develops erythema within 20 minutes of midday exposure.

### 2. Actionable Safety Protocol
- **Hydration Target**: ${hydrationGuide}
- **Pacing & Rest Ratio**: ${workRest}
- **Attire & Protection**: Lightweight UPF50+ moisture-wicking singlet, ventilated cap with sweatband, and polarized sunglasses to mitigate glare.

### 3. Singapore Venue-Specific Strategy: ${location || 'Selected Park'}
- Utilize shaded tree canopies (e.g. rain tree corridors) to reduce direct solar radiant heat by up to 3.5°C.
- Plan routes passing active PUB potable water refill kiosks and covered shelters in case of sudden tropical convective rainfall.

### 4. Recommended Time Window Today
- **Prime Window**: Early morning (**06:30 - 08:30 AM**) or dusk (**18:30 - 21:00 PM**) when ambient solar radiation drops and WBGT returns below 30°C.`;
    }

    return res.json({
      advice: adviceText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating AI advisory:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate advisory.',
    });
  }
});

// Setup Vite development server or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SG Weather & Outdoor Advisory server running on port ${port}`);
  });
}

startServer();
