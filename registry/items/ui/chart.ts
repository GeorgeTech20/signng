import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

const PALETTE = [
  'var(--color-primary)',
  'oklch(0.7 0.15 200)',
  'oklch(0.75 0.15 145)',
  'oklch(0.8 0.13 85)',
  'oklch(0.65 0.2 25)',
  'var(--color-muted-foreground)',
];
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
const summarize = (kind: string, data: ChartDatum[]) =>
  `${kind}: ${data.map((d) => `${d.label} ${fmt(d.value)}`).join(', ')}`;

// Chart area layout (viewBox units). Margins leave room for the Y/X axis labels.
const W = 132, H = 76, ML = 16, MR = 4, MT = 6, MB = 14;
const CW = W - ML - MR, CH = H - MT - MB;
const TICKS = 4;
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}
function gridlines(max: number) {
  return Array.from({ length: TICKS + 1 }, (_, i) => {
    const frac = i / TICKS;
    return { v: fmt(max * frac), y: MT + (1 - frac) * CH };
  });
}
const tipWidth = (text: string) => Math.max(12, text.length * 2.1 + 4);

/** Bar chart — gridlines, Y axis, rounded bars, gradient, hover tooltip. */
@Component({
  selector: 'signng-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="h-auto w-full overflow-visible" role="img" [attr.aria-label]="summary()">
      <title>{{ summary() }}</title>
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.95" />
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.55" />
        </linearGradient>
      </defs>
      @for (g of grid(); track g.y) {
        <line [attr.x1]="ML" [attr.x2]="W - MR" [attr.y1]="g.y" [attr.y2]="g.y" stroke="var(--color-border)" stroke-width="0.4" />
        <text [attr.x]="ML - 2" [attr.y]="g.y + 1.2" text-anchor="end" font-size="3.2" fill="var(--color-muted-foreground)">{{ g.v }}</text>
      }
      @for (b of bars(); track b.label) {
        <rect
          [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="1.4"
          [attr.fill]="b.color ?? 'url(#' + gid + ')'"
          [attr.opacity]="hover() === null || hover() === b.i ? 1 : 0.5"
          (pointerenter)="hover.set(b.i)" (pointerleave)="hover.set(null)"
          style="transition:opacity .12s"
        />
        <text [attr.x]="b.cx" [attr.y]="H - 4" text-anchor="middle" font-size="3.2" fill="var(--color-muted-foreground)">{{ b.label }}</text>
      }
      @if (tip(); as t) {
        <g [attr.transform]="'translate(' + t.x + ' ' + t.y + ')'" style="pointer-events:none">
          <rect [attr.x]="-t.w / 2" y="-9" [attr.width]="t.w" height="7.5" rx="1.5" fill="var(--color-foreground)" />
          <text x="0" y="-3.8" text-anchor="middle" font-size="3.4" font-weight="600" fill="var(--color-background)">{{ t.text }}</text>
        </g>
      }
    </svg>
  `,
})
export class BarChart {
  readonly data = input<ChartDatum[]>([]);
  protected readonly W = W;
  protected readonly H = H;
  protected readonly ML = ML;
  protected readonly MR = MR;
  protected readonly gid = inject(_IdGenerator).getId('signng-bargrad-');
  protected readonly hover = signal<number | null>(null);
  protected readonly summary = computed(() => summarize('Gráfico de barras', this.data()));
  protected readonly max = computed(() => niceMax(Math.max(1, ...this.data().map((x) => x.value))));
  protected readonly grid = computed(() => gridlines(this.max()));
  protected readonly bars = computed(() => {
    const d = this.data();
    const max = this.max();
    const n = Math.max(1, d.length);
    const slot = CW / n;
    const w = slot * 0.62;
    return d.map((x, i) => {
      const h = Math.max(0, (x.value / max) * CH);
      const cx = ML + slot * (i + 0.5);
      return { i, label: x.label, value: x.value, x: cx - w / 2, y: MT + CH - h, w, h, cx, color: x.color };
    });
  });
  protected readonly tip = computed(() => {
    const i = this.hover();
    if (i === null) return null;
    const b = this.bars()[i];
    if (!b) return null;
    const text = `${b.label}: ${fmt(b.value)}`;
    return { x: b.cx, y: b.y, text, w: tipWidth(text) };
  });
}

/** Line chart — smooth curve, gridlines, Y axis, gradient area, dots, hover tooltip. */
@Component({
  selector: 'signng-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="h-auto w-full overflow-visible" role="img" [attr.aria-label]="summary()">
      <title>{{ summary() }}</title>
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.25" />
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
        </linearGradient>
      </defs>
      @for (g of grid(); track g.y) {
        <line [attr.x1]="ML" [attr.x2]="W - MR" [attr.y1]="g.y" [attr.y2]="g.y" stroke="var(--color-border)" stroke-width="0.4" />
        <text [attr.x]="ML - 2" [attr.y]="g.y + 1.2" text-anchor="end" font-size="3.2" fill="var(--color-muted-foreground)">{{ g.v }}</text>
      }
      @if (area()) { <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gid + ')'" /> }
      <path [attr.d]="linePath()" fill="none" stroke="var(--color-primary)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      @for (p of points(); track p.i) {
        <circle
          [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="hover() === p.i ? 2.4 : 1.5"
          fill="var(--color-background)" stroke="var(--color-primary)" stroke-width="1.4"
          (pointerenter)="hover.set(p.i)" (pointerleave)="hover.set(null)"
        />
        <text [attr.x]="p.x" [attr.y]="H - 4" text-anchor="middle" font-size="3.2" fill="var(--color-muted-foreground)">{{ p.label }}</text>
      }
      @if (tip(); as t) {
        <g [attr.transform]="'translate(' + t.x + ' ' + t.y + ')'" style="pointer-events:none">
          <rect [attr.x]="-t.w / 2" y="-9" [attr.width]="t.w" height="7.5" rx="1.5" fill="var(--color-foreground)" />
          <text x="0" y="-3.8" text-anchor="middle" font-size="3.4" font-weight="600" fill="var(--color-background)">{{ t.text }}</text>
        </g>
      }
    </svg>
  `,
})
export class LineChart {
  readonly data = input<ChartDatum[]>([]);
  readonly area = input(true);
  protected readonly W = W;
  protected readonly H = H;
  protected readonly ML = ML;
  protected readonly MR = MR;
  protected readonly gid = inject(_IdGenerator).getId('signng-linegrad-');
  protected readonly hover = signal<number | null>(null);
  protected readonly summary = computed(() => summarize('Gráfico de líneas', this.data()));
  protected readonly max = computed(() => niceMax(Math.max(1, ...this.data().map((x) => x.value))));
  protected readonly grid = computed(() => gridlines(this.max()));
  protected readonly points = computed(() => {
    const d = this.data();
    const max = this.max();
    const n = Math.max(1, d.length);
    return d.map((x, i) => ({
      i, label: x.label, value: x.value,
      x: ML + (n === 1 ? CW / 2 : (i / (n - 1)) * CW),
      y: MT + (1 - x.value / max) * CH,
    }));
  });
  protected readonly linePath = computed(() => {
    const p = this.points();
    if (!p.length) return '';
    let d = `M ${fmt(p[0].x)} ${fmt(p[0].y)}`;
    for (let i = 1; i < p.length; i++) {
      const mx = (p[i - 1].x + p[i].x) / 2;
      d += ` C ${fmt(mx)} ${fmt(p[i - 1].y)} ${fmt(mx)} ${fmt(p[i].y)} ${fmt(p[i].x)} ${fmt(p[i].y)}`;
    }
    return d;
  });
  protected readonly areaPath = computed(() => {
    const p = this.points();
    if (!p.length) return '';
    const base = MT + CH;
    return `${this.linePath()} L ${fmt(p[p.length - 1].x)} ${base} L ${fmt(p[0].x)} ${base} Z`;
  });
  protected readonly tip = computed(() => {
    const i = this.hover();
    if (i === null) return null;
    const p = this.points()[i];
    if (!p) return null;
    const text = `${p.label}: ${fmt(p.value)}`;
    return { x: p.x, y: p.y, text, w: tipWidth(text) };
  });
}

/** Donut / circle chart — rounded segments, center total, hover highlight + legend. */
@Component({
  selector: 'signng-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center gap-4">
      <svg viewBox="0 0 42 42" class="h-28 w-28" role="img" [attr.aria-label]="summary()">
        <title>{{ summary() }}</title>
        <g transform="rotate(-90 21 21)">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--color-muted)" stroke-width="5" />
          @for (s of slices(); track s.i) {
            <circle
              cx="21" cy="21" r="15.915" fill="none"
              [attr.stroke]="s.color" [attr.stroke-width]="hover() === s.i ? 6 : 5" stroke-linecap="round"
              [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset"
              [attr.opacity]="hover() === null || hover() === s.i ? 1 : 0.45"
              (pointerenter)="hover.set(s.i)" (pointerleave)="hover.set(null)"
              style="transition:opacity .12s,stroke-width .12s"
            />
          }
        </g>
        <text x="21" y="20.5" text-anchor="middle" font-size="6" font-weight="700" fill="var(--color-foreground)">{{ total() }}</text>
        <text x="21" y="25.5" text-anchor="middle" font-size="3" fill="var(--color-muted-foreground)">total</text>
      </svg>
      <ul class="space-y-1 text-sm">
        @for (s of slices(); track s.i) {
          <li class="flex items-center gap-2" (pointerenter)="hover.set(s.i)" (pointerleave)="hover.set(null)">
            <span class="size-2.5 rounded-full" [style.background]="s.color"></span>
            <span [class.font-medium]="hover() === s.i">{{ s.label }}</span>
            <span class="text-muted-foreground">{{ s.pct }}%</span>
          </li>
        }
      </ul>
    </div>
  `,
})
export class DonutChart {
  readonly data = input<ChartDatum[]>([]);
  protected readonly hover = signal<number | null>(null);
  protected readonly summary = computed(() => summarize('Gráfico circular', this.data()));
  protected readonly total = computed(() => this.data().reduce((a, x) => a + x.value, 0));
  protected readonly slices = computed(() => {
    const d = this.data();
    const total = Math.max(1, this.total());
    const circ = 100;
    let acc = 0;
    return d.map((x, i) => {
      const frac = x.value / total;
      const len = frac * circ;
      const offset = -acc * circ;
      acc += frac;
      return {
        i, label: x.label, color: x.color ?? PALETTE[i % PALETTE.length],
        dash: `${fmt(len)} ${fmt(circ - len)}`, offset: fmt(offset), pct: Math.round(frac * 100),
      };
    });
  });
}

/** Minimal sparkline (tiny smooth line, no axis). */
@Component({
  selector: 'signng-sparkline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <svg viewBox="0 0 100 30" class="h-6 w-24" [attr.aria-label]="label() || null" [attr.role]="label() ? 'img' : null" [attr.aria-hidden]="label() ? null : 'true'">
      <path [attr.d]="path()" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
})
export class Sparkline {
  readonly values = input<number[]>([]);
  readonly label = input('');
  protected readonly path = computed(() => {
    const v = this.values();
    if (!v.length) return '';
    const max = Math.max(...v), min = Math.min(...v), span = max - min || 1, n = v.length;
    const pt = (i: number) => ({ x: n === 1 ? 50 : (i / (n - 1)) * 100, y: 28 - ((v[i] - min) / span) * 26 });
    let d = `M ${fmt(pt(0).x)} ${fmt(pt(0).y)}`;
    for (let i = 1; i < n; i++) {
      const a = pt(i - 1), b = pt(i), mx = (a.x + b.x) / 2;
      d += ` C ${fmt(mx)} ${fmt(a.y)} ${fmt(mx)} ${fmt(b.y)} ${fmt(b.x)} ${fmt(b.y)}`;
    }
    return d;
  });
}

export const SIGNNG_CHART = [BarChart, LineChart, DonutChart, Sparkline] as const;
