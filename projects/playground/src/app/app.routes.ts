import { Routes } from '@angular/router';
import { Showcase } from './showcase';
import { Demo } from './demo';
import { Blocks } from './blocks';
import { Dashboard } from './dashboard';

export const routes: Routes = [
  { path: '', component: Showcase, title: 'signng — componentes Angular que posees' },
  { path: 'demo', component: Demo, title: 'signng — demo (Fase 0)' },
  { path: 'blocks', component: Blocks, title: 'signng — blocks' },
  { path: 'dashboard', component: Dashboard, title: 'signng — dashboard' },
];
