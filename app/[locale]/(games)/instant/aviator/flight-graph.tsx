'use client';
import React, { useRef, useEffect } from 'react';
import { GamePhase } from './game';
import { multColor } from './game-logic';

interface Props {
  phase: GamePhase;
  multiplier: number;
  countdown: number;
}

type Pt = { t: number; m: number };

// Explicit shape of the ref – never undefined because we always initialise it
type State = {
  phase: GamePhase;
  multiplier: number;
  countdown: number;
  points: Pt[];
  startMs: number;
  tick: number;
  crashStartMs: number | null;
  crashParticles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
  }[];
  stars: { x: number; y: number; r: number; speed: number; phase: number }[];
  clouds: { x: number; y: number; w: number; speed: number; alpha: number }[];
  propAngle: number;
};

export function FlightGraph({ phase, multiplier, countdown }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);

  const sr = useRef<State>({
    phase,
    multiplier,
    countdown,
    points: [],
    startMs: 0,
    tick: 0,
    crashStartMs: null,
    crashParticles: [],
    stars: Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      speed: 0.00003 + Math.random() * 0.00008,
      phase: Math.random() * Math.PI * 2,
    })),
    clouds: Array.from({ length: 5 }, () => ({
      x: Math.random(),
      y: 0.15 + Math.random() * 0.5,
      w: 0.08 + Math.random() * 0.1,
      speed: 0.00005 + Math.random() * 0.00012,
      alpha: 0.04 + Math.random() * 0.06,
    })),
    propAngle: 0,
  });

  // Sync props → ref every render
  sr.current.phase      = phase;
  sr.current.multiplier = multiplier;
  sr.current.countdown  = countdown;

  // Track phase transitions
  const prevPhaseRef = useRef<GamePhase>('waiting');
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (prev !== 'flying' && phase === 'flying') {
      sr.current.points  = [{ t: 0, m: 1.0 }];
      sr.current.startMs = performance.now();
      sr.current.crashStartMs = null;
      sr.current.crashParticles = [];
    }
    if (phase === 'crashed' && sr.current.crashStartMs === null) {
      sr.current.crashStartMs = performance.now();
      const particles: State['crashParticles'] = [];
      const planeX = 0.6;
      const planeY = 0.3;
      const colors = ['#ff4d6d', '#ff9500', '#ffcc00', '#ffffff', '#ff7700', '#ff3300'];
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.005 + Math.random() * 0.04;
        particles.push({
          x: planeX + (Math.random() - 0.5) * 0.1,
          y: planeY + (Math.random() - 0.5) * 0.1,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.01,
          life: 1,
          maxLife: 0.5 + Math.random() * 1.2,
          size: 1.5 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      sr.current.crashParticles = particles;
    }
  }, [phase]);

  // Append point when multiplier changes
  useEffect(() => {
    if (phase === 'flying') {
      const t = (performance.now() - sr.current.startMs) / 1000;
      sr.current.points.push({ t, m: multiplier });
      if (sr.current.points.length > 800) sr.current.points.splice(0, 200);
    }
  }, [multiplier, phase]);

  // One permanent RAF loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap   = wrapRef.current!;
    let dpr = window.devicePixelRatio || 1;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width  = wrap.clientWidth  * dpr;
      canvas.height = wrap.clientHeight * dpr;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let last = 0;
    function loop(ts: number) {
      const dt = last ? ts - last : 16;
      last = ts;
      sr.current.tick      += dt;
      sr.current.propAngle  = (sr.current.propAngle + dt * 0.022) % (Math.PI * 2);

      // Scroll stars & clouds when flying
      if (sr.current.phase === 'flying') {
        for (const s of sr.current.stars) {
          s.x -= s.speed * dt;
          if (s.x < -0.01) s.x += 1.02;
        }
        for (const c of sr.current.clouds) {
          c.x -= c.speed * dt;
          if (c.x < -c.w - 0.05) c.x += 1.1 + c.w;
        }
      }

      // Update crash particles
      if (sr.current.crashParticles.length > 0) {
        const now = performance.now();
        const elapsed = sr.current.crashStartMs
          ? (now - sr.current.crashStartMs) / 1000
          : 0;
        sr.current.crashParticles.forEach((p) => {
          p.life = Math.max(0, 1 - elapsed / p.maxLife);
          p.x += p.vx * dt * 0.06;
          p.y += p.vy * dt * 0.06;
          p.vy += 0.0002 * dt;
        });
        if (elapsed > 2.5) {
          sr.current.crashParticles = [];
        }
      }

      const W = canvas.width  / dpr;
      const H = canvas.height / dpr;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      ctx.scale(dpr, dpr);
      drawFrame(ctx, W, H, sr.current);
      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <Overlay phase={phase} multiplier={multiplier} countdown={countdown} />
    </div>
  );
}

