import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Download } from 'lucide-react';
import { api } from '../services/api';

export default function AudioPlayer({ audioUrl, sentence }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const fullUrl = api.resolveAudioUrl(audioUrl);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (audioUrl) {
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error('Audio playback error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-3.5 flex flex-col gap-2.5">
      <audio
        ref={audioRef}
        src={fullUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      <div className="flex items-center justify-between gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white flex items-center justify-center shadow-sm shadow-sky-200 transition-transform active:scale-95 shrink-0"
          title={isPlaying ? 'Pause Speech' : 'Play Synthesized Voice'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Audio Visualizer Wave Simulation */}
        <div className="flex-1 flex items-center gap-1 h-8 px-2 bg-white rounded-lg border border-sky-100 overflow-hidden shadow-2xs">
          {Array.from({ length: 28 }).map((_, i) => {
            const height = isPlaying
              ? Math.sin(i * 0.4 + currentTime * 8) * 12 + 14
              : (i % 4) * 3 + 6;
            return (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isPlaying ? 'bg-sky-500' : 'bg-slate-300'
                }`}
                style={{ height: `${Math.max(4, height)}px` }}
              />
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-2xs"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-2xs"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-sky-600" />}
          </button>

          {fullUrl && (
            <a
              href={fullUrl}
              download="synthesized_speech.mp3"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-2xs"
              title="Download Audio File"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Scrubber & Time */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
