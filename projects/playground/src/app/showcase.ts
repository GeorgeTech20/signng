import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, Radio } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Combobox } from '@/components/ui/combobox';
import { InputOtp } from '@/components/ui/input-otp';
import { FormField } from '@/components/ui/form-field';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Sheet } from '@/components/ui/sheet';
import { Drawer } from '@/components/ui/drawer';
import { Popover } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { HoverCard } from '@/components/ui/hover-card';
import { Command } from '@/components/ui/command';
import { Toaster, ToastService } from '@/components/ui/toast';
import { Accordion } from '@/components/ui/accordion';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { ContextMenu } from '@/components/ui/context-menu';
import { Menubar } from '@/components/ui/menubar';
import { Pagination } from '@/components/ui/pagination';
import { Calendar } from '@/components/ui/calendar';
import { DatePicker } from '@/components/ui/date-picker';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Toggle } from '@/components/ui/toggle';
import { Collapsible } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { SIGNNG_CARD } from '@/components/ui/card';
import { SIGNNG_ALERT } from '@/components/ui/alert';
import { SIGNNG_TABLE } from '@/components/ui/table';
import { SIGNNG_BREADCRUMB } from '@/components/ui/breadcrumb';
import { SIGNNG_TOGGLE_GROUP } from '@/components/ui/toggle-group';
import { SIGNNG_CAROUSEL } from '@/components/ui/carousel';
import { SIGNNG_NAVIGATION_MENU } from '@/components/ui/navigation-menu';
import { SIGNNG_SIDEBAR } from '@/components/ui/sidebar';
import { Icon } from '@/components/ui/icon';
import { SIGNNG_CHART } from '@/components/ui/chart';
import { DataTable, type DataColumn, type Row } from '@/components/ui/data-table';
import { SIGNNG_ANALYTICS_CHARTS } from '@/components/ui/chart-analytics';
import { SIGNNG_FILE_UPLOAD } from '@/components/ui/file-upload';
import { LoginForm } from '@/components/ui/login-form';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Timeline } from '@/components/ui/timeline';
import { Stepper } from '@/components/ui/stepper';
import { NumberInput } from '@/components/ui/number-input';
import { MultiSelect } from '@/components/ui/multi-select';
import { TagInput } from '@/components/ui/tag-input';
import { TreeView } from '@/components/ui/tree-view';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Rating } from '@/components/ui/rating';
import { ColorPicker } from '@/components/ui/color-picker';
import { Kanban, type KanbanColumn } from '@/components/ui/kanban';
import { NotificationCenter } from '@/components/ui/notification-center';
import { SIGNNG_TABS } from '@signng/core/tabs';

interface Demo { name: string; cat: string; code: string }

@Component({
  selector: 'signng-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.meta.k)': 'focusSearch($event)',
    '(document:keydown.control.k)': 'focusSearch($event)',
  },
  imports: [
    NgTemplateOutlet,
    Button, Input, Textarea, Switch, Checkbox, RadioGroup, Radio, Select, Slider, Combobox, InputOtp, FormField,
    Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, HoverCard, Command, Toaster,
    Accordion, DropdownMenu, ContextMenu, Menubar, Pagination, Calendar, DatePicker,
    Avatar, Badge, Separator, Skeleton, Progress, Toggle, Collapsible, ScrollArea, AspectRatio,
    Icon, ...SIGNNG_CHART, ...SIGNNG_SIDEBAR, ...SIGNNG_CARD, ...SIGNNG_ALERT, ...SIGNNG_TABLE,
    ...SIGNNG_BREADCRUMB, ...SIGNNG_TOGGLE_GROUP, ...SIGNNG_CAROUSEL, ...SIGNNG_NAVIGATION_MENU, ...SIGNNG_TABS,
    DataTable, ...SIGNNG_ANALYTICS_CHARTS, ...SIGNNG_FILE_UPLOAD, LoginForm,
    StatCard, EmptyState, Timeline, Stepper, NumberInput, MultiSelect, TagInput, TreeView, DateRangePicker,
    Rating, ColorPicker, Kanban, NotificationCenter,
  ],
  templateUrl: './showcase.html',
})
export class Showcase {
  private readonly toast = inject(ToastService);
  protected readonly search = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly q = signal('');
  // per-card Preview|Code tab state
  private readonly tabs = signal<Record<string, 'preview' | 'code'>>({});
  protected mode(name: string): 'preview' | 'code' {
    return this.tabs()[name] ?? 'preview';
  }
  protected setMode(name: string, m: 'preview' | 'code'): void {
    this.tabs.update((t) => ({ ...t, [name]: m }));
  }
  protected match = (name: string) => {
    const q = this.q().toLowerCase().trim();
    return !q || name.toLowerCase().includes(q);
  };
  protected readonly anyMatch = computed(() => this.DEMOS.some((d) => this.match(d.name)));

