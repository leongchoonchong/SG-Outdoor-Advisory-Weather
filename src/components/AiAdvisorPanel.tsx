import React, { useState } from 'react';
import { SingaporeWeatherPayload } from '../types/weather';
import { Sparkles, Send, Loader2, Bot, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SINGAPORE_VENUES } from '../data/singaporeVenues';

interface AiAdvisorPanelProps {
  weather: SingaporeWeatherPayload;
  defaultActivity?: string;
}

export const AiAdvisorPanel: React.FC<AiAdvisorPanelProps> = ({ weather, defaultActivity }) => {
  const [activity, setActivity] = useState(defaultActivity || 'Endurance Running');
  const [venue, setVenue] = useState('East Coast Park (ECP)');
  const [timeOfDay, setTimeOfDay] = useState('Immediate / Right Now');
  const [userProfile, setUserProfile] = useState('Healthy Adult');
  const [customQuery, setCustomQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      label: '15km Marathon Run @ ECP',
      activity: '15km Marathon Pace Run',
      venue: 'East Coast Park (ECP)',
      time: 'Right Now',
      profile: 'Healthy endurance athlete',
    },
    {
      label: 'Toddler Outing @ Botanic Gardens',
      activity: 'Family Stroller Walk & Playground',
      venue: 'Singapore Botanic Gardens (UNESCO)',
      time: '10:00 AM',
      profile: 'Parents with 2-year-old child',
    },
    {
      label: 'Senior Nature Trek @ MacRitchie',
      activity: 'Nature Walk & Boardwalk',
      venue: 'MacRitchie Reservoir & TreeTop Walk',
      time: 'Right Now',
      profile: 'Senior (68yo) with mild hypertension',
    },
    {
      label: 'Afternoon Tennis @ Kallang',
      activity: 'Singles Tennis Match',
      venue: 'Marina Bay Waterfront & Gardens by the Bay',
      time: '2:00 PM (Midday)',
      profile: 'Intermediate player, heat sensitive',
    },
  ];

  const handleConsult = async (overrideParams?: {
    act?: string;
    ven?: string;
    tim?: string;
    prof?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const queryAct = overrideParams?.act || activity;
    const queryVen = overrideParams?.ven || venue;
    const queryTim = overrideParams?.tim || timeOfDay;
    const queryProf = overrideParams?.prof || userProfile;

    try {
      const res = await fetch('/api/ai-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: queryAct + (customQuery ? ` (${customQuery})` : ''),
          location: queryVen,
          timeOfDay: queryTim,
          userProfile: queryProf,
          weatherContext: {
            temp: weather.current.temp,
            rh: weather.current.rh,
            heatIndex: weather.current.heatIndex,
            wbgt: weather.current.wbgt,
            heatStressLevel: weather.current.heatStressLevel,
            psi: weather.airQuality.psi.overall,
            psiStatus: weather.airQuality.psi.status,
            pm25: weather.airQuality.pm25.oneHourly,
            uvIndex: weather.current.uvIndex,
            condition: weather.current.generalForecast,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate advisory');
      }

      setResponse(data.advice);
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI Advisory service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="ai-advisor" className="py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-1">
              <span>Powered by Gemini 3.8 Flash</span>
              <span aria-hidden="true">·</span>
              <span>Personalized Sports Science Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Outdoor Activity Consultant
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Get customized pacing, hydration ratios, venue micro-climate tactics, and work-rest schedules matched to your fitness profile and today’s Singapore weather.
            </p>
          </div>
        </div>

        {/* Quick Presets Strip */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Try Quick Popular Scenarios:
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActivity(preset.activity);
                  setVenue(preset.venue);
                  setTimeOfDay(preset.time);
                  setUserProfile(preset.profile);
                  handleConsult({
                    act: preset.activity,
                    ven: preset.venue,
                    tim: preset.time,
                    prof: preset.profile,
                  });
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Form Left, AI Response Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: 5 cols */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Configure Your Outdoor Session</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Target Activity:
                </label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
                >
                  <option value="Endurance Running / Jogging">Endurance Running / Jogging</option>
                  <option value="Cycling / PCN Long Ride">Cycling / PCN Long Ride</option>
                  <option value="Forest Canopy Hiking">Forest Canopy Hiking (MacRitchie / Bukit Timah)</option>
                  <option value="Water Sports / Kayaking / SUP">Water Sports / Kayaking / SUP</option>
                  <option value="Outdoor Tennis / Badminton / Football">Outdoor Tennis / Badminton / Football</option>
                  <option value="Family Outing / Stroller Walk">Family Outing / Stroller Walk</option>
                  <option value="Senior Brisk Walk / Tai Chi">Senior Brisk Walk / Tai Chi</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Destination / Venue in Singapore:
                </label>
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
                >
                  {SINGAPORE_VENUES.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.region})
                    </option>
                  ))}
                  <option value="Neighbourhood Park / Estate PCN">Neighbourhood Park / Estate PCN</option>
                  <option value="Singapore Sports Hub Kallang">Singapore Sports Hub Kallang</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Planned Time:
                  </label>
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Right Now">Right Now</option>
                    <option value="Early Morning (06:30 - 08:30 AM)">Early Morning (06:30 - 08:30 AM)</option>
                    <option value="Late Morning (09:00 - 11:00 AM)">Late Morning (09:00 - 11:00 AM)</option>
                    <option value="Midday Peak (12:00 - 15:00 PM)">Midday Peak (12:00 - 15:00 PM)</option>
                    <option value="Late Afternoon (16:30 - 18:30 PM)">Late Afternoon (16:30 - 18:30 PM)</option>
                    <option value="Evening (19:00 - 21:30 PM)">Evening (19:00 - 21:30 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Participant Profile:
                  </label>
                  <select
                    value={userProfile}
                    onChange={(e) => setUserProfile(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Healthy Adult">Healthy Adult</option>
                    <option value="Competitive Endurance Athlete">Competitive Endurance Athlete</option>
                    <option value="Family with Young Children / Toddlers">Family with Toddlers</option>
                    <option value="Senior Citizen (65+ years)">Senior Citizen (65+ years)</option>
                    <option value="Individual with Asthma / Respiratory Sensitivity">Individual with Asthma</option>
                    <option value="Heat Sensitive / Prone to Cramps">Heat Sensitive / Prone to Cramps</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Additional Details / Notes (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aiming for 10km at 5:15/km pace, carrying 500ml water"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                />
              </div>

              <button
                onClick={() => handleConsult()}
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing WBGT & Air Quality...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Personalized Advisory</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Area: AI Advisory Output: 7 cols */}
          <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/80">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>Sports Science Advisory Report</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  Grounding: Temp {weather.current.temp}°C · WBGT {weather.current.wbgt}°C · PSI {weather.airQuality.psi.overall}
                </div>
              </div>

              {isLoading && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                  <p className="text-sm font-semibold text-slate-200">
                    Evaluating Singapore Heat Load & Thermoregulation
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Cross-referencing NEA WBGT heat stress guidelines, 24-hr PSI air quality, and local venue shade factors...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Advisory Request Error:</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {!isLoading && !error && response && (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 space-y-3 leading-relaxed whitespace-pre-wrap">
                  {response}
                </div>
              )}

              {!isLoading && !error && !response && (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="font-medium text-slate-300">
                    Ready for personalized consultation
                  </p>
                  <p className="mt-1 text-slate-500 max-w-md mx-auto">
                    Select your planned activity, location, and health profile on the left or tap one of the quick scenario presets above to generate a medically grounded advisory.
                  </p>
                </div>
              )}
            </div>

            {response && (
              <div className="mt-6 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Calibrated with real-time Singapore meteorological inputs</span>
                </span>
                <span>Sports Science Algorithm v2.4</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
