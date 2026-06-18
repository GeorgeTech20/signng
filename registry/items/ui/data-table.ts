import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { SIGNNG_I18N } from '@/components/ui/i18n';

export type Row = Record<string, any>;

export interface DataColumn {
  key: string;
  header: string;
  sortable?: boolean;
  editable?: boolean;
  align?: 'left' | 'right' | 'center';
  /** Display formatter (does not affect sort/search, which use the raw value). */
  format?: (value: any, row: Row) => string;
}

/**
 * DataTable (helm) — a smart table over a native `<table>`: global search, tri-state sortable columns
 * (aria-sort), row selection (header select-all + per-row), click-to-edit cells, optional grouping with
 * collapsible group headers, pagination, and CSV export. Fully signal-driven (data is a two-way model so
 * inline edits flow back to the parent); zoneless + OnPush; no innerHTML/eval/bypass anywhere.
 *
 * When `groupBy` is set the rows are grouped (pagination is disabled — groups show in full).
 */
@Component({
  selector: 'signng-data-table',
  imports: [Icon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      <!-- toolbar -->
      @if (searchable() || exportable()) {
        <div class="flex flex-wrap items-center gap-2">
          @if (searchable()) {
            <div class="relative">
              <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <signng-icon name="search" [size]="16" />
              </span>
              <input
                type="search"
                [value]="query()"
                (input)="query.set($any($event.target).value); page.set(1)"
                [attr.aria-label]="i18n.searchPlaceholder"
                [placeholder]="i18n.searchPlaceholder"
                class="h-9 w-56 rounded-md border border-input bg-background py-1 pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          }
          <div class="flex-1"></div>
          @if (selectable() && selectedCount()) {
            <span class="text-sm text-muted-foreground">{{ selectedCount() }} seleccionada(s)</span>
          }
          @if (exportable()) {
            <button
              type="button"
              (click)="exportCsv()"
              class="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <signng-icon name="download" [size]="15" /> Export CSV
            </button>
          }
        </div>
      }

      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full caption-bottom text-sm">
          @if (caption()) { <caption class="mt-2 text-xs text-muted-foreground">{{ caption() }}</caption> }
          <thead class="[&_tr]:border-b">
            <tr class="border-b border-border">
              @if (selectable()) {
                <th class="h-11 w-10 px-3 text-left align-middle">
                  <input
                    type="checkbox"
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    (change)="toggleAll()"
                    aria-label="Seleccionar todo"
                    class="size-4 cursor-pointer accent-[var(--color-primary)]"
                  />
                </th>
              }
              @for (col of columns(); track col.key) {
                <th
                  [class]="cn('h-11 px-4 align-middle font-medium text-muted-foreground', alignCls(col), col.sortable ? 'cursor-pointer select-none' : '')"
                  [attr.aria-sort]="col.sortable ? ariaSort(col.key) : null"
                  (click)="col.sortable && sort(col.key)"
                >
                  <span class="inline-flex items-center gap-1">
                    {{ col.header }}
                    @if (col.sortable) {
                      <signng-icon
                        [name]="sortKey() === col.key ? (sortDir() === 'asc' ? 'chevron-up' : sortDir() === 'desc' ? 'chevron-down' : 'chevron-down') : 'chevron-down'"
                        [size]="13"
                        [class]="sortKey() === col.key && sortDir() !== 'none' ? 'text-foreground' : 'opacity-40'"
                      />
                    }
                  </span>
                </th>
              }
            </tr>
          </thead>

          <tbody class="[&_tr:last-child]:border-0">
            @if (groupBy()) {
              @for (grp of groups(); track grp.key) {
                <tr class="border-b border-border bg-muted/40">
                  <td [attr.colspan]="colspan()" class="px-3 py-1.5">
                    <button type="button" (click)="toggleGroup(grp.key)" class="inline-flex items-center gap-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                      <signng-icon [name]="isCollapsed(grp.key) ? 'chevron-right' : 'chevron-down'" [size]="14" />
                      {{ grp.key }} <span class="text-muted-foreground">({{ grp.rows.length }})</span>
                    </button>
                  </td>
                </tr>
                @if (!isCollapsed(grp.key)) {
                  @for (row of grp.rows; track $index) {
                    <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ $implicit: row }" />
                  }
                }
              }
            } @else {
              @for (row of paged(); track $index) {
                <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ $implicit: row }" />
              } @empty {
                <tr><td [attr.colspan]="colspan()" class="px-4 py-10 text-center text-muted-foreground">{{ i18n.empty }}</td></tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- pagination (hidden when grouped) -->
      @if (!groupBy() && totalPages() > 1) {
        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <span>{{ rangeFrom() }}–{{ rangeTo() }} de {{ processed().length }}</span>
          <div class="flex items-center gap-1">
            <button type="button" [disabled]="page() <= 1" (click)="page.set(page() - 1)" [class]="navBtn" aria-label="Anterior">
              <signng-icon name="chevron-left" [size]="16" />
            </button>
            <span class="px-2">{{ page() }} / {{ totalPages() }}</span>
            <button type="button" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)" [class]="navBtn" aria-label="Siguiente">
              <signng-icon name="chevron-right" [size]="16" />
            </button>
          </div>
        </div>
      }
    </div>

    <!-- row template (shared by grouped + flat) -->
    <ng-template #rowTpl let-row>
      <tr class="border-b border-border transition-colors hover:bg-muted/50" [class.bg-accent]="isSelected(row)">
        @if (selectable()) {
          <td class="w-10 px-3 align-middle">
            <input type="checkbox" [checked]="isSelected(row)" (change)="toggleRow(row)" aria-label="Seleccionar fila" class="size-4 cursor-pointer accent-[var(--color-primary)]" />
          </td>
        }
        @for (col of columns(); track col.key) {
          <td [class]="cn('px-4 py-2.5 align-middle', alignCls(col), col.editable ? 'cursor-text' : '')" (click)="col.editable && startEdit(row, col.key)">
            @if (isEditing(row, col.key)) {
              <input
                [value]="row[col.key]"
                (blur)="commitEdit(row, col.key, $any($event.target).value)"
                (keydown.enter)="commitEdit(row, col.key, $any($event.target).value)"
                (keydown.escape)="editing.set(null)"
                autofocus
                class="h-7 w-full rounded border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            } @else {
              {{ col.format ? col.format(row[col.key], row) : row[col.key] }}
            }
          </td>
        }
      </tr>
    </ng-template>
  `,
})
export class DataTable {
  readonly data = model<Row[]>([]);
  readonly columns = input<DataColumn[]>([]);
  readonly pageSize = input(10);
  readonly selectable = input(false);
  readonly searchable = input(true);
  readonly exportable = input(true);
  readonly groupBy = input<string | null>(null);
  readonly caption = input('');
  readonly selectionChange = output<Row[]>();

  protected readonly cn = cn;
  protected readonly i18n = inject(SIGNNG_I18N);
  protected readonly navBtn =
    'inline-flex size-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc' | 'none'>('none');
  protected readonly editing = signal<{ row: Row; key: string } | null>(null);
  protected readonly selected = signal<Set<Row>>(new Set());
  private readonly collapsed = signal<Set<string>>(new Set());

  protected readonly processed = computed<Row[]>(() => {
    let rows = this.data();
    const q = this.query().toLowerCase().trim();
    if (q) {
      const cols = this.columns();
      rows = rows.filter((r) => cols.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q)));
    }
    const sk = this.sortKey();
    const sd = this.sortDir();
    if (sk && sd !== 'none') {
      rows = [...rows].sort((a, b) => {
        const av = a[sk], bv = b[sk];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sd === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  });

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.processed().length / this.pageSize())));
  protected readonly paged = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * this.pageSize();
    return this.processed().slice(start, start + this.pageSize());
  });
  protected readonly rangeFrom = computed(() => (this.processed().length ? (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize() + 1 : 0));
  protected readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize(), this.processed().length));

  protected readonly groups = computed(() => {
    const gb = this.groupBy();
    if (!gb) return [] as { key: string; rows: Row[] }[];
    const map = new Map<string, Row[]>();
    for (const r of this.processed()) {
      const k = String(r[gb] ?? '—');
      const arr = map.get(k);
      if (arr) arr.push(r);
      else map.set(k, [r]);
    }
    return [...map.entries()].map(([key, rows]) => ({ key, rows }));
  });

  protected colspan(): number {
    return this.columns().length + (this.selectable() ? 1 : 0);
  }
  protected alignCls(col: DataColumn): string {
    return col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
  }
  protected ariaSort(key: string): string {
    if (this.sortKey() !== key || this.sortDir() === 'none') return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }
  protected sort(key: string): void {
    if (this.sortKey() !== key) {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    } else {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : this.sortDir() === 'desc' ? 'none' : 'asc');
      if (this.sortDir() === 'none') this.sortKey.set(null);
    }
  }

  // --- selection ---
  protected isSelected(row: Row): boolean {
    return this.selected().has(row);
  }
  protected readonly selectedCount = computed(() => this.selected().size);
  protected readonly allSelected = computed(() => {
    const rows = this.processed();
    return rows.length > 0 && rows.every((r) => this.selected().has(r));
  });
  protected readonly someSelected = computed(() => this.selected().size > 0 && !this.allSelected());
  protected toggleRow(row: Row): void {
    const next = new Set(this.selected());
    next.has(row) ? next.delete(row) : next.add(row);
    this.selected.set(next);
    this.selectionChange.emit([...next]);
  }
  protected toggleAll(): void {
    const rows = this.processed();
    const next = this.allSelected() ? new Set<Row>() : new Set(rows);
    this.selected.set(next);
    this.selectionChange.emit([...next]);
  }

  // --- grouping ---
  protected isCollapsed(key: string): boolean {
    return this.collapsed().has(key);
  }
  protected toggleGroup(key: string): void {
    const next = new Set(this.collapsed());
    next.has(key) ? next.delete(key) : next.add(key);
    this.collapsed.set(next);
  }

  // --- inline edit ---
  protected isEditing(row: Row, key: string): boolean {
    const e = this.editing();
    return !!e && e.row === row && e.key === key;
  }
  protected startEdit(row: Row, key: string): void {
    this.editing.set({ row, key });
  }
  protected commitEdit(row: Row, key: string, value: string): void {
    const orig = row[key];
    const v: unknown = typeof orig === 'number' ? Number(value) : value;
    this.data.update((rows) => rows.map((r) => (r === row ? { ...r, [key]: v } : r)));
    this.editing.set(null);
  }

  // --- CSV export (Blob + object URL; no innerHTML/bypass) ---
  protected exportCsv(): void {
    if (typeof document === 'undefined') return;
    const cols = this.columns();
    const esc = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const head = cols.map((c) => esc(c.header)).join(',');
    const body = this.processed()
      .map((r) => cols.map((c) => esc(c.format ? c.format(r[c.key], r) : r[c.key])).join(','))
      .join('\n');
    const blob = new Blob([head + '\n' + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (this.caption() || 'data') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
