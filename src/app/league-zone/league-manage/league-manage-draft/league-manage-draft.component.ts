import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { DraftPokemon } from '../../../interfaces/draft';
import { LeagueNotificationService } from '../../../services/league-notification.service';
import { LeagueManageService } from '../../../services/leagues/league-manage.service';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { PokemonSelectComponent } from '../../../util/pokemon-select/pokemon-select.component';
import { LeagueNotificationsComponent } from '../../league-notifications/league-notifications.component';
import { WebSocketService } from '../../../services/ws.service';
import { League } from '../../league.interface';

type TeamForDraft = League.LeagueTeam & {
  selectedPokemon?: DraftPokemon | null;
};

@Component({
  selector: 'pdz-league-manage-draft',
  imports: [
    PokemonSelectComponent,
    FormsModule,
    SpriteComponent,
    MatButtonModule,
    MatIconModule,
    LeagueNotificationsComponent,
  ],
  templateUrl: './league-manage-draft.component.html',
  styleUrl: './league-manage-draft.component.scss',
  standalone: true,
})
export class LeagueManageDraftComponent implements OnInit {
  leagueManageService = inject(LeagueManageService);
  leagueZoneService = inject(LeagueZoneService);
  webSocketService = inject(WebSocketService);
  private notificationService = inject(LeagueNotificationService);
  private tournamentId: string | null = null;
  teams: TeamForDraft[] = [];
  status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' = 'IN_PROGRESS';

  ngOnInit(): void {
    this.leagueZoneService.getDivisionDetails().subscribe((data) => {
      console.log(data);
      this.teams = data.teams;
    });

    this.webSocketService
      .on<{
        divisionKey: string;
        team: { id: string; name: string };
        pokemon: League.LeaguePokemon;
        canDraftTeams: string[];
      }>('league.draft.added')
      .subscribe((data) => {
        const team = this.teams.find((team) => team.id === data.team.id);
        team?.draft.push(data.pokemon);
        this.notificationService.show(
          `${data.team.name} drafted ${data.pokemon.name}!`,
          'success',
        );
      });

    this.webSocketService
      .on<{
        status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
      }>('league.draft.status')
      .subscribe((data) => {
        this.status = data.status;
        this.notificationService.show(`Draft Status: ${data.status}`, 'info');
      });
  }

  setState(state: string): void {
    this.leagueManageService.setDivisionState(state).subscribe((response) => {
      console.log(response);
    });
  }

  addDraftPick(team: TeamForDraft) {
    if (!team.selectedPokemon) {
      return;
    }

    this.leagueManageService
      .setPick(this.leagueZoneService.tournamentKey()!, {
        teamId: team.id,
        pokemonId: team.selectedPokemon.id,
        pickNumber: team.draft.length,
        divisionId: this.leagueZoneService.divisionKey()!,
      })
      .subscribe((response) => {
        team.selectedPokemon = null;
        console.log(response);
      });
  }

  deleteDraftPick(team: TeamForDraft) {}
  editDraftPick(team: TeamForDraft) {}

  testNotification(): void {
    this.notificationService.show('This is a test notification!', 'info');
  }

  skipNext() {
    this.leagueManageService.skipCurrentPick().subscribe((response) => {
      console.log(response);
    });
  }
}
