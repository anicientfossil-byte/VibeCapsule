import React, { useCallback, useEffect, useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check, Copy, Loader2, LogOut, ListMusic } from 'lucide-react';
import { ImportedPlaylist } from '../types';
import {
  CONFIG_CLIENT_ID, getAuth, getClientId, setClientId, getRedirectUri, login, logout,
  onAuthChange, fetchMe, fetchMyPlaylists, MyPlaylist
} from '../utils/spotifyAuth';
import { importMyPlaylist } from '../utils/spotifyFetcher';

interface SpotifyPkceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlaylist: (p: ImportedPlaylist) => void;
}

export const SpotifyPkceModal: React.FC<SpotifyPkceModalProps> = ({ isOpen, onClose, onImportPlaylist }) => {
  const [clientId, setLocalId] = useState<string>(getClientId());
  const [loggedIn, setLoggedIn] = useState<boolean>(!!getAuth());
  const [userName, setUserName] = useState<string>('');
  const [playlists, setPlaylists] = useState<MyPlaylist[]>([]);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const redirectUri = getRedirectUri();

  const refresh = useCallback(async () => {
    const authed = !!getAuth();
    setLoggedIn(authed);
    if (!authed) { setPlaylists([]); setUserName(''); return; }
    setBusy('LOADING YOUR PLAYLISTS...');
    setError('');
    try {
      const [me, pls] = await Promise.all([fetchMe(), fetchMyPlaylists()]);
      setUserName(me.display_name || me.id);
      setPlaylists(pls);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }, []);

  useEffect(() => onAuthChange(refresh), [refresh]);
  useEffect(() => { if (isOpen) refresh(); }, [isOpen, refresh]);

  if (!isOpen) return null;

  const doLogin = async () => {
    setError('');
    try { setClientId(clientId); await login(); } catch (e: any) { setError(e.message); }
  };

  const doImport = async (p: MyPlaylist) => {
    setBusy(`IMPORTING "${p.name.toUpperCase()}"...`);
    setError('');
    try {
      onImportPlaylist(await importMyPlaylist(p.id, p.name));
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const copyRedirect = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05030a]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-glow rounded-3xl max-w-xl w-full p-6 text-white max-h-[90vh] overflow-y-auto border border-[#d946ef]/40 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d946ef]/20 border border-[#d946ef]/40 flex items-center justify-center">
              <Key className="w-5 h-5 text-[#f472b6]" />
            </div>
            <div>
              <h3 className="serif-display text-xl text-white font-light">Spotify Login</h3>
              <span className="text-[10px] font-mono tracking-wider text-[#d946ef] uppercase">DIRECT CLIENT-SIDE OAUTH (PKCE)</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-sans">
          <p className="text-purple-200/80 leading-relaxed p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20">
            Log in to import your own and private playlists. It runs entirely in your browser with no client secret. Public playlists do not need a login.
          </p>

          <div>
            <label className="block text-[11px] font-mono text-purple-300 uppercase mb-2">SPOTIFY CLIENT ID</label>
            <input
              type="text"
              value={clientId}
              disabled={!!CONFIG_CLIENT_ID}
              onChange={(e) => setLocalId(e.target.value)}
              className="w-full bg-black/60 border border-purple-500/30 rounded-xl p-3 text-xs font-mono text-purple-100 focus:outline-none focus:border-[#d946ef] focus:ring-1 focus:ring-[#d946ef] disabled:opacity-60"
              placeholder="Paste Client ID from developer.spotify.com/dashboard"
            />
          </div>

          <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 space-y-2.5">
            <span className="font-mono text-[11px] text-[#f472b6] uppercase">REDIRECT URI (REGISTER EXACTLY THIS IN THE SPOTIFY DASHBOARD)</span>
            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/15 text-[11px] font-mono break-all text-purple-200 select-all">{redirectUri}</div>
            <div className="flex justify-end">
              <button onClick={copyRedirect} className="px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all">
                {copied ? <Check className="w-3.5 h-3.5 text-[#d946ef]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#d946ef]/10 border border-[#d946ef]/30 text-purple-200 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-[#d946ef] shrink-0" />
            <span>ZERO CLOUD STORAGE &bull; TOKEN STAYS ON THIS DEVICE</span>
          </div>

          {loggedIn ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-purple-500/20 font-mono">
                <span className="uppercase text-purple-100">CONNECTED{userName ? ` // ${userName}` : ''}</span>
                <button onClick={() => { logout(); refresh(); }} className="flex items-center gap-1.5 text-[#f472b6] hover:text-white">
                  <LogOut className="w-3.5 h-3.5" /> LOG OUT
                </button>
              </div>
              <div className="font-mono text-[11px] text-purple-300 uppercase flex items-center gap-1.5"><ListMusic className="w-3.5 h-3.5" /> YOUR PLAYLISTS</div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-purple-500/20 divide-y divide-purple-500/10 bg-black/30">
                {playlists.length === 0 && !busy && <div className="p-3 text-purple-300/70 font-mono">No playlists found.</div>}
                {playlists.map((p) => (
                  <button key={p.id} onClick={() => doImport(p)} disabled={!!busy}
                    className="w-full text-left p-3 hover:bg-[#d946ef]/15 disabled:opacity-50 flex justify-between gap-2 font-mono text-purple-100">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-purple-300/70">{p.ownedByMe ? 'YOURS' : 'FOLLOWED'}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-purple-300/60 font-mono">Spotify dev mode only lets apps read tracks of playlists you own or collaborate on. For others, paste the public link on the main page.</p>
            </div>
          ) : (
            <div className="pt-3 border-t border-purple-500/15">
              <button onClick={doLogin} className="btn-luxury-primary w-full py-3 px-4 rounded-xl text-xs font-sans font-semibold uppercase flex items-center justify-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                LOG IN WITH SPOTIFY (OPENS NEW WINDOW)
              </button>
            </div>
          )}

          {busy && <div className="flex items-center gap-2 font-mono text-purple-100"><Loader2 className="w-3.5 h-3.5 animate-spin text-[#d946ef]" />{busy}</div>}
          {error && <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 font-mono">{error}</div>}
        </div>
      </div>
    </div>
  );
};
