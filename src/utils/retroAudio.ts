/**
 * Vintage Mechanical Camera Shutter & Precision Detent Synthesizer
 * Uses physical modeling and high-precision Web Audio PCM buffers to synthesize
 * the iconic, deeply satisfying two-stage mechanical camera shutter release ("ka-chik"),
 * precision spring-loaded metal leaf blades, and analog rangefinder curtain detents.
 * Zero external audio files required, zero latency, runs offline, 100% responsive.
 */

import { audioBeatEngine } from './audioBeatEngine';

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let shutterBuffers: AudioBuffer[] = [];
let bufferVariationIndex = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes an authentic mechanical camera shutter release AudioBuffer.
 * Models:
 * 1. Stage 1 ("Ka"): Mirror release detent, brass blade snap, and alloy chassis resonance
 * 2. Stage 2 ("Chik"): Curtain blade travel & clockwork escapement gear ring ~26ms later
 * 3. Soft analog saturation (tanh) for warm, tactile, high-end mechanical acoustics
 */
function createCameraShutterBuffer(ctx: AudioContext, variation: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.082; // 82ms total mechanical envelope
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  // Micro-variations across shutter variations
  const curtainOffsets = [0.024, 0.028, 0.025, 0.030];
  const curtainOffset = curtainOffsets[variation % curtainOffsets.length];
  const pitchFactor = [1.0, 1.04, 0.98, 1.02][variation % 4];

  // 3-pole Paul Kellet pink noise filter state (natural acoustic friction)
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  const getPinkNoise = () => {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    return (b0 + b1 + b2 + white * 0.5362) * 0.45;
  };

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // --- STAGE 1: MIRROR LIFT & LEAF BLADE RELEASE ("KA") at t = 0 ---
    if (t < 0.036) {
      // 1A. High-frequency brass leaf blade snap impulse
      const snapEnv = Math.exp(-t / 0.0032);
      const bladeNoise = getPinkNoise() * snapEnv * 0.85;
      const bladePing = Math.sin(2 * Math.PI * 5200 * pitchFactor * t) * snapEnv * 0.38;

      // 1B. Camera alloy chassis "thock" (metal body low-mid resonance)
      const bodyEnv = Math.exp(-t / 0.015);
      const bodyFreq = (240 * Math.exp(-t / 0.008) + 140) * pitchFactor;
      const bodyThock = Math.sin(2 * Math.PI * bodyFreq * t) * bodyEnv * 0.72;

      // 1C. Metallic leaf spring resonance
      const ringEnv = Math.exp(-t / 0.009);
      const metalRing =
        (Math.sin(2 * Math.PI * 2900 * pitchFactor * t) * 0.28 +
          Math.sin(2 * Math.PI * 1450 * pitchFactor * t) * 0.22) *
        ringEnv;

      sample += bladeNoise + bladePing + bodyThock + metalRing;
    }

    // --- STAGE 2: SHUTTER CURTAIN STOP & ESCAPEMENT DETENT ("CHIK") at t = curtainOffset ---
    if (t >= curtainOffset) {
      const dt = t - curtainOffset;
      if (dt < 0.046) {
        // 2A. Curtain stop impact (crisp metal contact)
        const clackEnv = Math.exp(-dt / 0.0038);
        const clackNoise = getPinkNoise() * clackEnv * 0.72;
        const clackPing = Math.sin(2 * Math.PI * 3800 * pitchFactor * dt) * clackEnv * 0.42;

        // 2B. Clockwork escapement tine ring (delicate vintage mechanical gear tooth buzz)
        const tineEnv = Math.exp(-dt / 0.022);
        const tineRing = Math.sin(2 * Math.PI * 2240 * pitchFactor * dt) * tineEnv * 0.24;

        // 2C. Secondary bottoming-out thud
        const catchEnv = Math.exp(-dt / 0.012);
        const catchThud = Math.sin(2 * Math.PI * 185 * pitchFactor * dt) * catchEnv * 0.38;

        sample += clackNoise + clackPing + tineRing + catchThud;
      }
    }

    // Warm analog tape-style soft saturation (eliminates digital harshness, adds rich body)
    channel[i] = Math.tanh(sample * 1.55) * 0.65;
  }

  return buffer;
}

function ensureShutterBuffers(ctx: AudioContext): AudioBuffer[] {
  if (shutterBuffers.length === 0) {
    shutterBuffers = [
      createCameraShutterBuffer(ctx, 0),
      createCameraShutterBuffer(ctx, 1),
      createCameraShutterBuffer(ctx, 2),
      createCameraShutterBuffer(ctx, 3),
    ];
  }
  return shutterBuffers;
}

export type ClickType = 'camera' | 'shutter' | 'heavy' | 'light' | 'toggle';

/**
 * Plays an authentic retro camera shutter click
 */
export function playRetroCameraClick() {
  if (!soundEnabled || audioBeatEngine.getIsMuted()) {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const buffers = ensureShutterBuffers(ctx);
    const buffer = buffers[bufferVariationIndex % buffers.length];
    bufferVariationIndex++;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Output gain with micro-volume dynamics (±3%)
    const gainNode = ctx.createGain();
    const volume = 0.58 + (Math.random() - 0.5) * 0.05;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(ctx.currentTime);

    // Subtle tactile haptic impulse for mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore vibration errors
      }
    }
  } catch {
    // Graceful fallback if Web Audio is restricted
  }
}

/**
 * Universal click helper that routes all button presses to the retro camera shutter
 */
export function playRetroClick(_type?: ClickType) {
  playRetroCameraClick();
}

/**
 * Initializes global pointerdown listener on the window.
 * Every button, clickable role, input, and toggle will automatically emit an authentic retro camera click!
 */
export function initGlobalRetroClickListener() {
  if (typeof window === 'undefined') return () => {};

  let lastClickTime = 0;

  const handleGlobalPointerDown = (event: PointerEvent | MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element or any parent is a clickable button, toggle, link, or tab
    const clickable = target.closest(
      'button, [role="button"], [role="switch"], [role="tab"], input[type="checkbox"], input[type="submit"], input[type="button"], a[href], .retro-clickable, .btn-luxury-primary, .btn-luxury-secondary, .cursor-pointer'
    );

    if (clickable) {
      const now = performance.now();
      // Debounce duplicate events within 45ms (e.g. pointerdown followed by click)
      if (now - lastClickTime < 45) {
        return;
      }
      lastClickTime = now;

      playRetroCameraClick();
    }
  };

  // Capture phase ensures immediate zero-latency auditory feedback on button contact
  window.addEventListener('pointerdown', handleGlobalPointerDown as EventListener, true);
  return () => {
    window.removeEventListener('pointerdown', handleGlobalPointerDown as EventListener, true);
  };
}

export function isRetroAudioActive(): boolean {
  return soundEnabled;
}

export function setRetroAudioActive(enabled: boolean) {
  soundEnabled = enabled;
}
