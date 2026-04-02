import React, { useState, useRef } from 'react';
import { Upload, Play, Settings, Users, Image as ImageIcon, Gift } from 'lucide-react';
import { AppState } from '../types';

interface ConfigScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const AVAILABLE_GAMES = [
  {
    id: 'game1',
    name: 'Lottery',
    description: 'Classic spinning wheel for random draws',
    color: 'from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500',
  },
  {
    id: 'game2',
    name: 'Animal Race',
    description: 'Exciting race to determine the winner',
    color: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500',
  },
  {
    id: 'game4',
    name: 'Battle Royale',
    description: 'Survival of the luckiest on a shrinking grid',
    color: 'from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500',
  },
  {
    id: 'game5',
    name: 'Tower Climb',
    description: 'Race to the top of the tower',
    color: 'from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500',
  },
  {
    id: 'game6',
    name: 'Glass Bridge',
    description: 'Cross the bridge of luck',
    color: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
  },
  {
    id: 'game7',
    name: 'Mystery Boxes',
    description: 'Pick the right box to survive',
    color: 'from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500',
  },
  {
    id: 'game8',
    name: 'Space Race',
    description: 'Launch to the moon first',
    color: 'from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800',
  },
  {
    id: 'game9',
    name: 'Sniper Elimination',
    description: 'Eliminate rows until only one column remains',
    color: 'from-zinc-800 to-black hover:from-zinc-700 hover:to-zinc-900',
  }
  // Add future games here easily:
];

export default function ConfigScreen({ state, setState }: ConfigScreenProps) {
  const [playerInput, setPlayerInput] = useState(state.players.map(p => `${p.id}${p.name !== p.id ? `\t${p.name}` : ''}`).join('\n'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const parsePlayers = (text: string) => {
    const lines = text.split(/[\r\n]+/).filter(line => line.trim());
    const headerKeywords = ['ma_so', 'ten_kh', 'id', 'name', 'tên', 'mã số', 'stt'];
    
    return lines
      .map(line => {
        // Handle Discord format: "LuckyPlayer - 3869604012 - A Ô" or "ID - Name"
        if (line.includes(' - ')) {
          const parts = line.split(' - ').map(p => p.trim());
          if (parts.length >= 3) {
            // Format: Prefix - ID - Name
            return { id: parts[1], name: parts[2] };
          } else if (parts.length === 2) {
            // Format: ID - Name
            return { id: parts[0], name: parts[1] };
          }
        }
        
        // Fallback to splitting by tab, comma, or semicolon
        const parts = line.split(/[\t,;]/).map(p => p.trim());
        if (parts.length >= 2) {
          return { id: parts[0], name: parts[1] };
        }
        return { id: parts[0], name: parts[0] };
      })
      .filter(player => {
        // Filter out header rows
        const idLower = player.id.toLowerCase();
        const nameLower = player.name.toLowerCase();
        return !headerKeywords.some(keyword => idLower.includes(keyword) || nameLower.includes(keyword));
      });
  };

  const handlePlayerInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPlayerInput(e.target.value);
    const players = parsePlayers(e.target.value);
    setState(s => ({ ...s, players }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const players = parsePlayers(text);
      setPlayerInput(players.map(p => `${p.id}\t${p.name}`).join('\n'));
      setState(s => ({ ...s, players }));
    };
    reader.readAsText(file);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setState(s => ({ ...s, bgImage: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const selectGame = (gameId: string) => {
    if (state.players.length === 0) {
      alert('Please enter the player list!');
      return;
    }
    setState(s => ({ ...s, view: 'prizeConfig', selectedGame: gameId }));
  };

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-md p-8 text-white flex justify-center items-start overflow-y-auto">
      <div className="w-full max-w-4xl bg-white/10 p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="flex items-center gap-4 mb-8 border-b border-white/20 pb-6">
          <Settings className="w-10 h-10 text-yellow-400" />
          <h1 className="text-4xl font-bold tracking-tight">Event Configuration</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column: General Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Gift className="w-4 h-4" /> Event Name
              </label>
              <input
                type="text"
                value={state.eventName}
                onChange={e => setState(s => ({ ...s, eventName: e.target.value }))}
                className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                placeholder="Enter event name..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Background Image (Optional)
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-2 transition"
                >
                  <Upload className="w-4 h-4" /> Upload Image
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={bgInputRef}
                  onChange={handleBgUpload}
                  className="hidden"
                />
                {state.bgImage && (
                  <button
                    onClick={() => setState(s => ({ ...s, bgImage: '' }))}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Players */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Player List ({state.players.length})</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg flex items-center gap-1 transition"
                >
                  <Upload className="w-3 h-3" /> Upload CSV/TXT
                </button>
                <input
                  type="file"
                  accept=".csv,.txt"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <textarea
                value={playerInput}
                onChange={handlePlayerInput}
                className="w-full h-48 bg-black/30 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition font-mono text-sm resize-none"
                placeholder="Enter player IDs, one per line..."
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/20 flex flex-wrap justify-center gap-4 md:gap-6">
          {AVAILABLE_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => selectGame(game.id)}
              className={`flex-1 min-w-[260px] max-w-[320px] bg-gradient-to-r ${game.color} text-white font-bold py-6 px-6 rounded-2xl shadow-xl transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center border border-white/10 hover:border-white/30 relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
              <Play className="w-10 h-10 mb-1 drop-shadow-md" />
              <span className="text-2xl tracking-wide">{game.name}</span>
              <span className="text-sm font-medium text-white/80">{game.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}