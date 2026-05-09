'use client';
import React from 'react';
import { useRealAviator } from '@/hooks/use-real-aviator';
import { FlightGraph } from '@/app/[locale]/(games)/instant/aviator/flight-graph';
import { BetPanel } from '@/app/[locale]/(games)/instant/aviator/bet-panel';
import { HistoryBar } from '@/app/[locale]/(games)/instant/aviator/history-bar';
import { fmtMoney } from '@/app/[locale]/(games)/instant/aviator/game-logic';

export default function RealAviatorPage() {
  const { state, placeBet, cancelBet, cashOut } = useRealAviator();
  const { phase, multiplier, bets, nextRoundBets, balance, history, countdown } = state;

  const dotColor =
    phase === 'flying'  ? '#00e87a' :
    phase === 'crashed' ? '#ff4d6d' : '#60efff';

  const phaseText =
    phase === 'flying'  ? 'In Flight' :
    phase === 'crashed' ? 'Crashed'   :
    `Starting in ${countdown}s`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .av input[type=number] { -moz-appearance: textfield; }
        .av input[type=number]::-webkit-inner-spin-button,
        .av input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @keyframes av-cashout-pulse {
          0%,100% { box-shadow: 0 4px 20px rgba(255,149,0,0.45); transform: scale(1); }
          50%     { box-shadow: 0 6px 32px rgba(255,149,0,0.75); transform: scale(1.018); }
        }
        @keyframes av-shake {
          0%,100% { transform: translateX(0) rotate(0); }
          20%     { transform: translateX(-7px) rotate(-1.5deg); }
          50%     { transform: translateX(7px) rotate(1.5deg); }
          80%     { transform: translateX(-4px); }
        }
        .av {
          width: 100%; height: 100dvh;
          background: #090d1a;
          font-family: 'JetBrains Mono', monospace;
          color: #fff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .av-header {
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(0,0,0,0.35);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .av-history {
          flex-shrink: 0;
          padding: 6px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          background: rgba(0,0,0,0.18);
        }
        .av-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .av-graph {
          flex-shrink: 0;
          height: 42vw;
          min-height: 180px;
          max-height: 340px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .av-panels {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px;
          background: rgba(0,0,0,0.22);
        }
        @media (min-width: 680px) {
          .av-panels { flex-direction: row; }
          .av-panels > * { flex: 1; }
        }
        @media (min-width: 900px) {
          .av-body { flex-direction: row; }
          .av-graph {
            flex: 1;
            height: auto;
            max-height: none;
            border-bottom: none;
            border-right: 1px solid rgba(255,255,255,0.05);
          }
          .av-panels {
            flex-direction: column;
            flex: 0 0 320px;
            width: 320px;
            padding: 12px;
            overflow-y: auto;
          }
        }
        @media (min-width: 1100px) {
          .av-panels { flex: 0 0 360px; width: 360px; }
        }
      `}</style>

      <div className="av">
        <header className="av-header">
          <div style={{
            fontFamily: "'Orbitron',monospace", fontWeight: 900,
            fontSize: 'clamp(13px,3.5vw,20px)', letterSpacing: 2,
            background: 'linear-gradient(90deg,#60efff,#ff3cac)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>✈ AVIATOR</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: dotColor, boxShadow: `0 0 7px ${dotColor}`,
              }}/>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: 2, textTransform: 'uppercase' }}>
                {phaseText}
              </span>
            </div>
            <div style={{
              fontFamily: "'Orbitron',monospace", fontWeight: 700,
              fontSize: 'clamp(11px,2.8vw,15px)',
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(0,232,122,0.1)', color: '#00e87a',
              border: '1px solid rgba(0,232,122,0.25)',
            }}>{fmtMoney(balance)}</div>
          </div>
        </header>

        {history.length > 0 && (
          <div className="av-history">
            <HistoryBar history={history} />
          </div>
        )}

        <div className="av-body">
          <div className="av-graph">
            <FlightGraph phase={phase} multiplier={multiplier} countdown={countdown} />
          </div>
          <div className="av-panels">
            <BetPanel
              bet={bets[0]} nextBet={nextRoundBets[0]}
              phase={phase} balance={balance} label="Bet Slot 1"
              multiplier={multiplier}
              onPlaceBet={a => placeBet(1, a)}
              onCancelBet={() => cancelBet(1)}
              onCashOut={() => cashOut(1)}
            />
            <BetPanel
              bet={bets[1]} nextBet={nextRoundBets[1]}
              phase={phase} balance={balance} label="Bet Slot 2"
              multiplier={multiplier}
              onPlaceBet={a => placeBet(2, a)}
              onCancelBet={() => cancelBet(2)}
              onCashOut={() => cashOut(2)}
            />
          </div>
        </div>
      </div>
    </>
  );
}