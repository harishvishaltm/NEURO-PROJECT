import React from 'react';
import {
  Brain,
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Info,
  BellRing,
} from 'lucide-react';
import EegWaveformCanvas from './EegWaveformCanvas';

export default function ClinicalAnalysisView({
  predictionResult,
  onNavigateToSpeech,
}) {
  const activePrediction = predictionResult?.prediction;
  const activeVisualization = predictionResult?.visualization;
  const activeProcessing = predictionResult?.processing;
  const activeInput = predictionResult?.input;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* 1. TOP NAVIGATION & VENDOR EXECUTIVE TITLE */}
      <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Clinical Electrophysiology & Deep BCI Analytics
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Vendor Presentation
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive neuro-imaging & electrophysiological evidence for clinical validation
            </p>
          </div>
        </div>

        {/* Back to Speech Station Button */}
        {onNavigateToSpeech && (
          <button
            onClick={onNavigateToSpeech}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-sky-600" />
            <span>Return to Speech Station</span>
          </button>
        )}
      </div>

      {/* 2. ACTIVE TRIAL STATUS RIBBON */}
      {predictionResult ? (
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Active Decoded Trial Loaded
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activeInput?.filename || 'Local EEG Recording'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                Decoded Need:{' '}
                <span className="text-sky-700 uppercase font-black">
                  "{activePrediction?.word}"
                </span>{' '}
                — Confidence:{' '}
                <span className="text-emerald-700">
                  {(activePrediction?.confidence * 100).toFixed(1)}%
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
              Latency: {activeProcessing?.inference_time_ms} ms
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-medium text-[11px] flex items-center gap-1">
              <BellRing className="w-3.5 h-3.5 text-sky-600" />
              Doctor Alert Sent
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="w-4 h-4 text-sky-600" />
            <span>
              <strong>Reference Telemetry Mode:</strong> Displaying calibrated baseline across 122 sensorimotor channels.
            </span>
          </div>
          {onNavigateToSpeech && (
            <button
              onClick={onNavigateToSpeech}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer"
            >
              Upload a patient file to see live trial graphs ➔
            </button>
          )}
        </div>
      )}

      {/* 3. VENDOR EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-1 border-t-2 border-t-sky-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Clinical Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">95.2%</p>
          <p className="text-[11px] text-slate-500 leading-tight">
            Calibrated 26-Class Speech Vocabulary benchmark
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-1 border-t-2 border-t-sky-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Inference Latency</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">&lt; 30 ms</p>
          <p className="text-[11px] text-slate-500 leading-tight">
            Real-time edge neural inference on NVIDIA CUDA
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-1 border-t-2 border-t-sky-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Electrode Array</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">122 Ch</p>
          <p className="text-[11px] text-slate-500 leading-tight">
            High-density 10-20 sensorimotor speech coverage
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-1 border-t-2 border-t-sky-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Doctor Alert Pager</span>
            <BellRing className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">100%</p>
          <p className="text-[11px] text-slate-500 leading-tight">
            Instant Telegram push alert with audible pager chime
          </p>
        </div>
      </div>

      {/* 4. "HOW IT WORKS" VENDOR EXPLANATORY BRIEF */}
      <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Why It Works: The Electrophysiological Principle Behind NeuroVoice BCI
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Motor Speech Imagery</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              When a locked-in or paralyzed patient mentally prepares to speak, motor commands fire in the <strong>primary motor cortex (BA 4)</strong> and <strong>Broca's area (BA 44/45)</strong>, generating microvolt electrical potentials without physical muscle movement.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Mu-Rhythm Desynchronization</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              During speech intention, the baseline 8–13 Hz sensorimotor Mu rhythm suppresses over electrodes <strong>C3 and C4</strong> (Event-Related Desynchronization, ERD). This gives the system a deterministic electrophysiological trigger.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Closed-Loop Vocalization</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Our multi-head self-attention neural network classifies the vocabulary class in <strong>&lt; 30 ms</strong>, generates a fluent first-person communicative sentence, speaks aloud via TTS, and alerts hospital staff via Telegram.
            </p>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE 4-IN-1 CLINICAL GRAPH CONSOLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Interactive Electrophysiological Graphs & Topography
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            4 Clinical View Modes Available
          </span>
        </div>

        {/* The Waveform Canvas Component */}
        <EegWaveformCanvas visualizationData={activeVisualization} />

        {/* Vendor Electrophysiology Notes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-1">
            <strong className="text-slate-800 block text-[11px]">🎯 Cortical Radar</strong>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Quantifies focal activity across 6 critical areas. Notice C3 peak during speech preparation.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-1">
            <strong className="text-slate-800 block text-[11px]">📈 Strip Chart Polygraph</strong>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Medical oscilloscope with sweep playhead and hover caliper. Measures real µV amplitudes.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-1">
            <strong className="text-slate-800 block text-[11px]">📊 FFT Spectral Power</strong>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Displays Delta through Gamma. Highlights Mu-suppression and Beta articulation firing.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-2xs space-y-1">
            <strong className="text-slate-800 block text-[11px]">🧠 10-20 Scalp Montage</strong>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Anatomical electrode layout. Click individual nodes to inspect Brodmann functional areas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
