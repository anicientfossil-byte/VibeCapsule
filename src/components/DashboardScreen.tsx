import React, { useState } from 'react';
import { SpotifyTrack, ImportedPlaylist } from '../types';
import { RetroCameraToggle } from './RetroCameraToggle';
import { BeatReactorHud } from './BeatReactorHud';
import { CircularCartridgeGallery } from './CircularCartridgeGallery';
import { fetchRealSpotifyPlaylist } from '../utils/spotifyFetcher';
import { DEMO_SONGS_ENABLED } from '../data/playlistPresets';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Youtube,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Volume2,
  Loader2,
  AlertCircle,
  Radio,
  Disc3,
  Sliders,
  Layers,
  Activity,
  Compass
} from 'lucide-react';

interface DashboardScreenProps {
  currentTrack: SpotifyTrack | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSkipEarly: () => void;
  onSelectTrack: (track: SpotifyTrack, index: number) => void;
  activePlaylist: ImportedPlaylist | null;
  onImportPlaylist: (playlist: ImportedPlaylist) => void;
  localSkipCount: number;
  privacyShieldActive: boolean;
  onTogglePrivacyShield: (active: boolean) => void;
  onOpenPkceModal: () => void;
  isSpotifyFreeTier: boolean;
  onToggleFreeTier: (isFree: boolean) => void;
  onPlayCurrentInYouTube: () => void;
  onPlayPlaylistInYouTube: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentTrack,
  currentTrackIndex,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSkipEarly,
  onSelectTrack,
  activePlaylist,
  onImportPlaylist,
  localSkipCount,
  privacyShieldActive,
  onTogglePrivacyShield,
  isSpotifyFreeTier,
  onToggleFreeTier,
  onPlayCurrentInYouTube,
  onPlayPlaylistInYouTube
}) => {
  const [spotifyUrlInput, setSpotifyUrlInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importNotice, setImportNotice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedPlaylist, setCopiedPlaylist] = useState<boolean>(false);
  const [isEmbeddedPlayerOpen, setIsEmbeddedPlayerOpen] = useState<boolean>(true);

  // Active track inside the active playlist based on the selected index
  const activeQueuedTrack: SpotifyTrack | null = activePlaylist
    ? activePlaylist.tracks[currentTrackIndex] || activePlaylist.tracks[0] || currentTrack
    : null;

  const currentVideoId = activeQueuedTrack?.youtubeVideoId || '';

  // Subsequent tracks to play sequentially in YouTube after the current song
  const subsequentTrackIds = activePlaylist
    ? activePlaylist.tracks
        .slice(currentTrackIndex + 1)
        .map((t) => t.youtubeVideoId)
        .filter((id): id is string => Boolean(id))
    : [];

  const priorTrackIds = activePlaylist
    ? activePlaylist.tracks
        .slice(0, currentTrackIndex)
        .map((t) => t.youtubeVideoId)
        .filter((id): id is string => Boolean(id))
    : [];

  const allQueuedAfterCurrent = [...subsequentTrackIds, ...priorTrackIds];
  const playlistQuery = allQueuedAfterCurrent.length > 0 ? `&playlist=${allQueuedAfterCurrent.join(',')}` : '';

  // Embedded URL specifically loads the currently selected track and queues the rest
  const embeddedContinuousUrl = currentVideoId
    ? `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1${playlistQuery}&enablejsapi=1`
    : '';

  // Continuous watch sequence URL starting from the currently selected track
  const orderedVideoIdsFromCurrent = currentVideoId
    ? [currentVideoId, ...allQueuedAfterCurrent]
    : allQueuedAfterCurrent;
  const continuousYouTubePlaylistUrl = orderedVideoIdsFromCurrent.length > 0
    ? `https://www.youtube.com/watch_videos?video_ids=${orderedVideoIdsFromCurrent.join(',')}`
    : '';

  const handleImportPlaylistSubmit = async () => {
    if (!spotifyUrlInput.trim()) {
      setErrorMessage('Please paste a Spotify playlist link or ID first.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setImportNotice('SYNCHRONIZING WITH SPOTIFY ARCHIVE // EXTRACTING STEMS & YOUTUBE STREAMS...');

    try {
      const playlist = await fetchRealSpotifyPlaylist(spotifyUrlInput.trim());
      onImportPlaylist(playlist);
      setImportNotice(`SUCCESS: Synchronized "${playlist.name}" (${playlist.tracks.length} compositions).`);
      setTimeout(() => setImportNotice(''), 4500);
    } catch (err: any) {
      console.error('Failed to import playlist:', err);
      setErrorMessage(err.message || 'Unable to resolve Spotify playlist. Please verify that the playlist is public.');
      setImportNotice('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPlaylistDirectInYouTube = () => {
    if (!activePlaylist || activePlaylist.tracks.length === 0) {
      setErrorMessage('No sonic capsule loaded. Paste a Spotify playlist link first.');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const videoIds = activePlaylist.tracks
      .map((t) => t.youtubeVideoId)
      .filter((id): id is string => Boolean(id));

    const playlistUrl = videoIds.length > 0
      ? `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(
          activePlaylist.tracks.map((t) => `${t.artist} ${t.title}`).join(' ')
        )}`;

    window.open(playlistUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPlaylistUrl = () => {
    if (!continuousYouTubePlaylistUrl) return;
    navigator.clipboard.writeText(continuousYouTubePlaylistUrl);
    setCopiedPlaylist(true);
    setTimeout(() => setCopiedPlaylist(false), 2000);
  };

  const handleOpenSingleTrackInYouTube = (track: SpotifyTrack) => {
    const videoId = track.youtubeVideoId;
    const singleUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title} audio`)}`;
    window.open(singleUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 relative">
      {/* 1. SPOTIFY FREE RESTRICTION NOTIFICATION BAR (AT TOP) */}
      <section
        data-scroll-section
        className="glass-panel-glow rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#d946ef]/40"
      >
        <div data-scroll-reveal className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#d946ef]/20 border border-[#d946ef]/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
            <ShieldAlert className="w-5 h-5 text-[#f472b6] animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#d946ef] uppercase">
              // BYPASS PROTOCOL ENGAGED
            </div>
            <span className="font-sans font-medium text-xs sm:text-sm tracking-wide text-white">
              Spotify free limitation restricted click play in YouTube
            </span>
          </div>
        </div>

        <div data-scroll-reveal className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => {
              if (activePlaylist && activePlaylist.tracks.length > 0) {
                onPlayPlaylistInYouTube();
              } else {
                setErrorMessage('Please load a Spotify playlist first.');
                setTimeout(() => setErrorMessage(''), 3500);
              }
            }}
            className="btn-luxury-primary px-4 py-2 rounded-xl text-xs font-sans font-semibold tracking-wide uppercase flex items-center gap-2"
            title="Open playlist in YouTube"
          >
            <Youtube className="w-4 h-4 fill-white" />
            <span>PLAY IN YOUTUBE</span>
          </button>
        </div>
      </section>

      {/* 2. GIVE SPOTIFY PLAYLIST // PLAY ALL IN YOUTUBE (SEQUENTIAL) */}
      <section
        data-scroll-section
        className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#d946ef]/10 via-[#a855f7]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div data-scroll-reveal className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-purple-500/15 gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#d946ef] uppercase tracking-widest flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d946ef] inline-block shadow-[0_0_8px_#d946ef] animate-pulse" />
              <span>SPATIAL AUDIO INGESTION &bull; CONTINUOUS SEQUENCE</span>
            </div>
            <h2 className="serif-display text-2xl sm:text-3xl text-white font-light tracking-tight">
              Give Spotify playlist <i>&rarr;</i> Play all in YouTube sequential
            </h2>
          </div>
          <span className="text-[11px] font-mono text-purple-200 bg-purple-950/60 px-3.5 py-1.5 rounded-full border border-purple-500/30 self-start sm:self-auto backdrop-blur-sm">
            {activePlaylist ? `ACTIVE ARCHIVE &bull; ${activePlaylist.tracks.length} TRACKS` : 'STATUS &bull; READY FOR INGEST'}
          </span>
        </div>

        {/* Input Form */}
        <form
          data-scroll-reveal
          onSubmit={(e) => {
            e.preventDefault();
            handleImportPlaylistSubmit();
          }}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Compass className="absolute left-4 top-3.5 w-4 h-4 text-purple-400/60" />
            <input
              type="text"
              value={spotifyUrlInput}
              onChange={(e) => setSpotifyUrlInput(e.target.value)}
              placeholder="Paste Spotify playlist URL: https://open.spotify.com/playlist/..."
              className="w-full pl-11 pr-4 py-3 bg-black/60 rounded-xl text-purple-100 border border-purple-500/25 text-xs sm:text-sm font-sans focus:outline-none focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] placeholder-purple-400/40 transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-luxury-secondary px-5 py-3 rounded-xl text-xs font-sans font-medium uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#d946ef] animate-spin" />
                  <span>RESOLVING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#d946ef]" />
                  <span>LOAD PLAYLIST</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handlePlayPlaylistDirectInYouTube}
              className="btn-luxury-primary px-5 py-3 rounded-xl text-xs font-sans font-semibold uppercase flex items-center justify-center gap-2"
              title="Launch full playlist sequentially in YouTube"
            >
              <Youtube className="w-4 h-4 fill-white" />
              <span>PLAY ON YOUTUBE</span>
            </button>
          </div>
        </form>

        {importNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-purple-950/40 border border-[#d946ef]/40 text-xs font-mono text-[#f472b6] flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#d946ef] shrink-0" />
            <span>{importNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </section>

      {/* 3. STATUS: CURRENT EMISSION */}
      <section
        data-scroll-section
        className="glass-panel rounded-3xl p-6 sm:p-8 relative"
      >
        <div data-scroll-reveal className="flex items-center justify-between pb-4 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-[#d946ef] animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-[#d946ef] uppercase">
              [STATUS: CURRENT EMISSION]
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSpotifyFreeTier && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-[#f472b6] font-mono uppercase">
                FREE BRIDGE
              </span>
            )}
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/60 text-purple-300 border border-purple-500/20 font-mono">
              {activeQueuedTrack ? activeQueuedTrack.playlistOriginContext : 'STANDBY'}
            </span>
          </div>
        </div>

        {activeQueuedTrack ? (
          <div data-scroll-reveal className="mt-6">
            <div className="space-y-2">
              <div className="serif-display text-3xl sm:text-4xl text-white font-light tracking-tight leading-tight">
                {activeQueuedTrack.title}
              </div>
              <div className="text-sm sm:text-base font-sans text-[#f472b6] flex items-center gap-2 font-medium">
                <span className="text-purple-400/60 text-xs font-mono">ARTIST //</span> {activeQueuedTrack.artist}
              </div>
              <div className="text-xs text-purple-300/70 font-mono">
                ALBUM RELEASE &bull; {activeQueuedTrack.albumName}
              </div>
            </div>

            {/* Audio Dynamics & Telemetry Gauges */}
            <div className="mt-6 pt-5 border-t border-purple-500/15 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20">
                  <div className="flex items-center justify-between text-purple-300 text-xs font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#d946ef]" />
                      TEMPO CADENCE
                    </span>
                    <span className="text-white font-sans font-semibold">{Math.round(activeQueuedTrack.tempoBpm)} BPM</span>
                  </div>
                  <div className="w-full bg-purple-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-[#d946ef] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (activeQueuedTrack.tempoBpm / 200) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20">
                  <div className="flex items-center justify-between text-[#f472b6] text-xs font-mono mb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#f472b6]" />
                      ENERGY RESONANCE
                    </span>
                    <span className="text-white font-sans font-semibold">{Math.round(activeQueuedTrack.energy * 100)}%</span>
                  </div>
                  <div className="w-full bg-purple-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#d946ef] to-[#f43f5e] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, activeQueuedTrack.energy * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Minimalist Playback Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={onTogglePlay}
                    className="btn-luxury-primary px-5 py-2.5 rounded-xl font-sans text-xs font-semibold uppercase flex items-center gap-2"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>

                  <button
                    onClick={onNextTrack}
                    className="btn-luxury-secondary px-4 py-2.5 rounded-xl font-sans text-xs uppercase flex items-center gap-1.5"
                    title="Next Track"
                  >
                    <span>NEXT</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={onPlayCurrentInYouTube}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-[#d946ef]/40 text-purple-100 font-sans text-xs font-medium uppercase flex items-center gap-2 transition-all"
                    title="Play current track in YouTube"
                  >
                    <Youtube className="w-4 h-4 text-[#d946ef]" />
                    <span>PLAY IN YOUTUBE</span>
                  </button>

                  <button
                    onClick={onSkipEarly}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-500/20 text-purple-300 font-sans text-xs uppercase transition-colors"
                    title="Skip Track"
                  >
                    SKIP
                  </button>
                </div>
              </div>

              {/* 3D Purple Animation Beat Reactor & Frequency Sync HUD */}
              <div className="pt-3">
                <BeatReactorHud
                  isPlaying={isPlaying}
                  tempoBpm={activeQueuedTrack.tempoBpm}
                  energy={activeQueuedTrack.energy}
                />
              </div>
            </div>
          </div>
        ) : (
          <div data-scroll-reveal className="py-8 text-center space-y-4">
            <div>
              <div className="serif-display text-2xl text-purple-300 font-light">
                No Current Emission &bull; <i>Dormant</i>
              </div>
              <div className="text-xs text-purple-400/60 mt-1 font-mono">
                Insert a Spotify playlist URL above to begin continuous stream resonance
              </div>
            </div>

            {/* Standby Beat Visualizer */}
            <div className="max-w-2xl mx-auto pt-2 text-left">
              <BeatReactorHud
                isPlaying={isPlaying}
                tempoBpm={120}
                energy={0.7}
              />
            </div>
          </div>
        )}
      </section>

      {/* 4. MECHANICAL HARDWARE CONFIGURATION PANEL */}
      <section
        data-scroll-section
        className="glass-panel rounded-3xl p-6 sm:p-8"
      >
        <div data-scroll-reveal className="pb-4 border-b border-purple-500/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#d946ef]" />
            <h3 className="serif-display text-xl sm:text-2xl text-white font-light">
              Hardware Parameters & Protocol Controls
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-500/30">
            SYSTEM CALIBRATION
          </span>
        </div>

        <div data-scroll-reveal className="mt-2 divide-y divide-purple-500/10">
          <RetroCameraToggle
            label="SPOTIFY FREE TIER FALLBACK ENGAGED"
            sublabel="Bypasses on-demand restriction blocks and reroutes playback intents directly to continuous YouTube media"
            checked={isSpotifyFreeTier}
            onCheckedChange={onToggleFreeTier}
          />
          <RetroCameraToggle
            label="ZERO_CLOUD LOCAL PRIVACY SHIELD"
            sublabel="Locks all telemetry locally within client memory; restricts persistent telemetry broadcasts to remote endpoints"
            checked={privacyShieldActive}
            onCheckedChange={onTogglePrivacyShield}
          />
        </div>
      </section>

      {/* 5. DEVICE METRICS DATA BLOCKS */}
      <section
        data-scroll-section
        className="grid grid-cols-1 sm:grid-cols-2 gap-5"
      >
        <div
          data-scroll-reveal
          className="glass-panel rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs font-mono text-purple-300 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-[#d946ef] animate-spin" />
              PLAYLIST QUEUE CAPACITY
            </span>
            {activePlaylist && activePlaylist.tracks.length > 0 && (
              <button
                onClick={handlePlayPlaylistDirectInYouTube}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#d946ef]/20 text-[#f472b6] border border-[#d946ef]/40 hover:bg-[#d946ef]/30 font-sans uppercase flex items-center gap-1.5 transition-all"
              >
                <Youtube className="w-3 h-3 text-[#d946ef]" />
                PLAY ALL
              </button>
            )}
          </div>
          <div className="serif-display text-5xl sm:text-6xl text-white font-light tracking-tight my-3">
            {activePlaylist ? String(activePlaylist.tracks.length).padStart(2, '0') : '00'}
          </div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-purple-400/70">
            COMPOSITIONS SYNCHRONIZED // READY FOR YOUTUBE
          </div>
        </div>

        <div
          data-scroll-reveal
          className="glass-panel rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="text-xs font-mono text-purple-300 uppercase tracking-wider flex items-center justify-between">
            <span>LOCAL AUDIT SKIPS</span>
            <span className="text-[10px] font-mono bg-purple-950/60 text-[#d946ef] px-2 py-0.5 rounded-full border border-purple-500/30">
              AUDIT ACTIVE
            </span>
          </div>
          <div className="serif-display text-5xl sm:text-6xl text-white font-light tracking-tight my-3">
            {String(localSkipCount).padStart(2, '0')}
          </div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-purple-400/70">
            EARLY TERMINATIONS // CLIENT SESSION LOG
          </div>
        </div>
      </section>

      {/* 6. TIME CAPSULE QUICK CARTRIDGE SELECTOR */}
      <section
        data-scroll-section
        className="glass-panel rounded-3xl p-6 sm:p-8"
      >
        <div data-scroll-reveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#d946ef]" />
            <span className="serif-display text-2xl sm:text-3xl text-white font-light">
              Time Capsule Quick Cartridge Selector
            </span>
            <span className="text-[11px] px-3 py-1 rounded-full bg-[#d946ef]/20 border border-[#d946ef]/40 text-[#f472b6] font-mono">
              {activePlaylist ? activePlaylist.tracks.length : DEMO_SONGS_ENABLED ? 6 : 0} CAPSULES
            </span>
          </div>
          <span className="text-xs text-purple-300/80 font-mono">
            {activePlaylist && activePlaylist.id !== 'vibe_capsule_active_session'
              ? 'Custom playlist synchronized • Scroll to preview, click on song to play'
              : DEMO_SONGS_ENABLED
                ? 'Starting Song: Blinding Lights (The Weeknd) • Scroll to preview, click on song to play'
                : 'No playlist loaded yet • Paste a Spotify link above to fill your capsules'}
          </span>
        </div>

        <div data-scroll-reveal className="mt-6">
          {!activePlaylist && !DEMO_SONGS_ENABLED ? (
            <div className="rounded-3xl border border-purple-500/20 bg-purple-950/20 px-6 py-16 text-center font-mono text-xs uppercase tracking-widest text-purple-300/70">
              No songs loaded // paste a Spotify playlist link above
            </div>
          ) : (
          <CircularCartridgeGallery
            tracks={activePlaylist ? activePlaylist.tracks : []}
            currentTrackIndex={currentTrackIndex}
            isPlaying={isPlaying}
            onSelectTrack={onSelectTrack}
            onOpenSingleTrackInYouTube={handleOpenSingleTrackInYouTube}
            isCustomPlaylistAdded={Boolean(activePlaylist && activePlaylist.id !== 'vibe_capsule_active_session')}
          />
          )}
        </div>
      </section>

      {/* 7. CONTINUOUS YOUTUBE PLAYER DECK */}
      <section
        data-scroll-section
        className="space-y-5"
      >
        {activePlaylist && activeQueuedTrack ? (
          <>
            {/* Master Action Banner */}
            <div
              data-scroll-reveal
              className="glass-panel-glow rounded-3xl p-6 sm:p-7 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-purple-500/20 text-xs font-mono text-purple-300">
                <span className="text-[#f472b6] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d946ef] inline-block shadow-[0_0_8px_#d946ef] animate-ping" />
                  YOUTUBE CONTINUOUS WATCH SEQUENCE
                </span>
                <span className="text-purple-200">
                  CARTRIDGE {currentTrackIndex + 1} OF {activePlaylist.tracks.length}
                </span>
              </div>

              <div className="my-4">
                <div className="serif-display text-2xl sm:text-3xl text-white font-light">
                  Now Queued: <i>{activeQueuedTrack.title}</i> ({activeQueuedTrack.artist})
                </div>
                <p className="text-xs sm:text-sm text-purple-300/80 mt-1.5 leading-relaxed font-sans">
                  Clicking "PLAY ALL IN YOUTUBE NOW" activates YouTube's sequential watch queue starting from {activeQueuedTrack.title}.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    if (continuousYouTubePlaylistUrl) {
                      window.open(continuousYouTubePlaylistUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      handlePlayPlaylistDirectInYouTube();
                    }
                  }}
                  className="btn-luxury-primary flex-1 py-3 px-5 rounded-xl text-xs font-sans font-semibold uppercase flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>PLAY ALL IN YOUTUBE NOW (SEQUENTIAL)</span>
                </button>

                <button
                  onClick={handleCopyPlaylistUrl}
                  disabled={!continuousYouTubePlaylistUrl}
                  className="btn-luxury-secondary py-3 px-5 rounded-xl text-xs font-sans font-medium uppercase flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {copiedPlaylist ? <Check className="w-4 h-4 text-[#d946ef]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPlaylist ? 'COPIED LINK!' : 'COPY CONTINUOUS LINK'}</span>
                </button>
              </div>
            </div>

            {/* In-App Embedded Continuous YouTube Player with Next / Prev */}
            <div
              data-scroll-reveal
              className="glass-panel rounded-3xl p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-purple-500/15 gap-2">
                <span className="serif-display text-xl text-white font-light flex items-center gap-2.5 truncate">
                  <Volume2 className="w-4 h-4 text-[#d946ef] shrink-0" />
                  In-App Continuous Stream &bull; ({currentTrackIndex + 1}/{activePlaylist.tracks.length}: {activeQueuedTrack.title})
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsEmbeddedPlayerOpen(!isEmbeddedPlayerOpen)}
                    className="text-xs font-mono text-[#f472b6] hover:underline uppercase"
                  >
                    {isEmbeddedPlayerOpen ? '[MINIMIZE SCREEN]' : '[EXPAND SCREEN]'}
                  </button>
                </div>
              </div>

              {/* Sequential Prev / Next Jump Buttons */}
              <div className="mb-4 pb-3 border-b border-purple-500/15 flex items-center justify-between text-xs">
                <button
                  onClick={onPrevTrack}
                  disabled={currentTrackIndex === 0}
                  className="btn-luxury-secondary px-4 py-2 rounded-xl disabled:opacity-40 font-sans text-xs flex items-center gap-1.5"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>PREV SONG</span>
                </button>
                <span className="font-sans text-xs text-purple-200 truncate px-3 text-center">
                  CURRENT: <span className="text-[#f472b6] font-medium">{activeQueuedTrack.title}</span>
                </span>
                <button
                  onClick={onNextTrack}
                  disabled={currentTrackIndex === activePlaylist.tracks.length - 1}
                  className="btn-luxury-primary px-4 py-2 rounded-xl disabled:opacity-40 font-sans text-xs flex items-center gap-1.5"
                >
                  <span>NEXT SONG</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {isEmbeddedPlayerOpen ? (
                <div>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/80 border border-purple-500/25 relative shadow-2xl">
                    {currentVideoId ? (
                      <iframe
                        key={`${activePlaylist.id}-${currentTrackIndex}-${currentVideoId}`}
                        src={embeddedContinuousUrl}
                        title={`Sequential YouTube Playlist - ${activeQueuedTrack.title}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-200 text-xs p-6 text-center font-mono">
                        Searching YouTube stream for {activeQueuedTrack.title}... Click "PLAY IN YOUTUBE" above.
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-purple-300/70 flex items-center justify-between font-mono">
                    <span className="truncate pr-3">
                      &bull; UP NEXT: {activePlaylist.tracks[currentTrackIndex + 1]?.title || 'Loop to beginning'}
                    </span>
                    <span className="text-[#d946ef] shrink-0 text-[11px]">
                      SELECT ANY CARTRIDGE TO INSTANT-SEEK
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-black/40 border border-purple-500/20 text-center text-xs text-purple-300 font-mono">
                  STREAM MINIMIZED. CLICK "[EXPAND SCREEN]" ABOVE TO RESTORE IN-APP VIEW.
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            data-scroll-reveal
            className="glass-panel rounded-3xl p-8 text-center"
          >
            <div className="serif-display text-2xl text-purple-300 font-light">
              YouTube Playback Engine &bull; Standby
            </div>
            <p className="text-xs text-purple-400/60 mt-2 font-mono">
              No songs loaded. Enter a Spotify playlist URL above to generate continuous YouTube watch stream.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
