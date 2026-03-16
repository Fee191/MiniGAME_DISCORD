import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, XSquare, AlertCircle, ArrowRight, ChevronUp, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game5ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface PlayerWithLevel extends Player {
  level: number;
}

export default function Game5Screen({ state, setState }: Game5ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [players, setPlayers] = useState<PlayerWithLevel[]>([]);
  const [phase, setPhase] = useState<'idle' | 'climbing' | 'selecting' | 'finished'>('idle');
  const [finalists, setFinalists] = useState<PlayerWithLevel[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [round, setRound] = useState(1);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  const MAX_LEVEL = 10;

  useEffect(() => {
    const remaining = state.players.filter(p => !state.winners.some(w => w.player.id === p.id));
    setPlayers(remaining.map(p => ({ ...p, level: 0 })));
    setFinalists([]);
  }, [currentPrizeIndex, state.players, state.winners]);

  const startClimb = () => {
    if (players.length === 0) return;
    setPhase('climbing');

    setTimeout(() => {
      const newPlayers = players.map(p => {
        const roll = Math.random();
        let move = 0;
        if (roll > 0.85) move = 2;
        else if (roll > 0.45) move = 1;
        
        return { ...p, level: Math.min(MAX_LEVEL, p.level + move) };
      });

      setPlayers(newPlayers);
      
      const winnersAtTop = newPlayers.filter(p => p.level === MAX_LEVEL);
      if (winnersAtTop.length > 0) {
        setFinalists(winnersAtTop);
        setPhase('selecting');
        
        // Wait for finalists to be seen, then pick one
        setTimeout(() => {
          const finalWinner = winnersAtTop[Math.floor(Math.random() * winnersAtTop.length)];
          handleWin(finalWinner);
        }, 2500);
      } else {
        setPhase('idle');
        setRound(r => r + 1);
      }
    }, 1500);
  };

  const handleWin = (winnerPlayer: Player) => {
    setWinner(winnerPlayer);
    setPhase('finished');
    triggerConfetti();
    
    setState(s => ({
      ...s,
      winners: [...s.winners, { prize: currentPrize, player: winnerPlayer }]
    }));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#ffffff']
    });
  };

  const nextPrize = () => {
    setCurrentPrizeIndex(prev => prev + 1);
    setPhase('idle');
    setWinner(null);
    setRound(1);
  };

  useEffect(() => {
    if (isFinished) {
      setState(s => ({ ...s, view: 'result' }));
    }
  }, [isFinished, setState]);

  const levels = useMemo(() => {
    const l = [];
    for (let i = MAX_LEVEL; i >= 0; i--) {
      l.push({
        level: i,
        players: players.filter(p => p.level === i)
      });
    }
    return l;
  }, [players]);

  if (!currentPrize) return null;

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 text-white overflow-hidden relative bg-indigo-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#000000_100%)] z-0" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <ChevronUp className="w-10 h-10 text-indigo-400 animate-bounce" />
          <div>
            <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">
              {state.eventName || 'Event'} | ROUND {round}
            </p>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              {currentPrize.name}
            </h2>
            <p className="text-sm text-indigo-200/60">{currentPrize.content}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setState(s => ({ ...s, view: 'config' }))} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition border border-white/10 text-xs font-bold uppercase tracking-widest">Home</button>
          <button onClick={() => setConfirmDialog('reset')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition border border-white/10"><RotateCcw className="w-5 h-5" /></button>
          <button onClick={() => setConfirmDialog('stop')} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-3 rounded-xl transition border border-red-500/20"><XSquare className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Tower Area */}
      <div className="flex-1 relative z-10 flex flex-col md:flex-row gap-8 min-h-0">
        <div className="flex-1 bg-black/40 rounded-3xl border border-indigo-500/20 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-2 items-center justify-start">
          <div className="w-full max-w-3xl flex flex-col gap-2">
            {levels.map((l) => (
              <div 
                key={l.level} 
                style={{ 
                  width: `${Math.max(40, 100 - (l.level * 6))}%`,
                  margin: '0 auto'
                }}
                className={`
                  flex items-center gap-4 p-3 rounded-xl border transition-all duration-500 relative
                  ${l.level === MAX_LEVEL ? 'bg-yellow-500/10 border-yellow-500/50 min-h-[100px] shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-white/5 border-white/10'}
                  ${l.players.length > 0 ? 'opacity-100' : 'opacity-30'}
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 shadow-lg ${l.level === MAX_LEVEL ? 'bg-yellow-500 text-black' : 'bg-indigo-600 text-white'}`}>
                  {l.level}
                </div>
                <div className="flex-1 flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {l.players.length > 0 ? (
                    l.players.map(p => (
                      <motion.div
                        key={p.id}
                        layoutId={p.id}
                        animate={{
                          scale: (phase === 'selecting' && l.level === MAX_LEVEL) ? [1, 1.2, 1] : 1,
                          backgroundColor: (phase === 'selecting' && l.level === MAX_LEVEL) ? 'rgba(234, 179, 8, 0.4)' : 'rgba(255, 255, 255, 0.1)'
                        }}
                        transition={{ repeat: (phase === 'selecting' && l.level === MAX_LEVEL) ? Infinity : 0, duration: 0.5 }}
                        className="px-2 py-1 rounded text-[10px] font-mono border border-white/10 whitespace-nowrap text-white"
                      >
                        {p.id}
                      </motion.div>
                    ))
                  ) : (
                    <span className="text-xs text-white/20 italic">Empty</span>
                  )}
                </div>
                {l.level === MAX_LEVEL && (
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Trophy className={`w-8 h-8 ${phase === 'selecting' ? 'text-yellow-400 animate-pulse' : 'text-yellow-500'}`} />
                    {phase === 'selecting' && <span className="text-[10px] font-bold text-yellow-400 animate-bounce">PICKING...</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 flex flex-col gap-4 shrink-0">
          <div className="bg-indigo-900/20 rounded-2xl border border-indigo-500/20 p-4">
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Total Climbers</span>
                <span className="font-bold">{players.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Highest Level</span>
                <span className="font-bold text-yellow-400">{Math.max(...players.map(p => p.level), 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900/20 rounded-2xl border border-indigo-500/20 p-4 flex flex-col min-h-0 max-h-48">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Winners
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {state.winners.length === 0 ? (
                <p className="text-center text-white/30 italic py-2 text-[10px]">No winners yet</p>
              ) : (
                state.winners.map((w, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px]">
                    <p className="text-indigo-300 font-bold truncate">{w.prize.name}</p>
                    <p className="text-white font-mono">{w.player.id} - {w.player.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {phase === 'idle' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startClimb}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 tracking-widest uppercase"
              >
                CLIMB!
              </motion.button>
            )}

            {phase === 'climbing' && (
              <div className="text-center animate-pulse">
                <ChevronUp className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-indigo-300 tracking-widest">CLIMBING...</p>
              </div>
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
