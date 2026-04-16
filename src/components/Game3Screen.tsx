import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, RotateCcw, XSquare, AlertCircle, Swords, Users, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Player, Prize } from '../types';

interface Game3ScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type Group = {
  id: string;
  prize: Prize;
  players: Player[];
  winner: Player | null;
  currentRound: Player[];
};

export default function Game3Screen({ state, setState }: Game3ScreenProps) {
  const [phase, setPhase] = useState<'setup' | 'elimination_reveal' | 'group_selection' | 'tournament'>('setup');
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSetup = () => {
    const A = state.players.length;
    const B = state.prizes.length;
    
    if (B === 0) {
      setErrorMsg('Cần có ít nhất 1 giải thưởng để tạo bảng.');
      return;
    }
    
    if (A < B) {
      setErrorMsg(`Không đủ người chơi. Cần ít nhất ${B} người chơi cho ${B} giải thưởng.`);
      return;
    }
    
    const shuffled = [...state.players].sort(() => Math.random() - 0.5);
    
    const newGroups = state.prizes.map((prize, i) => ({
      id: `group-${i}`,
      prize,
      players: [] as Player[],
      winner: null,
      currentRound: [] as Player[],
    }));
    
    if (B === 1) {
      newGroups[0].players = [...shuffled];
      newGroups[0].currentRound = [...shuffled];
    } else {
      const P = Math.floor(A / B);
      let currentIndex = 0;
      for (let i = 0; i < B - 1; i++) {
        const groupPlayers = shuffled.slice(currentIndex, currentIndex + P);
        newGroups[i].players = groupPlayers;
        newGroups[i].currentRound = [...groupPlayers];
        currentIndex += P;
      }
      // Bảng cuối cùng nhận toàn bộ số người còn lại
      const lastGroupPlayers = shuffled.slice(currentIndex);
      newGroups[B - 1].players = lastGroupPlayers;
      newGroups[B - 1].currentRound = [...lastGroupPlayers];
    }
    
    setGroups(newGroups);
    setPhase('elimination_reveal');
    setErrorMsg(null);
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const handleRoundComplete = (groupId: string, winners: Player[]) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const isOverallWinner = winners.length === 1;
        if (isOverallWinner) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        return {
          ...g,
          currentRound: winners,
          winner: isOverallWinner ? winners[0] : null
        };
      }
      return g;
    }));
  };

  const handleAcceptWinner = (groupId: string, winner: Player) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    setState(s => ({
      ...s,
      winners: [...s.winners, { player: winner, prize: group.prize }]
    }));
    
    setPhase('group_selection');
  };

  const handleRejectWinner = (groupId: string, winner: Player) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setState(s => ({
        ...s,
        rejected: [...s.rejected, { player: winner, prize: group.prize }]
      }));
    }

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const newPlayers = g.players.filter(p => p.id !== winner.id);
        return {
          ...g,
          players: newPlayers,
          currentRound: newPlayers,
          winner: null
        };
      }
      return g;
    }));
    setPhase('group_selection');
  };

  const allFinished = groups.length > 0 && groups.every(g => g.winner !== null || g.players.length === 0);

  return (
    <div className="w-full h-full flex flex-col items-center p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between w-full max-w-6xl mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 flex items-center gap-3">
          <Swords className="w-8 h-8 text-orange-500" />
          Stickman Tournament
        </h1>
        <button
          onClick={() => setState(s => ({ ...s, view: 'config' }))}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
        >
          <XSquare className="w-5 h-5" />
          Thoát
        </button>
      </div>

      {phase === 'setup' && (
        <div className="bg-gray-800/80 p-8 rounded-2xl max-w-2xl w-full border border-gray-700 shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-6">Thiết lập giải đấu</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
              <Users className="w-10 h-10 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{state.players.length}</div>
              <div className="text-gray-400">Người chơi</div>
            </div>
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{state.prizes.length}</div>
              <div className="text-gray-400">Giải thưởng (Bảng)</div>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          <button
            onClick={handleSetup}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg shadow-orange-500/25"
          >
            Chia Bảng & Bắt Đầu
          </button>
        </div>
      )}

      {phase === 'elimination_reveal' && (
        <div className="bg-gray-800/80 p-8 rounded-2xl max-w-3xl w-full border border-gray-700 shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-6 text-red-400">Kết quả chia bảng</h2>
          
          <div className="mb-8">
            <p className="text-xl mb-2">Đã chia thành <span className="font-bold text-yellow-400">{groups.length}</span> bảng đấu.</p>
            <p className="text-xl">Tất cả <span className="font-bold text-blue-400">{state.players.length}</span> người chơi đều được tham gia!</p>
          </div>

          <div className="mb-8 p-4 bg-green-900/30 border border-green-700/50 rounded-lg text-green-300">
            {groups.length > 1 ? (
              <span>
                {groups.length - 1} bảng đầu tiên có <b>{groups[0]?.players.length}</b> người chơi.<br/>
                Bảng cuối cùng có <b>{groups[groups.length - 1]?.players.length}</b> người chơi.
              </span>
            ) : (
              <span>Tất cả người chơi được xếp vào 1 bảng duy nhất.</span>
            )}
          </div>

          <button
            onClick={() => setPhase('group_selection')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto"
          >
            Tiếp tục đến các bảng đấu
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {phase === 'group_selection' && (
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Chọn bảng thi đấu</h2>
            {allFinished && (
              <button
                onClick={() => setState(s => ({ ...s, view: 'result' }))}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 animate-pulse"
              >
                Xem Kết Quả Chung Cuộc
                <Trophy className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, idx) => (
              <div 
                key={group.id}
                className={`bg-gray-800/80 p-6 rounded-2xl border ${group.winner ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-700'} flex flex-col`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Bảng {idx + 1}</h3>
                    <p className="text-yellow-400 text-sm">{group.prize.name}</p>
                  </div>
                  <div className="px-3 py-1 bg-gray-900 rounded-full text-sm text-gray-400">
                    {group.players.length} người
                  </div>
                </div>

                {group.winner ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <Trophy className="w-12 h-12 text-yellow-400 mb-2" />
                    <div className="text-lg font-bold text-white">{group.winner.id}</div>
                    {group.winner.name !== group.winner.id && (
                      <div className="text-sm text-gray-400">{group.winner.name}</div>
                    )}
                    <div className="mt-2 text-yellow-500 font-medium">Đã chiến thắng!</div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-gray-400 text-sm mb-4">
                      Vòng hiện tại: {group.currentRound.length} người
                    </div>
                    {group.players.length > 0 ? (
                      <button
                        onClick={() => {
                          setActiveGroupId(group.id);
                          setPhase('tournament');
                        }}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Swords className="w-5 h-5" />
                        Vào thi đấu
                      </button>
                    ) : (
                      <div className="w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-lg flex items-center justify-center gap-2">
                        Hết người chơi
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'tournament' && activeGroup && (
        <TournamentView 
          group={activeGroup} 
          onRoundComplete={(winners) => handleRoundComplete(activeGroup.id, winners)}
          onAcceptWinner={(winner) => handleAcceptWinner(activeGroup.id, winner)}
          onRejectWinner={(winner) => handleRejectWinner(activeGroup.id, winner)}
          onBack={() => setPhase('group_selection')}
        />
      )}
    </div>
  );
}

// --- Subcomponents for Tournament ---

const Stickman = ({ player, facingRight, action }: { player: Player, facingRight: boolean, action: 'idle' | 'attack' | 'die' | 'win' }) => {
  return (
    <motion.div 
      className="flex flex-col items-center"
      animate={
        action === 'attack' ? { x: facingRight ? 30 : -30, rotate: facingRight ? 20 : -20 } :
        action === 'die' ? { opacity: 0, rotate: facingRight ? -90 : 90, y: 40, x: facingRight ? -20 : 20 } :
        action === 'win' ? { y: [0, -20, 0] } :
        { x: 0, y: 0, rotate: 0, opacity: 1 }
      }
      transition={{ 
        duration: action === 'attack' ? 0.2 : 0.5,
        repeat: action === 'win' ? Infinity : 0
      }}
    >
      <span className="text-sm font-bold mb-2 bg-gray-900/80 px-2 py-1 rounded border border-gray-700">{player.id}</span>
      <svg width="60" height="60" viewBox="0 0 50 50" className={facingRight ? '' : 'scale-x-[-1]'}>
        <circle cx="25" cy="10" r="6" stroke="white" strokeWidth="2.5" fill={action === 'die' ? 'red' : 'none'} />
        <line x1="25" y1="16" x2="25" y2="32" stroke="white" strokeWidth="2.5" />
        <line x1="25" y1="22" x2="12" y2="28" stroke="white" strokeWidth="2.5" />
        
        {/* Sword arm */}
        <motion.g
          animate={action === 'attack' ? { rotate: 60, originX: '25px', originY: '22px' } : { rotate: 0, originX: '25px', originY: '22px' }}
          transition={{ duration: 0.15, repeat: action === 'attack' ? Infinity : 0, repeatType: 'reverse' }}
        >
          <line x1="25" y1="22" x2="38" y2="15" stroke="white" strokeWidth="2.5" />
          <line x1="38" y1="15" x2="48" y2="2" stroke="#9ca3af" strokeWidth="3" /> {/* Sword */}
        </motion.g>
        
        <line x1="25" y1="32" x2="15" y2="48" stroke="white" strokeWidth="2.5" />
        <line x1="25" y1="32" x2="35" y2="48" stroke="white" strokeWidth="2.5" />
      </svg>
    </motion.div>
  );
};

const TournamentView = ({ 
  group, 
  onRoundComplete, 
  onAcceptWinner,
  onRejectWinner,
  onBack 
}: { 
  group: Group, 
  onRoundComplete: (winners: Player[]) => void, 
  onAcceptWinner: (winner: Player) => void,
  onRejectWinner: (winner: Player) => void,
  onBack: () => void 
}) => {
  const [results, setResults] = useState<Record<number, number>>({});
  const [fightingIndex, setFightingIndex] = useState<number | null>(null);
  
  const pairs = useMemo(() => {
    const p = [];
    for (let i = 0; i < group.currentRound.length; i += 2) {
      if (i + 1 < group.currentRound.length) {
        p.push([group.currentRound[i], group.currentRound[i+1]]);
      } else {
        p.push([group.currentRound[i]]);
      }
    }
    return p;
  }, [group.currentRound]);

  useEffect(() => {
    const newResults = { ...results };
    let changed = false;
    pairs.forEach((pair, idx) => {
      if (pair.length === 1 && newResults[idx] === undefined) {
        newResults[idx] = -1;
        changed = true;
      }
    });
    if (changed) setResults(newResults);
  }, [pairs, results]);

  const handleFight = (idx: number) => {
    setFightingIndex(idx);
    setTimeout(() => {
      const winnerIdx = Math.random() > 0.5 ? 0 : 1;
      setResults(prev => ({ ...prev, [idx]: winnerIdx }));
      setTimeout(() => {
        setFightingIndex(null);
      }, 1500);
    }, 1000);
  };

  const allFought = pairs.every((_, idx) => results[idx] !== undefined);

  const handleNextRound = () => {
    const winners = pairs.map((pair, idx) => {
      if (pair.length === 1) return pair[0];
      return pair[results[idx]];
    });
    setResults({});
    // Xáo trộn danh sách người thắng để người được đặc cách (nếu lẻ) ở vòng sau là ngẫu nhiên
    const shuffledWinners = [...winners].sort(() => Math.random() - 0.5);
    onRoundComplete(shuffledWinners);
  };

  if (group.currentRound.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl w-full bg-gray-800/80 rounded-2xl border border-yellow-500/50 p-12 shadow-2xl">
        <Trophy className="w-20 h-20 text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Người chiến thắng bảng!</h2>
        
        <Stickman player={group.currentRound[0]} facingRight={true} action="win" />
        
        <div className="mt-8 text-center">
          <p className="text-3xl font-bold text-white">{group.currentRound[0].id}</p>
          {group.currentRound[0].name !== group.currentRound[0].id && (
            <p className="text-xl text-gray-300 mt-2">{group.currentRound[0].name}</p>
          )}
          <p className="text-lg text-yellow-500 mt-4">Giải thưởng: {group.prize.name}</p>
        </div>
        
        <div className="mt-12 flex gap-4">
          <button 
            onClick={() => onAcceptWinner(group.currentRound[0])}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Chấp nhận giải
          </button>
          <button 
            onClick={() => onRejectWinner(group.currentRound[0])}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <XSquare className="w-5 h-5" />
            Hủy kết quả & Đấu lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-8">
        <button onClick={onBack} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2" disabled={fightingIndex !== null}>
          Quay lại
        </button>
        <h2 className="text-2xl font-bold text-orange-400">Vòng đấu: {group.currentRound.length} người</h2>
        <div className="w-24"></div> {/* spacer */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
        {pairs.map((pair, idx) => {
          const result = results[idx];
          const isFighting = fightingIndex === idx;

          const p1Action = isFighting ? 'attack' : (result === 1 ? 'die' : 'idle');
          const p2Action = isFighting ? 'attack' : (result === 0 ? 'die' : 'idle');

          return (
            <div key={idx} className="bg-gray-900/60 p-6 rounded-xl border border-gray-700 flex justify-between items-center h-48 relative">
              <div className="flex-1 flex justify-center">
                <Stickman player={pair[0]} facingRight={true} action={p1Action} />
              </div>
              
              <div className="flex-1 flex justify-center flex-col items-center z-10">
                {pair.length === 2 ? (
                  <>
                    <span className="text-2xl font-black text-red-500 italic mb-2">VS</span>
                    {result !== undefined ? (
                      <span className="text-sm text-yellow-400 font-bold animate-pulse">K.O!</span>
                    ) : isFighting ? (
                      <span className="text-sm text-orange-400 font-bold animate-bounce">Đang chém...</span>
                    ) : (
                      <button
                        onClick={() => handleFight(idx)}
                        disabled={fightingIndex !== null}
                        className={`px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors ${fightingIndex !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Đấu
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">Được đặc cách</span>
                )}
              </div>
              
              <div className="flex-1 flex justify-center">
                {pair.length === 2 && (
                  <Stickman player={pair[1]} facingRight={false} action={p2Action} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allFought && (
        <button
          onClick={handleNextRound}
          className="px-12 py-4 rounded-2xl font-bold text-2xl flex items-center gap-3 transition-all bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105"
        >
          Tiếp Tục Vòng Sau
          <ArrowRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};
