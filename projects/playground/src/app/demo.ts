import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, Radio } from '@/components/ui/radio-group';
import { Dialog } from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { Popover } from '@/components/ui/popover';
import { Sheet } from '@/components/ui/sheet';
import { Accordion } from '@/components/ui/accordion';
import { Select } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Calendar } from '@/components/ui/calendar';
import { DatePicker } from '@/components/ui/date-picker';
import { SIGNNG_BREADCRUMB } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { Command } from '@/components/ui/command';
import { Toggle } from '@/components/ui/toggle';
import { Collapsible } from '@/components/ui/collapsible';
import { HoverCard } from '@/components/ui/hover-card';
import { SIGNNG_TOGGLE_GROUP } from '@/components/ui/toggle-group';
import { ContextMenu } from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { InputOtp } from '@/components/ui/input-otp';
import { SIGNNG_CAROUSEL } from '@/components/ui/carousel';
import { SignngResizable } from '@/components/ui/resizable';
import { Menubar } from '@/components/ui/menubar';
import { SIGNNG_NAVIGATION_MENU } from '@/components/ui/navigation-menu';
import { SIGNNG_CARD } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Toaster, ToastService } from '@/components/ui/toast';
import { SIGNNG_ALERT } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { SIGNNG_TABLE } from '@/components/ui/table';
import { SIGNNG_TABS } from '@signng/core/tabs';

/** Fase 0 demo — exercises every component once (the original Playwright a11y/behavior fixture). Routed at /demo. */
@Component({
  selector: 'signng-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button, Slider, Switch, Checkbox, Input, Label, Textarea,
    RadioGroup, Radio, Dialog, Tooltip, Popover, Accordion, Select,
    Badge, Separator, Avatar, AlertDialog, DropdownMenu, Sheet, Toaster,
    Skeleton, Progress, Combobox, Calendar, DatePicker, Pagination, Command,
    Toggle, Collapsible, HoverCard, ContextMenu, ScrollArea, AspectRatio,
    InputOtp, SignngResizable, Menubar,
    ...SIGNNG_NAVIGATION_MENU, ...SIGNNG_CAROUSEL, ...SIGNNG_TOGGLE_GROUP, ...SIGNNG_BREADCRUMB, ...SIGNNG_ALERT,
    ...SIGNNG_TABLE, ...SIGNNG_CARD, ...SIGNNG_TABS,
  ],
  templateUrl: './demo.html',
})
export class Demo {
  protected readonly volume = signal(40);
  protected readonly selectedTab = signal<string>('overview');
  protected readonly notifications = signal(true);
  protected readonly terms = signal(false);
  protected readonly plan = signal<string | null>('free');
  protected readonly country = signal<string | null>(null);
  protected readonly tech = signal<string | null>(null);
  protected readonly date = signal<string | null>('2026-06-15');
  protected readonly dob = signal<string | null>(null);
  protected readonly bold = signal(false);
  protected readonly otp = signal('');
  protected readonly barAction = signal('');
  protected readonly barMenus = [
    { label: 'Archivo', items: [{ value: 'new', label: 'Nuevo' }, { value: 'open', label: 'Abrir' }] },
    { label: 'Editar', items: [{ value: 'undo', label: 'Deshacer' }, { value: 'redo', label: 'Rehacer' }] },
  ];
  protected readonly slide = signal(0);
  protected readonly splitPct = signal(40);
  protected readonly align = signal<string[]>(['left']);
  protected readonly ctxAction = signal('');
  protected readonly ctxItems = [
    { value: 'copy', label: 'Copiar' },
    { value: 'paste', label: 'Pegar' },
    { value: 'delete', label: 'Eliminar' },
  ];
  protected readonly currentPage = signal(3);
  protected readonly lastCmd = signal('');
  protected readonly cmds = [
    { value: 'new', label: 'Nuevo archivo' },
    { value: 'open', label: 'Abrir…' },
    { value: 'save', label: 'Guardar' },
    { value: 'settings', label: 'Preferencias' },
    { value: 'logout', label: 'Cerrar sesión' },
  ];
  protected readonly frameworks = [
    { value: 'ng', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
  ];
  protected readonly faq = [
    { value: 'a', title: '¿Qué es signng?', content: 'Librería de componentes Angular signals-native.' },
    { value: 'b', title: '¿Es accesible?', content: 'Sí — WCAG 2.2 AA, axe en CI, a11y heredada de @angular/aria.' },
    { value: 'c', title: '¿Cómo se instala?', content: 'Por CLI con verificación de firma + SRI.' },
  ];
  protected readonly countries = [
    { value: 'pe', label: 'Perú' },
    { value: 'mx', label: 'México' },
    { value: 'ar', label: 'Argentina' },
  ];
  protected readonly lastAction = signal('');
  protected readonly menuItems = [
    { value: 'edit', label: 'Editar' },
    { value: 'share', label: 'Compartir' },
    { value: 'archive', label: 'Archivar' },
  ];

  private readonly toast = inject(ToastService);
  protected notify(): void {
    this.toast.success('Guardado', 'Cambios guardados correctamente.');
  }
}
