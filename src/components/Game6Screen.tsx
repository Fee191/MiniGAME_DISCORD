import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, XSquare, AlertCircle, Skull, Footprints, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game6ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function Game6Screen({ state, setState }: Game6ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([...state.players]);
  const [phase, setPhase] = useState<'idle' | 'crossing' | 'finished'>('idle');
  const [step, setStep] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [round, setRound] = useState(1);
  const [eliminatedInStep, setEliminatedInStep] = useState<string[]>([]);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  const TOTAL_STEPS = 10;

  useEffect(() => {
    const remaining = state.players.filter(p => !state.winners.some(w => w.player.id === p.id));
    setRemainingPlayers(remaining);
    setStep(0);
    setPhase('idle');
    setWinner(null);
  }, [currentPrizeIndex, state.players, state.winners]);

  const startStep = () => {
    if (remainingPlayers.length <= 1) {
      handleWin(remainingPlayers[0]);
      return;
    }

    setPhase('crossing');
    setEliminatedInStep([]);

    setTimeout(() => {
      // Eliminate some players at this step
      const countToEliminate = Math.max(1, Math.floor(remainingPlayers.length * 0.3));
      const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
      const toEliminate = shuffled.slice(0, countToEliminate);
      const survivors = shuffled.slice(countToEliminate);

      setEliminatedInStep(toEliminate.map(p => p.id));

      setTimeout(() => {
        if (survivors.length <= 1) {
          handleWin(survivors[0]);
        } else if (step + 1 >= TOTAL_STEPS) {
          // If reached end, pick one from survivors
          const finalWinner = survivors[Math.floor(Math.random() * survivors.length)];
          handleWin(finalWinner);
        } else {
          setRemainingPlayers(survivors);
          setStep(s => s + 1);
          setPhase('idle');
          setEliminatedInStep([]);
        }
      }, 1500);
    }, 1500);
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
      colors: ['#06b6d4', '#3b82f6', '#ffffff']
    });
  };

  const nextPrize = () => {
    setCurrentPrizeIndex(prev => prev + 1);
  };

  if (!currentPrize) return null;

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 text-white overflow-hidden relative bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#083344_0%,#000000_100%)] z-0" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <Footprints className="w-10 h-10 text-cyan-400" />
          <div>
            <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">
              {state.eventName || 'Event'} | STEP {step + 1}/{TOTAL_STEPS}
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

      {/* Bridge Area */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center gap-8 min-h-0">
        <div className="w-full max-w-4xl flex flex-col gap-4">
          {/* The Bridge */}
          <div className="flex flex-col gap-2 items-center">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div 
                key={i}
                className={`w-full h-12 flex gap-4 transition-all duration-500 ${i === step ? 'scale-105' : 'opacity-40 scale-95'}`}
              >
                <div className={`flex-1 rounded-lg border-2 flex items-center justify-center font-bold text-lg ${i < step ? 'bg-cyan-500/20 border-cyan-500/50' : i === step ? 'bg-white/10 border-white/40 animate-pulse' : 'bg-white/5 border-white/10'}`}>
                  {i === step && phase === 'crossing' ? '???' : ''}
                </div>
                <div className={`flex-1 rounded-lg border-2 flex items-center justify-center font-bold text-lg ${i < step ? 'bg-cyan-500/20 border-cyan-500/50' : i === step ? 'bg-white/10 border-white/40 animate-pulse' : 'bg-white/5 border-white/10'}`}>
                  {i === step && phase === 'crossing' ? '???' : ''}
                </div>
              </div>
            )).reverse()}
          </div>
        </div>

        {/* Players Display */}
        <div className="w-full max-w-6xl bg-black/40 rounded-3xl border border-cyan-900/30 p-6">
          <div className="flex flex-wrap justify-center gap-2">
            <AnimatePresence mode="popLayout">
              {remainingPlayers.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: eliminatedInStep.includes(p.id) ? [1, 1.2, 0] : 1,
                    opacity: eliminatedInStep.includes(p.id) ? 0 : 1,
                    backgroundColor: eliminatedInStep.includes(p.id) ? '#ef4444' : 'rgba(255,255,255,0.1)'
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2"
                >
                  <span className="font-mono text-xs font-bold">{p.id}</span>
                  <span className="text-xs opacity-70 truncate max-w-[80px]">{p.name}</span>
                  {eliminatedInStep.includes(p.id) && <Skull className="w-3 h-3 text-white" />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {phase === 'idle' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startStep}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-12 py-4 rounded-2xl shadow-2xl flex items-center gap-3 tracking-widest uppercase text-xl"
            >
              <Play className="w-6 h-6" /> CROSS STEP {step + 1}
            </motion.button>
          )}

          {phase === 'finished' && winner && (
            <div className="text-center p-8 bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-3xl font-black text-white mb-1">{winner.id}</p>
              <p className="text-xl font-bold text-cyan-300 mb-8">{winner.name}</p>
              <button onClick={nextPrize} className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-black py-4 rounded-xl transition-all hover:scale-105 shadow-lg">
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
