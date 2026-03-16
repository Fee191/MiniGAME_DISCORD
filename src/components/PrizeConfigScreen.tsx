import React, { useState, useEffect } from 'react';
import { Play, ArrowLeft, Gift, Copy } from 'lucide-react';
import { AppState, Prize } from '../types';
import { generateId } from '../utils';

interface PrizeConfigScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function PrizeConfigScreen({ state, setState }: PrizeConfigScreenProps) {
  const [prizeCount, setPrizeCount] = useState<number | ''>(state.prizes.length || 1);
  const [commonContent, setCommonContent] = useState('');

  useEffect(() => {
    const count = typeof prizeCount === 'number' ? prizeCount : 0;
    if (count === state.prizes.length) return;

    setState(s => {
      const newPrizes: Prize[] = Array.from({ length: count }).map((_, i) => {
        return s.prizes[i] || {
          id: generateId(),
          name: `Prize ${i + 1}`,
          content: commonContent || 'Reward'
        };
      });
      return { ...s, prizes: newPrizes };
    });
  }, [prizeCount]); // Only run when prizeCount changes

  const updatePrize = (index: number, field: keyof Prize, value: string) => {
    const newPrizes = [...state.prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setState(s => ({ ...s, prizes: newPrizes }));
  };

  const applyCommonContent = () => {
    if (!commonContent) return;
    const newPrizes = state.prizes.map(p => ({ ...p, content: commonContent }));
    setState(s => ({ ...s, prizes: newPrizes }));
  };

  const startGame = () => {
    if (state.prizes.length === 0) {
      alert('Please configure at least 1 prize!');
      return;
    }
    if (state.prizes.length > state.players.length) {
      alert(`The number of prizes (${state.prizes.length}) cannot be greater than the number of players (${state.players.length})!`);
      return;
    }
    setState(s => ({ ...s, view: s.selectedGame as 'game1' | 'game2', winners: [] }));
  };

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-md p-8 text-white flex justify-center items-start overflow-y-auto">
      <div className="w-full max-w-3xl bg-white/10 p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="flex items-center gap-4 mb-8 border-b border-white/20 pb-6">
          <button 
            onClick={() => setState(s => ({ ...s, view: 'config' }))} 
            className="hover:bg-white/10 p-2 rounded-full transition"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Gift className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold tracking-tight">Prize Configuration</h1>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Number of Prizes</label>
              <input
                type="number"
                min="1"
                max={state.players.length}
                value={prizeCount}
                onChange={e => setPrizeCount(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                placeholder="Enter quantity..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Common Reward (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commonContent}
                  onChange={e => setCommonContent(e.target.value)}
                  className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  placeholder="e.g.: 10,000 Gems"
                />
                <button
                  onClick={applyCommonContent}
                  className="bg-white/10 hover:bg-white/20 px-4 rounded-xl border border-white/20 transition flex items-center gap-2"
                  title="Apply to all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-4 border border-white/10 max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
            {state.prizes.map((prize, index) => (
              <div key={prize.id} className="flex flex-col md:flex-row gap-3 items-center bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 w-full md:w-1/3">
                  <span className="bg-yellow-500 text-black font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={prize.name}
                    onChange={e => updatePrize(index, 'name', e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-yellow-400 focus:outline-none px-1 py-1 font-bold"
                    placeholder="Prize Name"
                  />
                </div>
                <input
                  type="text"
                  value={prize.content}
                  onChange={e => updatePrize(index, 'content', e.target.value)}
                  className="w-full md:w-2/3 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 transition"
                  placeholder="Reward Content"
                />
              </div>
            ))}
            {state.prizes.length === 0 && (
              <div className="text-center text-white/40 py-8 italic">
                Please enter the number of prizes to configure.
              </div>
            )}
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-xl py-4 rounded-2xl shadow-lg transform hover:scale-[1.02] transition flex justify-center items-center gap-2"
          >
            <Play className="w-6 h-6" />
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
}
