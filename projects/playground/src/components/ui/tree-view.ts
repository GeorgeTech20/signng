import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Icon, type IconName } from '@/components/ui/icon';

export interface TreeNode {
  label: string;
  icon?: IconName;
  children?: TreeNode[];
}

/**
 * TreeView (helm) — a collapsible hierarchy (file-explorer style). Branches toggle open/closed (chevron),
 * leaves show an optional icon. Recursive via a self-referencing ng-template (no child component needed).
 * aria: role=tree / treeitem / group with aria-expanded. Signals-only, OnPush.
 */
@Component({
  selector: 'signng-tree-view',
  imports: [NgTemplateOutlet, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ul role="tree" class="text-sm">
      @for (node of nodes(); track $index) {
        <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: node, depth: 0 }" />
      }
    </ul>

    <ng-template #tpl let-node let-depth="depth">
      @let branch = !!node.children?.length;
      <li role="treeitem" [attr.aria-expanded]="branch ? isOpen(node) : null">
        <div
          (click)="branch && toggle(node)"
          [style.padding-left.px]="8 + depth * 16"
          [class]="'flex items-center gap-1.5 rounded px-2 py-1 ' + (branch ? 'cursor-pointer hover:bg-accent' : 'hover:bg-accent/50')"
        >
          @if (branch) {
            <span class="text-muted-foreground"><signng-icon [name]="isOpen(node) ? 'chevron-down' : 'chevron-right'" [size]="14" /></span>
          } @else {
            <span class="w-3.5"></span>
          }
          @if (node.icon) { <signng-icon [name]="node.icon" [size]="15" class="text-muted-foreground" /> }
          <span class="truncate">{{ node.label }}</span>
        </div>
        @if (branch && isOpen(node)) {
          <ul role="group">
            @for (child of node.children; track $index) {
              <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: child, depth: depth + 1 }" />
            }
          </ul>
        }
      </li>
    </ng-template>
  `,
})
export class TreeView {
  readonly nodes = input<TreeNode[]>([]);
  /** Open all branches initially. */
  readonly defaultOpen = input(false);
  private readonly opened = signal<Set<TreeNode>>(new Set());

  protected isOpen(node: TreeNode): boolean {
    return this.defaultOpen() ? !this.opened().has(node) : this.opened().has(node);
  }
  protected toggle(node: TreeNode): void {
    const next = new Set(this.opened());
    next.has(node) ? next.delete(node) : next.add(node);
    this.opened.set(next);
  }
}
