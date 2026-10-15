import React from 'react';
import { Upload, Sliders, Cpu, CheckCircle2, MessageSquare, Volume2, ArrowRight } from 'lucide-react';

export default function PipelineFlow({ currentStep = 0, isProcessing = false }) {
  const steps = [
    {
      id: 1,
      title: 'Signal Acquisition',
      desc: '122 Channels (.npz/.mat)',
      icon: Upload,
      color: 'from-sky-500 to-sky-600',
    },
    {
      id: 2,
      title: 'CAR Filtering',
      desc: 'Bandpass + CAR Filter',
      icon: Sliders,
      color: 'from-sky-600 to-blue-600',
    },
    {
      id: 3,
      title: 'Neural Network',
      desc: 'Spatial Gate + BiLSTM',
      icon: Cpu,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 4,
      title: 'Decoded Need',
      desc: 'Intent Classification',
      icon: CheckCircle2,
      color: 'from-indigo-600 to-sky-600',
    },
    {
      id: 5,
      title: 'Assistive Speech',
      desc: 'First-Person Sentence',
      icon: MessageSquare,
      color: 'from-sky-500 to-teal-600',
    },
    {
      id: 6,
      title: 'Vocal Audio Output',
      desc: 'Immediate Speech Voice',
      icon: Volume2,
      color: 'from-teal-600 to-emerald-600',
    },
  ];

  return (
    <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          Clinical Signal Processing & Speech Generation Pipeline
        </h3>
        {isProcessing && (
          <span className="text-xs text-sky-600 font-semibold flex items-center gap-1.5 animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500"></span>
            Processing Neural Biosignals in Real Time...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`relative rounded-xl p-3 border transition-all duration-300 ${
                isActive
                  ? 'bg-sky-50/70 border-sky-300 shadow-xs shadow-sky-100'
                  : 'bg-slate-50/60 border-slate-200/80 opacity-70'
              } ${isCurrent ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-white bg-sky-100/60' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${step.color} ${
                    isProcessing && isCurrent ? 'animate-bounce' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  0{step.id}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate">{step.title}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{step.desc}</p>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
