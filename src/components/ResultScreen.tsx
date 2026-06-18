import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, Download, Star, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { AppState } from '../types';

interface ResultScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function ResultScreen({ state, setState }: ResultScreenProps) {
  const [showRejected, setShowRejected] = useState(false);

  const handleRestart = () => {
    setState(s => ({ ...s, view: 'config', winners: [], rejected: [] }));
  };

  const handleDownloadWinners = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Prize,Content,Winner ID,Winner Name\n"
      + state.winners.map(w => `${w.prize.name},${w.prize.content},${w.player.id},${w.player.name}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `winners_${state.eventName || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRejected = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Disqualified Prize,Content,Player ID,Player Name\n"
      + state.rejected.map(w => `${w.prize?.name || 'N/A'},${w.prize?.content || ''},${w.player.id},${w.player.name}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `violations_${state.eventName || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full bg-black/40 backdrop-blur-md p-6 text-white flex flex-col items-center overflow-hidden">
      
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-2 mb-6 shrink-0"
      >
        <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-wider text-center line-clamp-1">
          {state.eventName || 'Final Results'}
        </h1>
        
        {/* Toggle View */}
        <div className="flex bg-white/10 rounded-full p-1 mt-2">
          <button
            onClick={() => setShowRejected(false)}
            className={`px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-colors ${!showRejected ? 'bg-yellow-500 text-black' : 'text-white/60 hover:text-white'}`}
          >
            <Trophy className="w-4 h-4" /> Awarded ({state.winners.length})
          </button>
          <button
            onClick={() => setShowRejected(true)}
            className={`px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-colors ${showRejected ? 'bg-red-500 text-white' : 'text-white/60 hover:text-white'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Violations ({state.rejected.length})
          </button>
        </div>
      </motion.div>

      {/* Grid Content Area (scrollable strictly inside here if too many, but grid aims to fit them) */}
      <div className="w-full flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        <AnimatePresence mode="wait">
          {!showRejected ? (
            <motion.div
              key="winners-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 place-items-stretch"
            >
              {state.winners.length === 0 ? (
                <div className="col-span-full text-center text-white/40 py-20 text-xl italic flex flex-col items-center">
                  <span className="mb-2 text-4xl">🥺</span>
                  No winners yet.
                </div>
              ) : (
                state.winners.map((winner, index) => (
                  <motion.div
                    key={winner.player.id + index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    className="bg-gradient-to-b from-white/10 to-white/5 border border-yellow-500/30 rounded-xl p-4 flex flex-col items-center justify-between shadow-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="bg-yellow-500/20 w-12 h-12 rounded-full flex items-center justify-center border border-yellow-500/50 mb-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <Star className="w-6 h-6 text-yellow-400" />
                    </div>
                    
                    <div className="text-center mb-4 w-full">
                      <h3 className="text-lg font-bold text-yellow-400 truncate w-full" title={winner.prize.name}>
                        {winner.prize.name}
                      </h3>
                      <p className="text-white/60 text-xs font-medium truncate w-full" title={winner.prize.content}>
                        {winner.prize.content}
                      </p>
                    </div>

                    <div className="bg-black/40 w-full py-3 px-2 rounded-lg border border-white/10 text-center">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1.5 font-bold">Winner</p>
                      <p className="text-sm font-bold text-yellow-400 truncate w-full" title={winner.player.name}>
                        {winner.player.name}
                      </p>
                      <p className="text-xl font-mono font-black text-white tracking-wider truncate w-full mt-1" title={winner.player.id}>
                        ID {winner.player.id}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="rejected-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 place-items-stretch"
            >
              {state.rejected.length === 0 ? (
                <div className="col-span-full text-center text-white/40 py-20 text-xl italic flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-green-500/50 mb-2" />
                  No violations.
                </div>
              ) : (
                state.rejected.map((w, index) => (
                  <motion.div
                    key={'rej'+w.player.id + index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    className="bg-gradient-to-b from-red-900/40 to-black/40 border border-red-500/30 rounded-xl p-4 flex flex-col items-center justify-between shadow-xl"
                  >
                    <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center border border-red-500/50 mb-3 text-red-500">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    
                    <div className="text-center mb-4 w-full">
                      <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Disqualified Prize</p>
                      <h3 className="text-sm font-bold text-red-400 truncate w-full" title={w.prize?.name}>
                        {w.prize?.name || 'Unknown'}
                      </h3>
                    </div>

                    <div className="bg-black/60 w-full py-3 px-2 rounded-lg border border-red-500/20 text-center">
                      <p className="text-[10px] text-red-500/50 uppercase tracking-widest mb-1.5 font-bold">Disqualified</p>
                      <p className="text-sm font-bold text-red-400 truncate w-full" title={w.player.name}>
                        {w.player.name}
                      </p>
                      <p className="text-xl font-mono font-black text-white/50 tracking-wider line-through truncate w-full mt-1" title={w.player.id}>
                        ID {w.player.id}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="shrink-0 mt-6 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownloadWinners}
          className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-all text-sm backdrop-blur-md"
        >
          <Trophy className="w-4 h-4" /> Export Winners
        </button>
        {state.rejected.length > 0 && (
          <button
            onClick={handleDownloadRejected}
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-100 font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-all text-sm backdrop-blur-md"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" /> Export Violations
          </button>
        )}
        <button
          onClick={handleRestart}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105 text-sm ml-4"
        >
          <RefreshCcw className="w-4 h-4" /> Restart
        </button>
      </div>
    </div>
  );
}
