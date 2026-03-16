/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ConfigScreen from './components/ConfigScreen';
import PrizeConfigScreen from './components/PrizeConfigScreen';
import Game1Screen from './components/Game1Screen';
import Game2Screen from './components/Game2Screen';
import ResultScreen from './components/ResultScreen';
import { AppState } from './types';

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'config',
    selectedGame: null,
    eventName: '',
    bgImage: '',
    players: [],
    prizes: [],
    winners: []
  });

  return (
    <div 
      className="min-h-screen bg-gray-900 font-sans text-gray-100 overflow-hidden relative"
      style={{
        backgroundImage: state.bgImage ? `url(${state.bgImage})` : 'none',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Fallback gradient if no bg image */}
      {!state.bgImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-80 z-0" />
      )}

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Persistent Header */}
        <header className="w-full py-4 px-6 flex items-center justify-between bg-black/30 backdrop-blur-sm border-bottom border-white/10">
          <div className="flex items-center gap-4">
            <img 
              src="https://yt3.googleusercontent.com/pgeR6QcHsQuV9O6F0qDv_oOBkIWdBF7oJ3nIa1FLmcRzwmWJAXrbtxvyiIS1Kxmcq9zfXm5q=s900-c-k-c0x00ffffff-no-rj" 
              alt="Logo" 
              className="w-12 h-12 rounded-full border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tighter text-white uppercase italic">
                {state.eventName || 'Discord Ghost Story: Love Destiny'}
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-bold">Mini-game System | Discord</p>
            </div>
          </div>
          
          {state.view !== 'config' && (
            <button 
              onClick={() => setState(s => ({ ...s, view: 'config' }))}
              className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
            >
              Home
            </button>
          )}
        </header>

        <div className="flex-1 overflow-auto">
          {state.view === 'config' && <ConfigScreen state={state} setState={setState} />}
          {state.view === 'prizeConfig' && <PrizeConfigScreen state={state} setState={setState} />}
          {state.view === 'game1' && <Game1Screen state={state} setState={setState} />}
          {state.view === 'game2' && <Game2Screen state={state} setState={setState} />}
          {state.view === 'result' && <ResultScreen state={state} setState={setState} />}
        </div>
      </div>
    </div>
  );
}
