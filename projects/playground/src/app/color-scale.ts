/**
 * Heuristic 12-step OKLCH scale generator (Radix-Colors-style grouping: 1-2 app bg,
 * 3-5 component bg/border/hover, 6-8 borders/separators, 9-10 solid/accent, 11-12 text) —
 * NOT Radix's algorithm (that's proprietary/unpublished), just a perceptually-reasonable
 * ramp built from OKLab, which SignNG's tokens already use. Only generates a scale for a
 * single brand color; does not touch the app's actual semantic tokens (background,
 * foreground, border, etc.) — see color-system skill for why that's a separate migration.
 */

interface Oklch {
  l: number;
  c: number;
  h: number;
}

function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToOklch(hex: string): Oklch {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = srgbToLinear((n >> 16) & 255);
  const g = srgbToLinear((n >> 8) & 255);
  const b = srgbToLinear(n & 255);
  // Björn Ottosson's linear-sRGB -> OKLab matrices (public domain reference implementation).
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const c = Math.sqrt(a * a + bLab * bLab);
  let h = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

type Step = { l?: number; cMul: number; lMul?: number };

const LIGHT_STEPS: Step[] = [
  { l: 0.99, cMul: 0.05 },
  { l: 0.97, cMul: 0.09 },
  { l: 0.94, cMul: 0.16 },
  { l: 0.9, cMul: 0.26 },
  { l: 0.85, cMul: 0.38 },
  { l: 0.78, cMul: 0.52 },
  { l: 0.7, cMul: 0.68 },
  { l: 0.6, cMul: 0.84 },
  { cMul: 1, lMul: 1 }, // 9: the picked color, unmodified
  { cMul: 0.95, lMul: 0.88 }, // 10: hover — slightly darker
  { l: 0.42, cMul: 0.82 },
  { l: 0.22, cMul: 0.5 },
];

// Dark-mode ramp (Radix grouping mirrored): 1-2 near-black app bg, 3-8 rising component
// surfaces/borders, 9 the solid unchanged, 10 hover slightly LIGHTER (dark-mode convention),
// 11-12 readable light text tints.
const DARK_STEPS: Step[] = [
  { l: 0.19, cMul: 0.12 },
  { l: 0.22, cMul: 0.2 },
  { l: 0.26, cMul: 0.3 },
  { l: 0.3, cMul: 0.4 },
  { l: 0.34, cMul: 0.5 },
  { l: 0.4, cMul: 0.62 },
  { l: 0.47, cMul: 0.76 },
  { l: 0.55, cMul: 0.9 },
  { cMul: 1, lMul: 1 },
  { cMul: 0.95, lMul: 1.12 },
  { l: 0.78, cMul: 0.55 },
  { l: 0.94, cMul: 0.2 },
];

export interface ScaleStep {
  step: number;
  css: string;
}

export function generateScale(hex: string, mode: 'light' | 'dark' = 'light'): ScaleStep[] {
  const base = hexToOklch(hex);
  const maxC = Math.min(base.c, 0.37); // clamp to stay in-gamut for typical displays
  const steps = mode === 'dark' ? DARK_STEPS : LIGHT_STEPS;
  return steps.map((s, i) => {
    const l = Math.min(s.l ?? base.l * (s.lMul ?? 1), 0.99);
    const c = maxC * s.cMul;
    return { step: i + 1, css: `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${base.h.toFixed(1)})` };
  });
}
