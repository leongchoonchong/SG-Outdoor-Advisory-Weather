import React from 'react';
import { RefreshCw, Wind } from 'lucide-react';

interface TopNavProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onRefresh, isRefreshing, lastUpdated }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <a href="#overview" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Wind className="w-4 h-4" />
          </div>
          <span>SG Outdoor Weather & Advisory</span>
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#overview" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Overview
          </a>
          <a href="#activities" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Activity Advisories
          </a>
          <a href="#timeline" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            24h Heat Timeline
          </a>
          <a href="#venues" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Venues & Parks
          </a>
          <a href="#airquality" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Air Quality (PSI)
          </a>
          <a href="#ai-advisor" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            AI Advisory
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            title={`Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Sync Live Data'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
