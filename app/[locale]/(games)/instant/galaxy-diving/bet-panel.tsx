'use client';
import React, { useState } from 'react';
import { Bet, GamePhase } from './game';
import { fmtMult } from './game-logic';
import { formatter } from '@/lib/utils';

interface Props {
  bet: Bet;
  nextBet: Bet;
  phase: GamePhase;
  balance: number;
  label: string;
  multiplier: number;
  onPlaceBet: (amount: number) => void;
  onCancelBet: () => void;
  onCashOut: () => void;
}

export function BetPanel({
  bet, nextBet, phase, balance, label, multiplier,
  onPlaceBet, onCancelBet, onCashOut,
}: Props) {
  const [amount, setAmount] = useState(10);
  const [raw, setRaw]       = useState('10');
  const [submitting, setSubmitting] = useState(false);

  const guard = (fn: () => void | Promise<void>) => async () => {
    if (submitting) return;
    setSubmitting(true);
    try { await fn(); } finally { setSubmitting(false); }
  };

  const isWaiting  = phase === 'waiting';
  const isFlying   = phase === 'flying';
  const isCrashed  = phase === 'crashed';
  const betPlaced  = bet.status === 'placed';
  const cashedOut  = bet.status === 'cashed_out';
  const lost       = bet.status === 'lost';
  const nextQueued = nextBet.status === 'placed';

  const inputLocked = (isWaiting && betPlaced) || ((isFlying || isCrashed) && nextQueued) || submitting;

  const safeAmount = Math.max(1, Math.min(amount, balance, 10000));
  const potential  = betPlaced ? bet.amount * multiplier : 0;

  const formatRupee = (v: number) => '$' + v.toFixed(2);

  function commit(v: number) {
    const clamped = Math.max(1, Math.min(v, balance, 10000));
    setAmount(clamped);
    setRaw(clamped.toFixed(2));
  }

  function handleRawChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(e.target.value);
    const n = parseFloat(e.target.value);
    if (!isNaN(n) && n > 0) setAmount(n);
  }

  function handleRawBlur() {
    commit(parseFloat(raw) || 100);
  }

  let border = 'rgba(255,255,255,0.09)';
  let glow   = 'none';
  if (isFlying && betPlaced) { border = '#ff9500cc'; glow = '0 0 20px rgba(255,149,0,0.18)'; }
  if (cashedOut) { border = '#00e87acc'; glow = '0 0 16px rgba(0,232,122,0.14)'; }
  if (lost)      { border = '#ff4d6d88'; glow = '0 0 14px rgba(255,77,109,0.1)'; }

  const S = {
    panel: {
      display: 'flex', flexDirection: 'column' as const, gap: 10,
      background: 'linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018))',
      border: `1.5px solid ${border}`,
      boxShadow: glow,
      borderRadius: 16, padding: 14,
      transition: 'border-color .3s, box-shadow .3s',
      backdropFilter: 'blur(6px)',
    },
    label: {
      fontSize: 10, fontFamily: 'monospace', letterSpacing: 3,
      textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)',
    },
    inputRow: {
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(0,0,0,0.4)', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.08)', padding: '8px 10px',
    },
    input: {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      color: 'white', fontFamily: "'Orbitron',monospace", fontWeight: 700,
      fontSize: 18, minWidth: 0, opacity: inputLocked ? 0.4 : 1,
      cursor: inputLocked ? 'not-allowed' : 'text',
    },
    microBtn: {
      fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
      padding: '3px 7px', borderRadius: 7,
      background: 'rgba(255,255,255,0.07)',
      color: inputLocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
      border: '1px solid rgba(255,255,255,0.06)',
      cursor: inputLocked ? 'not-allowed' : 'pointer',
    },
    presets: {
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5,
    },
    presetBtn: (active: boolean) => ({
      padding: '5px 2px', borderRadius: 8, fontSize: 11, fontWeight: 700,
      fontFamily: 'monospace', cursor: inputLocked ? 'not-allowed' : 'pointer',
      background: active ? 'rgba(96,239,255,0.15)' : 'rgba(255,255,255,0.05)',
      color: active ? '#60efff' : 'rgba(255,255,255,0.4)',
      border: active ? '1px solid rgba(96,239,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
    }),
    badge: (bg: string, color: string, border: string) => ({
      fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`,
    }),
  } as const;

  const PRESETS = [10, 50, 100, 500];

  return (
    <div style={S.panel}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={S.label}>{label}</span>
        {cashedOut && bet.profit !== null && (
          <span style={S.badge('rgba(0,232,122,0.12)', '#00e87a', 'rgba(0,232,122,0.3)')}>
            +{formatRupee(bet.profit)} @ {fmtMult(bet.cashedOutAt!)}
          </span>
        )}
        {lost && (
          <span style={S.badge('rgba(255,77,109,0.12)', '#ff4d6d', 'rgba(255,77,109,0.3)')}>
            -{formatRupee(bet.amount)}
          </span>
        )}
      </div>

      <div style={S.inputRow}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 15 }}>$</span>
        <input
          type="number" min="1" max="1000" step="100"
          value={raw}
          onChange={handleRawChange}
          onBlur={handleRawBlur}
          disabled={inputLocked}
          style={S.input}
        />
        <button disabled={inputLocked} style={S.microBtn}
          onClick={() => !inputLocked && commit(safeAmount / 2)}>½</button>
        <button disabled={inputLocked} style={S.microBtn}
          onClick={() => !inputLocked && commit(safeAmount * 2)}>2×</button>
      </div>

      <div style={S.presets}>
        {PRESETS.map(v => (
          <button key={v} disabled={inputLocked}
            style={S.presetBtn(safeAmount === v)}
            onClick={() => !inputLocked && commit(v)}>
            {formatter.format(v)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
        {isWaiting && !betPlaced && (
          <button
            onClick={guard(() => onPlaceBet(safeAmount))}
            disabled={submitting || safeAmount <= 0 || safeAmount > balance}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 12,
              fontFamily: "'Orbitron',monospace", fontWeight: 900,
              fontSize: 13, letterSpacing: 2, textTransform: 'uppercase',
              background: safeAmount > 0 && safeAmount <= balance
                ? 'linear-gradient(135deg,#00e87a,#00b85e)'
                : 'rgba(255,255,255,0.04)',
              color: safeAmount > 0 && safeAmount <= balance ? '#001a10' : 'rgba(255,255,255,0.15)',
              boxShadow: safeAmount > 0 && safeAmount <= balance ? '0 4px 18px rgba(0,232,122,0.35)' : 'none',
              cursor: safeAmount > 0 && safeAmount <= balance && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all .2s',
            }}
          >
            Place Bet  {safeAmount > 0 ? formatter.format(safeAmount) : ''}
          </button>
        )}

        {isWaiting && betPlaced && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, padding: '13px 0', borderRadius: 12, textAlign: 'center',
              fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 12,
              background: 'rgba(0,232,122,0.1)', color: '#00e87a',
              border: '1px solid rgba(0,232,122,0.3)',
            }}>
              {formatter.format(bet.amount)} BET ✓
            </div>
            <button onClick={guard(onCancelBet)} disabled={submitting} style={{
              padding: '13px 16px', borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
              background: 'rgba(255,77,109,0.1)', color: '#ff4d6d',
              border: '1px solid rgba(255,77,109,0.3)',
              fontFamily: 'monospace', fontWeight: 700, fontSize: 16,
            }}>✕</button>
          </div>
        )}

        {isFlying && betPlaced && (
          <button onClick={guard(onCashOut)} disabled={submitting} style={{
            width: '100%', padding: '0 0 2px', borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: "'Orbitron',monospace", fontWeight: 900,
            background: 'linear-gradient(135deg,#ff9500,#ff6200)',
            color: 'white', border: 'none',
            boxShadow: '0 4px 24px rgba(255,149,0,0.5)',
            animation: 'av-cashout-pulse 1.1s ease-in-out infinite',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, paddingTop: 10, opacity: 0.85 }}>CASH OUT</div>
            <div style={{ fontSize: 22, paddingBottom: 8 }}>{formatter.format(potential)}</div>
          </button>
        )}

        {isFlying && !betPlaced && !cashedOut && (
          <div style={{
            padding: '11px 0', borderRadius: 12, textAlign: 'center',
            fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)',
          }}>No bet this round</div>
        )}

        {isFlying && cashedOut && (
          <div style={{
            padding: '11px 0', borderRadius: 12, textAlign: 'center',
            fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 12,
            background: 'rgba(0,232,122,0.08)', color: '#00e87a',
            border: '1px solid rgba(0,232,122,0.22)',
          }}>Cashed @ {formatter.format(bet.cashedOutAt!)}</div>
        )}

        {isCrashed && (lost || cashedOut) && (
          <div style={{
            padding: '11px 0', borderRadius: 12, textAlign: 'center',
            fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 12,
            background: lost ? 'rgba(255,77,109,0.08)' : 'rgba(0,232,122,0.08)',
            color: lost ? '#ff4d6d' : '#00e87a',
            border: `1px solid ${lost ? 'rgba(255,77,109,0.25)' : 'rgba(0,232,122,0.25)'}`,
          }}>
            {lost ? `Lost ${formatter.format(bet.amount)}` : `Won +${formatter.format(bet.profit!)}`}
          </div>
        )}

        {(isFlying || isCrashed) && (
          <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{
              fontSize: 9, fontFamily: 'monospace', letterSpacing: 3,
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 7,
            }}>Next Round</div>

            {!nextQueued ? (
              <button
                onClick={guard(() => onPlaceBet(safeAmount))}
                disabled={submitting || safeAmount <= 0 || safeAmount > balance}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: "'Orbitron',monospace", fontWeight: 700,
                  fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                  background: safeAmount > 0 && safeAmount <= balance ? 'rgba(96,239,255,0.1)' : 'rgba(255,255,255,0.03)',
                  color: safeAmount > 0 && safeAmount <= balance ? '#60efff' : 'rgba(255,255,255,0.15)',
                  border: `1px solid ${safeAmount > 0 && safeAmount <= balance ? 'rgba(96,239,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                Queue {formatter.format(safeAmount)}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, textAlign: 'center',
                  fontFamily: 'monospace', fontWeight: 700, fontSize: 11,
                  background: 'rgba(96,239,255,0.08)', color: '#60efff',
                  border: '1px solid rgba(96,239,255,0.25)',
                }}>
                  {formatter.format(nextBet.amount)} Queued ✓
                </div>
                <button onClick={guard(onCancelBet)} disabled={submitting} style={{
                  padding: '10px 12px', borderRadius: 10, cursor: submitting ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,77,109,0.08)', color: '#ff4d6d',
                  border: '1px solid rgba(255,77,109,0.2)',
                  fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
                }}>✕</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}