// ── HTML overlay ───────────────────────────────────────────────
function Overlay({ phase, multiplier, countdown }: Props) {
  const color = multColor(multiplier);
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {phase === 'waiting' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Orbitron',monospace", fontWeight: 900,
            fontSize: 'clamp(3.5rem,15vw,8rem)',
            color: '#60efff',
            textShadow: '0 0 30px #60efff99,0 0 70px #60efff33',
            lineHeight: 1,
          }}>{countdown}</div>
          <div style={{
            color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(10px,2.5vw,13px)',
            letterSpacing: 5, fontFamily: 'monospace', textTransform: 'uppercase', marginTop: 8,
          }}>Next Round</div>
        </div>
      )}
      {phase === 'flying' && (
        <div style={{
          fontFamily: "'Orbitron',monospace", fontWeight: 900,
          fontSize: 'clamp(4rem,15vw,9rem)',
          color, lineHeight: 1, letterSpacing: '-0.02em',
          textShadow: `0 0 40px ${color}cc,0 0 80px ${color}44`,
          transition: 'color 0.5s',
        }}>
          {multiplier.toFixed(2)}x
        </div>
      )}
      {phase === 'crashed' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Orbitron',monospace", fontWeight: 900,
            fontSize: 'clamp(2rem,8vw,4.5rem)',
            color: '#ff4d6d', lineHeight: 1,
            textShadow: '0 0 40px #ff4d6dcc,0 0 80px #ff4d6d44',
            animation: 'av-shake 0.5s ease',
          }}>FLEW AWAY!</div>
          <div style={{
            fontFamily: "'Orbitron',monospace", fontWeight: 700,
            fontSize: 'clamp(1.6rem,6vw,3.2rem)',
            color: '#ff4d6d', opacity: 0.8, marginTop: 6,
          }}>{multiplier.toFixed(2)}x</div>
        </div>
      )}
    </div>
  );
}

