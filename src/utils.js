export const fmt = (n) => `${Number(n).toFixed(2)} USDC`;
export const trunc = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
export const disc = (p, op) => Math.round(((op - p) / op) * 100);
