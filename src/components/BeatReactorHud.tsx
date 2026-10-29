import React, { useEffect, useState } from 'react';
import { audioBeatEngine, BeatFrameData } from '../utils/audioBeatEngine';
import {
  Zap,
  Sliders,
  MousePointer,
  Radio,
  Smartphone,
  Activity,
  Mic
} from 'lucide-react';

interface BeatReactorHudProps {
  isPlaying: boolean;
  tempoBpm: number;
  energy: number;
}

export const BeatReactorHud: React.FC<BeatReactorHudProps> = ({
  isPlaying,
  tempoBpm
}) => {
  const [frame, setFrame] = useState<BeatFrameData>(audioBeatEngine.getFrame());
  const [sensitivity, setSensitivity] = useState<number>(audioBeatEngine.getSensitivity());
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(audioBeatEngine.getSfxEnabled());
  const [isLiveAudio, setIsLiveAudio] = useState<boolean>(audioBeatEngine.getIsLiveAudioActive());

  useEffect(() => {
    let animId: number;
    let lastRender = 0;

    const loop = (timestamp: number) => {
      // Throttle React state updates to ~30fps for ultra-smooth rendering without taxing the CPU
      if (timestamp - lastRender > 30) {
        lastRender = timestamp;
        setFrame({ ...audioBeatEngine.getFrame() });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    audioBeatEngine.setSensitivity(val);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    audioBeatEngine.setSfxEnabled(next);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-black/60 border border-[#d946ef]/35 backdrop-blur-md relative overflow-hidden shadow-[0_0_30px_rgba(217,70,239,0.15)]">
      {/* Ambient background glow pulse synced to audio bass */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 bg-[#d946ef]/15 rounded-full blur-3xl pointer-events-none transition-all duration-75"
        style={{
          transform: `scale(${1 + frame.bass * 0.9})`,
          opacity: 0.15 + frame.beat * 0.45
        }}
      />

      {/* Top Header: Dynamic Mode Switcher (Cursor Interactive vs Music Visualizer) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-purple-500/20 gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full transition-transform duration-75 ${
              isPlaying
                ? 'bg-[#d946ef] shadow-[0_0_12px_#d946ef]'
                : 'bg-purple-500/50'
            }`}
            style={{
              transform: isPlaying ? `scale(${1 + frame.beat * 0.9})` : 'scale(1)'
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-white uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#d946ef]" />
                {isPlaying ? 'MUSIC VISUALIZATION MODE' : 'INTERACTIVE CURSOR MODE'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-purple-300/80 mt-0.5">
              {isPlaying ? (
                <span className="text-[#f472b6]">
                  &bull; 100% Music-Driven &bull; Locked to "{frame.trackTitle}" &bull; {frame.vortexMode.toUpperCase()} FLOW
                </span>
              ) : (
                <span className="text-purple-300 flex items-center gap-1">
                  <MousePointer className="w-3 h-3 text-[#d946ef] inline" />
                  Move mouse to steer 3D vortex center &amp; ripple water plane
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-purple-200 bg-purple-950/70 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
            <Radio className="w-3 h-3 text-[#d946ef]" />
            {isPlaying ? `${Math.round(tempoBpm || frame.bpm)} BPM &bull; FFT LOCK` : 'RESTING PULSE (64 BPM)'}
          </span>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <Smartphone className="w-3 h-3 text-emerald-400" />
            <span>BACKGROUND PLAY &bull; NOTIFICATION BAR</span>
          </span>
        </div>
      </div>

      {/* 8-Band Live Audio Spectrum Visualizer */}
      <div className="mb-4 p-3 rounded-2xl bg-black/40 border border-purple-500/20">
        <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 mb-2">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#d946ef]" />
            REAL-TIME 128-BIN FFT SPECTRUM &bull; ACOUSTIC SIGNATURE
          </span>
          <span className="text-white font-semibold">
            {isPlaying ? `PROFILE: #${frame.trackSeed.toString(16).slice(0, 6).toUpperCase()}` : 'MOUSE-AWARE IDLE'}
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5 h-12 items-end">
          {frame.spectrum.map((val, idx) => {
            const heightPercent = Math.min(100, Math.max(10, val * 100));
            return (
              <div key={idx} className="h-full bg-purple-950/40 rounded-lg flex flex-col justify-end p-0.5">
                <div
                  className="w-full rounded-md transition-all duration-75"
                  style={{
                    height: `${heightPercent}%`,
                    background:
                      idx < 2
                        ? 'linear-gradient(to top, #9333ea, #d946ef)'
                        : idx < 5
                        ? 'linear-gradient(to top, #d946ef, #f43f5e)'
                        : 'linear-gradient(to top, #ec4899, #fbcfe8)'
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-purple-400/60 mt-1.5 px-1">
          <span>30Hz (Sub)</span>
          <span>250Hz (Bass)</span>
          <span>1kHz (Mids)</span>
          <span>4kHz (Highs)</span>
          <span>16kHz (Shimmer)</span>
        </div>
      </div>

      {/* 4-Band Telemetry Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
        {/* Band 1: Sub-Bass */}
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/15">
          <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 mb-1.5">
            <span>SUB-BASS (KICK)</span>
            <span className="text-white font-semibold">{Math.round(frame.bass * 100)}%</span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-[#d946ef] to-[#f43f5e] transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(8, frame.bass * 100))}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-purple-400/60 mt-1 truncate">
            Mountain ridges &amp; core blast
          </div>
        </div>

        {/* Band 2: Mid-Range */}
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/15">
          <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 mb-1.5">
            <span>MID (VOX/CHORDS)</span>
            <span className="text-white font-semibold">{Math.round(frame.mid * 100)}%</span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(8, frame.mid * 100))}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-purple-400/60 mt-1 truncate">
            Spiral ribbons &amp; violet flare
          </div>
        </div>

        {/* Band 3: Treble */}
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/15">
          <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 mb-1.5">
            <span>TREBLE (HI-HATS)</span>
            <span className="text-white font-semibold">{Math.round(frame.treble * 100)}%</span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d946ef] to-[#f472b6] transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(8, frame.treble * 100))}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-purple-400/60 mt-1 truncate">
            Stardust sparkle shimmer
          </div>
        </div>

        {/* Band 4: Dynamic Intensity */}
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/15">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#f472b6] mb-1.5">
            <span>COMBINED PULSE</span>
            <span className="text-white font-semibold">{Math.round(frame.overallIntensity * 100)}%</span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-white transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(8, frame.overallIntensity * 100))}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-purple-400/60 mt-1 truncate">
            Liquid ripples &amp; camera jolt
          </div>
        </div>
      </div>

      {/* Controls & Background Playback Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-purple-500/15 text-xs">
        {/* Live Audio Input & SFX Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live YouTube Audio Sync (Mic/Speaker Capture) */}
          <button
            onClick={async () => {
              const active = await audioBeatEngine.toggleLiveAudioInput();
              setIsLiveAudio(active);
            }}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-[10px] font-mono ${
              isLiveAudio
                ? 'border-[#d946ef] text-[#f472b6] bg-[#d946ef]/20 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
                : 'border-purple-500/30 text-purple-300/80 bg-purple-950/40 hover:border-[#d946ef]/50'
            }`}
            title="Directly captures speaker audio so particles react with live hardware accuracy to YouTube"
          >
            <Mic className={`w-3.5 h-3.5 ${isLiveAudio ? 'text-[#f472b6] animate-pulse' : 'text-purple-400'}`} />
            <span>{isLiveAudio ? 'LIVE YOUTUBE MIC: ACTIVE' : 'SYNC LIVE YOUTUBE AUDIO'}</span>
          </button>

          {/* Interactive SFX Control with strict audio priority indicator */}
          {isPlaying ? (
            <div
              className="px-2.5 py-1.5 rounded-lg border border-purple-500/20 bg-purple-950/30 text-purple-300/80 flex items-center gap-1.5 text-[10px] font-mono select-none"
              title="Interactive sound effects are strictly muted during music playback"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>SFX MUTED (MUSIC PRIORITY)</span>
            </div>
          ) : (
            <button
              onClick={handleToggleSfx}
              className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-[10px] font-mono ${
                sfxEnabled
                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'border-white/10 text-purple-400/50 bg-black/40'
              }`}
              title={sfxEnabled ? 'Interactive crystal sound effects enabled for paused mode' : 'Interactive SFX disabled'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sfxEnabled ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-purple-600'
                }`}
              />
              <span>{sfxEnabled ? 'SFX ARMED' : 'SFX MUTED'}</span>
            </button>
          )}
        </div>

        {/* Visualizer Sensitivity Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-purple-400 uppercase flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#d946ef]" />
            INTENSITY:
          </span>
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-purple-500/20">
            {[
              { label: 'CALM', val: 0.8 },
              { label: 'BALANCED', val: 1.2 },
              { label: 'VIVID', val: 1.7 },
              { label: 'MAX', val: 2.2 }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleSensitivityChange(preset.val)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
                  Math.abs(sensitivity - preset.val) < 0.1
                    ? 'bg-[#d946ef] text-white font-semibold shadow-[0_0_8px_#d946ef]'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
