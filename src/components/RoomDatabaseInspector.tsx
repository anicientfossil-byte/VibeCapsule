import React, { useState } from 'react';
import { SpotifyTrack, SessionLog } from '../types';
import { Database, PlusCircle, Trash2, Filter, Layers, Clock, Activity, Zap } from 'lucide-react';

interface RoomDatabaseInspectorProps {
  tracks: SpotifyTrack[];
  sessions: SessionLog[];
  onTriggerSnapshot: (context: 'DISCOVER_WEEKLY' | 'DAILY_MIX' | 'RELEASE_RADAR') => void;
  onClearSessionLogs: () => void;
}

export const RoomDatabaseInspector: React.FC<RoomDatabaseInspectorProps> = ({
  tracks,
  sessions,
  onTriggerSnapshot,
  onClearSessionLogs
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'sessions'>('tracks');
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [isSnapshotting, setIsSnapshotting] = useState<boolean>(false);

  const filteredTracks = tracks.filter((t) => {
    if (originFilter === 'ALL') return true;
    return t.playlistOriginContext === originFilter;
  });

  const handleSnapshotClick = (context: 'DISCOVER_WEEKLY' | 'DAILY_MIX' | 'RELEASE_RADAR') => {
    setIsSnapshotting(true);
    setTimeout(() => {
      onTriggerSnapshot(context);
      setIsSnapshotting(false);
    }, 600);
  };

  return (
    <div className="bg-[#FBF9F4] border-[3px] border-[#0F1A34] swiss-shadow p-5 mb-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-2 border-[#0F1A34] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-[#0F1A34] bg-[#2C221E] text-[#FBF9F4]">
            <Database className="w-5 h-5 text-[#E0533C]" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-[#2C221E] uppercase tracking-tight">
              LOCAL ROOM SQLITE DATABASE ENGINE
            </h3>
            <p className="text-xs font-mono text-[#0F1A34]/80">
              Zero-Cloud Persistent Storage // Database: <code>vibe_capsule_ledger.db</code> (Schema v1)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSnapshotClick('DISCOVER_WEEKLY')}
            disabled={isSnapshotting}
            className="px-3 py-1.5 bg-[#E0533C] text-[#FBF9F4] font-mono text-xs font-bold border-2 border-[#0F1A34] uppercase hover:bg-[#c4432d] flex items-center gap-1.5 transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {isSnapshotting ? 'SNAPSHOT IN PROGRESS...' : '+ SNAPSHOT DISCOVER WEEKLY'}
          </button>
          <button
            onClick={() => handleSnapshotClick('DAILY_MIX')}
            disabled={isSnapshotting}
            className="px-3 py-1.5 bg-[#2C221E] text-[#FBF9F4] font-mono text-xs font-bold border-2 border-[#0F1A34] uppercase hover:bg-[#0F1A34] flex items-center gap-1.5 transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <Zap className="w-3.5 h-3.5 text-[#E0533C]" />
            + SNAPSHOT DAILY MIX
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mt-4 border-b-2 border-[#0F1A34]">
        <div className="flex">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase border-t-2 border-l-2 border-r-2 border-[#0F1A34] -mb-[2px] ${
              activeTab === 'tracks'
                ? 'bg-[#0F1A34] text-[#FBF9F4]'
                : 'bg-[#E5E2DA] text-[#2C221E] hover:bg-[#FBF9F4]'
            }`}
          >
            TABLE: spotify_tracks ({tracks.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase border-t-2 border-l-2 border-r-2 border-[#0F1A34] -mb-[2px] ml-1 ${
              activeTab === 'sessions'
                ? 'bg-[#0F1A34] text-[#FBF9F4]'
                : 'bg-[#E5E2DA] text-[#2C221E] hover:bg-[#FBF9F4]'
            }`}
          >
            TABLE: listening_sessions ({sessions.length})
          </button>
        </div>

        {activeTab === 'tracks' && (
          <div className="flex items-center gap-2 pb-1">
            <Filter className="w-3.5 h-3.5 text-[#0F1A34]" />
            <span className="text-[10px] font-mono font-bold uppercase text-[#0F1A34]">ORIGIN:</span>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-[#FBF9F4] border-2 border-[#0F1A34] px-2 py-0.5 text-[11px] font-mono font-bold text-[#2C221E] focus:outline-none"
            >
              <option value="ALL">ALL CONTEXTS</option>
              <option value="DISCOVER_WEEKLY">DISCOVER_WEEKLY</option>
              <option value="DAILY_MIX">DAILY_MIX</option>
              <option value="LAN_GUEST">LAN_GUEST</option>
              <option value="RELEASE_RADAR">RELEASE_RADAR</option>
            </select>
          </div>
        )}

        {activeTab === 'sessions' && (
          <button
            onClick={onClearSessionLogs}
            className="text-[11px] font-mono text-[#E0533C] hover:underline flex items-center gap-1 font-bold pb-1"
          >
            <Trash2 className="w-3 h-3" />
            CLEAR AUDIT LOG
          </button>
        )}
      </div>

      {/* Content Table */}
      <div className="mt-4 overflow-x-auto border-2 border-[#0F1A34] bg-white">
        {activeTab === 'tracks' ? (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#2C221E] text-[#FBF9F4] uppercase text-[10px]">
              <tr>
                <th className="p-2 border-r border-[#FBF9F4]/20">ID</th>
                <th className="p-2 border-r border-[#FBF9F4]/20">TITLE & ARTIST</th>
                <th className="p-2 border-r border-[#FBF9F4]/20">ALBUM</th>
                <th className="p-2 border-r border-[#FBF9F4]/20">ORIGIN</th>
                <th className="p-2 border-r border-[#FBF9F4]/20">BPM</th>
                <th className="p-2 border-r border-[#FBF9F4]/20">ENERGY</th>
                <th className="p-2">DANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F1A34]/20">
              {filteredTracks.map((t, idx) => (
                <tr key={t.id} className={idx % 2 === 0 ? 'bg-[#FBF9F4]' : 'bg-white hover:bg-[#E5E2DA]/40'}>
                  <td className="p-2 border-r border-[#0F1A34]/20 font-bold text-[#E0533C]">
                    {t.id.slice(0, 8)}...
                  </td>
                  <td className="p-2 border-r border-[#0F1A34]/20 font-semibold text-[#2C221E]">
                    <div className="font-bold">{t.title}</div>
                    <div className="text-[10px] text-[#0F1A34]/70">{t.artist}</div>
                  </td>
                  <td className="p-2 border-r border-[#0F1A34]/20 text-[#2C221E]/80">
                    {t.albumName}
                  </td>
                  <td className="p-2 border-r border-[#0F1A34]/20">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold border border-[#0F1A34] bg-[#E5E2DA] text-[#0F1A34]">
                      {t.playlistOriginContext}
                    </span>
                  </td>
                  <td className="p-2 border-r border-[#0F1A34]/20 font-bold text-[#0F1A34]">
                    {t.tempoBpm.toFixed(0)} BPM
                  </td>
                  <td className="p-2 border-r border-[#0F1A34]/20">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-[#E5E2DA] h-2 border border-[#0F1A34]">
                        <div
                          className="bg-[#E0533C] h-full"
                          style={{ width: `${t.energy * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px]">{Math.round(t.energy * 100)}%</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-[#E5E2DA] h-2 border border-[#0F1A34]">
                        <div
                          className="bg-[#0F1A34] h-full"
                          style={{ width: `${t.danceability * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px]">{Math.round(t.danceability * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#2C221E] text-[#FBF9F4] uppercase text-[10px]">
              <tr>
                <th className="p-2 border-r border-[#FBF9F4]/20">SESSION ID</th>
                <th className="p-2 border-r border-[#FBF9F4]/20">ACTION</th>
                <th className="p-2 border-r border-[#FBF9F4]/20">TRACK</th>
                <th className="p-2">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F1A34]/20">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-[#2C221E]/50 italic">
                    No sessions logged yet. Skip tracks early or play tracks to populate SQLite audit trail.
                  </td>
                </tr>
              ) : (
                sessions.map((s, idx) => (
                  <tr key={s.sessionId} className={idx % 2 === 0 ? 'bg-[#FBF9F4]' : 'bg-white'}>
                    <td className="p-2 border-r border-[#0F1A34]/20 font-bold text-[#0F1A34]">
                      #00{s.sessionId}
                    </td>
                    <td className="p-2 border-r border-[#0F1A34]/20">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border border-[#0F1A34] ${
                        s.actionType === 'SKIPPED_EARLY'
                          ? 'bg-[#E0533C] text-[#FBF9F4]'
                          : 'bg-[#2C221E] text-[#FBF9F4]'
                      }`}>
                        {s.actionType}
                      </span>
                    </td>
                    <td className="p-2 border-r border-[#0F1A34]/20 font-semibold text-[#2C221E]">
                      {s.trackTitle}
                    </td>
                    <td className="p-2 text-[#2C221E]/70 text-[10px]">
                      {new Date(s.timestamp).toLocaleTimeString()} ({new Date(s.timestamp).toLocaleDateString()})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-[#0F1A34]/70">
        <span>SQLite DAO Query: <code>CapsuleDao.getAllSavedTimeCapsuleTracks()</code></span>
        <span>Flow Emit: Continuous Local State Sync</span>
      </div>
    </div>
  );
};
