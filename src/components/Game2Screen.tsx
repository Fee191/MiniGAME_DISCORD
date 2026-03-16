import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flag, Play, FastForward, ArrowRight, RotateCcw, XSquare, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Prize, Player } from '../types';
import { ANIMALS } from '../utils';

interface Game2ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface Racer {
  id: string;
  animal: string;
  progress: number;
  status: 'normal' | 'dashing' | 'tired';
  statusTimer: number;
}

export default function Game2Screen({ state, setState }: Game2ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([...state.players]);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [raceState, setRaceState] = useState<'idle' | 'racing' | 'finished'>('idle');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [currentWinner, setCurrentWinner] = useState<Racer | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const racersRef = useRef<Racer[]>([]);
  const speedMultiplierRef = useRef(1);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  useEffect(() => {
    if (isFinished) {
      setState(s => ({ ...s, view: 'result' }));
    }
  }, [isFinished, setState]);

  // Initialize racers for the current race
  useEffect(() => {
    if (raceState === 'idle' && !isFinished) {
      const shuffledAnimals = [...ANIMALS].sort(() => Math.random() - 0.5);
      const initialRacers = remainingPlayers.map((player, index) => ({
        id: player.id,
        animal: shuffledAnimals[index % shuffledAnimals.length],
        progress: 0,
        status: 'normal' as const,
        statusTimer: Math.random() * 2000 + 1000 // 1-3 seconds initial state
      }));
      setRacers(initialRacers);
      racersRef.current = initialRacers;
    }
  }, [remainingPlayers, raceState, isFinished]);

  const startRace = () => {
    if (remainingPlayers.length === 0) {
      setErrorMsg('No players left in the list!');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setRaceState('racing');
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updateRace);
  };

  const updateRace = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    let winner: Racer | null = null;

    const newRacers = racersRef.current.map(racer => {
      let { status, statusTimer, progress } = racer;
      statusTimer -= deltaTime;

      // Randomly switch states for suspense
      if (statusTimer <= 0) {
        const rand = Math.random();
        if (rand < 0.15) { 
          status = 'dashing'; 
          statusTimer = Math.random() * 1500 + 1000; // Dash for 1-2.5s
        } else if (rand < 0.15) { 
          status = 'tired'; 
          statusTimer = Math.random() * 1500 + 1000; // Tired for 1-2.5s
        } else { 
          status = 'normal'; 
          statusTimer = Math.random() * 2000 + 1000; // Normal for 1-3s
        }
      }

      let speedMult = 1;
      if (status === 'dashing') speedMult = 2.5;
      if (status === 'tired') speedMult = 0.3;

      // Base speed to finish 100 units in ~30 seconds is 3.33 units/sec
      const speed = speedMult * speedMultiplierRef.current * (deltaTime / 1000) * 3.33;
      const newProgress = Math.min(100, progress + speed);
      
      const updatedRacer = { ...racer, progress: newProgress, status, statusTimer };
      
      if (newProgress >= 100 && !winner) {
        winner = updatedRacer;
      }
      
      return updatedRacer;
    });

    racersRef.current = newRacers;
    setRacers(newRacers);

    if (winner) {
      finishRace(winner);
    } else {
      requestRef.current = requestAnimationFrame(updateRace);
    }
  };

  const finishRace = (winner: Racer) => {
    setRaceState('finished');
    setCurrentWinner(winner);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    triggerConfetti();

    const winnerPlayer = remainingPlayers.find(p => p.id === winner.id)!;

    // Update global state
    setState(s => ({
      ...s,
      winners: [...s.winners, { prize: currentPrize, player: winnerPlayer }]
    }));
    setRemainingPlayers(prev => prev.filter(p => p.id !== winner.id));
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF4500']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF4500']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const nextRace = () => {
    setCurrentPrizeIndex(prev => prev + 1);
    setRaceState('idle');
    setCurrentWinner(null);
    setSpeedMultiplier(1);
    speedMultiplierRef.current = 1;
  };

  const toggleSpeed = () => {
    const newSpeed = speedMultiplier === 1 ? 3 : 1;
    setSpeedMultiplier(newSpeed);
    speedMultiplierRef.current = newSpeed;
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Sort racers for display: highest progress first
  const sortedRacers = useMemo(() => {
    return [...racers].sort((a, b) => b.progress - a.progress);
  }, [racers]);

  // Only show top 8 on the main track for better visibility
  const topRacers = sortedRacers.slice(0, 8);

  if (!currentPrize) return null;

  return (
    <div className="h-screen w-screen bg-black flex flex-col text-white overflow-hidden relative z-50">
      {/* Header: Fixed height, no shrinking */}
      <div className="h-20 bg-black/60 border-b border-white/10 px-6 flex items-center justify-between z-20 shadow-xl shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <div className="flex flex-col justify-center">
            {state.eventName && (
              <p className="text-[10px] md:text-xs text-blue-200 font-bold tracking-widest uppercase mb-0.5 opacity-80">
                {state.eventName}
              </p>
            )}
            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 uppercase tracking-wider truncate max-w-xs md:max-w-md leading-none">
              {currentPrize.name}
            </h2>
            <p className="text-xs md:text-sm text-yellow-400 font-medium truncate max-w-xs md:max-w-md mt-1">
              {currentPrize.content} | {remainingPlayers.length} players remaining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {raceState === 'idle' && (
            <button
              onClick={startRace}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Play className="w-5 h-5" /> START RACE
            </button>
          )}
          
          {raceState === 'racing' && (
            <button
              onClick={toggleSpeed}
              className={`font-bold py-2 px-4 md:py-3 md:px-6 rounded-full shadow-lg flex items-center gap-2 transition-colors ${
                speedMultiplier > 1 
                  ? 'bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:bg-yellow-400' 
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <FastForward className="w-5 h-5" /> 
              <span className="hidden md:inline">{speedMultiplier > 1 ? 'FAST FORWARD (x3)' : 'FAST FORWARD'}</span>
              <span className="md:hidden">x{speedMultiplier}</span>
            </button>
          )}

          {raceState === 'finished' && (
            <button
              onClick={nextRace}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center gap-2 transition-transform hover:scale-105"
            >
              {currentPrizeIndex < state.prizes.length - 1 ? (
                <>NEXT RACE <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>VIEW RESULTS <Trophy className="w-5 h-5" /></>
              )}
            </button>
          )}

          <div className="h-8 w-px bg-white/20 mx-1 md:mx-2" />

          <button
            onClick={() => setConfirmDialog('reset')}
            className="bg-white/10 hover:bg-white/20 text-white p-2 md:px-4 md:py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-white/10"
            title="Restart Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setConfirmDialog('stop')}
            className="bg-red-500/80 hover:bg-red-500 text-white p-2 md:px-4 md:py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-red-400/50"
            title="End Early"
          >
            <XSquare className="w-5 h-5" />
          </button>
        </div>
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

      {/* Main Content Area: Flex row for landscape optimization */}
      <div className="flex-1 flex flex-row gap-4 md:gap-6 p-4 md:p-6 overflow-hidden relative z-10 min-h-0">
        
        {/* Left: Main Track (Top 8) */}
        <div className="flex-1 bg-[#1a1a1a] rounded-3xl border-4 border-white/10 relative overflow-hidden flex flex-col shadow-2xl min-w-0">
          {/* Track Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 12.5%, rgba(255,255,255,0.15) 12.5%, rgba(255,255,255,0.15) 13%)' }} 
          />
          
          {/* Finish Line */}
          <div className="absolute right-[8%] top-0 bottom-0 w-8 bg-[repeating-linear-gradient(45deg,#fff,#fff_10px,#000_10px,#000_20px)] z-0 border-l-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]" />

          <div className="flex-1 flex flex-col justify-around py-2 relative z-10">
            <AnimatePresence>
              {topRacers.map((racer, index) => (
                <motion.div 
                  layout 
                  key={racer.id} 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative flex-1 flex items-center min-h-0"
                >
                  {/* Progress Trail */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-yellow-500/0 to-yellow-500/50 rounded-full transition-all duration-100 ease-linear" 
                    style={{ width: `calc(${racer.progress}% * 0.92)` }} 
                  />
                  
                  {/* Animal Container */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-3 transition-all duration-100 ease-linear" 
                    style={{ left: `calc(${racer.progress}% * 0.92)` }}
                  >
                    <div className="relative">
                      <span className="text-4xl md:text-5xl drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] filter">{racer.animal}</span>
                      {racer.status === 'dashing' && (
                        <span className="absolute -left-4 top-2 text-2xl md:text-3xl animate-pulse drop-shadow-md">🔥</span>
                      )}
                      {racer.status === 'tired' && (
                        <span className="absolute -top-4 left-2 text-xl md:text-2xl animate-bounce drop-shadow-md">💦</span>
                      )}
                    </div>
                    
                    {/* Rank & ID Badge */}
                    <div className={`
                      px-2 py-1 md:px-3 md:py-1.5 rounded-lg border font-mono font-bold whitespace-nowrap shadow-lg flex flex-col leading-tight
                      ${index === 0 ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-black/80 text-white border-white/20'}
                    `}>
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className={index === 0 ? 'text-black' : 'text-white/50'}>#{index + 1}</span>
                        <span className="text-xs md:text-sm max-w-[80px] md:max-w-[120px] truncate">{racer.id}</span>
                      </div>
                      <span className={`text-[10px] md:text-xs truncate max-w-[80px] md:max-w-[120px] ${index === 0 ? 'text-black/70' : 'text-white/60'}`}>
                        {state.players.find(p => p.id === racer.id)?.name || racer.id}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Live Leaderboard - Fixed width for landscape */}
        <div className="w-64 md:w-80 shrink-0 bg-black/60 rounded-3xl border border-white/10 p-4 md:p-5 flex flex-col shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6 shrink-0">
            <Flag className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
            <h3 className="text-yellow-400 font-black text-lg md:text-xl tracking-widest uppercase">LEADERBOARD</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 custom-scrollbar pr-2">
            <AnimatePresence>
              {sortedRacers.map((racer, index) => (
                <motion.div 
                  layout 
                  key={racer.id} 
                  className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border transition-colors ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <span className={`font-black w-6 md:w-8 text-center text-sm md:text-lg ${index === 0 ? 'text-yellow-400' : 'text-white/40'}`}>
                    {index + 1}
                  </span>
                  <span className="text-2xl md:text-3xl filter drop-shadow-md">{racer.animal}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono font-bold text-xs md:text-sm truncate ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                      {racer.id}
                    </p>
                    <p className="text-[10px] md:text-xs text-white/50 truncate">
                      {state.players.find(p => p.id === racer.id)?.name || racer.id}
                    </p>
                    <div className="w-full bg-black/50 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${index === 0 ? 'bg-yellow-400' : 'bg-white/30'}`} 
                        style={{ width: `${racer.progress}%` }} 
                      />
                    </div>
                  </div>
                  <div className="w-4 md:w-6 text-center text-xs md:text-base">
                    {racer.status === 'dashing' && <span className="animate-pulse">🔥</span>}
                    {racer.status === 'tired' && <span className="animate-bounce">💦</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Winner Overlay */}
      <AnimatePresence>
        {raceState === 'finished' && currentWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-500/50 p-8 md:p-10 rounded-3xl shadow-[0_0_100px_rgba(234,179,8,0.3)] max-w-2xl w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
              
              <div className="text-7xl md:text-8xl mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] filter">
                {currentWinner.animal}
              </div>
              
              <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 uppercase tracking-widest mb-2">
                CHAMPION
              </h3>
              
              <p className="text-lg md:text-xl text-white/60 mb-8 font-medium">
                Won <span className="text-yellow-400 font-bold">{currentPrize.name}</span>
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 inline-block min-w-[250px] md:min-w-[300px]">
                <p className="text-xs md:text-sm text-white/40 uppercase tracking-widest mb-2 font-bold">WINNER</p>
                <p className="text-3xl md:text-4xl font-mono font-black text-white tracking-wider truncate">{currentWinner.id}</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-400 truncate mt-1">
                  {state.players.find(p => p.id === currentWinner.id)?.name || currentWinner.id}
                </p>
              </div>

              <div className="mt-8 md:mt-10">
                <button
                  onClick={nextRace}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-lg md:text-xl py-3 px-8 md:py-4 md:px-12 rounded-full shadow-[0_0_40px_rgba(234,179,8,0.4)] transition-transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  {currentPrizeIndex < state.prizes.length - 1 ? (
                    <>NEXT RACE <ArrowRight className="w-5 h-5 md:w-6 md:h-6" /></>
                  ) : (
                    <>VIEW RESULTS <Trophy className="w-5 h-5 md:w-6 md:h-6" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gray-900 border-4 border-red-500 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4 uppercase">
                {confirmDialog === 'reset' ? 'Restart Game?' : 'End Early?'}
              </h3>
              <p className="text-gray-400 mb-8 text-base md:text-lg font-medium">
                {confirmDialog === 'reset' 
                  ? 'All results will be cleared and you will return to the config screen.' 
                  : 'Skip remaining prizes and go straight to the final results screen.'}
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 md:py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-base md:text-lg transition"
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
                  className="flex-1 py-3 md:py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-base md:text-lg transition shadow-lg"
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
