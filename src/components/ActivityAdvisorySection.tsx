import React, { useState } from 'react';
import { ActivityAdvice } from '../types/weather';
import { Activity, ShieldCheck, AlertTriangle, XCircle, Droplets, Clock, Sun, Shirt, Compass, ArrowRight, Sparkles, X } from 'lucide-react';

interface ActivityAdvisorySectionProps {
  advisories: ActivityAdvice[];
  onOpenAiConsult: (activityName: string) => void;
}

export const ActivityAdvisorySection: React.FC<ActivityAdvisorySectionProps> = ({
  advisories,
  onOpenAiConsult,
}) => {
  const [filter, setFilter] = useState<'all' | 'high_cardio' | 'nature' | 'family'>('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityAdvice | null>(null);

  const filtered = advisories.filter((a) => {
    if (filter === 'high_cardio') return a.activityId === 'running' || a.activityId === 'cycling' || a.activityId === 'court_sports';
    if (filter === 'nature') return a.activityId === 'hiking' || a.activityId === 'water_sports';
    if (filter === 'family') return a.activityId === 'family_outing' || a.activityId === 'senior_walking';
    return true;
  });

  const getStatusBadge = (status: ActivityAdvice['status']) => {
    switch (status) {
      case 'Optimal':
        return {
          label: 'Favourable / Safe',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
        };
      case 'Caution':
        return {
          label: 'Proceed with Caution',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
        };
      case 'Unfavourable':
      default:
        return {
          label: 'High Risk / Reschedule',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: XCircle,
        };
    }
  };

  return (
    <section id="activities" className="py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-1">
              <span>Physiological Safety Ratings</span>
              <span aria-hidden="true">·</span>
              <span>Thermoregulation & Air Quality Guidance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Outdoor Activity Advisories for Singapore
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Real-time suitability scores based on Singapore wet bulb globe temperature (WBGT), convective sweat evaporation rates, and 24-hr PSI air quality.
            </p>
          </div>

          {/* Filter Tabs (Interactive Segmented Control adhering to anti-slop guidelines) */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 border border-slate-700 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Activities
            </button>
            <button
              onClick={() => setFilter('high_cardio')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'high_cardio'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High Aerobic / Cardio
            </button>
            <button
              onClick={() => setFilter('nature')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'nature'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trails & Water
            </button>
            <button
              onClick={() => setFilter('family')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'family'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Family & Seniors
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const statusConfig = getStatusBadge(item.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={item.activityId}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col hover:border-slate-600 transition-all group"
              >
                {/* Visual Imagery if available */}
                {item.image && (
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    {/* Score Tag in Upper Right */}
                    <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold text-white font-mono tabular-nums">
                      Score: <span className="text-cyan-400">{item.safetyScore}</span>/100
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[11px] font-semibold text-cyan-300 block mb-0.5">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                )}

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {!item.image && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-cyan-400">
                            {item.category}
                          </span>
                          <span className="text-xs font-bold text-slate-300 font-mono tabular-nums">
                            {item.safetyScore}/100
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                          {item.title}
                        </h3>
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusConfig.bg}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {item.summary}
                    </p>

                    {/* Quick Specs */}
                    <div className="space-y-2 text-xs text-slate-300 bg-slate-900/60 rounded-xl p-3 border border-slate-700/50 mb-4">
                      <div className="flex items-start gap-2">
                        <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-200">Hydration:</strong> {item.hydrationPlan}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-200">Work/Rest:</strong> {item.workRestRatio}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-200">Optimal Window:</strong> {item.bestHours}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedActivity(item)}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>Full Safety Protocol</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenAiConsult(item.title)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-700/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Get personalized AI advice for this activity"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Ask AI</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
              <button
                onClick={() => setSelectedActivity(null)}
                aria-label="Close activity detail modal"
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                <span>Sports Science & Heat Stress Protocol</span>
                <span aria-hidden="true">·</span>
                <span>{selectedActivity.category}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                {selectedActivity.title}
              </h3>

              <div className="flex items-center gap-3 mb-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${getStatusBadge(selectedActivity.status).bg}`}>
                  {getStatusBadge(selectedActivity.status).label}
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  Calculated Safety Rating: <strong className="text-white">{selectedActivity.safetyScore}/100</strong>
                </span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
                  <h4 className="font-semibold text-white text-sm mb-1">Executive Summary</h4>
                  <p className="leading-relaxed">{selectedActivity.summary}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                    <span className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
                      <Droplets className="w-4 h-4" />
                      Hydration & Fluid Replacement
                    </span>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {selectedActivity.hydrationPlan}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                    <span className="flex items-center gap-1.5 font-semibold text-cyan-400 mb-1">
                      <Clock className="w-4 h-4" />
                      Pacing & Work-to-Rest Ratio
                    </span>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {selectedActivity.workRestRatio}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                      <Sun className="w-4 h-4" />
                      Solar & UV Defense
                    </span>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {selectedActivity.uvAdvice}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                    <span className="flex items-center gap-1.5 font-semibold text-purple-400 mb-1">
                      <Shirt className="w-4 h-4" />
                      Recommended Gear & Attire
                    </span>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {selectedActivity.clothingTip}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
                  <h4 className="font-semibold text-white text-xs mb-1">Thermal & Respiratory Breakdown</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-1.5">
                    <strong>Heat Stress:</strong> {selectedActivity.heatStressImpact}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Air Quality:</strong> {selectedActivity.airQualityImpact}
                  </p>
                </div>

                <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3.5 text-cyan-200">
                  <h4 className="font-semibold text-cyan-300 text-xs mb-1">Sheltered / Indoor Alternative</h4>
                  <p className="text-xs leading-relaxed">
                    {selectedActivity.indoorAlternative}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => {
                    const title = selectedActivity.title;
                    setSelectedActivity(null);
                    onOpenAiConsult(title);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI for Tailored Training Plan</span>
                </button>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
