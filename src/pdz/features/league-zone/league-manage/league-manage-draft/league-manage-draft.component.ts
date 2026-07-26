import { Component, inject, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '@pdz/core/services/data.service';
import { DraftPokemon } from '../../../drafts/draft.model';
import { PokemonSearchComponent } from '../../../drafts/draft-overview/draft-form/components/pokemon-search/pokemon-search.component';
import { LeagueNotificationService } from '../../league-notification.service';
import { LeagueManageService } from '../league-manage.service';
import { LeagueZoneService } from '../../league-zone.service';
import { WebSocketService } from '@pdz/core/services/ws.service';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueNotificationsComponent } from '../../league-notifications/league-notifications.component';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-league-manage-draft',
  imports: [
    PokemonSearchComponent,
    SpriteComponent,
    IconComponent,
    LeagueNotificationsComponent,
  ],
  templateUrl: './league-manage-draft.component.html',
  styleUrl: './league-manage-draft.component.scss',
})
export class LeagueManageDraftComponent implements OnInit {
  leagueManageService = inject(LeagueManageService);
  leagueZoneService = inject(LeagueZoneService);
  webSocketService = inject(WebSocketService);
  private notificationService = inject(LeagueNotificationService);
  private dataService = inject(DataService);

  teams: League.LeagueTeam[] = [];
  status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' = 'IN_PROGRESS';
  pokemonList$ = new BehaviorSubject<DraftPokemon[]>([]);

  ngOnInit(): void {
    this.dataService
      .getPokemonList('Gen9 NatDex')
      .subscribe((list) => this.pokemonList$.next(list));

    this.leagueZoneService.getDraftDetails().subscribe((data) => {
      this.teams = data.teams;
    });

    this.webSocketService
      .on<{
        draftId: string;
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

  takenIds(team: League.LeagueTeam): string[] {
    return team.draft.map((pokemon) => pokemon.id);
  }

  setState(state: string): void {
    this.leagueManageService.setDraftState(state).subscribe();
  }

  addDraftPick(team: League.LeagueTeam, pokemon: DraftPokemon): void {
    this.leagueManageService
      .setPick(this.leagueZoneService.tournamentKey()!, {
        teamId: team.id,
        pokemonId: pokemon.id,
      })
      .subscribe();
  }

  skipNext() {
    this.leagueManageService.skipCurrentPick().subscribe();
  }
}
