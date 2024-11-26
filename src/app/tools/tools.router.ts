import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinderToolComponent } from './finder/finder-tool.component';
import { ReplayComponent } from './replay_analyzer/replay.component';
import { TeamBuilderComponent } from './teambuilder/teambuilder.component';
import { TimeConverterComponent } from './time_converter/time_converter.component';
import { ToolsComponent } from './tools.component';
import { QuickMatchupFormComponent } from './quick-matchup/quick-matchup-form.component';
const routes: Routes = [
  {
    path: 'tools',
    component: ToolsComponent,
  },
  {
    path: 'tools/replay-analyzer',
    component: ReplayComponent,
  },
  {
    path: 'tools/time-converter',
    component: TimeConverterComponent,
  },
  {
    path: 'tools/pokemon-search',
    component: FinderToolComponent,
  },
  {
    path: 'tools/teambuilder',
    component: TeamBuilderComponent,
  },
  {
    path: 'tools/quick-matchup',
    component: QuickMatchupFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ToolsRoutingModule {}
