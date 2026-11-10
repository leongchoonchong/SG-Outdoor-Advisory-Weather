import React, { useState } from 'react';
import { HourlyForecastItem } from '../types/weather';
import { Sun, CloudRain, Thermometer, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

interface HourlyTimelineProps {
  hourly: HourlyForecastItem[];
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({ hourly }) => {
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);

  // If hourly array is empty or limited, provide fallback 24h tropical pattern
  const data = hourly && hourly.length > 0 ? hourly : Array.from({ length: 24 }).map((_, i) => {
    const hour = (new Date().getHours() + i) % 24;
    const isDay = hour >= 7 && hour <= 19;
    const temp = isDay ? (hour >= 12 && hour <= 15 ? 33.2 : 30.5) : 26.8;
    const rh = isDay ? (hour >= 12 && hour <= 15 ? 70 : 78) : 88;
    const hi = isDay ? (hour >= 12 && hour <= 15 ? 40.5 : 36.2) : 29.5;
    const wb = isDay ? (hour >= 12 && hour <= 15 ? 32.8 : 30.5) : 26.0;
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp,
      rh,
      apparentTemp: hi,
      heatIndex: hi,
      wbgt: wb,
      precipProb: hour >= 14 && hour <= 17 ? 65 : 20,
      uv: isDay ? (hour >= 11 && hour <= 15 ? 9.5 : 4.0) : 0,
      isDay,
    };
  });

  const selected = data[selectedHourIdx] || data[0];

  const formatHour = (isoOrTime: string) => {
    if (isoOrTime.includes('T')) {
      const d = new Date(isoOrTime);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return isoOrTime;
  };

  const getThermalRiskBadge = (wbgt: number, hi: number) => {
    if (wbgt >= 33 || hi >= 39) {
      return {
        label: 'High Heat Stress',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        advice: 'Avoid strenuous outdoor conditioning. Reschedule training.',
      };
    }
    if (wbgt >= 31 || hi >= 33) {
      return {
        label: 'Moderate Heat Stress',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        advice: 'Pace carefully with scheduled shade breaks and mandatory hydration.',
      };
    }
    return {
      label: 'Low Thermal Stress',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      advice: 'Optimal window for running, cycling, and sports training.',
    };
  };

  const currentRisk = getThermalRiskBadge(selected.wbgt, selected.heatIndex);

  return (
    <section id="timeline" className="py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-1">
              <span>Hourly Exercise Planning Window</span>
              <span aria-hidden="true">·</span>
              <span>24-Hour Diurnal Thermal Cycle</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Singapore 24h Heat Index & Rain Timeline
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Track diurnal temperature shifts, WBGT heat stress spikes, precipitation chances, and UV intensity to select safe outdoor training windows.
            </p>
          </div>

          {/* Quick Indicator Strip */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2 self-start md:self-auto">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Low Stress (&lt;31°C)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Moderate (31-33°C)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              High (≥33°C)
            </span>
          </div>
        </div>

        {/* Selected Hour Insight Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 mb-6 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {formatHour(selected.time)}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${currentRisk.color}`}>
                    {currentRisk.label}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {currentRisk.advice}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Air Temp:</span>
                <span className="text-base font-bold text-white font-mono tabular-nums">
                  {selected.temp}°C
                </span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Heat Index:</span>
                <span className="text-base font-bold text-amber-400 font-mono tabular-nums">
                  {selected.heatIndex}°C
                </span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Wet Bulb (WBGT):</span>
                <span className="text-base font-bold text-cyan-400 font-mono tabular-nums">
                  {selected.wbgt}°C
                </span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Rain Probability:</span>
                <span className="text-base font-bold text-blue-400 font-mono tabular-nums">
                  {selected.precipProb}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Hourly Timeline */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 overflow-x-auto">
          <div className="min-w-[840px] flex items-end gap-2.5 py-2">
            {data.slice(0, 24).map((item, idx) => {
              const isSelected = idx === selectedHourIdx;
              const isHighStress = item.wbgt >= 33 || item.heatIndex >= 39;
              const isModStress = item.wbgt >= 31 || item.heatIndex >= 33;

              // Bar height based on heat index (min 25C max 42C)
              const heightPercent = Math.max(20, Math.min(100, ((item.heatIndex - 24) / (42 - 24)) * 100));

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedHourIdx(idx)}
                  className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer group text-left ${
                    isSelected
                      ? 'bg-slate-700/90 border border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                      : 'hover:bg-slate-700/50 border border-transparent'
                  }`}
                >
                  {/* Heat Index value */}
                  <span className="text-[11px] font-bold font-mono tabular-nums mb-1 text-slate-200">
                    {item.heatIndex}°
                  </span>

                  {/* Visual Bar representation */}
                  <div className="w-full h-28 flex items-end justify-center py-1">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-4 rounded-t-md transition-all ${
                        isHighStress
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                          : isModStress
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                      } ${isSelected ? 'w-5 shadow-lg' : 'opacity-85 group-hover:opacity-100'}`}
                    />
                  </div>

                  {/* Rain Chance */}
                  <div className="mt-1 flex items-center gap-0.5 text-[10px] font-mono tabular-nums text-blue-300">
                    <CloudRain className="w-2.5 h-2.5" />
                    <span>{item.precipProb}%</span>
                  </div>

                  {/* UV (if day) */}
                  <div className="text-[10px] font-mono tabular-nums text-amber-400/80">
                    {item.uv > 0 ? `UV ${Math.round(item.uv)}` : 'Night'}
                  </div>

                  {/* Hour label */}
                  <span className="mt-1 text-xs font-semibold font-mono tabular-nums text-slate-300">
                    {formatHour(item.time)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span>Click any hour column above to inspect micro-metrics and safety protocols.</span>
            <span className="text-cyan-400 font-medium">
              Prime Singapore Outdoor Window: 06:00 - 08:30 & 18:30 - 21:00
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
