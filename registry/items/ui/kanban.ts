import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

export interface KanbanCard {
  id: string;
  title: string;
  tag?: string;
}
export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanCard[];
}

/**
 * Kanban (helm) — a drag-and-drop board built on @angular/cdk/drag-drop. Cards reorder within a column
 * and transfer across columns (connected drop-lists via cdkDropListGroup); CDK provides keyboard dragging
 * + a11y out of the box. `columns` is a two-way model; `moved` fires after every drop. Signals-only, OnPush.
 */
@Component({
  selector: 'signng-kanban',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div cdkDropListGroup class="flex gap-4 overflow-x-auto pb-2">
      @for (col of columns(); track col.id) {
        <div class="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-muted/40">
          <div class="flex items-center justify-between px-3 py-2">
            <span class="text-sm font-semibold">{{ col.title }}</span>
            <span class="rounded-full bg-background px-2 text-xs text-muted-foreground">{{ col.items.length }}</span>
          </div>
          <div
            cdkDropList
            [cdkDropListData]="col.items"
            (cdkDropListDropped)="drop($event)"
            class="flex min-h-16 flex-1 flex-col gap-2 p-2"
          >
            @for (card of col.items; track card.id) {
              <div
                cdkDrag
                class="cursor-grab rounded-md border border-border bg-card p-2.5 text-sm shadow-sm active:cursor-grabbing"
              >
                <div class="font-medium">{{ card.title }}</div>
                @if (card.tag) { <span class="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">{{ card.tag }}</span> }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class Kanban {
  readonly columns = model<KanbanColumn[]>([]);
  readonly moved = output<KanbanColumn[]>();

  protected drop(event: CdkDragDrop<KanbanCard[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.columns.set([...this.columns()]); // new top-level ref → OnPush picks it up
    this.moved.emit(this.columns());
  }
}
