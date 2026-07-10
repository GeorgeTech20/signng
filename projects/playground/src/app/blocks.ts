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
import { CodeBlock } from '@/components/ui/code-block';

type BlockKey = 'Auth' | 'Pricing' | 'Settings' | 'Stats' | 'Mail' | 'Cards';

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
    ...SIGNNG_CARD, ...SIGNNG_CHART, CodeBlock,
  ],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <div class="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
        <a routerLink="/" class="mr-3 flex items-center gap-2 font-bold hover:opacity-80"><span class="text-primary"><signng-icon name="bar" [size]="18" /></span> Blocks</a>
        @for (b of BLOCKS_META; track b.key) {
          <a [href]="'/blocks#b-' + b.key" class="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">{{ b.key }}</a>
        }
      </div>

      <!-- Centered hero (shadcn /blocks pattern): the page presents blocks as artifacts, it isn't the app itself -->
      <header class="fade-up mx-auto max-w-3xl px-6 pb-10 pt-16 text-center">
        <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">Bloques listos para <span class="text-primary">copiar y poseer</span></h1>
        <p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Páginas completas compuestas con componentes signng — mismo registry firmado, mismo CLI, cero dependencias extra.
        </p>
        <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a signngButton routerLink="/dashboard">Ver dashboard →</a>
          <a signngButton variant="outline" routerLink="/">Ver componentes</a>
        </div>
      </header>

      <div class="mx-auto max-w-6xl space-y-16 px-4 pb-24">
        @for (b of BLOCKS_META; track b.key) {
          <section [id]="'b-' + b.key" class="reveal scroll-mt-16">
            <!-- Per-block toolbar: mode, description, device, install command -->
            <div class="mb-3 flex flex-wrap items-center gap-3">
              <div class="flex rounded-md bg-muted p-0.5 text-xs">
                <button (click)="setMode(b.key, 'preview')" [class]="'rounded px-2 py-1 ' + (modeOf(b.key) === 'preview' ? 'bg-background shadow-sm' : 'text-muted-foreground')">Preview</button>
                <button (click)="setMode(b.key, 'code')" [class]="'rounded px-2 py-1 ' + (modeOf(b.key) === 'code' ? 'bg-background shadow-sm' : 'text-muted-foreground')">Code</button>
              </div>
              <span class="text-sm text-muted-foreground">{{ b.desc }}</span>
              <div class="ml-auto flex items-center gap-2">
                <div class="flex items-center gap-1 rounded-md border border-border p-0.5">
                  @for (d of DEVICES; track d.key) {
                    <button
                      (click)="setDevice(b.key, d.key)"
                      [attr.aria-label]="d.label"
                      [attr.aria-pressed]="deviceOf(b.key) === d.key"
                      [class]="'inline-flex size-7 items-center justify-center rounded ' + (deviceOf(b.key) === d.key ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50')"
                    >
                      <signng-icon [name]="d.icon" [size]="15" />
                    </button>
                  }
                </div>
                <code class="hidden rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs lg:block">pnpm signng add {{ b.install }}</code>
              </div>
            </div>

            <!-- Framed preview: the block renders inside a bounded container, not full-bleed -->
            <div class="overflow-hidden rounded-xl border border-border shadow-sm">
              @if (modeOf(b.key) === 'code') {
                <signng-code [code]="CODE[b.key]" />
              } @else {
                <!-- @container: block layouts use container-query variants (@lg:/@2xl:/@4xl:), so the
                     Desktop/Tablet/Mobile toggle re-flows them regardless of viewport width. -->
                <div [class]="'@container mx-auto overflow-x-auto transition-[max-width] duration-200 ' + DEVICE_WIDTH[deviceOf(b.key)]">
                @switch (b.key) {
        <!-- ============ AUTH ============ -->
        @case ('Auth') {
          <div class="fade-up grid min-h-[560px] @4xl:grid-cols-2">
            <div class="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground @4xl:flex">
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
            <div class="mt-10 grid gap-6 @2xl:grid-cols-3">
              @for (t of tiers; track t.name) {
                <div signngCard [class]="t.popular ? 'relative border-primary shadow-lg' : ''">
                  @if (t.popular) { <span signngBadge class="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">Más popular</span> }
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
            <div class="mt-6 grid gap-8 @2xl:grid-cols-[180px_1fr]">
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
                  <div class="grid gap-4 @lg:grid-cols-2">
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
            <div class="mt-6 grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
              <signng-stat-card label="MRR" [value]="'$48.2k'" delta="+12%" [up]="true" icon="trending" />
              <signng-stat-card label="Usuarios" [value]="'3,940'" delta="+4%" [up]="true" icon="users" />
              <signng-stat-card label="Churn" [value]="'2.1%'" delta="-0.3%" [up]="false" icon="trending" />
              <signng-stat-card label="Tickets" [value]="38" delta="+9" [up]="false" icon="bell" />
            </div>
            <div class="mt-6 grid gap-4 @4xl:grid-cols-3">
              <div signngCard class="@4xl:col-span-2">
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
          <div class="grid h-[560px] grid-cols-1 @2xl:grid-cols-[320px_1fr]">
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
            <div class="mt-6 grid gap-5 @2xl:grid-cols-3">
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
              <div signngCard class="@2xl:col-span-2">
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
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
})
export class Blocks {
  protected readonly BLOCKS_META: Array<{ key: BlockKey; desc: string; install: string }> = [
    { key: 'Auth', desc: 'Login con panel de marca y proveedores sociales', install: 'login-form' },
    { key: 'Pricing', desc: 'Tres planes con destacado y lista de features', install: 'card badge button' },
    { key: 'Settings', desc: 'Página de configuración con navegación lateral', install: 'card input switch' },
    { key: 'Stats', desc: 'KPIs con sparkline + gráficos de barras y donut', install: 'stat-card chart' },
    { key: 'Mail', desc: 'Bandeja de entrada de dos paneles', install: 'avatar badge separator' },
    { key: 'Cards', desc: 'Patrones de tarjeta compuestos', install: 'card chart switch' },
  ];

  // Per-block Preview|Code + device state (each framed section is independent, shadcn-style).
  private readonly modes = signal<Record<string, 'preview' | 'code'>>({});
  private readonly devices = signal<Record<string, 'desktop' | 'tablet' | 'mobile'>>({});
  protected modeOf(k: string): 'preview' | 'code' {
    return this.modes()[k] ?? 'preview';
  }
  protected setMode(k: string, m: 'preview' | 'code'): void {
    this.modes.update((s) => ({ ...s, [k]: m }));
  }
  protected deviceOf(k: string): 'desktop' | 'tablet' | 'mobile' {
    return this.devices()[k] ?? 'desktop';
  }
  protected setDevice(k: string, d: 'desktop' | 'tablet' | 'mobile'): void {
    this.devices.update((s) => ({ ...s, [k]: d }));
  }

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
  protected readonly CODE: Record<'Auth' | 'Pricing' | 'Settings' | 'Stats' | 'Mail' | 'Cards', string> = {
    Auth: `<div class="grid lg:grid-cols-2">
  <div class="bg-primary p-10 text-primary-foreground">
    <blockquote>"…"</blockquote>
  </div>
  <signng-login-form mode="login" [social]="true" />
</div>`,
    Pricing: `@for (t of tiers; track t.name) {
  <div signngCard [class]="t.popular ? 'border-primary shadow-lg' : ''">
    <div signngCardHeader>
      <span signngCardTitle>{{ t.name }}</span>
      <span signngCardDescription>{{ t.tagline }}</span>
    </div>
    <div signngCardContent>
      <button signngButton [variant]="t.popular ? 'default' : 'outline'">{{ t.cta }}</button>
      @for (f of t.features; track f) { <li>{{ f }}</li> }
    </div>
  </div>
}`,
    Settings: `<nav>
  @for (s of ['Perfil','Cuenta','Notificaciones']; track s) {
    <a>{{ s }}</a>
  }
</nav>
<div signngCard>
  <div signngCardHeader><span signngCardTitle>Perfil</span></div>
  <div signngCardContent>
    <input signngInput [(value)]="name" />
    <signng-switch [(checked)]="pub" />
  </div>
</div>`,
    Stats: `<signng-stat-card label="MRR" value="$48.2k" delta="+12%" [up]="true" icon="trending" />
<div signngCard>
  <div signngCardContent><signng-bar-chart [data]="bars" /></div>
</div>`,
    Mail: `<div class="grid md:grid-cols-[320px_1fr]">
  <div>
    @for (m of inbox; track m.id) {
      <button (click)="openMail.set(m.id)">
        <signng-avatar [fallback]="m.fallback" />
        <span>{{ m.subject }}</span>
      </button>
    }
  </div>
  <div><!-- selected message body --></div>
</div>`,
    Cards: `<div signngCard>
  <div signngCardHeader class="flex-row items-center gap-3">
    <signng-avatar fallback="GF" />
    <span signngCardTitle>Giorgi Franck</span>
    <span signngBadge class="ml-auto">Pro</span>
  </div>
</div>
<div signngCard class="md:col-span-2">
  <signng-line-chart [data]="bars" />
</div>`,
  };
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