  protected copy(name: string): void {
    const d = this.DEMOS.find((x) => x.name === name);
    if (d) {
      navigator.clipboard?.writeText(d.code);
      this.toast.success('Copiado', name);
    }
  }
  protected code(name: string): string {
    return this.DEMOS.find((x) => x.name === name)?.code ?? '';
  }

  protected focusSearch(e: Event): void {
    e.preventDefault();
    this.search()?.nativeElement.focus();
  }
  protected notify(msg?: string): void {
    this.toast.success('Toast', msg ?? 'Disparado desde el showcase.');
  }

  // interactive demo state
  protected readonly sw = signal(true);
  protected readonly chk = signal(true);
  protected readonly sld = signal(48);
  protected readonly radio = signal<string | null>('a');
  protected readonly region = signal<string | null>('pe');
  protected readonly fw = signal<string | null>(null);
  protected readonly tog = signal(false);
  protected readonly tabSel = signal('a');
  protected readonly tgroup = signal<string[]>(['list']);
  protected readonly otp = signal('');
  protected readonly date = signal<string | null>('2026-06-15');
  protected readonly page = signal(2);
  protected readonly density = signal<string[]>(['comfortable']);

  protected readonly regions = [
    { value: 'pe', label: 'Perú' }, { value: 'mx', label: 'México' },
    { value: 'ar', label: 'Argentina' }, { value: 'cl', label: 'Chile' },
  ];
  protected readonly frameworks = [
    { value: 'ng', label: 'Angular' }, { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' }, { value: 'svelte', label: 'Svelte' },
  ];
  protected readonly menuItems = [
    { value: 'edit', label: 'Editar' }, { value: 'dup', label: 'Duplicar' }, { value: 'del', label: 'Eliminar' },
  ];
  protected readonly bar = [
    { label: 'Archivo', items: [{ value: 'export', label: 'Exportar' }, { value: 'print', label: 'Imprimir' }] },
    { label: 'Editar', items: [{ value: 'copy', label: 'Copiar' }, { value: 'paste', label: 'Pegar' }] },
  ];
  protected readonly cmds = [
    { value: 'new', label: 'Crear usuario' }, { value: 'bill', label: 'Ir a facturación' },
    { value: 'export', label: 'Exportar datos' },
  ];
  protected readonly ctx = [
    { value: 'copy', label: 'Copiar' }, { value: 'pin', label: 'Fijar' }, { value: 'del', label: 'Eliminar' },
  ];
  protected readonly bars = [
    { label: 'Ene', value: 40 }, { label: 'Feb', value: 55 }, { label: 'Mar', value: 48 },
    { label: 'Abr', value: 70 }, { label: 'May', value: 62 }, { label: 'Jun', value: 80 },
  ];
  protected readonly parts = [
    { label: 'Free', value: 48 }, { label: 'Pro', value: 32 }, { label: 'Team', value: 20 },
  ];
  protected readonly faq = [
    { value: 'a', title: '¿Es accesible?', content: 'Sí. Sigue el patrón WAI-ARIA APG, teclado completo.' },
    { value: 'b', title: '¿Lo puedo editar?', content: 'Es tuyo — el código vive en tu repo.' },
  ];

  // enterprise demo data
  protected readonly tableData = signal<Row[]>([
    { id: 1, name: 'Ana Torres', dept: 'Ventas', sales: 4200, status: 'activo' },
    { id: 2, name: 'Luis Méndez', dept: 'Ventas', sales: 3100, status: 'activo' },
    { id: 3, name: 'Sofía Ruiz', dept: 'Marketing', sales: 2800, status: 'invitado' },
    { id: 4, name: 'Diego Soto', dept: 'Marketing', sales: 5200, status: 'activo' },
    { id: 5, name: 'Elena Vega', dept: 'Soporte', sales: 1900, status: 'suspendido' },
    { id: 6, name: 'Marco Díaz', dept: 'Ventas', sales: 6100, status: 'activo' },
  ]);
  protected readonly tableCols: DataColumn[] = [
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'dept', header: 'Departamento', sortable: true },
    { key: 'sales', header: 'Ventas', sortable: true, editable: true, align: 'right', format: (v) => '$' + Number(v).toLocaleString() },
    { key: 'status', header: 'Estado' },
  ];
  protected readonly mlSeries = [
    { name: '2025', values: [30, 42, 38, 55, 60, 72] },
    { name: '2026', values: [40, 48, 52, 50, 68, 80] },
  ];
  protected readonly mlLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  protected readonly stackSeries = [
    { name: 'Free', values: [20, 25, 22, 30] },
    { name: 'Pro', values: [14, 18, 20, 24] },
    { name: 'Team', values: [6, 8, 10, 12] },
  ];
  protected readonly stackLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
  protected readonly scatter = [
    { x: 10, y: 20 }, { x: 25, y: 35 }, { x: 40, y: 28 }, { x: 55, y: 60 }, { x: 70, y: 52 }, { x: 85, y: 78 }, { x: 30, y: 45 }, { x: 60, y: 30 },
  ];
  protected readonly heat = [[2, 5, 8, 3], [6, 9, 4, 7], [1, 3, 9, 5], [8, 6, 2, 4]];
  protected login(e: unknown): void {
    this.notify('Login: ' + JSON.stringify(e));
  }

