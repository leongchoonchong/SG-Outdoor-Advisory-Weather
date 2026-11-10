import { dataGovClient, DATA_GOV_ENDPOINTS, EndpointKey } from './dataGovClient';

/**
 * Higher-order helper for individual serverless endpoint handlers
 */
export function createEndpointHandler(fetcher: (bypass?: boolean) => Promise<{ data: any; source: string; latencyMs: number }>) {
  return async (req: any, res: any) => {
    const bypassCache = req?.query?.refresh === 'true';
    try {
      const result = await fetcher(bypassCache);
      if (typeof res.status === 'function') {
        return res.status(200).json(result);
      } else {
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error: any) {
      const errPayload = { error: error.message || 'Failed to fetch from data.gov.sg' };
      if (typeof res.status === 'function') {
        return res.status(502).json(errPayload);
      } else {
        return new Response(JSON.stringify(errPayload), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  };
}

export const twoHrForecastHandler = createEndpointHandler(dataGovClient.getTwoHrForecast);
export const twentyFourHrForecastHandler = createEndpointHandler(dataGovClient.getTwentyFourHrForecast);
export const fourDayOutlookHandler = createEndpointHandler(dataGovClient.getFourDayOutlook);
export const airTemperatureHandler = createEndpointHandler(dataGovClient.getAirTemperature);
export const rainfallHandler = createEndpointHandler(dataGovClient.getRainfall);
export const psiHandler = createEndpointHandler(dataGovClient.getPsi);
export const pm25Handler = createEndpointHandler(dataGovClient.getPm25);
export const uvHandler = createEndpointHandler(dataGovClient.getUv);
export const relativeHumidityHandler = createEndpointHandler(dataGovClient.getRelativeHumidity);
export const windSpeedHandler = createEndpointHandler(dataGovClient.getWindSpeed);
