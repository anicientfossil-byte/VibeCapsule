import React, { useState } from 'react';
import { LanServerLog, SpotifyTrack } from '../types';
import { Radio, Wifi, Send, CheckCircle, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';

interface LanServerInspectorProps {
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  logs: LanServerLog[];
  onQueueTrackFromLan: (trackId: string, trackName: string, guestIp: string) => void;
  allTracks: SpotifyTrack[];
}

export const LanServerInspector: React.FC<LanServerInspectorProps> = ({
  isActive,
  onToggleActive,
  logs,
  onQueueTrackFromLan,
  allTracks
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(allTracks[2]?.id || '');
  const [guestIp, setGuestIp] = useState<string>('192.168.1.108');
  const [lastSentSuccess, setLastSentSuccess] = useState<boolean>(false);

  const handleSimulateGuestQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) return;
    const track = allTracks.find(t => t.id === selectedTrackId);
    if (!track) return;

    onQueueTrackFromLan(track.id, track.title, guestIp);
    setLastSentSuccess(true);
    setTimeout(() => setLastSentSuccess(false), 2500);
  };

  return (
    <div className="bg-[#FBF9F4] border-[3px] border-[#0F1A34] swiss-shadow p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-2 border-[#0F1A34] gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 border-2 border-[#0F1A34] ${isActive ? 'bg-[#E0533C] text-[#FBF9F4]' : 'bg-[#E5E2DA] text-[#2C221E]'}`}>
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-[#2C221E] uppercase tracking-tight">
              KTOR EMBEDDED LAN JUKEBOX DAEMON
            </h3>
            <p className="text-xs font-mono text-[#0F1A34]/80">
              Host Loopback Engine // Port 8080 // Zero-Cloud Peer-to-Peer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-mono font-bold border-2 border-[#0F1A34] ${
            isActive ? 'bg-[#E0533C] text-[#FBF9F4]' : 'bg-[#E5E2DA] text-[#2C221E]'
          }`}>
            {isActive ? '● ACTIVE: 192.168.1.142:8080' : '○ ENGINE STANDBY'}
          </span>
          <button
            onClick={() => onToggleActive(!isActive)}
            className="px-3 py-1 bg-[#2C221E] text-[#FBF9F4] hover:bg-[#0F1A34] font-mono text-xs font-bold border-2 border-[#0F1A34] uppercase active:translate-x-0.5 active:translate-y-0.5"
          >
            {isActive ? 'SHUTDOWN' : 'SPIN UP'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Guest Simulator Section */}
        <div className="lg:col-span-5 bg-[#E5E2DA]/40 p-4 border-2 border-[#0F1A34]">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-[#0F1A34]" />
            <h4 className="font-heading font-bold text-sm uppercase text-[#2C221E]">
              GUEST JUKEBOX EMULATOR (LAN PEER)
            </h4>
          </div>
          <p className="text-xs font-mono text-[#2C221E]/70 mb-4">
            Simulate a friend on your local Wi-Fi visiting <code>http://192.168.1.142:8080/queue-track</code> to append songs directly to your living-room Android speaker capsule.
          </p>

          <form onSubmit={handleSimulateGuestQueue} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#0F1A34] mb-1">
                GUEST PEER IP
              </label>
              <input
                type="text"
                value={guestIp}
                onChange={(e) => setGuestIp(e.target.value)}
                className="w-full bg-[#FBF9F4] border-2 border-[#0F1A34] p-1.5 font-mono text-xs text-[#2C221E] focus:outline-none focus:ring-1 focus:ring-[#E0533C]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-[#0F1A34] mb-1">
                REQUEST TARGET TRACK TO QUEUE
              </label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full bg-[#FBF9F4] border-2 border-[#0F1A34] p-1.5 font-mono text-xs text-[#2C221E] focus:outline-none focus:ring-1 focus:ring-[#E0533C]"
              >
                {allTracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} — {t.artist} ({t.tempoBpm} BPM)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!isActive}
              className={`w-full py-2 px-3 font-mono text-xs font-bold uppercase border-2 border-[#0F1A34] flex items-center justify-center gap-2 transition-transform ${
                isActive
                  ? 'bg-[#E0533C] text-[#FBF9F4] hover:bg-[#c4432d] active:translate-x-0.5 active:translate-y-0.5'
                  : 'bg-[#E5E2DA] text-[#2C221E]/40 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              EMIT POST /queue-track
            </button>

            {lastSentSuccess && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#0F1A34] bg-[#FBF9F4] p-2 border border-[#0F1A34]">
                <CheckCircle className="w-4 h-4 text-[#E0533C]" />
                <span>Track queued successfully into capsule playback stack!</span>
              </div>
            )}

            {!isActive && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#E0533C] bg-[#FBF9F4] p-2 border border-[#E0533C]">
                <AlertTriangle className="w-4 h-4" />
                <span>Ktor server is dormant. Enable toggle to receive peer packets.</span>
              </div>
            )}
          </form>
        </div>

        {/* Live Terminal Log Section */}
        <div className="lg:col-span-7 bg-[#2C221E] text-[#FBF9F4] p-3 border-2 border-[#0F1A34] font-mono flex flex-col h-[280px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#FBF9F4]/20 text-xs">
            <div className="flex items-center gap-2 text-[#E0533C] font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>KTOR_NETTY_LOGSTREAM.STDOUT</span>
            </div>
            <span className="text-[10px] text-[#FBF9F4]/60">TCP BUFFER: SYN/ACK OK</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 text-[11px] pr-1">
            {logs.length === 0 ? (
              <div className="text-[#FBF9F4]/40 italic pt-6 text-center">
                Awaiting incoming Wi-Fi broadcast packets on port 8080...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="leading-tight pb-1 border-b border-[#FBF9F4]/10 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FBF9F4]/40 text-[10px]">[{log.timestamp}]</span>
                    <span className={log.method === 'POST' ? 'text-[#E0533C] font-bold' : 'text-blue-400'}>
                      {log.method}
                    </span>
                    <span className="text-[#FBF9F4]">{log.endpoint}</span>
                    <span className="ml-auto text-[10px] px-1 bg-[#0F1A34] text-[#FBF9F4] border border-[#FBF9F4]/20">
                      HTTP {log.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#FBF9F4]/70 pl-2">
                    FROM {log.ip} → {log.detail}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
