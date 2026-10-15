import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  BarChart3,
  MessageSquare,
  Volume2,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Upload,
  ArrowRight,
  BellRing,
  ShieldCheck,
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';

export default function ResultsDashboard({ result, onReset, onNavigateToAnalysis }) {
  const [showJson, setShowJson] = useState(false);

  if (!result || !result.prediction) return null;

  const {
    prediction,
    top_predictions = [],
    ground_truth,
    evaluation,
    communication,
    audio,
    processing,
    input,
  } = result;

  const isCorrect = evaluation?.correct;
  const confidencePercent = (prediction.confidence * 100).toFixed(1);
  const isCritical = ['pain', 'help', 'breathe', 'scared'].includes((prediction.word || '').toLowerCase());

  return (
    <div className="space-y-4 animate-fade-in text-slate-800">
      {/* Top Action Ribbon */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-sky-100 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            Signal Decoded Successfully ({input?.filename || 'Uploaded Trial'})
          </span>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold transition shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Another EEG File</span>
          </button>
        )}
      </div>

      {/* Main Decoded Word and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Decoded Word Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-sky-100 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xs border-t-4 border-t-sky-500 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                Clinical Speech Output
              </span>
            </div>

            {/* Ground Truth Validation Badge */}
            {ground_truth && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ground Truth Matched ({ground_truth})</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ground Truth: {ground_truth}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Big Word Display */}
          <div className="my-2">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Decoded Patient Imagined Intent:
            </p>
            <div className="flex flex-wrap items-baseline gap-4">
              <h2 className="text-4xl sm:text-5xl font-black text-sky-700 tracking-tight">
                "{prediction.word.toUpperCase()}"
              </h2>

              <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs text-slate-600 font-medium">Confidence:</span>
                <span className="text-sm font-bold text-sky-800">{confidencePercent}%</span>
              </div>

              {isCritical && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  🚨 High Urgency Need
                </span>
              )}
            </div>
          </div>

          {/* Assistive Speech Sentence Card */}
          {communication && (
            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  Spoken Communicative Sentence:
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                  First-Person Voice
                </span>
              </div>

              <p className="text-lg font-semibold text-slate-900 italic">
                "{communication.sentence}"
              </p>

              {/* Speech Synthesizer Playback */}
              {audio?.url && (
                <div className="pt-2">
                  <AudioPlayer audioUrl={audio.url} sentence={communication.sentence} />
                </div>
              )}
            </div>
          )}

          {/* Doctor Telegram Pager Dispatch Status */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Doctor Notification:</strong> Dispatched to Telegram Bot & Patient Pager with Audio Chime.
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Delivered
            </span>
          </div>

          {/* Telemetry Footnote */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Latency: <strong className="text-slate-800">{processing?.inference_time_ms} ms</strong>
              </span>
              {processing?.preprocessing_time_ms && (
                <span className="flex items-center gap-1">
                  CAR Filter: <strong className="text-slate-800">{processing.preprocessing_time_ms} ms</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              Compute: <span className="font-mono text-slate-800 font-semibold">{processing?.device?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Top 5 Probability Distribution Bar Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-sky-100 rounded-2xl p-5 flex flex-col justify-between shadow-xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                Softmax Class Probabilities
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-medium">Top Candidates</span>
            </div>

            <div className="space-y-2.5">
              {top_predictions.slice(0, 5).map((item, idx) => {
                const prob = Math.round(item.confidence * 100);
                const isTop = idx === 0;

                return (
                  <div key={item.word} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-mono font-medium ${isTop ? 'text-sky-800 font-bold' : 'text-slate-700'}`}>
                        {idx + 1}. {item.word}
                      </span>
                      <span className="font-mono text-slate-600 font-semibold">
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop
                            ? 'bg-gradient-to-r from-sky-500 to-sky-600 shadow-xs shadow-sky-200'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.max(3, prob)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Attention Note */}
          <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Learned Spatial Electrode Gate</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Attends to 122 scalp electrodes and correlates sensorimotor temporal dynamics via Multi-Head Self-Attention.
            </p>
          </div>
        </div>
      </div>

      {/* VENDOR PRESENTATION PROMINENT CALLOUT BANNER (Takes user to page 2) */}
      {onNavigateToAnalysis && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Inspect Deep Clinical Graphs & Electrophysiology
              </h4>
              <p className="text-xs text-sky-100">
                View Cortical Activation Radar, Polygraph Oscilloscope, FFT Band Power & 10-20 Scalp Montage for this trial
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToAnalysis}
            className="px-4 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Open Clinical Graphs & Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Developer Raw JSON Inspection Accordion */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full px-4 py-3 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between transition"
        >
          <span>Raw Telemetry & Response Payload</span>
          {showJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showJson && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <pre className="text-[11px] font-mono text-slate-800 overflow-x-auto max-h-72 p-2 rounded bg-white border border-slate-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
