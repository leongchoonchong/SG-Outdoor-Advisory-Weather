import React, { useState, useEffect, useCallback } from 'react';
import { SingaporeWeatherPayload } from './types/weather';
import { SINGAPORE_VENUES, SingaporeVenue } from './data/singaporeVenues';
import { calculateActivityAdvisories } from './utils/activityAdvisory';
import { TopNav } from './components/TopNav';
import { HeroSummary } from './components/HeroSummary';
import { ActivityAdvisorySection } from './components/ActivityAdvisorySection';
import { HourlyTimeline } from './components/HourlyTimeline';
import { VenueExplorer } from './components/VenueExplorer';
import { AirQualityDeepDive } from './components/AirQualityDeepDive';
import { AiAdvisorPanel } from './components/AiAdvisorPanel';
import { Footer } from './components/Footer';
import { ApiStatusModal } from './components/ApiStatusModal';
import { Loader2, AlertCircle } from 'lucide-react';

const GENERATED_IMAGES = {
  running: '/src/assets/images/outdoor_running_ecp_1794324296551.jpg',
  hiking: '/src/assets/images/outdoor_hiking_macritchie_1794324293234.jpg',
  cycling: '/src/assets/images/outdoor_cycling_pcn_1794324294823.jpg',
};

export default function App() {
  const [weather, setWeather] = useState<SingaporeWeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<SingaporeVenue>(SINGAPORE_VENUES[0]);
  const [consultActivity, setConsultActivity] = useState<string>('Endurance Running');
  const [isApiStatusOpen, setIsApiStatusOpen] = useState(false);

  const fetchWeatherData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const response = await fetch('/api/weather/realtime');
      if (!response.ok) {
        throw new Error(`Weather telemetry failed (${response.status})`);
      }
      const data: SingaporeWeatherPayload = await response.json();
      setWeather(data);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch Singapore weather data');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData();

    // Auto-refresh every 3 minutes
    const interval = setInterval(() => {
      fetchWeatherData();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  const handleOpenAiConsult = (activityName: string) => {
    setConsultActivity(activityName);
    const element = document.getElementById('ai-advisor');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight text-white">
          Fetching Singapore Weather & Air Quality Telemetry
        </h2>
        <p className="mt-2 text-xs text-slate-400 max-w-sm text-center">
          Connecting to Singapore National Environment Agency (NEA) stations and computing real-time WBGT heat stress indexes...
        </p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Unable to Load Telemetry</h2>
          <p className="text-xs text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => fetchWeatherData(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Safety fallback if weather payload was somehow null
  const currentPayload = weather!;
  const advisories = calculateActivityAdvisories(
    currentPayload.current,
    currentPayload.airQuality,
    GENERATED_IMAGES
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <TopNav
        onRefresh={() => fetchWeatherData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={currentPayload.timestamp}
        onOpenApiStatus={() => setIsApiStatusOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {/* Real-time Hero Weather Summary & Heat Index */}
        <HeroSummary
          weather={currentPayload}
          selectedVenue={selectedVenue}
          onSelectVenue={setSelectedVenue}
        />

        {/* Outdoor Activity Advisories Grid with Sports Science Metrics */}
        <ActivityAdvisorySection
          advisories={advisories}
          onOpenAiConsult={handleOpenAiConsult}
        />

        {/* 24-Hour Diurnal Heat Timeline */}
        <HourlyTimeline hourly={currentPayload.hourlyForecast} />

        {/* Singapore Venues & Micro-climates Explorer */}
        <VenueExplorer
          selectedVenue={selectedVenue}
          onSelectVenue={setSelectedVenue}
          areaForecasts={currentPayload.areaForecasts}
        />

        {/* Regional Air Quality (PSI & PM2.5) & Health Advisory Matrix */}
        <AirQualityDeepDive airQuality={currentPayload.airQuality} />

        {/* AI Outdoor Activity Consultant (Gemini 3.8 Flash) */}
        <AiAdvisorPanel
          weather={currentPayload}
          defaultActivity={consultActivity}
        />
      </main>

      {/* Serverless Telemetry Diagnostics Modal */}
      <ApiStatusModal
        isOpen={isApiStatusOpen}
        onClose={() => setIsApiStatusOpen(false)}
      />

      {/* Quiet Footer */}
      <Footer />
    </div>
  );
}
