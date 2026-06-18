import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Trophy, AlertTriangle, X, Award, Eye, UserX, Clock } from 'lucide-react';
import { AppState } from '../types';

interface HistoryPanelProps {
  state: AppState;
}

export default function HistoryPanel({ state }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'winners' | 'rejected'>('winners');

  const winnersCount = state.winners.length;
  const rejectedCount = state.rejected.length;
  const totalCount = winnersCount + rejectedCount;

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        id="history-toggle-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-[90] bg-slate-900/95 hover:bg-slate-800 border border-white/10 rounded-full h-11 px-4 flex items-center gap-2.5 shadow-xl transition-all duration-200"
      >
        <div className="relative">
          <History className="w-4 h-4 text-cyan-400" />
          {totalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white font-mono text-[8.5px] font-black flex items-center justify-center animate-pulse">
              {totalCount}
            </span>
          )}
        </div>
        <span className="text-xs font-black tracking-widest text-white/95 uppercase">
          HISTORY LOGS
        </span>
      </motion.button>

      {/* Slide-out Sidebar Drawer & Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
            />

            {/* Side drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-950/95 border-l border-white/10 z-[201] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <History className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white tracking-widest uppercase">
                      LIVESTREAM EVENTS DIARY
                    </h3>
                    <p className="text-[10px] text-white/40 tracking-wider">
                      Draw logs & verification history
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Dynamic Stats Overview */}
              <div className="px-5 py-4 bg-slate-900/20 border-b border-white/5 grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                    <Award className="w-3 h-3" /> AWARDED
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">{winnersCount}</span>
                    <span className="text-[10px] text-white/30">players</span>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black text-red-400 tracking-wider uppercase flex items-center gap-1">
                    <UserX className="w-3 h-3" /> DISQUALIFIED
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">{rejectedCount}</span>
                    <span className="text-[10px] text-white/30">draws</span>
                  </div>
                </div>
              </div>

              {/* Sub-tab Selectors */}
              <div className="flex bg-slate-950 p-1.5 border-b border-white/5 shrink-0">
                <button
                  onClick={() => setActiveTab('winners')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'winners'
                      ? 'bg-slate-900 border border-white/10 text-cyan-400 shadow-inner'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Awarded Winners ({winnersCount})
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'rejected'
                      ? 'bg-slate-900 border border-white/10 text-red-400 shadow-inner'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cancelled ({rejectedCount})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-950/50">
                <AnimatePresence mode="wait">
                  {activeTab === 'winners' ? (
                    <motion.div
                      key="winners-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {winnersCount === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                          <Trophy className="w-12 h-12 text-white/10 stroke-[1]" />
                          <p className="text-xs text-white/30 italic">No prize awards recorded yet.</p>
                        </div>
                      ) : (
                        state.winners.map((w, idx) => (
                          <div
                            key={`winner-${idx}`}
                            className="bg-slate-900/60 border border-white/5 hover:border-emerald-500/20 rounded-xl p-3.5 flex items-start justify-between gap-3 transition-colors relative group"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-mono text-[11px] font-black">
                                #{state.winners.length - idx}
                              </div>
                              <div className="min-w-0">
                                <span className="font-mono text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded tracking-widest uppercase">
                                  ID: {w.player.id}
                                </span>
                                <h4 className="text-white font-bold text-xs mt-1 truncate">
                                  {w.player.name}
                                </h4>
                                <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-yellow-400" />
                                  Prize: <span className="text-yellow-400 font-semibold">{w.prize?.name || 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-black uppercase shrink-0">
                              CLAIMED
                            </span>
                          </div>
                        ))
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rejected-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {rejectedCount === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                          <AlertTriangle className="w-12 h-12 text-white/10 stroke-[1]" />
                          <p className="text-xs text-white/30 italic">No cancelled draw audits recorded.</p>
                        </div>
                      ) : (
                        state.rejected.map((r, idx) => (
                          <div
                            key={`rejected-${idx}`}
                            className="bg-slate-900/40 border border-white/5 hover:border-red-500/20 rounded-xl p-3.5 flex items-start justify-between gap-3 transition-colors relative group"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-red-400/10 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0 font-mono text-[11px] font-black">
                                #{state.rejected.length - idx}
                              </div>
                              <div className="min-w-0">
                                <span className="font-mono text-[9px] font-black bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded tracking-widest uppercase line-through">
                                  ID: {r.player.id}
                                </span>
                                <h4 className="text-white/60 font-medium text-xs mt-1 truncate line-through">
                                  {r.player.name}
                                </h4>
                                <p className="text-[10px] text-white/40 mt-1 flex items-center gap-1 truncate text-ellipsis">
                                  <Clock className="w-3 h-3 text-red-400" />
                                  Rejected Prize: <span className="text-red-400 font-semibold">{r.prize?.name || 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full font-black uppercase shrink-0">
                              REJECTED
                            </span>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/10 bg-slate-900 text-center text-[10px] text-white/30 tracking-wider">
                COMMITTED AUDIT TRAILS PERTAINING REGISTRATION POOL
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
