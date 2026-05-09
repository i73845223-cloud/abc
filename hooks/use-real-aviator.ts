'use client';
import { useReducer, useEffect, useRef, useCallback } from 'react';
import { reducer, initialState } from '@/app/[locale]/(games)/instant/aviator/reducer';
import { useBalance } from '@/actions/use-balance';
import { GameState } from '@/app/[locale]/(games)/instant/aviator/game';

export function useRealAviator() {
  const { balance, getBalance, updateUserBalance } = useBalance();
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    balance: 0,          // will be updated
  });

  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep balance in sync
  useEffect(() => {
    if (balance !== undefined) {
      dispatch({ type: 'SET_BALANCE', amount: balance });
    }
  }, [balance]);

  // ─── Game loop ──────────────────────────────────────────────
  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTsRef.current = null;
    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const delta = ts - lastTsRef.current;
      lastTsRef.current = ts;
      dispatch({ type: 'TICK', delta });
      if (phaseRef.current === 'flying') rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ─── Countdown → START_ROUND ────────────────────────────────
  const startCountdown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    let remaining = 5;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        dispatch({ type: 'START_ROUND' });
        // Small buffer so state settles
        timerRef.current = setTimeout(() => startLoop(), 60);
      } else {
        dispatch({ type: 'COUNTDOWN_TICK' });
        timerRef.current = setTimeout(tick, 1000);
      }
    };
    timerRef.current = setTimeout(tick, 1000);
  }, [startLoop]);

  // ─── Crash → next round ────────────────────────────────────
  useEffect(() => {
    if (state.phase === 'crashed') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const t = setTimeout(() => startCountdown(), 3000);
      return () => clearTimeout(t);
    }
  }, [state.phase, startCountdown]);

  // ─── Boot ──────────────────────────────────────────────────
  useEffect(() => {
    // Fetch balance, then start the game
    getBalance().then(() => startCountdown());
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ─── Actions ───────────────────────────────────────────────
  const placeBet = useCallback(async (betId: 1 | 2, amount: number) => {
    if (amount <= 0 || amount > state.balance) return;
    try {
      const res = await fetch('/api/aviator/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error('Bet failed');
      const data = await res.json();

      if (phaseRef.current === 'waiting') {
        dispatch({ type: 'PLACE_BET', betId, amount });
        dispatch({ type: 'BET_TRANSACTION_READY', betId, transactionId: data.transactionId });
      } else {
        dispatch({ type: 'PLACE_NEXT_BET', betId, amount });
        dispatch({ type: 'BET_TRANSACTION_READY', betId, transactionId: data.transactionId });
      }
      // Local balance already deducted by reducer
    } catch (error) {
      console.error('Bet error:', error);
    }
  }, [state.balance, state.bets, state.nextRoundBets]);

  const cancelBet = useCallback(async (betId: 1 | 2) => {
    const bet = phaseRef.current === 'waiting'
      ? state.bets[betId - 1]
      : state.nextRoundBets[betId - 1];
    if (bet.status !== 'placed' || !bet.betTransactionId) return;

    try {
      await fetch('/api/aviator/bet/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: bet.betTransactionId }),
      });
      if (phaseRef.current === 'waiting') {
        dispatch({ type: 'CANCEL_BET', betId });
      } else {
        dispatch({ type: 'CANCEL_NEXT_BET', betId });
      }
      // Balance refunded by reducer
    } catch (error) {
      console.error('Cancel error:', error);
    }
  }, [state.bets, state.nextRoundBets]);

  const cashOut = useCallback(async (betId: 1 | 2) => {
    const bet = state.bets[betId - 1];
    if (bet.status !== 'placed' || !bet.betTransactionId) return;

    const totalWinnings = bet.amount * state.multiplier;
    try {
      const res = await fetch('/api/aviator/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalWinnings, multiplier: state.multiplier, transactionId: bet.betTransactionId }),
      });
      if (!res.ok) throw new Error('Cashout failed');
      const data = await res.json();
      dispatch({ type: 'SET_BALANCE', amount: data.newBalance });
      dispatch({ type: 'CASH_OUT', betId });
    } catch (error) {
      console.error('Cashout error:', error);
    }
  }, [state.bets, state.multiplier]);

  return { state, placeBet, cancelBet, cashOut };
}