import { ImportedPlaylist, SpotifyTrack } from '../types';
import { fetchPlaylistTracks } from './spotifyAuth';

const API_BASE = (window.VC_CONFIG?.API_BASE || import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

function needApi() {
  if (!API_BASE) throw new Error('API_BASE is not set. Put your Cloudflare Worker address in config.js (see README).');
}

/** Public playlist link -> playlist (via your Cloudflare Worker). */
export async function fetchRealSpotifyPlaylist(urlOrId: string): Promise<ImportedPlaylist> {
  const trimmed = urlOrId.trim();
  if (!trimmed) throw new Error('Please enter a Spotify playlist URL or ID.');
  needApi();
  const res = await fetch(`${API_BASE}/api/spotify-playlist?url=${encodeURIComponent(trimmed)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Unable to fetch Spotify playlist (Status ${res.status})`);
  }
  const data = await res.json();
  if (!data.playlist || !Array.isArray(data.playlist.tracks) || data.playlist.tracks.length === 0) {
    throw new Error('No tracks could be retrieved from the Spotify playlist.');
  }
  return data.playlist;
}

/** One of YOUR playlists (needs Spotify login) -> playlist; YouTube IDs are matched by the Worker. */
export async function importMyPlaylist(id: string, name: string): Promise<ImportedPlaylist> {
  needApi();
  const raw = await fetchPlaylistTracks(id);
  if (raw.length === 0) throw new Error('Spotify returned no tracks for this playlist.');
  const res = await fetch(`${API_BASE}/api/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tracks: raw.map((t) => ({ title: t.title, artist: t.artist })) })
  });
  const matches: { query: string; videoId: string }[] = res.ok ? (await res.json()).results : [];
  const tracks: SpotifyTrack[] = raw.map((t, i) => ({
    id: t.uri,
    title: t.title.toUpperCase(),
    artist: t.artist.toUpperCase(),
    albumName: name.toUpperCase(),
    durationMs: t.durationMs,
    capturedAtTimestamp: Date.now(),
    playlistOriginContext: 'CUSTOM_PLAYLIST',
    tempoBpm: 100 + ((i * 11) % 45),
    energy: 0.65 + ((i * 7) % 30) / 100,
    danceability: 0.6 + ((i * 5) % 35) / 100,
    albumArtUrl: t.albumArtUrl || (matches[i]?.videoId ? `https://i.ytimg.com/vi/${matches[i].videoId}/hqdefault.jpg` : ''),
    youtubeVideoId: matches[i]?.videoId || '',
    youtubeQuery: matches[i]?.query || `${t.artist} ${t.title} audio`
  }));
  return { id, name: name.toUpperCase(), sourceUrl: `https://open.spotify.com/playlist/${id}`, trackCount: tracks.length, tracks };
}
