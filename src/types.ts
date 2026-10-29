export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumName: string;
  durationMs: number;
  capturedAtTimestamp: number;
  playlistOriginContext: 'DISCOVER_WEEKLY' | 'DAILY_MIX' | 'RELEASE_RADAR' | 'LAN_GUEST' | 'LIVE_STREAM' | 'CUSTOM_PLAYLIST';
  tempoBpm: number;
  energy: number;
  danceability: number;
  albumArtUrl?: string;
  youtubeVideoId?: string;
  youtubeQuery?: string;
}

export interface ImportedPlaylist {
  id: string;
  name: string;
  sourceUrl: string;
  trackCount: number;
  tracks: SpotifyTrack[];
}

export interface SessionLog {
  sessionId: number;
  trackId: string;
  trackTitle: string;
  timestamp: number;
  actionType: 'PLAYED' | 'SKIPPED_EARLY' | 'YOUTUBE_FALLBACK';
}

export interface LanServerLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST';
  endpoint: string;
  ip: string;
  status: number;
  detail: string;
}

export interface AndroidSourceFile {
  path: string;
  category: 'manifest' | 'gradle' | 'theme' | 'components' | 'data' | 'network' | 'server' | 'services' | 'viewmodel' | 'ui' | 'bridge';
  content: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'toml';
}
