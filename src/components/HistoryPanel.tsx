import React, { useState } from 'react';
import { History, Trophy, AlertTriangle } from 'lucide-react';
import { AppState } from '../types';

interface HistoryPanelProps {
  state: AppState;
}

export default function HistoryPanel({ state }: HistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'winners' | 'rejected'>('winners');

  return (
    <div className="w-full h-full flex flex-col bg-black/60 backdrop-blur-xl border-r border-white/20 shadow-2xl overflow-hidden">
      <div className="flex items-center p-4 border-b border-white/10 bg-white/5 shrink-0">
        <h3 className="font-bold text-sm md:text-base text-white flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          Lịch sử
        </h3>
      </div>

      <div className="flex border-b border-white/10 shrink-0">
        <button
          onClick={() => setActiveTab('winners')}
          className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'winners' ? 'bg-green-500/20 text-green-400 border-b-2 border-green-500' : 'text-white/50 hover:bg-white/5'}`}
        >
          Đã trao ({state.winners.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'rejected' ? 'bg-red-500/20 text-red-400 border-b-2 border-red-500' : 'text-white/50 hover:bg-white/5'}`}
        >
          Vi phạm ({state.rejected.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {activeTab === 'winners' && (
          <div className="space-y-3">
            {state.winners.length === 0 ? (
              <p className="text-white/40 text-center py-6 text-sm">Chưa có người trúng giải</p>
            ) : (
              state.winners.map((w, i) => (
                <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-green-400 font-bold text-sm truncate">{w.player.id}</p>
                    <p className="text-white/70 text-xs truncate">{w.player.name}</p>
                    <p className="text-white/40 text-[10px] mt-1 truncate">Giải: {w.prize?.name || 'Không rõ'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div className="space-y-3">
            {state.rejected.length === 0 ? (
              <p className="text-white/40 text-center py-6 text-sm">Chưa có người vi phạm</p>
            ) : (
              state.rejected.map((w, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-red-400 font-bold text-sm truncate">{w.player.id}</p>
                    <p className="text-white/70 text-xs truncate">{w.player.name}</p>
                    <p className="text-white/40 text-[10px] mt-1 truncate">Giải: {w.prize?.name || 'Không rõ'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
