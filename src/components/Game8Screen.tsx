import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, XSquare, AlertCircle, Rocket, Star, Zap, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game8ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface PlayerWithDistance extends Player {
  distance: number;
  isEliminated: boolean;
}

export default function Game8Screen({ state, setState }: Game8ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [players, setPlayers] = useState<PlayerWithDistance[]>([]);
  const [phase, setPhase] = useState<'idle' | 'racing' | 'finished'>('idle');
  const [winner, setWinner] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [round, setRound] = useState(1);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  const TARGET_DISTANCE = 100;

  useEffect(() => {
    const remaining = state.players.filter(p => !state.winners.some(w => w.player.id === p.id));
    setPlayers(remaining.map(p => ({ ...p, distance: 0, isEliminated: false })));
    setPhase('idle');
    setWinner(null);
    setRound(1);
  }, [currentPrizeIndex, state.players, state.winners]);

  const startRace = () => {
    if (players.filter(p => !p.isEliminated).length === 0) return;
    setPhase('racing');

    const interval = setInterval(() => {
      setPlayers(prev => {
        const next = prev.map(p => {
          if (p.isEliminated) return p;
          
          // Randomly eliminate some players during the race
          if (Math.random() > 0.98 && prev.filter(pl => !pl.isEliminated).length > 1) {
            return { ...p, isEliminated: true };
          }

          const speed = Math.random() * 5 + 2;
          const newDistance = Math.min(TARGET_DISTANCE, p.distance + speed);
          return { ...p, distance: newDistance };
        });

        const winners = next.filter(p => p.distance >= TARGET_DISTANCE && !p.isEliminated);
        if (winners.length > 0) {
          clearInterval(interval);
          setTimeout(() => {
            const finalWinner = winners[Math.floor(Math.random() * winners.length)];
            handleWin(finalWinner);
          }, 500);
        }

        return next;
      });
    }, 100);
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
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#fbbf24', '#3b82f6']
    });
  };

  const nextPrize = () => {
    setCurrentPrizeIndex(prev => prev + 1);
  };

  if (!currentPrize) return null;

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 text-white overflow-hidden relative bg-slate-950">
      {/* Stars Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#000000_100%)] z-0" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <Rocket className="w-10 h-10 text-indigo-400" />
          <div>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
              {state.eventName || 'Event'} | SPACE RACE
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

      {/* Race Area */}
      <div className="flex-1 relative z-10 flex flex-col gap-4 min-h-0 overflow-hidden">
        <div className="flex-1 bg-black/40 rounded-3xl border border-indigo-900/30 p-6 overflow-y-auto custom-scrollbar relative">
          {/* Moon/Finish Line */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-32 h-32 bg-slate-200 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-slate-300 opacity-50 rounded-full" style={{ clipPath: 'circle(20% at 30% 30%)' }} />
            <div className="absolute inset-0 bg-slate-300 opacity-50 rounded-full" style={{ clipPath: 'circle(15% at 70% 60%)' }} />
            <div className="absolute inset-0 bg-slate-300 opacity-50 rounded-full" style={{ clipPath: 'circle(10% at 50% 80%)' }} />
            <Star className="w-12 h-12 text-slate-400 opacity-20" />
          </div>

          <div className="space-y-4 pr-40">
            {players.map((p) => (
              <div key={p.id} className="relative h-10 flex items-center">
                <div className="absolute left-0 w-full h-0.5 bg-white/5 top-1/2 -translate-y-1/2" />
                <motion.div
                  animate={{ 
                    left: `${p.distance}%`,
                    opacity: p.isEliminated ? 0.3 : 1,
                    scale: p.isEliminated ? 0.8 : 1
                  }}
                  className="absolute flex items-center gap-3"
                >
                  <div className="relative">
                    <Rocket className={`w-8 h-8 ${p.isEliminated ? 'text-red-900' : 'text-indigo-400'} rotate-90`} />
                    {!p.isEliminated && phase === 'racing' && (
                      <motion.div 
                        animate={{ opacity: [0, 1, 0], x: [-5, -15] }}
                        transition={{ repeat: Infinity, duration: 0.2 }}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-2 bg-orange-500 rounded-full blur-sm"
                      />
                    )}
                    {p.isEliminated && <Skull className="absolute inset-0 m-auto w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold leading-none">{p.id}</span>
                    <span className="text-[8px] opacity-50 leading-none truncate max-w-[60px]">{p.name}</span>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          {phase === 'idle' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRace}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 py-4 rounded-2xl shadow-2xl flex items-center gap-3 tracking-widest uppercase text-xl"
            >
              <Zap className="w-6 h-6" /> LAUNCH ROCKETS
            </motion.button>
          )}

          {phase === 'finished' && winner && (
            <div className="text-center p-8 bg-slate-900/90 backdrop-blur-xl rounded-3xl border-2 border-indigo-500 shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-3xl font-black text-white mb-1">{winner.id}</p>
              <p className="text-xl font-bold text-indigo-300 mb-8">{winner.name}</p>
              <button onClick={nextPrize} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-xl transition-all hover:scale-105">
                NEXT PRIZE
              </button>
            </div>
          )}
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
