// Plain design data (no DB/server-only calls) so it can be safely imported
// by both server components and the client-side Konva canvas.

// Every template shares the same canvas size today.
export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1350;

export interface FlyerTemplateDef {
  key: string;
  label: string;
  width: number;
  height: number;
  background: { type: "solid" | "gradient"; colors: string[]; angleDeg?: number };
  textColor: string;
  accentColor: string;
  fontFamily: string;
  title: { fontSize: number; y: number };
  subtitle: { fontSize: number; y: number };
  meta: { fontSize: number; y: number };
  cta: { fontSize: number; y: number; text: string };
  showQr: boolean;
}

export const FLYER_TEMPLATES: Record<string, FlyerTemplateDef> = {
  NEON: {
    key: "NEON",
    label: "Neon",
    width: 1080,
    height: 1350,
    background: { type: "gradient", colors: ["#1a0533", "#3d0a5e"], angleDeg: 135 },
    textColor: "#ffffff",
    accentColor: "#ff2fb0",
    fontFamily: "Space Grotesk, sans-serif",
    title: { fontSize: 88, y: 420 },
    subtitle: { fontSize: 42, y: 560 },
    meta: { fontSize: 34, y: 630 },
    cta: { fontSize: 36, y: 1160, text: "SCAN TO RSVP + REQUEST SONGS" },
    showQr: true,
  },
  RETRO: {
    key: "RETRO",
    label: "Retro",
    width: 1080,
    height: 1350,
    background: { type: "gradient", colors: ["#ff6b35", "#f7c548"], angleDeg: 180 },
    textColor: "#2b1200",
    accentColor: "#2b1200",
    fontFamily: "Space Grotesk, sans-serif",
    title: { fontSize: 92, y: 400 },
    subtitle: { fontSize: 40, y: 540 },
    meta: { fontSize: 32, y: 610 },
    cta: { fontSize: 34, y: 1160, text: "SCAN TO RSVP" },
    showQr: true,
  },
  MODERN_MINIMAL: {
    key: "MODERN_MINIMAL",
    label: "Modern minimal",
    width: 1080,
    height: 1350,
    background: { type: "solid", colors: ["#f5f5f0"] },
    textColor: "#111827",
    accentColor: "#111827",
    fontFamily: "Inter, sans-serif",
    title: { fontSize: 76, y: 460 },
    subtitle: { fontSize: 34, y: 580 },
    meta: { fontSize: 28, y: 636 },
    cta: { fontSize: 28, y: 1170, text: "Scan to RSVP" },
    showQr: true,
  },
  PARTY: {
    key: "PARTY",
    label: "Party",
    width: 1080,
    height: 1350,
    background: { type: "gradient", colors: ["#7c3aed", "#db2777"], angleDeg: 45 },
    textColor: "#ffffff",
    accentColor: "#fde047",
    fontFamily: "Space Grotesk, sans-serif",
    title: { fontSize: 90, y: 440 },
    subtitle: { fontSize: 42, y: 580 },
    meta: { fontSize: 32, y: 646 },
    cta: { fontSize: 36, y: 1160, text: "LET'S SING!  SCAN TO JOIN" },
    showQr: true,
  },
  ELEGANT: {
    key: "ELEGANT",
    label: "Elegant",
    width: 1080,
    height: 1350,
    background: { type: "solid", colors: ["#0f0f10"] },
    textColor: "#f5efe0",
    accentColor: "#c9a227",
    fontFamily: "Space Grotesk, sans-serif",
    title: { fontSize: 74, y: 460 },
    subtitle: { fontSize: 34, y: 580 },
    meta: { fontSize: 28, y: 636 },
    cta: { fontSize: 26, y: 1170, text: "RSVP via QR code" },
    showQr: true,
  },
};

const DEFAULT_TEMPLATE = FLYER_TEMPLATES.NEON as FlyerTemplateDef;

export function getFlyerTemplate(key: string): FlyerTemplateDef {
  return FLYER_TEMPLATES[key] ?? DEFAULT_TEMPLATE;
}
