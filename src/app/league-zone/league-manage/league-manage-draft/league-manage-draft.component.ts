import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeagueManageService } from '../../../services/leagues/league-manage.service';
import { first } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  DraftTeam,
  LeagueZoneService,
} from '../../../services/leagues/league-zone.service';
import { PokemonSelectComponent } from '../../../util/pokemon-select/pokemon-select.component';
import { FormsModule } from '@angular/forms';
import { Pokemon } from '../../../interfaces/draft';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LeagueNotificationsComponent } from '../../league-notifications/league-notifications.component';
import { LeagueNotificationService } from '../../../services/league-notification.service';

type TeamForDraft = DraftTeam & { selectedPokemon?: Pokemon | null };

@Component({
  selector: 'pdz-league-manage-draft',
  imports: [
    CommonModule,
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
  private route = inject(ActivatedRoute);
  private notificationService = inject(LeagueNotificationService);
  private leagueId: string | null = null;
  teams: TeamForDraft[] = [];
  divisionId = '68c5a1c6f1ac9b585a542b86'; // TODO: The division id is hardcoded

  ngOnInit(): void {
    this.leagueZoneService.getPicks().subscribe((teams) => {
      console.log(teams);
      this.teams = teams;
    });
  }

  addDraftPick(team: TeamForDraft) {
    if (!team.selectedPokemon || !this.leagueId) {
      return;
    }

    this.leagueManageService
      .setPick(this.leagueId, {
        teamId: team.id,
        pokemonId: team.selectedPokemon.id,
        pickNumber: team.picks.length,
        divisionId: this.divisionId,
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
}