  // tier-2 demo state
  protected readonly stepIdx = signal(1);
  protected readonly qty = signal<number | null>(3);
  protected readonly price = signal<number | null>(49.9);
  protected readonly skills = signal<string[]>(['ng', 'ts']);
  protected readonly tags = signal<string[]>(['saas', 'b2b']);
  protected readonly rangeStart = signal<string | null>('2026-06-10');
  protected readonly rangeEnd = signal<string | null>('2026-06-18');
  protected readonly steps = [
    { label: 'Cuenta', description: 'Tus datos' },
    { label: 'Plan', description: 'Elige plan' },
    { label: 'Pago', description: 'Confirmar' },
  ];
  protected readonly skillOpts = [
    { value: 'ng', label: 'Angular' }, { value: 'ts', label: 'TypeScript' },
    { value: 'rx', label: 'RxJS' }, { value: 'css', label: 'Tailwind' }, { value: 'node', label: 'Node' },
  ];
  protected readonly tree = [
    { label: 'src', icon: 'home' as const, children: [
      { label: 'components', children: [{ label: 'button.ts' }, { label: 'dialog.ts' }] },
      { label: 'lib', children: [{ label: 'utils.ts' }] },
    ] },
    { label: 'README.md' },
  ];
  protected readonly feed = [
    { title: 'Usuario creado', time: 'hace 2h', description: 'Ana Torres se unió al equipo.', icon: 'user' as const, variant: 'primary' as const },
    { title: 'Pago recibido', time: 'hace 5h', description: '$290 — plan Pro.', icon: 'check' as const, variant: 'success' as const },
    { title: 'Ticket abierto', time: 'ayer', description: 'Bug en exportación.', icon: 'alert' as const, variant: 'destructive' as const },
  ];

  // tier-3 demo state
  protected readonly stars = signal(4);
  protected readonly brand = signal('#6d4aff');
  protected readonly board = signal<KanbanColumn[]>([
    { id: 'todo', title: 'Por hacer', items: [{ id: 'a', title: 'Diseñar landing', tag: 'design' }, { id: 'b', title: 'Setup CI', tag: 'infra' }] },
    { id: 'doing', title: 'En curso', items: [{ id: 'c', title: 'API de pagos', tag: 'backend' }] },
    { id: 'done', title: 'Hecho', items: [{ id: 'd', title: 'Auth', tag: 'backend' }] },
  ]);
  protected readonly notifs = signal([
    { id: '1', title: 'Nuevo usuario', description: 'Ana se unió al equipo', time: 'hace 2h', icon: 'user' as const },
    { id: '2', title: 'Pago recibido', description: '$290 — plan Pro', time: 'hace 5h', icon: 'check' as const },
    { id: '3', title: 'Backup completo', time: 'ayer', read: true, icon: 'check-circle' as const },
  ]);

