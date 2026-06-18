import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Analytics charts (helm) — multi-series, legend-driven SVG charts for dashboards: MultiLineChart,
 * StackedBarChart, GroupedBarChart, ScatterChart and Heatmap. Pure SVG (no Recharts/D3), signals-only,
 * OnPush, role=img with a generated label. Line/bar charts have an interactive crosshair tooltip on hover.
 * Colors come from a fixed palette (override per-series with `color`). Rendered via [attr.*] — no innerHTML.
 */

const PALETTE = ['#6d4aff', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export interface Series {
  name: string;
  values: number[];
  color?: string;
}

// shared plot geometry
const W = 320, H = 170, ML = 30, MR = 10, MT = 10, MB = 26;
const PW = W - ML - MR;
const PH = H - MT - MB;

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
const color = (s: Series, i: number) => s.color || PALETTE[i % PALETTE.length];

// ---------- shared legend ----------
@Component({
  selector: 'signng-chart-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
      @for (s of series(); track s.name; let i = $index) {
        <span class="inline-flex items-center gap-1.5">
          <span class="inline-block size-2.5 rounded-[3px]" [style.background]="s.color || palette[i % palette.length]"></span>
          <span class="text-muted-foreground">{{ s.name }}</span>
        </span>
      }
    </div>
  `,
})
export class ChartLegend {
  readonly series = input<Series[]>([]);
  protected readonly palette = PALETTE;
}

// ---------- multi-line ----------
@Component({
  selector: 'signng-multi-line-chart',
  imports: [ChartLegend],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="block w-full overflow-visible" [style.max-height.px]="height()"
        role="img" [attr.aria-label]="label() || 'Gráfico de líneas multi-serie'"
        (mousemove)="onMove($event)" (mouseleave)="hover.set(-1)">
        <!-- gridlines + Y labels -->
        @for (g of grid(); track g.y) {
          <line [attr.x1]="ML" [attr.x2]="W - MR" [attr.y1]="g.y" [attr.y2]="g.y" stroke="currentColor" class="text-border" stroke-width="1" />
          <text [attr.x]="ML - 4" [attr.y]="g.y + 3" text-anchor="end" class="fill-muted-foreground" font-size="8">{{ g.v }}</text>
        }
        <!-- X labels -->
        @for (lb of labels(); track $index) {
          <text [attr.x]="x($index)" [attr.y]="H - 8" text-anchor="middle" class="fill-muted-foreground" font-size="8">{{ lb }}</text>
        }
        <!-- crosshair -->
        @if (hover() >= 0) {
          <line [attr.x1]="x(hover())" [attr.x2]="x(hover())" [attr.y1]="MT" [attr.y2]="MT + PH" stroke="currentColor" class="text-muted-foreground" stroke-dasharray="3 3" stroke-width="1" />
        }
        <!-- series -->
        @for (s of series(); track s.name; let i = $index) {
          <polyline [attr.points]="points(s)" fill="none" [attr.stroke]="col(s, i)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          @if (hover() >= 0) {
            <circle [attr.cx]="x(hover())" [attr.cy]="y(s.values[hover()])" r="3" [attr.fill]="col(s, i)" stroke="var(--color-background)" stroke-width="1.5" />
          }
        }
        <!-- tooltip -->
        @if (hover() >= 0) {
          <g [attr.transform]="'translate(' + tipX() + ',' + MT + ')'">
            <rect width="78" [attr.height]="14 + series().length * 12" rx="4" class="fill-popover stroke-border" stroke-width="1" />
            <text x="6" y="11" class="fill-foreground" font-size="8" font-weight="600">{{ labels()[hover()] }}</text>
            @for (s of series(); track s.name; let i = $index) {
              <circle cx="9" [attr.cy]="20 + i * 12" r="2.5" [attr.fill]="col(s, i)" />
              <text x="15" [attr.y]="23 + i * 12" class="fill-muted-foreground" font-size="7">{{ s.name }}</text>
              <text x="72" [attr.y]="23 + i * 12" text-anchor="end" class="fill-foreground" font-size="7" font-weight="600">{{ s.values[hover()] }}</text>
            }
          </g>
        }
      </svg>
      @if (legend()) { <signng-chart-legend [series]="series()" /> }
    </div>
  `,
})
export class MultiLineChart {
  readonly series = input<Series[]>([]);
  readonly labels = input<string[]>([]);
  readonly height = input(190);
  readonly legend = input(true);
  readonly label = input('');
  protected readonly W = W; protected readonly H = H; protected readonly ML = ML; protected readonly MR = MR; protected readonly MT = MT; protected readonly PH = PH;
  protected readonly hover = signal(-1);
  protected readonly col = color;

  private readonly max = computed(() => niceMax(Math.max(1, ...this.series().flatMap((s) => s.values))));
  protected readonly grid = computed(() => {
    const m = this.max();
    return [0, 0.25, 0.5, 0.75, 1].map((t) => ({ y: MT + PH - t * PH, v: Math.round(m * t) }));
  });
  protected x(i: number): number {
    const n = this.labels().length;
    return n <= 1 ? ML + PW / 2 : ML + (i / (n - 1)) * PW;
  }
  protected y(v: number): number {
    return MT + PH - (v / this.max()) * PH;
  }
  protected points(s: Series): string {
    return s.values.map((v, i) => `${this.x(i)},${this.y(v)}`).join(' ');
  }
  protected tipX(): number {
    return Math.min(this.x(this.hover()) + 6, W - 80);
  }
  protected onMove(e: MouseEvent): void {
    const svg = e.currentTarget as SVGSVGElement;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const n = this.labels().length;
    if (n < 1) return;
    const i = Math.round(((px - ML) / PW) * (n - 1));
    this.hover.set(Math.max(0, Math.min(n - 1, i)));
  }
}

// ---------- stacked / grouped bars ----------
@Component({
  selector: 'signng-stacked-bar-chart',
  imports: [ChartLegend],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="block w-full overflow-visible" [style.max-height.px]="height()"
        role="img" [attr.aria-label]="label() || 'Gráfico de barras apiladas'">
        @for (g of grid(); track g.y) {
          <line [attr.x1]="ML" [attr.x2]="W - MR" [attr.y1]="g.y" [attr.y2]="g.y" stroke="currentColor" class="text-border" stroke-width="1" />
          <text [attr.x]="ML - 4" [attr.y]="g.y + 3" text-anchor="end" class="fill-muted-foreground" font-size="8">{{ g.v }}</text>
        }
        @for (lb of labels(); track $index; let c = $index) {
          @for (seg of stacks()[c]; track seg.i) {
            <rect [attr.x]="bx(c)" [attr.y]="seg.y" [attr.width]="bw()" [attr.height]="seg.h" [attr.fill]="seg.color" [attr.rx]="2" />
          }
          <text [attr.x]="bx(c) + bw() / 2" [attr.y]="H - 8" text-anchor="middle" class="fill-muted-foreground" font-size="8">{{ lb }}</text>
        }
      </svg>
      @if (legend()) { <signng-chart-legend [series]="series()" /> }
    </div>
  `,
})
export class StackedBarChart {
  readonly series = input<Series[]>([]);
  readonly labels = input<string[]>([]);
  readonly height = input(190);
  readonly legend = input(true);
  readonly label = input('');
  protected readonly W = W; protected readonly H = H; protected readonly ML = ML; protected readonly MR = MR;

  private readonly totals = computed(() => this.labels().map((_, c) => this.series().reduce((a, s) => a + (s.values[c] || 0), 0)));
  private readonly max = computed(() => niceMax(Math.max(1, ...this.totals())));
  protected readonly grid = computed(() => {
    const m = this.max();
    return [0, 0.5, 1].map((t) => ({ y: MT + PH - t * PH, v: Math.round(m * t) }));
  });
  protected readonly stacks = computed(() => {
    const m = this.max(), ss = this.series();
    return this.labels().map((_, c) => {
      let acc = 0;
      return ss.map((s, i) => {
        const v = s.values[c] || 0;
        const h = (v / m) * PH;
        const y = MT + PH - acc - h;
        acc += h;
        return { i, y, h, color: color(s, i) };
      });
    });
  });
  protected bw(): number {
    return Math.min(36, (PW / Math.max(1, this.labels().length)) * 0.6);
  }
  protected bx(c: number): number {
    const n = this.labels().length;
    return ML + (c + 0.5) * (PW / n) - this.bw() / 2;
  }
}

@Component({
  selector: 'signng-grouped-bar-chart',
  imports: [ChartLegend],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="block w-full overflow-visible" [style.max-height.px]="height()"
        role="img" [attr.aria-label]="label() || 'Gráfico de barras agrupadas'">
        @for (g of grid(); track g.y) {
          <line [attr.x1]="ML" [attr.x2]="W - MR" [attr.y1]="g.y" [attr.y2]="g.y" stroke="currentColor" class="text-border" stroke-width="1" />
          <text [attr.x]="ML - 4" [attr.y]="g.y + 3" text-anchor="end" class="fill-muted-foreground" font-size="8">{{ g.v }}</text>
        }
        @for (lb of labels(); track $index; let c = $index) {
          @for (s of series(); track s.name; let i = $index) {
            <rect [attr.x]="gx(c, i)" [attr.y]="gy(s.values[c] || 0)" [attr.width]="gw()" [attr.height]="gh(s.values[c] || 0)" [attr.fill]="col(s, i)" [attr.rx]="1.5" />
          }
          <text [attr.x]="bandX(c) + band() / 2" [attr.y]="H - 8" text-anchor="middle" class="fill-muted-foreground" font-size="8">{{ lb }}</text>
        }
      </svg>
      @if (legend()) { <signng-chart-legend [series]="series()" /> }
    </div>
  `,
})
export class GroupedBarChart {
  readonly series = input<Series[]>([]);
  readonly labels = input<string[]>([]);
  readonly height = input(190);
  readonly legend = input(true);
  readonly label = input('');
  protected readonly W = W; protected readonly H = H; protected readonly ML = ML; protected readonly MR = MR;
  protected readonly col = color;

  private readonly max = computed(() => niceMax(Math.max(1, ...this.series().flatMap((s) => s.values))));
  protected readonly grid = computed(() => {
    const m = this.max();
    return [0, 0.5, 1].map((t) => ({ y: MT + PH - t * PH, v: Math.round(m * t) }));
  });
  protected band(): number {
    return (PW / Math.max(1, this.labels().length)) * 0.7;
  }
  protected bandX(c: number): number {
    const n = this.labels().length;
    return ML + (c + 0.5) * (PW / n) - this.band() / 2;
  }
  protected gw(): number {
    return this.band() / Math.max(1, this.series().length);
  }
  protected gx(c: number, i: number): number {
    return this.bandX(c) + i * this.gw();
  }
  protected gh(v: number): number {
    return (v / this.max()) * PH;
  }
  protected gy(v: number): number {
    return MT + PH - this.gh(v);
  }
}

// ---------- scatter ----------
export interface Point { x: number; y: number }
@Component({
  selector: 'signng-scatter-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="block w-full overflow-visible" [style.max-height.px]="height()"
      role="img" [attr.aria-label]="label() || 'Gráfico de dispersión'">
      @for (g of grid(); track g.y) {
        <line [attr.x1]="ML" [attr.x2]="W - MR" [attr.y1]="g.y" [attr.y2]="g.y" stroke="currentColor" class="text-border" stroke-width="1" />
        <text [attr.x]="ML - 4" [attr.y]="g.y + 3" text-anchor="end" class="fill-muted-foreground" font-size="8">{{ g.v }}</text>
      }
      @for (p of data(); track $index) {
        <circle [attr.cx]="px(p.x)" [attr.cy]="py(p.y)" r="3" [attr.fill]="color()" fill-opacity="0.65" />
      }
    </svg>
  `,
})
export class ScatterChart {
  readonly data = input<Point[]>([]);
  readonly height = input(190);
  readonly label = input('');
  readonly color = input('#6d4aff');
  protected readonly W = W; protected readonly H = H; protected readonly ML = ML; protected readonly MR = MR;

  private readonly maxX = computed(() => niceMax(Math.max(1, ...this.data().map((p) => p.x))));
  private readonly maxY = computed(() => niceMax(Math.max(1, ...this.data().map((p) => p.y))));
  protected readonly grid = computed(() => {
    const m = this.maxY();
    return [0, 0.5, 1].map((t) => ({ y: MT + PH - t * PH, v: Math.round(m * t) }));
  });
  protected px(x: number): number {
    return ML + (x / this.maxX()) * PW;
  }
  protected py(y: number): number {
    return MT + PH - (y / this.maxY()) * PH;
  }
}

// ---------- heatmap ----------
@Component({
  selector: 'signng-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + vw() + ' ' + vh()" class="block w-full" [style.max-height.px]="height()"
      role="img" [attr.aria-label]="label() || 'Mapa de calor'">
      @for (row of matrix(); track $index; let r = $index) {
        @for (val of row; track $index; let c = $index) {
          <rect [attr.x]="c * cell + gap" [attr.y]="r * cell + gap" [attr.width]="cell - gap * 2" [attr.height]="cell - gap * 2"
            [attr.rx]="2" [attr.fill]="fill(val)">
            <title>{{ val }}</title>
          </rect>
        }
      }
    </svg>
  `,
})
export class Heatmap {
  readonly matrix = input<number[][]>([]);
  readonly height = input(190);
  readonly label = input('');
  /** base hue for the color scale (oklch lightness varies with value). */
  readonly hue = input('#6d4aff');
  protected readonly cell = 22;
  protected readonly gap = 2;

  private readonly max = computed(() => Math.max(1, ...this.matrix().flat()));
  protected vw(): number {
    return (this.matrix()[0]?.length || 1) * this.cell;
  }
  protected vh(): number {
    return this.matrix().length * this.cell;
  }
  protected fill(v: number): string {
    const t = v / this.max(); // 0..1
    return `color-mix(in oklab, ${this.hue()} ${Math.round(t * 100)}%, var(--color-muted))`;
  }
}

export const SIGNNG_ANALYTICS_CHARTS = [
  ChartLegend, MultiLineChart, StackedBarChart, GroupedBarChart, ScatterChart, Heatmap,
] as const;
