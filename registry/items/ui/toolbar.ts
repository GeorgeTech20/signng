import { ChangeDetectionStrategy, Component, Directive, ElementRef, computed, contentChildren, effect, inject, input, signal } from '@angular/core';
import { cn } from '@/lib/utils';

/**
 * Toolbar (helm) — a role=toolbar container with WAI-ARIA roving tabindex: the toolbar is a single tab
 * stop, and ArrowLeft/Right (or Up/Down) + Home/End move focus across its items. Put `signngToolbarItem`
 * on each focusable control (button/toggle) and `signngToolbarSeparator` between groups. Signals-only, OnPush.
 */
@Directive({
  selector: '[signngToolbarItem]',
  host: { '[attr.tabindex]': 'tabindex()' },
})
export class ToolbarItem {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly tabindex = signal(-1);
}

@Directive({
  selector: '[signngToolbarSeparator]',
  host: { role: 'separator', 'aria-orientation': 'vertical', '[class]': 'cls()' },
})
export class ToolbarSeparator {
  readonly class = input('');
  protected readonly cls = computed(() => cn('mx-1 h-5 w-px bg-border', this.class()));
}

@Component({
  selector: 'signng-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'toolbar',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-orientation]': 'orientation()',
    '(keydown)': 'onKey($event)',
    '[class]': 'cls()',
  },
  template: `<ng-content />`,
})
export class Toolbar {
  readonly label = input('');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly class = input('');

  private readonly items = contentChildren(ToolbarItem);
  private readonly active = signal(0);
  protected readonly cls = computed(() => cn('inline-flex items-center gap-1 rounded-md border border-border bg-background p-1', this.class()));

  constructor() {
    // roving tabindex: only the active item is tabbable
    effect(() => {
      const list = this.items();
      const a = Math.min(this.active(), Math.max(0, list.length - 1));
      list.forEach((it, i) => it.tabindex.set(i === a ? 0 : -1));
    });
  }

  protected onKey(e: KeyboardEvent): void {
    const list = this.items();
    if (!list.length) return;
    const fwd = this.orientation() === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const back = this.orientation() === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    let next = this.active();
    if (e.key === fwd) next = (this.active() + 1) % list.length;
    else if (e.key === back) next = (this.active() - 1 + list.length) % list.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    else return;
    e.preventDefault();
    this.active.set(next);
    list[next].el.nativeElement.focus();
  }
}

export const SIGNNG_TOOLBAR = [Toolbar, ToolbarItem, ToolbarSeparator] as const;
