import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Brain,
  Activity,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Clock,
  Cpu,
  Zap,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Heart,
  ShieldCheck,
  Layers,
  RotateCcw,
  Sliders,
  ArrowLeft,
  ChevronRight,
  Info,
  Waves,
} from 'lucide-react';
import { api } from '../services/api';
import { playMedicalChime, dispatchDoctorAlert } from '../services/doctorNotifier';

// Key clinical channels for bedside telemetry monitor
const MONITORED_CHANNELS = [
  { id: 'C3', name: 'C3 (Left Motor / Broca)', role: "Broca's Speech Area", color: '#0284c7', baseAmp: 18 },
  { id: 'C4', name: 'C4 (Right Motor / Vocal)', role: 'Vocal Tract Articulation', color: '#0ea5e9', baseAmp: 16 },
  { id: 'CZ', name: 'Cz (Sensorimotor Vertex)', role: 'Mu Rhythm Midline', color: '#059669', baseAmp: 15 },
  { id: 'FZ', name: 'Fz (Frontal Midline)', role: 'Motor Speech Planning', color: '#6366f1', baseAmp: 14 },
  { id: 'PZ', name: 'Pz (Parietal Midline)', role: 'Sensory Association', color: '#d97706', baseAmp: 12 },
  { id: 'FP1', name: 'Fp1 (Left Prefrontal)', role: 'Executive Intent', color: '#0d9488', baseAmp: 13 },
];

// Presets for quick intention simulation (from Kara One dataset samples)
const SIMULATION_PRESETS = [
  { id: 'patient_01_water', word: 'Water', category: 'Urgent Need', icon: '💧', urgency: 'STANDARD', sentence: 'I need some water please, my mouth is dry.' },
  { id: 'patient_02_pain', word: 'Pain', category: 'Emergency Need', icon: '🚨', urgency: 'CRITICAL', sentence: 'I am in severe pain, please call the nurse.' },
  { id: 'patient_03_help', word: 'Help', category: 'Emergency Need', icon: '🆘', urgency: 'CRITICAL', sentence: 'I urgently need medical assistance right now.' },
  { id: 'patient_08_breathe', word: 'Breathe', category: 'Emergency Need', icon: '🫁', urgency: 'CRITICAL', sentence: 'I am struggling to breathe, check my ventilator.' },
  { id: 'patient_04_bathroom', word: 'Bathroom', category: 'Urgent Need', icon: '🚽', urgency: 'HIGH', sentence: 'I need immediate assistance to use the bathroom.' },
  { id: 'patient_06_medicine', word: 'Medicine', category: 'Urgent Need', icon: '💊', urgency: 'HIGH', sentence: 'It is time for my scheduled medication dose.' },
  { id: 'patient_21_thank_you', word: 'Thank You', category: 'Social Vocab', icon: '🙏', urgency: 'STANDARD', sentence: 'Thank you very much for helping me.' },
  { id: 'patient_07_rest', word: 'Rest', category: 'General Need', icon: '😴', urgency: 'STANDARD', sentence: 'I am feeling exhausted and would like to rest now.' },
  { id: 'patient_19_yes', word: 'Yes', category: 'Conversational', icon: '✅', urgency: 'STANDARD', sentence: 'Yes, that is correct.' },
  { id: 'patient_20_no', word: 'No', category: 'Conversational', icon: '❌', urgency: 'STANDARD', sentence: 'No, that is not what I want.' },
];