  protected readonly CATS = ['Enterprise', 'Avanzados', 'Pro', 'Formularios', 'Overlays', 'Navegación', 'Datos', 'Display', 'Gráficos'];
  protected readonly DEMOS: Demo[] = [
    { name: 'DataTable', cat: 'Enterprise', code: `<signng-data-table [data]="rows" [columns]="cols" [selectable]="true" groupBy="dept" />` },
    { name: 'MultiLineChart', cat: 'Enterprise', code: `<signng-multi-line-chart [series]="series" [labels]="labels" />` },
    { name: 'StackedBarChart', cat: 'Enterprise', code: `<signng-stacked-bar-chart [series]="series" [labels]="labels" />` },
    { name: 'GroupedBarChart', cat: 'Enterprise', code: `<signng-grouped-bar-chart [series]="series" [labels]="labels" />` },
    { name: 'ScatterChart', cat: 'Enterprise', code: `<signng-scatter-chart [data]="points" />` },
    { name: 'Heatmap', cat: 'Enterprise', code: `<signng-heatmap [matrix]="matrix" />` },
    { name: 'FileUpload', cat: 'Enterprise', code: `<signng-file-upload accept="image/*,.pdf" [maxSize]="5242880" (filesChange)="f=$event" />` },
    { name: 'ImageUpload', cat: 'Enterprise', code: `<signng-image-upload [multiple]="true" (filesChange)="imgs=$event" />` },
    { name: 'LoginForm', cat: 'Enterprise', code: `<signng-login-form mode="login" [social]="true" (submitted)="onLogin($event)" />` },

    { name: 'StatCard', cat: 'Avanzados', code: `<signng-stat-card label="MRR" [value]="'$48.2k'" delta="+12%" [up]="true" icon="trending" />` },
    { name: 'Stepper', cat: 'Avanzados', code: `<signng-stepper [steps]="steps" [(current)]="step" [clickable]="true" />` },
    { name: 'NumberInput', cat: 'Avanzados', code: `<signng-number-input [(value)]="qty" [min]="0" prefix="$" />` },
    { name: 'MultiSelect', cat: 'Avanzados', code: `<signng-multi-select [options]="opts" [(value)]="selected" />` },
    { name: 'TagInput', cat: 'Avanzados', code: `<signng-tag-input [(tags)]="tags" />` },
    { name: 'DateRangePicker', cat: 'Avanzados', code: `<signng-date-range-picker [(start)]="from" [(end)]="to" />` },
    { name: 'TreeView', cat: 'Avanzados', code: `<signng-tree-view [nodes]="tree" [defaultOpen]="true" />` },
    { name: 'Timeline', cat: 'Avanzados', code: `<signng-timeline [items]="feed" />` },
    { name: 'EmptyState', cat: 'Avanzados', code: `<signng-empty-state title="Sin datos" icon="search">…</signng-empty-state>` },

    { name: 'Kanban', cat: 'Pro', code: `<signng-kanban [(columns)]="board" (moved)="onMove($event)" />` },
    { name: 'NotificationCenter', cat: 'Pro', code: `<signng-notification-center [(items)]="notifs" />` },
    { name: 'Rating', cat: 'Pro', code: `<signng-rating [(value)]="stars" [max]="5" />` },
    { name: 'ColorPicker', cat: 'Pro', code: `<signng-color-picker [(value)]="brand" />` },

    { name: 'Button', cat: 'Formularios', code: `<button signngButton variant="default">Botón</button>` },
    { name: 'Input', cat: 'Formularios', code: `<input signngInput placeholder="email@ejemplo.com" />` },
    { name: 'Textarea', cat: 'Formularios', code: `<textarea signngTextarea placeholder="Mensaje…"></textarea>` },
    { name: 'Switch', cat: 'Formularios', code: `<signng-switch [(checked)]="on" />` },
    { name: 'Checkbox', cat: 'Formularios', code: `<signng-checkbox [(checked)]="ok" />` },
    { name: 'RadioGroup', cat: 'Formularios', code: `<signng-radio-group [(value)]="v">\n  <signng-radio value="a">A</signng-radio>\n</signng-radio-group>` },
    { name: 'Select', cat: 'Formularios', code: `<signng-select [options]="regions" [(value)]="region" />` },
    { name: 'Slider', cat: 'Formularios', code: `<signng-slider [(value)]="n" [min]="0" [max]="100" />` },
    { name: 'Combobox', cat: 'Formularios', code: `<signng-combobox [options]="frameworks" [(value)]="fw" />` },
    { name: 'InputOtp', cat: 'Formularios', code: `<signng-input-otp [(value)]="code" [length]="4" />` },
    { name: 'FormField', cat: 'Formularios', code: `<signng-form-field label="Nombre" description="Tu nombre">\n  <input signngInput />\n</signng-form-field>` },
    { name: 'Toggle', cat: 'Formularios', code: `<signng-toggle [(pressed)]="b">B</signng-toggle>` },
    { name: 'ToggleGroup', cat: 'Formularios', code: `<signng-toggle-group [(value)]="v">…</signng-toggle-group>` },

    { name: 'Dialog', cat: 'Overlays', code: `<signng-dialog title="Confirmar" triggerLabel="Abrir">…</signng-dialog>` },
    { name: 'AlertDialog', cat: 'Overlays', code: `<signng-alert-dialog title="¿Eliminar?" …>…</signng-alert-dialog>` },
    { name: 'Sheet', cat: 'Overlays', code: `<signng-sheet side="right" triggerLabel="Abrir">…</signng-sheet>` },
    { name: 'Drawer', cat: 'Overlays', code: `<signng-drawer triggerLabel="Abrir">…</signng-drawer>` },
    { name: 'Popover', cat: 'Overlays', code: `<signng-popover triggerLabel="Abrir">…</signng-popover>` },
    { name: 'Tooltip', cat: 'Overlays', code: `<signng-tooltip text="Ayuda"><button signngButton>?</button></signng-tooltip>` },
    { name: 'HoverCard', cat: 'Overlays', code: `<signng-hover-card>…</signng-hover-card>` },
    { name: 'Command', cat: 'Overlays', code: `<signng-command [commands]="cmds" />` },
    { name: 'Toast', cat: 'Overlays', code: `inject(ToastService).success('Guardado')` },

    { name: 'Tabs', cat: 'Navegación', code: `<signng-tabs>…</signng-tabs>` },
    { name: 'Accordion', cat: 'Navegación', code: `<signng-accordion [items]="faq" />` },
    { name: 'DropdownMenu', cat: 'Navegación', code: `<signng-dropdown-menu [items]="items" />` },
    { name: 'ContextMenu', cat: 'Navegación', code: `<signng-context-menu [items]="items">…</signng-context-menu>` },
    { name: 'Menubar', cat: 'Navegación', code: `<signng-menubar [menus]="bar" />` },
    { name: 'NavigationMenu', cat: 'Navegación', code: `<signng-navigation-menu>…</signng-navigation-menu>` },
    { name: 'Breadcrumb', cat: 'Navegación', code: `<nav signngBreadcrumb>…</nav>` },
    { name: 'Pagination', cat: 'Navegación', code: `<signng-pagination [(page)]="p" [total]="10" />` },
    { name: 'Sidebar', cat: 'Navegación', code: `<signng-sidebar>…</signng-sidebar>` },

    { name: 'Calendar', cat: 'Datos', code: `<signng-calendar [(value)]="date" />` },
    { name: 'DatePicker', cat: 'Datos', code: `<signng-date-picker [(value)]="date" />` },
    { name: 'Table', cat: 'Datos', code: `<table signngTable>…</table>` },

    { name: 'Card', cat: 'Display', code: `<div signngCard>…</div>` },
    { name: 'Badge', cat: 'Display', code: `<span signngBadge variant="default">Nuevo</span>` },
    { name: 'Avatar', cat: 'Display', code: `<signng-avatar fallback="GF" />` },
    { name: 'Alert', cat: 'Display', code: `<div signngAlert>…</div>` },
    { name: 'Separator', cat: 'Display', code: `<div signngSeparator></div>` },
    { name: 'Skeleton', cat: 'Display', code: `<signng-skeleton class="h-4 w-40" />` },
    { name: 'Progress', cat: 'Display', code: `<signng-progress [value]="62" />` },
    { name: 'Collapsible', cat: 'Display', code: `<signng-collapsible triggerLabel="Ver más">…</signng-collapsible>` },
    { name: 'ScrollArea', cat: 'Display', code: `<signng-scroll-area>…</signng-scroll-area>` },
    { name: 'AspectRatio', cat: 'Display', code: `<signng-aspect-ratio [ratio]="16/9">…</signng-aspect-ratio>` },
    { name: 'Carousel', cat: 'Display', code: `<signng-carousel>…</signng-carousel>` },
    { name: 'Icon', cat: 'Display', code: `<signng-icon name="heart" [size]="20" />` },

    { name: 'BarChart', cat: 'Gráficos', code: `<signng-bar-chart [data]="bars" [height]="180" />` },
    { name: 'LineChart', cat: 'Gráficos', code: `<signng-line-chart [data]="bars" [height]="180" />` },
    { name: 'DonutChart', cat: 'Gráficos', code: `<signng-donut-chart [data]="parts" />` },
    { name: 'RadialChart', cat: 'Gráficos', code: `<signng-radial-chart [value]="72" [max]="100" />` },
  ];

  protected demosIn(cat: string): Demo[] {
    return this.DEMOS.filter((d) => d.cat === cat);
  }
  protected catHasMatch(cat: string): boolean {
    return this.demosIn(cat).some((d) => this.match(d.name));
  }
}
