'use client';
import React from 'react';

interface PlaneProps {
  x: number;
  y: number;
  crashed: boolean;
  multiplier: number;
}

export function Plane({ x, y, crashed, multiplier }: PlaneProps) {
  const scale = crashed ? 0 : 1;
  const rotate = crashed ? 45 : -10;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{
        transition: crashed ? 'opacity 0.3s' : 'none',
        opacity: crashed ? 0 : 1,
      }}
    >
      {/* Glow effect */}
      <defs>
        <filter id="planeGlow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="exhaustGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        transform={`rotate(${rotate}) scale(${scale})`}
        filter="url(#planeGlow)"
        style={{ transformOrigin: 'center' }}
      >
        {/* Exhaust trail particles */}
        <g filter="url(#exhaustGlow)" opacity={0.8}>
          <ellipse cx={-45} cy={8} rx={12} ry={4} fill="#ff6b35" opacity={0.9} />
          <ellipse cx={-58} cy={10} rx={8} ry={3} fill="#ff9a3c" opacity={0.7} />
          <ellipse cx={-70} cy={12} rx={5} ry={2} fill="#ffcc02" opacity={0.5} />
          <ellipse cx={-80} cy={14} rx={3} ry={1.5} fill="#ffffff" opacity={0.3} />
        </g>

        {/* Main fuselage */}
        <path
          d="M40,0 C40,0 20,-8 -10,-6 C-30,-5 -45,0 -45,0 C-45,0 -30,5 -10,6 C20,8 40,0 40,0 Z"
          fill="url(#fuselageGrad)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.5"
        />

        {/* Nose */}
        <path d="M40,0 C40,0 52,-2 55,0 C52,2 40,0 40,0 Z" fill="#e0e8ff" />

        {/* Main wing */}
        <path
          d="M5,-6 C5,-6 15,-20 25,-22 C20,-10 18,-6 18,-6 Z"
          fill="url(#wingGrad)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
        />
        <path
          d="M5,6 C5,6 15,20 25,22 C20,10 18,6 18,6 Z"
          fill="url(#wingGrad)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
        />

        {/* Tail fin */}
        <path d="M-35,-6 C-35,-6 -42,-15 -38,-16 C-32,-12 -30,-6 -30,-6 Z" fill="url(#wingGrad)" />
        <path d="M-35,6 C-35,6 -42,12 -38,13 C-32,10 -30,6 -30,6 Z" fill="url(#wingGrad)" opacity={0.7} />

        {/* Cockpit window */}
        <ellipse cx={28} cy={-1} rx={6} ry={3} fill="url(#windowGrad)" opacity={0.9} />

        {/* Engine */}
        <rect x={0} y={-4} width={8} height={8} rx={3} fill="#8899bb" />
        <rect x={-4} y={-2} width={5} height={4} rx={2} fill="#aabbdd" />

        {/* Gradient defs */}
        <defs>
          <linearGradient id="fuselageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c8d8ff" />
            <stop offset="50%" stopColor="#e8eeff" />
            <stop offset="100%" stopColor="#f8faff" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8899cc" />
            <stop offset="100%" stopColor="#aabbdd" />
          </linearGradient>
          <radialGradient id="windowGrad">
            <stop offset="0%" stopColor="#60efff" />
            <stop offset="100%" stopColor="#0080ff" />
          </radialGradient>
        </defs>
      </g>
    </g>
  );
}