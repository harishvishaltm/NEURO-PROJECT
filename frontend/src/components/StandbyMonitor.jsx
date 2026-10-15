import React, { useRef, useEffect } from 'react';
import {
  Brain,
  Activity,
  CheckCircle2,
  Volume2,
  Radio,
  ShieldCheck,
  BellRing,
  Upload,
} from 'lucide-react';
import { playMedicalChime } from '../services/doctorNotifier';

export default function StandbyMonitor() {
  const canvasRef = useRef(null);

  // Live sensor baseline waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Crisp white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Medical grid lines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw 3 live channels: C3, C4, Cz
      const channels = [
        { name: 'C3 (Broca)', color: '#0284c7', y: height * 0.25, freq: 1.8, amp: 14 },
        { name: 'Cz (Vertex)', color: '#059669', y: height * 0.52, freq: 2.4, amp: 12 },
        { name: 'C4 (Vocal)', color: '#0ea5e9', y: height * 0.78, freq: 1.6, amp: 15 },
      ];

      channels.forEach((ch) => {
        // Baseline dashed line
        ctx.strokeStyle = '#e2e8f0';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(70, ch.y);
        ctx.lineTo(width - 10, ch.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = ch.color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(ch.name, 12, ch.y + 3);

        // Wave trace
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const startX = 70;
        const pts = width - startX - 10;

        for (let i = 0; i < pts; i++) {
          const x = startX + i;
          const phase = (i * 0.04) + t * ch.freq;
          const val = Math.sin(phase) * ch.amp + Math.sin(phase * 2.3) * (ch.amp * 0.35);
          const y = ch.y + val;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      t += 0.035;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleTestChime = () => {
    playMedicalChime('CRITICAL');
  };

  return (
    <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs">
            <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Scalp Sensor Array Monitor
            </h3>
            <p className="text-[11px] text-slate-500">
              122 Biosemi scalp channels synchronized & awaiting patient biosignal recording
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Calibration Nominal
          </span>
        </div>
      </div>

      {/* Live Animated Canvas Strip */}
      <div className="rounded-xl border border-sky-200 overflow-hidden bg-white shadow-inner relative">
        <canvas
          ref={canvasRef}
          width={640}
          height={180}
          className="w-full h-[180px] block"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono font-semibold text-slate-600 border border-slate-200 shadow-2xs">
          Live Sampling @ 256 Hz
        </div>
      </div>

      {/* 3 Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">
            Scalp Impedance
          </span>
          <span className="text-emerald-700 font-bold mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            &lt; 3.2 kΩ (Optimal Spec)
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">
            Target Vocabulary Profile
          </span>
          <span className="text-slate-900 font-bold mt-1 block truncate">
            Patient Needs (26 Classes)
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">
            Doctor Alert Channel
          </span>
          <button
            onClick={handleTestChime}
            className="text-sky-700 hover:text-sky-800 font-bold mt-1 flex items-center gap-1.5 group transition"
            title="Click to test doctor alert sound"
          >
            <BellRing className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition" />
            <span>Telegram & Audio Armed</span>
          </button>
        </div>
      </div>

      {/* Clinical Local Acquisition Directive */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50/80 to-blue-50/40 border border-sky-200/80 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Upload className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-sky-950">
            Awaiting Scalp EEG Recording From Local Device
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Please select or drag an EEG signal file (<code className="text-sky-700 font-mono font-bold">.npz</code> or <code className="text-sky-700 font-mono font-bold">.mat</code>) from your local computer into the Signal Acquisition panel on the left to decode patient intent.
          </p>
        </div>
      </div>
    </div>
  );
}
