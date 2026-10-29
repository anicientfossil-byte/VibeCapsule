import * as React from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import { SpotifyTrack } from '../types';
import { DEFAULT_PLAYLIST } from '../data/playlistPresets';
import { Play, ExternalLink, ChevronLeft, ChevronRight, Radio, Music, MousePointer } from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export interface CircularCartridgeGalleryProps {
  tracks: SpotifyTrack[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (track: SpotifyTrack, index: number) => void;
  onOpenSingleTrackInYouTube: (track: SpotifyTrack) => void;
  isCustomPlaylistAdded?: boolean;
}

/* Ratios relative to the stage container box, calibrated for responsive luxury viewport */
const CARD_H = 0.44; // active card height ÷ stage height
const CARD_AR = 0.75; // active card is 3:4 portrait aspect ratio
const GAP = 0.045; // gap ÷ card width
const STRIP_TOP = 0.45; // strip's shared top edge down the stage
const LABEL = 0.022; // mono label ÷ stage height
const PAD = 0.04; // stage horizontal padding
const RAIL = 0.22; // position progress rail width

/* Subtle film grain overlay */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

// Deterministic track accent hues matching the website's purple/magenta palette
const TRACK_ACCENTS = [
  '#9333ea', // Purple
  '#d946ef', // Fuchsia / Magenta
  '#a855f7', // Violet
  '#f43f5e', // Rose
  '#7e22ce', // Deep Purple
  '#ec4899', // Pink
];

export const CircularCartridgeGallery: React.FC<CircularCartridgeGalleryProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
  onOpenSingleTrackInYouTube,
  isCustomPlaylistAdded = false,
}) => {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [dragging, setDragging] = React.useState(false);

  // If no playlist was added yet, fallback directly to default starting tracks
  const displayTracks =
    tracks && tracks.length > 0 ? tracks : DEFAULT_PLAYLIST.tracks;

  // Track focused card index independently from the playing track.
  // Scrolling changes ONLY the focused card preview and NEVER plays the song.
  // Only an explicit click on the song will start playback.
  const [focusedIndex, setFocusedIndex] = React.useState<number>(currentTrackIndex);

  // Synchronize when active track changes externally (e.g. Next / Prev buttons in the player)
  React.useEffect(() => {
    setFocusedIndex(currentTrackIndex);
  }, [currentTrackIndex]);

  const reduced = useReducedMotion();
  const last = Math.max(0, displayTracks.length - 1);
  const index = clamp(focusedIndex, 0, last);

  // Helper to retrieve the image of each song from the playlist (or YouTube thumbnail / high-res cover fallback)
  const getSongImage = React.useCallback((track: SpotifyTrack, i: number) => {
    if (track.albumArtUrl && track.albumArtUrl.startsWith('http')) {
      return track.albumArtUrl;
    }
    if (track.youtubeVideoId) {
      return `https://i.ytimg.com/vi/${track.youtubeVideoId}/hqdefault.jpg`;
    }
    const FALLBACKS = [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
    ];
    return FALLBACKS[i % FALLBACKS.length];
  }, []);

  // Shift focus for preview ONLY. Does NOT start playing the song.
  const shiftFocus = React.useCallback(
    (next: number) => {
      let targetIdx = next;
      if (targetIdx > last) targetIdx = 0;
      if (targetIdx < 0) targetIdx = last;
      setFocusedIndex(targetIdx);
    },
    [last]
  );

  // Explicit user click to play the song
  const handlePlaySong = React.useCallback(
    (track: SpotifyTrack, i: number) => {
      setFocusedIndex(i);
      onSelectTrack(track, i);
    },
    [onSelectTrack]
  );

  // ResizeObserver reads the stage geometry so every element scales perfectly
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const read = () => setBox({ w: stage.clientWidth, h: stage.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const fullH = clamp(box.h * CARD_H, 140, 240);
  const halfH = fullH / 2;
  const cardW = fullH * CARD_AR;
  const gap = Math.max(8, Math.round(cardW * GAP));
  const step = cardW + gap;
  const pad = Math.max(16, Math.round(box.w * PAD));
  const label = Math.max(10, Math.round(box.h * LABEL));

  // Centre the focused card: the track slides, the card unfurls at its shared top edge
  const xFor = React.useCallback(
    (i: number) => box.w / 2 - (i * step + cardW / 2),
    [box.w, step, cardW]
  );

  const x = useMotionValue(0);
  const target = xFor(index);

  const spring = reduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 32, mass: 0.9 };

  const swing = reduced
    ? { duration: 0 }
    : { duration: 0.65, ease: 'easeOut' as const };

  React.useEffect(() => {
    if (dragging) return;
    const run = animate(x, target, spring);
    return () => run.stop();
  }, [target, dragging, reduced, x]); // eslint-disable-line react-hooks/exhaustive-deps

  // Physical wheel & trackpad scroll listener:
  // Scrolling changes ONLY the focused card preview and NEVER starts playing the song.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let until = 0;

    const onWheel = (e: WheelEvent) => {
      // Prevent browser default page scrolling while hovering inside the cartridge selector
      e.preventDefault();
      e.stopPropagation();

      const now = performance.now();
      if (now < until) return;

      // Detect dominant physical scroll vector: vertical wheel or horizontal swipe
      const dominant =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(dominant) < 12) return;

      const direction = dominant > 0 ? 1 : -1;
      shiftFocus(index + direction);
      until = now + 240; // 240ms tactile cooldown per physical scroll step
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [shiftFocus, index]);

  const active = displayTracks[index] || displayTracks[0];
  const activeCoverUrl = getSongImage(active, index);
  const lines = active ? active.title.split('\n') : ['Sonic Capsule'];
  const accent = TRACK_ACCENTS[index % TRACK_ACCENTS.length];

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isStartingSong = !isCustomPlaylistAdded && index === 0;
  const isCurrentlyPlaying = isPlaying && currentTrackIndex === index;

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      data-lenis-prevent="true"
      role="group"
      aria-roledescription="carousel"
      aria-label="Time Capsule Cartridge Carousel"
      onKeyDown={(e) => {
        const keys: Record<string, number> = {
          ArrowLeft: index === 0 ? last : index - 1,
          ArrowRight: index === last ? 0 : index + 1,
          Home: 0,
          End: last,
        };
        if (!(e.key in keys)) return;
        e.preventDefault();
        shiftFocus(keys[e.key]);
      }}
      className={cn(
        'relative h-[480px] sm:h-[520px] w-full overflow-hidden rounded-3xl select-none',
        'border border-purple-500/25 bg-[#05030a]/80 backdrop-blur-xl',
        'outline-none focus-visible:ring-1 focus-visible:ring-[#d946ef]/60'
      )}
    >
      {/* ── Background: the focused song photo blown up and graded to the website's purple palette ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={swing}
        >
          {activeCoverUrl ? (
            <motion.img
              src={activeCoverUrl}
              alt={active.title}
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ scale: reduced ? 1.25 : 1.35 }}
              animate={{ scale: 1.25 }}
              transition={reduced ? { duration: 0 } : { duration: 6, ease: 'linear' }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#120826] via-[#1e0e38] to-[#05030a]" />
          )}

          {/* Graded into the site's signature purple/magenta colors */}
          <div
            className="absolute inset-0 opacity-80"
            style={{ backgroundColor: accent, mixBlendMode: 'color' }}
          />
          <div
            className="absolute inset-0 opacity-70"
            style={{ backgroundColor: '#05030a', mixBlendMode: 'multiply' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient wash + subtle film grain */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05030a]/85 via-[#05030a]/40 to-[#05030a]/95 pointer-events-none" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
      />

      {/* ── Top Bar: Navigation Controls & Guidance ── */}
      <div
        className="absolute inset-x-0 flex items-center justify-between z-20"
        style={{
          top: Math.max(14, box.h * 0.032),
          paddingLeft: pad,
          paddingRight: pad,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d946ef] shadow-[0_0_8px_#d946ef] animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-[#d946ef] uppercase">
            {isStartingSong
              ? `STARTING SONG • CAPSULE #01/${String(displayTracks.length).padStart(2, '0')}`
              : `CARTRIDGE #${String(index + 1).padStart(2, '0')}/${String(displayTracks.length).padStart(2, '0')}`}
          </span>
          {isStartingSong && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#d946ef]/20 border border-[#d946ef]/40 text-[9px] font-mono text-[#f472b6]">
              DEFAULT STARTING CARTRIDGE
            </span>
          )}
        </div>

        {/* Stepper buttons and scroll guidance */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftFocus(index === 0 ? last : index - 1)}
            className="p-1.5 rounded-xl border border-purple-500/30 bg-black/50 text-purple-200 hover:border-[#d946ef] hover:text-white transition-all shadow-sm"
            title="Previous Capsule (Scroll preview only)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="px-2.5 py-1 rounded-xl border border-purple-500/25 bg-black/50 text-[10px] font-mono text-purple-300 flex items-center gap-1.5 select-none"
            title="Scroll wheel previews cartridges; clicking a card starts playback"
          >
            <MousePointer className="w-3 h-3 text-[#d946ef]" />
            <span className="hidden sm:inline">SCROLL TO PREVIEW • CLICK CARD TO PLAY</span>
            <span className="sm:hidden">SCROLL PREVIEW</span>
          </div>

          <button
            type="button"
            onClick={() => shiftFocus(index === last ? 0 : index + 1)}
            className="p-1.5 rounded-xl border border-purple-500/30 bg-black/50 text-purple-200 hover:border-[#d946ef] hover:text-white transition-all shadow-sm"
            title="Next Capsule (Scroll preview only)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Headline Block: sitting above the strip's shared top edge ── */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col justify-end z-10"
        style={{
          height: `${STRIP_TOP * 100}%`,
          paddingLeft: pad,
          paddingRight: pad,
          paddingBottom: Math.round(box.h * 0.026),
        }}
      >
        <div className="flex w-full flex-wrap items-end justify-between gap-x-6 gap-y-2">
          {/* Animated Headline with line wipe */}
          <div className="max-w-xl">
            {isStartingSong && (
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#f472b6] mb-1">
                STARTING SONG &bull; CLICK TO PLAY
              </div>
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h2
                key={index}
                className="serif-display text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-[0.95] tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
              >
                {lines.map((line, lineIdx) => (
                  <span key={lineIdx} className="block overflow-hidden">
                    <motion.span
                      className="block truncate"
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { duration: 0.58, delay: lineIdx * 0.06, ease: [0.22, 1, 0.36, 1] }
                      }
                    >
                      {line}
                    </motion.span>
                  </span>
                ))}
              </motion.h2>
            </AnimatePresence>

            <motion.p
              key={`artist-${index}`}
              className="text-xs sm:text-sm font-sans text-purple-200/90 tracking-wide mt-1 truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              By <span className="text-[#f472b6] font-medium">{active.artist}</span>
              {isStartingSong && (
                <span className="ml-2 text-[10px] font-mono text-purple-400/80">
                  (Default starting track &bull; Paste Spotify URL to customize)
                </span>
              )}
            </motion.p>
          </div>

          {/* Right-aligned facts metadata & Click to Play buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-purple-300/80">
              <span className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/25">
                {Math.round(active.tempoBpm)} BPM
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/25">
                {formatDuration(active.durationMs)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenSingleTrackInYouTube(active)}
              className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/30 text-purple-200 font-mono text-[11px] flex items-center gap-1.5 transition-all"
              title="Open currently focused track on YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d946ef]" />
              <span className="hidden sm:inline">VIEW ON</span> YOUTUBE
            </button>

            {/* Click to Play Button */}
            <button
              type="button"
              onClick={() => handlePlaySong(active, index)}
              className="btn-luxury-primary px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold uppercase flex items-center gap-1.5 shadow-md"
              title="Click to play this song"
            >
              {isCurrentlyPlaying ? (
                <>
                  <Music className="w-3.5 h-3.5 animate-bounce" />
                  <span>PLAYING</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>CLICK TO PLAY</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── The Filmstrip: One shared top edge, the focused card unfurls to full height ── */}
      <div
        className="absolute inset-x-0 z-20"
        style={{ top: `${STRIP_TOP * 100}%`, height: fullH }}
      >
        <motion.div
          className="flex items-start"
          style={{ gap, x, cursor: dragging ? 'grabbing' : 'grab' }}
          drag="x"
          dragMomentum={false}
          dragElastic={0.08}
          dragConstraints={{ left: xFor(last), right: xFor(0) }}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            setDragging(false);
            const thrown = x.get() + info.velocity.x * 0.12;
            let targetIdx = Math.round((box.w / 2 - thrown - cardW / 2) / step);
            targetIdx = clamp(targetIdx, 0, last);
            shiftFocus(targetIdx);
          }}
        >
          {displayTracks.map((track, i) => {
            const isFocused = i === index;
            const isSongPlaying = isPlaying && i === currentTrackIndex;
            const isCardStartingSong = !isCustomPlaylistAdded && i === 0;
            const trackCoverUrl = getSongImage(track, i);

            return (
              <motion.button
                key={track.id ?? i}
                type="button"
                aria-label={`Play ${track.title} by ${track.artist}`}
                aria-current={isFocused}
                onClick={() => handlePlaySong(track, i)}
                className={cn(
                  'relative shrink-0 overflow-hidden rounded-xl border transition-all group text-left cursor-pointer',
                  isFocused
                    ? 'border-[#d946ef] shadow-[0_0_25px_rgba(217,70,239,0.4)] ring-1 ring-[#d946ef]/60 bg-black/80'
                    : 'border-purple-500/20 bg-black/60 hover:border-purple-400/50'
                )}
                style={{ width: cardW }}
                animate={{ height: isFocused ? fullH : halfH }}
                transition={spring}
              >
                {/* 3:4 aspect portrait image of each song from playlist */}
                {trackCoverUrl ? (
                  <img
                    src={trackCoverUrl}
                    alt={track.title}
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: '50% 26%' }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#120826] to-[#05030a]" />
                )}

                {/* Unfocused cards sit back slightly with subtle dark veil */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-[#05030a]"
                  animate={{ opacity: isFocused ? 0 : 0.32 }}
                  transition={spring}
                />

                {/* Subtle dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                {/* Active playback or Click-to-Play beacon */}
                {isSongPlaying ? (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#d946ef] text-[9px] font-mono text-white shadow-[0_0_6px_#d946ef]">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  </div>
                ) : isFocused ? (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-1.5 py-0.5 rounded-full bg-[#d946ef]/80 hover:bg-[#d946ef] text-[8px] font-mono text-white flex items-center gap-1 shadow-sm">
                      <Play className="w-2 h-2 fill-white" />
                      <span>CLICK TO PLAY</span>
                    </span>
                  </div>
                ) : isCardStartingSong ? (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-900/80 border border-purple-500/40 text-[8px] font-mono text-[#f472b6]">
                      START
                    </span>
                  </div>
                ) : null}

                {/* Micro-label on card */}
                <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
                  <div className="text-[10px] font-mono text-[#f472b6] uppercase tracking-wider flex items-center justify-between">
                    <span>#{String(i + 1).padStart(2, '0')}</span>
                    {isCardStartingSong && (
                      <span className="text-[8px] text-pink-300 font-sans tracking-normal">STARTING SONG</span>
                    )}
                  </div>
                  <div className="text-xs font-sans font-medium text-white truncate leading-tight">
                    {track.title}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Position Rail: Progress bar & Counter ── */}
      <div
        className="absolute z-20"
        style={{ left: pad, bottom: Math.max(14, box.h * 0.024), width: box.w * RAIL }}
      >
        <div
          className="flex justify-between font-mono tabular-nums text-purple-300/80"
          style={{ fontSize: label }}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span className="text-purple-400/50">/</span>
          <span>{String(displayTracks.length).padStart(2, '0')}</span>
        </div>
        <div className="relative mt-1.5 h-1 w-full rounded-full bg-purple-950/60 border border-purple-500/20 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[#9333ea] to-[#d946ef] shadow-[0_0_8px_#d946ef]"
            style={{ width: `${100 / displayTracks.length}%` }}
            animate={{ left: `${(index / displayTracks.length) * 100}%` }}
            transition={spring}
          />
        </div>
      </div>
    </div>
  );
};
