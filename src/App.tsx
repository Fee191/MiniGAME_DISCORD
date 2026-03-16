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
    eventName: 'Lucky Draw',
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
      <div className="relative z-10 w-full h-full">
        {state.view === 'config' && <ConfigScreen state={state} setState={setState} />}
        {state.view === 'prizeConfig' && <PrizeConfigScreen state={state} setState={setState} />}
        {state.view === 'game1' && <Game1Screen state={state} setState={setState} />}
        {state.view === 'game2' && <Game2Screen state={state} setState={setState} />}
        {state.view === 'result' && <ResultScreen state={state} setState={setState} />}
      </div>
    </div>
  );
}
