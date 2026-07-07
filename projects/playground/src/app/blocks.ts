import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/components/ui/icon';
import { LoginForm } from '@/components/ui/login-form';
import { StatCard } from '@/components/ui/stat-card';
import { SIGNNG_CARD } from '@/components/ui/card';
import { SIGNNG_CHART } from '@/components/ui/chart';

/**
 * Blocks gallery — full-page composed templates (shadcn "blocks" style) assembled from signng components:
 * Auth (split brand panel + login), Pricing (3 tiers), Settings (nav + profile form), Stats (KPI grid +
 * chart). A sub-nav switches between them. Pure demo (lives in the playground), not a registry item.
 */
@Component({
  selector: 'signng-blocks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, Button, Input, Label, Textarea, Switch, Avatar, Badge, Separator, Icon, LoginForm, StatCard,
    ...SIGNNG_CARD, ...SIGNNG_CHART,
  ],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <div class="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
        <a routerLink="/" class="mr-3 flex items-center gap-2 font-bold hover:opacity-80"><span class="text-primary"><signng-icon name="bar" [size]="18" /></span> Blocks</a>
        @for (b of BLOCKS; track b) {
          <button (click)="block.set(b)" [class]="'rounded-md px-3 py-1.5 text-sm ' + (block() === b ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50')">{{ b }}</button>
        }
        <div class="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
          @for (d of DEVICES; track d.key) {
            <button
              (click)="device.set(d.key)"
              [attr.aria-label]="d.label"
              [attr.aria-pressed]="device() === d.key"
              [class]="'inline-flex size-7 items-center justify-center rounded ' + (device() === d.key ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50')"
            >
              <signng-icon [name]="d.icon" [size]="15" />
            </button>
          }
        </div>
      </div>

      <div [class]="'mx-auto overflow-x-auto transition-[max-width] duration-200 ' + DEVICE_WIDTH[device()]">
      @switch (block()) {
        <!-- ============ AUTH ============ -->
        @case ('Auth') {
          <div class="fade-up grid min-h-[calc(100vh-49px)] lg:grid-cols-2">
            <div class="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
              <div class="flex items-center gap-2 text-lg font-bold"><signng-icon name="bar" [size]="22" /> signng</div>
              <div>
                <blockquote class="text-2xl font-medium leading-snug">"Enviamos UI accesible en días, no meses. El registry firmado pasó la auditoría enterprise sin fricción."</blockquote>
                <p class="mt-4 text-sm opacity-80">— Equipo de plataforma, fintech LatAm</p>
              </div>
            </div>
            <div class="flex items-center justify-center p-8">
              <signng-login-form mode="login" [social]="true" />
            </div>
          </div>
        }

        <!-- ============ PRICING ============ -->
        @case ('Pricing') {
          <div class="fade-up mx-auto max-w-5xl px-6 py-14">
            <div class="text-center">
              <h1 class="text-3xl font-bold tracking-tight">Precios simples y transparentes</h1>
              <p class="mt-3 text-muted-foreground">Empieza gratis. Escala cuando crezcas.</p>
            </div>
            <div class="mt-10 grid gap-6 md:grid-cols-3">
              @for (t of tiers; track t.name) {
                <div signngCard [class]="t.popular ? 'relative border-primary shadow-lg' : ''">
                  @if (t.popular) { <span signngBadge class="absolute -top-2.5 left-1/2 -translate-x-1/2">Más popular</span> }
                  <div signngCardHeader>
                    <span signngCardTitle>{{ t.name }}</span>
                    <span signngCardDescription>{{ t.tagline }}</span>
                  </div>
                  <div signngCardContent class="space-y-4">
                    <div><span class="text-3xl font-bold">{{ t.price }}</span><span class="text-muted-foreground">/mes</span></div>
                    <button signngButton [variant]="t.popular ? 'default' : 'outline'" class="w-full">{{ t.cta }}</button>
                    <ul class="space-y-2 text-sm">
                      @for (f of t.features; track f) {
                        <li class="flex items-center gap-2"><span class="text-primary"><signng-icon name="check" [size]="15" /></span>{{ f }}</li>
                      }
                    </ul>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ============ SETTINGS ============ -->
        @case ('Settings') {
          <div class="fade-up mx-auto max-w-4xl px-6 py-10">
            <h1 class="text-2xl font-bold tracking-tight">Configuración</h1>
            <p class="text-muted-foreground">Administra tu perfil y preferencias.</p>
            <div class="mt-6 grid gap-8 md:grid-cols-[180px_1fr]">
              <nav class="space-y-1 text-sm">
                @for (s of ['Perfil','Cuenta','Notificaciones','Facturación']; track s; let i = $index) {
                  <a href="#" [class]="'block rounded-md px-3 py-2 ' + (i === 0 ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/50')">{{ s }}</a>
                }
              </nav>
              <div signngCard>
                <div signngCardHeader><span signngCardTitle>Perfil</span><span signngCardDescription>Visible públicamente.</span></div>
                <div signngCardContent class="space-y-5">
                  <div class="flex items-center gap-4">
                    <signng-avatar fallback="GF" alt="Giorgi" class="size-16 text-xl" />
                    <button signngButton variant="outline" size="sm">Cambiar foto</button>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="space-y-1.5"><label signngLabel for="b-name">Nombre</label><input signngInput id="b-name" value="Giorgi Franck" /></div>
                    <div class="space-y-1.5"><label signngLabel for="b-email">Email</label><input signngInput id="b-email" type="email" value="giorgi@example.com" /></div>
                  </div>
                  <div class="space-y-1.5"><label signngLabel for="b-bio">Bio</label><textarea signngTextarea id="b-bio" placeholder="Cuéntanos sobre ti…"></textarea></div>
                  <hr signngSeparator />
                  <div class="space-y-3">
                    <div class="flex items-center justify-between"><div><div class="text-sm font-medium">Perfil público</div><div class="text-xs text-muted-foreground">Cualquiera puede verlo.</div></div><signng-switch ariaLabelledby="b-pub" [(checked)]="pub" /><span id="b-pub" class="sr-only">Perfil público</span></div>
                    <div class="flex items-center justify-between"><div><div class="text-sm font-medium">Emails de producto</div><div class="text-xs text-muted-foreground">Novedades y tips.</div></div><signng-switch ariaLabelledby="b-mail" [(checked)]="mails" /><span id="b-mail" class="sr-only">Emails</span></div>
                  </div>
                  <div class="flex justify-end gap-2"><button signngButton variant="outline">Cancelar</button><button signngButton>Guardar</button></div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ============ STATS ============ -->
        @case ('Stats') {
          <div class="fade-up mx-auto max-w-5xl px-6 py-10">
            <h1 class="text-2xl font-bold tracking-tight">Resumen</h1>
            <p class="text-muted-foreground">Métricas clave del último mes.</p>
            <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <signng-stat-card label="MRR" [value]="'$48.2k'" delta="+12%" [up]="true" icon="trending" />
              <signng-stat-card label="Usuarios" [value]="'3,940'" delta="+4%" [up]="true" icon="users" />
              <signng-stat-card label="Churn" [value]="'2.1%'" delta="-0.3%" [up]="false" icon="trending" />
              <signng-stat-card label="Tickets" [value]="38" delta="+9" [up]="false" icon="bell" />
            </div>
            <div class="mt-6 grid gap-4 lg:grid-cols-3">
              <div signngCard class="lg:col-span-2">
                <div signngCardHeader class="pb-2"><span signngCardTitle class="text-sm">Ingresos por mes</span></div>
                <div signngCardContent class="pt-0"><signng-bar-chart [data]="bars" /></div>
              </div>
              <div signngCard>
                <div signngCardHeader class="pb-2"><span signngCardTitle class="text-sm">Planes</span></div>
                <div signngCardContent class="pt-0"><signng-donut-chart [data]="parts" /></div>
              </div>
            </div>
          </div>
        }

        <!-- ============ MAIL ============ -->
        @case ('Mail') {
          <div class="grid h-[calc(100vh-49px)] grid-cols-1 md:grid-cols-[320px_1fr]">
            <div class="overflow-auto border-r border-border">
              <div class="border-b border-border px-4 py-3 font-semibold">Bandeja de entrada</div>
              @for (m of inbox; track m.id) {
                <button (click)="openMail.set(m.id)" [class]="'flex w-full gap-3 border-b border-border px-4 py-3 text-left hover:bg-accent ' + (openMail() === m.id ? 'bg-accent' : '')">
                  <signng-avatar [fallback]="m.fallback" [alt]="m.from" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <span class="truncate text-sm font-medium">{{ m.from }}</span>
                      <span class="shrink-0 text-xs text-muted-foreground">{{ m.time }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      @if (m.unread) { <span class="size-1.5 shrink-0 rounded-full bg-primary"></span> }
                      <span class="truncate text-sm">{{ m.subject }}</span>
                    </div>
                    <p class="truncate text-xs text-muted-foreground">{{ m.preview }}</p>
                  </div>
                </button>
              }
            </div>
            <div class="overflow-auto p-8">
              @for (m of inbox; track m.id) {
                @if (openMail() === m.id) {
                  <div class="mx-auto max-w-2xl">
                    <div class="flex items-center gap-3">
                      <signng-avatar [fallback]="m.fallback" [alt]="m.from" class="size-12 text-base" />
                      <div><div class="font-semibold">{{ m.from }}</div><div class="text-sm text-muted-foreground">para mí · {{ m.time }}</div></div>
                      <span signngBadge variant="secondary" class="ml-auto">Bandeja</span>
                    </div>
                    <h2 class="mt-5 text-xl font-bold">{{ m.subject }}</h2>
                    <p class="mt-3 leading-relaxed text-muted-foreground">{{ m.preview }} Lorem ipsum dolor sit amet, consectetur adipiscing elit. El contenido completo del correo iría aquí, renderizado de forma segura como texto.</p>
                    <hr signngSeparator class="my-6" />
                    <div class="flex gap-2"><button signngButton>Responder</button><button signngButton variant="outline">Archivar</button></div>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- ============ CARDS ============ -->
        @case ('Cards') {
          <div class="fade-up mx-auto max-w-5xl px-6 py-10">
            <h1 class="text-2xl font-bold tracking-tight">Cards</h1>
            <p class="text-muted-foreground">Patrones de tarjeta compuestos.</p>
            <div class="mt-6 grid gap-5 md:grid-cols-3">
              <signng-stat-card label="Ingresos" [value]="'$48.2k'" delta="+12%" [up]="true" icon="trending" hint="vs mes anterior" />
              <div signngCard>
                <div signngCardHeader><span signngCardTitle>Crear proyecto</span><span signngCardDescription>Despliega en un click.</span></div>
                <div signngCardContent class="space-y-2">
                  <label signngLabel for="c-name">Nombre</label>
                  <input signngInput id="c-name" placeholder="mi-proyecto" />
                </div>
                <div signngCardFooter class="justify-between"><button signngButton variant="outline" size="sm">Cancelar</button><button signngButton size="sm">Crear</button></div>
              </div>
              <div signngCard>
                <div signngCardHeader class="flex-row items-center gap-3">
                  <signng-avatar fallback="GF" alt="Giorgi" />
                  <div><div signngCardTitle class="text-base">Giorgi Franck</div><div signngCardDescription>Owner</div></div>
                  <span signngBadge class="ml-auto">Pro</span>
                </div>
                <div signngCardContent class="text-sm text-muted-foreground">Construye MLM Suite + signng. 3 repos activos.</div>
              </div>
              <div signngCard class="md:col-span-2">
                <div signngCardHeader class="pb-2"><span signngCardTitle class="text-sm">Actividad semanal</span></div>
                <div signngCardContent class="pt-0"><signng-line-chart [data]="bars" /></div>
              </div>
              <div signngCard>
                <div signngCardHeader><span signngCardTitle>Notificaciones</span></div>
                <div signngCardContent class="space-y-3 text-sm">
                  <div class="flex items-center justify-between"><span>Email</span><signng-switch ariaLabel="Email" [(checked)]="pub" /></div>
                  <div class="flex items-center justify-between"><span>Push</span><signng-switch ariaLabel="Push" [(checked)]="mails" /></div>
                </div>
              </div>
            </div>
          </div>
        }
      }
      </div>
    </div>
  `,
})
export class Blocks {
  protected readonly BLOCKS = ['Auth', 'Pricing', 'Settings', 'Stats', 'Mail', 'Cards'] as const;
  protected readonly block = signal<'Auth' | 'Pricing' | 'Settings' | 'Stats' | 'Mail' | 'Cards'>('Auth');

  protected readonly DEVICES = [
    { key: 'desktop' as const, label: 'Desktop', icon: 'monitor' as const },
    { key: 'tablet' as const, label: 'Tablet', icon: 'tablet' as const },
    { key: 'mobile' as const, label: 'Mobile', icon: 'smartphone' as const },
  ];
  protected readonly DEVICE_WIDTH: Record<'desktop' | 'tablet' | 'mobile', string> = {
    desktop: 'max-w-none',
    tablet: 'max-w-3xl border-x border-border',
    mobile: 'max-w-sm border-x border-border',
  };
  protected readonly device = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  protected readonly openMail = signal('1');
  protected readonly inbox = [
    { id: '1', from: 'Ana Torres', subject: 'Propuesta Q3 lista', preview: 'Adjunto el plan trimestral con métricas…', time: '10:24', unread: true, fallback: 'AT' },
    { id: '2', from: 'Soporte', subject: 'Tu ticket #4821 fue resuelto', preview: 'Hemos cerrado tu incidencia de export…', time: '09:02', unread: true, fallback: 'SP' },
    { id: '3', from: 'Diego Soto', subject: 'Re: Demo del viernes', preview: 'Perfecto, confirmo asistencia a las 3pm.', time: 'ayer', unread: false, fallback: 'DS' },
  ];
  protected readonly pub = signal(true);
  protected readonly mails = signal(false);

  protected readonly tiers = [
    { name: 'Free', tagline: 'Para empezar', price: '$0', cta: 'Empezar', popular: false, features: ['10 componentes', 'Tema claro/oscuro', 'Comunidad'] },
    { name: 'Pro', tagline: 'Para equipos', price: '$29', cta: 'Probar Pro', popular: true, features: ['Todos los componentes', 'Registry firmado', 'i18n + a11y', 'Soporte prioritario'] },
    { name: 'Team', tagline: 'Para empresas', price: '$99', cta: 'Contactar', popular: false, features: ['Todo lo de Pro', 'SSO + auditoría', 'SLA 99.9%', 'Onboarding'] },
  ];
  protected readonly bars = [
    { label: 'Ene', value: 40 }, { label: 'Feb', value: 55 }, { label: 'Mar', value: 48 },
    { label: 'Abr', value: 70 }, { label: 'May', value: 62 }, { label: 'Jun', value: 80 },
  ];
  protected readonly parts = [
    { label: 'Free', value: 48 }, { label: 'Pro', value: 32 }, { label: 'Team', value: 20 },
  ];
}
