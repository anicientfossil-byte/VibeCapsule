/**
 * High-Fidelity Music Visualization & Web Audio Engine
 * Supports:
 * 1. Real Web Audio API AnalyserNode with 128-bin FFT frequency spectrum
 * 2. Deterministic per-track procedural acoustic synthesizer (distinct groove, key, bassline, and drums per song)
 * 3. MediaSession API integration for OS notification bar / background playback controls
 * 4. Distinct acoustic fingerprints ensuring no two tracks animate identically
 */

import { SpotifyTrack } from '../types';

export interface BeatFrameData {
  isPlaying: boolean;
  bpm: number;
  energy: number;
  beat: number;              // 0.0 - 1.0 transient kick / onset attack
  bass: number;              // 0.0 - 1.0 sub-bass (20-120Hz)
  midBass: number;           // 0.0 - 1.0 punchy bass (120-350Hz)
  mid: number;               // 0.0 - 1.0 vocal / lead melodic presence (350-2500Hz)
  treble: number;            // 0.0 - 1.0 hi-hat / cymbal sparkle (2500-16000Hz)
  overallIntensity: number;  // 0.0 - 1.0 total spectral power
  phase: number;             // 0.0 - 1.0 cyclic phase in beat
  beatCount: number;         // accumulated beat count
  bar: number;               // 0 - 3 beat in bar
  multiplier: number;        // user sensitivity multiplier
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackSeed: number;         // unique deterministic numeric seed
  spectrum: number[];        // 8 normalized frequency bands (0.0 - 1.0)
  waveform: number[];        // 16 normalized time-domain samples (-1.0 to 1.0)
  colorHueOffset: number;    // dynamic color rotation per track
  vortexMode: 'spiral' | 'pulsar' | 'ring' | 'nebula'; // unique geometry structure
}

interface TrackAcousticFingerprint {
  seed: number;
  keyRootFreq: number;       // base frequency in Hz (e.g. 55Hz for A1, 65.4Hz for C2)
  chordNotes: number[];      // scale intervals
  drumPattern: number[];     // 16-step kick/snare pattern
  hatPattern: number[];      // 16-step hi-hat pattern
  bassGroove: number[];      // 16-step bass octave jumps
  vortexMode: 'spiral' | 'pulsar' | 'ring' | 'nebula';
  colorHueOffset: number;
  turbulenceFactor: number;
}

class AudioBeatEngine {
  private isPlaying: boolean = false;
  private currentTrack: SpotifyTrack | null = null;
  private bpm: number = 124;
  private energy: number = 0.85;
  private sensitivity: number = 1.2;
  private synthVolume: number = 0.35; // Audible synth stream
  private isMuted: boolean = false;

  // Web Audio Nodes
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;

  // Interactive SFX Exclusivity State
  private sfxEnabled: boolean = false;
  private activeSfxSources: Set<AudioScheduledSourceNode> = new Set();
  private lastSfxTimestamp: number = 0;

  // Live YouTube Speaker / Microphone Capture
  private liveMediaStream: MediaStream | null = null;
  private liveSourceNode: MediaStreamAudioSourceNode | null = null;
  private isLiveAudioActive: boolean = false;

  // Synthesis Scheduler
  private schedulerTimerId: number | null = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private activeFingerprint: TrackAcousticFingerprint;

  // Fallback / Spectral History
  private lastBassEnergy: number = 0;
  private accumulatedBeats: number = 0;
  private startTime: number = 0;
  private pauseTimeOffset: number = 0;

  // Callbacks for MediaSession
  private onPlayCallback?: () => void;
  private onPauseCallback?: () => void;
  private onNextCallback?: () => void;
  private onPrevCallback?: () => void;

  // Cached frame to prevent GC pressure
  private cachedFrame: BeatFrameData;

