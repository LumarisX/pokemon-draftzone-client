import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinderToolComponent } from './finder/finder-tool.component';
import { QuickMatchupBaseComponent } from './quick-matchup/quick-matchup-base.component';
import { RandomDraftComponent } from './random-draft/random-draft.component';
import { ReplayComponent } from './replay_analyzer/replay.component';
import { TeamBuilderComponent } from './teambuilder/teambuilder.component';
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
    path: 'time-converter',
    component: TimeConverterComponent,
  },
  {
    path: 'pokemon-search',
    component: FinderToolComponent,
  },
  // {
  //   path: 'set-analyzer',
  //   component: SetAnalyzerComponent,
  // },
  {
    path: 'teambuilder',
    component: TeamBuilderComponent,
  },
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
