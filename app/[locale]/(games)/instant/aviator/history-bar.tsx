'use client';
import React from 'react';
import { histColor } from './game-logic';

interface HistoryBarProps {
  history: number[];
}

export function HistoryBar({ history }: HistoryBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="text-xs uppercase tracking-widest shrink-0"
        style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
      >
        History
      </span>
      <div className="flex gap-1.5 flex-wrap">
        {history.slice(0, 15).map((val, i) => {
          const color = histColor(val);
          return (
            <span
              key={i}
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${color}18`,
                color,
                border: `1px solid ${color}44`,
                fontFamily: 'monospace',
              }}
            >
              {val.toFixed(2)}x
            </span>
          );
        })}
      </div>
    </div>
  );
}