import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../images/icon/icon.component';
import { LeagueScheduleWidgetComponent } from '../league-widgets/league-schedule-widget/league-schedule-widget.component';

@Component({
  selector: 'pdz-league-schedule',
  imports: [RouterModule, IconComponent, LeagueScheduleWidgetComponent],
  templateUrl: './league-schedule.component.html',
  styleUrls: ['./league-schedule.component.scss'],
})
export class LeagueScheduleComponent {}
