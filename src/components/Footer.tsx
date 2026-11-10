import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-sm font-semibold text-slate-300">
            Singapore Outdoor Advisory & Real-Time Weather
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-xl">
            Real-time environmental data sourced from Singapore National Environment Agency (NEA) and Meteorological Service Singapore via data.gov.sg APIs and Open-Meteo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-400">
          <span>NEA 2-Hr & 24-Hr Forecasts</span>
          <span aria-hidden="true">·</span>
          <span>PSI & PM2.5 Air Quality</span>
          <span aria-hidden="true">·</span>
          <span>WBGT Heat Stress Index</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-slate-900 text-center text-[11px] text-slate-600">
        Disclaimer: Weather and heat stress advisories provide general physiological guidance. Always monitor personal hydration, listen to your body, and immediately seek air-conditioned shelter if experiencing symptoms of heat exhaustion, dizziness, or nausea.
      </div>
    </footer>
  );
};
