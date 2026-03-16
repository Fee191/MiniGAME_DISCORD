export interface Prize {
  id: string;
  name: string;
  content: string;
}

export interface Winner {
  prize: Prize;
  playerId: string;
}

export interface AppState {
  view: string;
  selectedGame: string | null;
  eventName: string;
  bgImage: string;
  players: string[];
  prizes: Prize[];
  winners: Winner[];
}
