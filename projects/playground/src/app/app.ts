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

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button, Slider, Switch, Checkbox, Input, Label, Textarea,
    RadioGroup, Radio, Dialog, Tooltip, Popover, Accordion, Select,
    Badge, Separator, Avatar, AlertDialog, DropdownMenu, Sheet, Toaster,
    Skeleton, Progress, Combobox, Calendar, DatePicker,
    ...SIGNNG_ALERT, ...SIGNNG_TABLE, ...SIGNNG_CARD, ...SIGNNG_TABS,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly volume = signal(40);
  protected readonly selectedTab = signal<string>('overview');
  protected readonly notifications = signal(true);
  protected readonly terms = signal(false);
  protected readonly plan = signal<string | null>('free');
  protected readonly country = signal<string | null>(null);
  protected readonly tech = signal<string | null>(null);
  protected readonly date = signal<string | null>('2026-06-15');
  protected readonly dob = signal<string | null>(null);
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
