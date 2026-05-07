import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Trophy, AlertTriangle, GripHorizontal, EyeOff, Eye } from 'lucide-react';
import { AppState } from '../types';

interface HistoryPanelProps {
  state: AppState;
}

export default function HistoryPanel({ state }: HistoryPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <motion.div
      ref={panelRef}
      drag
      dragMomentum={false}
      className={`absolute z-[100] bg-black/70 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-auto h-auto rounded-full cursor-grab active:cursor-grabbing' : 'w-full max-w-[320px] md:max-w-[400px] lg:max-w-[500px] rounded-2xl'
      }`}
      style={{
        top: 80,
        left: 20,
        maxHeight: isMinimized ? 'auto' : '50vh'
      }}
    >
      {isMinimized ? (
        <div 
          className="p-3 md:p-4 flex items-center justify-center gap-2 group"
          onClick={(e) => {
            // Prevent dragging from immediately triggering click
            setIsMinimized(false);
          }}
          title="Show history"
        >
          <History className="w-5 h-5 md:w-6 md:h-6 text-blue-400 group-hover:hidden" />
          <GripHorizontal className="w-5 h-5 md:w-6 md:h-6 text-white/50 hidden group-hover:block" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center p-2 bg-white/10 border-b border-white/10 shrink-0 group">
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing flex-1">
              <History className="w-4 h-4 text-blue-400 group-hover:hidden" />
              <GripHorizontal className="w-4 h-4 text-white/50 hidden group-hover:block" />
              <h3 className="font-bold text-sm text-white select-none shrink-0">Lịch sử</h3>
            </div>
            <button 
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
              title="Hide panel"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden p-2 md:p-3 gap-2 md:gap-3 cursor-default">
            {/* Winners Column */}
            <div className="flex-1 flex flex-col border border-green-500/30 rounded-xl bg-green-500/5 overflow-hidden">
              <div className="bg-green-500/20 p-2 text-center text-xs font-bold text-green-400 shrink-0">
                Awarded ({state.winners.length})
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {state.winners.length === 0 ? (
                  <p className="text-white/40 text-center py-4 text-xs italic">No winners yet</p>
                ) : (
                  <div className="space-y-2">
                    {state.winners.map((w, i) => (
                      <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex items-start gap-2">
                        <Trophy className="w-3 h-3 md:w-4 md:h-4 text-green-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-green-400 font-bold text-xs md:text-sm truncate">{w.player.id}</p>
                          <p className="text-white/70 text-[10px] truncate">{w.player.name}</p>
                          <p className="text-white/40 text-[10px] mt-0.5 truncate">Prize: {w.prize?.name || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rejected Column */}
            <div className="flex-1 flex flex-col border border-red-500/30 rounded-xl bg-red-500/5 overflow-hidden">
              <div className="bg-red-500/20 p-2 text-center text-xs font-bold text-red-400 shrink-0">
                Violations ({state.rejected.length})
              </div>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {state.rejected.length === 0 ? (
                  <p className="text-white/40 text-center py-4 text-xs italic">No violations</p>
                ) : (
                  <div className="space-y-2">
                    {state.rejected.map((w, i) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-red-400 font-bold text-xs md:text-sm truncate">{w.player.id}</p>
                          <p className="text-white/70 text-[10px] truncate">{w.player.name}</p>
                          <p className="text-white/40 text-[10px] mt-0.5 truncate">Prize: {w.prize?.name || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
