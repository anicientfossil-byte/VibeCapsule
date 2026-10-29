// Browser-only Spotify Authorization Code + PKCE flow. No client secret, no backend.
const LS = 'vibecapsule.spotify';
const SCOPES = 'playlist-read-private playlist-read-collaborative';

export interface StoredAuth { accessToken: string; refreshToken?: string; expiresAt: number }

export const CONFIG_CLIENT_ID = (window.VC_CONFIG?.SPOTIFY_CLIENT_ID || import.meta.env.VITE_SPOTIFY_CLIENT_ID || '').trim();
export const getClientId = () => CONFIG_CLIENT_ID || localStorage.getItem(`${LS}.clientId`) || '';
export const setClientId = (id: string) => localStorage.setItem(`${LS}.clientId`, id.trim());

// Exact string that must be registered in the Spotify dashboard.
export const getRedirectUri = () => window.location.origin + window.location.pathname.replace(/index\.html$/, '');

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomVerifier = () => b64url(crypto.getRandomValues(new Uint8Array(64)));
const challengeOf = async (v: string) => b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)));

export const getAuth = (): StoredAuth | null => {
  try { return JSON.parse(localStorage.getItem(`${LS}.auth`) || 'null'); } catch { return null; }
};
const saveAuth = (a: StoredAuth) => localStorage.setItem(`${LS}.auth`, JSON.stringify(a));

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('vibecapsule-auth') : null;
export const logout = () => { localStorage.removeItem(`${LS}.auth`); channel?.postMessage('changed'); };
export const onAuthChange = (cb: () => void) => {
  const h = () => cb();
  channel?.addEventListener('message', h);
  return () => channel?.removeEventListener('message', h);
};

/** Opens Spotify login in a popup/new tab. Falls back to same-tab redirect if blocked. */
export async function login(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) throw new Error('Add your Spotify Client ID first.');
  const verifier = randomVerifier();
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  localStorage.setItem(`${LS}.verifier`, verifier);
  localStorage.setItem(`${LS}.state`, state);
  const params = new URLSearchParams({
    client_id: clientId, response_type: 'code', redirect_uri: getRedirectUri(),
    code_challenge_method: 'S256', code_challenge: await challengeOf(verifier), scope: SCOPES, state
  });
  const url = `https://accounts.spotify.com/authorize?${params}`;
  const popup = window.open(url, 'spotify-login', 'width=480,height=720');
  if (!popup) window.location.href = url;
}

async function tokenRequest(body: Record<string, string>): Promise<StoredAuth> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: getClientId(), ...body })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Spotify token error');
  const prev = getAuth();
  const auth: StoredAuth = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || prev?.refreshToken,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000
  };
  saveAuth(auth);
  return auth;
}

/** Call once on page load. If this page is the OAuth callback, finish the login. */
export async function handleRedirectCallback(): Promise<{ handled: boolean; error?: string }> {
  const q = new URLSearchParams(window.location.search);
  const code = q.get('code');
  const err = q.get('error');
  if (!code && !err) return { handled: false };
  const clean = window.location.origin + window.location.pathname;
  const isPopup = !!window.opener && window.name === 'spotify-login';
  try {
    if (err) throw new Error(`Spotify: ${err}`);
    if (q.get('state') !== localStorage.getItem(`${LS}.state`)) throw new Error('State mismatch - try logging in again.');
    await tokenRequest({
      grant_type: 'authorization_code', code: code!, redirect_uri: getRedirectUri(),
      code_verifier: localStorage.getItem(`${LS}.verifier`) || ''
    });
    localStorage.removeItem(`${LS}.verifier`);
    localStorage.removeItem(`${LS}.state`);
    channel?.postMessage('changed');
    if (isPopup) window.close(); else window.history.replaceState({}, '', clean);
    return { handled: true };
  } catch (e: any) {
    window.history.replaceState({}, '', clean);
    return { handled: true, error: e.message };
  }
}

export async function getAccessToken(): Promise<string | null> {
  const a = getAuth();
  if (!a) return null;
  if (Date.now() < a.expiresAt) return a.accessToken;
  if (!a.refreshToken) return null;
  try { return (await tokenRequest({ grant_type: 'refresh_token', refresh_token: a.refreshToken })).accessToken; }
  catch { logout(); return null; }
}

async function api<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not logged in to Spotify.');
  const res = await fetch(path.startsWith('http') ? path : `https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403) throw new Error("Spotify blocked this playlist (403). Dev-mode apps can only read playlists you own or collaborate on, and you must be on the app's allowlist.");
  if (!res.ok) throw new Error(`Spotify API error ${res.status}`);
  return res.json();
}

export interface MyPlaylist { id: string; name: string; trackCount: number; owner: string; ownedByMe: boolean }
export const fetchMe = () => api<{ id: string; display_name: string }>('/me');

export async function fetchMyPlaylists(): Promise<MyPlaylist[]> {
  const me = await fetchMe();
  const out: MyPlaylist[] = [];
  let next: string | null = '/me/playlists?limit=50';
  while (next && out.length < 200) {
    const page: any = await api(next);
    for (const p of page.items || []) {
      if (!p) continue;
      const count = p.items?.total ?? p.tracks?.total ?? 0; // Feb-2026 API renamed tracks -> items
      out.push({ id: p.id, name: p.name, trackCount: count, owner: p.owner?.display_name || '', ownedByMe: p.owner?.id === me.id || !!p.collaborative });
    }
    next = page.next;
  }
  return out;
}

export interface RawTrack { uri: string; title: string; artist: string; durationMs: number; albumArtUrl: string }

export async function fetchPlaylistTracks(id: string): Promise<RawTrack[]> {
  const out: RawTrack[] = [];
  let next: string | null = `/playlists/${id}/items?limit=50`;
  while (next && out.length < 100) {
    const page: any = await api(next);
    for (const row of page.items || []) {
      const t = row.item || row.track;
      if (!t || t.type === 'episode') continue;
      out.push({
        uri: t.uri, title: t.name, artist: (t.artists || []).map((a: any) => a.name).join(', '),
        durationMs: t.duration_ms, albumArtUrl: t.album?.images?.[0]?.url || ''
      });
    }
    next = page.next;
  }
  return out;
}
