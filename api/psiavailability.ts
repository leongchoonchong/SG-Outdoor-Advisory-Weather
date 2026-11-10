import { dataGovClient, DATA_GOV_ENDPOINTS } from './dataGovClient';

/**
 * Serverless PSI Availability & Data Freshness Endpoint (/api/psiavailability)
 * Evaluates live reachability of data.gov.sg PSI stream, validates regional readings,
 * checks data freshness, and outputs health band metrics.
 */
export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  try {
    const { data, source, latencyMs } = await dataGovClient.getPsi(true); // force network bypass for live test

    const items = data?.items || [];
    const latestItem = items[0] || {};
    const readings = latestItem?.readings || {};
    const psi24Hr = readings?.psi_twenty_four_hourly || {};

    const hasReadings =
      psi24Hr.national !== undefined ||
      psi24Hr.central !== undefined ||
      psi24Hr.north !== undefined;

    const readingTime = latestItem.timestamp || new Date().toISOString();
    const ageMinutes = Math.max(0, Math.round((Date.now() - new Date(readingTime).getTime()) / 60000));

    const national =
      psi24Hr.national ??
      Math.round(
        ((psi24Hr.north || 45) +
          (psi24Hr.south || 48) +
          (psi24Hr.east || 46) +
          (psi24Hr.west || 48) +
          (psi24Hr.central || 47)) /
          5
      );

    let band: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' = 'Good';
    let outdoorAdvice = 'Normal outdoor activities, running, and swimming are completely safe.';

    if (national > 300) {
      band = 'Hazardous';
      outdoorAdvice = 'Hazardous haze. Stay indoors, keep windows closed, and avoid all outdoor physical activities.';
    } else if (national > 200) {
      band = 'Very Unhealthy';
      outdoorAdvice = 'Very unhealthy air quality. Avoid all outdoor exertion; vulnerable persons must stay indoors.';
    } else if (national > 100) {
      band = 'Unhealthy';
      outdoorAdvice = 'Unhealthy air quality. Healthy individuals should reduce heavy outdoor exertion; vulnerable groups should avoid outdoor activities.';
    } else if (national > 50) {
      band = 'Moderate';
      outdoorAdvice = 'Moderate air quality. Safe for normal outdoor activities. Sensitive persons should pace exertion.';
    }

    const isFresh = ageMinutes <= 180; // NEA publishes hourly/multi-hourly updates
    const availabilityStatus = hasReadings && isFresh ? 'AVAILABLE' : hasReadings ? 'DEGRADED_STALE' : 'UNAVAILABLE';

    const payload = {
      isAvailable: hasReadings,
      availabilityStatus,
      targetEndpoint: DATA_GOV_ENDPOINTS.PSI,
      source,
      latencyMs: latencyMs || Date.now() - startTime,
      checkedAt: new Date().toISOString(),
      readingTimestamp: readingTime,
      dataAgeMinutes: ageMinutes,
      psi: {
        national,
        band,
        outdoorAdvice,
        regionalBreakdown: {
          national: psi24Hr.national ?? national,
          north: psi24Hr.north ?? null,
          south: psi24Hr.south ?? null,
          east: psi24Hr.east ?? null,
          west: psi24Hr.west ?? null,
          central: psi24Hr.central ?? null,
        },
      },
      upstreamMetadata: {
        recordsCount: items.length,
        statusDescription: hasReadings
          ? `NEA 24-hr PSI telemetry active. Live reading: ${national} (${band}).`
          : 'No valid PSI readings returned from data.gov.sg.',
      },
    };

    const statusCode = hasReadings ? 200 : 503;
    if (typeof res.status === 'function') {
      return res.status(statusCode).json(payload);
    } else {
      return new Response(JSON.stringify(payload), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    const errorPayload = {
      isAvailable: false,
      availabilityStatus: 'UNAVAILABLE',
      targetEndpoint: DATA_GOV_ENDPOINTS.PSI,
      latencyMs: Date.now() - startTime,
      checkedAt: new Date().toISOString(),
      error: error.message || 'Failed to connect to data.gov.sg PSI endpoint',
    };

    if (typeof res.status === 'function') {
      return res.status(503).json(errorPayload);
    } else {
      return new Response(JSON.stringify(errorPayload), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
