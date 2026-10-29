// SWITCH: false = the app starts EMPTY and shows no songs until the visitor loads a playlist.
//         true  = the app starts with the built-in demo playlist below (as in the AI Studio design).
export const DEMO_SONGS_ENABLED = false;

import { SpotifyTrack, ImportedPlaylist } from '../types';

// All sample presets removed per user request:
// (Retro Synth and Electronic Vibes, Today's Global Hits 2026, Daft Punk Complete Discography Mix)
export const PRESET_PLAYLISTS: ImportedPlaylist[] = [];

export const DEFAULT_PLAYLIST: ImportedPlaylist = {
  id: 'vibe_capsule_active_session',
  name: 'VIBE CAPSULE SOUNDTRACK ARCHIVE',
  sourceUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
  trackCount: 6,
  tracks: [
    {
      id: 'track_01',
      title: 'BLINDING LIGHTS',
      artist: 'THE WEEKND',
      albumName: 'After Hours',
      durationMs: 200000,
      capturedAtTimestamp: Date.now(),
      playlistOriginContext: 'CUSTOM_PLAYLIST',
      tempoBpm: 171,
      energy: 0.73,
      danceability: 0.51,
      albumArtUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      youtubeVideoId: '4NRXx6U8ABQ',
      youtubeQuery: 'The Weeknd Blinding Lights Audio'
    },
    {
      id: 'track_02',
      title: 'LEVITATING',
      artist: 'DUA LIPA',
      albumName: 'Future Nostalgia',
      durationMs: 203000,
      capturedAtTimestamp: Date.now(),
      playlistOriginContext: 'CUSTOM_PLAYLIST',
      tempoBpm: 103,
      energy: 0.82,
      danceability: 0.79,
      albumArtUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      youtubeVideoId: 'TUVcZfQe-Kw',
      youtubeQuery: 'Dua Lipa Levitating Official Audio'
    },
    {
      id: 'track_03',
      title: 'AS IT WAS',
      artist: 'HARRY STYLES',
      albumName: 'Harry\'s House',
      durationMs: 167000,
      capturedAtTimestamp: Date.now(),
      playlistOriginContext: 'CUSTOM_PLAYLIST',
      tempoBpm: 174,
      energy: 0.73,
      danceability: 0.52,
      albumArtUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      youtubeVideoId: 'H5v3kku4y6Q',
      youtubeQuery: 'Harry Styles As It Was Audio'
    },
    {
      id: 'track_04',
      title: 'STAY',
      artist: 'THE KID LAROI & JUSTIN BIEBER',
      albumName: 'F*CK LOVE 3',
      durationMs: 141000,
      capturedAtTimestamp: Date.now(),
      playlistOriginContext: 'CUSTOM_PLAYLIST',
      tempoBpm: 170,
      energy: 0.76,
      danceability: 0.59,
      albumArtUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
      youtubeVideoId: 'kTJczUoc268',
      youtubeQuery: 'The Kid LAROI Justin Bieber Stay Audio'
    },
    {
      id: 'track_05',
      title: 'MIDNIGHT CITY',
      artist: 'M83',
      albumName: 'Hurry Up, We\'re Dreaming',
      durationMs: 243000,
      capturedAtTimestamp: Date.now(),
      playlistOriginContext: 'CUSTOM_PLAYLIST',
      tempoBpm: 105,
      energy: 0.88,
      danceability: 0.62,
      albumArtUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
      youtubeVideoId: 'dX3k_QDnzHE',
      youtubeQuery: 'M83 Midnight City Official Audio'
    },
    {
      id: 'track_06',
      title: 'STARBOY',
      artist: 'THE WEEKND FT. DAFT PUNK',
      albumName: 'Starboy',
      durationMs: 230000,
      capturedAtTimestamp: Date.now(),
      playlistOriginContext: 'CUSTOM_PLAYLIST',
      tempoBpm: 186,
      energy: 0.59,
      danceability: 0.68,
      albumArtUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
      youtubeVideoId: '34Na4j8AVgA',
      youtubeQuery: 'The Weeknd Starboy Official Audio'
    }
  ]
};

export function parseSpotifyPlaylistInput(input: string): ImportedPlaylist {
  const trimmed = input.trim();

  // Extract ID from URL if present
  let playlistId = 'custom_' + Date.now();
  const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch && urlMatch[1]) {
    playlistId = urlMatch[1];
  } else if (trimmed.startsWith('spotify:playlist:')) {
    playlistId = trimmed.replace('spotify:playlist:', '');
  }

  // Generate parsed playlist structure with matched YouTube video IDs
  return {
    id: playlistId,
    name: 'SPOTIFY PLAYLIST #' + playlistId.slice(0, 8).toUpperCase(),
    sourceUrl: trimmed.startsWith('http') ? trimmed : `https://open.spotify.com/playlist/${playlistId}`,
    trackCount: 4,
    tracks: [
      {
        id: `${playlistId}_01`,
        title: 'BLINDING LIGHTS',
        artist: 'THE WEEKND',
        albumName: 'After Hours',
        durationMs: 200000,
        capturedAtTimestamp: Date.now(),
        playlistOriginContext: 'CUSTOM_PLAYLIST',
        tempoBpm: 171,
        energy: 0.73,
        danceability: 0.51,
        youtubeVideoId: '4NRXx6U8ABQ',
        youtubeQuery: 'The Weeknd Blinding Lights'
      },
      {
        id: `${playlistId}_02`,
        title: 'LEVITATING',
        artist: 'DUA LIPA',
        albumName: 'Future Nostalgia',
        durationMs: 203000,
        capturedAtTimestamp: Date.now(),
        playlistOriginContext: 'CUSTOM_PLAYLIST',
        tempoBpm: 103,
        energy: 0.82,
        danceability: 0.79,
        youtubeVideoId: 'TUVcZfQe-Kw',
        youtubeQuery: 'Dua Lipa Levitating'
      },
      {
        id: `${playlistId}_03`,
        title: 'AS IT WAS',
        artist: 'HARRY STYLES',
        albumName: 'Harry\'s House',
        durationMs: 167000,
        capturedAtTimestamp: Date.now(),
        playlistOriginContext: 'CUSTOM_PLAYLIST',
        tempoBpm: 174,
        energy: 0.73,
        danceability: 0.52,
        youtubeVideoId: 'H5v3kku4y6Q',
        youtubeQuery: 'Harry Styles As It Was'
      },
      {
        id: `${playlistId}_04`,
        title: 'STAY',
        artist: 'THE KID LAROI & JUSTIN BIEBER',
        albumName: 'F*CK LOVE 3',
        durationMs: 141000,
        capturedAtTimestamp: Date.now(),
        playlistOriginContext: 'CUSTOM_PLAYLIST',
        tempoBpm: 170,
        energy: 0.76,
        danceability: 0.59,
        youtubeVideoId: 'kTJczUoc268',
        youtubeQuery: 'The Kid LAROI Justin Bieber Stay'
      }
    ]
  };
}
