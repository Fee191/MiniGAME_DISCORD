/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ConfigScreen from './components/ConfigScreen';
import PrizeConfigScreen from './components/PrizeConfigScreen';
import Game1Screen from './components/Game1Screen';
import Game2Screen from './components/Game2Screen';
import Game4Screen from './components/Game4Screen';
import Game5Screen from './components/Game5Screen';
import Game6Screen from './components/Game6Screen';
import Game7Screen from './components/Game7Screen';
import Game8Screen from './components/Game8Screen';
import Game9Screen from './components/Game9Screen';
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
        {/* Persistent Header - REMOVED */}

        <div className="flex-1 overflow-auto">
          {state.view === 'config' && <ConfigScreen state={state} setState={setState} />}
          {state.view === 'prizeConfig' && <PrizeConfigScreen state={state} setState={setState} />}
          {state.view === 'game1' && <Game1Screen state={state} setState={setState} />}
          {state.view === 'game2' && <Game2Screen state={state} setState={setState} />}
          {state.view === 'game4' && <Game4Screen state={state} setState={setState} />}
          {state.view === 'game5' && <Game5Screen state={state} setState={setState} />}
          {state.view === 'game6' && <Game6Screen state={state} setState={setState} />}
          {state.view === 'game7' && <Game7Screen state={state} setState={setState} />}
          {state.view === 'game8' && <Game8Screen state={state} setState={setState} />}
          {state.view === 'game9' && <Game9Screen state={state} setState={setState} />}
          {state.view === 'result' && <ResultScreen state={state} setState={setState} />}
        </div>
      </div>
    </div>
  );
}
