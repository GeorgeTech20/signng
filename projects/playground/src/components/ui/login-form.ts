import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SIGNNG_CARD } from '@/components/ui/card';

export interface AuthSubmit {
  mode: 'login' | 'signup' | 'forgot';
  name?: string;
  email: string;
  password?: string;
  remember?: boolean;
}

/**
 * LoginForm (helm block) — a composed auth card (shadcn-"blocks" style) over the SignNG primitives
 * (Card, Input, Label, Button). One component, three `mode`s: login / signup / forgot. Optional social
 * providers. Emits a typed `submitted` payload; the host owns the actual auth call. Native form semantics
 * (Enter submits), proper `autocomplete` tokens + `type=password`, signals-only, OnPush.
 */
@Component({
  selector: 'signng-login-form',
  imports: [Button, Input, Label, ...SIGNNG_CARD],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div signngCard class="mx-auto w-full max-w-sm">
      <div signngCardHeader class="text-center">
        <span signngCardTitle class="text-xl">{{ title() || defaultTitle() }}</span>
        <span signngCardDescription>{{ description() || defaultDesc() }}</span>
      </div>
      <div signngCardContent>
        <form (submit)="onSubmit($event)" class="space-y-4">
          @if (mode() === 'signup') {
            <div class="space-y-1.5">
              <label signngLabel for="lf-name">Nombre</label>
              <input signngInput id="lf-name" name="name" autocomplete="name" placeholder="Tu nombre" [value]="name()" (input)="name.set($any($event.target).value)" />
            </div>
          }
          <div class="space-y-1.5">
            <label signngLabel for="lf-email">Email</label>
            <input signngInput id="lf-email" name="email" type="email" autocomplete="email" required placeholder="email@ejemplo.com" [value]="email()" (input)="email.set($any($event.target).value)" />
          </div>
          @if (mode() !== 'forgot') {
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label signngLabel for="lf-pass">Contraseña</label>
                @if (mode() === 'login') { <a href="#" class="text-xs text-muted-foreground hover:text-foreground hover:underline" (click)="$event.preventDefault(); forgot.emit()">¿Olvidaste?</a> }
              </div>
              <input signngInput id="lf-pass" name="password" type="password" [attr.autocomplete]="mode() === 'signup' ? 'new-password' : 'current-password'" required spellcheck="false" placeholder="••••••••" [value]="password()" (input)="password.set($any($event.target).value)" />
            </div>
          }
          @if (mode() === 'login') {
            <label class="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" [checked]="remember()" (change)="remember.set($any($event.target).checked)" class="size-4 accent-[var(--color-primary)]" />
              Recordarme
            </label>
          }
          <button signngButton type="submit" class="w-full">{{ cta() }}</button>
        </form>

        @if (social() && mode() !== 'forgot') {
          <div class="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span class="h-px flex-1 bg-border"></span> o continúa con <span class="h-px flex-1 bg-border"></span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button signngButton variant="outline" type="button" (click)="oauth.emit('google')">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
              Google
            </button>
            <button signngButton variant="outline" type="button" (click)="oauth.emit('github')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 1A11 11 0 0 0 8.52 22.44c.55.1.75-.24.75-.53v-1.86c-3.06.67-3.7-1.47-3.7-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.47-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.4 10.4 0 0 1 5.5 0C17.46 5.6 18.38 5.9 18.38 5.9c.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.39.34.74 1.01.74 2.04v3.03c0 .29.2.64.76.53A11 11 0 0 0 12 1Z"/></svg>
              GitHub
            </button>
          </div>
        }

        <p class="mt-4 text-center text-sm text-muted-foreground">
          @switch (mode()) {
            @case ('login') { ¿No tienes cuenta? <a href="#" class="text-foreground hover:underline" (click)="$event.preventDefault(); switchMode.emit('signup')">Regístrate</a> }
            @case ('signup') { ¿Ya tienes cuenta? <a href="#" class="text-foreground hover:underline" (click)="$event.preventDefault(); switchMode.emit('login')">Inicia sesión</a> }
            @case ('forgot') { <a href="#" class="text-foreground hover:underline" (click)="$event.preventDefault(); switchMode.emit('login')">← Volver al inicio</a> }
          }
        </p>
      </div>
    </div>
  `,
})
export class LoginForm {
  readonly mode = input<'login' | 'signup' | 'forgot'>('login');
  readonly title = input('');
  readonly description = input('');
  readonly social = input(true);
  readonly submitted = output<AuthSubmit>();
  readonly oauth = output<'google' | 'github'>();
  readonly forgot = output<void>();
  readonly switchMode = output<'login' | 'signup' | 'forgot'>();

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly remember = signal(false);

  protected readonly defaultTitle = computed(() =>
    this.mode() === 'signup' ? 'Crear cuenta' : this.mode() === 'forgot' ? 'Recuperar contraseña' : 'Iniciar sesión',
  );
  protected readonly defaultDesc = computed(() =>
    this.mode() === 'signup'
      ? 'Ingresa tus datos para empezar.'
      : this.mode() === 'forgot'
        ? 'Te enviaremos un enlace de recuperación.'
        : 'Bienvenido de vuelta.',
  );
  protected readonly cta = computed(() =>
    this.mode() === 'signup' ? 'Crear cuenta' : this.mode() === 'forgot' ? 'Enviar enlace' : 'Entrar',
  );

  protected onSubmit(e: Event): void {
    e.preventDefault();
    this.submitted.emit({
      mode: this.mode(),
      name: this.name() || undefined,
      email: this.email(),
      password: this.mode() === 'forgot' ? undefined : this.password(),
      remember: this.mode() === 'login' ? this.remember() : undefined,
    });
  }
}