// ── Canvas draw ────────────────────────────────────────────────
function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, s: State) {
  ctx.clearRect(0, 0, W, H);

  // Sky gradient
  const m = s.multiplier;
  const skyR = Math.round(8  + Math.min(m * 4, 40));
  const skyG = Math.round(12 + Math.min(m * 2, 20));
  const skyB = Math.round(30 + Math.min(m * 3, 40));
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, `rgb(${skyR},${skyG},${skyB + 20})`);
  bg.addColorStop(1, `rgb(${Math.max(4,skyR-6)},${Math.max(6,skyG-8)},${Math.max(14,skyB-12)})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (const star of s.stars) {
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(s.tick * 0.001 + star.phase));
    ctx.beginPath();
    ctx.arc(star.x * W, star.y * H * 0.75, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${(0.1 + twinkle * 0.35).toFixed(2)})`;
    ctx.fill();
  }

  // Clouds
  for (const cloud of s.clouds) {
    const cx = cloud.x * W;
    const cy = cloud.y * H;
    const cw = cloud.w * W;
    ctx.save();
    ctx.globalAlpha = cloud.alpha;
    ctx.fillStyle   = '#ffffff';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(cx + (i - 1) * cw * 0.5, cy + (i === 1 ? -cw * 0.2 : 0), cw * (i === 1 ? 0.65 : 0.45), cw * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Graph area
  const PAD_L = Math.max(36, W * 0.055);
  const PAD_B = Math.max(28, H * 0.09);
  const PAD_R = 20;
  const PAD_T = 16;
  const gW = W - PAD_L - PAD_R;
  const gH = H - PAD_T - PAD_B;

  const pts = s.points;

  if (pts.length >= 2) {
    const lastPt = pts[pts.length - 1];

    const maxT = Math.max(lastPt.t * 1.15, 8);
    const maxM = Math.max(lastPt.m * 1.20, 2);

    const toX = (t: number) => PAD_L + (t / maxT) * gW;
    const toY = (m: number) => {
      const logV = Math.log(Math.max(m, 1.0));
      const logM = Math.log(Math.max(maxM, 1.01));
      return PAD_T + gH - (logV / logM) * gH;
    };

    drawGrid(ctx, PAD_L, PAD_T, gW, gH, maxM, W, H);

    const color = multColor(s.multiplier);

    // Fill
    ctx.beginPath();
    ctx.moveTo(toX(pts[0].t), toY(pts[0].m));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(toX(pts[i].t), toY(pts[i].m));
    ctx.lineTo(toX(lastPt.t), PAD_T + gH);
    ctx.lineTo(PAD_L, PAD_T + gH);
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + gH);
    fill.addColorStop(0,   color + '50');
    fill.addColorStop(0.5, color + '20');
    fill.addColorStop(1,   color + '06');
    ctx.fillStyle = fill;
    ctx.fill();

    // Glow line
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur  = 14;
    ctx.beginPath();
    ctx.moveTo(toX(pts[0].t), toY(pts[0].m));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(toX(pts[i].t), toY(pts[i].m));
    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.restore();

    // Plane (alive)
    if (s.phase === 'flying' && s.crashStartMs === null) {
      const px = toX(lastPt.t);
      const py = toY(lastPt.m);
      let angle = -12;
      if (pts.length >= 5) {
        const a = pts[pts.length - 5];
        const dx = toX(lastPt.t) - toX(a.t);
        const dy = toY(lastPt.m) - toY(a.m);
        angle = Math.atan2(dy, dx) * 180 / Math.PI;
        angle = Math.max(-42, Math.min(-4, angle));
      }
      const ps = Math.max(0.5, Math.min(1.0, W / 650));
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle * Math.PI / 180);
      drawPlane(ctx, color, ps, s.propAngle, s.tick);
      ctx.restore();
    }
  } else if (pts.length > 0) {
    drawGrid(ctx, PAD_L, PAD_T, gW, gH, 3, W, H);
  }

  // CRASH ANIMATION
  if (s.phase === 'crashed' && s.crashStartMs !== null) {
    const elapsed = (performance.now() - s.crashStartMs) / 1000;
    const crashDuration = 2.5;

    if (elapsed < crashDuration) {
      const progress = elapsed / crashDuration;
      const fallY = Math.min(1, progress * 2);
      const tumble = progress * 8 * Math.PI;
      const scale = 1 - progress * 0.6;

      let crashX = PAD_L + gW * 0.7;
      let crashY = PAD_T + gH * 0.3;
      if (s.points.length > 0) {
        const last = s.points[s.points.length - 1];
        const maxT = Math.max(last.t * 1.15, 8);
        const maxM = Math.max(last.m * 1.20, 2);
        const toX = (t: number) => PAD_L + (t / maxT) * gW;
        const toY = (m: number) => {
          const logV = Math.log(Math.max(m, 1.0));
          const logM = Math.log(Math.max(maxM, 1.01));
          return PAD_T + gH - (logV / logM) * gH;
        };
        crashX = toX(last.t);
        crashY = toY(last.m);
      }

      const px = crashX + progress * 40;
      const py = crashY + fallY * H * 0.6;
      const angle = -30 + tumble;
      const ps = Math.max(0.5, Math.min(1.0, W / 650)) * scale;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.globalAlpha = 1 - progress * 0.8;
      drawPlane(ctx, '#ff4d6d', ps, s.propAngle + tumble, s.tick);
      ctx.restore();

      // Explosion particles
      for (const p of s.crashParticles) {
        if (p.life <= 0) continue;
        const alpha = p.life;
        const pxAbs = crashX + (p.x - 0.6) * W + p.vx * progress * 800;
        const pyAbs = crashY + (p.y - 0.3) * H + p.vy * progress * 800;
        ctx.beginPath();
        ctx.arc(pxAbs, pyAbs, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
    }
  }
}

// ── Helper functions ───────────────────────────────────────────
function drawGrid(
  ctx: CanvasRenderingContext2D,
  pL: number, pT: number, gW: number, gH: number,
  maxM: number, W: number, H: number,
) {
  const ticks = [1, 1.5, 2, 3, 5, 10, 20, 50, 100];
  const fs = Math.max(9, Math.min(11, W / 55));
  ctx.font      = `${fs}px monospace`;
  ctx.textAlign = 'right';

  for (const tick of ticks) {
    if (tick > maxM * 1.05) break;
    const logM = Math.log(Math.max(maxM, 1.01));
    const y    = pT + gH - (Math.log(tick) / logM) * gH;
    if (y < pT - 2 || y > pT + gH + 2) continue;

    ctx.beginPath();
    ctx.moveTo(pL, y); ctx.lineTo(pL + gW, y);
    ctx.setLineDash([3, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(tick + 'x', pL - 5, y + 4);
  }

  ctx.beginPath();
  ctx.moveTo(pL, pT + gH); ctx.lineTo(pL + gW, pT + gH);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1;
  ctx.stroke();
}

function drawPlane(
  ctx: CanvasRenderingContext2D,
  accent: string,
  scale: number,
  propAngle: number,
  tick: number,
) {
  ctx.save();
  ctx.scale(scale, scale);

  // Engine flame
  const flicker = 0.8 + Math.sin(tick * 0.018) * 0.2;
  ctx.save();
  ctx.globalAlpha = flicker;
  const f1 = ctx.createRadialGradient(-50, 2, 0, -50, 2, 26 * flicker);
  f1.addColorStop(0,    'rgba(255,255,200,1)');
  f1.addColorStop(0.1,  'rgba(255,180,40,0.9)');
  f1.addColorStop(0.45, 'rgba(255,60,0,0.55)');
  f1.addColorStop(1,    'rgba(255,60,0,0)');
  ctx.fillStyle = f1;
  ctx.beginPath();
  ctx.ellipse(-56, 2, 26 * flicker, 9 * flicker, 0.08, 0, Math.PI * 2);
  ctx.fill();

  const f2 = ctx.createRadialGradient(-74, 3, 0, -74, 3, 14);
  f2.addColorStop(0, 'rgba(255,160,0,0.45)');
  f2.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = f2;
  ctx.beginPath();
  ctx.ellipse(-78, 4, 16, 6, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Drop shadow
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(4, 9, 40, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Upper wing
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.bezierCurveTo(14, -13, 26, -29, 34, -31);
  ctx.bezierCurveTo(28, -20, 20, -10, 17, -5);
  ctx.closePath();
  const wg = ctx.createLinearGradient(8, -5, 34, -31);
  wg.addColorStop(0, '#aabbd4'); wg.addColorStop(1, '#556688');
  ctx.fillStyle = wg; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.6; ctx.stroke();

  // Lower wing
  ctx.beginPath();
  ctx.moveTo(8, 5);
  ctx.bezierCurveTo(14, 13, 26, 29, 34, 31);
  ctx.bezierCurveTo(28, 20, 20, 10, 17, 5);
  ctx.closePath();
  ctx.fillStyle = wg; ctx.fill(); ctx.stroke();

  // Vertical tail
  ctx.beginPath();
  ctx.moveTo(-26, -5);
  ctx.bezierCurveTo(-24, -16, -17, -24, -13, -24);
  ctx.bezierCurveTo(-15, -15, -19, -7, -21, -5);
  ctx.closePath();
  ctx.fillStyle = '#6678a8'; ctx.fill();

  // Horizontal stabilisers
  ctx.beginPath();
  ctx.moveTo(-28, 4);
  ctx.bezierCurveTo(-26, 10, -20, 14, -16, 14);
  ctx.bezierCurveTo(-18, 8, -22, 5, -24, 4);
  ctx.closePath();
  ctx.fillStyle = '#6678a8'; ctx.fill();

  // Fuselage
  ctx.beginPath();
  ctx.moveTo(42, 0);
  ctx.bezierCurveTo(32, -8, -6, -8, -30, -5);
  ctx.lineTo(-36, 0);
  ctx.lineTo(-30, 5);
  ctx.bezierCurveTo(-6, 8, 32, 8, 42, 0);
  ctx.closePath();
  const fg = ctx.createLinearGradient(-36, -8, 42, 8);
  fg.addColorStop(0, '#8aa2cc'); fg.addColorStop(0.4, '#d8e8f8'); fg.addColorStop(1, '#eef4ff');
  ctx.fillStyle = fg; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 0.5; ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(6, -3.5, 20, 2.5, -0.05, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-18, -5.8); ctx.lineTo(34, -5.8);
  ctx.strokeStyle = accent + '99'; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-22, -4.0); ctx.lineTo(36, -4.0);
  ctx.strokeStyle = accent + '44'; ctx.lineWidth = 0.8; ctx.stroke();

  // Nose
  ctx.beginPath();
  ctx.moveTo(42, 0);
  ctx.bezierCurveTo(50, -2, 57, -1, 59, 0);
  ctx.bezierCurveTo(57, 1, 50, 2, 42, 0);
  ctx.fillStyle = '#d0dcf0'; ctx.fill();

  // Engine nacelle
  ctx.beginPath();
  ctx.ellipse(4, 1, 11, 5.5, 0, 0, Math.PI * 2);
  const eng = ctx.createLinearGradient(4, -5, 4, 7);
  eng.addColorStop(0, '#889ab8'); eng.addColorStop(1, '#445566');
  ctx.fillStyle = eng; ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-5, 0, 4.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a2233'; ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-5, 0, 3.2, 3.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0d1520'; ctx.fill();

  // Cockpit
  const wn = ctx.createRadialGradient(26, -2, 0, 26, -2, 9);
  wn.addColorStop(0, '#c8f8ff'); wn.addColorStop(0.35, '#38aaee'); wn.addColorStop(1, '#003488cc');
  ctx.beginPath();
  ctx.ellipse(26, -2, 9, 5, -0.08, 0, Math.PI * 2);
  ctx.fillStyle = wn; ctx.fill();
  ctx.beginPath();
  ctx.ellipse(23, -4, 4, 2, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();

  // Propeller hub
  ctx.beginPath();
  ctx.arc(59, 0, 4, 0, Math.PI * 2);
  const hub = ctx.createRadialGradient(58, -1, 0, 59, 0, 4);
  hub.addColorStop(0, '#d0d8e8'); hub.addColorStop(1, '#6677aa');
  ctx.fillStyle = hub; ctx.fill();

  // Blades
  ctx.save();
  ctx.translate(59, 0);
  ctx.rotate(propAngle);
  for (let b = 0; b < 3; b++) {
    ctx.save();
    ctx.rotate((b / 3) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(3, -8, 4, -18, 2, -24);
    ctx.bezierCurveTo(-1, -18, -2, -8, 0, -3);
    ctx.closePath();
    const blade = ctx.createLinearGradient(0, -3, 0, -24);
    blade.addColorStop(0, 'rgba(180,200,230,0.9)');
    blade.addColorStop(1, 'rgba(100,130,180,0.7)');
    ctx.fillStyle = blade;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(59, 0, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#c8d8f0'; ctx.fill();

  ctx.restore();
}