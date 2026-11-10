import { DATA_GOV_ENDPOINTS } from './dataGovClient';

/**
 * Serverless Health Check Endpoint (/api/health)
 * Reports system status, server uptime, and data.gov.sg upstream network connectivity.
 */
export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  let govSgReachable = false;
  let govSgLatencyMs = 0;
  let errorDetail: string | null = null;

  try {
    const pingStart = Date.now();
    const probeRes = await fetch(DATA_GOV_ENDPOINTS.AIR_TEMPERATURE, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    govSgLatencyMs = Date.now() - pingStart;
    govSgReachable = probeRes.ok;
  } catch (err: any) {
    errorDetail = err.message || 'Upstream probe failed';
    govSgReachable = false;
  }

  const payload = {
    status: govSgReachable ? 'healthy' : 'degraded',
    service: 'sg-outdoor-advisory-weather-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    executionTimeMs: Date.now() - startTime,
    upstream: {
      provider: 'data.gov.sg (v2 real-time)',
      host: 'api-open.data.gov.sg',
      reachable: govSgReachable,
      latencyMs: govSgLatencyMs,
      error: errorDetail,
      monitoredEndpointsCount: Object.keys(DATA_GOV_ENDPOINTS).length,
      endpoints: DATA_GOV_ENDPOINTS,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };

  const statusCode = govSgReachable ? 200 : 503;
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(payload);
  } else {
    // If running in raw Web Request/Response environment
    return new Response(JSON.stringify(payload), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
