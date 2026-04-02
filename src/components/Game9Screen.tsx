import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Trophy, Target, RotateCcw, XSquare, AlertCircle, Users, Crosshair, Play, Pause, Skull, Zap, Trees, Cloud, Sun, ShieldAlert, UserCheck, UserMinus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game9ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface Team {
  id: string;
  players: Player[];
  pos: { x: number; y: number };
  status: 'camp' | 'selected' | 'eliminated';
}

const MonsterFigure = ({ size = 50 }: { size?: number }) => (
  <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size * 1.2 }}>
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
      {/* Monster Body */}
      <path d="M20 100 C 20 40, 80 40, 80 100 Z" fill="#b91c1c" />
      {/* Eyes */}
      <circle cx="35" cy="60" r="8" fill="#fde047" />
      <circle cx="65" cy="60" r="8" fill="#fde047" />
      <circle cx="35" cy="60" r="3" fill="#000" />
      <circle cx="65" cy="60" r="3" fill="#000" />
      {/* Mouth */}
      <path d="M35 80 Q 50 95 65 80" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      {/* Teeth */}
      <path d="M40 83 L 45 90 L 50 85 L 55 90 L 60 83" stroke="#fff" strokeWidth="2" fill="none" />
      {/* Horns */}
      <path d="M30 50 Q 20 20 10 30" stroke="#b91c1c" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M70 50 Q 80 20 90 30" stroke="#b91c1c" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

