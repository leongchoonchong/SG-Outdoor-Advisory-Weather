import React, { useState } from 'react';
import { SingaporeWeatherPayload } from '../types/weather';
import { Thermometer, Droplets, Sun, Wind, CloudRain, AlertTriangle, CheckCircle, ShieldAlert, MapPin } from 'lucide-react';
import { SINGAPORE_VENUES, SingaporeVenue } from '../data/singaporeVenues';

interface HeroSummaryProps {
  weather: SingaporeWeatherPayload;
  selectedVenue: SingaporeVenue;
  onSelectVenue: (venue: SingaporeVenue) => void;
}

export const HeroSummary: React.FC<HeroSummaryProps> = ({
  weather,
  selectedVenue,
  onSelectVenue,
}) => {
  const { current, airQuality, areaForecasts, timestamp } = weather;

  // Find forecast matching the selected venue's area
  const matchedForecast = areaForecasts.find(
    (af) => af.area.toLowerCase().includes(selectedVenue.matchedArea.toLowerCase()) ||
            selectedVenue.matchedArea.toLowerCase().includes(af.area.toLowerCase())
  );

  const localCondition = matchedForecast?.forecast || current.generalForecast;

  // Heat Stress Level Badge Details
  const getHeatStressConfig = (level: 'Low' | 'Moderate' | 'High') => {
    switch (level) {
      case 'High':
        return {
          title: 'High Heat Stress (WBGT ≥ 33°C)',
          desc: 'High risk of heat exhaustion and heat stroke. Minimize strenuous physical activity outdoors. Take mandatory 15-min rest every 45 mins.',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
          indicator: 'text-rose-400',
          icon: ShieldAlert,
        };
      case 'Moderate':
        return {
          title: 'Moderate Heat Stress (WBGT 31°C - 33°C)',
          desc: 'Elevated thermal strain on the body. Scheduled hydration and regular shaded rest periods are required during prolonged exertion.',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          indicator: 'text-amber-400',
          icon: AlertTriangle,
        };
      case 'Low':
      default:
        return {
          title: 'Low Heat Stress (WBGT < 31°C)',
          desc: 'Safe thermal condition for outdoor activities. Maintain standard hydration routines and sun protection.',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          indicator: 'text-emerald-400',
          icon: CheckCircle,
        };
    }
  };

  const heatConfig = getHeatStressConfig(current.heatStressLevel);
  const HeatIcon = heatConfig.icon;

  // Air quality color config
  const getPsiColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'moderate':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'unhealthy':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      default:
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    }
  };

  return (
    <section id="overview" className="relative pt-6 pb-12 overflow-hidden">
      {/* Background Hero Banner with Measured Contrast Scrim */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/src/assets/images/hero_singapore_skyline_1794324295428.jpg"
          alt="Singapore Marina Bay tropical skyline"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 scale-105 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/95 to-slate-900" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Subtitle & Context Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-1">
              <span>National Environment Agency (NEA) Data</span>
              <span aria-hidden="true">·</span>
              <span>Live Meteorological Telemetry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
              Singapore Real-Time Heat Index & Outdoor Advisory
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl">
              Equatorial climate outdoor planning calibrated for high humidity, heat stress (WBGT), real-time 24-hr PSI air quality, and local 2-hour convective rainfall nowcasts.
            </p>
          </div>

          {/* Quick Venue Selector Dropdown */}
          <div className="shrink-0 bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 shadow-sm">
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspecting Venue / Park:</span>
            </label>
            <select
              value={selectedVenue.id}
              onChange={(e) => {
                const venue = SINGAPORE_VENUES.find((v) => v.id === e.target.value);
                if (venue) onSelectVenue(venue);
              }}
              aria-label="Select Singapore park or venue"
              className="bg-slate-900 text-sm font-semibold text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {SINGAPORE_VENUES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.region})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Metric Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Temperature & Heat Index */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                Air Temperature & Heat Index
              </span>
              <span className="font-mono tabular-nums text-slate-300">Islandwide Avg</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-white font-mono tabular-nums">
                {current.temp}°C
              </span>
              <div className="text-xs">
                <span className="text-slate-400 block">Feels Like</span>
                <span className="font-semibold text-amber-400 font-mono tabular-nums text-base">
                  {current.heatIndex}°C
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span>WBGT (Wet Bulb Globe):</span>
              <span className="font-semibold font-mono tabular-nums text-amber-300">
                {current.wbgt}°C
              </span>
            </div>
          </div>

          {/* Card 2: Heat Stress Advisory */}
          <div className={`border rounded-2xl p-5 backdrop-blur-sm ${heatConfig.bg}`}>
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="flex items-center gap-1.5 font-semibold">
                <HeatIcon className={`w-4 h-4 ${heatConfig.indicator}`} />
                NEA Heat Stress Level
              </span>
              <span className="font-bold uppercase tracking-wider">{current.heatStressLevel}</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {current.heatStressLevel} Heat Stress
            </div>
            <p className="mt-2 text-xs leading-relaxed opacity-90">
              {heatConfig.desc}
            </p>
          </div>

          {/* Card 3: Air Quality (PSI & PM2.5) */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-400" />
                Air Quality (PSI & PM2.5)
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getPsiColor(airQuality.psi.status)}`}>
                {airQuality.psi.status}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-white font-mono tabular-nums">
                {airQuality.psi.overall}
              </span>
              <div className="text-xs">
                <span className="text-slate-400 block">24-hr PSI</span>
                <span className="font-mono tabular-nums text-cyan-300 text-sm">
                  PM2.5: {airQuality.pm25.oneHourly} {airQuality.pm25.unit}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
              <span>National 1-hr PM2.5:</span>
              <span className="font-mono tabular-nums text-slate-200">
                {airQuality.pm25.status} Band
              </span>
            </div>
          </div>

          {/* Card 4: Humidity & UV Index */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-400" />
                Relative Humidity & UV
              </span>
              <span className="font-mono tabular-nums text-slate-300">Equatorial</span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-4xl font-extrabold text-white font-mono tabular-nums">
                  {current.rh}%
                </span>
                <span className="text-slate-400 text-xs block mt-0.5">Humidity</span>
              </div>
              <div className="border-l border-slate-700/80 pl-4">
                <div className="flex items-center gap-1">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
                    {current.uvIndex}
                  </span>
                </div>
                <span className="text-slate-400 text-xs block mt-0.5">
                  {current.uvIndex >= 11 ? 'Extreme' : current.uvIndex >= 8 ? 'Very High' : current.uvIndex >= 6 ? 'High' : 'Moderate'} UV
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
              {current.rh > 80 ? 'Heavy moisture suppresses sweat evaporation rate.' : 'Standard tropical vapor pressure.'}
            </div>
          </div>
        </div>

        {/* Selected Venue Context Banner */}
        <div className="bg-gradient-to-r from-slate-800/90 to-slate-800/60 border border-slate-700/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-cyan-400 font-medium">{selectedVenue.name}</span>
                <span aria-hidden="true">·</span>
                <span>Town Nowcast: {selectedVenue.matchedArea}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedVenue.region} Region</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Current Local Weather: {localCondition}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {selectedVenue.tips}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/60">
            <div className="text-right text-xs">
              <span className="text-slate-400 block">Covered Shelters:</span>
              <span className="text-emerald-400 font-semibold">{selectedVenue.hasCoveredShelters ? 'Available on trail' : 'Limited'}</span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-right text-xs">
              <span className="text-slate-400 block">Water Refills:</span>
              <span className="text-emerald-400 font-semibold">{selectedVenue.hasWaterRefills ? 'Potable taps active' : 'None on-site'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
