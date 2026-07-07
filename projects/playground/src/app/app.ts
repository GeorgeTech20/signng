import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeCustomizer } from './theme-customizer';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ThemeCustomizer],
  templateUrl: './app.html',
})
export class App {}