const StickFigure = ({ color = "currentColor", size = 40, opacity = 1, isDead = false, id, showFullId = false, largeId = false, isWinner = false, isScrambling = false, rotate = 0 }: { color?: string, size?: number, opacity?: number, isDead?: boolean, id?: string, showFullId?: boolean, largeId?: boolean, isWinner?: boolean, isScrambling?: boolean, rotate?: number }) => {
  const [scrambled, setScrambled] = useState("");
  useEffect(() => {
    if (!isScrambling || !id) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const interval = setInterval(() => {
      let r = '';
      for(let i=0; i<4; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
      setScrambled(`${r.substring(0,3)}xxx${r.substring(3)}`);
    }, 100 + Math.random() * 100);
    return () => clearInterval(interval);
  }, [isScrambling, id]);

  let idClasses = "absolute left-1/2 -translate-x-1/2 rounded font-mono font-bold whitespace-nowrap z-20 transition-all duration-300 ";
  if (isScrambling) {
    idClasses += "-top-4 text-[6px] text-stone-500/70 bg-transparent";
  } else {
    idClasses += "border ";
    if (largeId) idClasses += "-top-10 text-sm px-3 py-1 ";
    else idClasses += "-top-6 text-[8px] px-2 py-0.5 ";
    
    if (isWinner) idClasses += "bg-yellow-400 text-black border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.5)]";
    else idClasses += "bg-black/80 text-white border-white/10";
  }

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size * 1.5, opacity }}>
      {id && (
        <div className={idClasses}>
          {isScrambling ? scrambled : (showFullId ? id : `${id.substring(0, 3)}xxx${id.slice(-1)}`)}
        </div>
      )}
      <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md" style={{ transform: `rotate(${rotate}deg)`, transition: 'transform 0.3s ease-in-out' }}>
        <circle cx="50" cy="25" r="15" stroke={isDead ? "#450a0a" : color} strokeWidth="10" />
        <path d="M50 40V80M50 50L20 70M50 50L80 70M50 80L20 110M50 80L80 110" stroke={isDead ? "#450a0a" : color} strokeWidth="10" strokeLinecap="round" />
        {isDead && (
          <path d="M40 20L60 30M60 20L40 30" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};

export default function Game9Screen({ state, setState }: Game9ScreenProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [firingSquadPlayers, setFiringSquadPlayers] = useState<(Player & { isAlive: boolean })[]>([]);
  const [phase, setPhase] = useState<'camp' | 'selecting' | 'dragging' | 'firing' | 'winner'>('camp');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [scopePos, setScopePos] = useState({ x: 50, y: 50 });
  const [isFiring, setIsFiring] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [soldierPos, setSoldierPos] = useState({ x: 5, y: 50 });
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isNetActive, setIsNetActive] = useState(false);
  const [netPos, setNetPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const teamsRef = useRef(teams);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  // Initialize Teams
  useEffect(() => {
    const players = [...state.players].sort(() => Math.random() - 0.5);
    const baseSize = 5;
    const numTeams = Math.floor(players.length / baseSize);
    
    if (numTeams === 0) {
      // Fallback for very few players
      setTeams([{
        id: 'team-0',
        players: players,
        pos: { x: 50, y: 50 },
        status: 'camp'
      }]);
      return;
    }

    const remainder = players.length % baseSize;
    const newTeams: Team[] = [];
    let playerIdx = 0;

    for (let i = 0; i < numTeams; i++) {
      // Distribute remainder players among the first 'remainder' teams
      const teamSize = baseSize + (i < remainder ? 1 : 0);
      const teamPlayers = players.slice(playerIdx, playerIdx + teamSize);
      playerIdx += teamSize;

      newTeams.push({
        id: `team-${i}`,
        players: teamPlayers,
        pos: { 
          x: 10 + Math.random() * 80, 
          y: 15 + Math.random() * 70 
        },
        status: 'camp'
      });
    }
    setTeams(newTeams);
  }, [state.players]);

  // Team wandering effect
  useEffect(() => {
    let interval: any;
    if (phase === 'camp' || phase === 'selecting') {
      interval = setInterval(() => {
        setTeams(prev => prev.map(team => {
          if (team.status !== 'camp') return team;
          // Move randomly by a small amount to simulate running/wandering
          const dx = (Math.random() - 0.5) * 12;
          const dy = (Math.random() - 0.5) * 12;
          return {
            ...team,
            pos: {
              x: Math.max(15, Math.min(85, team.pos.x + dx)),
              y: Math.max(20, Math.min(80, team.pos.y + dy))
            }
          };
        }));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Handle selecting a team
  const selectTeam = useCallback(async () => {
    const currentTeams = teamsRef.current;
    if (phase !== 'camp' || currentTeams.filter(t => t.status === 'camp').length === 0) return;
    
    setPhase('selecting');
    const availableTeams = currentTeams.filter(t => t.status === 'camp');
    const targetTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
    
    // 1. Soldier moves to gate
    setSoldierPos({ x: 8, y: 50 });
    await new Promise(r => setTimeout(r, 800));
    
    // 2. Gate opens
    setIsGateOpen(true);
    await new Promise(r => setTimeout(r, 500));

    // 3. Soldier moves around camp
    const waypoints = [
      { x: 30, y: 30 },
      { x: 60, y: 70 },
      { x: targetTeam.pos.x, y: targetTeam.pos.y }
    ];
    
    for (const wp of waypoints) {
      setSoldierPos(wp);
      await new Promise(r => setTimeout(r, 1000));
    }

    // 4. Capture with net
    setNetPos({ x: targetTeam.pos.x, y: targetTeam.pos.y });
    setIsNetActive(true);
    await new Promise(r => setTimeout(r, 800));

    // 5. Drag team out
    setPhase('dragging');
    const exitPos = { x: 5, y: 50 };
    setSoldierPos(exitPos);
    setNetPos(exitPos);
    
    // Update team position in camp for visual dragging
    setTeams(prev => prev.map(t => t.id === targetTeam.id ? { ...t, pos: exitPos } : t));
    
    await new Promise(r => setTimeout(r, 1500));
    
    // 6. Transition to firing squad
    setIsNetActive(false);
    setIsGateOpen(false);
    setActiveTeamId(targetTeam.id);
    setFiringSquadPlayers(targetTeam.players.map(p => ({ ...p, isAlive: true })));
    
    await new Promise(r => setTimeout(r, 500));
    setPhase('firing');
  }, [phase]);

  // Continuous scope movement during firing phase
  useEffect(() => {
    let interval: any;
    if (phase === 'firing' && !isFiring) {
      interval = setInterval(() => {
        setScopePos({
          x: 10 + Math.random() * 80,
          y: 30 + Math.random() * 40
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [phase, isFiring]);

  // Handle shooting in firing squad
  const handleShoot = useCallback(async () => {
    if (phase !== 'firing' || isFiring) return;
    
    const alivePlayers = firingSquadPlayers.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) return;

    setIsFiring(true);
    
    // Drama: Hover over multiple targets before locking
    const hoverCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < hoverCount; i++) {
      const tempIdx = Math.floor(Math.random() * alivePlayers.length);
      const tempPlayer = alivePlayers[tempIdx];
      const tempVisualIdx = firingSquadPlayers.findIndex(p => p.id === tempPlayer.id);
      const tempX = (tempVisualIdx + 1) * (100 / (firingSquadPlayers.length + 1));
      // Aim at head (y: 52.5 in the 200px relative container)
      setScopePos({ x: tempX, y: 52.5 });
      await new Promise(r => setTimeout(r, 300 + (i * 100)));
    }

    // Pick the final target
    const targetIdx = Math.floor(Math.random() * alivePlayers.length);
    const targetPlayer = alivePlayers[targetIdx];
    
    // Position scope on target precisely at the head
    const playerVisualIdx = firingSquadPlayers.findIndex(p => p.id === targetPlayer.id);
    const targetX = (playerVisualIdx + 1) * (100 / (firingSquadPlayers.length + 1));
    setScopePos({ x: targetX, y: 52.5 });

    await new Promise(r => setTimeout(r, 1200)); // Dramatic pause before shot

    // Fire!
    controls.start({
      x: [0, -20, 20, -20, 20, 0],
      y: [0, 10, -10, 10, -10, 0],
      transition: { duration: 0.2 }
    });

    setFiringSquadPlayers(prev => prev.map(p => p.id === targetPlayer.id ? { ...p, isAlive: false } : p));
    
    setTimeout(() => {
      setIsFiring(false);
    }, 1500);
  }, [phase, isFiring, firingSquadPlayers, controls]);

  // Check if firing squad is done
  useEffect(() => {
    if (phase === 'firing' && firingSquadPlayers.filter(p => p.isAlive).length === 1 && !isFiring) {
      const winner = firingSquadPlayers.find(p => p.isAlive)!;
      setPhase('winner');
      triggerConfetti();
      
      // Add to global winners
      const prizeIdx = state.winners.length;
      if (prizeIdx < state.prizes.length) {
        setState(s => ({
          ...s,
          winners: [...s.winners, {
            prize: s.prizes[prizeIdx],
            player: { id: winner.id, name: winner.name }
          }]
        }));
      }

      // Mark team as eliminated
      setTeams(prev => prev.map(t => t.id === activeTeamId ? { ...t, status: 'eliminated' } : t));
      
      // If we still need more winners, wait for user to click continue or auto-play
    }
  }, [phase, firingSquadPlayers, isFiring, state.winners.length, state.prizes.length, activeTeamId, setState]);

  // Auto-play logic
  useEffect(() => {
    let timer: any;
    if (isAutoPlaying) {
      if (phase === 'camp') {
        timer = setTimeout(selectTeam, 2000);
      } else if (phase === 'firing' && !isFiring) {
        timer = setTimeout(handleShoot, 2000);
      } else if (phase === 'winner') {
        if (state.winners.length < state.prizes.length) {
          timer = setTimeout(() => {
            setPhase('camp');
            setActiveTeamId(null);
            setFiringSquadPlayers([]);
          }, 3000);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, phase, isFiring, selectTeam, handleShoot, state.winners.length, state.prizes.length]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#d97706']
    });
  };

  const resetGame = () => {
    setTeams(prev => prev.map(t => ({ ...t, status: 'camp' })));
    setPhase('camp');
    setActiveTeamId(null);
    setFiringSquadPlayers([]);
    setIsAutoPlaying(false);
    setConfirmDialog(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-6 text-zinc-900 overflow-hidden relative bg-stone-200">
      {/* Prison Camp Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
        {/* Brick Floor Pattern */}
        <div className="absolute inset-0 bg-stone-300" style={{ 
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 20px'
        }} />
        
        {/* Dirt Patches */}
        <div className="absolute top-1/4 left-1/4 w-64 h-32 bg-stone-400/30 rounded-full blur-3xl transform rotate-12" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-48 bg-stone-400/30 rounded-full blur-3xl transform -rotate-12" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-6 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-stone-300 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-stone-200 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-900">
              PRISON <span className="text-red-600">CAMP</span> ELIMINATION
            </h2>
            <div className="flex gap-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              <span>WINNERS FOUND: {state.winners.length} / {state.prizes.length}</span>
              <span>TEAMS REMAINING: {teams.filter(t => t.status === 'camp').length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all text-white ${isAutoPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {isAutoPlaying ? <><Pause className="w-5 h-5" /> PAUSE</> : <><Play className="w-5 h-5" /> AUTO MODE</>}
          </button>
          <button onClick={() => setConfirmDialog('reset')} className="bg-stone-200 p-3 rounded-xl hover:bg-stone-300 transition text-stone-700"><RotateCcw className="w-5 h-5" /></button>
          <button onClick={() => setConfirmDialog('stop')} className="bg-red-100 text-red-600 p-3 rounded-xl hover:bg-red-200 transition border border-red-200"><XSquare className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Main Game Area */}
      <motion.div animate={controls} className="flex-1 relative bg-stone-100/80 rounded-3xl border border-stone-300 overflow-hidden shadow-inner">
        
        {/* PHASE: CAMP / SELECTING / DRAGGING */}
        {phase === 'camp' || phase === 'selecting' || phase === 'dragging' ? (
          <div className="w-full h-full relative p-8">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1 rounded-full text-[10px] font-bold text-stone-600 uppercase tracking-[0.3em] border border-stone-300 shadow-sm z-10">
              Concentration Area
            </div>

            {/* Fence Enclosure */}
            <div className="absolute inset-10 border-4 border-stone-400 rounded-3xl pointer-events-none z-0 overflow-hidden">
              {/* Barbed Wire details on the fence */}
              <div className="absolute top-0 left-0 w-full h-2 flex items-center justify-around opacity-50">
                {[...Array(30)].map((_, i) => <div key={i} className="w-3 h-3 border border-stone-500 rotate-45 transform -translate-y-1/2" />)}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-2 flex items-center justify-around opacity-50">
                {[...Array(30)].map((_, i) => <div key={i} className="w-3 h-3 border border-stone-500 rotate-45 transform translate-y-1/2" />)}
              </div>
              <div className="absolute top-0 left-0 h-full w-2 flex flex-col items-center justify-around opacity-50">
                {[...Array(20)].map((_, i) => <div key={i} className="w-3 h-3 border border-stone-500 rotate-45 transform -translate-x-1/2" />)}
              </div>
              <div className="absolute top-0 right-0 h-full w-2 flex flex-col items-center justify-around opacity-50">
                {[...Array(20)].map((_, i) => <div key={i} className="w-3 h-3 border border-stone-500 rotate-45 transform translate-x-1/2" />)}
              </div>
              
              {/* Gate Visual */}
              <motion.div 
                animate={{ rotateY: isGateOpen ? -90 : 0 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-32 bg-stone-500 border-2 border-stone-400 origin-left z-20"
              />
            </div>

            {/* Monster Visual */}
            <motion.div 
              animate={{ left: `${soldierPos.x}%`, top: `${soldierPos.y}%` }}
              transition={{ duration: 1, ease: "linear" }}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase whitespace-nowrap shadow-lg">MONSTER</div>
                <MonsterFigure size={60} />
              </div>
            </motion.div>

            {/* Capture Net Rope */}
            <AnimatePresence>
              {isNetActive && (
                <motion.svg 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 w-full h-full pointer-events-none z-30"
                >
                  <line 
                    x1={`${soldierPos.x}%`} 
                    y1={`${soldierPos.y}%`} 
                    x2={`${netPos.x}%`} 
                    y2={`${netPos.y}%`} 
                    stroke="#78716c" 
                    strokeWidth="2" 
                    strokeDasharray="4 4" 
                  />
                </motion.svg>
              )}
            </AnimatePresence>

            {/* Capture Net */}
            <AnimatePresence>
              {isNetActive && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ left: `${netPos.x}%`, top: `${netPos.y}%`, scale: 1.2, opacity: 0.6 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute z-40 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-dashed border-zinc-400 rounded-xl bg-zinc-500/20"
                >
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="border border-zinc-400/30" />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Teams in Camp */}
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={false}
                animate={{ 
                  left: `${team.pos.x}%`, 
                  top: `${team.pos.y}%`,
                  scale: team.status === 'eliminated' ? 0.8 : 1,
                  opacity: team.status === 'eliminated' ? 0.3 : 1
                }}
                transition={{
                  left: { duration: 2, ease: "easeInOut" },
                  top: { duration: 2, ease: "easeInOut" },
                  scale: { duration: 0.5 },
                  opacity: { duration: 0.5 }
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-end p-2"
              >
                <div className="flex items-end justify-center mb-2">
                  {team.players.map((p, i) => (
                    <div 
                      key={i} 
                      className="relative"
                      style={{ 
                        marginLeft: i === 0 ? 0 : -10,
                        marginTop: Math.sin(i) * 5,
                        zIndex: i 
                      }}
                    >
                      <StickFigure color="#52525b" size={25} id={p.id} isScrambling={true} />
                    </div>
                  ))}
                </div>
                
                {/* Team Name */}
                <div className="text-[10px] font-black text-stone-700 bg-white/80 px-2 py-0.5 rounded-full whitespace-nowrap border border-stone-300 shadow-sm">
                  TEAM {index + 1}
                </div>

                {team.status === 'eliminated' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-50">
                    <Skull className="w-6 h-6 text-red-600" />
                  </div>
                )}
              </motion.div>
            ))}

            {phase === 'camp' && !isAutoPlaying && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
                <button 
                  onClick={selectTeam}
                  className="bg-stone-900 text-white font-black px-12 py-4 rounded-2xl hover:bg-stone-800 transition-all uppercase tracking-widest shadow-2xl flex items-center gap-3"
                >
                  <Target className="w-6 h-6" /> SELECT NEXT TEAM
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* PHASE: FIRING SQUAD */}
        {(phase === 'firing' || phase === 'winner') && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full bg-stone-900 flex flex-col items-center justify-center p-12 relative text-white"
          >
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center">
              <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-red-500/20 mb-4">
                <Zap className="w-3 h-3" /> Execution Line - TEAM {teams.findIndex(t => t.id === activeTeamId) + 1}
              </div>
              <h3 className="text-4xl font-black uppercase tracking-tighter italic">
                {phase === 'winner' ? "SURVIVOR FOUND" : "ELIMINATION IN PROGRESS"}
              </h3>
            </div>

            {/* The Lineup and Scope Container */}
            <div className="relative w-full max-w-4xl h-[200px] mt-12 mx-auto">
              {/* Sniper Scope */}
              {phase === 'firing' && (
                <motion.div 
                  animate={{ left: `${scopePos.x}%`, top: `${scopePos.y}%` }}
                  transition={{ 
                    left: { type: "spring", stiffness: 40, damping: 15 },
                    top: { type: "spring", stiffness: 40, damping: 15 }
                  }}
                  className="absolute z-[100] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <div className="relative w-64 h-64 border-2 border-red-500/40 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 border-[40px] border-black/80 rounded-full" />
                    <div className="w-full h-0.5 bg-red-500/40 absolute" />
                    <div className="h-full w-0.5 bg-red-500/40 absolute" />
                    <div className="w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] font-mono text-red-400 px-2 rounded border border-red-500/20">
                      {isFiring ? "ENGAGING..." : "SCANNING..."}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Players */}
              {firingSquadPlayers.map((p, idx) => {
                const xPos = (idx + 1) * (100 / (firingSquadPlayers.length + 1));
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      left: `${xPos}%`,
                      y: p.isAlive ? 0 : 40,
                      opacity: p.isAlive ? 1 : 0.3,
                      scale: p.isAlive ? 1 : 0.8
                    }}
                    transition={{
                      left: { type: "spring", stiffness: 50, damping: 15 }
                    }}
                    className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
                  >
                    <StickFigure 
                      color={p.isAlive ? "#e4e4e7" : "#450a0a"} 
                      size={80} 
                      isDead={!p.isAlive} 
                      id={p.id}
                      largeId={true}
                      showFullId={!p.isAlive || (phase === 'winner' && p.isAlive)}
                      isWinner={phase === 'winner' && p.isAlive}
                      rotate={p.isAlive ? 0 : (idx % 2 === 0 ? 90 : -90)}
                    />
                  </motion.div>
                );
              })}
            </div>

            {phase === 'firing' && !isAutoPlaying && (
              <div className="mt-24">
                <button 
                  onClick={handleShoot}
                  disabled={isFiring}
                  className="bg-red-600 text-white font-black px-16 py-5 rounded-2xl hover:bg-red-500 transition-all uppercase tracking-widest shadow-2xl disabled:opacity-50 flex items-center gap-3"
                >
                  <Crosshair className="w-6 h-6" /> EXECUTE SHOT
                </button>
              </div>
            )}

            {phase === 'winner' && !isAutoPlaying && state.winners.length < state.prizes.length && (
              <div className="mt-24">
                <button 
                  onClick={() => {
                    setPhase('camp');
                    setActiveTeamId(null);
                    setFiringSquadPlayers([]);
                  }}
                  className="bg-emerald-600 text-white font-black px-16 py-5 rounded-2xl hover:bg-emerald-500 transition-all uppercase tracking-widest shadow-2xl flex items-center gap-3"
                >
                  <Play className="w-6 h-6" /> CONTINUE TO NEXT TEAM
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Footer Stats */}
      <div className="mt-6 flex justify-between items-center px-4">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Total Population</span>
            <span className="text-xl font-black text-stone-800">{state.players.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Eliminated</span>
            <span className="text-xl font-black text-red-600">
              {teams.filter(t => t.status === 'eliminated').reduce((acc, t) => acc + t.players.length, 0) + 
               firingSquadPlayers.filter(p => !p.isAlive).length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>The last survivor of each selected squad wins a prize.</span>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="absolute inset-0 bg-stone-900/90 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-10 rounded-3xl max-w-sm w-full text-center border border-stone-200 shadow-2xl text-stone-900"
            >
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">ABORT MISSION?</h3>
              <p className="text-stone-500 mb-8 text-sm leading-relaxed">
                All current progress will be lost. Terminate the operation?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (confirmDialog === 'reset') resetGame();
                    else setState(s => ({ ...s, view: 'result' }));
                  }}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white transition font-black uppercase tracking-widest"
                >
                  CONFIRM
                </button>
                <button onClick={() => setConfirmDialog(null)} className="w-full py-4 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 transition font-black uppercase tracking-widest">
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
