import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCcw, Download, Star } from 'lucide-react';
import { AppState } from '../types';

interface ResultScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function ResultScreen({ state, setState }: ResultScreenProps) {
  const handleRestart = () => {
    setState(s => ({ ...s, view: 'config', winners: [] }));
  };

  const handleDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Prize,Content,Winner ID\n"
      + state.winners.map(w => `${w.prize.name},${w.prize.content},${w.playerId}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `results_${state.eventName || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black/40 backdrop-blur-md p-8 text-white flex flex-col items-center overflow-y-auto">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-4 mb-12"
      >
        <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-wider text-center">
          Final Results
        </h1>
        <p className="text-2xl font-medium text-white/80">{state.eventName}</p>
      </motion.div>

      <div className="w-full max-w-4xl grid gap-6">
        {state.winners.map((winner, index) => (
          <motion.div
            key={winner.playerId + index}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-yellow-400">{winner.prize.name}</h3>
                <p className="text-white/60 font-medium">{winner.prize.content}</p>
              </div>
            </div>

            <div className="bg-black/40 px-8 py-4 rounded-xl border border-white/10 text-center min-w-[250px]">
              <p className="text-sm text-white/40 uppercase tracking-widest mb-1 font-bold">Winner ID</p>
              <p className="text-4xl font-mono font-black text-white tracking-wider">{winner.playerId}</p>
            </div>
          </motion.div>
        ))}

        {state.winners.length === 0 && (
          <div className="text-center text-white/40 py-20 text-xl italic">
            No winners yet.
          </div>
        )}
      </div>

      <div className="mt-16 flex gap-6">
        <button
          onClick={handleDownload}
          className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 transition-all backdrop-blur-md"
        >
          <Download className="w-6 h-6" /> Download CSV
        </button>
        <button
          onClick={handleRestart}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 px-8 rounded-full shadow-lg flex items-center gap-3 transition-transform hover:scale-105"
        >
          <RefreshCcw className="w-6 h-6" /> Restart Game
        </button>
      </div>
    </div>
  );
}
