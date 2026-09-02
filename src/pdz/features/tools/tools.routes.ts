import { Routes } from '@angular/router';
import { PokemonSearchComponent } from './pokemon-search/pokemon-search.component';
import { QuickMatchupBaseComponent } from './quick-matchup/quick-matchup-base.component';
import { RandomDraftComponent } from './random-draft/random-draft.component';
import { ReplayComponent } from './replay_analyzer/replay.component';
import { TimeConverterPageComponent } from './time_converter/time_converter.component';
import { ToolsComponent } from './tools.component';
import { WheelComponent } from './wheel/wheel.component';

export const routes: Routes = [
  {
    path: '',
    component: ToolsComponent,
  },
  {
    path: 'replay-analyzer',
    component: ReplayComponent,
    data: { version: 'v1' },
  },
  {
    path: 'replay-analyzer-v2',
    component: ReplayComponent,
    data: { version: 'v2' },
  },
  {
    path: 'time-converter',
    component: TimeConverterPageComponent,
  },
  {
    path: 'pokemon-search',
    component: PokemonSearchComponent,
  },
  // {
  //   path: 'set-analyzer',
  //   component: SetAnalyzerComponent,
  // },
  {
    path: 'quick-matchup',
    component: QuickMatchupBaseComponent,
  },
  {
    path: 'random-draft',
    component: RandomDraftComponent,
  },
  {
    path: 'quick-draft',
    loadChildren: () =>
      import('./quick-draft/quick-draft.routes').then((m) => m.routes),
  },
  {
    path: 'wheel',
    component: WheelComponent,
  },
];
