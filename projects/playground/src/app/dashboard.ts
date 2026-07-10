import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, Radio } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Combobox } from '@/components/ui/combobox';
import { InputOtp } from '@/components/ui/input-otp';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Sheet } from '@/components/ui/sheet';
import { Popover } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { HoverCard } from '@/components/ui/hover-card';
import { Command } from '@/components/ui/command';
import { ToastService } from '@/components/ui/toast';
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
import { SignngResizable } from '@/components/ui/resizable';
import { Icon } from '@/components/ui/icon';
import { SIGNNG_CHART } from '@/components/ui/chart';
import { Drawer } from '@/components/ui/drawer';
import { FormField } from '@/components/ui/form-field';
import { SIGNNG_SIDEBAR } from '@/components/ui/sidebar';
import { SIGNNG_ANALYTICS_CHARTS } from '@/components/ui/chart-analytics';
import { SIGNNG_TABS } from '@signng/core/tabs';

interface Row {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  usage: number;
}

@Component({
  selector: 'signng-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button, Input, Label, Textarea, Switch, Checkbox, RadioGroup, Radio, Select, Slider, Combobox, InputOtp,
    Dialog, AlertDialog, Sheet, Popover, Tooltip, HoverCard, Command,
    Accordion, DropdownMenu, ContextMenu, Menubar, Pagination, Calendar, DatePicker,
    Avatar, Badge, Separator, Skeleton, Progress, Toggle, Collapsible, ScrollArea, AspectRatio, SignngResizable,
    Icon, Drawer, FormField, ...SIGNNG_CHART, ...SIGNNG_ANALYTICS_CHARTS, ...SIGNNG_SIDEBAR,
    ...SIGNNG_CARD, ...SIGNNG_ALERT, ...SIGNNG_TABLE, ...SIGNNG_BREADCRUMB, ...SIGNNG_TOGGLE_GROUP,
    ...SIGNNG_CAROUSEL, ...SIGNNG_NAVIGATION_MENU, ...SIGNNG_TABS,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly toast = inject(ToastService);

  constructor() {
    // Dark mode must live on <html> so CDK overlays (rendered in <body>, outside the app) inherit it.
    effect(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', this.dark());
      }
    });
    inject(DestroyRef).onDestroy(() => {
      if (typeof document !== 'undefined') document.documentElement.classList.remove('dark');
    });
  }

  protected readonly tab = signal('overview');
  protected readonly period = signal<string[]>(['month']);

  // Sidebar-driven dashboard variants — Resumen (existing) vs Analítica (charts-heavy).
  protected readonly view = signal<'overview' | 'analytics'>('overview');
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
  protected readonly dark = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly notifications = signal(true);
  protected readonly twoFactor = signal('');
  protected readonly region = signal<string | null>('pe');
  protected readonly framework = signal<string | null>(null);
  protected readonly budget = signal(60);
  protected readonly plan = signal<string | null>('pro');
  protected readonly density = signal<string[]>(['comfortable']);
  protected readonly bold = signal(false);
  protected readonly notes = signal('');
  protected readonly date = signal<string | null>('2026-06-15');
  protected readonly page = signal(1);

  protected readonly bar = [
    { label: 'Archivo', items: [{ value: 'export', label: 'Exportar CSV' }, { value: 'print', label: 'Imprimir' }] },
    { label: 'Editar', items: [{ value: 'invite', label: 'Invitar usuario' }, { value: 'bulk', label: 'Acción masiva' }] },
    { label: 'Ver', items: [{ value: 'compact', label: 'Vista compacta' }, { value: 'cards', label: 'Vista tarjetas' }] },
  ];
  protected readonly menu = [
    { value: 'edit', label: 'Editar' },
    { value: 'duplicate', label: 'Duplicar' },
    { value: 'archive', label: 'Archivar' },
  ];
  protected readonly ctx = [
    { value: 'copy', label: 'Copiar fila' },
    { value: 'pin', label: 'Fijar' },
    { value: 'delete', label: 'Eliminar' },
  ];
  protected readonly commands = [
    { value: 'new-user', label: 'Crear usuario' },
    { value: 'billing', label: 'Ir a facturación' },
    { value: 'export', label: 'Exportar datos' },
    { value: 'settings', label: 'Abrir preferencias' },
    { value: 'logout', label: 'Cerrar sesión' },
  ];
  protected readonly regions = [
    { value: 'pe', label: 'Perú' },
    { value: 'mx', label: 'México' },
    { value: 'ar', label: 'Argentina' },
    { value: 'cl', label: 'Chile' },
  ];
  protected readonly frameworks = [
    { value: 'ng', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
  ];
  protected readonly faq = [
    { value: 'a', title: 'Política de retención', content: 'Los datos se retienen 90 días tras la baja.' },
    { value: 'b', title: 'Exportación GDPR', content: 'Export completo en JSON bajo el Art. 20.' },
  ];
  protected readonly stats = [
    { label: 'MRR', value: '$48.2k', delta: '+12%', good: true, goal: 72, trend: [30, 42, 38, 55, 60, 72] },
    { label: 'Usuarios activos', value: '3,940', delta: '+4%', good: true, goal: 58, trend: [40, 44, 50, 48, 54, 58] },
    { label: 'Churn', value: '2.1%', delta: '-0.3%', good: true, goal: 21, trend: [35, 30, 28, 25, 23, 21] },
    { label: 'Tickets', value: '38', delta: '+9', good: false, goal: 44, trend: [20, 26, 30, 34, 40, 44] },
  ];
  protected readonly chartBars = [
    { label: 'Ene', value: 40 }, { label: 'Feb', value: 55 }, { label: 'Mar', value: 48 },
    { label: 'Abr', value: 70 }, { label: 'May', value: 62 }, { label: 'Jun', value: 80 },
  ];
  protected readonly lineData = [
    { label: 'L', value: 12 }, { label: 'M', value: 19 }, { label: 'X', value: 15 },
    { label: 'J', value: 27 }, { label: 'V', value: 22 }, { label: 'S', value: 31 }, { label: 'D', value: 28 },
  ];
  protected readonly donutData = [
    { label: 'Free', value: 48 }, { label: 'Pro', value: 32 }, { label: 'Team', value: 20 },
  ];
  protected readonly rows: Row[] = [
    { id: 1, name: 'Giorgi Franck', email: 'giorgi@example.com', role: 'Owner', status: 'active', usage: 82 },
    { id: 2, name: 'Ana Torres', email: 'ana@example.com', role: 'Admin', status: 'active', usage: 64 },
    { id: 3, name: 'Luis Méndez', email: 'luis@example.com', role: 'Editor', status: 'invited', usage: 12 },
    { id: 4, name: 'Sofía Ruiz', email: 'sofia@example.com', role: 'Viewer', status: 'suspended', usage: 0 },
  ];
  protected readonly logs = Array.from({ length: 14 }, (_, i) => `[12:0${i}] evento ${i + 1} procesado`);

  protected statusVariant(s: Row['status']): 'default' | 'secondary' | 'destructive' {
    return s === 'active' ? 'default' : s === 'invited' ? 'secondary' : 'destructive';
  }
  protected notify(msg: string): void {
    this.toast.success('Acción', msg);
  }
  protected initials(name: string): string {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  }
}
