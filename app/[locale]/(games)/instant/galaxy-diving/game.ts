export type GamePhase = 'waiting' | 'flying' | 'crashed';
export type BetStatus = 'idle' | 'placed' | 'cashed_out' | 'lost';

export interface Bet {
  id: 1 | 2;
  amount: number;
  status: BetStatus;
  cashedOutAt: number | null;
  profit: number | null;
  betTransactionId: string | null;
}

export interface GameState {
  phase: GamePhase;
  multiplier: number;
  crashPoint: number;
  bets: [Bet, Bet];
  balance: number;
  history: number[];
  countdown: number;
  nextRoundBets: [Bet, Bet];
}

export type GameAction =
  | { type: 'TICK'; delta: number }
  | { type: 'START_ROUND' }
  | { type: 'COUNTDOWN_TICK' }
  | { type: 'PLACE_BET'; betId: 1 | 2; amount: number }
  | { type: 'CANCEL_BET'; betId: 1 | 2 }
  | { type: 'CASH_OUT'; betId: 1 | 2 }
  | { type: 'PLACE_NEXT_BET'; betId: 1 | 2; amount: number }
  | { type: 'CANCEL_NEXT_BET'; betId: 1 | 2 }
  | { type: 'SET_BALANCE'; amount: number }
  | { type: 'BET_TRANSACTION_READY'; betId: 1 | 2; transactionId: string }
  | { type: 'BET_TRANSACTION_CLEAR'; betId: 1 | 2 };