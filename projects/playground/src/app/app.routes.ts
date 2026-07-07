import { Routes } from '@angular/router';
import { Showcase } from './showcase';
import { Blocks } from './blocks';
import { Dashboard } from './dashboard';
import { IconsPage } from './icons';
import { ColorsPage } from './colors';

// 'demo' (Fase 0 scratch page) intentionally not routed — superseded by Showcase,
// file kept on disk for reference, not reachable from the site.
export const routes: Routes = [
  { path: '', component: Showcase, title: 'signng — Angular components you own' },
  { path: 'blocks', component: Blocks, title: 'signng — blocks' },
  { path: 'dashboard', component: Dashboard, title: 'signng — dashboard' },
  { path: 'icons', component: IconsPage, title: 'signng — icons' },
  { path: 'colors', component: ColorsPage, title: 'signng — colors' },
];
