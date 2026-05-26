import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PokemonSearchComponent } from './pokemon-search/pokemon-search.component';
import { QuickMatchupBaseComponent } from './quick-matchup/quick-matchup-base.component';
import { RandomDraftComponent } from './random-draft/random-draft.component';
import { ReplayComponent as ReplayNewComponent } from './replay_analyzer-new/replay.component';
import { ReplayComponent } from './replay_analyzer/replay.component';
import { TimeConverterComponent } from './time_converter/time_converter.component';
import { ToolsComponent } from './tools.component';

export const ToolsPath = 'tools';

const routes: Routes = [
  {
    path: '',
    component: ToolsComponent,
  },
  {
    path: 'replay-analyzer',
    component: ReplayComponent,
  },
  {
    path: 'replay-analyzer-v2',
    component: ReplayNewComponent,
  },
  {
    path: 'time-converter',
    component: TimeConverterComponent,
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
      import('./quick-draft/quick-draft.module').then(
        (m) => m.QuickDraftModule,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ToolsRoutingModule {}