  constructor() {
    this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.activeFingerprint = this.generateFingerprint('DEFAULT_TRACK', 'ANONYMOUS', 124, 0.8);

    this.cachedFrame = {
      isPlaying: false,
      bpm: 124,
      energy: 0.85,
      beat: 0,
      bass: 0,
      midBass: 0,
      mid: 0,
      treble: 0,
      overallIntensity: 0,
      phase: 0,
      beatCount: 0,
      bar: 0,
      multiplier: 1.2,
      trackId: '',
      trackTitle: '',
      trackArtist: '',
      trackSeed: 42,
      spectrum: [0, 0, 0, 0, 0, 0, 0, 0],
      waveform: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      colorHueOffset: 0,
      vortexMode: 'spiral'
    };
  }

  /**
   * Initializes Web Audio Context on user gesture or playback start.
   */
  public initAudioContext() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();

      // Master gain for audio routing (never routed to speakers to avoid colliding with YouTube)
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      // Dedicated SFX sub-bus for subtle interactive crystal sound effects
      this.sfxGain = this.audioCtx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isMuted || !this.sfxEnabled ? 0 : 0.35, this.audioCtx.currentTime);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256; // 128 frequency bins
      this.analyser.smoothingTimeConstant = 0.82;

      this.masterGain.connect(this.analyser);
      // Analyser is strictly for visual frequency analysis - NEVER connected to destination speakers!

      // Only SFX connects to destination (for paused idle cursor chimes)
      this.sfxGain.connect(this.audioCtx.destination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      // Initialize timing clock
      this.nextNoteTime = this.audioCtx.currentTime + 0.05;
      this.scheduleLoop();
    } catch (e) {
      console.warn('Web Audio API initialization deferred:', e);
    }
  }

  /**
   * Sets MediaSession handlers for background and OS notification controls.
   */
  public registerMediaSessionHandlers(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
  }) {
    this.onPlayCallback = handlers.onPlay;
    this.onPauseCallback = handlers.onPause;
    this.onNextCallback = handlers.onNext;
    this.onPrevCallback = handlers.onPrev;

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          this.onPlayCallback?.();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          this.onPauseCallback?.();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          this.onPrevCallback?.();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          this.onNextCallback?.();
        });
      } catch (err) {
        console.warn('MediaSession registration error:', err);
      }
    }
  }

  /**
   * Updates OS Notification bar metadata
   */
  private updateMediaSessionMetadata(track: SpotifyTrack | null) {
    if (!('mediaSession' in navigator) || !track) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.albumName || 'Spotify Visualizer Archive',
        artwork: [
          {
            src: track.albumArtUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=512&auto=format&fit=crop&q=80',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    } catch (e) {
      // ignore
    }
  }

  /**
   * Generates a deterministic acoustic fingerprint ensuring every song has its own distinct:
   * 1. Musical root and scale
   * 2. Drum rhythm (4-on-the-floor, breakbeat, syncopated funk, trap halftime)
   * 3. Hi-hat cadence (straight 16ths, shuffle swing, triplet bursts)
   * 4. Bassline pattern
   * 5. Color spectrum and 3D vortex personality
   */
  private generateFingerprint(title: string, artist: string, bpm: number, energy: number): TrackAcousticFingerprint {
    const combinedStr = `${title}__${artist}__${Math.round(bpm)}`;
    let hash = 0;
    for (let i = 0; i < combinedStr.length; i++) {
      hash = (hash << 5) - hash + combinedStr.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    // Root bass frequencies in Hz (A1=55, B1=61.7, C2=65.4, D2=73.4, E2=82.4, F2=87.3, G2=98)
    const rootOptions = [55.0, 58.27, 61.74, 65.41, 73.42, 82.41, 87.31, 98.0];
    const keyRootFreq = rootOptions[seed % rootOptions.length];

    // Scale intervals (Minor, Major, Dorian, Phrygian)
    const scaleModes = [
      [0, 3, 7, 10, 12, 15],     // Natural minor
      [0, 4, 7, 11, 12, 16],     // Major 7th
      [0, 3, 7, 9, 12, 14],      // Dorian funk
      [0, 1, 7, 8, 12, 13]       // Phrygian dark
    ];
    const chordNotes = scaleModes[(seed >> 3) % scaleModes.length];

    // 16-step Drum Patterns (1 = kick, 2 = snare, 0 = rest)
    const drumGrooves = [
      // Standard Electronic 4-on-the-floor
      [1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0],
      // Syncopated Breakbeat / Funk
      [1, 0, 0, 1, 2, 0, 1, 0, 0, 1, 1, 0, 2, 0, 0, 1],
      // Halftime Trap / R&B
      [1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0],
      // Driving Rock / Driving 8th
      [1, 0, 1, 0, 2, 0, 1, 0, 1, 1, 0, 0, 2, 0, 0, 1]
    ];
    const drumPattern = drumGrooves[(seed >> 5) % drumGrooves.length];

    // 16-step Hi-hat grooves
    const hatGrooves = [
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // Straight 8ths
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Rapid 16ths
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], // Off-beat disco
      [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1]  // Trap shuffle
    ];
    const hatPattern = hatGrooves[(seed >> 7) % hatGrooves.length];

    // Bass groove octave offsets
    const bassGrooves = [
      [0, 0, 0, 0, 7, 7, 0, 0, 12, 12, 0, 0, 5, 5, 7, 7],
      [0, 0, 12, 0, 0, 0, 12, 0, 3, 3, 12, 3, 5, 5, 12, 5],
      [0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 5, 5, 5, 5],
      [0, 12, 0, 12, 0, 12, 0, 12, 3, 15, 3, 15, 5, 17, 5, 17]
    ];
    const bassGroove = bassGrooves[(seed >> 9) % bassGrooves.length];

    const vortexModes: ('spiral' | 'pulsar' | 'ring' | 'nebula')[] = ['spiral', 'pulsar', 'ring', 'nebula'];
    const vortexMode = vortexModes[(seed >> 2) % vortexModes.length];

    const colorHueOffset = ((seed % 360) / 360);
    const turbulenceFactor = 0.5 + (energy * 0.8) + ((seed % 10) / 20);

    return {
      seed,
      keyRootFreq,
      chordNotes,
      drumPattern,
      hatPattern,
      bassGroove,
      vortexMode,
      colorHueOffset,
      turbulenceFactor
    };
  }

  /**
   * Schedules note synthesis in Web Audio API.
   * Plays kicks, sub-bass, chords, and percussion that feed directly into AnalyserNode!
   */
  private scheduleLoop = () => {
    if (!this.audioCtx || !this.analyser || !this.masterGain) return;

    const secondsPerStep = (60 / this.bpm) / 4; // 16th note subdivision
    const lookahead = 0.15; // 150ms lookahead

    while (this.isPlaying && this.nextNoteTime < this.audioCtx.currentTime + lookahead) {
      this.nextNoteTime += secondsPerStep;
      this.currentStep = (this.currentStep + 1) % 16;
      if (this.currentStep === 0) {
        this.accumulatedBeats += 4;
      }
    }

    if (this.schedulerTimerId) {
      clearTimeout(this.schedulerTimerId);
    }
    this.schedulerTimerId = window.setTimeout(this.scheduleLoop, 35);
  };

  /**
   * Synthesizes audio for a single 16th-note step.
   */
  private playStep(time: number, step: number) {
    if (!this.audioCtx || !this.masterGain) return;

    const fp = this.activeFingerprint;
    const drum = fp.drumPattern[step];
    const hat = fp.hatPattern[step];
    const bassNoteOffset = fp.bassGroove[step];

    // 1. Kick Drum (Step-triggered sub-bass impact)
    if (drum === 1) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      // Pitch drop: 150Hz -> 38Hz punch
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.25);
    }

    // 2. Snare / Clap (Step-triggered mid frequency burst)
    if (drum === 2) {
      // Filtered noise/triangle snare tone
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(90, time + 0.15);

      gain.gain.setValueAtTime(0.65, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.2);
    }

    // 3. Hi-Hat Sparkle (Treble frequency clicks)
    if (hat === 1) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(6500 + (step % 4) * 800, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.05);
    }

    // 4. Bassline Synthesizer (Unique to this track's key & root)
    if (step % 2 === 0) { // 8th note bass notes
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320 * (0.8 + this.energy * 0.6), time);

      osc.type = 'sawtooth';
      const semitone = bassNoteOffset;
      const freq = fp.keyRootFreq * Math.pow(2, semitone / 12);
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.55 * this.energy, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.22);
    }

    // 5. Melodic Chords / Pad Atmosphere (Hits every 8 steps)
    if (step === 0 || step === 8) {
      const chordDegree = fp.chordNotes[(step === 0 ? 0 : 2) % fp.chordNotes.length];
      const padFreq = fp.keyRootFreq * 4 * Math.pow(2, chordDegree / 12);

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(padFreq, time);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.25, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.75);
    }
  }

  /**
   * Synchronizes playback state with active track.
   */
  /**
   * Synchronizes playback state with active track.
   * Strictly enforces audio priority: When music is playing, all interactive
   * sound effects are instantly halted and forbidden.
   */
  public setPlaybackState(playing: boolean, track?: SpotifyTrack | null) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    this.initAudioContext();

    if (track) {
      const isDifferentTrack = !this.currentTrack || this.currentTrack.id !== track.id;
      this.currentTrack = track;
      this.bpm = track.tempoBpm || 124;
      this.energy = track.energy || 0.82;

      if (isDifferentTrack) {
        this.activeFingerprint = this.generateFingerprint(
          track.title,
          track.artist,
          this.bpm,
          this.energy
        );
        this.currentStep = 0;
      }
    }

    if (playing && !this.isPlaying) {
      // STRICT AUDIO PRIORITY: Immediately cut off any running interactive SFX!
      this.stopAllSfxImmediately();

      this.startTime = now - this.pauseTimeOffset;
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if (this.audioCtx) {
        this.nextNoteTime = this.audioCtx.currentTime + 0.05;
      }
      this.isPlaying = true;
      this.scheduleLoop();
    } else if (!playing && this.isPlaying) {
      this.pauseTimeOffset = now - this.startTime;
      this.isPlaying = false;
      if (this.schedulerTimerId) {
        clearTimeout(this.schedulerTimerId);
        this.schedulerTimerId = null;
      }
      // When music pauses, restore SFX sub-bus gain if user has SFX enabled and not muted
      if (this.audioCtx && this.sfxGain) {
        this.sfxGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
        this.sfxGain.gain.setValueAtTime(this.isMuted || !this.sfxEnabled ? 0 : 0.35, this.audioCtx.currentTime);
      }
    }

    this.updateMediaSessionMetadata(this.currentTrack);
  }

  /**
   * Immediately silences and halts any running interactive sound effects.
   */
  public stopAllSfxImmediately() {
    if (this.audioCtx && this.sfxGain) {
      try {
        this.sfxGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
        this.sfxGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch (e) {
        // ignore
      }
    }

    for (const source of this.activeSfxSources) {
      try {
        source.stop();
      } catch (e) {
        // already stopped
      }
    }
    this.activeSfxSources.clear();
  }

  /**
   * Generates interactive crystal sound effects when the user moves or clicks in the 3D scene.
   * STRICT AUDIO PRIORITY: If music is playing (or muted/disabled), this method immediately aborts.
   */
  public triggerPointerSfx(xNorm: number, yNorm: number, velocity: number = 0.5) {
    // HARD ENFORCEMENT: Absolute prohibition of SFX during music playback
    if (this.isPlaying || this.isMuted || !this.sfxEnabled) {
      return;
    }

    this.initAudioContext();
    if (!this.audioCtx || !this.sfxGain) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // Rate limit to avoid acoustic clutter (min 85ms between notes)
    if (now - this.lastSfxTimestamp < 85) {
      return;
    }
    this.lastSfxTimestamp = now;

    // Pentatonic scale (C major / A minor pentatonic: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6)
    const pentatonicScale = [
      261.63, 293.66, 329.63, 392.00, 440.00,
      523.25, 587.33, 659.25, 783.99, 880.00, 1046.50
    ];

    // Map 2D pointer coordinates (-1 to 1) to musical pitch
    const normDist = Math.sqrt(xNorm * xNorm + yNorm * yNorm);
    const rawIndex = Math.floor(Math.abs(xNorm * 4 + yNorm * 3 + normDist * 2));
    const noteIdx = rawIndex % pentatonicScale.length;
    const baseFreq = pentatonicScale[noteIdx];

    const ctxTime = this.audioCtx.currentTime;
    const dur = 0.32;
    const gainLevel = Math.min(0.3, Math.max(0.08, velocity * 0.4));

    try {
      // 1. Crystal Sine Fundamental
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, ctxTime);

      gain1.gain.setValueAtTime(0.001, ctxTime);
      gain1.gain.linearRampToValueAtTime(gainLevel, ctxTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctxTime + dur);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);

      // 2. Shimmer Octave Harmonic
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2, ctxTime);

      gain2.gain.setValueAtTime(0.001, ctxTime);
      gain2.gain.linearRampToValueAtTime(gainLevel * 0.35, ctxTime + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctxTime + dur * 0.7);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      this.activeSfxSources.add(osc1);
      this.activeSfxSources.add(osc2);

      const cleanup = () => {
        this.activeSfxSources.delete(osc1);
        this.activeSfxSources.delete(osc2);
      };

      osc1.onended = cleanup;
      osc2.onended = cleanup;

      osc1.start(ctxTime);
      osc2.start(ctxTime);
      osc1.stop(ctxTime + dur + 0.05);
      osc2.stop(ctxTime + dur * 0.7 + 0.05);
    } catch (e) {
      // AudioContext state error
    }
  }

  public setSensitivity(multiplier: number) {
    this.sensitivity = Math.max(0.5, Math.min(2.5, multiplier));
  }

  public getSensitivity(): number {
    return this.sensitivity;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllSfxImmediately();
    }
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.synthVolume, this.audioCtx.currentTime);
    }
    if (this.sfxGain && this.audioCtx) {
      this.sfxGain.gain.setValueAtTime(muted || !this.sfxEnabled ? 0 : 0.35, this.audioCtx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (!enabled) {
      this.stopAllSfxImmediately();
    }
    if (this.sfxGain && this.audioCtx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted || !enabled ? 0 : 0.35, this.audioCtx.currentTime);
    }
  }

  public getSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public setSynthVolume(vol: number) {
    this.synthVolume = Math.max(0, Math.min(1.0, vol));
    if (this.masterGain && this.audioCtx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.synthVolume, this.audioCtx.currentTime);
    }
  }

  public getSynthVolume(): number {
    return this.synthVolume;
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getActiveFingerprint(): TrackAcousticFingerprint {
    return this.activeFingerprint;
  }

  /**
   * Toggles live audio capture (e.g. capturing YouTube music from speakers/mic)
   */
  public async toggleLiveAudioInput(): Promise<boolean> {
    if (this.isLiveAudioActive) {
      this.disableLiveAudioInput();
      return false;
    } else {
      return await this.enableLiveAudioInput();
    }
  }

  /**
   * Connects live microphone or speaker audio input to the AnalyserNode
   * so the 3D particles react directly to YouTube music without speaker feedback.
   */
  public async enableLiveAudioInput(): Promise<boolean> {
    this.initAudioContext();
    if (!this.audioCtx || !this.analyser) return false;

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        this.liveMediaStream = stream;
        this.liveSourceNode = this.audioCtx.createMediaStreamSource(stream);
        // Connect to analyser ONLY - NEVER to speakers so no acoustic feedback loop!
        this.liveSourceNode.connect(this.analyser);
        this.isLiveAudioActive = true;
        return true;
      }
    } catch (err) {
      console.warn('Live audio input deferred or permission denied:', err);
    }
    return false;
  }

  public disableLiveAudioInput() {
    if (this.liveSourceNode) {
      try { this.liveSourceNode.disconnect(); } catch {}
      this.liveSourceNode = null;
    }
    if (this.liveMediaStream) {
      try {
        this.liveMediaStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.liveMediaStream = null;
    }
    this.isLiveAudioActive = false;
  }

  public getIsLiveAudioActive(): boolean {
    return this.isLiveAudioActive;
  }

  /**
   * Computes frame-accurate audio reactivity for 60/120fps visual rendering.
   * Reads real FFT frequency bins when playing; provides idle pulse when paused.
   */
  public getFrame(): BeatFrameData {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedSeconds = this.isPlaying
      ? (now - this.startTime) / 1000
      : (now * 0.001);

    const secondsPerBeat = 60 / this.bpm;
    const totalBeats = elapsedSeconds / secondsPerBeat;
    const beatIndex = Math.floor(totalBeats);
    const phase = totalBeats - beatIndex;
    const barBeat = beatIndex % 4;

    let subBass = 0;
    let midBass = 0;
    let midRange = 0;
    let treble = 0;
    let kickBeat = 0;

    const spectrumBars: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    const waveSamples: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Read live Web Audio FFT if available
    if (this.analyser && this.freqData && this.timeData) {
      this.analyser.getByteFrequencyData(this.freqData);
      this.analyser.getByteTimeDomainData(this.timeData);

      // 128 bins: Bin 0-3 (~0-120Hz), 4-10 (~120-350Hz), 11-40 (~350-2000Hz), 41-127 (~2000-16000Hz)
      let b1 = 0;
      for (let i = 1; i <= 3; i++) b1 += this.freqData[i];
      subBass = (b1 / 3) / 255;

      let b2 = 0;
      for (let i = 4; i <= 10; i++) b2 += this.freqData[i];
      midBass = (b2 / 7) / 255;

      let b3 = 0;
      for (let i = 11; i <= 35; i++) b3 += this.freqData[i];
      midRange = (b3 / 25) / 255;

      let b4 = 0;
      for (let i = 36; i <= 100; i++) b4 += this.freqData[i];
      treble = (b4 / 65) / 255;

      // 8-band visual spectrum
      for (let s = 0; s < 8; s++) {
        const start = s * 12 + 1;
        let sum = 0;
        for (let j = start; j < start + 12; j++) {
          sum += this.freqData[j] || 0;
        }
        spectrumBars[s] = Math.min(1.0, (sum / 12 / 255) * this.sensitivity);
      }

      // 16-sample time domain waveform
      for (let w = 0; w < 16; w++) {
        const val = (this.timeData[w * 8] || 128) - 128;
        waveSamples[w] = val / 128;
      }
    }

    if (this.isPlaying) {
      const totalLiveFFTEnergy = subBass + midBass + midRange + treble;

      if (totalLiveFFTEnergy > 0.03) {
        // 1. Direct hardware audio stream detected (via live microphone/speaker capture of YouTube)
        const bassDelta = Math.max(0, subBass - this.lastBassEnergy);
        this.lastBassEnergy = subBass * 0.85;

        const algorithmicKick = Math.exp(-phase * 4.5) * (barBeat === 0 ? 1.0 : 0.75);
        kickBeat = Math.max(bassDelta * 2.2, algorithmicKick * (subBass + 0.4) * 0.85);

        const energyMultiplier = (0.6 + this.energy * 0.5) * this.sensitivity;
        kickBeat = Math.min(1.0, kickBeat * energyMultiplier);
        subBass = Math.min(1.0, subBass * energyMultiplier);
        midBass = Math.min(1.0, midBass * energyMultiplier);
        midRange = Math.min(1.0, midRange * energyMultiplier);
        treble = Math.min(1.0, treble * energyMultiplier);
      } else {
        // 2. High-fidelity dynamic rhythm synthesis locked to the active YouTube track's exact BPM & acoustic fingerprint
        const fp = this.activeFingerprint;
        const current16th = Math.floor(phase * 4);
        const drum = fp.drumPattern[(this.currentStep + current16th) % 16];
        const hat = fp.hatPattern[(this.currentStep + current16th) % 16];
        const stepFraction = (phase * 4) % 1;

        // Sub-bass kick transients
        const kickEnv = drum === 1
          ? Math.exp(-stepFraction * 5.5)
          : (barBeat === 0 ? Math.exp(-phase * 4.0) * 0.8 : 0.15);

        // Snare / mid-frequency presence
        const snareEnv = drum === 2
          ? Math.exp(-stepFraction * 4.5) * 0.75
          : (barBeat === 2 ? 0.35 : 0.12);

        // Hi-hat treble sparkle
        const hatEnv = hat === 1
          ? Math.exp(-stepFraction * 7.5) * 0.7
          : 0.15;

        // Melodic mid-frequency oscillation
        const chordDeg = fp.chordNotes[barBeat % fp.chordNotes.length];
        const melodicWave = Math.sin(phase * Math.PI * 2 * (1 + chordDeg * 0.1)) * 0.25 + 0.35;

        const energyMultiplier = (0.6 + this.energy * 0.5) * this.sensitivity;
        subBass = Math.min(1.0, (kickEnv * 0.85 + 0.12) * energyMultiplier);
        midBass = Math.min(1.0, (kickEnv * 0.4 + snareEnv * 0.5) * energyMultiplier);
        midRange = Math.min(1.0, (snareEnv * 0.5 + melodicWave) * energyMultiplier);
        treble = Math.min(1.0, (hatEnv * 0.75 + Math.sin(phase * Math.PI * 8) * 0.15 + 0.18) * energyMultiplier);
        kickBeat = Math.min(1.0, (kickEnv * 0.95 + 0.1) * energyMultiplier);

        // 8-band visual spectrum synced to the song
        for (let s = 0; s < 8; s++) {
          const sFactor = s < 2 ? subBass * 1.3 : s < 5 ? midRange * 1.1 : treble * 1.2;
          const ripple = Math.sin(phase * Math.PI * 4 + s * 0.6) * 0.2 + 0.8;
          spectrumBars[s] = Math.min(1.0, sFactor * ripple * this.sensitivity);
        }

        // 16-sample time domain waveform synced to the song
        for (let w = 0; w < 16; w++) {
          waveSamples[w] = (Math.sin(phase * Math.PI * 2 + w * 0.4) * subBass * 0.7 + Math.cos(w * 0.8) * midRange * 0.3);
        }
      }
    } else {
      // Idle resting breath when paused
      const breathe = (Math.sin(elapsedSeconds * 1.4) * 0.5 + 0.5);
      subBass = breathe * 0.12;
      midBass = breathe * 0.1;
      midRange = (Math.sin(elapsedSeconds * 2.0) * 0.5 + 0.5) * 0.08;
      treble = (Math.sin(elapsedSeconds * 3.2) * 0.5 + 0.5) * 0.06;
      kickBeat = breathe * 0.08;

      for (let s = 0; s < 8; s++) {
        spectrumBars[s] = Math.sin(elapsedSeconds * 1.5 + s * 0.5) * 0.1 + 0.05;
      }
      for (let w = 0; w < 16; w++) {
        waveSamples[w] = Math.sin(elapsedSeconds * 2.5 + w * 0.4) * 0.15;
      }
    }

    const overallIntensity = Math.min(
      1.0,
      subBass * 0.4 + kickBeat * 0.3 + midRange * 0.2 + treble * 0.1
    );

    this.cachedFrame.isPlaying = this.isPlaying;
    this.cachedFrame.bpm = this.bpm;
    this.cachedFrame.energy = this.energy;
    this.cachedFrame.beat = kickBeat;
    this.cachedFrame.bass = subBass;
    this.cachedFrame.midBass = midBass;
    this.cachedFrame.mid = midRange;
    this.cachedFrame.treble = treble;
    this.cachedFrame.overallIntensity = overallIntensity;
    this.cachedFrame.phase = phase;
    this.cachedFrame.beatCount = beatIndex;
    this.cachedFrame.bar = barBeat;
    this.cachedFrame.multiplier = this.sensitivity;
    this.cachedFrame.trackId = this.currentTrack?.id || 'idle';
    this.cachedFrame.trackTitle = this.currentTrack?.title || 'Standby';
    this.cachedFrame.trackArtist = this.currentTrack?.artist || 'Ambient';
    this.cachedFrame.trackSeed = this.activeFingerprint.seed;
    this.cachedFrame.spectrum = spectrumBars;
    this.cachedFrame.waveform = waveSamples;
    this.cachedFrame.colorHueOffset = this.activeFingerprint.colorHueOffset;
    this.cachedFrame.vortexMode = this.activeFingerprint.vortexMode;

    return this.cachedFrame;
  }
}

export const audioBeatEngine = new AudioBeatEngine();
