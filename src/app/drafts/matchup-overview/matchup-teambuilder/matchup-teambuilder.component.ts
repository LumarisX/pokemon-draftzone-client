
import { Component, Input } from '@angular/core';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { MatchupData } from '../matchup-interface';
import { TeambuilderWidgetComponent } from '../widgets/teambuilder/teambuilder.component';

@Component({
  selector: 'pdz-matchup-teambuilder',
  templateUrl: './matchup-teambuilder.component.html',
  styleUrl: './matchup-teambuilder.component.scss',
  imports: [LoadingComponent, TeambuilderWidgetComponent],
})
export class MatchupTeambuilderComponent {
  @Input({ required: true })
  matchupId!: string;
  @Input({ required: true })
  matchupData!: MatchupData;
}
