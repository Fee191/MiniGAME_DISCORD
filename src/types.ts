export interface Prize {
  id: string;
  name: string;
  content: string;
}

export interface Player {
  id: string;
  name: string;
}

export interface Winner {
  prize: Prize;
  player: Player;
}

export interface AppState {
  view: string;
  selectedGame: string | null;
  eventName: string;
  bgImage: string;
  players: Player[];
  prizes: Prize[];
  winners: Winner[];
  rejected: Winner[];
}
