import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ordinal } from '@pdz/features/dashboard/dashboard.model';
import { DashboardSectionComponent } from '@pdz/features/dashboard/section/dashboard-section.component';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { AchievementBadgeComponent } from '@pdz/shared/data/achievement/achievement-badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { Profile, ProfileSeason, seasonLink } from '../profile.model';

type SeasonRow = ProfileSeason & {
  link: unknown[];
  logoSrc: string | undefined;
  league: string;
};

type YearGroup = { year: string; heading: string; seasons: SeasonRow[] };

function yearOf(season: ProfileSeason): string {
  return season.completedAt
    ? `${new Date(season.completedAt).getFullYear()}`
    : 'Earlier';
}

function headingFor(year: string, seasons: ProfileSeason[]): string {
  const titles = seasons.filter((season) => season.outcome?.champion).length;
  const wins = seasons.reduce((sum, season) => sum + (season.record?.wins ?? 0), 0);
  const losses = seasons.reduce(
    (sum, season) => sum + (season.record?.losses ?? 0),
    0,
  );
  return [
    year,
    `${seasons.length} ${seasons.length === 1 ? 'season' : 'seasons'}`,
    ...(titles ? [`${titles} ${titles === 1 ? 'title' : 'titles'}`] : []),
    `${wins}–${losses}`,
  ].join(' · ');
}

@Component({
  selector: 'pdz-profile-body',
  imports: [
    RouterLink,
    AchievementBadgeComponent,
    CardComponent,
    ChipComponent,
    DashboardSectionComponent,
    DisclosureComponent,
    EmptyStateComponent,
    IconComponent,
    RecordComponent,
    TeamComponent,
  ],
  templateUrl: './profile-body.component.html',
  styleUrl: './profile-body.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileBodyComponent {
  readonly profile = input.required<Profile>();
  readonly isYou = input(true);

  protected readonly ordinal = ordinal;

  protected readonly years = computed<YearGroup[]>(() => {
    const groups = new Map<string, SeasonRow[]>();
    for (const season of this.profile().completed) {
      const year = yearOf(season);
      const row: SeasonRow = {
        ...season,
        link: seasonLink(season),
        logoSrc: getTeamLogoSrc(season.logo),
        league: season.tournamentName
          ? `${season.leagueName} · ${season.tournamentName}`
          : season.leagueName,
      };
      groups.set(year, [...(groups.get(year) ?? []), row]);
    }
    return [...groups].map(([year, seasons]) => ({
      year,
      heading: headingFor(year, seasons),
      seasons,
    }));
  });
}
