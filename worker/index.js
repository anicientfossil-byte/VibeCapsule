// Cloudflare Worker: replaces the old Express /api routes.
// Static GitHub Pages sites can't scrape Spotify/YouTube (CORS), so this does it.
//   GET /api/spotify-playlist?url=<playlist url or id>  -> public playlist + YouTube IDs
//   POST /api/resolve  { tracks: [{title, artist}] }    -> YouTube IDs for given tracks

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function cors(env, req) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get('Origin') || '';
  const ok = allowed.length === 0 || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

async function findYouTubeId(query) {
  try {
    const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    const m = (await r.text()).match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

function buildTrack(t, index, playlistId, playlistTitle, videoId, query, cover) {
  return {
    id: t.uri || `spotify_track_${playlistId}_${index}`,
    title: t.title.toUpperCase(),
    artist: t.artist.toUpperCase(),
    albumName: playlistTitle.toUpperCase(),
    durationMs: t.duration || 200000,
    capturedAtTimestamp: Date.now(),
    playlistOriginContext: 'CUSTOM_PLAYLIST',
    tempoBpm: 100 + ((index * 11) % 45),
    energy: 0.65 + ((index * 7) % 30) / 100,
    danceability: 0.6 + ((index * 5) % 35) / 100,
    albumArtUrl: cover || '',
    youtubeVideoId: videoId,
    youtubeQuery: query
  };
}

async function handlePlaylist(url, headers) {
  const input = (url.searchParams.get('url') || url.searchParams.get('id') || '').trim();
  if (!input) return json({ error: 'Missing Spotify playlist URL or ID' }, 400, headers);

  let playlistId = input;
  const m = input.match(/playlist\/([a-zA-Z0-9]+)/);
  if (m) playlistId = m[1];
  else if (input.startsWith('spotify:playlist:')) playlistId = input.replace('spotify:playlist:', '');
  else if (input.includes('?')) playlistId = input.split('?')[0];
  if (!/^[a-zA-Z0-9]{10,30}$/.test(playlistId)) return json({ error: 'That does not look like a playlist link.' }, 400, headers);

  const res = await fetch(`https://open.spotify.com/embed/playlist/${playlistId}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) return json({ error: 'Could not fetch Spotify playlist. Ensure the link is valid and public.' }, 404, headers);
  const html = await res.text();

  let playlistTitle = 'SPOTIFY PLAYLIST';
  let playlistCover = '';
  let raw = [];
  const next = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (next) {
    try {
      const entity = JSON.parse(next[1]).props?.pageProps?.state?.data?.entity;
      if (entity) {
        playlistTitle = entity.name || playlistTitle;
        raw = entity.trackList || [];
        playlistCover = (entity.coverArt && entity.coverArt.sources && entity.coverArt.sources[0] && entity.coverArt.sources[0].url) || (entity.visualIdentity && entity.visualIdentity.image && entity.visualIdentity.image[0] && entity.visualIdentity.image[0].url) || '';
      }
    } catch {}
  }
  if (raw.length === 0) {
    const re = /"title":"([^"]+)","subtitle":"([^"]+)"/g;
    let x;
    while ((x = re.exec(html)) !== null && raw.length < 30) raw.push({ title: x[1], subtitle: x[2], duration: 210000 });
  }
  if (raw.length === 0) return json({ error: 'No tracks found in the provided Spotify playlist.' }, 404, headers);

  const tracks = await Promise.all(
    raw.slice(0, 25).map(async (t, i) => {
      const title = (t.title || `Track ${i + 1}`).trim();
      const artist = (t.subtitle || 'Various Artists').trim();
      const query = `${artist} ${title} audio`;
      const videoId = await findYouTubeId(query);
      const cover =
        (t.album && t.album.coverArt && t.album.coverArt.sources && t.album.coverArt.sources[0] && t.album.coverArt.sources[0].url) ||
        (t.coverArt && t.coverArt.sources && t.coverArt.sources[0] && t.coverArt.sources[0].url) ||
        (t.images && t.images[0] && t.images[0].url) ||
        (t.audioClip && t.audioClip.thumbnailUrl) ||
        t.coverArtUrl || t.imageUrl ||
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '') ||
        playlistCover;
      return buildTrack({ title, artist, uri: t.uri, duration: t.duration }, i, playlistId, playlistTitle, videoId, query, cover);
    })
  );
  return json(
    { playlist: { id: playlistId, name: playlistTitle.toUpperCase(), sourceUrl: `https://open.spotify.com/playlist/${playlistId}`, trackCount: tracks.length, tracks } },
    200,
    headers
  );
}

async function handleResolve(req, headers) {
  const body = await req.json().catch(() => ({}));
  const list = Array.isArray(body.tracks) ? body.tracks.slice(0, 50) : [];
  const out = await Promise.all(
    list.map(async (t) => {
      const query = `${t.artist || ''} ${t.title || ''} audio`.trim();
      return { query, videoId: await findYouTubeId(query) };
    })
  );
  return json({ results: out }, 200, headers);
}

export default {
  async fetch(req, env) {
    const headers = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(req.url);
    try {
      if (url.pathname === '/api/spotify-playlist' && req.method === 'GET') return await handlePlaylist(url, headers);
      if (url.pathname === '/api/resolve' && req.method === 'POST') return await handleResolve(req, headers);
      if (url.pathname === '/' ) return json({ ok: true, service: 'vibecapsule-api' }, 200, headers);
      return json({ error: 'Not found' }, 404, headers);
    } catch (e) {
      return json({ error: e.message || 'Server error' }, 500, headers);
    }
  }
};
