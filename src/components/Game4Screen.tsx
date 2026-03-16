import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, XSquare, AlertCircle, ArrowRight, Skull, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game4ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function Game4Screen({ state, setState }: Game4ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([...state.players]);
  const [phase, setPhase] = useState<'idle' | 'eliminating' | 'finished'>('idle');
  const [warningIds, setWarningIds] = useState<string[]>([]);
  const [eliminatedInRound, setEliminatedInRound] = useState<string[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [round, setRound] = useState(1);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  const GRID_SIZE = 10; // 10x10 grid

  const playersWithPos = useMemo(() => {
    return remainingPlayers.map((p, i) => ({
      ...p,
      row: Math.floor(i / GRID_SIZE) % GRID_SIZE,
      col: i % GRID_SIZE
    }));
  }, [remainingPlayers]);

  const startElimination = () => {
    if (remainingPlayers.length <= 1) {
      handleWin(remainingPlayers[0]);
      return;
    }

    setPhase('eliminating');
    setEliminatedInRound([]);
    setWarningIds([]);

    // Determine how many to eliminate (e.g., 40% of remaining)
    const countToEliminate = Math.max(1, Math.floor(remainingPlayers.length * 0.4));
    const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, countToEliminate);
    const survivors = shuffled.slice(countToEliminate);

    const idsToEliminate = toEliminate.map(p => p.id);

    // Step 1: Warning phase (flashing red)
    setWarningIds(idsToEliminate);

    setTimeout(() => {
      // Step 2: Elimination phase (pop animation)
      setEliminatedInRound(idsToEliminate);
      setWarningIds([]);

      setTimeout(() => {
        if (survivors.length <= 1) {
          handleWin(survivors[0]);
        } else {
          setRemainingPlayers(survivors);
          setPhase('idle');
          setRound(r => r + 1);
          setEliminatedInRound([]);
        }
      }, 1000);
    }, 4000);
  };

  const handleWin = (winnerPlayer: Player) => {
    setWinner(winnerPlayer);
    setPhase('finished');
    triggerConfetti();
    
    setState(s => ({
      ...s,
      winners: [...s.winners, { prize: currentPrize, player: winnerPlayer }]
    }));
    // Reset for next prize
    setRemainingPlayers(prev => prev.filter(p => p.id !== winnerPlayer.id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f97316', '#ffffff']
    });
  };

  const nextPrize = () => {
    setCurrentPrizeIndex(prev => prev + 1);
    setPhase('idle');
    setWinner(null);
    setRound(1);
    setRemainingPlayers([...state.players.filter(p => !state.winners.some(w => w.player.id === p.id))]);
  };

  useEffect(() => {
    if (isFinished) {
      setState(s => ({ ...s, view: 'result' }));
    }
  }, [isFinished, setState]);

  if (!currentPrize) return null;

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 text-white overflow-hidden relative bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,#000000_100%)] z-0" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <Skull className="w-10 h-10 text-red-500" />
          <div>
            <p className="text-xs text-red-400 font-bold uppercase tracking-widest">
              {state.eventName || 'Event'} | ROUND {round}
            </p>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              {currentPrize.name}
            </h2>
            <p className="text-sm text-gray-400">{currentPrize.content}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setState(s => ({ ...s, view: 'config' }))} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition border border-white/10 text-xs font-bold uppercase tracking-widest">Home</button>
          <button onClick={() => setConfirmDialog('reset')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition border border-white/10"><RotateCcw className="w-5 h-5" /></button>
          <button onClick={() => setConfirmDialog('stop')} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-3 rounded-xl transition border border-red-500/20"><XSquare className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 relative z-10 flex flex-col md:flex-row gap-8 min-h-0 items-center justify-center">
        <div className="flex-1 max-w-5xl bg-black/40 rounded-3xl border border-red-900/30 p-4 overflow-y-auto custom-scrollbar flex items-center justify-center">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1 md:gap-2 w-full">
            {playersWithPos.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ scale: 0 }}
                animate={{ 
                  scale: eliminatedInRound.includes(p.id) ? 0 : 1,
                  opacity: eliminatedInRound.includes(p.id) ? 0 : 1,
                  backgroundColor: warningIds.includes(p.id) 
                    ? ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.8)'] 
                    : eliminatedInRound.includes(p.id) ? '#ef4444' : 'rgba(255,255,255,0.05)',
                  borderColor: warningIds.includes(p.id) ? '#ef4444' : 'rgba(255,255,255,0.1)'
                }}
                transition={{
                  backgroundColor: { 
                    repeat: warningIds.includes(p.id) ? Infinity : 0, 
                    duration: 0.4 
                  },
                  scale: { duration: 0.5 }
                }}
                className="aspect-square rounded-md border flex flex-col items-center justify-center p-0.5 text-[8px] md:text-[10px] relative overflow-hidden"
              >
                <div className="font-bold truncate w-full text-center">{p.id}</div>
                <div className="opacity-50 truncate w-full text-center hidden sm:block">{p.name}</div>
                {(warningIds.includes(p.id) || eliminatedInRound.includes(p.id)) && (
                  <Skull className={`absolute inset-0 m-auto w-4 h-4 md:w-6 md:h-6 ${warningIds.includes(p.id) ? 'text-white/40 animate-pulse' : 'text-white/20'}`} />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 flex flex-col gap-4 shrink-0">
          <div className="bg-red-950/20 rounded-2xl border border-red-900/30 p-4">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Survivors ({remainingPlayers.length})
            </h3>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
              {remainingPlayers.map(p => (
                <div key={p.id} className="flex justify-between text-xs py-1 border-b border-white/5">
                  <span className="font-mono">{p.id}</span>
                  <span className="truncate ml-2 opacity-60">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {phase === 'idle' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startElimination}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 tracking-widest uppercase"
              >
                ELIMINATE
              </motion.button>
            )}

            {phase === 'finished' && winner && (
              <div className="text-center p-6 bg-slate-800 rounded-3xl border-2 border-yellow-500 w-full">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white mb-1">{winner.id}</p>
                <p className="text-lg font-bold text-blue-300 mb-6">{winner.name}</p>
                <button onClick={nextPrize} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-xl transition-transform hover:scale-105">
                  NEXT PRIZE
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Are you sure?</h3>
              <p className="text-white/60 mb-8">{confirmDialog === 'reset' ? 'Restart the entire game?' : 'End the game and see results?'}</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition">Cancel</button>
                <button onClick={() => { if (confirmDialog === 'reset') setState(s => ({ ...s, view: 'config', winners: [] })); else setState(s => ({ ...s, view: 'result' })); }} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 transition">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
