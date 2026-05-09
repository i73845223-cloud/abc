export function generateCrashPoint(): number {
  const r = Math.random();
  if (r >= 0.9) return 1.0;
  const crash = 0.90 / (1 - r);
  return Math.max(1.0, Math.floor(crash * 100) / 100);
}

export function growMultiplier(current: number, deltaMs: number): number {
  const rate = 0.000048 * Math.pow(current, 1.10);
  return current + rate * deltaMs;
}

export function fmtMult(v: number): string {
  return v.toFixed(2) + 'x';
}

export function fmtMoney(v: number): string {
  return '₹' + v.toFixed(2);
}

export function multColor(m: number): string {
  if (m < 2)   return '#60efff';
  if (m < 3)   return '#4fffb0';
  if (m < 5)   return '#ffe040';
  if (m < 10)  return '#ff9500';
  return '#ff3cac';
}

export function histColor(v: number): string {
  if (v < 2)  return '#ff4d6d';
  if (v < 5)  return '#60efff';
  return '#00ff87';
}