import { ChangeDetectionStrategy, Component, Injectable, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'destructive';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms. 0 = stay until dismissed. Default 4000. */
  duration?: number;
}

const MAX_TOASTS = 4;

interface Timer {
  handle: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
}

/**
 * Toast service (helm). Signal-backed queue with auto-dismiss timers that PAUSE on hover/focus
 * (WCAG 2.2.1). Bounded to MAX_TOASTS. SSR-safe (timers only where setTimeout exists).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<ToastItem[]>([]);
  private readonly timers = new Map<number, Timer>();

  show(options: ToastOptions): number {
    const id = ++this.seq;
    const item: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'default',
    };
    this.toasts.update((list) => {
      const next = [...list, item];
      if (next.length > MAX_TOASTS) {
        for (const evicted of next.slice(0, next.length - MAX_TOASTS)) this.clearTimer(evicted.id);
        return next.slice(next.length - MAX_TOASTS);
      }
      return next;
    });
    const duration = options.duration ?? 4000;
    if (duration > 0 && typeof setTimeout !== 'undefined') this.arm(id, duration);
    return id;
  }

  success(title: string, description?: string): number {
    return this.show({ title, description, variant: 'success' });
  }
  error(title: string, description?: string): number {
    return this.show({ title, description, variant: 'destructive' });
  }

  /** Pause every active timer (hover/focus enters the toaster). */
  pauseAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer.handle);
      timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    }
  }

  /** Resume paused timers (hover/focus leaves the toaster). */
  resumeAll(): void {
    if (typeof setTimeout === 'undefined') return;
    for (const [id, timer] of [...this.timers]) {
      if (timer.remaining > 0) this.arm(id, timer.remaining);
      else this.dismiss(id);
    }
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private arm(id: number, remaining: number): void {
    this.timers.set(id, { handle: setTimeout(() => this.dismiss(id), remaining), remaining, startedAt: Date.now() });
  }
  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer.handle);
      this.timers.delete(id);
    }
  }
}

/**
 * Toast viewport (helm). Two persistent live regions (polite + assertive) exist from first paint,
 * so only their children mutate — the reliable screen-reader announce path (vs. inserting a
 * pre-populated role=status node). aria-atomic groups title+description. Hover/focus pause timers.
 * Place once: `<signng-toaster />`.
 */
@Component({
  selector: 'signng-toaster',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'aria-label': 'Notificaciones',
    '(mouseenter)': 'service.pauseAll()',
    '(mouseleave)': 'service.resumeAll()',
    '(focusin)': 'service.pauseAll()',
    '(focusout)': 'service.resumeAll()',
    class:
      'pointer-events-none fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-sm',
  },
  template: `
    <div aria-live="polite" aria-atomic="true" class="contents">
      @for (toast of politeToasts(); track toast.id) {
        <ng-container *ngTemplateOutlet="card; context: { $implicit: toast }" />
      }
    </div>
    <div aria-live="assertive" aria-atomic="true" class="contents">
      @for (toast of assertiveToasts(); track toast.id) {
        <ng-container *ngTemplateOutlet="card; context: { $implicit: toast }" />
      }
    </div>

    <ng-template #card let-toast>
      <div [class]="cardClass(toast)">
        <div class="flex-1">
          <div class="text-sm font-semibold">{{ toast.title }}</div>
          @if (toast.description) {
            <div class="text-sm opacity-90">{{ toast.description }}</div>
          }
        </div>
        <button
          type="button"
          (click)="dismiss(toast.id)"
          aria-label="Cerrar"
          class="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </ng-template>
  `,
})
export class Toaster {
  protected readonly service = inject(ToastService);
  protected readonly toasts = this.service.toasts;
  protected readonly politeToasts = computed(() => this.toasts().filter((t) => t.variant !== 'destructive'));
  protected readonly assertiveToasts = computed(() => this.toasts().filter((t) => t.variant === 'destructive'));

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }

  protected cardClass(toast: ToastItem): string {
    return cn(
      'pointer-events-auto flex items-start gap-3 rounded-md border p-4 shadow-lg',
      toast.variant === 'destructive'
        ? 'border-destructive bg-destructive text-destructive-foreground'
        : toast.variant === 'success'
          ? 'border-primary/40 bg-background text-foreground'
          : 'border-border bg-background text-foreground',
    );
  }
}
