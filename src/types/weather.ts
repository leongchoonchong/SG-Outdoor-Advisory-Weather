export interface StationData {
  id: string;
  name: string;
  temp: number;
  rh?: number;
}

export interface AreaForecast {
  area: string;
  forecast: string;
  region: string;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  rh: number;
  apparentTemp: number;
  heatIndex: number;
  wbgt: number;
  precipProb: number;
  uv: number;
  isDay: boolean;
}

export interface AirQualityData {
  psi: {
    overall: number;
    status: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | string;
    bands: {
      national: number;
      north: number;
      south: number;
      east: number;
      west: number;
      central: number;
    };
    updatedAt: string;
  };
  pm25: {
    oneHourly: number;
    twentyFourHourly: number;
    unit: string;
    status: 'Normal' | 'Elevated' | 'High' | 'Very High' | string;
    regions: {
      north: number;
      south: number;
      east: number;
      west: number;
      central: number;
    };
  };
}

export interface CurrentWeatherData {
  temp: number;
  rh: number;
  heatIndex: number;
  wbgt: number;
  heatStressLevel: 'Low' | 'Moderate' | 'High';
  uvIndex: number;
  generalForecast: string;
}

export interface SingaporeWeatherPayload {
  timestamp: string;
  current: CurrentWeatherData;
  airQuality: AirQualityData;
  areaForecasts: AreaForecast[];
  stations: StationData[];
  hourlyForecast: HourlyForecastItem[];
}

export type ActivityType =
  | 'running'
  | 'cycling'
  | 'hiking'
  | 'water_sports'
  | 'court_sports'
  | 'family_outing'
  | 'senior_walking';

export interface ActivityAdvice {
  activityId: ActivityType;
  title: string;
  category: string;
  status: 'Optimal' | 'Caution' | 'Unfavourable';
  safetyScore: number; // 0-100
  summary: string;
  image?: string;
  hydrationPlan: string;
  workRestRatio: string;
  clothingTip: string;
  uvAdvice: string;
  airQualityImpact: string;
  heatStressImpact: string;
  bestHours: string;
  indoorAlternative: string;
}
