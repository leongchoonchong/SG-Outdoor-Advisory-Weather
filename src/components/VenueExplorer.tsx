import React, { useState } from 'react';
import { SINGAPORE_VENUES, SingaporeVenue } from '../data/singaporeVenues';
import { AreaForecast } from '../types/weather';
import { MapPin, Trees, Droplet, ShieldCheck, Sun, CheckCircle, Navigation } from 'lucide-react';

interface VenueExplorerProps {
  selectedVenue: SingaporeVenue;
  onSelectVenue: (venue: SingaporeVenue) => void;
  areaForecasts: AreaForecast[];
}

export const VenueExplorer: React.FC<VenueExplorerProps> = ({
  selectedVenue,
  onSelectVenue,
  areaForecasts,
}) => {
  const [regionFilter, setRegionFilter] = useState<'All' | 'Central' | 'East' | 'West' | 'North-East' | 'South'>('All');

  const filteredVenues = SINGAPORE_VENUES.filter((v) => {
    if (regionFilter === 'All') return true;
    return v.region === regionFilter;
  });

  const getForecastForVenue = (venue: SingaporeVenue) => {
    const match = areaForecasts.find(
      (af) => af.area.toLowerCase().includes(venue.matchedArea.toLowerCase()) ||
              venue.matchedArea.toLowerCase().includes(af.area.toLowerCase())
    );
    return match?.forecast || 'Partly Cloudy';
  };

  return (
    <section id="venues" className="py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-1">
              <span>Park Connector Network (PCN) & Nature Reserves</span>
              <span aria-hidden="true">·</span>
              <span>Regional Microclimates</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Singapore Outdoor Venue & Park Intelligence
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Compare forest canopy cover, potable water points, sheltered rest huts, and localized 2-hour nowcasts across Singapore’s top recreation destinations.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 border border-slate-700 rounded-xl overflow-x-auto self-start md:self-auto">
            {(['All', 'Central', 'East', 'West', 'North-East', 'South'] as const).map((reg) => (
              <button
                key={reg}
                onClick={() => setRegionFilter(reg)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  regionFilter === reg
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        {/* Venue Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => {
            const isSelected = venue.id === selectedVenue.id;
            const nowcast = getForecastForVenue(venue);

            return (
              <div
                key={venue.id}
                onClick={() => onSelectVenue(venue)}
                className={`bg-slate-800/80 rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/20 shadow-lg'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {venue.region} · {venue.category}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      {nowcast}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                    {venue.name}
                  </h3>

                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    {venue.description}
                  </p>

                  {/* Micro-climate Amenities */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] block">Tree Canopy</span>
                      <span className="font-semibold text-slate-200">{venue.shadeLevel}</span>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] block">Water Kiosks</span>
                      <span className="font-semibold text-slate-200">
                        {venue.hasWaterRefills ? 'Available' : 'None'}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] block">Shelters</span>
                      <span className="font-semibold text-slate-200">
                        {venue.hasCoveredShelters ? 'Covered' : 'Open'}
                      </span>
                    </div>
                  </div>

                  {/* Activity Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {venue.activities.slice(0, 3).map((act, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/50"
                      >
                        {act}
                      </span>
                    ))}
                    {venue.activities.length > 3 && (
                      <span className="text-[10px] text-slate-500 py-0.5">
                        +{venue.activities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Nowcast Area: {venue.matchedArea}</span>
                  <span className={`font-semibold transition-colors ${isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {isSelected ? 'Active Venue ✓' : 'Select Venue →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
