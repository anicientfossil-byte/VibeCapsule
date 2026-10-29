import React, { useState, useEffect, useRef } from 'react';
import { SpotifyTrack, SessionLog, ImportedPlaylist } from './types';
import { DashboardScreen } from './components/DashboardScreen';
import { SpotifyPkceModal } from './components/SpotifyPkceModal';
import { SurrealScene } from './components/SurrealScene';
import { Key, Radio, ArrowDown, Sparkles } from 'lucide-react';
import { initGlobalRetroClickListener } from './utils/retroAudio';
import { initSmoothScrollWithGsap, registerScrollEntranceAnimations } from './utils/scrollAnimation';
import { audioBeatEngine } from './utils/audioBeatEngine';

import { DEFAULT_PLAYLIST, DEMO_SONGS_ENABLED } from './data/playlistPresets';
import { handleRedirectCallback } from './utils/spotifyAuth';

export default function App() {
  const [activePlaylist, setActivePlaylist] = useState<ImportedPlaylist | null>(DEMO_SONGS_ENABLED ? DEFAULT_PLAYLIST : null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [localSkipCount, setLocalSkipCount] = useState<number>(0);
  const [privacyShieldActive, setPrivacyShieldActive] = useState<boolean>(true);
  const [isSpotifyFreeTier, setIsSpotifyFreeTier] = useState<boolean>(true);
  const [isPkceModalOpen, setIsPkceModalOpen] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string>('');

  const [, setSessions] = useState<SessionLog[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Finish Spotify login if this page load is the OAuth redirect back from Spotify
  useEffect(() => {
    handleRedirectCallback().then((r) => {
      if (r.error) setAuthNotice(r.error);
      else if (r.handled) setIsPkceModalOpen(true);
    });
  }, []);

  // Global retro mechanical switch sound engine (all buttons produce tactile audio)
  useEffect(() => {
    const cleanup = initGlobalRetroClickListener();
    return cleanup;
  }, []);

  // Smooth Scrolling (Lenis) & GSAP ScrollTrigger Integration
  useEffect(() => {
    const scrollController = initSmoothScrollWithGsap();
    const revertEntrance = registerScrollEntranceAnimations();

    return () => {
      revertEntrance();
      scrollController.destroy();
    };
  }, [activePlaylist]);

  const currentTrack: SpotifyTrack | null = activePlaylist
    ? activePlaylist.tracks[currentTrackIndex] || activePlaylist.tracks[0] || null
    : null;

  // Synchronize audio beat engine with active playback state and full acoustic track profile
  useEffect(() => {
    audioBeatEngine.setPlaybackState(isPlaying, currentTrack);
  }, [isPlaying, currentTrack]);

  // Register OS notification bar & background media playback controls via MediaSession API
  useEffect(() => {
    audioBeatEngine.registerMediaSessionHandlers({
      onPlay: () => {
        if (activePlaylist && activePlaylist.tracks.length > 0) {
          setIsPlaying(true);
        }
      },
      onPause: () => setIsPlaying(false),
      onNext: handleNextTrack,
      onPrev: handlePrevTrack
    });
  }, [activePlaylist, currentTrackIndex]);

  // Synchronize music visualization state with embedded YouTube iframe player events
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;
        if (data.event === 'onStateChange' || (data.info !== undefined && typeof data.info === 'number')) {
          const state = data.info;
          if (state === 1) {
            // YT.PlayerState.PLAYING
            setIsPlaying(true);
          } else if (state === 2 || state === 0) {
            // YT.PlayerState.PAUSED or ENDED
            setIsPlaying(false);
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, []);

  const handleTogglePlay = () => {
    if (!activePlaylist || activePlaylist.tracks.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    if (!activePlaylist || activePlaylist.tracks.length === 0) return;
    if (currentTrackIndex < activePlaylist.tracks.length - 1) {
      setCurrentTrackIndex((prev) => prev + 1);
    } else {
      setCurrentTrackIndex(0);
    }
  };

  const handlePrevTrack = () => {
    if (!activePlaylist || activePlaylist.tracks.length === 0) return;
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1);
    }
  };

  const handleSkipEarly = () => {
    if (!activePlaylist || !currentTrack) return;
    setLocalSkipCount((prev) => prev + 1);
    setSessions((prev) => [
      {
        sessionId: prev.length + 1,
        trackId: currentTrack.id,
        trackTitle: currentTrack.title,
        timestamp: Date.now(),
        actionType: 'SKIPPED_EARLY'
      },
      ...prev
    ]);
    handleNextTrack();
  };

  const handleSelectTrack = (_track: SpotifyTrack, index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setSessions((prev) => [
      {
        sessionId: prev.length + 1,
        trackId: _track.id,
        trackTitle: _track.title,
        timestamp: Date.now(),
        actionType: 'YOUTUBE_FALLBACK'
      },
      ...prev
    ]);
  };

  const handleImportPlaylist = (imported: ImportedPlaylist) => {
    setActivePlaylist(imported);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
    if (imported.tracks.length > 0) {
      setSessions((prev) => [
        {
          sessionId: prev.length + 1,
          trackId: imported.tracks[0].id,
          trackTitle: imported.tracks[0].title,
          timestamp: Date.now(),
          actionType: 'YOUTUBE_FALLBACK'
        },
        ...prev
      ]);
    }
  };

  const handlePlayCurrentInYouTube = () => {
    if (!currentTrack) return;
    const videoId = currentTrack.youtubeVideoId;
    const url = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${currentTrack.artist} ${currentTrack.title} audio`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePlayPlaylistInYouTube = () => {
    if (!activePlaylist || activePlaylist.tracks.length === 0) return;
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

  const scrollToConsole = () => {
    const el = document.getElementById('soundscape-console');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      data-scroll-container
      className="min-h-screen bg-[#05030a] text-[#ede9fe] flex flex-col relative selection:bg-[#d946ef] selection:text-white"
    >
      {/* 3D Interactive WebGL Surreal Canvas Background */}
      <SurrealScene />

      {/* Atmospheric Vignette & Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(ellipse_at_center,_rgba(217,70,239,0.06)_0%,_rgba(5,3,10,0.8)_80%)]" />

      {/* Minimalist Architectural Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#05030a]/40 border-b border-purple-500/15 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Brand Identity: Vibe Capsule Playlist Bridge */}
          <div>
            <div className="serif-display text-xl sm:text-2xl lg:text-3xl font-light text-white tracking-wide leading-none">
              <span>Vibe Capsule</span> <span className="italic text-[#d946ef]">Playlist Bridge</span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-[#d946ef] uppercase block mt-1.5">
              Spatial soundscape digital environment
            </span>
          </div>

          {/* Actions: Spotify PKCE button & Explore console button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPkceModalOpen(true)}
              className="btn-luxury-secondary px-3.5 py-1.5 rounded-xl font-mono text-[11px] flex items-center gap-2"
              title="Spotify PKCE Auth Credentials"
            >
              <Key className="w-3.5 h-3.5 text-[#d946ef]" />
              <span>SPOTIFY PKCE</span>
            </button>

            <button
              onClick={scrollToConsole}
              className="btn-luxury-primary px-3.5 py-1.5 rounded-xl font-sans text-xs font-semibold uppercase flex items-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>EXPLORE CONSOLE</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Oversized Editorial Serif Headline & Centerpiece Portal */}
      <section
        data-scroll-section
        className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 py-20 text-center max-w-5xl mx-auto"
      >
        <div data-scroll-reveal className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/20 text-[#f472b6] text-xs font-mono uppercase tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.15)]">
            <Radio className="w-3.5 h-3.5 text-[#d946ef] animate-pulse" />
            <span>IMMERSIVE DIGITAL LANDSCAPE &bull; SPATIAL SOUND ENGINE</span>
          </div>

          <h1 className="serif-display text-5xl sm:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[0.92] max-w-4xl mx-auto text-glow-magenta">
            WHERE AMBITIOUS IDEAS BECOME <i>INTERFACES.</i>
          </h1>

          <p className="font-sans text-sm sm:text-base lg:text-lg text-purple-200/80 max-w-2xl mx-auto font-light leading-relaxed">
            A surreal digital environment where low-poly mountain peaks meet liquid reflection and a glowing particle vortex. Bridging restricted Spotify playlists into uninhibited, continuous sequential YouTube streams.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToConsole}
              className="btn-luxury-primary px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider flex items-center gap-2.5 shadow-xl"
            >
              <span>ENTER AUDIO CONSOLE</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>

            <button
              onClick={() => {
                if (activePlaylist && activePlaylist.tracks.length > 0) {
                  handlePlayPlaylistInYouTube();
                } else {
                  scrollToConsole();
                }
              }}
              className="btn-luxury-secondary px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-sans font-medium uppercase tracking-wider flex items-center gap-2"
            >
              <span>LAUNCH SEQUENTIAL STREAM</span>
            </button>
          </div>
        </div>

        {/* Ambient Scroll Indicator */}
        <div data-scroll-reveal className="pt-16 sm:pt-24 flex flex-col items-center gap-2 text-purple-400/50 text-[11px] font-mono uppercase tracking-widest">
          <span>SCROLL TO TRAVERSE ENVIRONMENT</span>
          <div className="w-5 h-8 rounded-full border border-purple-500/30 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-[#d946ef] animate-bounce" />
          </div>
        </div>
      </section>

      {/* Main Sound Console: Continuous Stream & Ingest Architecture */}
      <main
        id="soundscape-console"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10"
      >
        <DashboardScreen
          currentTrack={currentTrack}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onSkipEarly={handleSkipEarly}
          onSelectTrack={handleSelectTrack}
          activePlaylist={activePlaylist}
          onImportPlaylist={handleImportPlaylist}
          localSkipCount={localSkipCount}
          privacyShieldActive={privacyShieldActive}
          onTogglePrivacyShield={setPrivacyShieldActive}
          onOpenPkceModal={() => setIsPkceModalOpen(true)}
          isSpotifyFreeTier={isSpotifyFreeTier}
          onToggleFreeTier={setIsSpotifyFreeTier}
          onPlayCurrentInYouTube={handlePlayCurrentInYouTube}
          onPlayPlaylistInYouTube={handlePlayPlaylistInYouTube}
        />
      </main>

      {/* Refined Cinematic Agency Footer */}
      <footer className="border-t border-purple-500/15 bg-[#05030a]/80 backdrop-blur-md py-8 px-6 text-xs font-mono text-purple-300/60 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#d946ef] shadow-[0_0_8px_#d946ef]" />
            <span className="serif-display text-base text-white font-light">VIBE CAPSULE PLAYLIST BRIDGE</span>
            <span className="text-purple-400/40">/</span>
            <span>SPATIAL DIGITAL ARCHITECTURE &bull; ALL RIGHTS RESERVED</span>
          </div>
          <div className="text-[11px] text-purple-300/50 tracking-wider">
            POWERED BY THREE.JS WEBGL &bull; LENIS SMOOTH SCROLL &bull; GSAP SCROLLTRIGGER
          </div>
        </div>
      </footer>

      {/* Spotify PKCE Configuration Modal */}
      <SpotifyPkceModal
        isOpen={isPkceModalOpen}
        onClose={() => setIsPkceModalOpen(false)}
        onImportPlaylist={handleImportPlaylist}
      />

      {authNotice && (
        <div
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 rounded-xl bg-red-950/90 border border-red-500/50 text-red-100 p-3 font-mono text-xs"
          onClick={() => setAuthNotice('')}
        >
          {authNotice}
        </div>
      )}
    </div>
  );
}
