import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SIGNNG_TABS } from '@signng/core/tabs';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Slider, ...SIGNNG_TABS],
  templateUrl: './app.html',
})
export class App {
  protected readonly volume = signal(40);
  protected readonly selectedTab = signal<string>('overview');
}
