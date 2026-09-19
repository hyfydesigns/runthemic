// Procedural background art for the flyer canvas — no external API, runs
// entirely in the browser. Draws a soft gradient wash, a handful of glowing
// blurred "blob" lights, and a light scatter of spark particles, all picked
// from a curated nightlife/neon palette so results always feel on-brand.

const PALETTES: string[][] = [
  ["#1a0533", "#3d0a5e", "#ff2fb0"],
  ["#0f0f10", "#2a0e3d", "#c9a227"],
  ["#7c3aed", "#db2777", "#fde047"],
  ["#0b1120", "#1e3a8a", "#22d3ee"],
  ["#1a0b2e", "#5b0e4d", "#ff6b35"],
  ["#0a1a12", "#0f4c3a", "#4ade80"],
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateProceduralBackground(width: number, height: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const palette = pick(PALETTES);
  const [base1, base2, accent] = palette as [string, string, string];

  // Base gradient wash at a random angle.
  const angle = randomBetween(0, Math.PI * 2);
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(width, height) * 0.75;
  const grad = ctx.createLinearGradient(
    cx - Math.cos(angle) * r,
    cy - Math.sin(angle) * r,
    cx + Math.cos(angle) * r,
    cy + Math.sin(angle) * r,
  );
  grad.addColorStop(0, base1);
  grad.addColorStop(1, base2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Glowing blurred blobs for depth/light.
  const blobColors = [accent, base1, base2];
  const blobCount = Math.floor(randomBetween(4, 7));
  for (let i = 0; i < blobCount; i++) {
    const bx = randomBetween(0, width);
    const by = randomBetween(0, height);
    const radius = randomBetween(width * 0.12, width * 0.32);
    const color = pick(blobColors);
    const blobGrad = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
    blobGrad.addColorStop(0, `${color}55`);
    blobGrad.addColorStop(1, `${color}00`);
    ctx.fillStyle = blobGrad;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparse spark particles for a party feel.
  const sparkCount = Math.floor(randomBetween(30, 60));
  for (let i = 0; i < sparkCount; i++) {
    const sx = randomBetween(0, width);
    const sy = randomBetween(0, height);
    const size = randomBetween(1, 3.5);
    ctx.fillStyle = `rgba(255,255,255,${randomBetween(0.15, 0.55).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle vignette so text stays legible near the edges.
  const vignette = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.9);
}
