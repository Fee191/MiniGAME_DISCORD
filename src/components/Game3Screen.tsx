import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, XSquare, AlertCircle, ArrowRight, CircleDot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player } from '../types';

interface Game3ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface Ball {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isFinished: boolean;
  bucketIndex: number | null;
}

interface Peg {
  x: number;
  y: number;
  radius: number;
}

export default function Game3Screen({ state, setState }: Game3ScreenProps) {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([...state.players]);
  const [gameState, setGameState] = useState<'idle' | 'dropping' | 'finished'>('idle');
  const [winner, setWinner] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'stop' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const requestRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPrize = state.prizes[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= state.prizes.length;

  const ROWS_PER_STAGE = 6;
  const STAGES = 3;
  const PEGS_RADIUS = 3;
  const BALL_RADIUS = 7;
  const GRAVITY = 0.04;
  const FRICTION = 0.995;
  const BOUNCE = 0.4;
  const BUCKET_COUNT = 15;

  // Generate Pegs with 3 stages
  const pegs = useMemo(() => {
    const p: Peg[] = [];
    const spacingX = 45;
    const spacingY = 35;
    let currentY = 60;

    for (let s = 0; s < STAGES; s++) {
      // Each stage has its own set of rows
      for (let r = 0; r < ROWS_PER_STAGE; r++) {
        const rowY = currentY + r * spacingY;
        
        // Stage logic: wide at top, narrow at bottom of stage
        // Stage 0: 10 pegs -> 4 pegs
        // Stage 1: 8 pegs -> 3 pegs
        // Stage 2: 12 pegs -> 12 pegs (final spread)
        
        let rowPegs = 0;
        if (s === 0) rowPegs = 10 - Math.floor(r * 1.2);
        else if (s === 1) rowPegs = 8 - Math.floor(r * 1);
        else rowPegs = 6 + Math.floor(r * 1.5);

        const rowWidth = (rowPegs - 1) * spacingX;
        const startX = -rowWidth / 2;

        for (let i = 0; i < rowPegs; i++) {
          p.push({
            x: startX + i * spacingX,
            y: rowY,
            radius: PEGS_RADIUS
          });
        }
      }
      currentY += ROWS_PER_STAGE * spacingY + 60; // Gap between stages
    }
    return p;
  }, []);

  const initBalls = () => {
    const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];
    const newBalls = remainingPlayers.map((p, i) => ({
      id: p.id,
      name: p.name,
      x: (Math.random() - 0.5) * 100, // Wider random start
      y: 20,
      vx: (Math.random() - 0.5) * 1,
      vy: 0,
      radius: BALL_RADIUS,
      color: colors[i % colors.length],
      isFinished: false,
      bucketIndex: null
    }));
    ballsRef.current = newBalls;
  };

  const startDrop = () => {
    if (remainingPlayers.length === 0) {
      setErrorMsg('No players left in the list!');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setGameState('dropping');
    initBalls();
    requestRef.current = requestAnimationFrame(update);
  };

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw Stages Background/Dividers
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.setLineDash([10, 5]);
    for (let s = 1; s < STAGES; s++) {
      const y = 60 + s * (ROWS_PER_STAGE * 35 + 60) - 30;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.font = 'bold 12px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`QUALIFIER STAGE ${s}`, 20, y - 10);
    }
    ctx.setLineDash([]);

    // Draw Pegs with Glow
    pegs.forEach(peg => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX + peg.x, peg.y, peg.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Buckets
    const bucketWidth = 40;
    const bucketStartY = 60 + STAGES * (ROWS_PER_STAGE * 35 + 60) - 40;
    const totalBucketWidth = (BUCKET_COUNT - 1) * bucketWidth;
    const bucketStartX = centerX - totalBucketWidth / 2;

    for (let i = 0; i < BUCKET_COUNT; i++) {
      const bx = bucketStartX + i * bucketWidth;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - bucketWidth / 2, bucketStartY);
      ctx.lineTo(bx - bucketWidth / 2, bucketStartY + 60);
      ctx.stroke();
      
      // Highlight center bucket with neon glow
      if (i === Math.floor(BUCKET_COUNT / 2)) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#eab308';
        ctx.fillRect(bx - bucketWidth / 2, bucketStartY, bucketWidth, 60);
        ctx.shadowBlur = 0;
      }
    }

    let allFinished = true;

    ballsRef.current.forEach(ball => {
      if (ball.isFinished) {
        // Draw finished ball in bucket
        const bx = bucketStartX + ball.bucketIndex! * bucketWidth;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(bx, bucketStartY + 20, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      allFinished = false;

      // Physics
      ball.vy += GRAVITY;
      ball.vx *= FRICTION;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Peg Collisions
      pegs.forEach(peg => {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ball.radius + peg.radius) {
          // Collision response
          const angle = Math.atan2(dy, dx);
          const targetX = peg.x + Math.cos(angle) * (ball.radius + peg.radius);
          const targetY = peg.y + Math.sin(angle) * (ball.radius + peg.radius);
          
          ball.x = targetX;
          ball.y = targetY;
          
          // Reflect velocity
          const normalX = dx / dist;
          const normalY = dy / dist;
          const dot = ball.vx * normalX + ball.vy * normalY;
          
          ball.vx = (ball.vx - 2 * dot * normalX) * BOUNCE;
          ball.vy = (ball.vy - 2 * dot * normalY) * BOUNCE;
          
          // Add a bit of randomness to avoid getting stuck
          ball.vx += (Math.random() - 0.5) * 0.5;
        }
      });

      // Bucket Collision
      if (ball.y > bucketStartY) {
        const relativeX = ball.x - (bucketStartX - centerX);
        const bIndex = Math.round(relativeX / bucketWidth);
        const clampedIndex = Math.max(0, Math.min(BUCKET_COUNT - 1, bIndex));
        
        ball.isFinished = true;
        ball.bucketIndex = clampedIndex;
        ball.y = bucketStartY + 20;
      }

      // Draw Ball
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(centerX + ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw Label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(ball.id, centerX + ball.x, ball.y - 12);
      ctx.shadowBlur = 0;
    });

    if (allFinished) {
      handleFinish();
    } else {
      requestRef.current = requestAnimationFrame(update);
    }
  };

  const handleFinish = () => {
    setGameState('finished');
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    // Determine winner: ball closest to center bucket
    const centerIndex = Math.floor(BUCKET_COUNT / 2);
    
    // Find all balls in the center bucket
    const centerBalls = ballsRef.current.filter(b => b.bucketIndex === centerIndex);
    
    let winnerBall: Ball;
    if (centerBalls.length > 0) {
      // Randomly pick one from the center bucket
      winnerBall = centerBalls[Math.floor(Math.random() * centerBalls.length)];
    } else {
      // Pick ball closest to center bucket
      winnerBall = ballsRef.current.reduce((prev, curr) => {
        const prevDist = Math.abs(prev.bucketIndex! - centerIndex);
        const currDist = Math.abs(curr.bucketIndex! - centerIndex);
        return currDist < prevDist ? curr : prev;
      });
    }

    const winnerPlayer = remainingPlayers.find(p => p.id === winnerBall.id)!;
    setWinner(winnerPlayer);
    
    triggerConfetti();
    
    setState(s => ({
      ...s,
      winners: [...s.winners, { prize: currentPrize, player: winnerPlayer }]
    }));
    setRemainingPlayers(prev => prev.filter(p => p.id !== winnerPlayer.id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const nextPrize = () => {
    setCurrentPrizeIndex(prev => prev + 1);
    setGameState('idle');
    setWinner(null);
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isFinished) {
      setState(s => ({ ...s, view: 'result' }));
    }
  }, [isFinished, setState]);

  if (!currentPrize) return null;

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 text-white overflow-hidden relative bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_0%,#0f172a_100%)] z-0" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <Trophy className="w-10 h-10 text-yellow-400" />
          <div>
            <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">
              {state.eventName || 'Event'}
            </p>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              {currentPrize.name}
            </h2>
            <p className="text-sm text-blue-200">{currentPrize.content}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setState(s => ({ ...s, view: 'config' }))}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition border border-white/10 text-xs font-bold uppercase tracking-widest"
          >
            Home
          </button>
          <button
            onClick={() => setConfirmDialog('reset')}
            className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition border border-white/10"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setConfirmDialog('stop')}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-3 rounded-xl transition border border-red-500/20"
          >
            <XSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative z-10 flex flex-col md:flex-row gap-8 min-h-0">
        <div ref={containerRef} className="flex-1 bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
          
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startDrop}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-4 px-12 rounded-2xl shadow-2xl flex items-center gap-3 tracking-widest uppercase"
              >
                <Play className="w-6 h-6" /> DROP BALLS
              </motion.button>
            </div>
          )}

          {gameState === 'finished' && winner && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-8 bg-slate-800 rounded-3xl border-2 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]"
              >
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-widest mb-2">WINNER</h3>
                <p className="text-4xl font-black text-white mb-1">{winner.id}</p>
                <p className="text-2xl font-bold text-blue-300 mb-8">{winner.name}</p>
                
                <button
                  onClick={nextPrize}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-10 rounded-xl transition-transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  {currentPrizeIndex < state.prizes.length - 1 ? (
                    <>NEXT PRIZE <ArrowRight className="w-5 h-5" /></>
                  ) : (
                    <>VIEW RESULTS <Trophy className="w-5 h-5" /></>
                  )}
                </button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Sidebar: Stats & Winners */}
        <div className="w-full md:w-72 flex flex-col gap-4 shrink-0">
          <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-4">
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CircleDot className="w-4 h-4" /> Players ({remainingPlayers.length})
            </h3>
            <div className="max-h-40 overflow-y-auto custom-scrollbar text-xs text-white/60 space-y-1">
              {remainingPlayers.slice(0, 50).map(p => (
                <div key={p.id} className="flex justify-between">
                  <span>{p.id}</span>
                  <span className="truncate ml-2">{p.name}</span>
                </div>
              ))}
              {remainingPlayers.length > 50 && <div className="text-center pt-2">...and {remainingPlayers.length - 50} more</div>}
            </div>
          </div>

          <div className="flex-1 bg-slate-800/50 rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Winners
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {state.winners.length === 0 ? (
                <p className="text-center text-white/30 italic py-4 text-sm">No winners yet</p>
              ) : (
                state.winners.map((w, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs">
                    <p className="text-blue-300 font-bold truncate">{w.prize.name}</p>
                    <p className="text-white font-mono">{w.player.id}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Are you sure?</h3>
              <p className="text-white/60 mb-8">
                {confirmDialog === 'reset' ? 'Restart the entire game?' : 'End the game and see results?'}
              </p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition">Cancel</button>
                <button
                  onClick={() => {
                    if (confirmDialog === 'reset') setState(s => ({ ...s, view: 'config', winners: [] }));
                    else setState(s => ({ ...s, view: 'result' }));
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 transition"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
