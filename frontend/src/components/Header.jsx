import React from 'react';
import {
  Brain,
  Cpu,
  ShieldCheck,
  Radio,
  Monitor,
  Smartphone,
  Bell,
  BellRing,
  Volume2,
  Activity,
  BarChart3,
  Waves,
} from 'lucide-react';

export default function Header({
  health,
  modelInfo,
  viewMode = 'desktop',
  onViewChange,
  activePage = 'speech',
  onPageChange,
  hasPrediction = false,
  notificationPermission,
  onEnableNotifications,
}) {
  const isOnline = health?.status === 'ok';
  const isCuda = health?.device?.toLowerCase().includes('cuda');

  return (
    <header className="border-b border-sky-100 bg-white/95 backdrop-blur-md sticky top-0 z-40 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          {/* Clinical Workstation Status Dots */}
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm shadow-sky-200 text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  NeuroVoice BCI Workstation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  Clinical Edition
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block -mt-0.5">
                Neural Speech Communication for Paralyzed & ALS Patients
              </span>
            </div>
          </div>
        </div>

        {/* Center: Primary 3-Page Navigation Switcher */}
        <div className="flex items-center bg-sky-50/80 p-1 rounded-xl border border-sky-200/80 shadow-2xs">
          {/* Page 1: Speech Station (Upload & Voice Output) */}
          <button
            onClick={() => onPageChange && onPageChange('speech')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activePage === 'speech'
                ? 'bg-white text-sky-800 shadow-xs border border-sky-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Speech Station</span>
            <span className="hidden lg:inline text-[10px] text-slate-400 font-normal">
              (Upload)
            </span>
          </button>

          {/* Page 2: Clinical Analysis (Vendor Graphs) */}
          <button
            onClick={() => onPageChange && onPageChange('analysis')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer relative ${
              activePage === 'analysis'
                ? 'bg-white text-sky-800 shadow-xs border border-sky-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
            <span>Clinical Graphs</span>
            <span className="hidden lg:inline text-[10px] text-slate-400 font-normal">
              (Vendor Analysis)
            </span>
            {hasPrediction && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Trial Ready" />
            )}
          </button>

          {/* Page 3: Live Bedside Stream (Continuous Patient BCI) */}
          <button
            onClick={() => onPageChange && onPageChange('stream')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer relative ${
              activePage === 'stream'
                ? 'bg-white text-sky-800 shadow-xs border border-sky-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Bedside Stream</span>
            <span className="hidden lg:inline text-[10px] text-slate-400 font-normal">
              (Continuous BCI)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Live 256Hz Feed" />
          </button>
        </div>

        {/* Right: Controls & View Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Desktop vs Phone Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => onViewChange && onViewChange('desktop')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => onViewChange && onViewChange('phone')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'phone'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone</span>
            </button>
          </div>

          {/* Doctor Mobile Notification Alert Toggle */}
          <button
            onClick={onEnableNotifications}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              notificationPermission === 'granted'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700'
            }`}
            title="Toggle Doctor Mobile Notifications"
          >
            {notificationPermission === 'granted' ? (
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-sky-600" />
            )}
            <span className="hidden lg:inline">
              {notificationPermission === 'granted' ? 'Alerts Active' : 'Doctor Alerts'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
