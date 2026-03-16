import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, XSquare, AlertCircle, Skull, Gift, Package } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game7ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function Game7Screen({ state, setState }: Game7ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([...state.players]);
  const [phase, setPhase] = useState<'idle' | 'opening' | 'finished'>('idle');
  const [winner, setWinner] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [round, setRound] = useState(1);
  const [eliminatedInRound, setEliminatedInRound] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<{ id: number; status: 'closed' | 'safe' | 'bomb' }[]>([]);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  useEffect(() => {
    const remaining = state.players.filter(p => !state.winners.some(w => w.player.id === p.id));
    setRemainingPlayers(remaining);
    setPhase('idle');
    setWinner(null);
    setRound(1);
    resetBoxes();
  }, [currentPrizeIndex, state.players, state.winners]);

  const resetBoxes = () => {
    setBoxes(Array.from({ length: 12 }).map((_, i) => ({ id: i, status: 'closed' })));
  };

  const startOpening = () => {
    if (remainingPlayers.length <= 1) {
      handleWin(remainingPlayers[0]);
      return;
    }

    setPhase('opening');
    setEliminatedInRound([]);

    // Open boxes one by one
    let currentBox = 0;
    const interval = setInterval(() => {
      if (currentBox >= boxes.length) {
        clearInterval(interval);
        
        // Finalize round
        setTimeout(() => {
          const countToEliminate = Math.max(1, Math.floor(remainingPlayers.length * 0.4));
          const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
          const toEliminate = shuffled.slice(0, countToEliminate);
          const survivors = shuffled.slice(countToEliminate);

          setEliminatedInRound(toEliminate.map(p => p.id));

          setTimeout(() => {
            if (survivors.length <= 1) {
              handleWin(survivors[0]);
            } else {
              setRemainingPlayers(survivors);
              setPhase('idle');
              setRound(r => r + 1);
              setEliminatedInRound([]);
              resetBoxes();
            }
          }, 1500);
        }, 1000);
        return;
      }

      setBoxes(prev => prev.map((b, i) => {
        if (i === currentBox) {
          return { ...b, status: Math.random() > 0.6 ? 'bomb' : 'safe' };
        }
        return b;
      }));
      currentBox++;
    }, 300);
  };

  const handleWin = (winnerPlayer: Player) => {
    setWinner(winnerPlayer);
    setPhase('finished');
    triggerConfetti();
    
    setState(s => ({
      ...s,
      winners: [...s.winners, { prize: currentPrize!, player: winnerPlayer }]
    }));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#f43f5e', '#ffffff']
    });
  };

  const nextPrize = () => {
    setCurrentPrizeIndex(prev => prev + 1);
  };

  if (!currentPrize) return null;

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 text-white overflow-hidden relative bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4c0519_0%,#000000_100%)] z-0" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <Gift className="w-10 h-10 text-pink-400" />
          <div>
            <p className="text-xs text-pink-400 font-bold uppercase tracking-widest">
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

      {/* Boxes Area */}
      <div className="flex-1 relative z-10 flex flex-col md:flex-row gap-8 min-h-0 items-center justify-center">
        <div className="flex-1 max-w-4xl grid grid-cols-3 sm:grid-cols-4 gap-4 p-6 bg-black/40 rounded-3xl border border-pink-900/30">
          {boxes.map((box) => (
            <motion.div
              key={box.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
                box.status === 'closed' ? 'bg-pink-900/20 border-pink-500/30' :
                box.status === 'safe' ? 'bg-emerald-500/20 border-emerald-500/50' :
                'bg-red-500/20 border-red-500/50'
              }`}
            >
              <AnimatePresence mode="wait">
                {box.status === 'closed' ? (
                  <motion.div key="closed" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} exit={{ rotateY: -90 }}>
                    <Package className="w-12 h-12 text-pink-400/50" />
                  </motion.div>
                ) : box.status === 'safe' ? (
                  <motion.div key="safe" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <Gift className="w-12 h-12 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400">SAFE</span>
                  </motion.div>
                ) : (
                  <motion.div key="bomb" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <Skull className="w-12 h-12 text-red-500" />
                    <span className="text-[10px] font-bold text-red-500">BOMB</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
          <div className="bg-pink-950/20 rounded-2xl border border-pink-900/30 p-4">
            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest mb-3">
              Players ({remainingPlayers.length})
            </h3>
            <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-wrap gap-1">
              {remainingPlayers.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  animate={{ 
                    scale: eliminatedInRound.includes(p.id) ? [1, 1.2, 0] : 1,
                    opacity: eliminatedInRound.includes(p.id) ? 0 : 1,
                    backgroundColor: eliminatedInRound.includes(p.id) ? '#ef4444' : 'rgba(255,255,255,0.05)'
                  }}
                  className="px-2 py-1 rounded text-[10px] font-mono border border-white/10"
                >
                  {p.id}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            {phase === 'idle' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startOpening}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 tracking-widest uppercase text-lg"
              >
                <Play className="w-6 h-6" /> OPEN BOXES
              </motion.button>
            )}

            {phase === 'finished' && winner && (
              <div className="text-center p-6 bg-slate-900/80 rounded-3xl border-2 border-pink-500 w-full shadow-2xl">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white mb-1">{winner.id}</p>
                <p className="text-lg font-bold text-pink-300 mb-6">{winner.name}</p>
                <button onClick={nextPrize} className="w-full bg-pink-500 hover:bg-pink-400 text-white font-black py-3 rounded-xl transition-transform hover:scale-105">
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
