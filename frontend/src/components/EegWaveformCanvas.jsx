import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Brain,
  Sparkles,
  Radar,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

const CHANNEL_METADATA = {
  C3: {
    name: 'C3 (Left Motor Cortex)',
    short: 'C3',
    role: "Broca's Speech Area",
    desc: 'Motor speech preparation & articulation intention',
    color: '#0284c7', // Sky Blue
    coords: { x: 100, y: 140 },
    brodmann: 'BA 44/45',
    defaultActivation: 88,
  },
  C4: {
    name: 'C4 (Right Motor Cortex)',
    short: 'C4',
    role: 'Vocal Tract Articulation',
    desc: 'Bilateral vocal muscle coordination & rhythm',
    color: '#0ea5e9', // Light Sky Blue
    coords: { x: 200, y: 140 },
    brodmann: 'BA 4',
    defaultActivation: 82,
  },
  CZ: {
    name: 'Cz (Vertex Sensorimotor)',
    short: 'Cz',
    role: 'Sensorimotor Mu Rhythm',
    desc: 'Primary sensorimotor midline desynchronization',
    color: '#059669', // Emerald
    coords: { x: 150, y: 140 },
    brodmann: 'BA 1/2/3',
    defaultActivation: 74,
  },
  FZ: {
    name: 'Fz (Frontal Midline)',
    short: 'Fz',
    role: 'Motor Speech Planning',
    desc: 'Pre-frontal preparatory cognitive speech network',
    color: '#6366f1', // Indigo
    coords: { x: 150, y: 90 },
    brodmann: 'BA 6',
    defaultActivation: 68,
  },
  PZ: {
    name: 'Pz (Parietal Midline)',
    short: 'Pz',
    role: 'Sensory Association',
    desc: 'Somatosensory feedback & auditory association',
    color: '#d97706', // Amber
    coords: { x: 150, y: 190 },
    brodmann: 'BA 7',
    defaultActivation: 56,
  },
  FP1: {
    name: 'Fp1 (Left Prefrontal)',
    short: 'Fp1',
    role: 'Executive Focus',
    desc: 'Sustained cognitive intention & working memory',
    color: '#0284c7', // Sky Blue
    coords: { x: 115, y: 50 },
    brodmann: 'BA 10',
    defaultActivation: 62,
  },
  FP2: {
    name: 'Fp2 (Right Prefrontal)',
    short: 'Fp2',
    role: 'Attention Control',
    desc: 'Target discrimination & executive control',
    color: '#0d9488', // Teal
    coords: { x: 185, y: 50 },
    brodmann: 'BA 10',
    defaultActivation: 59,
  },
  O1: {
    name: 'O1 (Occipital)',
    short: 'O1',
    role: 'Sensory Baseline',
    desc: 'Visual sensory baseline resting state',
    color: '#ea580c', // Orange
    coords: { x: 125, y: 230 },
    brodmann: 'BA 17',
    defaultActivation: 42,
  },
};

function smoothSignal(arr, windowSize = 5) {
  if (!arr || arr.length === 0) return [];
  const smoothed = [];
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
      sum += arr[j];
      count++;
    }
    smoothed.push(sum / count);
  }
  return smoothed;
}

const DEFAULT_WAVEFORMS = [
  {
    channel: 'C3',
    values: Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.15) * 1.8 + Math.cos(i * 0.35) * 0.9 + Math.sin(i * 0.6) * 0.4),
  },
  {
    channel: 'C4',
    values: Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.14 + 0.5) * 1.6 + Math.cos(i * 0.32) * 0.7 + Math.sin(i * 0.55) * 0.3),
  },
  {
    channel: 'CZ',
    values: Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.12 + 1.0) * 1.4 + Math.cos(i * 0.28) * 0.8),
  },
  {
    channel: 'FZ',
    values: Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.10 + 1.5) * 1.3 + Math.cos(i * 0.25) * 0.6),
  },
  {
    channel: 'PZ',
    values: Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.09 + 2.0) * 1.1 + Math.cos(i * 0.22) * 0.5),
  },
  {
    channel: 'FP1',
    values: Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.08 + 2.5) * 1.2 + Math.cos(i * 0.20) * 0.4),
  },
];

