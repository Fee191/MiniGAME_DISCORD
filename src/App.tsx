/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ConfigScreen from './components/ConfigScreen';
import PrizeConfigScreen from './components/PrizeConfigScreen';
import Game1Screen from './components/Game1Screen';
import Game2Screen from './components/Game2Screen';
import Game3Screen from './components/Game3Screen';
import Game9Screen from './components/Game9Screen';
import ResultScreen from './components/ResultScreen';
import HistoryPanel from './components/HistoryPanel';
import { AppState } from './types';

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'config',
    selectedGame: null,
    eventName: '',
    bgImage: '',
    players: [],
    prizes: [],
    winners: [],
    rejected: []
  });

  const isGameView = ['game1', 'game2', 'game3', 'game9'].includes(state.view);

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
      <div className="relative z-10 w-full h-full flex">
        {/* Persistent History Panel (only show in game views) */}
        {isGameView && (
          <div className="w-64 md:w-72 shrink-0 h-screen">
            <HistoryPanel state={state} />
          </div>
        )}

        <div className="flex-1 h-screen overflow-auto relative">
          {state.view === 'config' && <ConfigScreen state={state} setState={setState} />}
          {state.view === 'prizeConfig' && <PrizeConfigScreen state={state} setState={setState} />}
          {state.view === 'game1' && <Game1Screen state={state} setState={setState} />}
          {state.view === 'game2' && <Game2Screen state={state} setState={setState} />}
          {state.view === 'game3' && <Game3Screen state={state} setState={setState} />}
          {state.view === 'game9' && <Game9Screen state={state} setState={setState} />}
          {state.view === 'result' && <ResultScreen state={state} setState={setState} />}
        </div>
      </div>
    </div>
  );
}
