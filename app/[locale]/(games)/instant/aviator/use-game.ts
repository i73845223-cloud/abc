'use client';
import { useReducer, useEffect, useRef, useCallback } from 'react';
import { reducer, initialState } from './reducer';

export function useGame() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const phaseRef = useRef(state.phase);
  const countdownRef2 = useRef(state.countdown);
  phaseRef.current = state.phase;
  countdownRef2.current = state.countdown;

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTsRef.current = null;

    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const delta = ts - lastTsRef.current;
      lastTsRef.current = ts;
      dispatch({ type: 'TICK', delta });
      if (phaseRef.current === 'flying') {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    let remaining = 5;
    dispatch({ type: 'COUNTDOWN_TICK' });

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        dispatch({ type: 'START_ROUND' });
        timerRef.current = setTimeout(() => startLoop(), 60);
      } else {
        dispatch({ type: 'COUNTDOWN_TICK' });
        timerRef.current = setTimeout(tick, 1000);
      }
    };
    timerRef.current = setTimeout(tick, 1000);
  }, [startLoop]);

  useEffect(() => {
    if (state.phase === 'crashed') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const t = setTimeout(() => {
        startCountdown();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [state.phase]);

  useEffect(() => {
    startCountdown();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const placeBet = useCallback((betId: 1 | 2, amount: number) => {
    if (phaseRef.current === 'waiting') {
      dispatch({ type: 'PLACE_BET', betId, amount });
    } else {
      dispatch({ type: 'PLACE_NEXT_BET', betId, amount });
    }
  }, []);

  const cancelBet = useCallback((betId: 1 | 2) => {
    if (phaseRef.current === 'waiting') {
      dispatch({ type: 'CANCEL_BET', betId });
    } else {
      dispatch({ type: 'CANCEL_NEXT_BET', betId });
    }
  }, []);

  const cashOut = useCallback((betId: 1 | 2) => {
    dispatch({ type: 'CASH_OUT', betId });
  }, []);

  return { state, placeBet, cancelBet, cashOut };
}