import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, RotateCcw, XSquare, Ticket, Star, AlertCircle, CheckCircle, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game1ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function Game1Screen({ state, setState }: Game1ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([...state.players]);
  
  const [phase, setPhase] = useState<'idle' | 'spinning_code' | 'tied' | 'eliminating' | 'revealed'>('idle');
  const [winner, setWinner] = useState<Player | null>(null);
  const [displayText, setDisplayText] = useState<string>('??');
  const [targetCode, setTargetCode] = useState<string>('');
  const [tiedPlayers, setTiedPlayers] = useState<Player[]>([]);
  
  // Elimination states
  const [survivingPlayers, setSurvivingPlayers] = useState<Player[]>([]);
  const [lastEliminated, setLastEliminated] = useState<Player[]>([]);
  const [eliminationRound, setEliminationRound] = useState<number>(0);

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

    // Collect all valid 2-digit substrings that exist in remaining players' IDs.
    const allSubstrings = new Set<string>();
    remainingPlayers.forEach(p => {
      const pidStr = String(p.id).padStart(3, '0');
      for (let i = 0; i < pidStr.length - 1; i++) {
        allSubstrings.add(pidStr.slice(i, i + 2));
      }
    });

    const substringList = Array.from(allSubstrings);
    let code = '';
    let tied: Player[] = [];

    if (substringList.length > 0) {
      // 100% Balanced choice: select one 2-digit code from the unique set so frequency of any digit (like '1') in IDs doesn't skew selection probability!
      code = substringList[Math.floor(Math.random() * substringList.length)];
      tied = remainingPlayers.filter(p => {
        const pidStr = String(p.id).padStart(3, '0');
        return pidStr.includes(code);
      });
    } else {
      // Fallback
      const randomWinner = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      code = String(randomWinner.id).padStart(3, '0').slice(-2);
      tied = remainingPlayers.filter(p => {
        const pidStr = String(p.id).padStart(3, '0');
        return pidStr.includes(code);
      });
    }
    
    setTargetCode(code);
    setTiedPlayers(tied);
    setSurvivingPlayers(tied);
    setLastEliminated([]);
    setEliminationRound(0);

    // Spin effect: rapidly cycle 2 random digits
    let ticks = 0;
    const maxTicks = 50; // 2.5 seconds at 50ms per tick
    
    const interval = setInterval(() => {
      ticks++;
      const chars = '0123456789';
      const randomCode = Array(2).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
      setDisplayText(randomCode);

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDisplayText(code);
        
        if (tied.length === 1) {
          setWinner(tied[0]);
          setPhase('revealed');
          triggerConfetti();
        } else {
          setPhase('tied'); // Move to tied phase to begin elimination
        }
      }
    }, 50);
  };

  const handleEliminateHalf = () => {
    if (phase !== 'tied') return;
    if (survivingPlayers.length <= 1) return;

    setPhase('eliminating');

    let ticks = 0;
    const maxTicks = 30; // 1.5 seconds

    const interval = setInterval(() => {
      ticks++;
      // Shuffle randomly to simulate cycling look/shake in the UI
      const chars = '0123456789';
      setDisplayText(Array(2).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''));

      if (ticks >= maxTicks) {
        clearInterval(interval);

        const total = survivingPlayers.length;
        const keepCount = Math.ceil(total / 2);

        // Shuffle and choose survivors
        const shuffled = [...survivingPlayers].sort(() => Math.random() - 0.5);
        const nextSurvivors = shuffled.slice(0, keepCount);
        const eliminated = shuffled.slice(keepCount);

        setSurvivingPlayers(nextSurvivors);
        setLastEliminated(eliminated);
        setEliminationRound(prev => prev + 1);
        setDisplayText(targetCode);

        if (nextSurvivors.length === 1) {
          setWinner(nextSurvivors[0]);
          setPhase('revealed');
          triggerConfetti();
        } else {
          setPhase('tied');
        }
      }
    }, 50);
  };

  const acceptWinner = () => {
    if (!winner || !currentPrize) return;
    setState(s => ({
      ...s,
      winners: [...s.winners, { prize: currentPrize, player: winner }]
    }));
    setRemainingPlayers(prev => prev.filter(p => p.id !== winner.id));
    nextPrize();
  };

  const rejectWinner = () => {
    if (winner && currentPrize) {
      setState(s => ({
        ...s,
        rejected: [...s.rejected, { prize: currentPrize, player: winner }]
      }));
      setRemainingPlayers(prev => prev.filter(p => p.id !== winner.id));
    }

    setPhase('idle');
    setWinner(null);
    setDisplayText('??');
    setTargetCode('');
    setTiedPlayers([]);
    setSurvivingPlayers([]);
    setLastEliminated([]);
    setEliminationRound(0);
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
    setDisplayText('??');
    setTargetCode('');
    setTiedPlayers([]);
    setSurvivingPlayers([]);
    setLastEliminated([]);
    setEliminationRound(0);
  };

  if (isFinished || !currentPrize) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white relative z-[100]">
        <Trophy className="w-24 h-24 text-yellow-400 mb-8 animate-bounce" />
        <h1 className="text-4xl font-bold mb-8">All prizes have been drawn!</h1>
        <button
          onClick={() => setState(s => ({ ...s, view: 'result' }))}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-4 px-12 rounded-xl shadow-lg transition-all"
        >
          VIEW RESULTS
        </button>
      </div>
    );
  }

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

      {/* Top Left Game Indicator - REMOVED */}

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <button
          onClick={() => setState(s => ({ ...s, view: 'config' }))}
          className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-white/20 shadow-lg"
        >
          Home
        </button>
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
      <div className="flex-1 w-full flex flex-col lg:flex-row gap-4 pt-16 md:pt-18 pb-2 relative z-10 min-h-0 max-w-7xl mx-auto overflow-hidden">
        
        {/* Left Column: Lottery Machine, Title, Prize & Controller Card */}
        <div className="w-full lg:w-[48%] flex flex-col items-center justify-between gap-3 min-h-0 shrink-0">
          
          {/* Event and Prize Header */}
          <div className="w-full text-center space-y-1">
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 uppercase tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] leading-tight max-w-full truncate"
              title={state.eventName}
            >
              {state.eventName}
            </h1>
            
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-white/10 p-2.5 md:p-3 shadow-md text-center space-y-0.5 w-full max-w-xl mx-auto"
            >
              <div className="inline-flex items-center gap-1.5 bg-blue-900/40 text-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-blue-500/20">
                ⭐ DRAWING PRIZE: {currentPrizeIndex + 1} / {state.prizes.length}
              </div>
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wide truncate">
                {currentPrize.name}
              </h2>
              <p className="text-xs md:text-sm font-medium text-blue-300 line-clamp-1">
                {currentPrize.content}
              </p>
            </motion.div>
          </div>

          {/* Lottery Draw Visualization Board */}
          <div className="relative w-full max-w-xl mx-auto flex-1 flex flex-col justify-center min-h-[160px]">
            <motion.div
              animate={phase === 'spinning_code' || phase === 'eliminating' ? { y: [-2, 2, -2] } : {}}
              transition={{ repeat: Infinity, duration: 0.1 }}
              className={`
                relative overflow-hidden rounded-2xl border flex flex-col items-center justify-center min-h-[150px] w-full p-4 shadow-xl backdrop-blur-sm transition-colors duration-300
                ${phase === 'idle' ? 'bg-slate-900/80 border-white/10' : ''}
                ${phase === 'spinning_code' || phase === 'eliminating' ? 'bg-blue-900/80 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}
                ${phase === 'tied' || phase === 'revealed' ? 'bg-emerald-950/80 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : ''}
              `}
            >
              <div className="relative z-10 text-center w-full">
                {phase === 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-1.5 text-white/40"
                  >
                    <Ticket className="w-10 h-10 text-blue-400 animate-pulse" />
                    <p className="text-[10px] font-bold tracking-widest uppercase text-blue-300/60">READY TO DRAW</p>
                    <div className="text-6xl font-black font-mono tracking-widest text-white/10 select-none leading-none">
                      ??
                    </div>
                  </motion.div>
                )}

                {phase === 'spinning_code' && (
                  <div className="space-y-1">
                    <p className="font-bold text-xs tracking-widest uppercase text-blue-300 animate-pulse">
                      SPINNING LUCKY DIGITS...
                    </p>
                    <div className="text-6xl md:text-7xl font-black tracking-widest text-yellow-400 font-mono drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] leading-none">
                      {displayText}
                    </div>
                  </div>
                )}

                {phase === 'eliminating' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[10px] tracking-widest uppercase text-red-300 animate-pulse">
                      ELIMINATING 1/2 OF THE CANDIDATES...
                    </p>
                    <div className="text-5xl md:text-6xl font-black tracking-widest text-red-500 font-mono drop-shadow-[0_0_12px_rgba(239,68,68,0.5)] leading-none">
                      {displayText}
                    </div>
                    <div className="text-[10px] font-semibold text-white/50 bg-red-950/40 py-0.5 px-2.5 rounded-full inline-block border border-red-500/20">
                      Elimination Round Stage {eliminationRound + 1}
                    </div>
                  </div>
                )}

                {phase === 'tied' && (
                  <div className="space-y-2 w-full">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 bg-yellow-400/10 px-3 py-0.5 rounded-full border border-yellow-500/20">
                      LUCKY DIGITS: {targetCode}
                    </span>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider leading-none mt-1">
                      ROUND {eliminationRound > 0 ? `STAGE ${eliminationRound}` : 'INITIAL ELIMINATION'}
                    </h3>
                    <p className="text-xs font-semibold tracking-wide text-emerald-400">
                      Surviving {survivingPlayers.length} out of {tiedPlayers.length} matches containing "{targetCode}"
                    </p>
                  </div>
                )}

                {phase === 'revealed' && winner && (
                  <div className="space-y-2 animate-fade-in">
                    <p className="font-bold text-[10px] tracking-widest uppercase text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20 inline-block animate-bounce">
                      👑 SOLE PRIZE WINNER 👑
                    </p>
                    <div className="text-5xl font-black tracking-wider text-white drop-shadow-lg font-mono leading-none">
                      {winner.id}
                    </div>
                    <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 drop-shadow-md truncate px-4 leading-normal">
                      {winner.name}
                    </div>
                    <div className="text-white/40 text-[10px] font-medium max-w-sm mx-auto">
                      Won after {eliminationRound} stages of fierce filtering for code {targetCode}!
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Action Button Controls */}
          <div className="h-14 w-full flex items-center justify-center shrink-0">
            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.button
                  key="spin-btn"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSpinCode}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white font-extrabold text-sm py-3 px-8 rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.25)] flex items-center gap-2.5 tracking-widest uppercase transition-all"
                >
                  DRAW LUCKY NUMBER
                </motion.button>
              )}

              {phase === 'tied' && (
                <motion.button
                  key="tie-btn"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEliminateHalf}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs py-3 px-6 rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] flex items-center gap-2 tracking-wider uppercase transition-all"
                >
                  {survivingPlayers.length > 2 
                    ? `ELIMINATE 1/2 (${survivingPlayers.length} REMAINING)` 
                    : 'RUN FINAL SHOWDOWN (1 VS 1)'}
                </motion.button>
              )}

              {phase === 'revealed' && (
                <div className="flex gap-3 w-full max-w-sm">
                  <motion.button
                    key="accept-btn"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={acceptWinner}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md uppercase tracking-wider"
                  >
                    <CheckCircle className="w-4 h-4" /> ACCEPT RESULTS
                  </motion.button>
                  <motion.button
                    key="reject-btn"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={rejectWinner}
                    className="flex-1 bg-slate-850 hover:bg-slate-800 text-white/95 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm uppercase tracking-wider border border-white/10"
                  >
                    <XSquare className="w-4 h-4" /> REJECT & REDRAW
                  </motion.button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Dynamic Player Arena Panel */}
        <div className="flex-1 w-full bg-slate-950/60 backdrop-blur-md rounded-2xl border border-white/10 p-3 md:p-4 flex flex-col min-h-0 overflow-hidden shadow-xl">
          
          {/* Header & Status Metrics for Right Panel */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/5 mb-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/10 shrink-0">
                <Users className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white tracking-wider uppercase truncate">
                  {phase === 'idle' || phase === 'spinning_code' 
                    ? 'QUALIFIED PARTICIPANTS' 
                    : 'ELIMINATION ARENA'}
                </h3>
                <p className="text-[10px] text-white/40 tracking-wide truncate">
                  {phase === 'idle' || phase === 'spinning_code'
                    ? `Remaining eligible active participants in pool`
                    : `Active survival pool filtered by: "${targetCode}"`}
                </p>
              </div>
            </div>
            
            {/* Realtime stats badge */}
            <div className="bg-slate-900/90 border border-white/5 px-2 py-1 rounded-lg flex items-center gap-2 font-mono text-[10px] shrink-0">
              {phase === 'idle' || phase === 'spinning_code' ? (
                <>
                  <span className="text-white/40">TOTAL:</span>
                  <span className="text-blue-400 font-bold">{remainingPlayers.length}</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-bold">ALIVE: {survivingPlayers.length}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-red-400 font-bold">ELI: {tiedPlayers.length - survivingPlayers.length}</span>
                </>
              )}
            </div>
          </div>

          {/* Grid View of Players */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            {phase === 'idle' || phase === 'spinning_code' ? (
              /* DENSE CHIP VIEW for ALL ACTIVE PLAYERS */
              remainingPlayers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-white/30 text-center gap-1.5">
                  <Users className="w-10 h-10 stroke-[1.5]" />
                  <p className="italic text-xs">No active players left to draw.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 p-0.5">
                  {remainingPlayers.map(p => (
                    <div 
                      key={p.id} 
                      className="bg-slate-900/30 border border-white/5 p-1.5 rounded-lg flex items-center gap-1.5 hover:border-white/10 transition-all w-full min-w-0"
                    >
                      <div className="w-6 h-6 bg-blue-500/10 rounded flex items-center justify-center font-mono font-bold text-[10px] text-blue-300 shrink-0 border border-blue-500/10">
                        {p.id}
                      </div>
                      <p className="text-[10px] font-bold text-white/80 truncate flex-1 min-w-0">{p.name}</p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* DUAL-STATE ACTIVE/ELIMINATED VISUAL CONTAINER */
              tiedPlayers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-white/30 text-center gap-1.5">
                  <Ticket className="w-10 h-10 stroke-[1.5]" />
                  <p className="italic text-xs">No matches found. Please click redraw.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 p-0.5">
                  <AnimatePresence>
                    {tiedPlayers.map(p => {
                      const isWinner = winner?.id === p.id;
                      const isAlive = survivingPlayers.some(s => s.id === p.id);
                      
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          key={`contestant-${p.id}`}
                          className={`p-2.5 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                            isWinner ? 'bg-gradient-to-br from-yellow-500/25 to-amber-600/15 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-yellow-400/40' :
                            isAlive ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_3px_8px_rgba(16,185,129,0.08)]' :
                            'bg-red-950/15 border-red-900/5 opacity-25 select-none'
                          }`}
                        >
                          {/* Top Tag Bar */}
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <span className={`font-mono font-black text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                              isWinner ? 'bg-yellow-400 text-slate-900 shadow-sm' :
                              isAlive ? 'bg-emerald-500/20 text-emerald-300' :
                              'bg-slate-800/50 text-slate-500 line-through'
                            }`}>
                              ID {p.id}
                            </span>
                            
                            <span className={`text-[8px] font-black tracking-widest uppercase px-1 py-0.5 rounded shrink-0 ${
                              isWinner ? 'text-yellow-400 animate-bounce' :
                              isAlive ? 'text-emerald-400 animate-pulse bg-emerald-500/5' :
                              'text-red-500/60 bg-red-500/5'
                            }`}>
                              {isWinner ? '👑 WINNER' : isAlive ? '● STAY' : 'OUT'}
                            </span>
                          </div>

                          {/* Candidate info labels */}
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11px] font-bold truncate ${
                              isWinner ? 'text-yellow-250' :
                              isAlive ? 'text-white' :
                              'text-white/40 line-through font-normal'
                            }`}>
                              {p.name}
                            </p>
                          </div>

                          {/* Soft colored indicator strip on bottom */}
                          <div className={`h-0.5 w-full rounded-full ${
                            isWinner ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                            isAlive ? 'bg-emerald-500' :
                            'bg-red-900/10'
                          }`} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )
            )}
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
