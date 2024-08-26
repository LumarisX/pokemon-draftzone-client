import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReplayComponent } from './replay_analyzer/replay.component';
import { ToolsComponent } from './tools.component';
import { TimeConverterComponent } from './time_converter/time_converter.component';
import { FinderComponent } from './finder/finder.component';
import { TeamBuilderComponent } from './teambuilder/teambuilder.component';
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
    path: 'tools/finder',
    component: FinderComponent,
  },
  {
    path: 'tools/teambuilder',
    component: TeamBuilderComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ToolsRoutingModule {}
