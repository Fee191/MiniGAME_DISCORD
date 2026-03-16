import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, RotateCcw, XSquare, Ticket, Star, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game1ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function Game1Screen({ state, setState }: Game1ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([...state.players]);
  
  const [phase, setPhase] = useState<'idle' | 'spinning_code' | 'tied' | 'spinning_tie' | 'revealed'>('idle');
  const [winner, setWinner] = useState<Player | null>(null);
  const [displayText, setDisplayText] = useState<string>('????');
  const [targetCode, setTargetCode] = useState<string>('');
  const [tiedPlayers, setTiedPlayers] = useState<Player[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const particles = useMemo(() => {
    return [...Array(25)].map((_, i) => ({
      id: i,
      size: Math.random() * 6 + 3,
      color: ['#60a5fa', '#34d399', '#fbbf24', '#ffffff'][Math.floor(Math.random() * 4)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      yOffset: Math.random() * 200 + 100,
      xOffset: Math.random() * 100 - 50,
      maxOpacity: Math.random() * 0.5 + 0.2
    }));
  }, []);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  useEffect(() => {
    if (isFinished) {
      setState(s => ({ ...s, view: 'result' }));
    }
  }, [isFinished, setState]);

  const handleSpinCode = () => {
    if (phase !== 'idle') return;
    if (remainingPlayers.length === 0) {
      setErrorMsg('No players left in the list!');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setPhase('spinning_code');

    // Generate a random 4-digit number that exists in at least one player's ID
    let code = '';
    let tied: Player[] = [];
    let attempts = 0;
    
    while (tied.length === 0 && attempts < 10000) {
      code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      tied = remainingPlayers.filter(p => {
        const pid = String(p.id).padStart(4, '0');
        return pid.includes(code) || code.includes(pid);
      });
      attempts++;
    }

    // Fallback if no match is found
    if (tied.length === 0) {
      const randomWinner = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      const str = String(randomWinner.id).padStart(4, '0');
      code = str.length >= 4 ? str.slice(-4) : str;
      tied = remainingPlayers.filter(p => {
        const pid = String(p.id).padStart(4, '0');
        return pid.includes(code) || code.includes(pid);
      });
    }
    
    setTargetCode(code);
    setTiedPlayers(tied);

    // Spin effect: rapidly cycle 4 random digits
    let ticks = 0;
    const maxTicks = 50; // 2.5 seconds at 50ms per tick
    
    const interval = setInterval(() => {
      ticks++;
      const chars = '0123456789';
      const randomCode = Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
      setDisplayText(randomCode);

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDisplayText(code);
        setPhase('tied'); // Move to tied phase to build suspense
      }
    }, 50);
  };

  const handleSpinTie = () => {
    if (phase !== 'tied') return;

    if (tiedPlayers.length === 1) {
      // Only 1 winner, reveal immediately
      const winnerObj = tiedPlayers[0];
      setWinner(winnerObj);
      setDisplayText(winnerObj.id);
      setPhase('revealed');
      triggerConfetti();
      
      setState(s => ({
        ...s,
        winners: [...s.winners, { prize: currentPrize, player: winnerObj }]
      }));
      setRemainingPlayers(prev => prev.filter(p => p.id !== winnerObj.id));
      return;
    }

    // Multiple tied players, spin among them
    setPhase('spinning_tie');

    const randomIndex = Math.floor(Math.random() * tiedPlayers.length);
    const finalWinner = tiedPlayers[randomIndex];
    setWinner(finalWinner);

    let ticks = 0;
    const maxTicks = 50;
    
    const interval = setInterval(() => {
      ticks++;
      const randomPlayer = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
      setDisplayText(randomPlayer.id);

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDisplayText(finalWinner.id);
        setPhase('revealed');
        triggerConfetti();
        
        setState(s => ({
          ...s,
          winners: [...s.winners, { prize: currentPrize, player: finalWinner }]
        }));
        setRemainingPlayers(prev => prev.filter(p => p.id !== finalWinner.id));
      }
    }, 50);
  };

  const triggerConfetti = () => {
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#10b981', '#ffffff', '#f59e0b']
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#10b981', '#ffffff', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const nextPrize = () => {
    setCurrentPrizeIndex(prev => prev + 1);
    setPhase('idle');
    setWinner(null);
    setDisplayText('????');
    setTargetCode('');
    setTiedPlayers([]);
  };

  if (!currentPrize) return null;

  return (
    <div className={`h-screen w-screen flex flex-col p-4 md:p-8 text-white overflow-hidden relative ${state.bgImage ? 'bg-black/10' : 'bg-slate-900'}`}>
      {/* Decorative Background Elements (Hidden if custom bg image is used) */}
      {!state.bgImage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_0%,#0f172a_100%)] z-0" />
        </>
      )}

      {/* Ambient Glowing Orbs & Particles (Always visible) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30rem] h-[30rem] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-[120px]" />
        {particles.map((p) => (
          <motion.div
            key={`particle-${p.id}`}
            className="absolute rounded-full"
            style={{
              width: p.size + 'px',
              height: p.size + 'px',
              backgroundColor: p.color,
              left: p.left + '%',
              top: p.top + '%',
            }}
            animate={{
              y: [0, -p.yOffset],
              x: [0, p.xOffset],
              opacity: [0, p.maxOpacity, 0],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay
            }}
          />
        ))}
      </div>

      {/* Header Info (Large Event Name) - MOVED TO LEFT COLUMN */}

      {/* Top Left Game Indicator */}
      <div className="absolute top-40 left-6 md:top-48 md:left-8 z-20">
        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 md:px-5 md:py-3 rounded-xl border border-white/20 shadow-lg flex items-center gap-2 md:gap-3">
          <Ticket className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
          <span className="text-white font-black tracking-widest uppercase text-base md:text-lg">LOTTERY</span>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <button
          onClick={() => setConfirmDialog('reset')}
          className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-white/20 shadow-lg"
          title="Restart Game"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => setConfirmDialog('stop')}
          className="bg-red-600/80 hover:bg-red-500 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-red-400/50 shadow-lg"
          title="End Early"
        >
          <XSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 font-bold border-2 border-white"
          >
            <AlertCircle className="w-5 h-5" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col md:flex-row gap-6 pt-20 md:pt-24 pb-8 relative z-10 min-h-0 max-w-7xl mx-auto">
        
        {/* Left/Center: Lottery Machine & Titles */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 min-w-0 md:pl-8 lg:pl-16 mb-8 mt-12 md:mt-16">
          
          {/* Event Name */}
          <div className="flex flex-col items-center mb-4 md:mb-8 w-full px-2 md:px-4 mt-2">
            {state.eventName && (
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 uppercase tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] leading-tight md:leading-tight max-w-full text-center"
                style={{ textWrap: 'balance' }}
              >
                {state.eventName}
              </h1>
            )}
            <div className="mt-6 bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <p className="text-sm md:text-base text-blue-200 font-bold tracking-wider uppercase">
                Remaining Players: <span className="text-white text-lg">{remainingPlayers.length}</span>
              </p>
            </div>
          </div>

          {/* Prize Info Header */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 bg-blue-900/50 text-blue-200 px-4 py-1 rounded-full mb-2 border border-blue-500/30">
            <span className="font-bold tracking-widest uppercase text-xs">
              ROUND {currentPrizeIndex + 1} / {state.prizes.length}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider drop-shadow-md">
            {currentPrize.name}
          </h1>
          <p className="text-xl md:text-2xl font-bold text-blue-300 drop-shadow-md">
            {currentPrize.content}
          </p>
        </motion.div>

        {/* Lottery Result Board */}
        <div className="relative w-full max-w-2xl mt-4">
          <motion.div
            animate={phase === 'spinning_code' || phase === 'spinning_tie' ? { y: [-2, 2, -2] } : {}}
            transition={{ repeat: Infinity, duration: 0.1 }}
            className={`
              relative overflow-hidden rounded-2xl border-2 flex flex-col items-center justify-center min-h-[180px] p-6 shadow-2xl backdrop-blur-sm transition-colors duration-300
              ${phase === 'idle' ? 'bg-slate-900/80 border-white/10' : ''}
              ${phase === 'spinning_code' || phase === 'spinning_tie' ? 'bg-blue-900/80 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}
              ${phase === 'tied' || phase === 'revealed' ? 'bg-emerald-900/80 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]' : ''}
            `}
          >
            <div className="relative z-10 text-center w-full">
              {phase === 'idle' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 text-white/40"
                >
                  <Ticket className="w-12 h-12 opacity-50" />
                  <p className="text-lg font-bold tracking-widest uppercase">READY TO DRAW</p>
                </motion.div>
              )}

              {phase === 'spinning_code' && (
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-widest uppercase text-blue-300 animate-pulse">
                    DRAWING NUMBER...
                  </p>
                  <div className="text-6xl md:text-7xl font-black tracking-widest text-white font-mono drop-shadow-lg">
                    {displayText}
                  </div>
                </div>
              )}

              {phase === 'tied' && (
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-widest uppercase text-emerald-300">
                    {tiedPlayers.length > 1 
                      ? `FOUND ${tiedPlayers.length} MATCHES!` 
                      : 'FOUND 1 MATCH!'}
                  </p>
                  <div className="text-6xl md:text-7xl font-black tracking-widest text-white drop-shadow-lg font-mono">
                    {targetCode}
                  </div>
                  {tiedPlayers.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2 w-full max-w-xl mx-auto p-2 max-h-[150px] overflow-y-auto custom-scrollbar relative z-30">
                      {tiedPlayers.map(p => (
                        <span key={p.id} className="bg-slate-800/90 border border-emerald-500/50 px-3 py-2 rounded-lg text-emerald-300 font-mono font-bold text-sm shadow-lg">
                          {p.id} - {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {phase === 'spinning_tie' && (
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-widest uppercase text-blue-300 animate-pulse">
                    SELECTING WINNER...
                  </p>
                  <div className="text-4xl md:text-5xl font-black tracking-wider text-white truncate px-4 font-mono drop-shadow-lg">
                    {displayText}
                  </div>
                </div>
              )}

              {phase === 'revealed' && winner && (
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-widest uppercase text-emerald-300">
                    WINNER
                  </p>
                  <div className="text-4xl md:text-5xl font-black tracking-wider text-white drop-shadow-lg truncate px-4 font-mono">
                    {winner.id}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-yellow-400 drop-shadow-md truncate px-4">
                    {winner.name}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        <div className="h-16 mt-2 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.button
                key="spin-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpinCode}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-4 px-12 rounded-xl shadow-lg flex items-center gap-3 tracking-widest uppercase transition-all"
              >
                START DRAW
              </motion.button>
            )}

            {phase === 'tied' && (
              <motion.button
                key="tie-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpinTie}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl py-4 px-12 rounded-xl shadow-lg flex items-center gap-3 tracking-widest uppercase transition-all"
              >
                {tiedPlayers.length > 1 ? 'FINAL DRAW' : 'CLAIM PRIZE'}
              </motion.button>
            )}

            {phase === 'revealed' && (
              <motion.button
                key="next-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextPrize}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl py-4 px-12 rounded-xl flex items-center gap-3 transition-all shadow-lg uppercase tracking-wider"
              >
                {currentPrizeIndex < state.prizes.length - 1 ? (
                  <>NEXT PRIZE <ArrowRight className="w-6 h-6" /></>
                ) : (
                  <>VIEW RESULTS <Trophy className="w-6 h-6" /></>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        </div>

        {/* Right: Winners History */}
        <div className="w-full md:w-72 shrink-0 bg-slate-900/80 rounded-2xl border border-white/10 p-4 flex flex-col shadow-xl backdrop-blur-md h-full max-h-[550px] md:max-h-[600px] md:mr-12 lg:mr-20 mt-8 md:mt-16">
          <div className="flex items-center justify-center gap-2 mb-4 shrink-0 border-b border-white/10 pb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-bold text-lg tracking-widest uppercase">WINNERS</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-4">
            <AnimatePresence>
              {state.winners.length === 0 ? (
                <div className="text-center text-white/40 italic py-8 text-sm">No winners yet</div>
              ) : (
                state.winners.map((winner, idx) => (
                  <motion.div 
                    key={winner.player.id + idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300 font-semibold text-xs">{winner.prize.name}</span>
                    </div>
                    <span className="text-white font-mono font-bold text-base truncate">{winner.player.id}</span>
                    <span className="text-white/60 text-xs truncate">{winner.player.name}</span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border-4 border-red-500 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase">
                {confirmDialog === 'reset' ? 'Restart Game?' : 'End Early?'}
              </h3>
              <p className="text-gray-600 mb-8 text-lg font-medium">
                {confirmDialog === 'reset' 
                  ? 'All results will be cleared and you will return to the config screen.' 
                  : 'Skip remaining prizes and go straight to the final results screen.'}
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (confirmDialog === 'reset') {
                      setState(s => ({ ...s, view: 'config', winners: [] }));
                    } else {
                      setState(s => ({ ...s, view: 'result' }));
                    }
                  }}
                  className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition shadow-lg"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
