import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Bell,
  BellRing,
  Brain,
  Radio,
  Cpu,
  Volume2,
  CheckCircle2,
  Activity,
  AlertCircle,
  Check,
  BarChart3,
  Waves,
} from 'lucide-react';

import PipelineFlow from './PipelineFlow';
import UploadView from './UploadView';
import ResultsDashboard from './ResultsDashboard';
import ClinicalAnalysisView from './ClinicalAnalysisView';
import ContinuousStreamingView from './ContinuousStreamingView';

export default function PhoneSimulator({
  health,
  modelInfo,
  predictionResult,
  onUpload,
  isPredicting,
  pipelineStep,
  doctorAlert,
  alertDismissed,
  onDismissAlert,
  onEnableNotifications,
  notificationPermission,
  onReset,
  onSwitchToDesktop,
}) {
  const isOnline = health?.status === 'ok';
  const [mobileTab, setMobileTab] = useState('speech'); // 'speech' | 'analysis' | 'stream'

  return (
    <div className="flex flex-col items-center justify-center py-2 space-y-4 animate-fade-in w-full text-slate-800">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between w-full max-w-[440px] px-3 py-2 rounded-xl bg-white border border-sky-100 shadow-xs text-xs">
        <div className="flex items-center gap-2 text-sky-800 font-bold">
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span>Clinical Mobile Handset (Doctor & Caregiver)</span>
        </div>
        <button
          onClick={onSwitchToDesktop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold transition cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Exit to Desktop</span>
        </button>
      </div>

      {/* Realistic Smartphone Handset Frame */}
      <div className="relative w-full max-w-[420px] h-[860px] bg-white rounded-[48px] p-3 shadow-2xl border-4 border-slate-300 ring-1 ring-slate-200 flex flex-col justify-between select-none">
        {/* Dynamic Island / Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-full z-40 flex items-center justify-between px-3 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse inline-block"></span>
        </div>

        {/* Mobile Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-bold text-slate-800 z-30 shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-600">5G</span>
            <Activity className="w-3 h-3 text-sky-600" />
            <div className="w-5 h-2.5 rounded-sm border border-slate-600 flex items-center p-0.5">
              <div className="w-full h-full bg-sky-600 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Phone Screen Scrollable Area (Sky-Blue & White Theme) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 bg-slate-50/50 rounded-[32px] text-slate-800 scrollbar-thin scrollbar-thumb-slate-300">
          {/* Mobile App Title Header */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-sky-100 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">NeuroVoice BCI</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">
                    Mobile
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Paralyzed Patient Speech Care</p>
              </div>
            </div>

            <button
              onClick={onEnableNotifications}
              className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
              title="Doctor Mobile Alerts"
            >
              {notificationPermission === 'granted' ? (
                <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-sky-600" />
              )}
            </button>
          </div>

          {/* Primary Mobile Navigation Switcher (Speech vs Analysis vs Stream) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setMobileTab('speech')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                mobileTab === 'speech'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Volume2 className="w-3 h-3 text-sky-600" />
              <span>Speech</span>
            </button>
            <button
              onClick={() => setMobileTab('analysis')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                mobileTab === 'analysis'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3 h-3 text-sky-600" />
              <span>Graphs</span>
            </button>
            <button
              onClick={() => setMobileTab('stream')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer relative ${
                mobileTab === 'stream'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>Live Stream</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-0.5" />
            </button>
          </div>

          {/* Mobile Telemetry Status Bar */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-sky-100 text-[10px] text-slate-600 font-mono shadow-2xs">
            <div className="flex items-center gap-1">
              <Radio className={`w-2.5 h-2.5 ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`} />
              <span className="font-semibold text-slate-800">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5 text-sky-600" />
              <span>{health?.device ? health.device.toUpperCase() : 'CUDA'}</span>
            </div>
            <span className="text-slate-500">122-Ch 256Hz</span>
          </div>

          {/* DOCTOR CLINICAL ALERT BANNER (If Active) */}
          {doctorAlert && !alertDismissed && (
            <div
              className={`p-3 rounded-xl border shadow-xs animate-fade-in ${
                doctorAlert.urgency?.level === 'CRITICAL'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-sky-50 border-sky-300 text-sky-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  {doctorAlert.urgency?.badge || '🚨 DOCTOR ALERT'}
                </span>
                <span className="text-[10px] font-mono opacity-80">{doctorAlert.timestamp}</span>
              </div>

              <div className="my-1 text-xs">
                <p className="font-bold">
                  {doctorAlert.patient}: Need "{doctorAlert.word}"
                </p>
                <p className="italic text-slate-700 text-[11px] mt-0.5">
                  "{doctorAlert.sentence}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[10px]">
                <span className="text-slate-600 font-medium">Telegram & Audio Alert Sent</span>
                <button
                  onClick={onDismissAlert}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: SPEECH & UPLOAD (Page 1 inside Phone) */}
          {mobileTab === 'speech' && (
            <>
              {/* Pipeline Execution Flow */}
              <div className="scale-95 origin-top -my-1">
                <PipelineFlow currentStep={pipelineStep} isProcessing={isPredicting} />
              </div>

              {/* Upload Panel */}
              <div className="space-y-3">
                <UploadView onUpload={onUpload} isPredicting={isPredicting} />
              </div>

              {/* Results Dashboard or Standby State */}
              {predictionResult ? (
                <div className="pt-2">
                  <ResultsDashboard
                    result={predictionResult}
                    onReset={onReset}
                    onNavigateToAnalysis={() => setMobileTab('analysis')}
                  />
                </div>
              ) : (
                /* Standby State inside Phone */
                <div className="p-6 rounded-2xl bg-white border border-sky-100 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shadow-xs">
                      <Brain className="w-7 h-7 text-sky-600 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Neural Engine Armed & Ready</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Upload an EEG recording above. The deep neural network will decode patient intent and synthesize speech.
                    </p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 text-left text-[10px]">
                    <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
                      <span className="text-slate-500 block uppercase font-mono">Profile</span>
                      <span className="text-slate-800 font-bold truncate block">26 Classes Calibrated</span>
                    </div>
                    <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
                      <span className="text-slate-500 block uppercase font-mono">Synthesizer</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> Voice Active
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ANALYSIS GRAPHS (Page 2 inside Phone) */}
          {mobileTab === 'analysis' && (
            <div className="pt-1">
              <ClinicalAnalysisView
                predictionResult={predictionResult}
                onNavigateToSpeech={() => setMobileTab('speech')}
              />
            </div>
          )}

          {/* TAB 3: LIVE BEDSIDE STREAM (Page 3 inside Phone) */}
          {mobileTab === 'stream' && (
            <div className="pt-1">
              <ContinuousStreamingView
                onNavigateToSpeech={() => setMobileTab('speech')}
                onNavigateToAnalysis={() => setMobileTab('analysis')}
              />
            </div>
          )}

          {/* Clinical Operating Note */}
          <div className="p-3 rounded-xl bg-white border border-sky-100 text-[10px] text-slate-600 space-y-1 shadow-2xs">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Brain className="w-3 h-3 text-sky-600" />
              Paralyzed Patient BCI Communication System
            </p>
            <p className="leading-relaxed text-slate-500">
              Decodes 122 EEG channels into vocal speech across 26 clinical categories.
            </p>
          </div>
        </div>

        {/* Mobile Home Bar Indicator */}
        <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0 z-30" />
      </div>
    </div>
  );
}
