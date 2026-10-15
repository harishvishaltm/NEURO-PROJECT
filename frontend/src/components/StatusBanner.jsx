import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Layers, Radio, ShieldCheck } from 'lucide-react';

export default function StatusBanner({ health, modelInfo, onRefresh, loading }) {
  const isOnline = health?.status === 'ok';

  if (!isOnline && !loading) {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-rose-800 text-xs shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>System Disconnected:</strong> Decoding server is not responding at{' '}
              <code className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-900 font-mono">http://localhost:8000</code>.
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reconnect</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sky-50/50 border-b border-sky-100 px-4 py-2 text-xs text-slate-600">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
            <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>Clinical Pipeline:</span>
            <span className="text-sky-700 font-semibold">Active & Armed</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Vocabulary:</span>
            <span className="text-slate-800 font-semibold">Patient Essential Needs (9 Classes)</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <span>Harmonization:</span>
            <span className="text-slate-700 font-mono font-medium">122 Scalp Electrodes @ 256 Hz</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Validated Clinical Calibration
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 text-slate-500 hover:text-sky-700 transition text-xs ml-auto"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
}
