import { GameState, GameAction, Bet } from './game';
import { generateCrashPoint, growMultiplier } from './game-logic';

const COUNTDOWN = 5;

export const mkBet = (id: 1 | 2): Bet => ({
  id, amount: 0, status: 'idle', cashedOutAt: null, profit: null,
});

export const initialState: GameState = {
  phase: 'waiting',
  multiplier: 1.0,
  crashPoint: 2.0,
  bets: [mkBet(1), mkBet(2)],
  balance: 1000.00,
  history: [],
  countdown: COUNTDOWN,
  nextRoundBets: [mkBet(1), mkBet(2)],
};

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'COUNTDOWN_TICK': {
      const n = state.countdown - 1;
      return { ...state, countdown: Math.max(0, n) };
    }

    case 'START_ROUND': {
      const crashPoint = generateCrashPoint();
      // Activate queued bets (balance already deducted when they were placed)
      const bets: [Bet, Bet] = [
        state.nextRoundBets[0].amount > 0
          ? { ...state.nextRoundBets[0], status: 'placed' }
          : mkBet(1),
        state.nextRoundBets[1].amount > 0
          ? { ...state.nextRoundBets[1], status: 'placed' }
          : mkBet(2),
      ];
      // Merge with any current-round placed bets (placed during waiting)
      const finalBets: [Bet, Bet] = [
        state.bets[0].status === 'placed' ? state.bets[0] : bets[0],
        state.bets[1].status === 'placed' ? state.bets[1] : bets[1],
      ];

      // No balance change here – all deductions happened at bet placement
      return {
        ...state,
        phase: 'flying',
        multiplier: 1.0,
        crashPoint,
        bets: finalBets,
        countdown: COUNTDOWN,
        nextRoundBets: [mkBet(1), mkBet(2)],
      };
    }

    case 'TICK': {
      if (state.phase !== 'flying') return state;
      const m = growMultiplier(state.multiplier, action.delta);
      if (m >= state.crashPoint) {
        const bets: [Bet, Bet] = state.bets.map(b =>
          b.status === 'placed' ? { ...b, status: 'lost' as const, profit: -b.amount } : b
        ) as [Bet, Bet];
        return {
          ...state,
          phase: 'crashed',
          multiplier: state.crashPoint,
          bets,
          history: [state.crashPoint, ...state.history].slice(0, 30),
        };
      }
      return { ...state, multiplier: m };
    }

    case 'PLACE_BET': {
      if (state.phase !== 'waiting') return state;
      const { betId, amount } = action;
      if (amount <= 0 || amount > state.balance) return state;
      const bets = [...state.bets] as [Bet, Bet];
      const prev = bets[betId - 1];
      const refund = prev.status === 'placed' ? prev.amount : 0;
      const cost = amount - refund;
      if (cost > state.balance) return state;
      bets[betId - 1] = { ...prev, amount, status: 'placed' };
      return { ...state, bets, balance: state.balance - cost };
    }

    case 'CANCEL_BET': {
      if (state.phase !== 'waiting') return state;
      const bets = [...state.bets] as [Bet, Bet];
      const b = bets[action.betId - 1];
      const refund = b.status === 'placed' ? b.amount : 0;
      bets[action.betId - 1] = mkBet(action.betId);
      return { ...state, bets, balance: state.balance + refund };
    }

    case 'CASH_OUT': {
      if (state.phase !== 'flying') return state;
      const b = state.bets[action.betId - 1];
      if (b.status !== 'placed') return state;
      const winnings = b.amount * state.multiplier;
      const bets = [...state.bets] as [Bet, Bet];
      bets[action.betId - 1] = {
        ...b, status: 'cashed_out',
        cashedOutAt: state.multiplier,
        profit: winnings - b.amount,
      };
      return { ...state, bets, balance: state.balance + winnings };
    }

    case 'PLACE_NEXT_BET': {
      const { betId, amount } = action;
      if (amount <= 0 || amount > state.balance) return state;
      const nextRoundBets = [...state.nextRoundBets] as [Bet, Bet];
      // Refund any previously queued amount on this slot, then deduct the new amount
      const prevAmount = nextRoundBets[betId - 1].amount;
      nextRoundBets[betId - 1] = { ...mkBet(betId), amount, status: 'placed' };
      return {
        ...state,
        nextRoundBets,
        balance: state.balance + prevAmount - amount,
      };
    }

    case 'CANCEL_NEXT_BET': {
      const bet = state.nextRoundBets[action.betId - 1];
      const refund = bet.amount;
      const nextRoundBets = [...state.nextRoundBets] as [Bet, Bet];
      nextRoundBets[action.betId - 1] = mkBet(action.betId);
      return { ...state, nextRoundBets, balance: state.balance + refund };
    }

    default: return state;
  }
}