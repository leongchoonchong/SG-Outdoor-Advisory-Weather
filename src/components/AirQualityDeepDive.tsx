import React from 'react';
import { AirQualityData } from '../types/weather';
import { Wind, Shield, AlertTriangle, Info, HeartPulse } from 'lucide-react';

interface AirQualityDeepDiveProps {
  airQuality: AirQualityData;
}

export const AirQualityDeepDive: React.FC<AirQualityDeepDiveProps> = ({ airQuality }) => {
  const { psi, pm25 } = airQuality;

  const regions = [
    { name: 'Central (Bishan / Marina / City)', psi: psi.bands.central, pm25: pm25.regions.central },
    { name: 'East (Bedok / Tampines / Changi)', psi: psi.bands.east, pm25: pm25.regions.east },
    { name: 'West (Jurong / Clementi / Tuas)', psi: psi.bands.west, pm25: pm25.regions.west },
    { name: 'North (Woodlands / Yishun)', psi: psi.bands.north, pm25: pm25.regions.north },
    { name: 'South (Sentosa / Bukit Merah)', psi: psi.bands.south, pm25: pm25.regions.south },
  ];

  return (
    <section id="airquality" className="py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-1">
              <span>National Environment Agency (NEA) Air Monitoring</span>
              <span aria-hidden="true">·</span>
              <span>Regional Sensor Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Singapore Air Quality Index & Health Bands
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              24-hour Pollutant Standards Index (PSI) and 1-hour PM2.5 particulate levels across the 5 national monitoring sectors.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Telemetry Updated: {new Date(psi.updatedAt).toLocaleTimeString()}
          </div>
        </div>

        {/* Regional Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {regions.map((reg) => (
            <div
              key={reg.name}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  {reg.name}
                </span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                      {reg.psi}
                    </span>
                    <span className="text-[11px] text-slate-400 block">24h PSI</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-cyan-400 font-mono tabular-nums">
                      {reg.pm25}
                    </span>
                    <span className="text-[11px] text-slate-400 block">1h PM2.5</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Status:</span>
                <span className={`font-semibold ${reg.psi <= 50 ? 'text-emerald-400' : reg.psi <= 100 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {reg.psi <= 50 ? 'Good' : reg.psi <= 100 ? 'Moderate' : 'Unhealthy'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* MOH & NEA Health Advisory Matrix */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Official Singapore NEA / MOH Outdoor Health Matrix
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Good (PSI 0 - 50)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Healthy Persons:</strong> Normal outdoor activity, marathon training, sports, and swimming are completely unconstrained.
              </p>
              <p className="text-slate-400 mt-2 leading-relaxed">
                <strong>Vulnerable Groups (Elderly, Asthmatic):</strong> Safe for routine walks, playground visits, and outdoor recreational exercise.
              </p>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Moderate (PSI 51 - 100)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Healthy Persons:</strong> Normal outdoor activities can continue. Monitor for transient eye or throat irritation during strenuous drills.
              </p>
              <p className="text-slate-400 mt-2 leading-relaxed">
                <strong>Vulnerable Groups:</strong> Those with chronic lung or cardiovascular issues should reduce prolonged or heavy outdoor exertion.
              </p>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-rose-400 font-semibold mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>Unhealthy (PSI 101 - 200)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Healthy Persons:</strong> Reduce prolonged or strenuous outdoor physical exertion. Move endurance running to indoor tracks.
              </p>
              <p className="text-slate-400 mt-2 leading-relaxed">
                <strong>Vulnerable Groups:</strong> Avoid outdoor physical exertion. Stay indoors in air-conditioned spaces with HEPA air filters.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Pro Tip: 1-hour PM2.5 readings are volatile during regional convective storms and transboundary wind shifts. Use 1-hr PM2.5 for immediate “go/no-go” decisions for the next 1-2 hours.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