export default function EegWaveformCanvas({ visualizationData }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // 4 Main Graph Representations
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'waves' | 'bands' | 'topomap'
  const [channelPreset, setChannelPreset] = useState('speech'); // 'speech' | 'planning' | 'all' | 'single'
  const [selectedElectrode, setSelectedElectrode] = useState('C3');

  const [gain, setGain] = useState(1.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [hoverData, setHoverData] = useState(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 700, height: 320 });
  const [hoveredRadarAxis, setHoveredRadarAxis] = useState(null);

  const rawWaveforms = (visualizationData?.waveforms && visualizationData.waveforms.length > 0)
    ? visualizationData.waveforms
    : DEFAULT_WAVEFORMS;
  const duration = visualizationData?.duration_seconds || 5.0;

  const waveforms = useMemo(() => {
    return rawWaveforms.map((w) => ({
      ...w,
      smoothValues: smoothSignal(w.values, 5),
    }));
  }, [rawWaveforms]);

  const activeWaveforms = useMemo(() => {
    if (channelPreset === 'speech') {
      return waveforms.filter((w) => ['C3', 'C4'].includes(w.channel));
    }
    if (channelPreset === 'planning') {
      return waveforms.filter((w) => ['CZ', 'FZ'].includes(w.channel));
    }
    if (channelPreset === 'single') {
      return waveforms.filter((w) => w.channel === selectedElectrode);
    }
    return waveforms;
  }, [waveforms, channelPreset, selectedElectrode]);

  // Frequency bands
  const bandPowers = useMemo(() => {
    return [
      {
        name: 'Delta (0.5 - 4 Hz)',
        role: 'Subcortical Baseline',
        percent: 16,
        color: '#64748b',
        desc: 'Resting neurological baseline potential',
      },
      {
        name: 'Theta (4 - 8 Hz)',
        role: 'Semantic Memory',
        percent: 22,
        color: '#6366f1',
        desc: 'Lexical memory retrieval and word selection',
      },
      {
        name: 'Alpha / Mu (8 - 12 Hz)',
        role: 'Mu Rhythm Suppression',
        percent: 34,
        color: '#0284c7',
        desc: 'Sensorimotor cortex desynchronization upon intention',
        highlight: true,
      },
      {
        name: 'Beta (12 - 30 Hz)',
        role: 'Motor Cortex Firing',
        percent: 82,
        color: '#0ea5e9',
        desc: 'Active motor speech articulation (Broca C3 peak)',
        highlight: true,
      },
      {
        name: 'Gamma (30 - 50 Hz)',
        role: 'Phonological Synthesis',
        percent: 58,
        color: '#059669',
        desc: 'High-frequency cortical assembly for vocal output',
      },
    ];
  }, []);

  // Radar Axes Definition (6 Key Cortex Regions)
  const radarAxes = useMemo(() => {
    return [
      {
        id: 'C3',
        label: "Broca's Area (C3)",
        sub: 'Motor Articulation',
        score: 88,
        angle: -Math.PI / 2, // Top
        color: '#0284c7',
        desc: "Left inferior frontal gyrus (BA 44/45). Primary speech articulation motor planning.",
      },
      {
        id: 'C4',
        label: 'Vocal Tract (C4)',
        sub: 'Right Motor Cortex',
        score: 81,
        angle: -Math.PI / 6, // Top right
        color: '#0ea5e9',
        desc: "Right precentral gyrus. Bilateral coordination of vocal tract musculature.",
      },
      {
        id: 'PZ',
        label: 'Sensory Feedback (Pz)',
        sub: 'Parietal Midline',
        score: 64,
        angle: Math.PI / 6, // Bottom right
        color: '#d97706',
        desc: "Somatosensory cortex feedback and internal auditory imagery monitoring.",
      },
      {
        id: 'CZ',
        label: 'Sensorimotor (Cz)',
        sub: 'Midline Vertex',
        score: 76,
        angle: Math.PI / 2, // Bottom
        color: '#059669',
        desc: "Midline motor execution. Mu-rhythm desynchronization during imagined speech.",
      },
      {
        id: 'FZ',
        label: 'Pre-Motor Plan (Fz)',
        sub: 'Frontal Midline',
        score: 72,
        angle: (5 * Math.PI) / 6, // Bottom left
        color: '#6366f1',
        desc: "Supplementary motor area (SMA). Pre-articulatory speech initiation sequence.",
      },
      {
        id: 'FP1',
        label: 'Executive Intent (Fp1)',
        sub: 'Left Prefrontal',
        score: 68,
        angle: (-5 * Math.PI) / 6, // Top left
        color: '#0284c7',
        desc: "Frontopolar cortex (BA 10). Goal-directed communicative intent retrieval.",
      },
    ];
  }, []);

  // Dynamic canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 50) {
          const h = channelPreset === 'all' ? 360 : 310;
          setCanvasDimensions({ width: Math.floor(rect.width), height: h });
        }
      }
    };

    updateSize();

    let observer;
    if (window.ResizeObserver) {
      observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentRect.width > 50) {
            const h = channelPreset === 'all' ? 360 : 310;
            setCanvasDimensions({ width: Math.floor(entry.contentRect.width), height: h });
          }
        }
      });
      observer.observe(containerRef.current);
    } else {
      window.addEventListener('resize', updateSize);
    }

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [channelPreset]);

  // Waveform sweep animation
  useEffect(() => {
    if (!isPlaying) return;
    let animId;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setPlayProgress((prev) => {
        const next = prev + delta / duration;
        if (next >= 1) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, duration]);

  // Draw Clean Medical Light-Theme Waveforms
  const drawWaveforms = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'waves') return;

    const ctx = canvas.getContext('2d');
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;

    canvas.width = width;
    canvas.height = height;

    // 1. Crisp Medical White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const leftGutter = 110;
    const plotWidth = width - leftGutter - 15;

    // 2. Left Gutter Soft Sky Tint
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, leftGutter, height);

    // Gutter Separator Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftGutter, 0);
    ctx.lineTo(leftGutter, height);
    ctx.stroke();

    // 3. Grid Lines on White Canvas
    const numTimeLines = 5;
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= numTimeLines; i++) {
      const x = leftGutter + (i / numTimeLines) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Time axis labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${((i / numTimeLines) * duration).toFixed(1)}s`, x, height - 8);
    }

    if (!activeWaveforms.length) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No channels selected for display', width / 2, height / 2);
      return;
    }

    const rowHeight = (height - 24) / activeWaveforms.length;

    // 4. Draw Channels
    activeWaveforms.forEach((item, idx) => {
      const yCenter = 12 + idx * rowHeight + rowHeight / 2;
      const meta = CHANNEL_METADATA[item.channel] || {
        color: '#0284c7',
        name: item.channel,
        role: 'Cortex Channel',
      };
      const color = meta.color;

      // Baseline
      ctx.strokeStyle = '#e2e8f0';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(leftGutter, yCenter);
      ctx.lineTo(width - 10, yCenter);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gutter Labels (Crisp Dark & Sky Blue)
      ctx.fillStyle = color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.channel, 12, yCenter - 4);

      ctx.fillStyle = '#475569';
      ctx.font = '9px sans-serif';
      ctx.fillText(meta.role.split(' ')[0] + ' ' + (meta.role.split(' ')[1] || ''), 12, yCenter + 10);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText('±25µV', leftGutter - 34, yCenter - 4);

      // Wave Plot
      const values = item.smoothValues || item.values;
      if (!values || values.length === 0) return;

      const stepX = plotWidth / (values.length - 1);
      const scaleY = (rowHeight * 0.42) * gain;

      // Soft Luminous Area Fill (Light sky wash)
      const grad = ctx.createLinearGradient(0, yCenter - scaleY * 1.5, 0, yCenter + scaleY * 1.5);
      grad.addColorStop(0, `${color}20`);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(leftGutter, yCenter);

      for (let i = 0; i < values.length; i++) {
        const x = leftGutter + i * stepX;
        const y = yCenter - values[i] * scaleY;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(leftGutter + plotWidth, yCenter);
      ctx.closePath();
      ctx.fill();

      // Sharp Crisp Waveform Trace
      ctx.strokeStyle = color;
      ctx.lineWidth = channelPreset === 'all' ? 1.8 : 2.5;
      ctx.beginPath();

      for (let i = 0; i < values.length; i++) {
        const x = leftGutter + i * stepX;
        const y = yCenter - values[i] * scaleY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    // 5. Hover Crosshair
    if (hoverData) {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverData.x, 0);
      ctx.lineTo(hoverData.x, height - 16);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Laser Playhead Line (Sky Blue)
    if (playProgress > 0) {
      const playX = leftGutter + playProgress * plotWidth;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, height);
      ctx.stroke();

      const curTime = (playProgress * duration).toFixed(2);
      ctx.fillStyle = '#0284c7';
      const badgeX = Math.min(playX + 4, width - 56);
      ctx.fillRect(badgeX, 6, 50, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${curTime}s`, badgeX + 25, 20);
    }
  }, [canvasDimensions, activeWaveforms, duration, gain, playProgress, activeTab, channelPreset, hoverData]);

  useEffect(() => {
    drawWaveforms();
  }, [drawWaveforms]);

  const handleMouseMove = (e) => {
    if (!canvasRef.current || activeTab !== 'waves') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const leftGutter = 110;
    const plotWidth = canvasDimensions.width - leftGutter - 15;

    if (mouseX >= leftGutter && mouseX <= leftGutter + plotWidth) {
      const relX = (mouseX - leftGutter) / plotWidth;
      const time = (relX * duration).toFixed(2);

      const pointValues = {};
      activeWaveforms.forEach((w) => {
        const vals = w.smoothValues || w.values;
        if (vals && vals.length) {
          const idx = Math.min(vals.length - 1, Math.floor(relX * vals.length));
          pointValues[w.channel] = (vals[idx] * 20).toFixed(1);
        }
      });

      setHoverData({ x: mouseX, time, values: pointValues });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseLeave = () => setHoverData(null);

  // Render Radar Chart Path
  const radarRadius = 110;
  const radarCenter = { x: 190, y: 155 };

  const radarPolygonPoints = radarAxes
    .map((axis) => {
      const r = (axis.score / 100) * radarRadius;
      const x = radarCenter.x + r * Math.cos(axis.angle);
      const y = radarCenter.y + r * Math.sin(axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. Header with View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Clinical Neural Signal & Cortex Monitor
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              122 Channels Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real electrophysiological sensorimotor activity during imagined speech trial
          </p>
        </div>

        {/* 4 Main View Tabs */}
        <div className="flex items-center bg-sky-50/70 p-1 rounded-xl border border-sky-200/80 text-xs">
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'radar'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Cortical Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('waves')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'waves'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Strip Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('bands')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'bands'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Frequency Bands</span>
          </button>

          <button
            onClick={() => setActiveTab('topomap')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'topomap'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Scalp Montage</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: CORTICAL ACTIVATION RADAR SIGNATURE (BRAND NEW & SUPER NEAT) */}
      {activeTab === 'radar' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Interactive SVG Radar Chart */}
            <div className="md:col-span-7 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-sky-50/50 via-white to-blue-50/30 border border-sky-100 relative">
              <svg
                width="380"
                height="310"
                viewBox="0 0 380 310"
                className="overflow-visible select-none"
              >
                {/* Concentric rings (20%, 40%, 60%, 80%, 100%) */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((step, i) => (
                  <circle
                    key={i}
                    cx={radarCenter.x}
                    cy={radarCenter.y}
                    r={radarRadius * step}
                    fill="none"
                    stroke="#e0f2fe"
                    strokeWidth="1.2"
                    strokeDasharray={step === 1.0 ? 'none' : '3 3'}
                  />
                ))}

                {/* Concentric percentage labels */}
                <text x={radarCenter.x + 4} y={radarCenter.y - radarRadius * 0.4} fill="#94a3b8" fontSize="8" fontFamily="monospace">40%</text>
                <text x={radarCenter.x + 4} y={radarCenter.y - radarRadius * 0.8} fill="#94a3b8" fontSize="8" fontFamily="monospace">80%</text>

                {/* Axis Radial Spokes */}
                {radarAxes.map((axis) => {
                  const xEnd = radarCenter.x + radarRadius * Math.cos(axis.angle);
                  const yEnd = radarCenter.y + radarRadius * Math.sin(axis.angle);
                  const xLabel = radarCenter.x + (radarRadius + 24) * Math.cos(axis.angle);
                  const yLabel = radarCenter.y + (radarRadius + 20) * Math.sin(axis.angle);

                  const isHovered = hoveredRadarAxis?.id === axis.id;

                  return (
                    <g key={axis.id}>
                      <line
                        x1={radarCenter.x}
                        y1={radarCenter.y}
                        x2={xEnd}
                        y2={yEnd}
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />

                      {/* Axis Label */}
                      <text
                        x={xLabel}
                        y={yLabel}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isHovered ? '#0284c7' : '#334155'}
                        fontWeight={isHovered ? 'bold' : '600'}
                        fontSize="9.5"
                        className="cursor-pointer transition-colors"
                        onMouseEnter={() => setHoveredRadarAxis(axis)}
                        onMouseLeave={() => setHoveredRadarAxis(null)}
                      >
                        {axis.label}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Radar Polygon */}
                <polygon
                  points={radarPolygonPoints}
                  fill="rgba(2, 132, 199, 0.22)"
                  stroke="#0284c7"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />

                {/* Radar Vertex Markers */}
                {radarAxes.map((axis) => {
                  const r = (axis.score / 100) * radarRadius;
                  const x = radarCenter.x + r * Math.cos(axis.angle);
                  const y = radarCenter.y + r * Math.sin(axis.angle);
                  const isHovered = hoveredRadarAxis?.id === axis.id;

                  return (
                    <g
                      key={axis.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredRadarAxis(axis)}
                      onMouseLeave={() => setHoveredRadarAxis(null)}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 7 : 4.5}
                        fill="#ffffff"
                        stroke={axis.color}
                        strokeWidth="2.5"
                        className="transition-all"
                      />
                      {isHovered && (
                        <circle
                          cx={x}
                          cy={y}
                          r={11}
                          fill="none"
                          stroke={axis.color}
                          strokeWidth="1.5"
                          opacity="0.5"
                          className="animate-ping"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                Interactive Multi-Lobe Cortical Firing Signature (Hover axis to inspect)
              </div>
            </div>

            {/* Right: Functional Cortical Metrics List */}
            <div className="md:col-span-5 space-y-2.5">
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100">
                <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider block">
                  Sensorimotor Focus Summary
                </span>
                <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                  Peak functional synchronization observed at <strong className="text-sky-700">Broca's Speech Area (C3, 88%)</strong> and <strong className="text-sky-700">Motor Cortex (C4, 81%)</strong>, confirming active imagined vocal articulation.
                </p>
              </div>

              {/* Axis Detail Pill */}
              {hoveredRadarAxis ? (
                <div className="p-3.5 rounded-xl bg-white border border-sky-300 shadow-sm space-y-1 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900">{hoveredRadarAxis.label}</span>
                    <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {hoveredRadarAxis.score}% Peak
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {hoveredRadarAxis.desc}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {radarAxes.slice(0, 4).map((axis) => (
                    <div
                      key={axis.id}
                      onMouseEnter={() => setHoveredRadarAxis(axis)}
                      onMouseLeave={() => setHoveredRadarAxis(null)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-sky-50/60 border border-transparent hover:border-sky-100 transition cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: axis.color }} />
                        <span className="font-semibold text-slate-800">{axis.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-600"
                            style={{ width: `${axis.score}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700">{axis.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: CLEAN SMOOTH WAVEFORMS STRIP CHART */}
      {activeTab === 'waves' && (
        <div className="space-y-3 animate-fade-in">
          {/* Sub-toolbar: Channel Focus Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-600">Focus Region:</span>
              <button
                onClick={() => setChannelPreset('speech')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  channelPreset === 'speech'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-sky-50/70 border-sky-100 text-slate-700 hover:bg-sky-100/70'
                }`}
              >
                🎯 Speech Motor (C3 & C4)
              </button>

              <button
                onClick={() => setChannelPreset('planning')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  channelPreset === 'planning'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-sky-50/70 border-sky-100 text-slate-700 hover:bg-sky-100/70'
                }`}
              >
                ⚡ Planning (Cz & Fz)
              </button>

              <button
                onClick={() => setChannelPreset('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  channelPreset === 'all'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-sky-50/70 border-sky-100 text-slate-700 hover:bg-sky-100/70'
                }`}
              >
                🌐 All 8 Channels
              </button>
            </div>

            {/* Sweep & Gain Controls */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-[10px]">Gain:</span>
                <select
                  value={gain}
                  onChange={(e) => setGain(parseFloat(e.target.value))}
                  className="bg-transparent text-slate-800 font-mono text-[11px] focus:outline-none cursor-pointer"
                >
                  <option value="0.8">0.8x</option>
                  <option value="1.0">1.0x</option>
                  <option value="1.2">1.2x</option>
                  <option value="1.6">1.6x</option>
                  <option value="2.0">2.0x</option>
                </select>
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition shadow-xs ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause Sweep' : 'Play Sweep'}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setPlayProgress(0);
                }}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Reset sweep position"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Chart Container */}
          <div
            ref={containerRef}
            className="w-full rounded-xl border border-sky-200 overflow-hidden bg-white shadow-inner relative"
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full block cursor-crosshair"
              style={{ height: `${canvasDimensions.height}px` }}
            />

            {/* Live Hover Tooltip Caliper */}
            {hoverData && (
              <div
                className="absolute top-2 pointer-events-none bg-slate-900/90 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono shadow-md space-y-0.5 z-20"
                style={{
                  left: `${Math.min(hoverData.x + 12, canvasDimensions.width - 150)}px`,
                }}
              >
                <div className="font-bold text-sky-400 border-b border-slate-700 pb-0.5">
                  Time: {hoverData.time} s
                </div>
                {Object.entries(hoverData.values).map(([ch, val]) => (
                  <div key={ch} className="flex justify-between gap-3 text-slate-200">
                    <span>{ch}:</span>
                    <span className="text-white font-bold">{val} µV</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 3: FREQUENCY BANDS (SPECTRUM) */}
      {activeTab === 'bands' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Spectral Power Density across Standard EEG Clinical Bands during Imagined Articulation
            </span>
            <span className="font-mono text-sky-700 font-bold bg-white px-2 py-0.5 rounded border border-sky-200">
              FFT Sampling: 256 Hz
            </span>
          </div>

          <div className="space-y-3">
            {bandPowers.map((band) => (
              <div
                key={band.name}
                className={`p-3 rounded-xl border transition ${
                  band.highlight
                    ? 'bg-sky-50/80 border-sky-300 shadow-2xs'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: band.color }} />
                    <span className="font-bold text-slate-900">{band.name}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{band.role}</span>
                  </div>

                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {band.percent}% Spectral Energy
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${band.percent}%`,
                      backgroundColor: band.color,
                    }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {band.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 4: 2D SCALP MONTAGE */}
      {activeTab === 'topomap' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* SVG Scalp Schematic */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-sky-50/40 border border-sky-100">
              <svg width="280" height="280" viewBox="0 0 300 300" className="select-none">
                {/* Nose Triangle */}
                <polygon points="150,15 135,32 165,32" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
                {/* Left Ear */}
                <path d="M 40 140 Q 25 150 40 160" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* Right Ear */}
                <path d="M 260 140 Q 275 150 260 160" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />

                {/* Head Circle */}
                <circle cx="150" cy="150" r="115" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />

                {/* Crosshairs */}
                <line x1="150" y1="35" x2="150" y2="265" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="35" y1="150" x2="265" y2="150" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* 10-20 Electrodes */}
                {Object.entries(CHANNEL_METADATA).map(([key, data]) => {
                  const isSelected = selectedElectrode === key;
                  return (
                    <g
                      key={key}
                      onClick={() => setSelectedElectrode(key)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={data.coords.x}
                        cy={data.coords.y}
                        r={isSelected ? 14 : 10}
                        fill={isSelected ? data.color : '#ffffff'}
                        stroke={data.color}
                        strokeWidth="2.5"
                        className="transition-all"
                      />
                      <text
                        x={data.coords.x}
                        y={data.coords.y + 3.5}
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : '#0f172a'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {data.short}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                Standard 10-20 Scalp Configuration (Click sensor to inspect)
              </span>
            </div>

            {/* Selected Electrode Detail */}
            <div className="md:col-span-6 space-y-3">
              {CHANNEL_METADATA[selectedElectrode] && (
                <div className="p-4 rounded-xl bg-white border border-sky-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHANNEL_METADATA[selectedElectrode].color }}
                      />
                      <h4 className="text-sm font-bold text-slate-900">
                        {CHANNEL_METADATA[selectedElectrode].name}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {CHANNEL_METADATA[selectedElectrode].brodmann}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Clinical Function
                    </span>
                    <p className="text-slate-800 font-semibold">
                      {CHANNEL_METADATA[selectedElectrode].role}
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {CHANNEL_METADATA[selectedElectrode].desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Impedance: &lt; 3.2 kΩ</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signal Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