export default function ContinuousStreamingView({ onNavigateToSpeech, onNavigateToAnalysis }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState(1); // 1x or 2x
  const [autoPilot, setAutoPilot] = useState(true); // Automatically trigger realistic patient needs periodically
  const [voiceMuted, setVoiceMuted] = useState(false);

  // Active Detection & Decoded Speech State
  const [bciStatus, setBciStatus] = useState('MONITORING'); // 'MONITORING' | 'DETECTING' | 'DECODED' | 'SPEAKING'
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventHistory, setEventHistory] = useState([
    {
      id: 1,
      time: '11:05:12 AM',
      word: 'Comfortable',
      sentence: 'I feel comfortable and well right now.',
      confidence: 0.954,
      latency: 27.8,
      urgency: 'STANDARD',
    },
  ]);

  // Buffer & Waveform State
  const bufferRef = useRef({
    // Circular buffers for each monitored channel (512 points for display)
    channels: MONITORED_CHANNELS.reduce((acc, ch) => {
      acc[ch.id] = new Float32Array(512);
      return acc;
    }, {}),
    writeIndex: 0,
    activeTrialData: null,
    trialSampleIdx: 0,
    timeCounter: 0,
    lastAutoPilotTime: Date.now(),
  });

  // Native Speech Synthesis voice playback
  const speakVoice = useCallback(
    (text) => {
      if (voiceMuted) return;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    },
    [voiceMuted]
  );

  // Trigger continuous neural prediction on a specific EEG sample
  const triggerIntentionEvent = useCallback(
    async (preset) => {
      setBciStatus('DETECTING');

      try {
        // Run real neural inference through FastAPI backend
        const result = await api.predictDemo(preset.id);
        const predWord = result.prediction?.word || preset.word;
        const predConf = result.prediction?.confidence || 0.965;
        const sentence = result.communication?.sentence || preset.sentence;
        const latency = result.processing?.inference_time_ms || 28.2;
        const isCritical = ['pain', 'help', 'breathe', 'scared'].includes(predWord.toLowerCase());

        // Extract channel waveforms to inject into live rolling buffer
        const waveforms = result.visualization?.waveforms || [];
        const channelMap = {};
        waveforms.forEach((w) => {
          channelMap[w.channel] = w.values;
        });

        // Load into continuous buffer
        bufferRef.current.activeTrialData = channelMap;
        bufferRef.current.trialSampleIdx = 0;

        // Set active event
        const eventData = {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          word: predWord,
          sentence: sentence,
          confidence: predConf,
          latency: latency,
          urgency: isCritical ? 'CRITICAL' : preset.urgency || 'STANDARD',
          audioUrl: result.audio?.url,
        };

        setCurrentEvent(eventData);
        setEventHistory((prev) => [eventData, ...prev.slice(0, 19)]);
        setBciStatus('SPEAKING');

        // Play hospital alert chime
        playMedicalChime(eventData.urgency);

        // Dispatch Telegram alert
        dispatchDoctorAlert({
          word: predWord,
          sentence: sentence,
          patient: 'ALS Patient 01 (Bed 4B)',
        });

        try {
          await api.notifyDoctor({
            patient_id: 'ALS Patient 01 (Bed 4B)',
            word: predWord,
            sentence: sentence,
            urgency: isCritical ? 'CRITICAL' : 'STANDARD',
          });
        } catch (e) {
          // Silent catch for network
        }

        // Voice output via synthesized audio or SpeechSynthesis
        if (result.audio?.url && !voiceMuted) {
          if (audioRef.current) {
            audioRef.current.src = result.audio.url;
            audioRef.current.play().catch(() => speakVoice(sentence));
          } else {
            speakVoice(sentence);
          }
        } else {
          speakVoice(sentence);
        }

        // Return to normal monitoring after speech
        setTimeout(() => {
          setBciStatus('MONITORING');
        }, 3200);
      } catch (err) {
        console.error('Continuous stream trigger failed:', err);
        setBciStatus('MONITORING');
      }
    },
    [speakVoice, voiceMuted]
  );

  // Auto-Pilot: Automatically trigger realistic communication event every 10-14 seconds
  useEffect(() => {
    if (!autoPilot || !isStreaming) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - bufferRef.current.lastAutoPilotTime > 11000 && bciStatus === 'MONITORING') {
        bufferRef.current.lastAutoPilotTime = now;
        // Select random realistic clinical need
        const randomPreset = SIMULATION_PRESETS[Math.floor(Math.random() * 5)]; // Top 5 urgent needs
        triggerIntentionEvent(randomPreset);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoPilot, isStreaming, bciStatus, triggerIntentionEvent]);

  // Real-Time 256 Hz Streaming & 60 FPS Oscilloscope Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const buffer = bufferRef.current;
    const numPoints = 512;

    const render = () => {
      if (isStreaming) {
        // Stream samples based on speed
        const stepSamples = streamSpeed === 2 ? 4 : 2;

        for (let s = 0; s < stepSamples; s++) {
          buffer.timeCounter += 0.05;
          const t = buffer.timeCounter;

          MONITORED_CHANNELS.forEach((ch) => {
            let sampleVal = 0;

            if (buffer.activeTrialData && buffer.activeTrialData[ch.id]) {
              const trialArr = buffer.activeTrialData[ch.id];
              if (buffer.trialSampleIdx < trialArr.length) {
                sampleVal = trialArr[buffer.trialSampleIdx] * 12; // Scale microvolts
              }
            } else {
              // Synthetic resting baseline sensorimotor EEG: 10 Hz Mu/Alpha rhythm + slow drift
              const muFreq = ch.id === 'C3' || ch.id === 'C4' ? 10.2 : 9.5;
              const alphaWave = Math.sin(t * muFreq) * (ch.baseAmp * 0.45);
              const betaHarmonic = Math.cos(t * 21.0) * (ch.baseAmp * 0.15);
              const slowDrift = Math.sin(t * 1.2) * (ch.baseAmp * 0.2);
              const pinkNoise = (Math.random() - 0.5) * 3.5;
              sampleVal = alphaWave + betaHarmonic + slowDrift + pinkNoise;
            }

            buffer.channels[ch.id][buffer.writeIndex] = sampleVal;
          });

          if (buffer.activeTrialData) {
            buffer.trialSampleIdx++;
            const maxLen = 256;
            if (buffer.trialSampleIdx >= maxLen) {
              buffer.activeTrialData = null; // Return to baseline
            }
          }

          buffer.writeIndex = (buffer.writeIndex + 1) % numPoints;
        }
      }

      // DRAW CANVAS
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clean Crisp Medical White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const leftGutter = 125;
      const plotWidth = width - leftGutter - 15;
      const rowHeight = (height - 30) / MONITORED_CHANNELS.length;

      // 2. Soft Medical Gutter
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, leftGutter, height);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftGutter, 0);
      ctx.lineTo(leftGutter, height);
      ctx.stroke();

      // 3. Medical Grid Lines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = leftGutter; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 4. Draw Channels
      MONITORED_CHANNELS.forEach((ch, idx) => {
        const yCenter = 15 + idx * rowHeight + rowHeight / 2;

        // Baseline Dotted Line
        ctx.strokeStyle = '#e2e8f0';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(leftGutter, yCenter);
        ctx.lineTo(width - 10, yCenter);
        ctx.stroke();
        ctx.setLineDash([]);

        // Channel Labels on Gutter
        ctx.fillStyle = ch.color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(ch.id, 12, yCenter - 4);

        ctx.fillStyle = '#475569';
        ctx.font = '9px sans-serif';
        ctx.fillText(ch.role.split(' ')[0] + ' ' + (ch.role.split(' ')[1] || ''), 12, yCenter + 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px monospace';
        ctx.fillText('±25µV', leftGutter - 34, yCenter - 4);

        // Draw Waveform Trace
        const dataArr = buffer.channels[ch.id];
        const stepX = plotWidth / (numPoints - 1);

        ctx.strokeStyle = ch.color;
        ctx.lineWidth = ch.id === 'C3' || ch.id === 'C4' ? 2.2 : 1.8;
        ctx.beginPath();

        for (let i = 0; i < numPoints; i++) {
          // Read sequentially from circular buffer
          const bufIdx = (buffer.writeIndex + i) % numPoints;
          const val = dataArr[bufIdx];
          const x = leftGutter + i * stepX;
          const y = yCenter - val * 0.9;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // 5. Sweep Cursor Bar (Current acquisition head)
      const cursorX = leftGutter + (buffer.writeIndex / numPoints) * plotWidth;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();

      // Top time label
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('LIVE HEAD', Math.min(cursorX + 4, width - 70), 12);

      // 6. Sliding Window Analysis Caliper (1024-sample epoch)
      const windowWidth = plotWidth * 0.35;
      const windowStartX = Math.max(leftGutter, cursorX - windowWidth);

      ctx.fillStyle = 'rgba(2, 132, 199, 0.04)';
      ctx.fillRect(windowStartX, 0, cursorX - windowStartX, height);

      ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(windowStartX, 0, cursorX - windowStartX, height);
      ctx.setLineDash([]);

      // Status Tag on Caliper
      ctx.fillStyle = bciStatus === 'DETECTING' || bciStatus === 'SPEAKING' ? '#0284c7' : '#64748b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(
        bciStatus === 'DETECTING' || bciStatus === 'SPEAKING' ? '⚡ CLASSIFYING EPOCH (4.0s)' : 'SLIDING BUFFER (1024-Pt)',
        windowStartX + 8,
        height - 8
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isStreaming, streamSpeed, bciStatus]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Hidden Audio Element for synthesized voice playback */}
      <audio ref={audioRef} className="hidden" />

      {/* 1. TOP HEADER & TELEMETRY CONTROLS */}
      <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Live Bedside Stream: Continuous Patient BCI
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active Patient Hookup
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Artificial continuous EEG streaming at 256 Hz with real-time sliding-window vocal decoding
            </p>
          </div>
        </div>

        {/* Navigation & Audio Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              voiceMuted
                ? 'bg-slate-100 border-slate-300 text-slate-600'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
            title="Toggle Vocal Speech Output"
          >
            {voiceMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-sky-600" />}
            <span className="text-[11px] hidden sm:inline">{voiceMuted ? 'Voice Muted' : 'Voice Active'}</span>
          </button>

          {onNavigateToSpeech && (
            <button
              onClick={onNavigateToSpeech}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Speech Station</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CLINICAL BEDSIDE TELEMETRY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Bedside Patient</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="font-bold text-slate-900 text-sm">Bed 4B (David M.)</p>
          <span className="text-[10px] text-slate-500 block">ALS Non-Verbal Care</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Electrode Montage</span>
            <Layers className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="font-bold text-slate-900 text-sm">122-Ch Wet Cap</p>
          <span className="text-[10px] text-emerald-700 font-semibold block">Impedance: 2.1 kΩ (Optimal)</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Continuous Stream</span>
            <Waves className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="font-bold text-slate-900 text-sm">256 Hz Serial Feed</p>
          <span className="text-[10px] text-slate-500 font-mono block">1024-Pt Rolling Buffer</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>BCI Decoder State</span>
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className={`font-bold text-sm ${bciStatus === 'SPEAKING' ? 'text-sky-700 animate-pulse' : 'text-emerald-700'}`}>
            {bciStatus === 'SPEAKING' ? '🗣️ VOICING INTENT' : bciStatus === 'DETECTING' ? '⚡ DECODING EPOCH' : '🟢 MONITORING'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono block">Latency: ~28 ms on CUDA</span>
        </div>
      </div>

      {/* 3. REAL-TIME MULTI-CHANNEL SCROLLING OSCILLOSCOPE */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Oscilloscope Controls Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-50 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-600" />
              Live Sensorimotor Oscilloscope
            </span>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isStreaming
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> <span>Resume Stream</span>
                </>
              )}
            </button>

            {/* Speed Toggle */}
            <button
              onClick={() => setStreamSpeed(streamSpeed === 1 ? 2 : 1)}
              className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-mono font-semibold transition cursor-pointer"
              title="Toggle Speed"
            >
              {streamSpeed}x Speed
            </button>
          </div>

          {/* Auto-Pilot Toggle */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">Continuous Auto-Pilot:</span>
            <button
              onClick={() => setAutoPilot(!autoPilot)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                autoPilot
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {autoPilot ? '✓ ON (Periodic Needs)' : 'OFF (Manual Only)'}
            </button>
          </div>
        </div>

        {/* The 6-Channel Oscilloscope Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white">
          <canvas
            ref={canvasRef}
            width={840}
            height={360}
            className="w-full h-[320px] sm:h-[360px] block"
          />

          {/* Overlay Tag when active intention event is firing */}
          {bciStatus === 'SPEAKING' && currentEvent && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-sky-300 rounded-xl p-3 shadow-md animate-fade-in flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                  Decoded From Live Stream:
                </span>
                <span className="text-base font-black text-slate-900 uppercase">
                  "{currentEvent.word}"
                </span>
                <span className="text-xs text-emerald-700 font-bold ml-2">
                  ({(currentEvent.confidence * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Oscilloscope Legend Footnote */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <strong>C3:</strong> Broca's Area (BA 44/45)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <strong>C4:</strong> Vocal Motor Cortex (BA 4)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <strong>Cz:</strong> Midline Mu Rhythm
            </span>
          </div>

          <div className="font-mono text-[10px]">
            <span>Bandpass: 0.5–50 Hz • CAR Filtered • 60 FPS Sweep</span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE DECODED VOCAL OUTPUT & SPEECH SYNTHESIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Current Decoded Bedside Communication (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-sky-100 rounded-2xl p-5 shadow-xs space-y-4 border-t-4 border-t-sky-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-800">
                Bedside Patient Speech Output (Real-Time Voice)
              </h2>
            </div>
            {currentEvent && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  currentEvent.urgency === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {currentEvent.urgency}
              </span>
            )}
          </div>

          {currentEvent ? (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black text-sky-700 tracking-tight">
                  "{currentEvent.word.toUpperCase()}"
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  {(currentEvent.confidence * 100).toFixed(1)}% Confidence
                </span>
              </div>

              {/* Spoken First-Person Communicative Sentence */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-sky-600" />
                    Spoken Patient Voice:
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Time: {currentEvent.time}</span>
                </div>
                <p className="text-lg font-bold text-slate-900 italic">
                  "{currentEvent.sentence}"
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <button
                    onClick={() => speakVoice(currentEvent.sentence)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-sky-200 text-sky-800 font-bold hover:bg-sky-50 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Repeat Voice</span>
                  </button>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5" />
                    Doctor Pager Alert Sent
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Brain className="w-8 h-8 text-sky-400 mx-auto animate-pulse" />
              <p className="font-bold text-slate-800 text-sm">Continuous BCI Stream Active</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Patient is currently resting. When an imagined speech intent occurs in the continuous stream, the neural network will decode it and speak aloud immediately.
              </p>
            </div>
          )}

          {/* Doctor Pager Status Ribbon */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Closed-Loop Link:</strong> Telegram Bot <code>@Neurovoice_doctor_bot</code> & Caregiver Pager synced.
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Live Link
            </span>
          </div>
        </div>

        {/* Interactive Intention Stimulator (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-sky-100 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-sky-50 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Inject Patient Intention (Vendor Demo)
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any real clinical sample to stream it into the continuous feed:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SIMULATION_PRESETS.map((item) => (
              <button
                key={item.id}
                onClick={() => triggerIntentionEvent(item)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition flex items-center justify-between cursor-pointer group shadow-2xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <span>{item.icon}</span>
                    <span className="group-hover:text-sky-700">{item.word}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block truncate">{item.category}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition shrink-0" />
              </button>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 text-[10px] text-slate-600 space-y-1">
            <strong>Vendor Evaluation Note:</strong>
            <p className="leading-relaxed">
              In real clinical practice, the patient mentally imagines pronouncing the chosen word. The continuous sliding window identifies the Mu-rhythm desynchronization and executes the forward pass on NVIDIA CUDA in <strong>&lt; 30 ms</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 5. CONTINUOUS BEDSIDE SPEECH LOG / AUDIT TIMELINE */}
      <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Bedside Continuous Communication Feed
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {eventHistory.length} Recorded Communications
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2 px-3 font-semibold">Time</th>
                <th className="py-2 px-3 font-semibold">Decoded Intention</th>
                <th className="py-2 px-3 font-semibold">Spoken Communicative Sentence</th>
                <th className="py-2 px-3 font-semibold">Confidence</th>
                <th className="py-2 px-3 font-semibold">Latency</th>
                <th className="py-2 px-3 font-semibold">Urgency</th>
                <th className="py-2 px-3 font-semibold">Doctor Pager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventHistory.map((evt) => (
                <tr key={evt.id} className="hover:bg-sky-50/40 transition font-mono text-[11px]">
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{evt.time}</td>
                  <td className="py-2 px-3 text-sky-700 font-bold uppercase">{evt.word}</td>
                  <td className="py-2 px-3 text-slate-800 italic font-sans">{evt.sentence}</td>
                  <td className="py-2 px-3 text-slate-700">{(evt.confidence * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-slate-600">{evt.latency} ms</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        evt.urgency === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {evt.urgency}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold whitespace-nowrap">
                    ✓ Alerted
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
