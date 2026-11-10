import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Activity, Database, Server, RefreshCw, ExternalLink } from 'lucide-react';

interface ApiStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiStatusModal: React.FC<ApiStatusModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [psiData, setPsiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, pRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/psiavailability'),
      ]);
      const hJson = await hRes.json();
      const pJson = await pRes.json();
      setHealthData(hJson);
      setPsiData(pJson);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch API diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close API diagnostics modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span>Serverless Telemetry Diagnostics</span>
          <span aria-hidden="true">·</span>
          <span>Data.gov.sg v2 Integration</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Live API & PSI Availability Status</span>
        </h3>

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs text-slate-400">Probing /api/health and /api/psiavailability...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-4">
            {error}
          </div>
        )}

        {!loading && healthData && psiData && (
          <div className="space-y-4 text-xs">
            {/* PSI Availability Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>PSI Availability Stream (/api/psiavailability)</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  psiData.isAvailable
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {psiData.availabilityStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block">National PSI</span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {psiData.psi?.national ?? '--'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block">Health Band</span>
                  <span className="text-sm font-semibold text-cyan-300">
                    {psiData.psi?.band ?? '--'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block">Latency</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                    {psiData.latencyMs}ms
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block">Data Age</span>
                  <span className="text-sm font-medium text-slate-300 font-mono tabular-nums">
                    {psiData.dataAgeMinutes} mins ago
                  </span>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed text-[11px]">
                {psiData.upstreamMetadata?.statusDescription}
              </p>
            </div>

            {/* Health & Upstream Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Service Healthcheck (/api/health)</span>
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Status: {healthData.status}</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block">Server Uptime</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {healthData.uptimeSeconds}s
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block">Memory Heap</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {healthData.system?.memoryUsageMb} MB
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block">Upstream Latency</span>
                  <span className="font-mono tabular-nums text-emerald-400">
                    {healthData.upstream?.latencyMs}ms
                  </span>
                </div>
              </div>

              {/* Monitored endpoints list */}
              <span className="text-slate-400 block mb-1.5 font-medium text-[11px]">
                Active Keyless data.gov.sg v2 Endpoints ({healthData.upstream?.monitoredEndpointsCount}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300">
                {healthData.upstream?.endpoints &&
                  Object.entries(healthData.upstream.endpoints).map(([name, url]: [string, any]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-colors group"
                    >
                      <span className="text-cyan-400 group-hover:text-cyan-300">
                        /api/{name.toLowerCase().replace(/_/g, '-')}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                    </a>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Probe Upstream</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
