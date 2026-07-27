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
  noTimer = false;
  pokemonList$ = new BehaviorSubject<DraftPokemon[]>([]);

  ngOnInit(): void {
    this.dataService
      .getPokemonList('Gen9 NatDex')
      .subscribe((list) => this.pokemonList$.next(list));

    this.leagueZoneService.getDraftDetails().subscribe((data) => {
      this.teams = data.teams;
      this.status = data.status;
      this.noTimer = data.noTimer;
    });

    this.webSocketService
      .on<{
        draftId: string;
        pick: { pokemon: League.LeaguePokemon };
        team: { id: string; name: string; draft: League.LeaguePokemon[] };
      }>('league.draft.added')
      .subscribe((data) => {
        if (this.leagueZoneService.draftKey() !== data.draftId) return;

        const team = this.teams.find((team) => team.id === data.team.id);
        if (team) team.draft = data.team.draft;
        this.notificationService.show(
          `${data.team.name} drafted ${data.pick.pokemon.name}!`,
          'success',
        );
      });

    this.webSocketService
      .on<{
        draftId: string;
        status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
        noTimer?: boolean;
      }>('league.draft.status')
      .subscribe((data) => {
        if (this.leagueZoneService.draftKey() !== data.draftId) return;

        this.status = data.status;
        if (data.noTimer !== undefined) this.noTimer = data.noTimer;
        this.notificationService.show(`Draft Status: ${data.status}`, 'info');
      });
  }

  takenIds(team: League.LeagueTeam): string[] {
    return team.draft.map((pokemon) => pokemon.id);
  }

  setState(state: string): void {
    this.leagueManageService.setDraftState(state).subscribe();
  }

  toggleNoTimer(): void {
    const noTimer = !this.noTimer;
    this.leagueManageService
      .setNoTimer(noTimer)
      .subscribe(() => (this.noTimer = noTimer));
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
