import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';

@Component({
  selector: 'pdz-final-standings',
  imports: [PokemonComponent, RecordComponent, TeamComponent],
  templateUrl: './final-standings.component.html',
  styleUrl: './final-standings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalStandingsComponent {
  readonly placements = input.required<League.FinalPlacement[]>();
  readonly ownTeamSlug = input<string | null>(null);
  readonly teamLinkBase = input<string[] | null>(null);
  readonly completedAt = input<string | null>(null);

  protected readonly completedOn = computed(() => {
    const completedAt = this.completedAt();
    return completedAt
      ? new Date(completedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;
  });

  protected readonly showDraws = computed(() =>
    this.placements().some((place) => (place.draws ?? 0) > 0),
  );

  protected readonly rows = computed(() => {
    const linkBase = this.teamLinkBase();
    const ownTeamSlug = this.ownTeamSlug();
    return [...this.placements()]
      .sort((a, b) => a.placement - b.placement)
      .map((place) => ({
        ...place,
        logoSrc: getTeamLogoSrc(place.logo),
        link: linkBase ? [...linkBase, place.teamSlug] : null,
        you: !!ownTeamSlug && place.teamSlug === ownTeamSlug,
      }));
  });
}
